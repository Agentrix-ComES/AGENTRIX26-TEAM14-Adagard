"""LangGraph wiring of the GovPath multi-agent pipeline. Owner: Person A.

Flow (per turn the whole graph is replayed; session state lives in SESSIONS):

  intake ─┬─ (fresh)  ─> intent -> classifier -> requirements(RAG) -> personalization ┐
          ├─ (resume) ───────────────────────────────────────────> personalization ──┤
          └─ (done)   ─> END                                                          │
                                                                                      │
  personalization ─ needs_input? ─ yes ─> END (park; ask clarifying question)         │
                                  └ no ──> gap_check -> form_assistant -> scheduler ───┘
                                           -> action_agent -> verifier -> END

Key design points:
  - ``intake`` ingests clarifying answers into user_context (makes the loop converge).
  - On *resume* turns we skip intent/classifier so the service/goal are never re-derived
    from a one-word answer like "20" (which would otherwise reclassify the service).
  - ``run_turn`` short-circuits once a plan is complete, so a session never queues
    duplicate verification packets.
"""
import uuid
from datetime import datetime, timezone

from langgraph.graph import StateGraph, END
from sqlmodel import Session, select

from app.graph.state import GraphState
from app.models.chat import ChatSession, ChatMessage
from app.models.verification import Verification
from app.graph.agents import (
    intake, intent, classifier, requirements, personalization,
    gap_check, form_assistant, scheduler, action_agent, verifier,
)
from app.graph.agents._llm import ask


def _route_after_intake(state: GraphState) -> str:
    if state.get("completed"):
        return "done"
    # `service` is only set after the first turn's classifier — use it to detect resume.
    return "resume" if state.get("service") else "fresh"


def _build():
    g = StateGraph(GraphState)
    for name, fn in [
        ("intake", intake.run), ("intent", intent.run), ("classifier", classifier.run),
        ("requirements", requirements.run), ("personalization", personalization.run),
        ("gap_check", gap_check.run), ("form_assistant", form_assistant.run),
        ("scheduler", scheduler.run), ("action_agent", action_agent.run),
        ("verifier", verifier.run),
    ]:
        g.add_node(name, fn)

    g.set_entry_point("intake")
    g.add_conditional_edges(
        "intake", _route_after_intake,
        {"fresh": "intent", "resume": "personalization", "done": END},
    )
    g.add_edge("intent", "classifier")
    g.add_edge("classifier", "requirements")
    g.add_edge("requirements", "personalization")
    # Personalization parks the turn at END while it needs a clarifying answer.
    g.add_conditional_edges(
        "personalization",
        lambda s: "wait" if s.get("needs_input") else "continue",
        {"wait": END, "continue": "gap_check"},
    )
    g.add_edge("gap_check", "form_assistant")
    g.add_edge("form_assistant", "scheduler")
    g.add_edge("scheduler", "action_agent")
    g.add_edge("action_agent", "verifier")
    g.add_edge("verifier", END)
    return g.compile()


GRAPH = _build()

_LANG_NAMES = {
    "tanglish": "Tamil written using the English/Latin alphabet (Tanglish)",
    "singlish": "Sinhala written using the English/Latin alphabet (Singlish)",
}


def _localize(text: str, lang: str) -> str:
    """Best-effort translation of the assistant reply; English passes through unchanged."""
    if not text or lang not in _LANG_NAMES:
        return text
    out = ask(
        f"Translate the following into {_LANG_NAMES[lang]}. Keep official terms (office "
        f"names, form codes like B63) recognisable. Reply with only the translation.\n\n{text}"
    )
    return out or text


def _response(state: GraphState) -> dict:
    return {
        "session_id": state["session_id"],
        "reply": state.get("reply", ""),
        "needs_input": state.get("needs_input", False),
        "service": state.get("service"),
        "plan": state.get("plan"),
    }


def _save_session(db, cs, session_id: str, user_id: int, state: GraphState):
    """Upsert the ChatSession row with the latest GraphState."""
    if cs is None:
        cs = ChatSession(session_id=session_id, user_id=user_id)
        db.add(cs)
    cs.state = dict(state)                       # reassign so SQLAlchemy tracks the change
    cs.lang = state.get("lang", "en")
    cs.service = state.get("service")
    cs.office = state.get("office")
    cs.completed = bool(state.get("completed"))
    cs.updated_at = datetime.now(timezone.utc)
    return cs


def run_turn(session_id: str, message: str, lang: str, user_id: int, db: Session) -> dict:
    """Drive one turn, persisting state + messages (+ a verification packet on completion)
    to Postgres, tied to the authenticated citizen."""
    lang = lang or "en"
    cs = db.exec(select(ChatSession).where(ChatSession.session_id == session_id)).first()
    if cs and cs.user_id != user_id:            # session belongs to someone else — start fresh
        cs = None
    state: GraphState = dict(cs.state) if cs else {
        "session_id": session_id, "history": [], "user_context": {},
    }
    state["session_id"] = session_id
    state["message"] = message
    state["lang"] = lang
    state["needs_input"] = False

    db.add(ChatMessage(session_id=session_id, user_id=user_id, role="user", content=message))

    # Plan already finished — acknowledge without rebuilding (no duplicate packets).
    if state.get("completed"):
        state.setdefault("history", []).append({"role": "user", "content": message})
        reply = _localize(
            "Your plan is ready and pending officer verification. "
            "Start a new session to plan another service.", lang,
        )
        state["reply"] = reply
        _save_session(db, cs, session_id, user_id, state)
        db.add(ChatMessage(session_id=session_id, user_id=user_id, role="assistant",
                           content=reply, plan=state.get("plan")))
        db.commit()
        return _response(state)

    state = GRAPH.invoke(state)
    reply = _localize(state.get("reply", ""), lang)
    state["reply"] = reply
    _save_session(db, cs, session_id, user_id, state)
    db.add(ChatMessage(session_id=session_id, user_id=user_id, role="assistant",
                       content=reply, plan=state.get("plan")))

    # On completion, queue a durable verification packet (was verifier.py's in-memory write).
    if state.get("completed") and state.get("plan"):
        exists = db.exec(select(Verification).where(Verification.session_id == session_id)).first()
        if not exists:
            plan = state["plan"]
            db.add(Verification(
                vid=str(uuid.uuid4()), session_id=session_id, user_id=user_id,
                service=state.get("service"), office=plan.get("office"), plan=plan,
            ))

    db.commit()
    return _response(state)

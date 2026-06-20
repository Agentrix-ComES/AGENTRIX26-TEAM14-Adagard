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
from langgraph.graph import StateGraph, END

from app.graph.state import GraphState
from app.graph.agents import (
    intake, intent, classifier, requirements, personalization,
    gap_check, form_assistant, scheduler, action_agent, verifier,
)
from app.graph.agents._llm import ask
from app.models.store import SESSIONS


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


def run_turn(session_id: str, message: str, lang: str) -> dict:
    state: GraphState = SESSIONS.get(session_id) or {
        "session_id": session_id, "history": [], "user_context": {},
    }
    state["session_id"] = session_id
    state["message"] = message
    state["lang"] = lang or "en"
    state["needs_input"] = False

    # Plan already finished — acknowledge without rebuilding (no duplicate packets).
    if state.get("completed"):
        state.setdefault("history", []).append({"role": "user", "content": message})
        state["reply"] = _localize(
            "Your plan is ready and pending officer verification. "
            "Start a new session to plan another service.", state["lang"],
        )
        SESSIONS[session_id] = state
        return _response(state)

    state = GRAPH.invoke(state)
    state["reply"] = _localize(state.get("reply", ""), state["lang"])
    SESSIONS[session_id] = state
    return _response(state)

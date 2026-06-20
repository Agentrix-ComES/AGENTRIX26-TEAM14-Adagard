"""LangGraph wiring of the GovPath multi-agent pipeline. Owner: Person A.

Flow:
  intent -> classifier -> requirements(RAG) -> personalization
        -> (loops back to personalization while needs_input)
        -> gap_check -> [form_assistant, scheduler, action_agent] -> verifier
"""
from langgraph.graph import StateGraph, END
from app.graph.state import GraphState
from app.graph.agents import (
    intent, classifier, requirements, personalization,
    gap_check, form_assistant, scheduler, action_agent, verifier,
)
from app.models.store import SESSIONS


def _build():
    g = StateGraph(GraphState)
    for name, fn in [
        ("intent", intent.run), ("classifier", classifier.run),
        ("requirements", requirements.run), ("personalization", personalization.run),
        ("gap_check", gap_check.run), ("form_assistant", form_assistant.run),
        ("scheduler", scheduler.run), ("action_agent", action_agent.run),
        ("verifier", verifier.run),
    ]:
        g.add_node(name, fn)

    g.set_entry_point("intent")
    g.add_edge("intent", "classifier")
    g.add_edge("classifier", "requirements")
    g.add_edge("requirements", "personalization")
    # Personalization pauses for clarifying questions (record age, dual citizen, etc.)
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


def run_turn(session_id: str, message: str, lang: str) -> dict:
    state: GraphState = SESSIONS.get(session_id, {"session_id": session_id, "history": [], "user_context": {}})
    state["message"] = message
    state["lang"] = lang
    state["needs_input"] = False
    state = GRAPH.invoke(state)
    SESSIONS[session_id] = state
    return {
        "session_id": session_id,
        "reply": state.get("reply", ""),
        "needs_input": state.get("needs_input", False),
        "service": state.get("service"),
        "plan": state.get("plan"),
    }

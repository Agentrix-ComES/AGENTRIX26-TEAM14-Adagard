"""Intent Agent — normalises the goal from natural language. Owner: Person A.

Handles English, Tanglish (romanised Tamil) and Singlish (romanised Sinhala) by asking
the LLM to restate the citizen's goal as one English line. Falls back to the raw message
when the LLM is unavailable so downstream keyword matching still works.

Only runs on the first turn of a session (the graph routes resume turns straight to
personalization), so the goal is captured once and preserved.
"""
from app.graph.state import GraphState
from app.graph.agents._llm import ask


def run(state: GraphState) -> GraphState:
    msg = state.get("message", "")
    summary = ask(
        "You are a Sri Lankan government-services assistant. The citizen may write in "
        "English, Tanglish (Tamil in English letters) or Singlish (Sinhala in English "
        "letters). Restate their goal in one short English sentence. "
        f"Message: {msg!r}"
    )
    state["intent"] = summary or msg
    return state

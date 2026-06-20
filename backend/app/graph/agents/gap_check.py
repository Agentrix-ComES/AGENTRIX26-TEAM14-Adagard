"""Gap-Check Agent — compares user docs vs requirements. Owner: Person A."""
from app.graph.state import GraphState

def run(state: GraphState) -> GraphState:
    have = set(state.get("user_context", {}).get("documents", []))
    required = state.get("requirements", [])
    # TODO: use LLM to match free-text requirements against documents the user has.
    state["gaps"] = [r for r in required if r not in have]
    return state

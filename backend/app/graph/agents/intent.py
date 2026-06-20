"""Intent Agent — parses goal from natural language (en/tanglish/singlish). Owner: Person A."""
from app.graph.state import GraphState
from app.graph.agents._llm import ask

def run(state: GraphState) -> GraphState:
    msg = state["message"]
    # TODO: prompt LLM to normalise tanglish/singlish -> intent summary
    state["intent"] = ask(f"Summarise the citizen's goal in one line. Message: {msg}")
    state.setdefault("history", []).append({"role": "user", "content": msg})
    return state

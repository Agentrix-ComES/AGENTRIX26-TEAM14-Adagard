"""Service Classifier — routes intent to one supported service. Owner: Person A."""
from app.graph.state import GraphState
from app.graph.agents._llm import ask

SERVICES = ["nic", "passport", "gn_cert", "license", "birth_cert", "death_cert"]

def run(state: GraphState) -> GraphState:
    prompt = (f"Classify into exactly one of {SERVICES}. "
              f"Reply with only the key. Goal: {state.get('intent','')}")
    label = ask(prompt).lower().strip()
    state["service"] = next((s for s in SERVICES if s in label), "nic")
    return state

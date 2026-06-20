"""Service Classifier — routes the goal to one supported service. Owner: Person A.

Two-stage and resilient:
  1. keyword fast-path over the message + intent (cheap, offline, handles common phrasing),
  2. LLM fallback only when keywords are ambiguous.
Defaults to NIC if everything fails so the pipeline always has a service to plan for.
"""
from app.graph.state import GraphState
from app.graph.agents._llm import ask
from app.graph.knowledge import SERVICES, KEYWORDS


def _keyword_match(text: str) -> str | None:
    text = text.lower()
    # Iterate in SERVICES order so more specific services win deterministically.
    for svc in SERVICES:
        if any(kw in text for kw in KEYWORDS[svc]):
            return svc
    return None


def run(state: GraphState) -> GraphState:
    blob = f"{state.get('intent', '')} {state.get('message', '')}"

    svc = _keyword_match(blob)
    if svc is None:
        label = ask(
            f"Classify the citizen's goal into exactly one of these keys: {SERVICES}. "
            f"Reply with only the key. Goal: {state.get('intent', '') or state.get('message', '')}"
        ).lower()
        svc = next((s for s in SERVICES if s in label), None)

    state["service"] = svc or "nic"
    return state

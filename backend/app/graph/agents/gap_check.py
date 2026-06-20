"""Gap-Check Agent — what the citizen still has to obtain. Owner: Person A.

Compares the clean checklist against documents the citizen says they already hold
(``user_context['documents']``, free text). Uses simple token overlap — good enough for
the demo and fully offline. When the citizen has not listed anything, every checklist
item is a gap (i.e. "here is everything you need").
"""
from app.graph.state import GraphState


def _has(item: str, owned: list[str]) -> bool:
    words = {w for w in item.lower().replace("(", " ").replace(")", " ").split() if len(w) > 3}
    for doc in owned:
        d = doc.lower()
        # Consider it owned if a distinctive keyword of the requirement appears.
        if any(w in d for w in words):
            return True
    return False


def run(state: GraphState) -> GraphState:
    checklist = state.get("checklist", [])
    owned_raw = state.get("user_context", {}).get("documents", [])
    owned = owned_raw if isinstance(owned_raw, list) else [str(owned_raw)]

    state["gaps"] = [item for item in checklist if not _has(item, owned)]
    return state

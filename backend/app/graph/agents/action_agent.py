"""Action Agent — Creator + Evaluator loop for affidavits/docs. Owner: Person A."""
from app.graph.state import GraphState
from app.graph.agents._llm import ask

MAX_LOOPS = 2

def run(state: GraphState) -> GraphState:
    if not state.get("gaps"):
        return state
    req = "; ".join(state.get("requirements", []))
    draft = ask(f"Draft the required affidavit/letter for {state.get('service')}. Constraints: {req}")
    for _ in range(MAX_LOOPS):
        verdict = ask(f"Does this draft satisfy ALL constraints [{req}]? Reply PASS or list fixes.\n\n{draft}")
        if verdict.upper().startswith("PASS"):
            break
        draft = ask(f"Revise the draft to fix: {verdict}\n\nDraft:\n{draft}")
    state.setdefault("draft_docs", []).append({"type": "affidavit", "content": draft})
    return state

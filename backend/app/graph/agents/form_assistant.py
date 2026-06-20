"""Form/Letter Assistant — pre-fills forms (e.g. B63). Owner: Person A."""
from app.graph.state import GraphState

FORMS = {"birth_cert": "B63", "death_cert": "B63", "passport": "K35A", "gn_cert": "DS-4"}

def run(state: GraphState) -> GraphState:
    svc = state.get("service")
    if svc in FORMS:
        # TODO: fill a PDF/template with user_context, write to /files, return URL.
        state.setdefault("forms", []).append({"name": FORMS[svc], "url": f"/files/{FORMS[svc]}_draft.pdf"})
    return state

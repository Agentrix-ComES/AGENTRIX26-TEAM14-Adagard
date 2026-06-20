"""Verifier Agent — assembles the plan packet, marks the session complete. Owner: Person A.

Builds the plan object exactly as specified in API_CONTRACT.md and sets `completed`. The
durable verification packet is written by `graph.run_turn` (which holds the DB session), so
this node stays a pure state transform.
"""
from app.graph.state import GraphState


def run(state: GraphState) -> GraphState:
    checklist = state.get("gaps") or state.get("checklist") or state.get("requirements", [])
    plan = {
        "office": state.get("office"),
        "officer": state.get("officer"),
        "checklist": checklist,
        "forms": state.get("forms", []),
        "draft_docs": state.get("draft_docs", []),
        "citations": state.get("citations", []),
    }

    state["plan"] = plan
    state["completed"] = True
    state["reply"] = (
        "Here is your Wasted Trip Prevention Plan — the right office, the documents to "
        "bring, a pre-filled form, and the source circulars. It has been submitted to an "
        "officer for verification."
    )
    return state

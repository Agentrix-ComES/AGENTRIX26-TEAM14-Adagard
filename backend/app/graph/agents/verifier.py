"""Verifier Agent — assembles packet, queues for HITL approval. Owner: Person A."""
import uuid
from app.graph.state import GraphState
from app.models.store import VERIFICATIONS

def run(state: GraphState) -> GraphState:
    plan = {
        "office": state.get("office"),
        "officer": state.get("officer"),
        "checklist": state.get("gaps", []) or state.get("requirements", []),
        "forms": state.get("forms", []),
        "draft_docs": state.get("draft_docs", []),
        "citations": state.get("citations", []),
    }
    vid = str(uuid.uuid4())
    VERIFICATIONS[vid] = {"id": vid, "session_id": state["session_id"],
                          "service": state.get("service"), "plan": plan,
                          "approved": False, "officer": None}
    state["plan"] = plan
    state["reply"] = "Here is your Wasted Trip Prevention Plan. Submitted to an officer for verification."
    return state

"""Verifier Agent — assembles the plan packet, queues it for HITL approval. Owner: Person A.

Builds the plan object exactly as specified in API_CONTRACT.md, pushes a packet into the
shared VERIFICATIONS store (so it appears in the admin portal queue), and marks the
session complete. Idempotent per session: it reuses an existing packet rather than
queuing duplicates if the verifier somehow runs again for the same session.
"""
import uuid

from app.graph.state import GraphState
from app.models.store import VERIFICATIONS


def _existing_packet_id(session_id: str) -> str | None:
    for vid, packet in VERIFICATIONS.items():
        if packet.get("session_id") == session_id:
            return vid
    return None


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

    session_id = state["session_id"]
    vid = _existing_packet_id(session_id) or str(uuid.uuid4())
    VERIFICATIONS[vid] = {
        "id": vid,
        "session_id": session_id,
        "service": state.get("service"),
        "plan": plan,
        "approved": VERIFICATIONS.get(vid, {}).get("approved", False),
        "officer": VERIFICATIONS.get(vid, {}).get("officer"),
    }

    state["plan"] = plan
    state["completed"] = True
    state["reply"] = (
        "Here is your Wasted Trip Prevention Plan — the right office, the documents to "
        "bring, a pre-filled form, and the source circulars. It has been submitted to an "
        "officer for verification."
    )
    return state

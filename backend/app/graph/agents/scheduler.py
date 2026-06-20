"""Appointment Scheduler — names the exact officer/desk. Owner: Person A."""
from app.graph.state import GraphState

OFFICER = {
    "birth_cert": "Additional District Registrar",
    "death_cert": "Additional District Registrar",
    "gn_cert": "Grama Niladhari",
    "nic": "DRP Officer",
    "passport": "Immigration Officer",
    "license": "Examiner (DMT)",
}

def run(state: GraphState) -> GraphState:
    state["officer"] = OFFICER.get(state.get("service"), "Counter Officer")
    state.setdefault("office", state.get("office", "Divisional Secretariat"))
    return state

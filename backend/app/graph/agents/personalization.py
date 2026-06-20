"""Personalization Agent — asks clarifying Qs; runs DS vs Kachcheri routing. Owner: Person A.

HERO LOGIC: birth/death certified copies route by record age.
"""
from app.graph.state import GraphState

def run(state: GraphState) -> GraphState:
    svc = state.get("service")
    ctx = state.get("user_context", {})

    if svc in ("birth_cert", "death_cert"):
        if "record_age_years" not in ctx:
            # Try to read the answer from the latest message, else ask.
            # TODO: extract number from state["message"] with a small LLM/regex call.
            state["needs_input"] = True
            state["reply"] = "How old is the record (in years)? Records older than ~20 years are archived at the District Secretariat (Kachcheri)."
            return state
        age = int(ctx["record_age_years"])
        state["record_age_years"] = age
        state["office"] = "District Secretariat (Kachcheri)" if age >= 20 else "Divisional Secretariat"

    if svc == "passport" and "dual_citizen" not in ctx:
        state["needs_input"] = True
        state["reply"] = "Are you applying as a dual citizen? (yes/no)"
        return state

    state["needs_input"] = False
    return state

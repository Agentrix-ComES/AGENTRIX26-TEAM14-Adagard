"""Personalization Agent — asks clarifying Qs; runs DS vs Kachcheri routing. Owner: Person A.

HERO LOGIC: for birth/death certified copies, the office depends on how old the record
is. Records older than ~20 years are archived at the District Secretariat (Kachcheri);
recent ones are issued at the Divisional Secretariat. Sending a citizen to the wrong one
is the classic "wasted trip" this app prevents.

Clarifying answers are parsed into ``user_context`` by the intake node, so by the time we
re-enter here the answer (if given) is already present. When we still need an answer we
set ``needs_input`` + ``awaiting`` and the graph parks the turn at END.
"""
from app.graph.state import GraphState
from app.graph import knowledge


def _ask(state: GraphState, key: str, question: str) -> GraphState:
    state["needs_input"] = True
    state["awaiting"] = key
    state["reply"] = question
    return state


def run(state: GraphState) -> GraphState:
    svc = state.get("service")
    ctx = state.get("user_context", {})

    # --- Birth/Death: route by record age (the demo hero) -----------------------------
    if svc in ("birth_cert", "death_cert"):
        if "record_age_years" not in ctx:
            return _ask(
                state, "record_age_years",
                "How old is the record, in years? Records older than "
                f"{knowledge.ARCHIVE_AGE_YEARS} years are archived at the District "
                "Secretariat (Kachcheri); newer ones are issued at the Divisional Secretariat.",
            )
        age = int(ctx["record_age_years"])
        state["record_age_years"] = age
        state["office"] = (
            knowledge.DISTRICT_SECRETARIAT if age >= knowledge.ARCHIVE_AGE_YEARS
            else knowledge.DIVISIONAL_SECRETARIAT
        )

    # --- Passport: dual citizenship changes the document set --------------------------
    if svc == "passport" and "dual_citizen" not in ctx:
        return _ask(state, "dual_citizen",
                    "Are you applying as a dual citizen? (yes / no)")

    state["needs_input"] = False
    state["awaiting"] = None
    return state

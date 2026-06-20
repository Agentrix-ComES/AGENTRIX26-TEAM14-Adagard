"""Action Agent — Creator + Evaluator loop for supporting documents. Owner: Person A.

For birth/death certified copies of *old, archived* records the citizen usually needs a
sworn affidavit explaining the late request. This agent drafts that affidavit, then runs
a short self-critique loop (Creator -> Evaluator -> revise) to tighten it against the
retrieved requirements. Entirely skipped when the LLM is unavailable or when no affidavit
is warranted, so the rest of the plan still completes.
"""
from app.graph.state import GraphState
from app.graph.agents._llm import ask, available
from app.graph import knowledge

MAX_LOOPS = 2


def _needs_affidavit(state: GraphState) -> bool:
    if state.get("service") not in ("birth_cert", "death_cert"):
        return False
    age = state.get("record_age_years")
    # Archived (old) records are the ones that need a supporting affidavit.
    return age is not None and age >= knowledge.ARCHIVE_AGE_YEARS


def run(state: GraphState) -> GraphState:
    if not available() or not _needs_affidavit(state):
        return state

    service = state.get("service")
    constraints = "; ".join(state.get("checklist", [])) or "standard supporting affidavit"
    draft = ask(
        f"Draft a concise affidavit (Sri Lankan format, first person, to be sworn before a "
        f"Justice of the Peace) supporting a request for a certified copy of an archived "
        f"{service.replace('_', ' ')}. Leave blanks like [NAME], [NIC], [DATE] for the "
        f"applicant to fill. Keep it under 200 words."
    )
    if not draft:
        return state

    for _ in range(MAX_LOOPS):
        verdict = ask(
            f"Review this affidavit against the requirements [{constraints}]. "
            f"Reply 'PASS' if adequate, otherwise list the fixes needed.\n\n{draft}"
        )
        if not verdict or verdict.upper().startswith("PASS"):
            break
        revised = ask(f"Revise the affidavit to address: {verdict}\n\nAffidavit:\n{draft}")
        if not revised:
            break
        draft = revised

    state.setdefault("draft_docs", []).append({"type": "affidavit", "content": draft})
    return state

"""Action sub-graph — Creator drafts the final document, Evaluator critiques it against
the requirements/gazette; conditional loop until PASS. Distinct LangGraph nodes. Owner: Person A.
"""
from typing import TypedDict

from langgraph.graph import StateGraph, END

from app.graph.agents._llm import ask

MAX_ITERS = 2


class ActionState(TypedDict, total=False):
    service: str
    requirements: str
    extracted: dict
    draft: str
    verdict: str
    iterations: int
    passed: bool


def creator(state: ActionState) -> ActionState:
    if not state.get("draft"):
        state["draft"] = ask(
            f"Draft the final {state['service'].replace('_', ' ')} document/affidavit for a Sri "
            f"Lankan citizen using these verified details: {state.get('extracted', {})}. "
            f"Constraints: {state.get('requirements', '')}. Leave [BLANKS] for missing data. "
            "Under 220 words."
        )
    else:
        revised = ask(
            f"Revise this draft to address the reviewer notes.\nNotes: {state.get('verdict', '')}"
            f"\n\nDraft:\n{state['draft']}"
        )
        state["draft"] = revised or state["draft"]
    state["iterations"] = state.get("iterations", 0) + 1
    return state


def evaluator(state: ActionState) -> ActionState:
    if not state.get("draft"):
        state["passed"] = True            # nothing drafted (LLM unavailable) — don't loop
        return state
    verdict = ask(
        f"Critique this {state['service'].replace('_', ' ')} draft against the requirements "
        f"[{state.get('requirements', '')}]. Reply 'PASS' if compliant, otherwise list concrete "
        f"fixes.\n\n{state['draft']}"
    )
    state["verdict"] = verdict
    state["passed"] = (not verdict) or verdict.strip().upper().startswith("PASS")
    return state


def _route(state: ActionState) -> str:
    if state.get("passed") or state.get("iterations", 0) >= MAX_ITERS:
        return "done"
    return "revise"


def _build():
    g = StateGraph(ActionState)
    g.add_node("creator", creator)
    g.add_node("evaluator", evaluator)
    g.set_entry_point("creator")
    g.add_edge("creator", "evaluator")
    g.add_conditional_edges("evaluator", _route, {"revise": "creator", "done": END})
    return g.compile()


ACTION_GRAPH = _build()


def run_action(service: str, requirements: str, extracted: dict) -> dict:
    out = ACTION_GRAPH.invoke({"service": service, "requirements": requirements, "extracted": extracted})
    return {
        "draft": out.get("draft", ""),
        "passed": bool(out.get("passed")),
        "iterations": out.get("iterations", 0),
    }

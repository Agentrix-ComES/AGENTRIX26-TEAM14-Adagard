"""Intake node — records the turn and ingests clarifying answers. Owner: Person A.

This is the entry node every turn. Because the graph is replayed in full on each HTTP
call (state is reloaded from SESSIONS, there is no LangGraph checkpointer), this node is
what makes the multi-turn clarifying-question loop actually converge:

  - it appends the user message to history, and
  - if the previous turn parked on a clarifying question (``state["awaiting"]`` is set),
    it parses the answer out of this message into ``user_context`` and clears the flag.

Without this step ``personalization`` would re-ask the same question forever.
"""
import re

from app.graph.state import GraphState
from app.graph.agents._llm import ask

_YES = {"yes", "y", "yeah", "yep", "ok", "true", "dual", "aam", "ow", "ho"}
_NO = {"no", "n", "nope", "false", "single", "illai", "naha", "nae"}


def _extract_int(msg: str) -> int | None:
    """Pull a year count out of free text ('about 20', 'twenty five years' -> LLM)."""
    m = re.search(r"\d+", msg.replace(",", ""))
    if m:
        return int(m.group())
    # Spelled-out numbers / fuzzy phrasing -> ask the LLM for just the integer.
    out = ask(f"Extract the number of years as a single integer from: '{msg}'. "
              f"Reply with only digits, or NONE if there is no number.")
    m = re.search(r"\d+", out)
    return int(m.group()) if m else None


def _extract_bool(msg: str) -> bool | None:
    tokens = set(re.findall(r"[a-z]+", msg.lower()))
    if tokens & _YES:
        return True
    if tokens & _NO:
        return False
    return None


def _coerce(key: str, msg: str):
    if key == "record_age_years":
        return _extract_int(msg)
    if key == "dual_citizen":
        return _extract_bool(msg)
    # Generic free-text answer (e.g. list of documents the citizen already has).
    return msg.strip() or None


def run(state: GraphState) -> GraphState:
    msg = state.get("message", "")
    state.setdefault("history", []).append({"role": "user", "content": msg})
    state.setdefault("user_context", {})

    awaiting = state.get("awaiting")
    if awaiting:
        value = _coerce(awaiting, msg)
        if value is not None:
            state["user_context"][awaiting] = value
            state["awaiting"] = None
        # If parsing failed we leave `awaiting` set; personalization re-asks politely.
    return state

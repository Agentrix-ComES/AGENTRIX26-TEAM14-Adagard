"""Appointment Scheduler — names the exact office and officer/desk. Owner: Person A.

Pulls the officer/office from the knowledge base. ``office`` may already be set by the
personalization agent (DS-vs-Kachcheri routing for birth/death) — that takes precedence.
"""
from app.graph.state import GraphState
from app.graph import knowledge


def run(state: GraphState) -> GraphState:
    info = knowledge.info(state.get("service"))
    state["officer"] = info["officer"]
    state["office"] = state.get("office") or info["office"]
    return state

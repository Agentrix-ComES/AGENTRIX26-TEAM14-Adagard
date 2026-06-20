"""Shared conversational state passed between agent nodes. Owner: Person A."""
from typing import TypedDict, Optional, List, Dict, Any

class GraphState(TypedDict, total=False):
    session_id: str
    lang: str
    message: str            # latest user message
    history: List[Dict[str, str]]
    intent: str
    service: str            # nic | passport | gn_cert | license | birth_cert | death_cert
    requirements: List[str] # retrieved from RAG
    user_context: Dict[str, Any]   # answers to clarifying questions
    record_age_years: Optional[int]
    office: str             # Divisional vs District Secretariat (Kachcheri)
    officer: str
    gaps: List[str]
    forms: List[Dict[str, str]]
    draft_docs: List[Dict[str, str]]
    citations: List[Dict[str, str]]
    needs_input: bool
    reply: str
    plan: Optional[Dict[str, Any]]

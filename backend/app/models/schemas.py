"""Pydantic request/response models. Owner: Person A."""
from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class ChatRequest(BaseModel):
    session_id: str
    message: str
    lang: str = "en"          # en | tanglish | singlish

class ChatResponse(BaseModel):
    session_id: str
    reply: str
    needs_input: bool = False
    service: Optional[str] = None
    plan: Optional[Dict[str, Any]] = None

class ApproveRequest(BaseModel):
    officer: str

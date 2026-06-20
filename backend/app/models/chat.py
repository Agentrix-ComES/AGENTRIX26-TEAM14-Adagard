"""Persistent chat: per-user sessions + message log. Owner: Person A.

`ChatSession.state` stores the full LangGraph `GraphState` (JSON-serializable) so the
clarifying-question loop survives restarts; `ChatMessage` is the durable display log.
Replaces the in-memory `SESSIONS` dict.
"""
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import JSON, Text
from sqlmodel import SQLModel, Field


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class ChatSession(SQLModel, table=True):
    __tablename__ = "chat_session"
    id: Optional[int] = Field(default=None, primary_key=True)
    session_id: str = Field(index=True, unique=True)
    user_id: int = Field(index=True, foreign_key="user.id")
    lang: str = "en"
    state: dict = Field(default_factory=dict, sa_type=JSON)
    service: Optional[str] = None
    office: Optional[str] = None
    completed: bool = False
    created_at: datetime = Field(default_factory=_utcnow)
    updated_at: datetime = Field(default_factory=_utcnow)


class ChatMessage(SQLModel, table=True):
    __tablename__ = "chat_message"
    id: Optional[int] = Field(default=None, primary_key=True)
    session_id: str = Field(index=True)
    user_id: int = Field(index=True, foreign_key="user.id")
    role: str                                   # "user" | "assistant"
    content: str = Field(sa_type=Text)
    plan: Optional[dict] = Field(default=None, sa_type=JSON)
    created_at: datetime = Field(default_factory=_utcnow)

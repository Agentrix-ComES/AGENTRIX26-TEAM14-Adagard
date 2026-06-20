"""Durable verification packets (HITL queue). Owner: Person A.

Replaces the in-memory `VERIFICATIONS` dict. `service` + `office` columns drive officer
RBAC scoping (see app.auth.rbac.can_act).
"""
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import JSON
from sqlmodel import SQLModel, Field


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Verification(SQLModel, table=True):
    __tablename__ = "verification"
    id: Optional[int] = Field(default=None, primary_key=True)
    vid: str = Field(index=True, unique=True)
    session_id: str = Field(index=True)
    user_id: Optional[int] = Field(default=None, foreign_key="user.id")
    service: Optional[str] = None
    office: Optional[str] = None
    plan: dict = Field(default_factory=dict, sa_type=JSON)
    approved: bool = Field(default=False, index=True)
    officer_name: Optional[str] = None
    officer_nic: Optional[str] = None
    created_at: datetime = Field(default_factory=_utcnow)
    approved_at: Optional[datetime] = None

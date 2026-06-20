"""Request lifecycle tables for the full agentic flow. Owner: Person A.

requests -> documents -> (gap-check) -> appointments / generated forms -> verifications.
Mirrors the SHARED PACKET CONTRACT in tmp/new-flow.txt. Persisted in Supabase Postgres.
"""
import uuid
from datetime import datetime, timezone, time
from typing import Optional

from sqlalchemy import JSON, Text
from sqlmodel import SQLModel, Field


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Request(SQLModel, table=True):
    __tablename__ = "requests"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: int = Field(index=True, foreign_key="user.id")
    session_id: Optional[str] = Field(default=None, index=True)   # links back to the chat plan
    service: str
    # draft | submitted | needs_docs | needs_appointment | ready | approved | rejected
    status: str = Field(default="draft", index=True)
    plan: dict = Field(default_factory=dict, sa_type=JSON)
    created_at: datetime = Field(default_factory=_utcnow)


class Document(SQLModel, table=True):
    __tablename__ = "documents"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    request_id: uuid.UUID = Field(index=True, foreign_key="requests.id")
    type: Optional[str] = None                      # required-doc type this satisfies
    filename: Optional[str] = None
    storage_path: str                               # object path in the Supabase bucket
    extracted: Optional[dict] = Field(default=None, sa_type=JSON)
    status: str = "uploaded"                        # uploaded | matched | unreadable
    created_at: datetime = Field(default_factory=_utcnow)


class OfficerAvailability(SQLModel, table=True):
    __tablename__ = "officer_availability"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    officer_id: int = Field(index=True, foreign_key="user.id")
    day_of_week: int                                # 0=Mon .. 6=Sun
    start_time: time
    end_time: time
    slot_minutes: int = 30


class Appointment(SQLModel, table=True):
    __tablename__ = "appointments"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    request_id: uuid.UUID = Field(index=True, foreign_key="requests.id")
    officer_id: int = Field(index=True, foreign_key="user.id")
    slot_start: datetime
    slot_end: datetime
    status: str = "booked"                          # booked | cancelled | completed
    created_at: datetime = Field(default_factory=_utcnow)


class VerificationPacket(SQLModel, table=True):
    __tablename__ = "verifications"
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    request_id: uuid.UUID = Field(index=True, foreign_key="requests.id")
    service: Optional[str] = None
    office: Optional[str] = None                     # for officer RBAC scoping
    confidence: int = 0                              # 0-100 AI verification confidence
    extracted_fields: dict = Field(default_factory=dict, sa_type=JSON)
    checks: list = Field(default_factory=list, sa_type=JSON)
    flags: list = Field(default_factory=list, sa_type=JSON)
    summary: str = Field(default="", sa_type=Text)
    gap_check: dict = Field(default_factory=dict, sa_type=JSON)
    generated_forms: list = Field(default_factory=list, sa_type=JSON)
    appointment: Optional[dict] = Field(default=None, sa_type=JSON)
    # submitted | ready | approved | rejected
    status: str = Field(default="ready", index=True)
    officer_id: Optional[int] = Field(default=None, foreign_key="user.id")
    reject_reason: Optional[str] = None
    created_at: datetime = Field(default_factory=_utcnow)

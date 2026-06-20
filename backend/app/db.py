"""SQLModel engine + session. Owner: Person A.

Postgres (Prisma Postgres) in production, SQLite for local dev. The DATABASE_URL is
normalized to the psycopg v3 driver, and pgvector is enabled on Postgres so embeddings
live in a `vector` column.
"""
from sqlmodel import SQLModel, Session, create_engine
from sqlalchemy import text

from app.config import DATABASE_URL as _RAW_URL


def _normalize(url: str) -> str:
    """Point SQLAlchemy at psycopg v3 for any Postgres URL (incl. Prisma's `postgres://`)."""
    if url.startswith("postgresql+"):
        return url
    if url.startswith("postgresql://"):
        return "postgresql+psycopg://" + url[len("postgresql://"):]
    if url.startswith("postgres://"):
        return "postgresql+psycopg://" + url[len("postgres://"):]
    return url


DATABASE_URL = _normalize(_RAW_URL)
IS_POSTGRES = DATABASE_URL.startswith("postgresql")

_connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, echo=False, connect_args=_connect_args)


def init_db() -> None:
    """Create tables. On Postgres, enable pgvector first and create every table;
    on SQLite, skip the vector table (its column type is Postgres-only)."""
    # Import models so they register on SQLModel.metadata.
    from app.models.user import User  # noqa: F401
    from app.models.chat import ChatSession, ChatMessage  # noqa: F401
    from app.models.verification import Verification  # noqa: F401
    from app.models.circular import CircularChunk  # noqa: F401
    from app.models.request_flow import (  # noqa: F401
        Request, Document, OfficerAvailability, Appointment, VerificationPacket,
    )

    if IS_POSTGRES:
        with engine.begin() as conn:
            conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
        SQLModel.metadata.create_all(engine)
    else:
        non_vector = [
            t for t in SQLModel.metadata.sorted_tables if t.name != "circular_chunk"
        ]
        SQLModel.metadata.create_all(engine, tables=non_vector)


def get_session():
    """FastAPI dependency yielding a DB session."""
    with Session(engine) as session:
        yield session

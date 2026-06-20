"""Gazette/circular chunks with pgvector embeddings. Owner: Person A.

Replaces the ChromaDB `circulars` collection. `embedding` is a pgvector `vector(768)`
column (Gemini text-embedding-004); similarity search uses cosine distance. Postgres-only
(see app.db.init_db, which skips this table on SQLite).
"""
from typing import Optional, Any

from sqlalchemy import Text
from sqlmodel import SQLModel, Field
from pgvector.sqlalchemy import Vector

EMBED_DIM = 768  # Gemini text-embedding-004


class CircularChunk(SQLModel, table=True):
    __tablename__ = "circular_chunk"
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str = ""
    source: str = ""
    text: str = Field(sa_type=Text)
    embedding: Optional[Any] = Field(default=None, sa_type=Vector(EMBED_DIM))

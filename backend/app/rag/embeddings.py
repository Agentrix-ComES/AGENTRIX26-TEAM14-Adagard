"""Gemini text embeddings for pgvector. Owner: Person A.

Uses text-embedding-004 (768-dim) — matches the `vector(768)` column in
app.models.circular.CircularChunk. Raises on failure; callers (retriever) degrade to the
static knowledge base.
"""
import os

import google.generativeai as genai

EMBED_MODEL = os.getenv("EMBED_MODEL", "models/gemini-embedding-001")
EMBED_DIM = 768  # must match the vector(768) column in app.models.circular


def embed(text: str, *, query: bool = False) -> list[float]:
    """Return the 768-d embedding vector for `text` (query vs document task type)."""
    genai.configure(api_key=os.getenv("GEMINI_API_KEY", ""))
    res = genai.embed_content(
        model=EMBED_MODEL,
        content=text,
        task_type="retrieval_query" if query else "retrieval_document",
        output_dimensionality=EMBED_DIM,
    )
    return res["embedding"]

"""RAG retriever over pgvector. Owner: Person A.

Embeds the query (Gemini) and ranks CircularChunk rows by cosine distance. Failure-tolerant:
any error (no index, embedding quota, DB issue) returns [] so the requirements agent falls
back to the static knowledge base.
"""
from sqlmodel import Session, select

from app.db import engine
from app.models.circular import CircularChunk
from app.rag.embeddings import embed


def retrieve(query: str, service: str = "", k: int = 4):
    try:
        qe = embed(f"{service} {query}".strip(), query=True)
        with Session(engine) as db:
            rows = db.exec(
                select(CircularChunk)
                .order_by(CircularChunk.embedding.cosine_distance(qe))
                .limit(k)
            ).all()
        return [{"text": r.text, "title": r.title, "source": r.source} for r in rows]
    except Exception as exc:  # empty index, embedding failure, DB error — all non-fatal
        print(f"[retriever] pgvector RAG unavailable, using fallback knowledge: {exc}")
        return []

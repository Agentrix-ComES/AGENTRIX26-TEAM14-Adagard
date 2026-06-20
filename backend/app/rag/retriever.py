"""RAG retriever over ChromaDB. Owner: Person A.

Lazy and failure-tolerant so the service stays up on constrained hosts (e.g. Render free
tier, 512 MB RAM, ephemeral disk). ChromaDB is imported and the client built only on first
use, and any failure (no index, OOM, the embedder model failing to download) degrades to an
empty result — the requirements agent then falls back to the static knowledge base.
"""
import os

_client = None


def _collection():
    global _client
    if _client is None:
        import chromadb  # imported lazily: app startup never depends on chromadb loading
        _client = chromadb.PersistentClient(path=os.getenv("CHROMA_DIR", "./chroma_db"))
    return _client.get_or_create_collection("circulars")


def retrieve(query: str, service: str = "", k: int = 4):
    try:
        col = _collection()
        res = col.query(query_texts=[f"{service} {query}"], n_results=k)
        docs = res.get("documents", [[]])[0]
        metas = res.get("metadatas", [[]])[0]
        return [{"text": d, "title": m.get("title", ""), "source": m.get("source", "")}
                for d, m in zip(docs, metas)]
    except Exception as exc:  # empty index, OOM, embedder download blocked — all non-fatal
        print(f"[retriever] RAG unavailable, using fallback knowledge: {exc}")
        return []

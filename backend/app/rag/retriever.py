"""RAG retriever over ChromaDB. Owner: Person A."""
import os
import chromadb

_client = chromadb.PersistentClient(path=os.getenv("CHROMA_DIR", "./chroma_db"))

def retrieve(query: str, service: str = "", k: int = 4):
    col = _client.get_or_create_collection("circulars")
    res = col.query(query_texts=[f"{service} {query}"], n_results=k)
    docs = res.get("documents", [[]])[0]
    metas = res.get("metadatas", [[]])[0]
    return [{"text": d, "title": m.get("title", ""), "source": m.get("source", "")}
            for d, m in zip(docs, metas)]

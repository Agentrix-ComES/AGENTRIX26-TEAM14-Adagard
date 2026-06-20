"""Requirements Agent (RAG core) — pulls rules from ChromaDB. Owner: Person A."""
from app.graph.state import GraphState
from app.rag.retriever import retrieve

def run(state: GraphState) -> GraphState:
    docs = retrieve(query=state.get("intent", ""), service=state.get("service", ""), k=4)
    state["requirements"] = [d["text"] for d in docs]
    state["citations"] = [{"title": d["title"], "source": d["source"]} for d in docs]
    return state

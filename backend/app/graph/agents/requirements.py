"""Requirements Agent (RAG core) — pulls rules from ChromaDB. Owner: Person A.

Retrieves circular chunks for the service, then produces a clean, human-readable
checklist of what the citizen must bring. Degrades gracefully:
  - RAG hits  -> summarise the chunks into a checklist via the LLM,
  - no hits / no LLM -> fall back to the static checklist in app.graph.knowledge.
Citations come from the retrieved chunks when available, else the knowledge base.
"""
from app.graph.state import GraphState
from app.graph.agents._llm import ask
from app.rag.retriever import retrieve
from app.graph import knowledge


def _llm_checklist(service: str, chunks: list[str]) -> list[str]:
    context = "\n---\n".join(chunks)[:4000]
    out = ask(
        f"From the official circular text below, list the documents and steps a citizen "
        f"must bring to obtain '{service}' in Sri Lanka. Reply as short bullet lines, one "
        f"requirement per line, no numbering, no preamble.\n\n{context}"
    )
    items = [ln.strip(" -*•\t") for ln in out.splitlines() if ln.strip(" -*•\t")]
    return items[:8]


def run(state: GraphState) -> GraphState:
    service = state.get("service", "")
    info = knowledge.info(service)

    docs = retrieve(query=state.get("intent", ""), service=service, k=4)
    state["requirements"] = [d["text"] for d in docs]

    checklist: list[str] = []
    if docs:
        checklist = _llm_checklist(service, [d["text"] for d in docs])
    if not checklist:
        checklist = list(info["checklist"])          # static fallback
    state["checklist"] = checklist

    if docs:
        state["citations"] = [{"title": d["title"], "source": d["source"]} for d in docs]
    else:
        state["citations"] = [info["citation"]]
    return state

"""Circular/Gazette Retrieval Vectorizer. Owner: Person A.
Scrapes/ingests circular PDFs -> chunks -> embeds -> ChromaDB.
Run: python -m app.rag.vectorizer
"""
import os, glob
from dotenv import load_dotenv
import chromadb
from pypdf import PdfReader

load_dotenv()
CHROMA_DIR = os.getenv("CHROMA_DIR", "./chroma_db")
DATA_DIR = "./data/circulars"

def chunk(text, size=800, overlap=100):
    out, i = [], 0
    while i < len(text):
        out.append(text[i:i+size]); i += size - overlap
    return out

def ingest():
    client = chromadb.PersistentClient(path=CHROMA_DIR)
    col = client.get_or_create_collection("circulars")
    pdfs = glob.glob(f"{DATA_DIR}/*.pdf")
    if not pdfs:
        print("No PDFs in data/circulars/. Drop 5-10 real gazettes/circulars here.")
    n = 0
    for path in pdfs:
        title = os.path.basename(path)
        text = "".join((p.extract_text() or "") for p in PdfReader(path).pages)
        for j, c in enumerate(chunk(text)):
            col.add(ids=[f"{title}-{j}"], documents=[c],
                    metadatas=[{"title": title, "source": path}])
            n += 1
    # TODO: add a scraper for documents.gov.lk to fetch fresh circulars automatically.
    print(f"Ingested {n} chunks from {len(pdfs)} files into {CHROMA_DIR}")

if __name__ == "__main__":
    ingest()

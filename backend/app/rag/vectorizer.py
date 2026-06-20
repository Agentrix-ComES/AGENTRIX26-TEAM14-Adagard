"""Circular/Gazette Vectorizer -> pgvector. Owner: Person A.
Chunks circular PDFs, embeds them (Gemini), and loads them into the `circular_chunk`
table. Run: python -m app.rag.vectorizer
"""
import os
import glob

from dotenv import load_dotenv

load_dotenv()

from sqlalchemy import delete
from sqlmodel import Session
from pypdf import PdfReader

from app.db import engine, init_db
from app.models.circular import CircularChunk
from app.rag.embeddings import embed

DATA_DIR = "./data/circulars"


def chunk(text, size=800, overlap=100):
    out, i = [], 0
    while i < len(text):
        out.append(text[i:i + size])
        i += size - overlap
    return out


def ingest():
    init_db()
    pdfs = glob.glob(f"{DATA_DIR}/*.pdf")
    if not pdfs:
        print("No PDFs in data/circulars/. Drop 5-10 real gazettes/circulars here.")
    n = 0
    with Session(engine) as db:
        db.execute(delete(CircularChunk))          # full reload for idempotency
        for path in pdfs:
            title = os.path.basename(path)
            text = "".join((p.extract_text() or "") for p in PdfReader(path).pages)
            for c in chunk(text):
                if not c.strip():
                    continue
                db.add(CircularChunk(title=title, source=path, text=c, embedding=embed(c)))
                n += 1
        db.commit()
    print(f"Ingested {n} chunks into pgvector (circular_chunk).")


if __name__ == "__main__":
    ingest()

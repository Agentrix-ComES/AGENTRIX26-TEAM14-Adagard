"""GovPath API entrypoint. Owner: Person A.

Loads .env before any agent module reads it, enables permissive CORS for the Flutter app
and Next.js admin, mounts generated artefacts at /files, and wires the REST routes.
"""
from dotenv import load_dotenv

load_dotenv()  # must run before app.api.routes -> graph -> agents._llm read GEMINI_API_KEY

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.routes import router
from app.storage import FILES_DIR

app = FastAPI(title="GovPath API", version="1.0.0")
app.add_middleware(
    CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"]
)

# Pre-filled forms (plan.forms[].url like /files/B63_xxxx.pdf) are served from here.
app.mount("/files", StaticFiles(directory=FILES_DIR), name="files")

app.include_router(router)


@app.get("/health")
def health():
    return {"status": "ok"}

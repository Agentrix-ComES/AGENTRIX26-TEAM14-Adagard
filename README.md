# GovPath — The Intelligent Citizen Service Navigator
Agentic RAG system for Sri Lankan civic services. AgenTriX 2026 · Team Adagard.

## Repos / Components (owners)
- `backend/`  — Python · FastAPI · LangGraph · ChromaDB · Gemini (free tier).  Owner: **Person A**
- `mobile/`   — Flutter citizen app (English / Tanglish / Singlish).           Owner: **Person B**
- `admin_web/`— React admin dashboard for Human-in-the-Loop verification.      Owner: **Person C**
- `docs/`     — ER / architecture / use-case diagrams, demo assets.            Owner: **Person C**

## Run order (local)
1. `cd backend && pip install -r requirements.txt && cp .env.example .env`  (add GEMINI_API_KEY)
2. `python -m app.rag.vectorizer`   # ingest sample circulars into ChromaDB
3. `uvicorn app.main:app --reload`   # API at http://localhost:8000
4. `cd ../admin_web && npm install && npm run dev`
5. `cd ../mobile && flutter pub get && flutter run`

See DEVELOPMENT_PLAN.md for the 12-hour task split.

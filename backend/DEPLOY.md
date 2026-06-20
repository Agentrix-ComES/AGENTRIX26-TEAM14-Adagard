# Deploying the GovPath backend to Render (free tier)

Two ways: the **Blueprint** (recommended — reads `render.yaml`) or **manual** dashboard setup.
Either way the result is a public URL like `https://govpath-backend.onrender.com`.

## A. Blueprint (one click)

1. Push the repo to GitHub (make sure `.env` is **not** committed — it is gitignored).
2. Render Dashboard → **New** → **Blueprint** → select this repo.
3. Render reads `render.yaml` at the repo root and creates the `govpath-backend` web service.
4. When prompted, set the secret **`GEMINI_API_KEY`** (it has `sync: false`, so it is not in
   the repo). Use a key that has quota for `gemini-2.5-flash`.
5. **Create** → first build takes a few minutes (chromadb/onnxruntime are large). Done when
   `GET /health` returns `{"status":"ok"}`.

## B. Manual web service

- New → **Web Service** → connect the repo.
- **Root Directory:** `backend`
- **Runtime:** Python
- **Build Command:** `pip install -r requirements.txt`
- **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- **Health Check Path:** `/health`
- **Environment variables:**
  | key | value |
  |---|---|
  | `GEMINI_API_KEY` | *your key* (secret) |
  | `LLM_MODEL` | `gemini-2.5-flash` |
  | `CHROMA_DIR` | `/tmp/chroma_db` |
  | `FILES_DIR` | `/tmp/govpath_files` |
  | `PYTHON_VERSION` | `3.11.9` (or rely on `backend/.python-version`) |

## What makes this work on the free tier

- **Binds correctly:** the start command uses `--host 0.0.0.0 --port $PORT`. Render injects
  `$PORT`; binding to anything else fails health checks.
- **CORS is `*`** so the deployed Flutter app and Next.js admin can call it directly.
- **No persistent disk needed.** `CHROMA_DIR` and `FILES_DIR` point at `/tmp` (ephemeral).
  The RAG index and generated PDFs are rebuilt on demand; if the index is empty the pipeline
  falls back to the static knowledge base, so `/chat` still returns complete plans.
- **Failure-tolerant runtime.** ChromaDB is imported lazily and every LLM/RAG call is guarded
  — a missing key, a `429`, or the embedder failing to download never 500s the API.

## Free-tier limitations to expect

- **Cold starts:** the service spins down after ~15 min idle; the next request can take
  ~50 s while it wakes. Have the frontends show a loading state / retry.
- **Memory (512 MB):** langgraph + langchain + chromadb is tight. If you hit OOM, set
  `CHROMA_DIR` to an empty dir (RAG then no-ops to the fallback) — the app stays useful. For
  headroom you can drop ingest-only deps (`pdfplumber`, `pypdf`, `beautifulsoup4`) from
  `requirements.txt` for the deployed build.
- **Ephemeral disk:** anything written to `/tmp` is lost on restart/redeploy. To ship real
  circulars, either commit a prebuilt `chroma_db/` and point `CHROMA_DIR` at it, or run the
  vectorizer at build time.

## After deploy — point the frontends at it

- **Flutter** (`mobile/lib/services/api.dart`): change `kBaseUrl` from `http://10.0.2.2:8000`
  to your `https://...onrender.com` URL.
- **Admin web:** set its API base URL to the same.

## Smoke test the live URL

```bash
BASE=https://govpath-backend.onrender.com
curl -s $BASE/health
SID=$(python -c "import uuid;print(uuid.uuid4())")
curl -s -X POST $BASE/chat -H 'Content-Type: application/json' \
  -d "{\"session_id\":\"$SID\",\"message\":\"I need an old birth certificate\",\"lang\":\"en\"}"
curl -s -X POST $BASE/chat -H 'Content-Type: application/json' \
  -d "{\"session_id\":\"$SID\",\"message\":\"40\",\"lang\":\"en\"}"
curl -s $BASE/verifications
```

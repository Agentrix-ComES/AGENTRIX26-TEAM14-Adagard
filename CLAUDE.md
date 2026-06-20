# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

GovPath — an agentic RAG system that navigates Sri Lankan civic services (NIC, passport, GN certificate, driving license, birth/death certificates). A citizen chats in English/Tanglish/Singlish; a LangGraph agent pipeline classifies the service, retrieves rules from ingested government circulars, asks clarifying questions, drafts forms/affidavits, and queues a "Wasted Trip Prevention Plan" for a human officer to approve. Built for the AgenTriX 2026 hackathon (Team Adagard).

**Hackathon constraint:** Free-tier AI only (Gemini free tier) — paid APIs are disqualifying. Keep LLM prompts small to respect rate limits (see `backend/app/graph/agents/_llm.py`).

## Three components

| Dir | Stack | Role |
|---|---|---|
| `backend/` | Python · FastAPI · LangGraph · ChromaDB · Gemini | Agent pipeline + RAG + REST API |
| `mobile/` | Flutter / Dart | Citizen chat app (en/Tanglish/Singlish) |
| `admin_web/` | Next.js 16 · React 19 · Tailwind 4 | Human-in-the-loop verification dashboard |

`API_CONTRACT.md` is the frozen interface between backend and both frontends — **do not change request/response shapes without updating it and both clients.** The contract is: `POST /chat`, `GET /verifications`, `POST /verifications/{id}/approve`, `GET /health`.

## Commands

```bash
# Backend (run from backend/) — uses uv, NOT pip
uv venv && source .venv/bin/activate
uv pip install -r requirements.txt
cp .env.example .env                # add GEMINI_API_KEY (LLM_MODEL defaults to gemini-2.0-flash)
python -m app.rag.vectorizer        # OPTIONAL: ingest PDFs from data/circulars/ into ChromaDB
uvicorn app.main:app --reload       # API at http://localhost:8000  (or: uv run uvicorn app.main:app --reload)

# Admin web (run from admin_web/)
npm install && npm run dev          # Next.js dev server
npm run build
npm run lint                        # eslint

# Mobile (run from mobile/)
flutter pub get && flutter run
```

There is no test suite. To exercise the backend, POST to `/chat` with `{session_id, message, lang}` across two turns (the first asks a clarifying question, the second completes the plan). `backend/BACKEND.md` has a full curl walkthrough and is the authoritative backend guide.

The RAG ingest step is **optional**: with no PDFs in `data/circulars/`, the pipeline falls back to the static knowledge base and still returns complete plans. `gemini-1.5-flash` is retired (404) — use `gemini-2.0-flash`.

## Backend architecture

The whole system is a single **LangGraph state machine** wired in `backend/app/graph/graph.py`. One shared `GraphState` TypedDict (`graph/state.py`) flows through every node. Each agent is a `run(state) -> state` function in `graph/agents/` that mutates and returns the state.

Pipeline order:
```
intake ─┬─ fresh  → intent → classifier → requirements(RAG) → personalization ┐
        ├─ resume ──────────────────────────────────────────→ personalization ┤
        └─ done   → END                                                        │
personalization ─ needs_input? ─ yes → END (ask clarifying question)           │
                                └ no → gap_check → form_assistant → scheduler ──┘
                                       → action_agent → verifier → END
```

Key mechanics future instances must understand:

- **The clarifying-question loop is stateless across HTTP calls.** `run_turn()` loads prior `GraphState` from the in-memory `SESSIONS` dict (`models/store.py`) keyed by `session_id`, re-invokes the *whole* graph each turn, and persists it back. **There is no checkpointer — every turn replays the full pipeline.** The **`intake`** node (entry) is what makes the loop converge: it ingests the user's answer to a parked question into `state["user_context"]` (clearing `state["awaiting"]`). On **resume** turns (`service` already set) the graph skips `intent`/`classifier` so a one-word answer like `"40"` isn't re-summarized/re-classified. `run_turn` also short-circuits once a plan is `completed` so no duplicate verification packets are queued.

- **Hero logic lives in `personalization.py`:** birth/death requests route by record age — ≥20 years → **District Secretariat (Kachcheri)**, newer → **Divisional Secretariat**. This DS-vs-Kachcheri routing is the demo centerpiece. Clarifying answers live in `state["user_context"]` (`record_age_years`, `dual_citizen`, `documents`).

- **Resilience / fallbacks:** every LLM call goes through `_llm.ask()`, which returns `""` on any failure (missing key, quota 429, network). Agents then fall back to the static **`graph/knowledge.py`** knowledge base (per-service checklist, office, officer, form, citation, classifier keywords). The backend returns complete, correct plans even with **zero** LLM access — verified against a `429 limit:0` key.

- **RAG:** `rag/vectorizer.py` chunks PDFs from `backend/data/circulars/` into a persistent ChromaDB collection `circulars` (uses Chroma's bundled embedder, not Gemini). `rag/retriever.py` queries it. `requirements` is the RAG entry point: RAG hit → LLM-summarized checklist; no hit → knowledge-base checklist.

- **Forms / static files:** `form_assistant.py` renders a pre-filled **PDF** (reportlab) into `backend/files/` (path from `app/storage.py`), mounted at `/files` in `main.py`, so `plan.forms[].url` resolves. Falls back to `.txt` if reportlab is unavailable.

- **Verification / HITL:** `verifier.py` assembles the `plan` and pushes a packet into the in-memory `VERIFICATIONS` dict. Crucially the **same `plan` dict object** is stored in both `state["plan"]` (returned by `/chat`) and the packet (returned by `/verifications`), so the two are byte-identical for the frontends. Only `reply` is ever localized; `plan` never is. `SESSIONS`/`VERIFICATIONS` are plain dicts — **state is lost on restart** (swap for Redis/DB later).

`action_agent.py` runs a Creator↔Evaluator loop (draft → PASS/fix → revise) but only drafts an affidavit for *archived* (≥20yr) birth/death records. `backend/BACKEND.md` documents the full design and the flagged additions.

## admin_web specifics

`admin_web/AGENTS.md` warns: this is **Next.js 16 with breaking changes from older versions** — consult `node_modules/next/dist/docs/` before writing Next.js code rather than relying on prior-version conventions.

## Conventions

- Every backend file header names its owner (Person A = backend/AI, B = mobile, C = admin/docs) — informational only.
- Supported service keys are fixed: `nic | passport | gn_cert | license | birth_cert | death_cert` (see `classifier.py`). Adding a service means touching the classifier, `scheduler.OFFICER`, and `form_assistant.FORMS` maps.
- Mobile uses `http://10.0.2.2:8000` (Android emulator → host loopback); web/backend use `http://localhost:8000`.

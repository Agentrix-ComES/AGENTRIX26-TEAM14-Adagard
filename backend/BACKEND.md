# GovPath Backend — Complete Guide (Owner: Person A)

Agentic RAG service for Sri Lankan civic services. FastAPI + LangGraph + ChromaDB + Gemini
(free tier). This document is the single source of truth for running, understanding, and
integrating with the backend. The wire format is frozen in `../API_CONTRACT.md`.

---

## 1. Run it (uv)

We use **uv** (not pip) as the package manager.

```bash
cd backend
uv venv                                  # create .venv
source .venv/bin/activate                # Windows: .venv\Scripts\activate
uv pip install -r requirements.txt
cp .env.example .env                      # then put your GEMINI_API_KEY in .env

# (optional) ingest real circulars for live RAG — drop PDFs in data/circulars/ first
python -m app.rag.vectorizer

uvicorn app.main:app --reload             # API on http://localhost:8000
```

Health check: `curl localhost:8000/health` → `{"status":"ok"}`.

Run without activating the venv: prefix commands with `uv run`, e.g.
`uv run uvicorn app.main:app --reload`.

### .env keys
| key | meaning | default |
|---|---|---|
| `GEMINI_API_KEY` | Gemini free-tier key | — (required for LLM features) |
| `LLM_MODEL` | chat model | `gemini-2.5-flash` |
| `EMBED_MODEL` | (reserved; Chroma uses its bundled embedder today) | `models/text-embedding-004` |
| `CHROMA_DIR` | ChromaDB persistence dir | `./chroma_db` |
| `FILES_DIR` | where generated form PDFs are written/served | `backend/files` |

> **Model note:** `gemini-1.5-flash` (the original scaffold value) is **404 / retired**.
> On this project's key the **`gemini-2.0`** family returns **429 (`limit: 0`, no free-tier
> quota)**, but **`gemini-2.5-flash`** and `gemini-flash-lite-latest` work — so the default
> is `gemini-2.5-flash`. List models valid for your key with `genai.list_models()`.

---

## 2. Endpoints (exactly `API_CONTRACT.md`)

| method | path | purpose | consumer |
|---|---|---|---|
| `POST` | `/chat` | drive the agent graph (multi-turn) | Flutter app |
| `GET`  | `/verifications` | list packets **awaiting** review | Admin web |
| `POST` | `/verifications/{id}/approve` | officer approves a packet | Admin web |
| `GET`  | `/health` | liveness | all |
| `GET`  | `/files/{name}` | download a generated form PDF | all |

CORS is `allow_origins=["*"]` so both the Next.js admin (`:3000`) and the Flutter app can
call directly.

### POST /chat
```jsonc
// request
{ "session_id": "uuid", "message": "string", "lang": "en|tanglish|singlish" }
// response
{
  "session_id": "uuid",
  "reply": "string",        // assistant message (clarifying question or final summary)
  "needs_input": true,      // true => show reply as a question and send the answer next
  "service": "birth_cert|death_cert|nic|passport|gn_cert|license", // nullable
  "plan": null              // null until complete, then the plan object below
}
```

`plan` (present once complete — **byte-identical to the `plan` inside `/verifications`**):
```jsonc
{
  "office":  "Divisional Secretariat | District Secretariat (Kachcheri)",
  "officer": "Additional District Registrar",
  "checklist": ["string", ...],
  "forms":     [{ "name": "B63", "url": "/files/B63_xxxxxxxx.pdf" }],
  "draft_docs":[{ "type": "affidavit", "content": "string" }],
  "citations": [{ "title": "string", "source": "string" }]
}
```

> **Integration guarantees for Person B (Flutter) & Person C (Admin):**
> 1. **CORS is enabled** (`*`).
> 2. The `plan` object returned by `/chat` is the *same object* the Verifier stores in the
>    queue, so `/chat.plan` and `/verifications[i].plan` are **identical** — parse them with
>    one model on both sides. (Only `reply` is ever localized; `plan` never is.)

### GET /verifications
Returns the **pending** (unapproved) packets only:
```jsonc
[{ "id":"uuid","session_id":"uuid","service":"birth_cert","plan":{...},"approved":false,"officer":null }]
```

### POST /verifications/{id}/approve
```jsonc
// request:  { "officer": "K. Perera" }
// response: { "ok": true }    // 404 if the id is unknown
```
After approval the packet drops out of `GET /verifications`.

---

## 3. How a turn flows (architecture)

The whole backend is one **LangGraph state machine** (`app/graph/graph.py`). One shared
`GraphState` dict flows through `run(state)->state` agents in `app/graph/agents/`.

```
intake ─┬─ fresh  ─> intent -> classifier -> requirements(RAG) -> personalization ┐
        ├─ resume ───────────────────────────────────────────> personalization ──┤
        └─ done   ─> END                                                          │
 personalization ─ needs_input? ─ yes ─> END (ask clarifying question)            │
                                └ no ──> gap_check -> form_assistant -> scheduler ─┘
                                         -> action_agent -> verifier -> END
```

There is **no LangGraph checkpointer** — per turn the graph is replayed in full and session
state is loaded/saved from the in-memory `SESSIONS` dict (`app/models/store.py`) keyed by
`session_id`. The pieces that make the multi-turn clarifying loop converge:

- **`intake`** (entry node) appends the message to history and, if the previous turn parked
  on a question (`state["awaiting"]` set), parses the answer into `user_context` and clears
  the flag. *This is the fix for the original scaffold, which asked the same question
  forever.*
- On **resume** turns (`service` already set) the graph skips `intent`/`classifier`, so a
  one-word answer like `"40"` never gets re-summarized or re-classified into a wrong service.
- `run_turn` **short-circuits once a plan is complete**, so a session never queues duplicate
  verification packets.

### The agents
| node | job |
|---|---|
| `intake` | record turn + ingest clarifying answers (`record_age_years`, `dual_citizen`, …) |
| `intent` | normalize en/Tanglish/Singlish goal to one English line (LLM) |
| `classifier` | keyword fast-path → LLM fallback → one of the 6 service keys |
| `requirements` | RAG over ChromaDB → clean checklist (LLM summary) + citations |
| `personalization` | **DS-vs-Kachcheri routing** (birth/death by record age); passport dual-citizen Q |
| `gap_check` | checklist minus documents the citizen already has → `gaps` |
| `form_assistant` | render a pre-filled **PDF** of the form to `/files`, add to `plan.forms` |
| `scheduler` | name the exact office + officer |
| `action_agent` | draft a supporting affidavit for *archived* birth/death records (Creator↔Evaluator loop) |
| `verifier` | assemble `plan`, push packet to the queue, mark session complete |

### The hero feature — DS vs Kachcheri
For `birth_cert`/`death_cert`, `personalization` asks the record age, then:
`age >= 20` → **District Secretariat (Kachcheri)** (archived); else → **Divisional Secretariat**.
This is the wasted-trip the app prevents and the centerpiece of the demo.

---

## 4. Resilience / graceful degradation

Every LLM call goes through `app/graph/agents/_llm.ask()`, which returns `""` on **any**
failure (missing key, quota `429`, network, safety block). When that happens the pipeline
falls back to the static **knowledge base** (`app/graph/knowledge.py`) — so `/chat` always
returns a correct, well-formed plan even with **zero** LLM access. Verified: with the key
returning `429 limit:0`, the full birth-cert flow (classify → route → checklist → PDF →
queue) still completes.

What is LLM-powered (and silently degrades to static data when the key is down):
- Tanglish/Singlish understanding (`intent`) and reply translation (localization),
- RAG checklist summarization (`requirements`) — falls back to per-service checklist,
- affidavit drafting (`action_agent`) — skipped if unavailable.

---

## 5. New things I added (flagged for the team)

These extend the scaffold but **do not change the API contract**:

1. **`app/graph/knowledge.py`** — static per-service civic data (checklist, office, officer,
   form code, citation, classifier keywords) used as the offline fallback. *Values are
   illustrative;* once real circulars are ingested, RAG should be the source of truth.
2. **`app/graph/agents/intake.py`** — new entry node that ingests clarifying answers
   (required to make the multi-turn loop terminate).
3. **`app/storage.py` + `/files` static mount** — generated form PDFs are written here and
   served, so `plan.forms[].url` actually resolves.
4. **`reportlab`** dependency — added to `requirements.txt` to render the pre-filled form
   PDFs. Falls back to a `.txt` artefact if reportlab is missing.
5. **`ApproveRequest`** Pydantic model + **404** on unknown verification id.
6. **Reply localization** — `/chat` replies are translated to Tanglish/Singlish when
   `lang != en` (best-effort; `plan` is never translated).
7. **`.env` model bumped** `gemini-1.5-flash` → `gemini-2.0-flash` (the old id is retired).
8. **`GraphState`** gained `awaiting`, `checklist`, `completed`.

### Gemini key / model note (resolved)
The key has **no free-tier quota for the `gemini-2.0` family** (those return
`429 ... free_tier_requests, limit: 0`), but **`gemini-2.5-flash` works** — that is now the
default (`LLM_MODEL`), so the AI features (multilingual replies, RAG-summarized checklists,
affidavit drafting) run live. The fallback path still covers any future 429/404. If you see
429s again, check `LLM_MODEL` is a model your key has quota for (`genai.list_models()`).

---

## 6. Quick manual test

```bash
SID=$(python -c "import uuid;print(uuid.uuid4())")
curl -s localhost:8000/health
# turn 1 — clarifying question
curl -s -X POST localhost:8000/chat -H 'Content-Type: application/json' \
  -d "{\"session_id\":\"$SID\",\"message\":\"I need an old birth certificate\",\"lang\":\"en\"}"
# turn 2 — answer the age → full plan, routed to Kachcheri if >= 20
curl -s -X POST localhost:8000/chat -H 'Content-Type: application/json' \
  -d "{\"session_id\":\"$SID\",\"message\":\"40\",\"lang\":\"en\"}"
curl -s localhost:8000/verifications          # packet now in the queue
```

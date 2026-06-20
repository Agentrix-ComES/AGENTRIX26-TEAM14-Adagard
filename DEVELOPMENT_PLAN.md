# GovPath — 12-Hour Development Plan (Team Adagard)

## Roles (component split)
| Person | Owns | Stack |
|---|---|---|
| **A — Backend / AI Lead** | LangGraph agent pipeline, RAG vectorizer, Gemini integration, FastAPI, **repo owner** | Python, LangGraph, ChromaDB, Gemini free tier, FastAPI |
| **B — Mobile** | Flutter citizen app, chat UI, en/Tanglish/Singlish, API client | Flutter / Dart |
| **C — Admin Web + Integration/Docs** | React HITL dashboard, API contract glue, ER/architecture/use-case diagrams, demo video, report | React + Vite |

## Golden rules (from AgenTriX rules)
- Free-tier AI only (Gemini free tier). Paid API in product = disqualification.
- Build fresh, **commit often with meaningful messages** (Git history is graded).
- No n8n / no-code. Manual implementation only.
- Final freeze at T+12:00. No commits after. Polishing happens in a separate repo only.

---

## Hour-by-hour

### T+0:00 → T+2:00 — Setup + Interim (all hands)
- **All:** create GitHub repo, push this scaffold, agree the API contract in `API_CONTRACT.md` (freeze it — both frontends depend on it). Submit interim PDF by 10:00 PM.
- **A:** build the Gazette Vectorizer; drop 5–10 real circular PDFs into `backend/data/circulars/`; run `python -m app.rag.vectorizer`; confirm ChromaDB is queryable.
- **B:** `flutter create .`, get the chat screen rendering with the language dropdown (mock replies).
- **C:** `npm install` admin web, get the empty verification queue rendering; start the architecture diagram.

### T+2:00 → T+6:00 — Core pipeline
- **A:** implement Intent → Classifier → Requirements(RAG) → Personalization nodes; wire `/chat`. Get the **DS-vs-Kachcheri record-age routing** working end to end (this is the demo hero).
- **B:** connect chat screen to live `/chat`; handle the `needs_input` clarifying-question loop; show messages.
- **C:** build `PacketCard`; wire `/verifications` list + approve; keep diagrams updated as the schema firms up.

### T+6:00 → T+9:00 — Action + generation
- **A:** Gap-Check Agent + Action Agent Creator↔Evaluator loop on Gemini; heavy prompt engineering for accurate affidavits (Section 27/52) and form pre-fill (B63). Push the `plan` object into responses.
- **B:** render the `plan` as a card — office, officer, checklist, forms, citations. Polish multilingual flows.
- **C:** make the dashboard show drafted docs + citations; test approve flow against real backend.

### T+9:00 → T+11:00 — Integrate, demo, deliverables
- **All:** full integration test across all six services + the older-than-20-years routing case.
- **C:** finalize **ER + architecture + use-case** diagrams; **record 1–2 min demo video** (highlight DS→Kachcheri routing); assemble the Project Report.
- **A/B:** fix integration bugs, remove any hardcoded keys.

### T+11:00 → T+12:00 — Freeze
- **All:** final testing, clean commit messages, confirm `.env` not committed, **final push before T+12:00**.

---

## Definition of done (demo must show)
1. Citizen asks in Tanglish/Singlish → correct service classified.
2. Personalization asks the right clarifying question.
3. Old birth/death record → routed to **District Secretariat (Kachcheri)**; recent → **Divisional Secretariat**.
4. Plan returned with checklist + pre-filled form + citations.
5. Officer approves it on the admin web app (HITL).

## First commands for each person
- **A:** `cd backend && pip install -r requirements.txt && cp .env.example .env` → add key → `uvicorn app.main:app --reload`
- **B:** `cd mobile && flutter create . --org lk.govpath && flutter pub get && flutter run`
- **C:** `cd admin_web && npm install && npm run dev`

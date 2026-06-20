# API Contract (freeze this early — both frontends depend on it)
Base URL: http://localhost:8000

## POST /chat
Drives the agent graph. Stateless per-session via session_id.
Request:
  { "session_id": "uuid", "message": "string", "lang": "en|tanglish|singlish" }
Response:
  {
    "session_id": "uuid",
    "reply": "string",                 // assistant message to show
    "needs_input": true,               // true = ask user the clarifying question
    "service": "birth_cert|nic|...",   // classified service (nullable)
    "plan": {                          // present when complete
      "office": "Divisional Secretariat | District Secretariat (Kachcheri)",
      "officer": "Additional District Registrar",
      "checklist": ["...","..."],
      "forms": [{"name":"B63","url":"/files/b63_filled.pdf"}],
      "citations": [{"title":"...","source":"documents.gov.lk/..."}]
    }
  }

## GET /verifications        -> list packets awaiting officer review (admin web)
## POST /verifications/{id}/approve  body: {"officer":"name"}  -> authorize plan
## GET  /health

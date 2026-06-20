# GovPath — Final-Report Diagrams (grounded in the codebase)

These three diagrams are an exact reconstruction of what is implemented in `backend/`.
Mermaid blocks render natively on GitHub and at https://mermaid.live; the PlantUML block
renders at http://www.plantuml.com/plantuml.

**Pre-rendered PNGs** (drop straight into the report; sources are the `.mmd`/`.puml` files
beside this doc):

| Deliverable | Source | Image |
|---|---|---|
| 1. Architecture / multi-agent flow | `govpath-architecture.mmd` | `govpath-architecture.png` |
| 2a. ER — as-built | `govpath-er-asbuilt.mmd` | `govpath-er-asbuilt.png` |
| 2b. ER — production target | `govpath-er-target.mmd` | `govpath-er-target.png` |
| 3. Use-case | `govpath-usecase.puml` | `govpath-usecase.png` |

![Architecture](govpath-architecture.png)
![ER — as-built](govpath-er-asbuilt.png)
![ER — production target](govpath-er-target.png)
![Use-case](govpath-usecase.png)

Re-render anytime: Mermaid → `https://mermaid.ink/img/<base64-of-source>` or mermaid.live;
PlantUML → Kroki `curl -X POST https://kroki.io/plantuml/png --data-binary @govpath-usecase.puml`.

**Code-alignment map** (so reviewers can trace every node to a file):

| Diagram node | Source | Notes |
|---|---|---|
| `intake`, `intent`, `classifier`, `requirements`, `personalization`, `gap_check`, `form_assistant`, `scheduler`, `action_agent`, `verifier` | `backend/app/graph/agents/*.py` | one `run(state)->state` fn each |
| graph wiring, `fresh`/`resume`/`done`, `wait`/`continue` | `backend/app/graph/graph.py` | `StateGraph` + conditional edges |
| RAG retrieval / ChromaDB `circulars` | `backend/app/rag/retriever.py`, `vectorizer.py` | ingestion is an **offline** script |
| static fallback knowledge | `backend/app/graph/knowledge.py` | used when RAG/LLM unavailable |
| `VERIFICATIONS` queue + HITL | `backend/app/models/store.py`, `backend/app/api/routes.py` | `GET /verifications`, `POST /verifications/{id}/approve` |
| `SESSION` state model | `backend/app/graph/state.py` (`GraphState`) | held in `SESSIONS` dict |

---

## Deliverable 1 — System Architecture & Multi-Agent Flow

> Accurate to `app/graph/graph.py`: a single LangGraph state machine entered at `intake`,
> with conditional routing, a linear action pipeline, the Creator/Evaluator loop **inside**
> `action_agent`, and Human-in-the-Loop happening **after** the verifier queues the packet.

```mermaid
graph TD
    classDef agent fill:#f3f0ff,stroke:#6c5ce7,stroke-width:2px,color:#2d3436;
    classDef db fill:#dfe6e9,stroke:#636e72,stroke-width:2px,color:#2d3436;
    classDef se fill:#ffeaa7,stroke:#fdcb6e,stroke-width:2px,color:#2d3436;
    classDef ext fill:#e3fcef,stroke:#00b894,stroke-width:2px,color:#2d3436;
    classDef sg fill:#f8f9fb,stroke:#a4b0be,stroke-width:1px,stroke-dasharray:5 5;

    %% ---------- Offline ingestion (separate process) ----------
    subgraph OFFLINE["Offline ingestion — python -m app.rag.vectorizer"]
        PDFS["Gazette / circular PDFs<br/>backend/data/circulars"]:::ext --> VEC["Vectorizer<br/>chunk + embed"]:::agent
        VEC --> CHROMA[("ChromaDB<br/>collection: circulars")]:::db
    end
    class OFFLINE sg;

    %% ---------- Runtime turn: POST /chat -> LangGraph ----------
    START(["POST /chat<br/>Flutter app"]):::se --> INTAKE["intake<br/>ingest clarifying answer<br/>into user_context"]:::agent
    INTAKE -. fresh .-> INTENT["intent<br/>en / Tanglish / Singlish"]:::agent
    INTAKE -. resume .-> PERSO
    INTAKE -. done .-> DONE(["reply + plan JSON"]):::se

    INTENT --> CLS["classifier<br/>keyword + LLM -> service"]:::agent
    CLS --> REQ["requirements<br/>RAG retrieval"]:::agent
    CHROMA -. context .-> REQ
    KB["knowledge.py<br/>static fallback"]:::db -. fallback .-> REQ
    REQ --> PERSO["personalization<br/>clarifying Q&A +<br/>DS vs Kachcheri routing"]:::agent

    PERSO -. "wait (needs_input)" .-> DONE
    PERSO -. continue .-> GAP["gap_check<br/>checklist vs owned docs"]:::agent
    GAP --> FORM["form_assistant<br/>pre-fill B63 / K35A -> PDF"]:::agent
    FORM --> SCH["scheduler<br/>office + officer"]:::agent
    SCH --> ACT["action_agent"]:::agent

    %% Creator/Evaluator loop lives INSIDE action_agent (archived birth/death only)
    subgraph LOOP["action_agent internal loop — archived birth/death only"]
        DRAFT["Creator: draft affidavit"]:::agent -->|evaluate| EVAL["Evaluator: PASS or list fixes"]:::agent
        EVAL -->|"revise (x2 max)"| DRAFT
    end
    class LOOP sg;
    ACT -. delegates .-> LOOP

    ACT --> VER["verifier<br/>assemble plan +<br/>queue packet"]:::agent
    VER --> DONE
    VER --> QUEUE[("VERIFICATIONS<br/>in-memory queue")]:::db

    %% ---------- Human-in-the-loop via Admin Web ----------
    QUEUE -. "GET /verifications" .-> OFF["Officer<br/>Admin Web (HITL)"]:::ext
    OFF -. "POST /verifications/{id}/approve" .-> QUEUE
```

---

## Deliverable 2 — Entity / Data Model

### 2a. As-built (what the code actually stores)

> The current build is **stateful in-memory** (`SESSIONS`, `VERIFICATIONS` dicts in
> `app/models/store.py`) plus a **ChromaDB** vector store — no SQL database yet. Fields map
> 1:1 to `GraphState` (`app/graph/state.py`) and the verifier packet.

```mermaid
erDiagram
    SERVICE_INFO ||--o{ SESSION : "classifies"
    SESSION ||--|| USER_CONTEXT : "collects"
    SESSION ||--o| VERIFICATION : "queues on completion"
    VERIFICATION ||--|| PLAN : "wraps"
    PLAN ||--o{ FORM : "includes"
    PLAN ||--o{ DRAFT_DOC : "includes"
    PLAN ||--o{ CITATION : "cites"
    CIRCULAR_CHUNK ||--o{ CITATION : "source of"

    SESSION {
        string session_id PK
        string lang "en, tanglish, singlish"
        string intent
        string service FK "to SERVICE_INFO"
        string office "DS or Kachcheri"
        string officer
        int    record_age_years
        bool   needs_input
        string awaiting "key being asked for"
        bool   completed
        string reply
    }
    USER_CONTEXT {
        string session_id FK
        int    record_age_years
        bool   dual_citizen
        json   documents "docs the citizen has"
    }
    VERIFICATION {
        string verification_id PK
        string session_id FK
        string service
        bool   approved
        string officer "set on approve"
    }
    PLAN {
        string office
        string officer
        json   checklist
    }
    FORM {
        string name "B63, K35A, DRP1, GN-1, DMT-LIC"
        string url "files path to the PDF"
    }
    DRAFT_DOC {
        string type "affidavit"
        string content
    }
    CITATION {
        string title
        string source
    }
    CIRCULAR_CHUNK {
        string chunk_id PK
        string text "embedded chunk"
        string title "metadata"
        string source "metadata"
    }
    SERVICE_INFO {
        string service_key PK
        string label
        string default_office
        string officer
        string form_code
        json   checklist
        json   citation
    }
```

### 2b. Production target (future — relational/SQLite)

> Not implemented in the hackathon build (kept here as the migration target if state moves
> from in-memory dicts to a relational store). Mirrors the handed schema.

```mermaid
erDiagram
    CITIZEN ||--o{ DOCUMENT : "uploads"
    CITIZEN ||--o{ APPLICATION : "submits"
    CIVIC_SERVICE ||--o{ APPLICATION : "categorizes"
    APPLICATION ||--o{ ACTION_OUTPUT : "generates"
    APPLICATION ||--|| APPOINTMENT : "schedules"

    CITIZEN {
        string citizen_id PK
        string nic_number UK
        string full_name
        string residency_address
        string district
        date   d_o_b
    }
    DOCUMENT {
        string document_id PK
        string citizen_id FK
        string file_name
        string file_type
        json   extraction_json
    }
    CIVIC_SERVICE {
        string service_id PK
        string service_name
        string statutory_fee
        string default_authority_tier "DS, Kachcheri"
    }
    APPLICATION {
        string application_id PK
        string citizen_id FK
        string service_id FK
        string current_status
        string jurisdiction_tier
        datetime date_created
    }
    ACTION_OUTPUT {
        string output_id PK
        string application_id FK
        string output_type "Form K35A, Affidavit"
        string compiled_text
        string validation_score
    }
    APPOINTMENT {
        string appointment_id PK
        string application_id FK
        string officer_role
        string office_location
        datetime scheduled_datetime
    }
```

---

## Deliverable 3 — Use-Case Diagram

> Actors and use cases mapped to real features. Syntax fixed from the template
> (`@enduml`, valid `..>` relations). `action_agent`'s affidavit is an **extend** because it
> only fires for archived (>= 20 yr) birth/death records.

```plantuml
@startuml
left to right direction
skinparam packageStyle rectangle
skinparam actorStyle awesome

actor "Citizen" as citizen
actor "Officer\n(Grama Niladhari / DS / Admin Web)" as officer
actor "Scheduled Ingestion" as system

rectangle "GovPath System Boundary" {
  usecase "Converse (en / Tanglish / Singlish)" as UC1
  usecase "Classify civic service" as UC2
  usecase "Retrieve requirements (RAG)" as UC3
  usecase "Answer clarifying questions" as UC4
  usecase "Route DS vs Kachcheri" as UC5
  usecase "Build document checklist" as UC6
  usecase "Pre-fill form PDF" as UC7
  usecase "Draft & self-verify affidavit" as UC8
  usecase "Return Wasted-Trip-Prevention Plan" as UC9
  usecase "Review & approve packet (HITL)" as UC10
  usecase "Ingest & vectorize gazettes" as UC11
}

citizen --> UC1
citizen --> UC4
citizen --> UC9
officer --> UC10
system  --> UC11

UC1 ..> UC2 : <<include>>
UC2 ..> UC3 : <<include>>
UC4 ..> UC5 : <<include>>
UC3 ..> UC6 : <<include>>
UC6 ..> UC7 : <<include>>
UC8 ..> UC5 : <<extend>>
UC7 ..> UC9 : <<include>>
UC9 ..> UC10 : <<include>>

note bottom of UC11
  Populates the ChromaDB
  "circulars" store read by UC3
end note
@enduml
```

---

### Honesty notes for the pitch (defensible vs. over-claiming)

- The **action pipeline is linear**, not a 3-way fan-out — `gap_check -> form_assistant ->
  scheduler -> action_agent`. (Easy to defend; matches `graph.py`.)
- The **Creator/Evaluator loop** is real but lives **inside** `action_agent` (a draft ->
  evaluate -> revise loop, max 2 iterations) and runs only for archived birth/death records.
- **HITL** is a real REST gate (`/verifications` + `/approve`) that happens **after** the
  verifier queues the packet — the officer authorizes from the Admin Web.
- **Persistence** is in-memory dicts + ChromaDB today; the relational ER (2b) is the stated
  next step, not a current claim.

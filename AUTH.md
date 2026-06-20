# GovPath — Authentication & RBAC

Self-hosted JWT auth with role-based access control across the backend, admin web, and
Flutter app. Verified end-to-end (curl + live browser). Plan: see the approved design notes.

## Roles & scope
Authorization is **data-driven**: a `role` label plus an explicit scope (`services` +
`jurisdiction`). The object-level rule for every queue read / approve:

```
can_act(officer, packet) =
    packet.service in officer.services
    AND (officer.jurisdiction is None OR officer.jurisdiction == packet.plan.office)
# SUPER_ADMIN bypasses all scoping.
```

| Role | Services | Jurisdiction | Manage users |
|---|---|---|---|
| `SUPER_ADMIN` | all | all | ✅ |
| `REGISTRAR` | birth_cert, death_cert | DS **or** Kachcheri | ❌ |
| `DRP_OFFICER` | nic | all | ❌ |
| `IMMIGRATION_OFFICER` | passport | all | ❌ |
| `GRAMA_NILADHARI` | gn_cert | all | ❌ |
| `DMT_EXAMINER` | license | all | ❌ |
| `CITIZEN` | — (uses /chat only) | — | ❌ |

## Seeded demo accounts
Create with `python -m app.auth.seed` (run from `backend/`). Password for all demo
officers is **`changeme123`**. **Change before any real deployment.**

| NIC | Role | Scope |
|---|---|---|
| `199000000000` | SUPER_ADMIN | all (Super-Admin) |
| `700000000001` | REGISTRAR | birth/death · Divisional Secretariat |
| `700000000002` | REGISTRAR | birth/death · District Secretariat (Kachcheri) |
| `700000000003` | DRP_OFFICER | nic |
| `700000000004` | IMMIGRATION_OFFICER | passport |
| `700000000005` | GRAMA_NILADHARI | gn_cert |
| `700000000006` | DMT_EXAMINER | license |

The Super-Admin (NIC/password/name from `SUPERADMIN_*` env) is also auto-created on first
server startup even without running the seed.

## Endpoints
| Method | Path | Who | Purpose |
|---|---|---|---|
| POST | `/auth/register` | public | Citizen self-registration (NIC + password) |
| POST | `/auth/login` | public | NIC + password → `{access_token, user}` |
| GET | `/auth/me` | any auth | Current identity + scope |
| POST | `/auth/officers` | SUPER_ADMIN | Create officer (role + services + jurisdiction) |
| GET | `/auth/officers` | SUPER_ADMIN | List officers |
| PATCH | `/auth/officers/{id}` | SUPER_ADMIN | Update scope / deactivate |
| POST | `/chat` | CITIZEN | Agent graph (Bearer required) |
| GET | `/verifications` | officer | **Scoped** pending queue |
| POST | `/verifications/{id}/approve` | officer | 403 if out of scope; approver taken from JWT |

## How each client authenticates
- **Backend:** JWT (HS256, `sub=user.id`, 12 h). `get_current_user` loads the user from
  SQLite **per request**, so deactivating / re-scoping an officer takes effect immediately.
  Passwords are bcrypt-hashed. Approver identity is always the JWT, never the request body.
- **admin_web (Next 16):** officer logs in at `/login`; the JWT is stored in an **httpOnly
  cookie** (set by a server action). `proxy.ts` (Next 16's renamed middleware) redirects
  unauthenticated requests to `/login`. The queue + `/admin/officers` are server components
  that forward the cookie as a Bearer token. `/admin/officers` is gated to Super-Admins
  (page redirect + backend 403).
- **Flutter:** citizen registers/logs in (NIC + password); the JWT lives in
  `flutter_secure_storage` and is attached to `/chat`. A 401 clears the token and routes
  back to the login screen.

## Config (backend/.env)
```
JWT_SECRET=e550686d496747bf917e65f7910fd3f4c510b405ab06b9113b83f7f4285e0443          # change in prod
ACCESS_TOKEN_EXPIRE_MINUTES=720
DATABASE_URL=sqlite:///./govpath.db      # git-ignored
SUPERADMIN_NIC=199000000000
SUPERADMIN_PASSWORD=changeme123
SUPERADMIN_NAME=System Administrator
```
admin_web reads `BACKEND_URL` (default `http://localhost:8000`).

## Run
```bash
# backend
cd backend && uv pip install -r requirements.txt
python -m app.auth.seed           # creates super-admin + 6 demo officers
uvicorn app.main:app --reload

# admin web
cd admin_web && npm install && BACKEND_URL=http://localhost:8000 npm run dev   # :3000

# flutter
cd mobile && flutter pub get && flutter run
```

## Verified behaviour
- `/chat` without a token → **401**; citizen hitting `/verifications` → **403**.
- DS Registrar sees only Divisional-Secretariat birth/death packets; Kachcheri Registrar
  sees only the archived ones; Immigration sees only passport — confirmed in the browser.
- DS Registrar approving a Kachcheri packet → **403**; in-scope approve → 200, packet
  stamped with the officer's name from the JWT, then drops out of the queue.
- Super-Admin sees all packets, has the **Officers** page, and can create / deactivate
  officers; a citizen creating an officer → **403**.

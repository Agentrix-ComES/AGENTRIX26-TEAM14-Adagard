"""Seed the user store. Owner: Person A.

- ``ensure_super_admin()`` runs on startup: creates the Super-Admin from env if absent.
- ``seed_demo_officers()`` (run via ``python -m app.auth.seed``) creates the 7-account demo
  roster that showcases each officer purpose, including the DS vs Kachcheri Registrar split.

All demo officers share the password 'changeme123' (override via SUPERADMIN_PASSWORD only
for the super-admin). Change these before any real deployment.
"""
from dotenv import load_dotenv

load_dotenv()  # ensure DATABASE_URL (Postgres) is in effect when run standalone

from sqlmodel import Session, select

from app.db import engine, init_db
from app.models.user import User
from app.auth.security import hash_password
from app.auth import rbac
from app.config import SUPERADMIN_NIC, SUPERADMIN_PASSWORD, SUPERADMIN_NAME
from app.graph import knowledge

DEMO_PASSWORD = "changeme123"

# (nic, full_name, role, services(None=role default), jurisdiction)
DEMO_OFFICERS = [
    ("700000000001", "D. Silva (DS Registrar)", rbac.Role.REGISTRAR, None,
     knowledge.DIVISIONAL_SECRETARIAT),
    ("700000000002", "K. Rajan (Kachcheri Registrar)", rbac.Role.REGISTRAR, None,
     knowledge.DISTRICT_SECRETARIAT),
    ("700000000003", "M. Fernando (DRP Officer)", rbac.Role.DRP_OFFICER, None, None),
    ("700000000004", "S. Perera (Immigration Officer)", rbac.Role.IMMIGRATION_OFFICER, None, None),
    ("700000000005", "G. Bandara (Grama Niladhari)", rbac.Role.GRAMA_NILADHARI, None, None),
    ("700000000006", "T. Jayasuriya (DMT Examiner)", rbac.Role.DMT_EXAMINER, None, None),
]


def _get(db: Session, nic: str) -> User | None:
    return db.exec(select(User).where(User.nic == nic)).first()


def ensure_super_admin() -> None:
    init_db()
    with Session(engine) as db:
        if _get(db, SUPERADMIN_NIC):
            return
        db.add(User(
            kind="officer", nic=SUPERADMIN_NIC, full_name=SUPERADMIN_NAME,
            hashed_password=hash_password(SUPERADMIN_PASSWORD),
            role=rbac.Role.SUPER_ADMIN.value,
            services=",".join(knowledge.SERVICES), jurisdiction=None,
        ))
        db.commit()
        print(f"[seed] created Super-Admin (NIC {SUPERADMIN_NIC})")


def seed_demo_officers() -> None:
    init_db()
    ensure_super_admin()
    with Session(engine) as db:
        created = 0
        for nic, name, role, services, jurisdiction in DEMO_OFFICERS:
            if _get(db, nic):
                continue
            svc = services if services is not None else rbac.default_services_for(role.value)
            db.add(User(
                kind="officer", nic=nic, full_name=name,
                hashed_password=hash_password(DEMO_PASSWORD), role=role.value,
                services=",".join(svc), jurisdiction=jurisdiction,
            ))
            created += 1
        db.commit()
        print(f"[seed] created {created} demo officer(s); password '{DEMO_PASSWORD}'")


if __name__ == "__main__":
    seed_demo_officers()
    print("[seed] done. Super-Admin + demo officer roster ready.")

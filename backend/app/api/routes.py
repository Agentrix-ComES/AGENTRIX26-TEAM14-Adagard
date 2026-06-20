"""REST routes — thin layer over the agent graph. Owner: Person A.
Implements the endpoints in /API_CONTRACT.md, behind RBAC, persisting to Postgres."""
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from app.models.schemas import ChatRequest, ChatResponse, ApproveRequest
from app.models.user import User
from app.models.verification import Verification
from app.models.chat import ChatSession, ChatMessage
from app.graph.graph import run_turn
from app.db import get_session
from app.auth.deps import require_citizen, require_officer
from app.auth import rbac

router = APIRouter()


@router.post("/chat", response_model=ChatResponse)
def chat(req: ChatRequest, citizen: User = Depends(require_citizen),
         db: Session = Depends(get_session)):
    return run_turn(req.session_id, req.message, req.lang, citizen.id, db)


def _packet_out(v: Verification) -> dict:
    return {
        "id": v.vid,
        "session_id": v.session_id,
        "service": v.service,
        "plan": v.plan,
        "approved": v.approved,
        "officer": v.officer_name,
    }


@router.get("/verifications")
def list_verifications(officer: User = Depends(require_officer),
                       db: Session = Depends(get_session)):
    """Pending packets the officer is scoped to see (Super-Admin sees all)."""
    rows = db.exec(select(Verification).where(Verification.approved == False)).all()  # noqa: E712
    return [_packet_out(v) for v in rows if rbac.can_act(officer, v.service, v.office)]


@router.post("/verifications/{vid}/approve")
def approve(vid: str, officer: User = Depends(require_officer),
            db: Session = Depends(get_session), body: ApproveRequest | None = None):
    v = db.exec(select(Verification).where(Verification.vid == vid)).first()
    if v is None:
        raise HTTPException(status_code=404, detail="verification not found")
    if not rbac.can_act(officer, v.service, v.office):
        raise HTTPException(status_code=403, detail="packet is outside your service/jurisdiction")
    v.approved = True
    v.officer_name = officer.full_name          # server-trusted identity from the JWT
    v.officer_nic = officer.nic
    v.approved_at = datetime.now(timezone.utc)
    db.add(v)
    db.commit()
    return {"ok": True}


# --- Citizen chat history (persistent) --------------------------------------------
@router.get("/chats")
def my_chats(citizen: User = Depends(require_citizen), db: Session = Depends(get_session)):
    rows = db.exec(
        select(ChatSession).where(ChatSession.user_id == citizen.id)
        .order_by(ChatSession.updated_at.desc())
    ).all()
    return [{"session_id": c.session_id, "service": c.service, "office": c.office,
             "completed": c.completed, "updated_at": c.updated_at} for c in rows]


@router.get("/chats/{session_id}")
def my_chat(session_id: str, citizen: User = Depends(require_citizen),
            db: Session = Depends(get_session)):
    cs = db.exec(select(ChatSession).where(ChatSession.session_id == session_id)).first()
    if not cs or cs.user_id != citizen.id:
        raise HTTPException(status_code=404, detail="chat not found")
    msgs = db.exec(
        select(ChatMessage).where(ChatMessage.session_id == session_id)
        .order_by(ChatMessage.created_at)
    ).all()
    return {
        "session_id": session_id, "service": cs.service, "office": cs.office,
        "completed": cs.completed, "plan": (cs.state or {}).get("plan"),
        "messages": [{"role": m.role, "content": m.content, "plan": m.plan,
                      "created_at": m.created_at} for m in msgs],
    }

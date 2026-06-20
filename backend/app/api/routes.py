"""REST routes — thin layer over the agent graph. Owner: Person A.
Implements the endpoints defined in /API_CONTRACT.md."""
from fastapi import APIRouter, HTTPException

from app.models.schemas import ChatRequest, ChatResponse, ApproveRequest
from app.graph.graph import run_turn
from app.models.store import VERIFICATIONS

router = APIRouter()


@router.post("/chat", response_model=ChatResponse)
def chat(req: ChatRequest):
    return run_turn(req.session_id, req.message, req.lang)


@router.get("/verifications")
def list_verifications():
    """Packets awaiting officer review (pending only) for the admin portal queue."""
    return [v for v in VERIFICATIONS.values() if not v["approved"]]


@router.post("/verifications/{vid}/approve")
def approve(vid: str, body: ApproveRequest):
    packet = VERIFICATIONS.get(vid)
    if packet is None:
        raise HTTPException(status_code=404, detail="verification not found")
    packet["approved"] = True
    packet["officer"] = body.officer
    return {"ok": True}

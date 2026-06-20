"""REST routes — thin layer over the agent graph. Owner: Person A.
Implements the endpoints defined in /API_CONTRACT.md."""
from fastapi import APIRouter
from app.models.schemas import ChatRequest, ChatResponse
from app.graph.graph import run_turn
from app.models.store import VERIFICATIONS

router = APIRouter()

@router.post("/chat", response_model=ChatResponse)
def chat(req: ChatRequest):
    return run_turn(req.session_id, req.message, req.lang)

@router.get("/verifications")
def list_verifications():
    return [v for v in VERIFICATIONS.values() if not v["approved"]]

@router.post("/verifications/{vid}/approve")
def approve(vid: str, body: dict):
    VERIFICATIONS[vid]["approved"] = True
    VERIFICATIONS[vid]["officer"] = body.get("officer")
    return {"ok": True}

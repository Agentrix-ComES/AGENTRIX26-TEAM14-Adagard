"""Full agentic-flow endpoints: request lifecycle, documents, submit, officer scheduling.
Owner: Person A. Documents live in Supabase Storage; everything persists in Supabase Postgres.
"""
import io
from datetime import datetime, time

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from sqlmodel import Session, select

from app.db import get_session
from app.models.user import User
from app.models.chat import ChatSession
from app.models.request_flow import (
    Request, Document, OfficerAvailability, Appointment, VerificationPacket,
)
from app.auth.deps import require_citizen, require_officer
from app.auth import rbac
from app.graph import knowledge
from app.graph.action_subgraph import run_action
from app.services import request_meta, flow, appointments, supabase_storage as storage

router = APIRouter()

_MIME = {"pdf": "application/pdf", "png": "image/png", "jpg": "image/jpeg",
         "jpeg": "image/jpeg", "webp": "image/webp"}


def _mime(name: str | None) -> str:
    ext = (name or "").rsplit(".", 1)[-1].lower()
    return _MIME.get(ext, "application/pdf")


def _owned_request(db: Session, rid: str, user_id: int) -> Request:
    req = db.get(Request, rid)
    if not req or req.user_id != user_id:
        raise HTTPException(404, "request not found")
    return req


def _generate_form(req: Request, name: str, plan: dict, extracted: dict) -> dict | None:
    """Render a pre-filled form PDF and store it in the bucket; returns {name, storage_path}."""
    try:
        from reportlab.lib.pagesizes import A4
        from reportlab.lib.units import mm
        from reportlab.pdfgen import canvas
        buf = io.BytesIO()
        c = canvas.Canvas(buf, pagesize=A4)
        w, h = A4
        y = h - 25 * mm
        c.setFont("Helvetica-Bold", 15); c.drawString(20 * mm, y, f"{name} — {req.service}"); y -= 10 * mm
        c.setFont("Helvetica", 10)
        c.drawString(20 * mm, y, f"Office: {plan.get('office', '')}"); y -= 7 * mm
        for k, v in (extracted or {}).items():
            c.drawString(24 * mm, y, f"{k}: {v}"); y -= 6 * mm
        c.showPage(); c.save()
        path = storage.object_path(str(req.id), f"{name}.pdf")
        storage.upload(path, buf.getvalue(), "application/pdf")
        return {"name": name, "storage_path": path}
    except Exception as exc:
        print(f"[requests] form gen failed: {exc}")
        return None


# ---------- create ----------
class CreateRequest(BaseModel):
    service: str
    session_id: str | None = None


@router.post("/requests")
def create_request(body: CreateRequest, citizen: User = Depends(require_citizen),
                   db: Session = Depends(get_session)):
    if body.service not in knowledge.SERVICES:
        raise HTTPException(400, "unknown service")
    office = officer = None
    checklist: list = []
    citations: list = []
    service = body.service
    if body.session_id:
        cs = db.exec(select(ChatSession).where(ChatSession.session_id == body.session_id)).first()
        if cs and cs.user_id == citizen.id:
            p = (cs.state or {}).get("plan") or {}
            office, officer = p.get("office"), p.get("officer")
            checklist, citations = p.get("checklist", []), p.get("citations", [])
            service = cs.service or service
    plan = request_meta.build_plan(service, office, officer, checklist, citations)
    req = Request(user_id=citizen.id, session_id=body.session_id, service=service,
                  status="draft", plan=plan)
    db.add(req); db.commit(); db.refresh(req)
    return {"id": str(req.id), "service": service, "status": req.status, "plan": plan}


# ---------- upload ----------
@router.post("/requests/{rid}/documents")
async def upload_document(rid: str, file: UploadFile = File(...), type: str = Form(None),
                          citizen: User = Depends(require_citizen), db: Session = Depends(get_session)):
    req = _owned_request(db, rid, citizen.id)
    if not storage.configured():
        raise HTTPException(503, "document storage not configured (SUPABASE_SECRET_KEY missing)")
    data = await file.read()
    path = storage.object_path(str(req.id), file.filename or "upload")
    storage.upload(path, data, file.content_type or _mime(file.filename))
    doc = Document(request_id=req.id, type=type, filename=file.filename,
                   storage_path=path, status="uploaded")
    db.add(doc); db.commit(); db.refresh(doc)
    return {"id": str(doc.id), "type": doc.type, "filename": doc.filename, "status": doc.status}


# ---------- submit ----------
@router.post("/requests/{rid}/submit")
def submit_request(rid: str, citizen: User = Depends(require_citizen),
                   db: Session = Depends(get_session)):
    req = _owned_request(db, rid, citizen.id)
    plan = req.plan or {}
    docs = db.exec(select(Document).where(Document.request_id == req.id)).all()

    # 1. multimodal extraction per document
    for d in docs:
        if d.extracted is None:
            try:
                raw = storage.download(d.storage_path)
                ext = flow.extract_document(raw, _mime(d.filename), d.type or "")
            except Exception as exc:
                ext = {"fields": {}, "readable": False, "note": f"fetch failed: {str(exc)[:80]}"}
            d.extracted = ext
            d.status = "matched" if ext.get("readable") else "unreadable"
            db.add(d)
    db.commit()

    # 2. gap-check
    gap = flow.run_gap_check(plan.get("required_documents", []), docs)
    if not gap["complete"]:
        req.status = "needs_docs"; db.add(req); db.commit()
        return {"id": str(req.id), "status": "needs_docs", "gap_check": gap}

    extracted_all: dict = {}
    for d in docs:
        extracted_all.update((d.extracted or {}).get("fields", {}))

    # 3. branch — forms and/or in-person appointment
    generated_forms = [gf for f in plan.get("forms_needed", [])
                       if (gf := _generate_form(req, f, plan, extracted_all))]
    appointment = None
    status = "ready"
    if plan.get("in_person_required"):
        appointment = appointments.auto_book(db, req.id, req.service, plan.get("office"))
        status = "needs_appointment" if appointment else "ready"

    # 4. Action sub-graph (Creator/Evaluator) — only runs with all docs present
    action = run_action(req.service, "; ".join(plan.get("checklist", [])), extracted_all)
    if action.get("draft"):
        generated_forms.append({"name": f"{req.service}_draft", "inline": action["draft"]})

    # 5. Verifier packet + AI confidence
    conf = flow.verification_confidence(plan, docs, gap)
    packet = db.exec(select(VerificationPacket).where(VerificationPacket.request_id == req.id)).first()
    if packet is None:
        packet = VerificationPacket(request_id=req.id)
        db.add(packet)
    packet.service, packet.office = req.service, plan.get("office")
    packet.confidence = conf["confidence"]
    packet.extracted_fields = conf["extracted_fields"]
    packet.checks, packet.flags, packet.summary = conf["checks"], conf["flags"], conf["summary"]
    packet.gap_check, packet.generated_forms, packet.appointment = gap, generated_forms, appointment
    packet.status = "ready"
    req.status = status
    db.add(req); db.commit()
    return {"id": str(req.id), "status": status, "gap_check": gap, "appointment": appointment,
            "generated_forms": [{"name": g["name"]} for g in generated_forms],
            "verification": {"confidence": conf["confidence"], "summary": conf["summary"],
                             "flags": conf["flags"]}}


# ---------- full packet ----------
def assemble_packet(db: Session, req: Request) -> dict:
    citizen = db.get(User, req.user_id)
    docs = db.exec(select(Document).where(Document.request_id == req.id)).all()
    packet = db.exec(select(VerificationPacket).where(VerificationPacket.request_id == req.id)).first()
    sign = storage.signed_url if storage.configured() else (lambda p: None)
    forms = []
    for g in (packet.generated_forms if packet else []):
        if g.get("storage_path"):
            forms.append({"name": g["name"], "signed_url": sign(g["storage_path"])})
        else:
            forms.append({"name": g["name"], "content": g.get("inline")})
    return {
        "id": str(req.id), "user_id": req.user_id, "service": req.service, "status": req.status,
        "citizen": {"name": citizen.full_name if citizen else None, "nic": citizen.nic if citizen else None},
        "plan": req.plan,
        "documents": [{"id": str(d.id), "type": d.type, "filename": d.filename,
                       "signed_url": sign(d.storage_path), "status": d.status,
                       "extracted": (d.extracted or {}).get("fields", {})} for d in docs],
        "gap_check": packet.gap_check if packet else None,
        "generated_forms": forms,
        "appointment": packet.appointment if packet else None,
        "verification": {"confidence": packet.confidence, "extracted_fields": packet.extracted_fields,
                         "checks": packet.checks, "flags": packet.flags, "summary": packet.summary}
        if packet else None,
        "reject_reason": packet.reject_reason if packet else None,
    }


@router.get("/requests/{rid}")
def get_request(rid: str, citizen: User = Depends(require_citizen), db: Session = Depends(get_session)):
    req = _owned_request(db, rid, citizen.id)
    return assemble_packet(db, req)


@router.get("/files/{document_id}")
def file_signed_url(document_id: str, user: User = Depends(require_citizen),
                    db: Session = Depends(get_session)):
    doc = db.get(Document, document_id)
    if not doc:
        raise HTTPException(404, "document not found")
    req = db.get(Request, doc.request_id)
    if not req or req.user_id != user.id:
        raise HTTPException(403, "not permitted")
    if not storage.configured():
        raise HTTPException(503, "storage not configured")
    return {"signed_url": storage.signed_url(doc.storage_path)}


# ---------- officer scheduling ----------
class Slot(BaseModel):
    day_of_week: int
    start_time: str           # "09:00"
    end_time: str             # "12:00"
    slot_minutes: int = 30


@router.get("/officer/availability")
def get_availability(officer: User = Depends(require_officer), db: Session = Depends(get_session)):
    rows = db.exec(select(OfficerAvailability).where(OfficerAvailability.officer_id == officer.id)).all()
    return [{"day_of_week": r.day_of_week, "start_time": r.start_time.strftime("%H:%M"),
             "end_time": r.end_time.strftime("%H:%M"), "slot_minutes": r.slot_minutes} for r in rows]


@router.post("/officer/availability")
def set_availability(slots: list[Slot], officer: User = Depends(require_officer),
                     db: Session = Depends(get_session)):
    for r in db.exec(select(OfficerAvailability).where(OfficerAvailability.officer_id == officer.id)).all():
        db.delete(r)
    for s in slots:
        db.add(OfficerAvailability(
            officer_id=officer.id, day_of_week=s.day_of_week,
            start_time=time.fromisoformat(s.start_time), end_time=time.fromisoformat(s.end_time),
            slot_minutes=s.slot_minutes))
    db.commit()
    return {"ok": True, "slots": len(slots)}


@router.get("/officer/appointments")
def officer_appointments(officer: User = Depends(require_officer), db: Session = Depends(get_session)):
    rows = db.exec(select(Appointment).where(Appointment.officer_id == officer.id,
                                             Appointment.status == "booked")
                   .order_by(Appointment.slot_start)).all()
    out = []
    for a in rows:
        req = db.get(Request, a.request_id)
        cit = db.get(User, req.user_id) if req else None
        out.append({"id": str(a.id), "slot_start": a.slot_start.isoformat(),
                    "slot_end": a.slot_end.isoformat(), "service": req.service if req else None,
                    "citizen": cit.full_name if cit else None})
    return out

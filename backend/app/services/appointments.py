"""Appointment scheduling: officer weekly availability minus booked → next free slot.
Owner: Person A.
"""
from datetime import datetime, timedelta, timezone

from sqlmodel import Session, select

from app.models.user import User
from app.models.request_flow import OfficerAvailability, Appointment


def _pick_officer(db: Session, service: str, office: str | None) -> User | None:
    """First active officer scoped to this service (and office tier, if set)."""
    from app.auth import rbac
    officers = db.exec(select(User).where(User.kind == "officer", User.is_active == True)).all()  # noqa: E712
    for o in officers:
        if rbac.is_super_admin(o):
            continue
        if rbac.can_act(o, service, office):
            return o
    return None


def next_free_slot(db: Session, officer_id: int, horizon_days: int = 14):
    """Walk forward day-by-day through the officer's weekly availability, returning the
    first slot not already booked. Returns (slot_start, slot_end) or None."""
    avail = db.exec(select(OfficerAvailability).where(OfficerAvailability.officer_id == officer_id)).all()
    if not avail:
        return None
    booked = {
        a.slot_start.replace(tzinfo=None)
        for a in db.exec(select(Appointment).where(
            Appointment.officer_id == officer_id, Appointment.status == "booked")).all()
    }
    now = datetime.now(timezone.utc).replace(tzinfo=None, second=0, microsecond=0)
    for day in range(horizon_days):
        d = (now + timedelta(days=day)).date()
        dow = d.weekday()  # 0=Mon
        for a in [x for x in avail if x.day_of_week == dow]:
            t = datetime.combine(d, a.start_time)
            end_of_window = datetime.combine(d, a.end_time)
            step = timedelta(minutes=a.slot_minutes or 30)
            while t + step <= end_of_window:
                if t > now and t not in booked:
                    return t, t + step
                t += step
    return None


def auto_book(db: Session, request_id, service: str, office: str | None):
    """Find an in-scope officer + their next free slot, persist an Appointment."""
    officer = _pick_officer(db, service, office)
    if not officer:
        return None
    slot = next_free_slot(db, officer.id)
    if not slot:
        return None
    appt = Appointment(request_id=request_id, officer_id=officer.id,
                       slot_start=slot[0], slot_end=slot[1], status="booked")
    db.add(appt)
    db.flush()
    return {"slot_start": slot[0].isoformat(), "slot_end": slot[1].isoformat(),
            "officer": officer.full_name, "officer_id": officer.id}

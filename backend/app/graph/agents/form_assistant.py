"""Form/Letter Assistant — pre-fills the application form. Owner: Person A.

Generates a real, downloadable PDF (via reportlab) pre-filled with the applicant's
context and the document checklist, writes it under the served /files directory, and
returns its URL in plan.forms. If reportlab is unavailable or rendering fails it falls
back to a plain-text artefact at the same basename so the flow never breaks.
"""
import os

from app.graph.state import GraphState
from app.graph import knowledge
from app.storage import FILES_DIR


def _slug(session_id: str) -> str:
    return (session_id or "anon").replace("-", "")[:8]


def _render_pdf(path: str, title: str, fields: list[tuple[str, str]], checklist: list[str]) -> bool:
    try:
        from reportlab.lib.pagesizes import A4
        from reportlab.lib.units import mm
        from reportlab.pdfgen import canvas
    except Exception:
        return False
    try:
        c = canvas.Canvas(path, pagesize=A4)
        width, height = A4
        y = height - 25 * mm
        c.setFont("Helvetica-Bold", 15)
        c.drawString(20 * mm, y, title)
        y -= 6 * mm
        c.setFont("Helvetica-Oblique", 8)
        c.drawString(20 * mm, y, "GovPath draft — review before submission. Not an official document.")
        y -= 12 * mm

        c.setFont("Helvetica-Bold", 11)
        c.drawString(20 * mm, y, "Applicant details")
        y -= 7 * mm
        c.setFont("Helvetica", 10)
        for label, value in fields:
            c.drawString(24 * mm, y, f"{label}: {value}")
            y -= 6 * mm

        y -= 4 * mm
        c.setFont("Helvetica-Bold", 11)
        c.drawString(20 * mm, y, "Documents to attach")
        y -= 7 * mm
        c.setFont("Helvetica", 10)
        for item in checklist:
            c.drawString(24 * mm, y, f"[  ]  {item}")
            y -= 6 * mm
            if y < 25 * mm:
                c.showPage(); y = height - 25 * mm; c.setFont("Helvetica", 10)
        c.showPage()
        c.save()
        return True
    except Exception as exc:
        print(f"[form_assistant] PDF render failed: {exc}")
        return False


def _render_txt(path: str, title: str, fields: list[tuple[str, str]], checklist: list[str]) -> None:
    lines = [title, "GovPath draft — review before submission.", "", "Applicant details:"]
    lines += [f"  {k}: {v}" for k, v in fields]
    lines += ["", "Documents to attach:"]
    lines += [f"  [ ] {c}" for c in checklist]
    with open(path, "w", encoding="utf-8") as fh:
        fh.write("\n".join(lines))


def run(state: GraphState) -> GraphState:
    svc = state.get("service")
    info = knowledge.info(svc)
    form_name = info["form"]

    ctx = state.get("user_context", {})
    fields = [
        ("Service", info["label"]),
        ("Form", form_name),
        ("Office", state.get("office") or info["office"]),
    ]
    if "record_age_years" in ctx:
        fields.append(("Record age (years)", str(ctx["record_age_years"])))
    if "dual_citizen" in ctx:
        fields.append(("Dual citizen", "Yes" if ctx["dual_citizen"] else "No"))

    base = f"{form_name}_{_slug(state.get('session_id', ''))}"
    pdf_path = os.path.join(FILES_DIR, f"{base}.pdf")
    checklist = state.get("checklist", [])
    title = f"{form_name} — {info['label']}"

    if _render_pdf(pdf_path, title, fields, checklist):
        url = f"/files/{base}.pdf"
    else:
        _render_txt(os.path.join(FILES_DIR, f"{base}.txt"), title, fields, checklist)
        url = f"/files/{base}.txt"

    state.setdefault("forms", []).append({"name": form_name, "url": url})
    return state

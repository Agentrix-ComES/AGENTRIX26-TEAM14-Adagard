"""Document-flow logic: multimodal extraction, gap-check, AI verification confidence.
Owner: Person A. All LLM calls degrade gracefully so the flow never hard-fails.
"""
import os
import re
import json

import google.generativeai as genai

from app.graph.agents._llm import ask


def extract_document(data: bytes, content_type: str, hint: str = "") -> dict:
    """Gemini multimodal read of one uploaded document → identity fields. Best-effort."""
    try:
        model = genai.GenerativeModel(os.getenv("LLM_MODEL", "gemini-2.5-flash"))
        prompt = (
            f"You are reading a Sri Lankan civic document (expected type: {hint or 'identity document'}). "
            "Extract only the fields visibly present as a flat JSON object using keys from: "
            "name, nic, date_of_birth, address, document_type, issuing_office, serial_no, dates. "
            "Reply with ONLY a JSON object, no prose."
        )
        resp = model.generate_content([prompt, {"mime_type": content_type, "data": data}])
        txt = (resp.text or "").strip()
        m = re.search(r"\{.*\}", txt, re.S)
        fields = json.loads(m.group()) if m else {}
        fields = {k: v for k, v in fields.items() if v}
        return {"fields": fields, "readable": bool(fields), "note": "" if fields else "no fields read"}
    except Exception as exc:
        return {"fields": {}, "readable": False, "note": f"unreadable ({str(exc)[:80]})"}


def run_gap_check(required_documents: list, documents: list) -> dict:
    """COMPLETE / MISSING against the mandatory required-document types."""
    have = {d.type for d in documents if d.type}
    missing = [rd["type"] for rd in required_documents
               if rd.get("mandatory") and rd["type"] not in have]
    complete = not missing
    return {
        "complete": complete,
        "missing": missing,
        "notes": "All mandatory documents provided."
                 if complete else f"Missing mandatory documents: {', '.join(missing)}",
    }


def verification_confidence(plan: dict, documents: list, gap: dict) -> dict:
    """AI verification confidence (Gemini consistency judgement, NOT forgery detection).

    Returns {confidence 0-100, checks, flags, extracted_fields, summary}.
    """
    checks = [{"name": "All mandatory documents uploaded", "passed": gap["complete"]}]
    readable = [d for d in documents if (d.extracted or {}).get("fields")]
    checks.append({"name": "Uploaded documents are machine-readable",
                   "passed": bool(documents) and len(readable) == len(documents)})

    # cross-document name consistency
    names = {str((d.extracted or {}).get("fields", {}).get("name", "")).strip().lower()
             for d in readable}
    names.discard("")
    name_consistent = len(names) <= 1
    if len(readable) > 1:
        checks.append({"name": "Applicant name consistent across documents", "passed": name_consistent})

    fields_blob = json.dumps([d.extracted.get("fields", {}) for d in readable])[:1500]
    flags, summary = [], ""
    verdict = ask(
        "You are an AI document-verification assistant for Sri Lankan civic services. "
        f"Required documents: {json.dumps([r['type'] for r in plan.get('required_documents', [])])}. "
        f"Gap-check: {json.dumps(gap)}. Extracted fields per uploaded doc: {fields_blob}. "
        "Judge internal consistency only (this is an AI consistency confidence, not forgery detection). "
        "Reply with JSON: {\"confidence\":0-100, \"flags\":[...], \"summary\":\"one line\"}."
    )
    try:
        m = re.search(r"\{.*\}", verdict, re.S)
        j = json.loads(m.group()) if m else {}
        flags = j.get("flags", []) or []
        summary = j.get("summary", "") or ""
        llm_conf = int(j.get("confidence", -1))
    except Exception:
        llm_conf = -1

    passed = sum(1 for c in checks if c["passed"])
    base = round(100 * passed / max(1, len(checks)))
    confidence = base if llm_conf < 0 else round(0.5 * base + 0.5 * llm_conf)
    if not summary:
        summary = ("Documents complete and consistent." if gap["complete"]
                   else f"Incomplete: {gap['notes']}")
    extracted = {}
    for d in readable:
        extracted.update(d.extracted.get("fields", {}))
    return {"confidence": confidence, "checks": checks, "flags": flags,
            "extracted_fields": extracted, "summary": summary}

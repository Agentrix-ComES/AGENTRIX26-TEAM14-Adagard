"""Per-service request-flow metadata: required documents, forms, in-person rule. Owner: Person A.

Drives steps 3/6 of the flow — the structured required-document checklist returned to the
citizen, and whether the request needs a duly-filled form vs an in-person officer visit.
"""
from app.graph import knowledge

# in_person_required services need a counter visit (biometrics / test / interview).
META = {
    "birth_cert": {
        "required_documents": [
            {"type": "nic", "label": "Applicant's National Identity Card", "mandatory": True},
            {"type": "birth_details", "label": "Registered name, date and place of birth", "mandatory": True},
            {"type": "affidavit", "label": "Sworn affidavit (archived records ≥ 20 yrs)", "mandatory": False},
        ],
        "forms_needed": ["B63"],
        "in_person_required": False,
    },
    "death_cert": {
        "required_documents": [
            {"type": "nic", "label": "Applicant's National Identity Card", "mandatory": True},
            {"type": "death_details", "label": "Name of deceased, date and place of death", "mandatory": True},
            {"type": "affidavit", "label": "Sworn affidavit (archived records ≥ 20 yrs)", "mandatory": False},
        ],
        "forms_needed": ["B63"],
        "in_person_required": False,
    },
    "nic": {
        "required_documents": [
            {"type": "birth_cert", "label": "Original birth certificate", "mandatory": True},
            {"type": "gn_cert", "label": "Grama Niladhari certificate", "mandatory": True},
            {"type": "photo", "label": "Two recent colour photographs", "mandatory": True},
        ],
        "forms_needed": ["DRP1"],
        "in_person_required": True,           # photo/biometric capture at the office
    },
    "passport": {
        "required_documents": [
            {"type": "birth_cert", "label": "Original birth certificate", "mandatory": True},
            {"type": "nic", "label": "Valid National Identity Card", "mandatory": True},
            {"type": "photo", "label": "Studio photographs to spec", "mandatory": True},
        ],
        "forms_needed": ["K35A"],
        "in_person_required": True,           # immigration interview / biometrics
    },
    "gn_cert": {
        "required_documents": [
            {"type": "nic", "label": "National Identity Card", "mandatory": True},
            {"type": "proof_residence", "label": "Proof of residence (bill / deed / lease)", "mandatory": True},
        ],
        "forms_needed": ["GN-1"],
        "in_person_required": False,
    },
    "license": {
        "required_documents": [
            {"type": "nic", "label": "National Identity Card", "mandatory": True},
            {"type": "medical", "label": "Medical fitness certificate", "mandatory": True},
            {"type": "learner_permit", "label": "Valid learner's permit", "mandatory": False},
        ],
        "forms_needed": ["DMT-LIC"],
        "in_person_required": True,           # driving test
    },
}


def for_service(service: str) -> dict:
    return META.get(service, {"required_documents": [], "forms_needed": [], "in_person_required": False})


def build_plan(service: str, office: str | None, officer: str | None,
               checklist: list, citations: list) -> dict:
    """Assemble the structured plan block of the packet contract."""
    info = knowledge.info(service)
    m = for_service(service)
    return {
        "office": office or info["office"],
        "officer": officer or info["officer"],
        "required_documents": m["required_documents"],
        "forms_needed": m["forms_needed"],
        "in_person_required": m["in_person_required"],
        "checklist": checklist or list(info["checklist"]),
        "citations": citations or [info["citation"]],
    }

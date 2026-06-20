"""Static civic-service knowledge base. Owner: Person A.

This is the fallback "ground truth" used when the RAG index is empty (no circulars
ingested yet) or when the LLM is unavailable. It keeps the demo deterministic and
self-contained. Values are *illustrative* — for production, the RAG layer over real
documents.gov.lk circulars should be the source of truth and override these.

Supported service keys (frozen, see API_CONTRACT.md):
  nic | passport | gn_cert | license | birth_cert | death_cert
"""
from typing import Dict, List, Optional

SERVICES: List[str] = ["nic", "passport", "gn_cert", "license", "birth_cert", "death_cert"]

# Keyword fast-path for the classifier. Matched against the lower-cased message as
# whole-ish phrases before falling back to the LLM. Order matters: longer/more
# specific services are checked first by SERVICES order in the classifier.
KEYWORDS: Dict[str, List[str]] = {
    "birth_cert": ["birth certificate", "birth cert", "born", "birth", "pirappu", "ipaddamaya", "upann"],
    "death_cert": ["death certificate", "death cert", "died", "death", "marana", "maranaya"],
    "passport": ["passport", "travel document", "immigration"],
    "license": ["driving licence", "driving license", "driver licence", "driver license",
                "driving", "license", "licence", "dmt"],
    "gn_cert": ["grama niladhari", "gramaniladhari", "gn certificate", "gn cert",
                "character certificate", "residence certificate", "grama"],
    "nic": ["national identity card", "national id", "identity card", "nic", "id card",
            "achchu", "anduwa"],
}

# Per-service civic metadata used to build the plan when RAG has nothing to add.
SERVICE_INFO: Dict[str, dict] = {
    "birth_cert": {
        "label": "Birth Certificate (certified copy)",
        "office": "Divisional Secretariat",          # overridden by record-age routing
        "officer": "Additional District Registrar",
        "form": "B63",
        "checklist": [
            "Completed application form B63 (request for a certified copy)",
            "Applicant's National Identity Card (original + photocopy)",
            "Full details of the birth: registered name, date and place of birth",
            "Relationship of the applicant to the person named on the certificate",
            "Prescribed search/copy fee receipt",
        ],
        "citation": {
            "title": "Registration of Births and Deaths Act — certified copies (Form B63)",
            "source": "https://www.rgd.gov.lk/web/index.php/en/services/births",
        },
    },
    "death_cert": {
        "label": "Death Certificate (certified copy)",
        "office": "Divisional Secretariat",          # overridden by record-age routing
        "officer": "Additional District Registrar",
        "form": "B63",
        "checklist": [
            "Completed application form B63 (request for a certified copy)",
            "Applicant's National Identity Card (original + photocopy)",
            "Full details of the death: name of the deceased, date and place of death",
            "Relationship of the applicant to the deceased",
            "Prescribed search/copy fee receipt",
        ],
        "citation": {
            "title": "Registration of Births and Deaths Act — certified copies (Form B63)",
            "source": "https://www.rgd.gov.lk/web/index.php/en/services/deaths",
        },
    },
    "nic": {
        "label": "National Identity Card (NIC)",
        "office": "Divisional Secretariat (NIC unit) / Department for Registration of Persons",
        "officer": "Registration of Persons Officer",
        "form": "DRP1",
        "checklist": [
            "Completed application form DRP1 (certified by the Grama Niladhari)",
            "Original birth certificate plus one photocopy",
            "Grama Niladhari certificate confirming residence",
            "Two recent colour photographs to DRP specification",
            "Prescribed fee receipt (if applicable)",
        ],
        "citation": {
            "title": "Department for Registration of Persons — applying for an NIC",
            "source": "https://www.drp.gov.lk/Templates/applying_nic.html",
        },
    },
    "passport": {
        "label": "Sri Lankan Passport",
        "office": "Department of Immigration & Emigration",
        "officer": "Immigration Officer",
        "form": "K35A",
        "checklist": [
            "Completed application form K35A",
            "Original birth certificate",
            "Valid National Identity Card (original + photocopy)",
            "Studio photographs taken to Immigration specification",
            "Payment slip / prescribed fee receipt",
        ],
        "citation": {
            "title": "Department of Immigration & Emigration — passport application",
            "source": "https://www.immigration.gov.lk/pages_e.php?id=4",
        },
    },
    "gn_cert": {
        "label": "Grama Niladhari Certificate",
        "office": "Grama Niladhari Office (Divisional Secretariat)",
        "officer": "Grama Niladhari",
        "form": "GN-1",
        "checklist": [
            "Written request addressed to the Grama Niladhari of your division",
            "National Identity Card (original + photocopy)",
            "Proof of residence (utility bill, deed, or lease agreement)",
            "Reason the certificate is required",
        ],
        "citation": {
            "title": "Divisional Secretariat — Grama Niladhari certificates",
            "source": "https://www.gic.gov.lk/gic/index.php?lang=en",
        },
    },
    "license": {
        "label": "Driving Licence",
        "office": "Department of Motor Traffic",
        "officer": "Examiner of Motor Vehicles (DMT)",
        "form": "DMT-LIC",
        "checklist": [
            "Completed driving licence application form",
            "Medical fitness certificate from a registered medical practitioner",
            "National Identity Card (original + photocopy)",
            "Valid learner's permit (when applying for a full licence)",
            "Prescribed fee receipt",
        ],
        "citation": {
            "title": "Department of Motor Traffic — driving licence services",
            "source": "https://www.dmt.gov.lk/index.php?lang=en",
        },
    },
}

# Record-age threshold (years) for the DS-vs-Kachcheri routing hero feature.
ARCHIVE_AGE_YEARS = 20
DIVISIONAL_SECRETARIAT = "Divisional Secretariat"
DISTRICT_SECRETARIAT = "District Secretariat (Kachcheri)"


def info(service: Optional[str]) -> dict:
    """Return the knowledge record for a service, defaulting to NIC."""
    return SERVICE_INFO.get(service or "", SERVICE_INFO["nic"])

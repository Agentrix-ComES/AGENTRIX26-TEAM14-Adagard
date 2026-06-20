// Hand-written mock data + in-memory store, used when NEXT_PUBLIC_USE_MOCK=1
// (or as a fallback) so the UI can be developed before the FastAPI backend is live.

import type { VerificationPacket } from "./types";

export const MOCK_PACKETS: VerificationPacket[] = [
  {
    id: "11111111-1111-1111-1111-111111111111",
    session_id: "aaaa1111-0000-0000-0000-000000000000",
    service: "birth_cert",
    approved: false,
    officer: null,
    plan: {
      office: "Divisional Secretariat",
      officer: "Additional District Registrar",
      checklist: [
        "Verify hospital birth declaration (Form B26)",
        "Confirm parents' NIC copies attached",
        "Cross-check father's marriage certificate",
        "Validate Grama Niladhari attestation",
      ],
      forms: [{ name: "B63", url: "/files/b63_draft.pdf" }],
      draft_docs: [
        {
          type: "affidavit",
          content:
            "AFFIDAVIT\n\nI, the undersigned applicant, residing at the address declared in the attached application, do hereby solemnly and sincerely affirm and state as follows:\n\n1. That the child named in the attached Form B26 was born on the date and at the hospital stated therein.\n2. That I am the lawful parent/guardian of the said child and the particulars furnished are true and correct to the best of my knowledge.\n3. That this affidavit is made for the purpose of obtaining a certified copy of the Birth Certificate from the Divisional Secretariat.\n\nSworn / affirmed before me this day.\n\nApplicant signature: ____________________",
        },
      ],
      citations: [
        {
          title: "Registration of Births and Deaths Act (Cap. 110)",
          source: "documents.gov.lk/birth-registration",
        },
        {
          title: "Form B63 — Application for Certified Copy",
          source: "rgd.gov.lk/forms/b63",
        },
      ],
    },
  },
  {
    id: "22222222-2222-2222-2222-222222222222",
    session_id: "bbbb2222-0000-0000-0000-000000000000",
    service: "nic",
    approved: false,
    officer: null,
    plan: {
      office: "District Secretariat (Kachcheri)",
      officer: "Officer-in-Charge, NIC Unit",
      checklist: [
        "Verify Birth Certificate original",
        "Confirm Grama Niladhari residence certificate",
        "Capture biometric photograph",
        "Validate dual-language name spelling",
      ],
      forms: [{ name: "DRP/1", url: "/files/drp1_draft.pdf" }],
      draft_docs: [
        {
          type: "cover_letter",
          content:
            "COVERING LETTER — NIC APPLICATION\n\nTo: The Commissioner, Department for Registration of Persons.\n\nPlease find enclosed the duly completed Form DRP/1 together with the certified Birth Certificate and Grama Niladhari residence certificate for the issuance of a new National Identity Card.\n\nAll particulars have been verified at the District Secretariat (Kachcheri) and are recommended for processing.",
        },
      ],
      citations: [
        {
          title: "Registration of Persons Act No. 32 of 1968",
          source: "documents.gov.lk/rop-act",
        },
      ],
    },
  },
  {
    id: "33333333-3333-3333-3333-333333333333",
    session_id: "cccc3333-0000-0000-0000-000000000000",
    service: "death_cert",
    approved: false,
    officer: null,
    plan: {
      office: "Divisional Secretariat",
      officer: "Additional District Registrar",
      checklist: [
        "Verify medical cause-of-death certificate",
        "Confirm informant's NIC",
        "Check burial/cremation permit reference",
      ],
      forms: [{ name: "D5", url: "/files/d5_draft.pdf" }],
      draft_docs: [
        {
          type: "affidavit",
          content:
            "AFFIDAVIT OF DEATH PARTICULARS\n\nI hereby affirm that the particulars of death furnished in the attached declaration are true and correct, and that I am the lawful informant entitled to register the said death under the Registration of Births and Deaths Act.",
        },
      ],
      citations: [
        {
          title: "Registration of Births and Deaths Act (Cap. 110)",
          source: "documents.gov.lk/death-registration",
        },
      ],
    },
  },
];

// Simple in-memory mutable copy so "approve" actually removes the packet in mock mode.
let store: VerificationPacket[] | null = null;

function getStore(): VerificationPacket[] {
  if (store === null) {
    store = MOCK_PACKETS.map((p) => ({ ...p }));
  }
  return store;
}

export function mockGetVerifications(): VerificationPacket[] {
  return getStore().filter((p) => !p.approved);
}

export function mockApprove(id: string, officer: string): { ok: boolean } {
  const packet = getStore().find((p) => p.id === id);
  if (packet) {
    packet.approved = true;
    packet.officer = officer;
  }
  return { ok: true };
}

// Shared types mirroring the GovPath backend contract (see API_CONTRACT.md).

export type ServiceType =
  | "birth_cert"
  | "death_cert"
  | "nic"
  | "passport"
  | "gn_cert"
  | "license";

export interface PlanForm {
  name: string;
  url: string;
}

export interface DraftDoc {
  type: string; // e.g. "affidavit"
  content: string;
}

export interface Citation {
  title: string;
  source: string;
}

export interface Plan {
  office: string;
  officer: string; // the role responsible, e.g. "Additional District Registrar"
  checklist: string[];
  forms: PlanForm[];
  draft_docs: DraftDoc[];
  citations: Citation[];
}

export interface VerificationPacket {
  id: string;
  session_id: string;
  service: ServiceType;
  plan: Plan;
  approved: boolean;
  officer: string | null; // who approved it (null until approved)
}

export interface ApproveResponse {
  ok: boolean;
}

// Human-friendly labels for the service codes.
export const SERVICE_LABELS: Record<ServiceType, string> = {
  birth_cert: "Birth Certificate",
  death_cert: "Death Certificate",
  nic: "National Identity Card",
  passport: "Passport",
  gn_cert: "GN Certificate",
  license: "License",
};

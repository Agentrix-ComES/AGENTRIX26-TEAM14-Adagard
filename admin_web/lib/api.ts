// Server-only helpers for talking to the GovPath backend with the officer's JWT.
// Owner: Person C. The token lives in an httpOnly cookie (set in app/actions.ts).
import { cookies } from "next/headers";

export const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8000";
export const TOKEN_COOKIE = "govpath_token";

export type Me = {
  id: number;
  kind: string;
  nic: string;
  full_name: string;
  role: string;
  services: string[];
  jurisdiction: string | null;
  is_active: boolean;
  can_manage_users: boolean;
};

export type Plan = {
  office: string;
  officer: string;
  checklist: string[];
  forms: { name: string; url: string }[];
  draft_docs: { type: string; content: string }[];
  citations: { title: string; source: string }[];
};

export type Packet = {
  id: string;
  session_id: string;
  service: string;
  plan: Plan;
  approved: boolean;
  officer: string | null;
};

export async function getToken(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(TOKEN_COOKIE)?.value;
}

/** Authenticated fetch to the backend; attaches Bearer + JSON headers. */
export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const token = await getToken();
  const headers = new Headers(init.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  return fetch(`${BACKEND_URL}${path}`, { ...init, headers, cache: "no-store" });
}

export async function getMe(): Promise<Me | null> {
  const res = await apiFetch("/auth/me");
  return res.ok ? ((await res.json()) as Me) : null;
}

// --- Full agentic-flow packet (kind === "request") ---
export type DocItem = {
  id: string;
  type: string | null;
  filename: string | null;
  signed_url: string | null;
  status: string;
  extracted: Record<string, unknown>;
};
export type RequestPacket = {
  id: string;
  kind: "request";
  packet_id: string;
  service: string;
  status: string;
  citizen: { name: string | null; nic: string | null };
  plan: Plan & { required_documents?: { type: string; label: string; mandatory: boolean }[]; in_person_required?: boolean };
  documents: DocItem[];
  gap_check: { complete: boolean; missing: string[]; notes: string } | null;
  generated_forms: { name: string; signed_url?: string | null; content?: string }[];
  appointment: { slot_start: string; slot_end: string; officer: string } | null;
  verification: {
    confidence: number;
    extracted_fields: Record<string, unknown>;
    checks: { name: string; passed: boolean }[];
    flags: string[];
    summary: string;
  } | null;
  reject_reason: string | null;
};
export type ChatPacket = Packet & { kind: "chat" };
export type QueueItem = ChatPacket | RequestPacket;

export type AvailabilitySlot = {
  day_of_week: number;
  start_time: string;
  end_time: string;
  slot_minutes: number;
};
export type OfficerAppointment = {
  id: string;
  slot_start: string;
  slot_end: string;
  service: string | null;
  citizen: string | null;
};

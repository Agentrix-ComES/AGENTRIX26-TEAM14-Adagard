// Typed API client for the GovPath admin portal.
// Talks to the FastAPI backend at NEXT_PUBLIC_API_BASE, or serves hand-written
// mock data when NEXT_PUBLIC_USE_MOCK=1 so the UI works before the API is live.

import type { ApproveResponse, VerificationPacket } from "./types";
import { mockApprove, mockGetVerifications } from "./mock";

export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000";

export const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "1";

/**
 * Resolve a backend-relative path (e.g. "/files/B63_xx.pdf") to an absolute URL
 * against the API host, so form/file links open from the backend (:8000) rather
 * than the admin portal origin (:3000). Already-absolute URLs pass through.
 */
export function resolveFileUrl(url: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith("/")) return `${API_BASE}${url}`;
  return url;
}

// Small delay so mock mode feels like a real network round-trip (loading states, etc.).
function delay<T>(value: T, ms = 350): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...init?.headers },
      cache: "no-store",
    });
  } catch {
    throw new ApiError(
      `Could not reach the backend at ${API_BASE}. Is it running? (Tip: set NEXT_PUBLIC_USE_MOCK=1 for mock data.)`,
    );
  }

  if (!res.ok) {
    throw new ApiError(`Request failed (${res.status} ${res.statusText})`, res.status);
  }

  return res.json() as Promise<T>;
}

/** GET /verifications — packets awaiting officer review. */
export async function getVerifications(): Promise<VerificationPacket[]> {
  if (USE_MOCK) return delay(mockGetVerifications());
  return request<VerificationPacket[]>("/verifications");
}

/** POST /verifications/{id}/approve — authorize a plan packet. */
export async function approveVerification(
  id: string,
  officer: string,
): Promise<ApproveResponse> {
  if (USE_MOCK) return delay(mockApprove(id, officer));
  return request<ApproveResponse>(`/verifications/${id}/approve`, {
    method: "POST",
    body: JSON.stringify({ officer }),
  });
}

/** GET /health */
export async function getHealth(): Promise<{ status?: string } | unknown> {
  if (USE_MOCK) return delay({ status: "ok (mock)" });
  return request("/health");
}

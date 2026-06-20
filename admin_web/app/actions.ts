"use server";
// Server actions: login/logout, approve packet, officer CRUD. Owner: Person C.
// All call the backend with the cookie JWT; the backend enforces RBAC + scoping.
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { BACKEND_URL, TOKEN_COOKIE, apiFetch } from "@/lib/api";

type FormState = { error?: string; ok?: boolean } | null;

export async function login(_prev: FormState, formData: FormData): Promise<FormState> {
  const nic = String(formData.get("nic") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const res = await fetch(`${BACKEND_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nic, password }),
    cache: "no-store",
  });
  if (!res.ok) {
    const d = await res.json().catch(() => ({}));
    return { error: d.detail ?? "Login failed" };
  }
  const data = await res.json();
  if (data.user?.kind !== "officer") {
    return { error: "This portal is for officers only." };
  }
  const store = await cookies();
  store.set(TOKEN_COOKIE, data.access_token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
  redirect("/");
}

export async function logout(): Promise<void> {
  const store = await cookies();
  store.delete(TOKEN_COOKIE);
  redirect("/login");
}

export async function approve(formData: FormData): Promise<void> {
  const id = String(formData.get("id"));
  await apiFetch(`/verifications/${id}/approve`, { method: "POST", body: "{}" });
  revalidatePath("/");
}

export async function reject(formData: FormData): Promise<void> {
  const id = String(formData.get("id"));
  const reason = String(formData.get("reason") ?? "");
  await apiFetch(`/verifications/${id}/reject`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
  revalidatePath("/");
}

export async function saveAvailability(formData: FormData): Promise<void> {
  const slots = JSON.parse(String(formData.get("slots") ?? "[]"));
  await apiFetch("/officer/availability", { method: "POST", body: JSON.stringify(slots) });
  revalidatePath("/officer/availability");
}

export async function createOfficer(_prev: FormState, formData: FormData): Promise<FormState> {
  const body: Record<string, unknown> = {
    nic: String(formData.get("nic") ?? "").trim(),
    full_name: String(formData.get("full_name") ?? "").trim(),
    password: String(formData.get("password") ?? ""),
    role: String(formData.get("role") ?? ""),
  };
  const jurisdiction = String(formData.get("jurisdiction") ?? "");
  if (jurisdiction) body.jurisdiction = jurisdiction;
  const res = await apiFetch("/auth/officers", { method: "POST", body: JSON.stringify(body) });
  if (!res.ok) {
    const d = await res.json().catch(() => ({}));
    return { error: d.detail ?? "Could not create officer" };
  }
  revalidatePath("/admin/officers");
  return { ok: true };
}

export async function setOfficerActive(formData: FormData): Promise<void> {
  const id = String(formData.get("id"));
  const is_active = formData.get("is_active") === "true";
  await apiFetch(`/auth/officers/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ is_active }),
  });
  revalidatePath("/admin/officers");
}

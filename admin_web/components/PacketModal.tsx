"use client";

import { useEffect } from "react";
import type { VerificationPacket } from "@/lib/types";
import ServiceBadge from "./ServiceBadge";

interface Props {
  packet: VerificationPacket;
  onClose: () => void;
  onApprove: (packet: VerificationPacket) => void;
  approving: boolean;
}

/** Full-detail modal: read drafted documents in full before authorizing. */
export default function PacketModal({
  packet,
  onClose,
  onApprove,
  approving,
}: Props) {
  // Close on Escape.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const { plan } = packet;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="flex max-h-[90vh] w-full max-w-3xl flex-col rounded-lg bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-4">
          <div className="space-y-2">
            <ServiceBadge service={packet.service} />
            <h2 className="text-lg font-semibold text-slate-900">
              {plan.office}
            </h2>
            <p className="text-sm text-slate-500">
              Reviewing officer role: {plan.officer}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18 18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Scrollable body */}
        <div className="space-y-6 overflow-y-auto px-6 py-5">
          {/* Checklist */}
          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Verification Checklist
            </h3>
            <ul className="space-y-1.5">
              {plan.checklist.map((item, i) => (
                <li key={i} className="flex gap-2 text-sm text-slate-700">
                  <span className="mt-0.5 text-primary">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Forms */}
          {plan.forms.length > 0 && (
            <section>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Attached Forms
              </h3>
              <ul className="space-y-1.5">
                {plan.forms.map((form, i) => (
                  <li key={i}>
                    <a
                      href={form.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                    >
                      📄 {form.name}
                      <span className="text-xs text-slate-400">({form.url})</span>
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Drafted documents — full text */}
          {plan.draft_docs.length > 0 && (
            <section>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Drafted Documents
              </h3>
              <div className="space-y-3">
                {plan.draft_docs.map((doc, i) => (
                  <div
                    key={i}
                    className="rounded-md border border-slate-200 bg-slate-50"
                  >
                    <div className="border-b border-slate-200 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {doc.type.replace(/_/g, " ")}
                    </div>
                    <pre className="whitespace-pre-wrap px-3 py-3 font-sans text-sm leading-relaxed text-slate-700">
                      {doc.content}
                    </pre>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Citations */}
          {plan.citations.length > 0 && (
            <section>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Legal Citations
              </h3>
              <ul className="space-y-1.5">
                {plan.citations.map((c, i) => (
                  <li key={i} className="text-sm">
                    <span className="font-medium text-slate-700">{c.title}</span>
                    <span className="text-slate-400"> — {c.source}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-md px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
          >
            Close
          </button>
          <button
            onClick={() => onApprove(packet)}
            disabled={approving}
            className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
          >
            {approving ? "Authorizing…" : "Approve & Authorize"}
          </button>
        </div>
      </div>
    </div>
  );
}

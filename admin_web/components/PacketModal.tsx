"use client";

import { useEffect } from "react";
import type { VerificationPacket } from "@/lib/types";
import { resolveFileUrl } from "@/lib/api";
import ServiceBadge from "./ServiceBadge";
import RouteBadge from "./RouteBadge";
import {
  BadgeIcon,
  BookIcon,
  CheckIcon,
  CloseIcon,
  DocIcon,
  ExternalIcon,
  ShieldCheckIcon,
} from "./icons";

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
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative bg-gradient-to-r from-primary-dark to-primary px-6 pb-5 pt-5 text-white">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-lg p-1.5 text-white/70 transition-colors hover:bg-white/15 hover:text-white"
            aria-label="Close"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <ServiceBadge service={packet.service} />
            <RouteBadge office={plan.office} />
            <span className="font-mono text-xs text-white/60">
              #{packet.id.slice(0, 8)}
            </span>
          </div>
          <h2 className="text-xl font-semibold tracking-tight">{plan.office}</h2>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-white/75">
            <BadgeIcon className="h-4 w-4" />
            {plan.officer}
          </p>
        </div>

        {/* Scrollable body */}
        <div className="thin-scroll space-y-6 overflow-y-auto px-6 py-5">
          {/* Checklist */}
          <section>
            <SectionHeader icon={<CheckIcon className="h-4 w-4" />}>
              Verification Checklist
            </SectionHeader>
            <ul className="mt-3 space-y-2">
              {plan.checklist.map((item, i) => (
                <li
                  key={i}
                  className="flex gap-2.5 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700 ring-1 ring-inset ring-slate-100"
                >
                  <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Forms */}
          {plan.forms.length > 0 && (
            <section>
              <SectionHeader icon={<DocIcon className="h-4 w-4" />}>
                Attached Forms
              </SectionHeader>
              <div className="mt-3 flex flex-wrap gap-2">
                {plan.forms.map((form, i) => (
                  <a
                    key={i}
                    href={resolveFileUrl(form.url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg border border-primary/20 bg-primary-50 px-3 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary hover:text-white"
                  >
                    <DocIcon className="h-4 w-4" />
                    {form.name}
                    <ExternalIcon className="h-3.5 w-3.5 opacity-70" />
                  </a>
                ))}
              </div>
            </section>
          )}

          {/* Drafted documents — full text */}
          {plan.draft_docs.length > 0 && (
            <section>
              <SectionHeader icon={<DocIcon className="h-4 w-4" />}>
                Drafted Documents
              </SectionHeader>
              <div className="mt-3 space-y-3">
                {plan.draft_docs.map((doc, i) => (
                  <div
                    key={i}
                    className="overflow-hidden rounded-xl ring-1 ring-slate-200"
                  >
                    <div className="border-b border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {doc.type.replace(/_/g, " ")}
                    </div>
                    <pre className="thin-scroll max-h-72 overflow-y-auto whitespace-pre-wrap bg-white px-4 py-3 font-sans text-sm leading-relaxed text-slate-700">
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
              <SectionHeader icon={<BookIcon className="h-4 w-4" />}>
                Legal Citations
              </SectionHeader>
              <ul className="mt-3 space-y-2">
                {plan.citations.map((c, i) => (
                  <li
                    key={i}
                    className="rounded-lg border border-slate-100 px-3 py-2 text-sm"
                  >
                    <span className="font-medium text-slate-700">{c.title}</span>
                    <span className="block truncate text-xs text-slate-400">
                      {c.source}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-200/60"
          >
            Close
          </button>
          <button
            onClick={() => onApprove(packet)}
            disabled={approving}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-white shadow-sm shadow-primary/30 transition-all hover:bg-primary-dark hover:shadow-md hover:shadow-primary/40 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {approving ? (
              "Authorizing…"
            ) : (
              <>
                <ShieldCheckIcon className="h-4 w-4" />
                Approve &amp; Authorize
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function SectionHeader({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
      <span className="text-primary">{icon}</span>
      {children}
    </h3>
  );
}

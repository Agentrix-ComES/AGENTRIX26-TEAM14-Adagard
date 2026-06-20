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
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/65 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-primary-dark via-primary to-primary-light px-6 pb-5 pt-5 text-white">
          {/* Dot grid texture */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage:
                "radial-gradient(circle, white 1px, transparent 1px)",
              backgroundSize: "18px 18px",
            }}
          />
          {/* Gold accent bottom border */}
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-accent/40 via-accent to-accent/40" />

          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-lg p-1.5 text-white/60 transition-colors hover:bg-white/15 hover:text-white"
            aria-label="Close"
          >
            <CloseIcon className="h-5 w-5" />
          </button>

          <div className="relative mb-3 flex flex-wrap items-center gap-2">
            <ServiceBadge service={packet.service} />
            <RouteBadge office={plan.office} />
            <span className="font-mono text-xs text-white/50">
              #{packet.id.slice(0, 8)}
            </span>
          </div>
          <h2 className="relative text-xl font-bold tracking-tight">{plan.office}</h2>
          <p className="relative mt-1.5 flex items-center gap-1.5 text-sm text-white/70">
            <BadgeIcon className="h-4 w-4 shrink-0" />
            {plan.officer}
          </p>
        </div>

        {/* Scrollable body */}
        <div className="thin-scroll flex-1 space-y-6 overflow-y-auto px-6 py-6">
          {/* Checklist */}
          <section>
            <SectionHeader icon={<CheckIcon className="h-4 w-4" />}>
              Verification Checklist
            </SectionHeader>
            <ul className="mt-3 space-y-2">
              {plan.checklist.map((item, i) => (
                <li
                  key={i}
                  className="flex gap-3 rounded-xl bg-slate-50 px-4 py-2.5 text-sm text-slate-700 ring-1 ring-inset ring-slate-100"
                >
                  <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-100 ring-1 ring-inset ring-emerald-200">
                    <CheckIcon className="h-2.5 w-2.5 text-emerald-600" />
                  </span>
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
                    className="inline-flex items-center gap-2 rounded-xl border border-primary/20 bg-primary-50 px-4 py-2 text-sm font-semibold text-primary transition-all hover:bg-primary hover:text-white hover:shadow-md hover:shadow-primary/20"
                  >
                    <DocIcon className="h-4 w-4" />
                    {form.name}
                    <ExternalIcon className="h-3.5 w-3.5 opacity-60" />
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
                    <div className="border-b border-slate-200 bg-gradient-to-r from-primary-50 to-slate-50 px-4 py-2 text-xs font-bold uppercase tracking-wide text-primary/70">
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
                    className="rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-2.5 text-sm"
                  >
                    <span className="font-semibold text-slate-700">{c.title}</span>
                    <span className="mt-0.5 block truncate text-xs text-slate-400">
                      {c.source}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-200 bg-slate-50/70 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-200/60"
          >
            Close
          </button>
          <button
            onClick={() => onApprove(packet)}
            disabled={approving}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary-light px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-primary/25 transition-all hover:from-primary-dark hover:to-primary hover:shadow-lg hover:shadow-primary/35 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {approving ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Authorizing…
              </>
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
    <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500">
      <span className="text-primary">{icon}</span>
      {children}
    </h3>
  );
}

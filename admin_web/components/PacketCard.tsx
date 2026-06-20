"use client";

import { useState } from "react";
import type { VerificationPacket } from "@/lib/types";
import ServiceBadge, { SERVICE_STYLES } from "./ServiceBadge";
import RouteBadge from "./RouteBadge";
import {
  BadgeIcon,
  BuildingIcon,
  CheckIcon,
  ChevronIcon,
  DocIcon,
  BookIcon,
  ShieldCheckIcon,
} from "./icons";

interface Props {
  packet: VerificationPacket;
  onApprove: (packet: VerificationPacket) => void;
  onViewDetails: (packet: VerificationPacket) => void;
  approving: boolean;
}

export default function PacketCard({
  packet,
  onApprove,
  onViewDetails,
  approving,
}: Props) {
  const { plan } = packet;
  const [docsOpen, setDocsOpen] = useState(false);
  const accent = (SERVICE_STYLES[packet.service] ?? SERVICE_STYLES.death_cert).accent;

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-900/5 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-900/10 hover:ring-primary/25">
      {/* Service accent bar (thicker for visual impact) */}
      <div className={`h-1.5 w-full ${accent}`} />

      {/* Header */}
      <div className="px-5 pb-3 pt-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <ServiceBadge service={packet.service} />
          <span className="font-mono text-[11px] font-medium text-slate-400">
            #{packet.id.slice(0, 8)}
          </span>
        </div>
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary-50 to-blue-50 text-primary ring-1 ring-inset ring-primary/15">
            <BuildingIcon className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h2 className="text-[15px] font-bold leading-snug text-slate-900">
              {plan.office}
            </h2>
            <p className="mt-0.5 flex items-center gap-1.5 text-sm text-slate-500">
              <BadgeIcon className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              <span className="truncate">{plan.officer}</span>
            </p>
          </div>
        </div>
        <div className="mt-3">
          <RouteBadge office={plan.office} />
        </div>
      </div>

      <div className="mx-5 border-t border-dashed border-slate-200/80" />

      {/* Body */}
      <div className="flex-1 space-y-4 px-5 py-4">
        {/* Checklist */}
        <div>
          <SectionLabel icon={<CheckIcon className="h-3.5 w-3.5" />}>
            Checklist
          </SectionLabel>
          <ul className="mt-2.5 space-y-1.5">
            {plan.checklist.map((item, i) => (
              <li key={i} className="flex gap-2 text-sm text-slate-700">
                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-50 ring-1 ring-inset ring-emerald-200">
                  <CheckIcon className="h-2.5 w-2.5 text-emerald-600" />
                </span>
                <span className="leading-snug">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Draft documents — expandable */}
        {plan.draft_docs.length > 0 && (
          <div className="overflow-hidden rounded-xl bg-slate-50 ring-1 ring-inset ring-slate-200/60">
            <button
              onClick={() => setDocsOpen((o) => !o)}
              className="flex w-full items-center justify-between px-3 py-2.5 text-left transition-colors hover:bg-slate-100/70"
            >
              <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
                <DocIcon className="h-4 w-4 text-primary" />
                Draft Documents
                <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary">
                  {plan.draft_docs.length}
                </span>
              </span>
              <ChevronIcon
                className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${docsOpen ? "rotate-180" : ""}`}
              />
            </button>
            {docsOpen && (
              <div className="space-y-2 px-3 pb-3">
                {plan.draft_docs.map((doc, i) => (
                  <div
                    key={i}
                    className="overflow-hidden rounded-lg bg-white ring-1 ring-slate-200"
                  >
                    <div className="border-b border-slate-100 bg-gradient-to-r from-primary-50 to-slate-50 px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wide text-primary/70">
                      {doc.type.replace(/_/g, " ")}
                    </div>
                    <pre className="thin-scroll max-h-32 overflow-y-auto whitespace-pre-wrap px-3 py-2 font-sans text-xs leading-relaxed text-slate-600">
                      {doc.content}
                    </pre>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Citations */}
        {plan.citations.length > 0 && (
          <div>
            <SectionLabel icon={<BookIcon className="h-3.5 w-3.5" />}>
              Citations
            </SectionLabel>
            <ul className="mt-2.5 space-y-1.5">
              {plan.citations.map((c, i) => (
                <li
                  key={i}
                  className="rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs leading-snug ring-1 ring-inset ring-slate-100"
                >
                  <span className="font-semibold text-slate-700">{c.title}</span>
                  <span className="mt-0.5 block truncate text-slate-400">
                    {c.source}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 border-t border-slate-100 bg-slate-50/60 px-5 py-3">
        <button
          onClick={() => onViewDetails(packet)}
          className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-600 transition-all hover:border-primary/30 hover:bg-primary-50 hover:text-primary"
        >
          View detail
        </button>
        <button
          onClick={() => onApprove(packet)}
          disabled={approving}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-primary to-primary-light px-3 py-2 text-sm font-semibold text-white shadow-md shadow-primary/25 transition-all hover:from-primary-dark hover:to-primary hover:shadow-lg hover:shadow-primary/35 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {approving ? (
            <span className="flex items-center gap-1.5">
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Authorizing…
            </span>
          ) : (
            <>
              <ShieldCheckIcon className="h-4 w-4" />
              Approve &amp; Authorize
            </>
          )}
        </button>
      </div>
    </article>
  );
}

function SectionLabel({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500">
      <span className="text-primary/70">{icon}</span>
      {children}
    </h3>
  );
}

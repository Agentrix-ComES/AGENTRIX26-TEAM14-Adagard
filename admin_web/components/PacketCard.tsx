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
    <article className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-900/5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-slate-900/10 hover:ring-primary/30">
      {/* service accent bar */}
      <div className={`h-1 w-full ${accent}`} />

      {/* Header */}
      <div className="px-5 pb-3 pt-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <ServiceBadge service={packet.service} />
          <span className="font-mono text-[11px] text-slate-400">
            #{packet.id.slice(0, 8)}
          </span>
        </div>
        <div className="flex items-start gap-2.5">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary">
            <BuildingIcon className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h2 className="text-[15px] font-semibold leading-snug text-slate-900">
              {plan.office}
            </h2>
            <p className="flex items-center gap-1.5 text-sm text-slate-500">
              <BadgeIcon className="h-3.5 w-3.5 text-slate-400" />
              {plan.officer}
            </p>
          </div>
        </div>
        <div className="mt-3">
          <RouteBadge office={plan.office} />
        </div>
      </div>

      <div className="mx-5 border-t border-dashed border-slate-200" />

      {/* Body */}
      <div className="flex-1 space-y-4 px-5 py-4">
        {/* Checklist */}
        <div>
          <SectionLabel icon={<CheckIcon className="h-3.5 w-3.5" />}>
            Checklist
          </SectionLabel>
          <ul className="mt-2 space-y-1.5">
            {plan.checklist.map((item, i) => (
              <li key={i} className="flex gap-2 text-sm text-slate-700">
                <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <span className="leading-snug">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Draft documents — expandable */}
        {plan.draft_docs.length > 0 && (
          <div className="rounded-xl bg-slate-50/70 ring-1 ring-inset ring-slate-200/70">
            <button
              onClick={() => setDocsOpen((o) => !o)}
              className="flex w-full items-center justify-between px-3 py-2.5 text-left"
            >
              <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
                <DocIcon className="h-4 w-4 text-primary" />
                Draft Documents
                <span className="rounded-full bg-primary/10 px-1.5 text-[10px] font-bold text-primary">
                  {plan.draft_docs.length}
                </span>
              </span>
              <ChevronIcon
                className={`h-4 w-4 text-slate-400 transition-transform ${docsOpen ? "rotate-180" : ""}`}
              />
            </button>
            {docsOpen && (
              <div className="space-y-2 px-3 pb-3">
                {plan.draft_docs.map((doc, i) => (
                  <div
                    key={i}
                    className="overflow-hidden rounded-lg bg-white ring-1 ring-slate-200"
                  >
                    <div className="border-b border-slate-100 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      {doc.type.replace(/_/g, " ")}
                    </div>
                    <pre className="thin-scroll max-h-32 overflow-y-auto whitespace-pre-wrap px-2.5 py-2 font-sans text-xs leading-relaxed text-slate-600">
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
            <ul className="mt-2 space-y-1.5">
              {plan.citations.map((c, i) => (
                <li key={i} className="text-xs leading-snug text-slate-600">
                  <span className="font-medium text-slate-700">{c.title}</span>
                  <span className="block truncate text-slate-400">
                    {c.source}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 border-t border-slate-100 bg-slate-50/50 px-5 py-3">
        <button
          onClick={() => onViewDetails(packet)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-slate-400 hover:bg-slate-50"
        >
          View full detail
        </button>
        <button
          onClick={() => onApprove(packet)}
          disabled={approving}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white shadow-sm shadow-primary/30 transition-all hover:bg-primary-dark hover:shadow-md hover:shadow-primary/40 disabled:cursor-not-allowed disabled:opacity-60"
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
    <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
      <span className="text-slate-400">{icon}</span>
      {children}
    </h3>
  );
}

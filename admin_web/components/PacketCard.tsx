"use client";

import { useState } from "react";
import type { VerificationPacket } from "@/lib/types";
import ServiceBadge from "./ServiceBadge";

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

  return (
    <article className="flex flex-col rounded-lg border border-slate-200 bg-white shadow-sm">
      {/* Header */}
      <div className="border-b border-slate-100 px-5 py-4">
        <div className="mb-2 flex items-center justify-between gap-3">
          <ServiceBadge service={packet.service} />
          <span className="font-mono text-xs text-slate-400">
            #{packet.id.slice(0, 8)}
          </span>
        </div>
        <h2 className="text-base font-semibold text-slate-900">{plan.office}</h2>
        <p className="text-sm text-slate-500">{plan.officer}</p>
      </div>

      {/* Body */}
      <div className="flex-1 space-y-4 px-5 py-4">
        {/* Checklist */}
        <div>
          <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Checklist
          </h3>
          <ul className="space-y-1">
            {plan.checklist.map((item, i) => (
              <li key={i} className="flex gap-2 text-sm text-slate-700">
                <span className="mt-0.5 text-primary">✓</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Draft documents — expandable */}
        {plan.draft_docs.length > 0 && (
          <div>
            <button
              onClick={() => setDocsOpen((o) => !o)}
              className="flex w-full items-center justify-between text-xs font-semibold uppercase tracking-wide text-slate-500 hover:text-slate-700"
            >
              <span>
                Draft Documents ({plan.draft_docs.length})
              </span>
              <span className="text-slate-400">{docsOpen ? "▲" : "▼"}</span>
            </button>
            {docsOpen && (
              <div className="mt-2 space-y-2">
                {plan.draft_docs.map((doc, i) => (
                  <div
                    key={i}
                    className="rounded border border-slate-200 bg-slate-50"
                  >
                    <div className="border-b border-slate-200 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      {doc.type.replace(/_/g, " ")}
                    </div>
                    <pre className="max-h-32 overflow-y-auto whitespace-pre-wrap px-2.5 py-2 font-sans text-xs leading-relaxed text-slate-600">
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
            <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Citations
            </h3>
            <ul className="space-y-1">
              {plan.citations.map((c, i) => (
                <li key={i} className="text-xs text-slate-600">
                  <span className="font-medium text-slate-700">{c.title}</span>
                  <span className="text-slate-400"> — {c.source}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 border-t border-slate-100 px-5 py-3">
        <button
          onClick={() => onViewDetails(packet)}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          View full detail
        </button>
        <button
          onClick={() => onApprove(packet)}
          disabled={approving}
          className="flex-1 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
        >
          {approving ? "Authorizing…" : "Approve & Authorize"}
        </button>
      </div>
    </article>
  );
}

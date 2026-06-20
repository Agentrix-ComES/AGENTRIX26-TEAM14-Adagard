// Officer review card for a full agentic-flow request packet. Owner: Person C.
import type { RequestPacket } from "@/lib/api";
import { approve } from "@/app/actions";
import ApproveButton from "@/components/ApproveButton";
import RejectForm from "@/components/RejectForm";

function ConfidenceBadge({ value }: { value: number }) {
  const tone = value >= 75 ? "bg-palm-soft text-palm" : value >= 50 ? "bg-saffron-soft text-garnet" : "bg-garnet/10 text-garnet";
  return (
    <span className={`rounded-full px-2.5 py-0.5 font-mono text-[11px] font-semibold ${tone}`}>
      AI confidence {value}%
    </span>
  );
}

export default function RequestPacketCard({ p }: { p: RequestPacket }) {
  const v = p.verification;
  return (
    <article className="overflow-hidden rounded-2xl border border-line bg-card shadow-sm">
      <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <span className="rounded-md bg-saffron-soft px-2 py-0.5 font-mono text-[11px] font-semibold uppercase tracking-wide text-garnet">
              {p.service}
            </span>
            <h2 className="font-display text-lg font-semibold tracking-tight">{p.plan?.office}</h2>
            <span className="font-mono text-[10px] uppercase tracking-wide text-muted">{p.status}</span>
          </div>
          <p className="text-xs text-muted">
            {p.citizen?.name} · <span className="font-mono">{p.citizen?.nic}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          {v && <ConfidenceBadge value={v.confidence} />}
        </div>
      </div>

      <div className="grid gap-5 px-5 py-4 sm:grid-cols-2">
        {/* Documents */}
        <div>
          <h3 className="font-mono text-[11px] uppercase tracking-[0.12em] text-saffron">Documents</h3>
          <ul className="mt-2 space-y-1.5 text-sm">
            {p.documents.map((d) => (
              <li key={d.id} className="flex items-center gap-2">
                <span className={`h-1.5 w-1.5 rounded-full ${d.status === "matched" ? "bg-palm" : "bg-saffron"}`} />
                <span className="font-mono text-xs text-muted">{d.type ?? "—"}</span>
                {d.signed_url ? (
                  <a href={d.signed_url} target="_blank" rel="noreferrer" className="text-garnet underline decoration-saffron underline-offset-4">
                    {d.filename ?? "view"} ↗
                  </a>
                ) : (
                  <span>{d.filename}</span>
                )}
              </li>
            ))}
            {p.documents.length === 0 && <li className="text-xs text-muted">No documents uploaded.</li>}
          </ul>
        </div>

        {/* Gap-check + checks/flags + appointment */}
        <div className="space-y-3">
          {p.gap_check && (
            <div>
              <h3 className="font-mono text-[11px] uppercase tracking-[0.12em] text-saffron">Gap-check</h3>
              <p className={`mt-1 text-sm ${p.gap_check.complete ? "text-palm" : "text-garnet"}`}>
                {p.gap_check.complete ? "All required documents present" : `Missing: ${p.gap_check.missing.join(", ")}`}
              </p>
            </div>
          )}
          {v && (
            <div>
              <h3 className="font-mono text-[11px] uppercase tracking-[0.12em] text-saffron">AI verification</h3>
              <p className="mt-1 text-sm text-ink">{v.summary}</p>
              <ul className="mt-1 space-y-0.5 text-xs">
                {v.checks.map((c, i) => (
                  <li key={i} className={c.passed ? "text-palm" : "text-garnet"}>
                    {c.passed ? "✓" : "✕"} {c.name}
                  </li>
                ))}
                {v.flags.map((f, i) => (
                  <li key={`f${i}`} className="text-garnet">⚑ {f}</li>
                ))}
              </ul>
            </div>
          )}
          {p.appointment && (
            <div>
              <h3 className="font-mono text-[11px] uppercase tracking-[0.12em] text-saffron">Appointment</h3>
              <p className="mt-1 text-sm">
                {new Date(p.appointment.slot_start).toLocaleString()} · {p.appointment.officer}
              </p>
            </div>
          )}
          {p.generated_forms.length > 0 && (
            <div>
              <h3 className="font-mono text-[11px] uppercase tracking-[0.12em] text-saffron">Generated forms</h3>
              <ul className="mt-1 space-y-0.5 text-sm">
                {p.generated_forms.map((f, i) => (
                  <li key={i}>
                    {f.signed_url ? (
                      <a href={f.signed_url} target="_blank" rel="noreferrer" className="font-mono text-garnet underline decoration-saffron underline-offset-4">
                        {f.name} ↗
                      </a>
                    ) : (
                      <span className="font-mono text-xs">{f.name}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 border-t border-line px-5 py-3">
        <RejectForm id={p.packet_id} />
        <form action={approve}>
          <input type="hidden" name="id" value={p.packet_id} />
          <ApproveButton />
        </form>
      </div>
    </article>
  );
}

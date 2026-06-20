// Verification queue — scoped to the signed-in officer by the backend. Owner: Person C.
import { redirect } from "next/navigation";
import { getMe, apiFetch, BACKEND_URL, type QueueItem } from "@/lib/api";
import { approve } from "@/app/actions";
import Header from "@/components/Header";
import ApproveButton from "@/components/ApproveButton";
import RequestPacketCard from "@/components/RequestPacketCard";

export default async function QueuePage() {
  const me = await getMe();
  if (!me) redirect("/login"); // token expired/invalid

  const res = await apiFetch("/verifications");
  const packets: QueueItem[] = res.ok ? await res.json() : [];

  return (
    <div className="min-h-screen bg-paper">
      <Header me={me} />
      <main className="mx-auto max-w-4xl space-y-5 px-6 py-8">
        <div className="flex items-end justify-between">
          <h1 className="font-display text-2xl font-semibold tracking-tight">Pending verifications</h1>
          <span className="font-mono text-xs uppercase tracking-[0.1em] text-muted">
            {packets.length} awaiting you
          </span>
        </div>

        {packets.length === 0 && (
          <div className="rounded-2xl border border-dashed border-line bg-card/50 p-12 text-center">
            <p className="font-display text-lg text-ink">Your desk is clear.</p>
            <p className="mt-1 text-sm text-muted">
              New plans routed to your office will appear here for review.
            </p>
          </div>
        )}

        {packets.map((p) =>
          p.kind === "request" ? (
            <RequestPacketCard key={p.id} p={p} />
          ) : (
          <article key={p.id} className="overflow-hidden rounded-2xl border border-line bg-card shadow-sm">
            <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <span className="rounded-md bg-saffron-soft px-2 py-0.5 font-mono text-[11px] font-semibold uppercase tracking-wide text-garnet">
                    {p.service}
                  </span>
                  <h2 className="font-display text-lg font-semibold tracking-tight">{p.plan.office}</h2>
                </div>
                <p className="text-xs text-muted">Officer of record · {p.plan.officer}</p>
              </div>
              <form action={approve}>
                <input type="hidden" name="id" value={p.id} />
                <ApproveButton />
              </form>
            </div>

            <div className="grid gap-5 px-5 py-4 sm:grid-cols-2">
              <div>
                <h3 className="font-mono text-[11px] uppercase tracking-[0.12em] text-saffron">Documents to bring</h3>
                <ul className="mt-2 space-y-1.5 text-sm text-ink">
                  {p.plan.checklist.map((c, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-garnet" />
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="space-y-4">
                {p.plan.forms.length > 0 && (
                  <div>
                    <h3 className="font-mono text-[11px] uppercase tracking-[0.12em] text-saffron">Pre-filled forms</h3>
                    <ul className="mt-2 space-y-1 text-sm">
                      {p.plan.forms.map((f, i) => (
                        <li key={i}>
                          <a
                            href={`${BACKEND_URL}${f.url}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 font-mono text-garnet underline decoration-saffron underline-offset-4 hover:text-garnet-700"
                          >
                            {f.name}
                            <span aria-hidden>↗</span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {p.plan.citations.length > 0 && (
                  <div>
                    <h3 className="font-mono text-[11px] uppercase tracking-[0.12em] text-saffron">Cited authority</h3>
                    <ul className="mt-2 space-y-1 text-sm text-muted">
                      {p.plan.citations.map((c, i) => (
                        <li key={i}>{c.title}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {p.plan.draft_docs.length > 0 && (
              <details className="border-t border-line px-5 py-3">
                <summary className="cursor-pointer font-mono text-[11px] uppercase tracking-[0.12em] text-muted hover:text-garnet">
                  Drafted {p.plan.draft_docs[0].type}
                </summary>
                <pre className="mt-2 whitespace-pre-wrap rounded-lg bg-paper p-3 font-mono text-xs leading-relaxed text-ink">
                  {p.plan.draft_docs[0].content}
                </pre>
              </details>
            )}
          </article>
          ),
        )}
      </main>
    </div>
  );
}

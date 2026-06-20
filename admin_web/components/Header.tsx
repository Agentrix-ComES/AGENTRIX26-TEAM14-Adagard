// Top nav: brand wordmark, identity + scope, Officers link (super-admin), sign out.
// Owner: Person C.
import Link from "next/link";
import type { Me } from "@/lib/api";
import { logout } from "@/app/actions";
import { Wordmark } from "@/components/Seal";

export default function Header({ me }: { me: Me }) {
  const scope =
    me.role === "SUPER_ADMIN"
      ? "all services"
      : `${me.services.join(" · ") || "—"}${me.jurisdiction ? ` — ${me.jurisdiction}` : ""}`;

  return (
    <header className="border-b border-line bg-card">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-3.5">
        <Link href="/" aria-label="GovPath home">
          <Wordmark />
        </Link>

        <div className="flex items-center gap-5">
          <Link
            href="/"
            className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted transition-colors hover:text-garnet"
          >
            Queue
          </Link>
          <Link
            href="/officer/availability"
            className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted transition-colors hover:text-garnet"
          >
            Schedule
          </Link>
          {me.can_manage_users && (
            <Link
              href="/admin/officers"
              className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted transition-colors hover:text-garnet"
            >
              Officers
            </Link>
          )}
          <div className="text-right leading-tight">
            <div className="text-sm font-semibold">{me.full_name}</div>
            <div className="font-mono text-[10px] uppercase tracking-[0.1em] text-saffron">
              {me.role}
            </div>
          </div>
          <form action={logout}>
            <button className="rounded-lg border border-line px-3 py-1.5 text-xs font-medium transition-colors hover:border-garnet hover:text-garnet">
              Sign out
            </button>
          </form>
        </div>
      </div>
      <div className="rule-saffron h-[2px] w-full" />
      <div className="mx-auto max-w-4xl px-6 py-1.5">
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
          Reviewing as {scope}
        </p>
      </div>
    </header>
  );
}

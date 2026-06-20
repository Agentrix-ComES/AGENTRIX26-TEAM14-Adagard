"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ApiError,
  USE_MOCK,
  approveVerification,
  getVerifications,
} from "@/lib/api";
import type { VerificationPacket } from "@/lib/types";
import PacketCard from "./PacketCard";
import PacketModal from "./PacketModal";
import {
  ArchiveIcon,
  InboxIcon,
  LayersIcon,
  RefreshIcon,
  ShieldCheckIcon,
} from "./icons";

const OFFICER_NAME = "Verifying Officer";

export default function Dashboard() {
  const [packets, setPackets] = useState<VerificationPacket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [selected, setSelected] = useState<VerificationPacket | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getVerifications();
      setPackets(data);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Something went wrong while loading the queue.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleApprove = useCallback(async (packet: VerificationPacket) => {
    setApprovingId(packet.id);
    setError(null);
    try {
      await approveVerification(packet.id, OFFICER_NAME);
      setPackets((prev) => prev.filter((p) => p.id !== packet.id));
      setSelected(null);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Could not authorize this packet. Please try again.",
      );
    } finally {
      setApprovingId(null);
    }
  }, []);

  const stats = useMemo(() => {
    const services = new Set(packets.map((p) => p.service));
    const archived = packets.filter((p) => {
      const o = p.plan.office.toLowerCase();
      return o.includes("kachcheri") || o.includes("district secretariat");
    }).length;
    return { pending: packets.length, services: services.size, archived };
  }, [packets]);

  return (
    <div>
      {/* Toolbar */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Pending Verifications
            </h2>
            {USE_MOCK && (
              <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-amber-700 ring-1 ring-inset ring-amber-600/20">
                Mock mode
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Review each AI-generated plan packet and authorize it for the citizen.
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="group inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:border-primary/30 hover:bg-primary-50 hover:text-primary hover:shadow-md disabled:opacity-60"
        >
          <RefreshIcon
            className={`h-4 w-4 transition-colors group-hover:text-primary ${loading ? "animate-spin" : ""}`}
          />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="mb-7 grid grid-cols-3 gap-4">
        <StatCard
          icon={<InboxIcon className="h-5 w-5" />}
          label="Awaiting review"
          value={loading ? "—" : stats.pending}
          tone="primary"
          loading={loading}
        />
        <StatCard
          icon={<LayersIcon className="h-5 w-5" />}
          label="Service types"
          value={loading ? "—" : stats.services}
          tone="slate"
          loading={loading}
        />
        <StatCard
          icon={<ArchiveIcon className="h-5 w-5" />}
          label="Archived routings"
          value={loading ? "—" : stats.archived}
          tone="amber"
          loading={loading}
        />
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-inset ring-red-200/60">
          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-100 text-xs font-bold text-red-600">!</span>
          <span>{error}</span>
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <LoadingGrid />
      ) : packets.length === 0 && !error ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {packets.map((packet, i) => (
            <div
              key={packet.id}
              className="animate-rise"
              style={{ animationDelay: `${Math.min(i, 8) * 60}ms` }}
            >
              <PacketCard
                packet={packet}
                approving={approvingId === packet.id}
                onApprove={handleApprove}
                onViewDetails={setSelected}
              />
            </div>
          ))}
        </div>
      )}

      {selected && (
        <PacketModal
          packet={selected}
          approving={approvingId === selected.id}
          onClose={() => setSelected(null)}
          onApprove={handleApprove}
        />
      )}
    </div>
  );
}

const STAT_STYLES = {
  primary: {
    wrap: "from-primary to-primary-light",
    icon: "bg-white/20 text-white",
    value: "text-white",
    label: "text-white/70",
  },
  slate: {
    wrap: "from-slate-600 to-slate-500",
    icon: "bg-white/20 text-white",
    value: "text-white",
    label: "text-white/70",
  },
  amber: {
    wrap: "from-amber-500 to-amber-400",
    icon: "bg-white/20 text-white",
    value: "text-white",
    label: "text-white/75",
  },
} as const;

function StatCard({
  icon,
  label,
  value,
  tone,
  loading,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  tone: keyof typeof STAT_STYLES;
  loading: boolean;
}) {
  const styles = STAT_STYLES[tone];
  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${styles.wrap} p-5 shadow-lg`}
    >
      {/* Background shimmer pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            "radial-gradient(circle at 80% 20%, white 1px, transparent 1px)",
          backgroundSize: "16px 16px",
        }}
      />
      <div className="relative flex items-center gap-4">
        <span
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${styles.icon} ring-1 ring-inset ring-white/25`}
        >
          {icon}
        </span>
        <div>
          {loading ? (
            <div className="h-7 w-10 animate-shimmer rounded-md" />
          ) : (
            <p className={`text-3xl font-bold leading-none ${styles.value}`}>
              {value}
            </p>
          )}
          <p className={`mt-1.5 text-xs font-medium ${styles.label}`}>{label}</p>
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white/60 py-20 text-center">
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-success to-emerald-400 shadow-lg shadow-emerald-500/30 ring-1 ring-inset ring-white/30">
        <ShieldCheckIcon className="h-8 w-8 text-white" />
      </div>
      <h3 className="text-lg font-bold text-slate-800">All clear!</h3>
      <p className="mt-2 max-w-sm text-sm text-slate-500">
        No packets awaiting review. All citizen service requests have been
        verified.
      </p>
    </div>
  );
}

function LoadingGrid() {
  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-900/5"
        >
          <div className="h-1.5 w-full animate-shimmer" />
          <div className="space-y-4 p-5">
            <div className="flex items-center gap-3">
              <div className="h-6 w-24 animate-shimmer rounded-full" />
              <div className="ml-auto h-4 w-16 animate-shimmer rounded" />
            </div>
            <div className="h-5 w-3/4 animate-shimmer rounded" />
            <div className="h-4 w-1/2 animate-shimmer rounded" />
            <div className="mt-2 space-y-2">
              <div className="h-3 w-full animate-shimmer rounded" />
              <div className="h-3 w-5/6 animate-shimmer rounded" />
              <div className="h-3 w-2/3 animate-shimmer rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

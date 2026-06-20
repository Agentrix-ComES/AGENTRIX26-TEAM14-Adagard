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

// Officer name attributed to approvals. Falls back to a sensible default.
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
      // Remove the approved packet from the queue.
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
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Pending Verifications
            </h2>
            {USE_MOCK && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-amber-700 ring-1 ring-inset ring-amber-600/20">
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
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:border-slate-400 hover:bg-slate-50 disabled:opacity-60"
        >
          <RefreshIcon className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-3 gap-3 sm:gap-4">
        <StatCard
          icon={<InboxIcon className="h-5 w-5" />}
          label="Awaiting review"
          value={loading ? "—" : stats.pending}
          tone="primary"
        />
        <StatCard
          icon={<LayersIcon className="h-5 w-5" />}
          label="Service types"
          value={loading ? "—" : stats.services}
          tone="slate"
        />
        <StatCard
          icon={<ArchiveIcon className="h-5 w-5" />}
          label="Archived routings"
          value={loading ? "—" : stats.archived}
          tone="amber"
        />
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span className="mt-0.5 font-bold">!</span>
          <span>{error}</span>
        </div>
      )}

      {/* States */}
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
              style={{ animationDelay: `${Math.min(i, 8) * 50}ms` }}
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

      {/* Detail modal */}
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

const TONES = {
  primary: "bg-primary-50 text-primary",
  slate: "bg-slate-100 text-slate-600",
  amber: "bg-amber-50 text-amber-600",
} as const;

function StatCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  tone: keyof typeof TONES;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-900/5">
      <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${TONES[tone]}`}>
        {icon}
      </span>
      <div>
        <p className="text-2xl font-bold leading-none text-slate-900">{value}</p>
        <p className="mt-1 text-xs font-medium text-slate-500">{label}</p>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white/70 py-20 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 ring-1 ring-inset ring-emerald-600/20">
        <ShieldCheckIcon className="h-7 w-7" />
      </div>
      <h3 className="text-base font-semibold text-slate-800">
        No packets awaiting review
      </h3>
      <p className="mt-1 max-w-sm text-sm text-slate-500">
        All citizen service requests have been verified. Check back later or
        refresh the queue.
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
          <div className="h-1 w-full bg-slate-200" />
          <div className="animate-pulse space-y-3 p-5">
            <div className="h-5 w-28 rounded-full bg-slate-200" />
            <div className="h-4 w-3/4 rounded bg-slate-200" />
            <div className="h-3 w-1/2 rounded bg-slate-200" />
            <div className="mt-6 h-3 w-full rounded bg-slate-100" />
            <div className="h-3 w-full rounded bg-slate-100" />
            <div className="h-3 w-2/3 rounded bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

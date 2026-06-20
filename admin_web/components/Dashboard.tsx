"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ApiError,
  USE_MOCK,
  approveVerification,
  getVerifications,
} from "@/lib/api";
import type { VerificationPacket } from "@/lib/types";
import PacketCard from "./PacketCard";
import PacketModal from "./PacketModal";

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

  const handleApprove = useCallback(
    async (packet: VerificationPacket) => {
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
    },
    [],
  );

  return (
    <div>
      {/* Toolbar */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">
            Pending Verifications
          </h2>
          <p className="text-sm text-slate-500">
            {loading
              ? "Loading queue…"
              : `${packets.length} packet${packets.length === 1 ? "" : "s"} awaiting review`}
            {USE_MOCK && (
              <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-700">
                MOCK MODE
              </span>
            )}
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-60"
        >
          <svg
            className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16.023 9.348h4.992V4.356M3 12a9 9 0 0 1 15.087-6.667L21 7.5M3 12a9 9 0 0 0 15.087 6.667L21 16.5M2.985 19.644V14.65h4.992"
            />
          </svg>
          Refresh
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* States */}
      {loading ? (
        <LoadingGrid />
      ) : packets.length === 0 && !error ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {packets.map((packet) => (
            <PacketCard
              key={packet.id}
              packet={packet}
              approving={approvingId === packet.id}
              onApprove={handleApprove}
              onViewDetails={setSelected}
            />
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

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white py-20 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-2xl">
        ✓
      </div>
      <h3 className="text-base font-semibold text-slate-800">
        No packets awaiting review
      </h3>
      <p className="mt-1 text-sm text-slate-500">
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
          className="h-64 animate-pulse rounded-lg border border-slate-200 bg-white"
        >
          <div className="space-y-3 p-5">
            <div className="h-5 w-24 rounded bg-slate-200" />
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

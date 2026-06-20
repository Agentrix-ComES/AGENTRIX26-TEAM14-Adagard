"use client";
// Weekly availability editor — officer sets time windows per day. Owner: Person C.
import { useState } from "react";
import { saveAvailability } from "@/app/actions";
import type { AvailabilitySlot } from "@/lib/api";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

type Row = { on: boolean; start: string; end: string; slot: number };

export default function AvailabilityEditor({ initial }: { initial: AvailabilitySlot[] }) {
  const byDay = new Map(initial.map((s) => [s.day_of_week, s]));
  const [rows, setRows] = useState<Row[]>(
    DAYS.map((_, i) => {
      const s = byDay.get(i);
      return { on: !!s, start: s?.start_time ?? "09:00", end: s?.end_time ?? "12:00", slot: s?.slot_minutes ?? 30 };
    }),
  );
  const [saved, setSaved] = useState(false);

  function update(i: number, patch: Partial<Row>) {
    setRows((r) => r.map((row, j) => (j === i ? { ...row, ...patch } : row)));
    setSaved(false);
  }

  const slots = rows
    .map((r, i) => (r.on ? { day_of_week: i, start_time: r.start, end_time: r.end, slot_minutes: r.slot } : null))
    .filter(Boolean);

  return (
    <form action={saveAvailability} onSubmit={() => setSaved(true)}
          className="overflow-hidden rounded-2xl border border-line bg-card shadow-sm">
      <div className="rule-saffron h-[2px] w-full" />
      <div className="space-y-2 p-5">
        <h2 className="font-display text-lg font-semibold tracking-tight">Weekly availability</h2>
        <input type="hidden" name="slots" value={JSON.stringify(slots)} />
        {rows.map((r, i) => (
          <div key={i} className="flex items-center gap-3 text-sm">
            <label className="flex w-20 items-center gap-2">
              <input type="checkbox" checked={r.on} onChange={(e) => update(i, { on: e.target.checked })} />
              <span className="font-mono">{DAYS[i]}</span>
            </label>
            <input type="time" value={r.start} disabled={!r.on} onChange={(e) => update(i, { start: e.target.value })}
                   className="rounded-lg border border-line px-2 py-1 text-sm disabled:opacity-40" />
            <span className="text-muted">to</span>
            <input type="time" value={r.end} disabled={!r.on} onChange={(e) => update(i, { end: e.target.value })}
                   className="rounded-lg border border-line px-2 py-1 text-sm disabled:opacity-40" />
            <select value={r.slot} disabled={!r.on} onChange={(e) => update(i, { slot: Number(e.target.value) })}
                    className="rounded-lg border border-line px-2 py-1 text-sm disabled:opacity-40">
              {[15, 20, 30, 45, 60].map((m) => <option key={m} value={m}>{m} min</option>)}
            </select>
          </div>
        ))}
        <div className="flex items-center gap-3 pt-2">
          <button className="rounded-lg bg-garnet px-4 py-2 text-sm font-semibold text-paper hover:bg-garnet-700">
            Save availability
          </button>
          {saved && <span className="text-sm text-palm">Saved.</span>}
        </div>
      </div>
    </form>
  );
}

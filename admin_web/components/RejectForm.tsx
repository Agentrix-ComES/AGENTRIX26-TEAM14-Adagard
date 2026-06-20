"use client";
// Reject with a required reason. Owner: Person C.
import { useState } from "react";
import { reject } from "@/app/actions";

export default function RejectForm({ id }: { id: string }) {
  const [open, setOpen] = useState(false);
  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg border-2 border-garnet px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-garnet transition-colors hover:bg-garnet hover:text-paper"
      >
        Reject
      </button>
    );
  }
  return (
    <form action={reject} className="flex items-center gap-2">
      <input type="hidden" name="id" value={id} />
      <input
        name="reason"
        required
        autoFocus
        placeholder="Reason for rejection"
        className="w-48 rounded-lg border border-line bg-paper/40 px-2.5 py-1.5 text-xs outline-none focus:border-garnet"
      />
      <button className="rounded-lg bg-garnet px-3 py-1.5 text-xs font-semibold text-paper hover:bg-garnet-700">
        Confirm
      </button>
      <button type="button" onClick={() => setOpen(false)} className="text-xs text-muted hover:text-ink">
        Cancel
      </button>
    </form>
  );
}

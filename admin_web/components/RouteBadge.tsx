import { ArchiveIcon, ClockIcon } from "./icons";

// Surfaces the backend's "DS vs Kachcheri" routing — the wasted-trip-prevention
// hero feature — as an at-a-glance chip derived from the office name.
export default function RouteBadge({ office }: { office: string }) {
  const o = office.toLowerCase();
  const archived = o.includes("kachcheri") || o.includes("district secretariat");

  if (archived) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-700 ring-1 ring-inset ring-amber-600/20">
        <ArchiveIcon className="h-3.5 w-3.5" />
        Archived record
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
      <ClockIcon className="h-3.5 w-3.5" />
      Current record
    </span>
  );
}

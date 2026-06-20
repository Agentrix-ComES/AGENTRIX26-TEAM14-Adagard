import { SERVICE_LABELS, type ServiceType } from "@/lib/types";

// Each service gets a calm, distinct tint + matching dot.
export const SERVICE_STYLES: Record<ServiceType, { pill: string; dot: string; accent: string }> = {
  birth_cert: { pill: "bg-emerald-50 text-emerald-700 ring-emerald-600/20", dot: "bg-emerald-500", accent: "bg-emerald-500" },
  death_cert: { pill: "bg-slate-100 text-slate-600 ring-slate-500/20", dot: "bg-slate-400", accent: "bg-slate-400" },
  nic: { pill: "bg-blue-50 text-blue-700 ring-blue-600/20", dot: "bg-blue-500", accent: "bg-blue-500" },
  passport: { pill: "bg-indigo-50 text-indigo-700 ring-indigo-600/20", dot: "bg-indigo-500", accent: "bg-indigo-500" },
  gn_cert: { pill: "bg-amber-50 text-amber-700 ring-amber-600/20", dot: "bg-amber-500", accent: "bg-amber-500" },
  license: { pill: "bg-violet-50 text-violet-700 ring-violet-600/20", dot: "bg-violet-500", accent: "bg-violet-500" },
};

export default function ServiceBadge({ service }: { service: ServiceType }) {
  const style = SERVICE_STYLES[service] ?? SERVICE_STYLES.death_cert;
  const label = SERVICE_LABELS[service] ?? service;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${style.pill}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
      {label}
    </span>
  );
}

import { SERVICE_LABELS, type ServiceType } from "@/lib/types";

const SERVICE_STYLES: Record<ServiceType, string> = {
  birth_cert: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  death_cert: "bg-slate-100 text-slate-700 ring-slate-500/20",
  nic: "bg-blue-50 text-blue-700 ring-blue-600/20",
  passport: "bg-indigo-50 text-indigo-700 ring-indigo-600/20",
  gn_cert: "bg-amber-50 text-amber-700 ring-amber-600/20",
  license: "bg-violet-50 text-violet-700 ring-violet-600/20",
};

export default function ServiceBadge({ service }: { service: ServiceType }) {
  const style = SERVICE_STYLES[service] ?? SERVICE_STYLES.death_cert;
  const label = SERVICE_LABELS[service] ?? service;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${style}`}
    >
      {label}
    </span>
  );
}

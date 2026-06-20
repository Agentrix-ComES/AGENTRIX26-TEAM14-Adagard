// Officer scheduling: weekly availability + upcoming appointments. Owner: Person C.
import { redirect } from "next/navigation";
import { getMe, apiFetch, type AvailabilitySlot, type OfficerAppointment } from "@/lib/api";
import Header from "@/components/Header";
import AvailabilityEditor from "@/components/AvailabilityEditor";

export default async function AvailabilityPage() {
  const me = await getMe();
  if (!me) redirect("/login");

  const [aRes, apRes] = await Promise.all([
    apiFetch("/officer/availability"),
    apiFetch("/officer/appointments"),
  ]);
  const availability: AvailabilitySlot[] = aRes.ok ? await aRes.json() : [];
  const appointments: OfficerAppointment[] = apRes.ok ? await apRes.json() : [];

  return (
    <div className="min-h-screen bg-paper">
      <Header me={me} />
      <main className="mx-auto max-w-4xl space-y-6 px-6 py-8">
        <h1 className="font-display text-2xl font-semibold tracking-tight">My schedule</h1>

        <AvailabilityEditor initial={availability} />

        <div className="overflow-hidden rounded-2xl border border-line bg-card shadow-sm">
          <div className="border-b border-line px-5 py-3">
            <h2 className="font-display text-lg font-semibold tracking-tight">Upcoming appointments</h2>
          </div>
          {appointments.length === 0 ? (
            <p className="px-5 py-6 text-sm text-muted">No appointments booked.</p>
          ) : (
            <ul className="divide-y divide-line">
              {appointments.map((a) => (
                <li key={a.id} className="flex items-center justify-between px-5 py-3 text-sm">
                  <span className="font-medium">{new Date(a.slot_start).toLocaleString()}</span>
                  <span className="font-mono text-xs uppercase tracking-wide text-garnet">{a.service}</span>
                  <span className="text-muted">{a.citizen}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}

import StatusBadge from "./StatusBadge";

export default function DoctorAvailability({ doctors }) {
  return (
    <div className="bg-surface border border-border rounded-card shadow-card p-4">
      <h3 className="text-sm font-semibold text-ink mb-3">Doctor Availability</h3>
      <div className="space-y-3">
        {doctors.map((d) => (
          <div key={d.name} className="flex items-center justify-between gap-3 pb-3 border-b border-border last:border-0 last:pb-0">
            <div className="min-w-0">
              <p className="text-sm font-medium text-ink truncate">{d.name}</p>
              <p className="text-xs text-ink-faint">{d.dept}</p>
              {d.currentPatient && (
                <p className="text-xs text-primary mt-0.5 truncate">With: {d.currentPatient}</p>
              )}
            </div>
            <div className="text-right shrink-0">
              <StatusBadge status={d.status} />
              <p className="text-[11px] text-ink-faint mt-1">{d.seen} seen · {d.next}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

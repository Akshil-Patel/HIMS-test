export default function DepartmentLoad({ departments }) {
  return (
    <div className="bg-surface border border-border rounded-card shadow-card p-4">
      <h3 className="text-sm font-semibold text-ink mb-4">Department-wise OPD Load</h3>
      <div className="space-y-4">
        {departments.map((d) => (
          <div key={d.name}>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-medium text-ink">{d.name}</span>
              <span className="text-ink-faint">
                {d.waiting} waiting · {d.done} done · {d.total} total
              </span>
            </div>
            <div className="h-2 rounded-full bg-base overflow-hidden">
              <div
                className="h-full rounded-full bg-teal"
                style={{ width: `${d.pct}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

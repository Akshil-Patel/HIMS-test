const STYLES = {
  Waiting: "bg-amber-light text-amber",
  "In Consult": "bg-primary-light text-primary",
  Completed: "bg-green-light text-green",
  Scheduled: "bg-base text-ink-muted border border-border",
  Available: "bg-green-light text-green",
};

export default function StatusBadge({ status }) {
  const style = STYLES[status] || "bg-base text-ink-muted";
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${style}`}>
      {status}
    </span>
  );
}

import { Users, Clock, CheckCircle2, AlertCircle } from "lucide-react";

const ICONS = { Users, Clock, CheckCircle2, AlertCircle };

const TONE = {
  Users: { bg: "bg-primary-light", text: "text-primary" },
  Clock: { bg: "bg-amber-light", text: "text-amber" },
  CheckCircle2: { bg: "bg-green-light", text: "text-green" },
  AlertCircle: { bg: "bg-red-light", text: "text-red" },
};

export default function StatCard({ label, value, icon }) {
  const Icon = ICONS[icon] || Users;
  const tone = TONE[icon] || TONE.Users;

  return (
    <div className="bg-surface border border-border rounded-card shadow-card p-4 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-lg ${tone.bg} ${tone.text} flex items-center justify-center shrink-0`}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-2xl font-bold text-ink leading-none">{value}</p>
        <p className="text-xs text-ink-faint mt-1">{label}</p>
      </div>
    </div>
  );
}

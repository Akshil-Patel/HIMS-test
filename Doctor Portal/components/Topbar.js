import { Search, Bell } from "lucide-react";
import { currentDoctor } from "../data/mockData";

export default function Topbar({ title, subtitle }) {
  const today = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <header className="flex items-center justify-between h-16 px-6 border-b border-border bg-surface sticky top-0 z-10">
      <div>
        <h1 className="text-lg font-bold text-ink leading-tight">{title}</h1>
        {subtitle && <p className="text-xs text-ink-faint">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden sm:flex items-center gap-2 bg-base border border-border rounded-lg px-3 py-2 w-64">
          <Search size={16} className="text-ink-faint" />
          <input
            type="text"
            placeholder="Search patients, doctors, invoices..."
            className="bg-transparent text-sm outline-none w-full placeholder:text-ink-faint"
          />
        </div>

        <button className="relative w-9 h-9 rounded-full bg-base border border-border flex items-center justify-center">
          <Bell size={16} className="text-ink-muted" />
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red rounded-full" />
        </button>

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary-light text-primary flex items-center justify-center text-xs font-semibold">
            {currentDoctor.avatarInitials}
          </div>
          <div className="hidden sm:block leading-tight">
            <p className="text-sm font-semibold text-ink">{currentDoctor.name}</p>
            <p className="text-xs text-ink-faint">{today}</p>
          </div>
        </div>
      </div>
    </header>
  );
}

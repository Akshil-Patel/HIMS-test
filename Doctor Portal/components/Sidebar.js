import Link from "next/link";
import { useRouter } from "next/router";
import { BILLING_URL } from "../lib/constants";
import {
  LayoutGrid,
  CalendarClock,
  Stethoscope,
  Users,
  FlaskConical,
  Pill,
  Bell,
  Settings,
  Zap,
  Receipt,
  ExternalLink,
} from "lucide-react";
import { currentDoctor } from "../data/mockData";

// Each group matches the "CLINICAL / DIAGNOSTICS / OPERATIONS" style
// grouping you designed in the reference screenshot.
const NAV_GROUPS = [
  {
    label: "Clinical",
    items: [
      { name: "Dashboard", href: "/dashboard", icon: LayoutGrid },
      { name: "OPD / Appointments", href: "/appointments", icon: CalendarClock },
      { name: "Patients", href: "/patients", icon: Users },
      { name: "Consultation", href: "/consultation", icon: Stethoscope },
    ],
  },
  {
    label: "Diagnostics",
    items: [
      { name: "Lab Orders", href: "/lab-orders", icon: FlaskConical },
      { name: "Prescriptions", href: "/prescriptions", icon: Pill },
    ],
  },
  {
    label: "Hospital Billing Desk",
    items: [
      { name: "Billing Desk & QR", href: BILLING_URL, icon: Receipt, external: true },
    ],
  },
];

export default function Sidebar() {
  const router = useRouter();

  return (
    <aside className="hidden md:flex md:flex-col w-64 shrink-0 h-screen sticky top-0 bg-surface border-r border-border">
      {/* Brand */}
      <div className="flex items-center gap-2 px-5 h-16 border-b border-border">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
          <Zap size={16} className="text-white" fill="white" />
        </div>
        <span className="font-bold text-ink text-[15px]">PCT-HIMS</span>
      </div>

      {/* Nav groups */}
      <nav className="flex-1 overflow-y-auto thin-scroll px-3 py-4 space-y-6">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="px-3 mb-2 text-[11px] font-semibold tracking-wide text-ink-faint uppercase">
              {group.label}
            </p>
            <div className="space-y-1">
              {group.items.map((item) => {
                const active = router.pathname === item.href;
                const Icon = item.icon;
                if (item.external) {
                  return (
                    <a
                      key={item.href}
                      href={item.href}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium text-ink-muted hover:bg-teal-light/50 hover:text-teal transition-colors"
                    >
                      <span className="flex items-center gap-3">
                        <Icon size={18} className="text-teal" />
                        {item.name}
                      </span>
                      <ExternalLink size={14} className="text-ink-faint" />
                    </a>
                  );
                }
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      active
                        ? "bg-primary-light text-primary"
                        : "text-ink-muted hover:bg-base hover:text-ink"
                    }`}
                  >
                    <Icon size={18} />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer: notifications, settings, doctor */}
      <div className="border-t border-border p-3 space-y-1">
        <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-ink-muted hover:bg-base">
          <Bell size={18} />
          Notifications
        </button>
        <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-ink-muted hover:bg-base">
          <Settings size={18} />
          Settings
        </button>
        <div className="flex items-center gap-3 px-3 py-3 mt-1">
          <div className="w-9 h-9 rounded-full bg-primary-light text-primary flex items-center justify-center text-xs font-semibold">
            {currentDoctor.avatarInitials}
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold text-ink">{currentDoctor.name}</p>
            <p className="text-xs text-ink-faint">Doctor</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

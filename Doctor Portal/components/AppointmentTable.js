import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import StatusBadge from "./StatusBadge";
import { BILLING_URL } from "../lib/constants";

export default function AppointmentTable({ appointments }) {
  return (
    <div className="bg-surface border border-border rounded-card shadow-card overflow-hidden">
      <div className="overflow-x-auto thin-scroll">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-ink-faint uppercase tracking-wide border-b border-border">
              <th className="px-4 py-3 font-medium">Patient</th>
              <th className="px-4 py-3 font-medium">Time</th>
              <th className="px-4 py-3 font-medium">Complaint</th>
              <th className="px-4 py-3 font-medium">Wait</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {appointments.map((a) => (
              <tr key={a.id} className="border-b border-border last:border-0 hover:bg-base/60">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {a.urgent && <AlertTriangle size={14} className="text-red shrink-0" />}
                    <div>
                      <p className="font-medium text-ink">{a.patient}</p>
                      <p className="text-xs text-ink-faint">
                        {a.age}y · {a.gender} · {a.type}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-ink-muted">{a.time}</td>
                <td className="px-4 py-3 text-ink-muted">{a.complaint}</td>
                <td className="px-4 py-3 text-ink-muted">{a.wait}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={a.status} />
                </td>
                <td className="px-4 py-3 text-right">
                  {a.status === "Completed" ? (
                    <div className="flex items-center justify-end gap-2">
                      <span className="text-xs text-ink-faint">Completed</span>
                      <a
                        href={`${BILLING_URL}/bills`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center px-2 py-1 rounded bg-teal-50 text-teal-700 text-xs font-medium hover:bg-teal-100"
                      >
                        View Bill &rarr;
                      </a>
                    </div>
                  ) : (
                    <Link
                      href={`/consultation?patient=${encodeURIComponent(a.patient)}&patientId=${a.patientId || a._id || ""}&appointmentId=${a.id || a._id || ""}`}
                      className="inline-flex items-center px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-medium hover:bg-primary-dark transition shadow-sm"
                    >
                      {a.status === "In Consult" ? "Resume Consult" : "Start Consult"}
                    </Link>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

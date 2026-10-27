import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import { Pill, Search, RefreshCw, ExternalLink, Calendar } from "lucide-react";
import { BILLING_URL } from "../lib/constants";

export default function Prescriptions() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const fetchPrescriptions = () => {
    setLoading(true);
    fetch("/api/prescriptions")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.prescriptions)) {
          setPrescriptions(data.prescriptions);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const filtered = prescriptions.filter((rx) => {
    const pName = rx.patient?.name || rx.patientName || "";
    const med = rx.medicine || "";
    const term = search.toLowerCase();
    return pName.toLowerCase().includes(term) || med.toLowerCase().includes(term);
  });

  return (
    <Layout title="Prescriptions" subtitle="View clinical prescriptions linked to patient billing">
      {/* Top action bar */}
      <div className="mb-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
          <input
            type="text"
            placeholder="Search medicine or patient..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-surface border border-border rounded-lg text-ink placeholder:text-ink-faint focus:outline-none focus:border-primary"
          />
        </div>
        <div className="flex items-center gap-2">
          <a
            href={`${BILLING_URL}/bills`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-50 text-teal-700 text-xs font-medium hover:bg-teal-100 transition"
          >
            <ExternalLink size={13} />
            Go to Billing Desk
          </a>
          <button
            onClick={fetchPrescriptions}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-surface text-ink-muted text-xs hover:bg-base hover:text-ink transition"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-card shadow-card overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-teal-50 flex items-center justify-center mx-auto mb-3 text-teal-600">
              <Pill size={24} />
            </div>
            <p className="font-semibold text-ink text-sm">No prescriptions found</p>
            <p className="text-xs text-ink-faint mt-1">
              Prescriptions ordered during doctor consultations will automatically sync here and to patient invoices.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto thin-scroll">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-ink-faint uppercase tracking-wide border-b border-border bg-base/40">
                  <th className="px-4 py-3 font-medium">Patient</th>
                  <th className="px-4 py-3 font-medium">Prescribed Medicine</th>
                  <th className="px-4 py-3 font-medium">Dosage</th>
                  <th className="px-4 py-3 font-medium">Duration</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium text-right">Unified Billing</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((rx) => {
                  const patientName = rx.patient?.name || rx.patientName || "Patient";
                  const dateStr = rx.createdAt ? new Date(rx.createdAt).toLocaleDateString() : "Today";
                  return (
                    <tr key={rx._id} className="border-b border-border last:border-0 hover:bg-base/60">
                      <td className="px-4 py-3">
                        <p className="font-medium text-ink">{patientName}</p>
                        {rx.patient?.age && (
                          <p className="text-[11px] text-ink-faint">
                            {rx.patient.age}y · {rx.patient.gender}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 font-medium text-ink">
                          <Pill size={14} className="text-teal-600 shrink-0" />
                          {rx.medicine}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-block px-2 py-0.5 rounded text-xs bg-base font-mono text-ink-muted border border-border">
                          {rx.dosage}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-ink-muted text-xs">{rx.duration}</td>
                      <td className="px-4 py-3 text-ink-muted text-xs">
                        <span className="flex items-center gap-1">
                          <Calendar size={12} className="text-ink-faint" />
                          {dateStr}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <a
                          href={`${BILLING_URL}/bills?search=${encodeURIComponent(patientName)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-teal-50 text-teal-700 text-xs font-medium hover:bg-teal-100 transition"
                        >
                          View In Invoice &rarr;
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
}

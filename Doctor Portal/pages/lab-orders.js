import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import StatusBadge from "../components/StatusBadge";
import { FlaskConical, Search, RefreshCw, ExternalLink, Calendar } from "lucide-react";
import { BILLING_URL } from "../lib/constants";

export default function LabOrders() {
  const [labOrders, setLabOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const fetchLabOrders = () => {
    setLoading(true);
    fetch("/api/lab-orders")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.labOrders)) {
          setLabOrders(data.labOrders);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchLabOrders();
  }, []);

  const filtered = labOrders.filter((order) => {
    const pName = order.patient?.name || order.patientName || "";
    const test = order.testName || "";
    const term = search.toLowerCase();
    return pName.toLowerCase().includes(term) || test.toLowerCase().includes(term);
  });

  return (
    <Layout title="Lab Orders" subtitle="Diagnostic orders synchronized with pathology and billing">
      {/* Top action bar */}
      <div className="mb-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
          <input
            type="text"
            placeholder="Search test name or patient..."
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
            onClick={fetchLabOrders}
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
            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-3 text-blue-600">
              <FlaskConical size={24} />
            </div>
            <p className="font-semibold text-ink text-sm">No lab test orders found</p>
            <p className="text-xs text-ink-faint mt-1">
              Lab investigations ordered during consultations automatically sync to the diagnostic bench and billing ledger.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto thin-scroll">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-ink-faint uppercase tracking-wide border-b border-border bg-base/40">
                  <th className="px-4 py-3 font-medium">Patient</th>
                  <th className="px-4 py-3 font-medium">Investigation Test</th>
                  <th className="px-4 py-3 font-medium">Clinical Indication</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Ordered At</th>
                  <th className="px-4 py-3 font-medium text-right">Unified Billing</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((order) => {
                  const patientName = order.patient?.name || order.patientName || "Patient";
                  const dateStr = order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "Today";
                  return (
                    <tr key={order._id} className="border-b border-border last:border-0 hover:bg-base/60">
                      <td className="px-4 py-3">
                        <p className="font-medium text-ink">{patientName}</p>
                        {order.patient?.age && (
                          <p className="text-[11px] text-ink-faint">
                            {order.patient.age}y · {order.patient.gender}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 font-medium text-ink">
                          <FlaskConical size={14} className="text-blue-600 shrink-0" />
                          {order.testName}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-ink-muted text-xs">
                        {order.notes || "Routine examination"}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={order.status || "Ordered"} />
                      </td>
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

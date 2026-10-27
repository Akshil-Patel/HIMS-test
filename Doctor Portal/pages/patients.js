import { useState, useEffect } from "react";
import Link from "next/link";
import Layout from "../components/Layout";
import { patients as mockPatients } from "../data/mockData";
import { Search, Stethoscope, Receipt, RefreshCw } from "lucide-react";
import { BILLING_URL } from "../lib/constants";

export default function Patients() {
  const [patientList, setPatientList] = useState(mockPatients);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchPatients = () => {
    setLoading(true);
    fetch("/api/patients")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.patients) && data.patients.length > 0) {
          setPatientList(data.patients);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const filtered = patientList.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.condition && p.condition.toLowerCase().includes(search.toLowerCase())) ||
    (p.bloodGroup && p.bloodGroup.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <Layout title="Patients" subtitle="Patient records and encounter history">
      {/* Controls */}
      <div className="mb-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
          <input
            type="text"
            placeholder="Search by patient name, condition..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-surface border border-border rounded-lg text-ink placeholder:text-ink-faint focus:outline-none focus:border-primary"
          />
        </div>
        <button
          onClick={fetchPatients}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-surface text-ink-muted text-xs hover:bg-base hover:text-ink transition"
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      <div className="bg-surface border border-border rounded-card shadow-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-ink-faint uppercase tracking-wide border-b border-border bg-base/40">
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Age / Gender</th>
              <th className="px-4 py-3 font-medium">Blood Group</th>
              <th className="px-4 py-3 font-medium">Condition</th>
              <th className="px-4 py-3 font-medium">Contact</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => {
              const pId = p._id || p.id;
              return (
                <tr key={pId} className="border-b border-border last:border-0 hover:bg-base/60">
                  <td className="px-4 py-3">
                    <p className="font-medium text-ink">{p.name}</p>
                    <p className="text-[11px] text-ink-faint font-mono">ID: {pId.substring(0, 8)}...</p>
                  </td>
                  <td className="px-4 py-3 text-ink-muted">{p.age}y · {p.gender}</td>
                  <td className="px-4 py-3 text-ink-muted">
                    <span className="inline-block px-2 py-0.5 rounded text-xs bg-red/10 text-red font-medium">
                      {p.bloodGroup || "O+"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-ink-muted">{p.condition || "General Consultation"}</td>
                  <td className="px-4 py-3 text-ink-muted text-xs">{p.phone || "+91 98765 43210"}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/consultation?patient=${encodeURIComponent(p.name)}&patientId=${pId}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-primary text-white text-xs font-medium hover:bg-primary-dark transition"
                      >
                        <Stethoscope size={13} />
                        Consult
                      </Link>
                      <a
                        href={`${BILLING_URL}/bills?search=${encodeURIComponent(p.name)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-border bg-surface text-ink-muted text-xs hover:text-ink hover:bg-base transition"
                        title="View Unified Invoices"
                      >
                        <Receipt size={13} />
                        Bills
                      </a>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}

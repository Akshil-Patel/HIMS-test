import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import AppointmentTable from "../components/AppointmentTable";
import { appointments as mockAppointments } from "../data/mockData";
import { RefreshCw } from "lucide-react";

export default function Appointments() {
  const [appointmentsList, setAppointmentsList] = useState(mockAppointments);
  const [loading, setLoading] = useState(false);

  const fetchAppointments = () => {
    setLoading(true);
    fetch("/api/appointments")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.appointments) && data.appointments.length > 0) {
          setAppointmentsList(data.appointments);
        }
      })
      .catch((err) => console.error("Error fetching appointments:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  return (
    <Layout title="OPD / Appointments" subtitle="Manage today's appointment queue">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-xs text-ink-faint">
          Live queue connected to Integrated Hospital Billing Engine
        </p>
        <button
          onClick={fetchAppointments}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-surface text-ink-muted text-xs hover:bg-base hover:text-ink transition"
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          Refresh Queue
        </button>
      </div>
      <AppointmentTable appointments={appointmentsList} />
    </Layout>
  );
}

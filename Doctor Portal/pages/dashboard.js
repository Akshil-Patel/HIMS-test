import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import StatCard from "../components/StatCard";
import AppointmentTable from "../components/AppointmentTable";
import DoctorAvailability from "../components/DoctorAvailability";
import DepartmentLoad from "../components/DepartmentLoad";
import {
  stats as mockStats,
  appointments as mockAppointments,
  doctorAvailability,
  departmentLoad,
} from "../data/mockData";

export default function Dashboard() {
  const [statsData, setStatsData] = useState(mockStats);
  const [appointmentsData, setAppointmentsData] = useState(mockAppointments);

  useEffect(() => {
    // Fetch live stats
    fetch("/api/dashboard/stats")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.stats) && data.stats.length > 0) {
          // Merge icons from mockData if missing
          const mapped = data.stats.map((s, idx) => ({
            ...s,
            icon: mockStats[idx]?.icon || "Users",
          }));
          setStatsData(mapped);
        }
      })
      .catch(() => {});

    // Fetch live appointments
    fetch("/api/appointments")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.appointments) && data.appointments.length > 0) {
          setAppointmentsData(data.appointments);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <Layout title="Dashboard" subtitle="Overview of today's OPD activity">
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statsData.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      {/* Appointments table */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-ink mb-3">
          Today&apos;s Appointments
        </h2>
        <AppointmentTable appointments={appointmentsData} />
      </div>

      {/* Bottom panels */}
      <div className="grid lg:grid-cols-2 gap-4">
        <DoctorAvailability doctors={doctorAvailability} />
        <DepartmentLoad departments={departmentLoad} />
      </div>
    </Layout>
  );
}

const asyncHandler = require("../middleware/asyncHandler");
const Appointment = require("../models/Appointment");
const Doctor = require("../models/Doctor");

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}
function endOfToday() {
  const d = startOfToday();
  d.setHours(23, 59, 59, 999);
  return d;
}

// @desc  KPI row for the dashboard: Total Today / In Queue / Completed / Urgent.
//        Defaults to the logged-in doctor's own queue; pass doctorId=all for
//        a clinic-wide view.
// @route GET /api/dashboard/stats?doctorId=all
const getStats = asyncHandler(async (req, res) => {
  const { doctorId } = req.query;
  const scopeDoctor = doctorId === "all" ? null : doctorId || req.doctor._id;

  const range = { date: { $gte: startOfToday(), $lte: endOfToday() } };
  const filter = scopeDoctor ? { ...range, doctor: scopeDoctor } : range;

  const [total, inQueue, completed, urgent] = await Promise.all([
    Appointment.countDocuments(filter),
    Appointment.countDocuments({ ...filter, status: "Waiting" }),
    Appointment.countDocuments({ ...filter, status: "Completed" }),
    Appointment.countDocuments({ ...filter, urgent: true, status: { $ne: "Completed" } }),
  ]);

  res.json({
    success: true,
    stats: [
      { label: "Total Today", value: total, icon: "Users" },
      { label: "In Queue", value: inQueue, icon: "Clock" },
      { label: "Completed", value: completed, icon: "CheckCircle2" },
      { label: "Urgent / Priority", value: urgent, icon: "AlertCircle" },
    ],
  });
});

// @desc  Waiting/done/total load per department, for the DepartmentLoad chart
// @route GET /api/dashboard/department-load
const getDepartmentLoad = asyncHandler(async (req, res) => {
  const doctors = await Doctor.find().select("_id department");
  const deptByDoctor = Object.fromEntries(doctors.map((d) => [String(d._id), d.department]));

  const appointments = await Appointment.find({
    date: { $gte: startOfToday(), $lte: endOfToday() },
  }).select("doctor status");

  const byDept = {};
  for (const appt of appointments) {
    const dept = deptByDoctor[String(appt.doctor)];
    if (!dept) continue;
    byDept[dept] ??= { waiting: 0, done: 0, total: 0 };
    byDept[dept].total += 1;
    if (appt.status === "Waiting") byDept[dept].waiting += 1;
    if (appt.status === "Completed") byDept[dept].done += 1;
  }

  const departmentLoad = Object.entries(byDept).map(([name, d]) => ({
    name,
    waiting: d.waiting,
    done: d.done,
    total: d.total,
    pct: d.total ? Math.round((d.done / d.total) * 100) : 0,
  }));

  res.json({ success: true, departmentLoad });
});

module.exports = { getStats, getDepartmentLoad };

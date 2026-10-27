const asyncHandler = require("../middleware/asyncHandler");
const Appointment = require("../models/Appointment");
const Doctor = require("../models/Doctor");

function startOfDay(dateInput) {
  const d = dateInput ? new Date(dateInput) : new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}
function endOfDay(dateInput) {
  const d = startOfDay(dateInput);
  d.setHours(23, 59, 59, 999);
  return d;
}

// Turns checkedInAt into the "12m" style string the AppointmentTable shows.
function formatWait(appt) {
  if (appt.status !== "Waiting" || !appt.checkedInAt) return "-";
  const mins = Math.max(0, Math.round((Date.now() - new Date(appt.checkedInAt)) / 60000));
  return `${mins}m`;
}

function toRow(appt) {
  return {
    id: appt._id,
    patient: appt.patient?.name,
    patientId: appt.patient?._id,
    age: appt.patient?.age,
    gender: appt.patient?.gender,
    type: appt.type,
    time: appt.time,
    complaint: appt.complaint,
    wait: formatWait(appt),
    status: appt.status,
    urgent: appt.urgent,
    doctor: appt.doctor?.name,
    doctorId: appt.doctor?._id,
  };
}

// @desc  List today's appointments, optionally filtered by status/doctor
// @route GET /api/appointments?status=Waiting&doctorId=...&date=2026-09-20
const getAppointments = asyncHandler(async (req, res) => {
  const { status, doctorId, date } = req.query;

  const filter = { date: { $gte: startOfDay(date), $lte: endOfDay(date) } };
  if (status && status !== "All") filter.status = status;
    if (doctorId && doctorId !== "all") filter.doctor = doctorId;

  const appointments = await Appointment.find(filter)
    .populate("patient", "name age gender")
    .populate("doctor", "name")
    .sort({ time: 1 });

  res.json({ success: true, appointments: appointments.map(toRow) });
});

// @desc  Get a single appointment
// @route GET /api/appointments/:id
const getAppointmentById = asyncHandler(async (req, res) => {
  const appt = await Appointment.findById(req.params.id)
    .populate("patient", "name age gender")
    .populate("doctor", "name");
  if (!appt) {
    res.status(404);
    throw new Error("Appointment not found");
  }
  res.json({ success: true, appointment: toRow(appt) });
});

// @desc  Book a new appointment
// @route POST /api/appointments
const createAppointment = asyncHandler(async (req, res) => {
  const { patient, doctor, date, time, type, complaint, urgent } = req.body;

  if (!patient || !doctor || !time || !type || !complaint) {
    res.status(400);
    throw new Error("patient, doctor, time, type and complaint are required");
  }

  const appt = await Appointment.create({
    patient,
    doctor,
    date: date || new Date(),
    time,
    type,
    complaint,
    urgent: !!urgent,
    status: "Scheduled",
  });

  const populated = await appt.populate([
    { path: "patient", select: "name age gender" },
    { path: "doctor", select: "name" },
  ]);

  res.status(201).json({ success: true, appointment: toRow(populated) });
});

// @desc  Move an appointment through the queue (Scheduled -> Waiting -> In Consult -> Completed)
// @route PATCH /api/appointments/:id/status
// @body  { status }
const updateAppointmentStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const validStatuses = ["Scheduled", "Waiting", "In Consult", "Completed", "Cancelled"];

  if (!validStatuses.includes(status)) {
    res.status(400);
    throw new Error(`status must be one of: ${validStatuses.join(", ")}`);
  }

  const appt = await Appointment.findById(req.params.id);
  if (!appt) {
    res.status(404);
    throw new Error("Appointment not found");
  }

  if (status === "Waiting" && !appt.checkedInAt) {
    appt.checkedInAt = new Date();
  }
  appt.status = status;
  await appt.save();

  // Keep the doctor's live status roughly in sync with their queue.
  if (status === "In Consult") {
    await Doctor.findByIdAndUpdate(appt.doctor, {
      status: "In Consult",
      currentPatient: appt.patient,
    });
  } else if (status === "Completed") {
    await Doctor.findByIdAndUpdate(appt.doctor, { status: "Available", currentPatient: null });
  }

  const populated = await appt.populate([
    { path: "patient", select: "name age gender" },
    { path: "doctor", select: "name" },
  ]);

  res.json({ success: true, appointment: toRow(populated) });
});

module.exports = {
  getAppointments,
  getAppointmentById,
  createAppointment,
  updateAppointmentStatus,
};

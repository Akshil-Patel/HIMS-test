const asyncHandler = require("../middleware/asyncHandler");
const Doctor = require("../models/Doctor");
const Appointment = require("../models/Appointment");

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

// @desc  List all doctors with today's live counters, for the DoctorAvailability panel
// @route GET /api/doctors
const getDoctors = asyncHandler(async (req, res) => {
  const doctors = await Doctor.find().populate("currentPatient", "name");
  const todayStart = startOfToday();

  // "seen" = how many patients this doctor has completed today
  const seenCounts = await Appointment.aggregate([
    { $match: { date: { $gte: todayStart }, status: "Completed" } },
    { $group: { _id: "$doctor", count: { $sum: 1 } } },
  ]);
  const seenMap = Object.fromEntries(seenCounts.map((s) => [String(s._id), s.count]));

    const payload = doctors.map((doc) => ({
    id: doc._id,
    name: doc.name,
    dept: doc.department,
    status: doc.status,
    currentPatient: doc.currentPatient ? doc.currentPatient.name : null,
    seen: seenMap[String(doc._id)] || 0,
    avgMins: doc.avgConsultMins,
    next: doc.status === "Available" ? "Now" : `+${doc.avgConsultMins} min`,
  }));
  
  res.json({ success: true, doctors: payload });
});

// @desc  Get a single doctor
// @route GET /api/doctors/:id
const getDoctorById = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findById(req.params.id);
  if (!doctor) {
    res.status(404);
    throw new Error("Doctor not found");
  }
  res.json({ success: true, doctor });
});

module.exports = { getDoctors, getDoctorById };

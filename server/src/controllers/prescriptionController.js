const asyncHandler = require("../middleware/asyncHandler");
const Prescription = require("../models/Prescription");

// @desc  List prescriptions (the Prescriptions page: "All prescriptions you've
//        written" — defaults to the logged-in doctor, can be filtered further)
// @route GET /api/prescriptions?doctorId=...&patientId=...
const getPrescriptions = asyncHandler(async (req, res) => {
  const { doctorId, patientId } = req.query;
  const filter = { doctor: doctorId || req.doctor._id };
  if (patientId) filter.patient = patientId;

  const prescriptions = await Prescription.find(filter)
    .populate("patient", "name age gender")
    .sort({ createdAt: -1 });

  res.json({ success: true, prescriptions });
});

module.exports = { getPrescriptions };

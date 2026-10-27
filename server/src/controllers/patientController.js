const asyncHandler = require("../middleware/asyncHandler");
const Patient = require("../models/Patient");
const Consultation = require("../models/Consultation");
const Prescription = require("../models/Prescription");

// @desc  List / search patients (used by the Patients grid)
// @route GET /api/patients?search=meena
const getPatients = asyncHandler(async (req, res) => {
  const { search } = req.query;
  const filter = search ? { name: { $regex: search, $options: "i" } } : {};
  const patients = await Patient.find(filter).sort({ name: 1 });

  res.json({
    success: true,
    patients: patients.map((p) => ({
      id: p._id,
      name: p.name,
      age: p.age,
      gender: p.gender,
      phone: p.phone,
      bloodGroup: p.bloodGroup,
      condition: p.condition,
      lastVisit: p.lastVisit,
    })),
  });
});

// @desc  Get one patient with vitals + visit history + prescriptions,
//        shaped to match the mockData.patients[] object the frontend expects
// @route GET /api/patients/:id
const getPatientById = asyncHandler(async (req, res) => {
  const patient = await Patient.findById(req.params.id);
  if (!patient) {
    res.status(404);
    throw new Error("Patient not found");
  }

  const [history, prescriptions] = await Promise.all([
    Consultation.find({ patient: patient._id }).sort({ createdAt: -1 }),
    Prescription.find({ patient: patient._id }).sort({ createdAt: -1 }),
  ]);

  res.json({
    success: true,
    patient: {
      id: patient._id,
      name: patient.name,
      age: patient.age,
      gender: patient.gender,
      phone: patient.phone,
      bloodGroup: patient.bloodGroup,
      lastVisit: patient.lastVisit,
      condition: patient.condition,
      vitals: patient.vitals,
      history: history.map((h) => ({ date: h.createdAt, note: h.diagnosis + (h.notes ? ` — ${h.notes}` : "") })),
      prescriptions: prescriptions.map((p) => ({
        date: p.createdAt,
        medicine: p.medicine,
        dosage: p.dosage,
        duration: p.duration,
      })),
    },
  });
});

// @desc  Register a new patient
// @route POST /api/patients
const createPatient = asyncHandler(async (req, res) => {
  const { name, age, gender, phone, bloodGroup, condition } = req.body;

  if (!name || !age || !gender) {
    res.status(400);
    throw new Error("name, age and gender are required");
  }

  const patient = await Patient.create({ name, age, gender, phone, bloodGroup, condition });
  res.status(201).json({ success: true, patient });
});

// @desc  Update a patient's vitals (e.g. taken at intake)
// @route PATCH /api/patients/:id/vitals
const updateVitals = asyncHandler(async (req, res) => {
  const { bp, pulse, temp, spo2 } = req.body;

  const patient = await Patient.findById(req.params.id);
  if (!patient) {
    res.status(404);
    throw new Error("Patient not found");
  }

  patient.vitals = {
    bp: bp ?? patient.vitals.bp,
    pulse: pulse ?? patient.vitals.pulse,
    temp: temp ?? patient.vitals.temp,
    spo2: spo2 ?? patient.vitals.spo2,
  };
  await patient.save();

  res.json({ success: true, patient });
});

module.exports = { getPatients, getPatientById, createPatient, updateVitals };
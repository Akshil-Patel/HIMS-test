const mongoose = require("mongoose");
const asyncHandler = require("../middleware/asyncHandler");
const Consultation = require("../models/Consultation");
const Prescription = require("../models/Prescription");
const LabOrder = require("../models/LabOrder");
const Appointment = require("../models/Appointment");
const Patient = require("../models/Patient");
const Doctor = require("../models/Doctor");

// This is the riskiest write path in the app: saving one consultation touches
// up to five collections (Consultation, Prescription[], LabOrder[], Appointment,
// Doctor, Patient.vitals). If it fails partway through, you can end up with a
// diagnosis saved but no prescriptions, or an appointment stuck "In Consult"
// forever. We use a Mongo session transaction so the whole thing commits or
// rolls back together, atomically.
//
// Caveat: transactions require MongoDB to be running as a replica set (a
// single local `mongod` in standalone mode does not support them). Atlas
// clusters and `mongodb-memory-server` in replica-set mode both work out of
// the box. If you're on a bare standalone mongod locally, either run
// `mongod --replSet rs0` and `rs.initiate()` once, or see the fallback note
// at the bottom of this file.

// @desc  Save a completed consultation: diagnosis + notes, prescriptions,
//        optional lab orders. Marks the appointment Completed and frees up
//        the doctor.
// @route POST /api/consultations
// @body  {
//   patientId, appointmentId, notes, diagnosis,
//   medications: [{ name, dosage, duration }],
//   labOrders: [{ testName, notes }]   // optional
//   vitals: { bp, pulse, temp, spo2 }  // optional, updates the patient record
// }
const createConsultation = asyncHandler(async (req, res) => {
  const { patientId, appointmentId, notes, diagnosis, medications = [], labOrders = [], vitals } = req.body;
  const doctorId = req.doctor._id;

  if (!patientId || !diagnosis) {
    res.status(400);
    throw new Error("patientId and diagnosis are required");
  }

  const session = await mongoose.startSession();

  try {
    let consultation;

    await session.withTransaction(async () => {
      const [created] = await Consultation.create(
        [{ patient: patientId, doctor: doctorId, appointment: appointmentId || null, notes, diagnosis }],
        { session }
      );
      consultation = created;

      const validMeds = medications.filter((m) => m.name && m.dosage && m.duration);
      if (validMeds.length) {
        await Prescription.insertMany(
          validMeds.map((m) => ({
            patient: patientId,
            doctor: doctorId,
            consultation: consultation._id,
            medicine: m.name,
            dosage: m.dosage,
            duration: m.duration,
          })),
          { session }
        );
      }

      const validLabOrders = labOrders.filter((l) => l.testName);
      if (validLabOrders.length) {
        await LabOrder.insertMany(
          validLabOrders.map((l) => ({
            patient: patientId,
            doctor: doctorId,
            consultation: consultation._id,
            testName: l.testName,
            notes: l.notes || "",
          })),
          { session }
        );
      }

            await Patient.findByIdAndUpdate(
        patientId,
        { $set: { ...(vitals ? { vitals } : {}), lastVisit: new Date(), condition: diagnosis } },
        { session }
      );

      if (appointmentId) {
        await Appointment.findByIdAndUpdate(appointmentId, { status: "Completed" }, { session });
      }

      await Doctor.findByIdAndUpdate(doctorId, { status: "Available", currentPatient: null }, { session });
    });

    res.status(201).json({ success: true, consultationId: consultation._id });
  } finally {
    session.endSession();
  }
});

// @desc  Get a patient's consultation history (raw, unformatted — see
//        patientController.getPatientById for the frontend-shaped version)
// @route GET /api/consultations/:patientId
const getConsultationsForPatient = asyncHandler(async (req, res) => {
  const consultations = await Consultation.find({ patient: req.params.patientId })
    .populate("doctor", "name")
    .sort({ createdAt: -1 });
  res.json({ success: true, consultations });
});

module.exports = { createConsultation, getConsultationsForPatient };

// --- Fallback for standalone MongoDB (no replica set, no transactions) -----
// If you can't run a replica set locally, the pragmatic alternative is:
//   1. Do the writes sequentially (Consultation, then Prescriptions, then
//      LabOrders, then Appointment/Doctor update) without a session.
//   2. Wrap the whole handler in try/catch; on failure, best-effort delete
//      whatever was already written (compensating deletes) before re-throwing.
// This is weaker than a real transaction (a crash between steps still leaves
// orphaned data) but is fine for local dev. Swap createConsultation above for
// this version if `session.withTransaction` throws
// "Transaction numbers are only allowed on a replica set member".

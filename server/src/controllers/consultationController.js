const mongoose = require('mongoose');
const asyncHandler = require('../middleware/asyncHandler');
const Consultation = require('../models/Consultation');
const Prescription = require('../models/Prescription');
const LabOrder = require('../models/LabOrder');
const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const encounterBillingService = require('../services/encounterBillingService');

/**
 * @desc  Save consultation + prescriptions + lab orders AND auto-generate/merge into Unified Patient Bill
 * @route POST /api/consultations
 */
const createConsultation = asyncHandler(async (req, res) => {
  const {
    patientId,
    patientName,
    patientPhone,
    appointmentId,
    notes = '',
    diagnosis,
    medications = [],
    labOrders = [],
    vitals,
    consultationFee = 500,
  } = req.body;

  if (!diagnosis) {
    res.status(400);
    throw new Error('Diagnosis is required to complete consultation');
  }

  // 1. Resolve Patient
  let patientDoc = null;
  if (patientId && mongoose.Types.ObjectId.isValid(patientId)) {
    patientDoc = await Patient.findById(patientId);
  }
  if (!patientDoc && patientName) {
    patientDoc = await Patient.findOne({ name: new RegExp(`^${patientName.trim()}$`, 'i') });
  }

  // If patient not in DB yet, create one
  if (!patientDoc) {
    const finalName = (patientName || 'Walk-in Patient').trim();
    patientDoc = await Patient.create({
      name: finalName,
      age: req.body.age || 40,
      gender: req.body.gender || 'Other',
      phone: patientPhone || '',
      condition: diagnosis,
      vitals: vitals || {},
      lastVisit: new Date(),
    });
  } else {
    // Update existing patient record
    patientDoc.condition = diagnosis;
    patientDoc.lastVisit = new Date();
    if (vitals) {
      patientDoc.vitals = { ...patientDoc.vitals, ...vitals };
    }
    if (patientPhone && !patientDoc.phone) {
      patientDoc.phone = patientPhone;
    }
    await patientDoc.save();
  }

  // 2. Resolve Doctor
  const doctorId = req.doctor?._id;
  const doctorName = req.doctor?.name || 'Dr. Priya Sharma';

  // 3. Create Consultation Record
  const consultation = await Consultation.create({
    patient: patientDoc._id,
    doctor: doctorId || null,
    appointment: appointmentId && mongoose.Types.ObjectId.isValid(appointmentId) ? appointmentId : null,
    notes,
    diagnosis,
    durationMins: req.body.durationMins || 10,
  });

  // 4. Create Prescriptions
  const validMeds = medications.filter((m) => (m.name || m.medicine) && m.dosage);
  let savedPrescriptions = [];
  if (validMeds.length) {
    savedPrescriptions = await Prescription.insertMany(
      validMeds.map((m) => ({
        patient: patientDoc._id,
        doctor: doctorId || null,
        consultation: consultation._id,
        medicine: m.name || m.medicine,
        dosage: m.dosage,
        duration: m.duration || '5 days',
      }))
    );
  }

  // 5. Create Lab Orders
  const validLabs = labOrders.filter((l) => l.testName || l.name);
  let savedLabs = [];
  if (validLabs.length) {
    savedLabs = await LabOrder.insertMany(
      validLabs.map((l) => ({
        patient: patientDoc._id,
        doctor: doctorId || null,
        consultation: consultation._id,
        testName: l.testName || l.name,
        notes: l.notes || '',
      }))
    );
  }

  // 6. Update Appointment status if provided
  if (appointmentId && mongoose.Types.ObjectId.isValid(appointmentId)) {
    await Appointment.findByIdAndUpdate(appointmentId, { status: 'Completed' });
  }

  // 7. Update Doctor status
  if (doctorId) {
    await Doctor.findByIdAndUpdate(doctorId, { status: 'Available', currentPatient: null });
  }

  // 8. 🚀 AUTOMATICALLY GENERATE OR MERGE INTO UNIFIED PATIENT BILL
  const billingResult = await encounterBillingService.syncConsultationToUnifiedBill({
    patientId: patientDoc._id.toString(),
    patientName: patientDoc.name,
    patientPhone: patientDoc.phone,
    doctorName,
    diagnosis,
    notes,
    consultationFee: parseFloat(consultationFee) || 500,
    medications: validMeds,
    labOrders: validLabs,
  });

  res.status(201).json({
    success: true,
    consultationId: consultation._id,
    consultation,
    prescriptions: savedPrescriptions,
    labOrders: savedLabs,
    bill: billingResult.bill,
    isNewBill: billingResult.isNew,
    itemsAdded: billingResult.itemCount,
    whatsappDelivery: billingResult.whatsappDelivery,
    message: `Consultation recorded and Unified Patient Bill ${billingResult.bill.billNumber} prepared (₹${billingResult.bill.grandTotal}).`,
  });
});

/**
 * @desc Get consultations for patient
 * @route GET /api/consultations/:patientId
 */
const getConsultationsForPatient = asyncHandler(async (req, res) => {
  const { patientId } = req.params;
  const query = mongoose.Types.ObjectId.isValid(patientId)
    ? { patient: patientId }
    : {};

  const consultations = await Consultation.find(query)
    .populate('doctor', 'name specialization')
    .sort({ createdAt: -1 });

  res.json({ success: true, consultations });
});

/**
 * @desc Get all consultations
 * @route GET /api/consultations
 */
const getAllConsultations = asyncHandler(async (req, res) => {
  const consultations = await Consultation.find()
    .populate('patient', 'name phone age gender')
    .populate('doctor', 'name specialization')
    .sort({ createdAt: -1 })
    .limit(20);

  res.json({ success: true, consultations });
});

module.exports = {
  createConsultation,
  getConsultationsForPatient,
  getAllConsultations,
};

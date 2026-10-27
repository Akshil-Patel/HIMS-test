const Bill = require('../models/Bill');
const billService = require('./billService');
const { calculateBillSummary } = require('../utils/helpers');
const whatsappService = require('./whatsappService');

const STANDARD_MED_PRICES = {
  paracetamol: 35,
  amoxicillin: 120,
  amlodipine: 65,
  metformin: 85,
  azithromycin: 140,
  pantoprazole: 90,
  cetirizine: 40,
  ibuprofen: 50,
  ciprofloxacin: 110,
  atorvastatin: 130,
};

const STANDARD_TEST_PRICES = {
  'complete blood count': 350,
  cbc: 350,
  'lipid profile': 600,
  hba1c: 450,
  'blood sugar': 120,
  'fasting blood sugar': 120,
  'liver function test': 650,
  lft: 650,
  'kidney function test': 550,
  kft: 550,
  'chest x-ray': 500,
  'x-ray': 500,
  ecg: 250,
  'urine routine': 200,
  thyroid: 400,
};

function estimateMedicinePrice(name) {
  if (!name) return 75;
  const lower = name.toLowerCase();
  for (const [key, price] of Object.entries(STANDARD_MED_PRICES)) {
    if (lower.includes(key)) return price;
  }
  return 75;
}

function estimateTestPrice(name) {
  if (!name) return 350;
  const lower = name.toLowerCase();
  for (const [key, price] of Object.entries(STANDARD_TEST_PRICES)) {
    if (lower.includes(key)) return price;
  }
  return 350;
}

/**
 * Automatically creates or merges multi-department charges into a single unified patient bill.
 */
async function syncConsultationToUnifiedBill({
  patientId = '',
  patientName = '',
  patientPhone = '',
  doctorName = 'Senior Consultant',
  diagnosis = '',
  notes = '',
  consultationFee = 500,
  medications = [],
  labOrders = [],
}) {
  if (!patientName.trim()) {
    throw new Error('Patient name is required for auto-billing');
  }

  // 1. Prepare items to add
  const newItems = [];

  // A. Consultation fee item
  if (consultationFee > 0) {
    newItems.push({
      description: `OPD Consultation — ${doctorName}`,
      category: 'consultation',
      quantity: 1,
      unitPrice: consultationFee,
      discountPercent: 0,
      taxPercent: 0,
    });
  }

  // B. Prescribed Medications (Pharmacy items)
  for (const med of medications) {
    const medName = med.name || med.medicine;
    if (!medName) continue;
    const dosageInfo = med.dosage ? `${med.dosage}` : '';
    const durationInfo = med.duration ? `, ${med.duration}` : '';
    const desc = `${medName}${dosageInfo || durationInfo ? ` (${dosageInfo}${durationInfo})` : ''}`;
    const price = med.unitPrice ? parseFloat(med.unitPrice) : estimateMedicinePrice(medName);

    newItems.push({
      description: desc,
      category: 'medicine',
      quantity: med.quantity ? parseInt(med.quantity, 10) : 1,
      unitPrice: price,
      discountPercent: med.discountPercent ? parseFloat(med.discountPercent) : 0,
      taxPercent: 5, // Standard GST on pharma
    });
  }

  // C. Lab Orders (Diagnostic test items)
  for (const lab of labOrders) {
    const testName = lab.testName || lab.name;
    if (!testName) continue;
    const notesInfo = lab.notes ? ` (${lab.notes})` : '';
    const desc = `${testName}${notesInfo}`;
    const price = lab.unitPrice ? parseFloat(lab.unitPrice) : estimateTestPrice(testName);

    newItems.push({
      description: desc,
      category: 'test',
      quantity: 1,
      unitPrice: price,
      discountPercent: 0,
      taxPercent: 0,
    });
  }

  if (newItems.length === 0) {
    throw new Error('No items generated from consultation to bill');
  }

  // 2. Look for an active, unsettled bill for this patient
  const orConditions = [{ 'patient.name': new RegExp(`^${patientName.trim()}$`, 'i') }];
  if (patientId && patientId.trim()) {
    orConditions.push({ 'patient.patientId': patientId.trim() });
  }

  const existingBill = await Bill.findOne({
    $or: orConditions,
    status: { $in: ['draft', 'finalized', 'partially_paid'] },
  }).sort({ createdAt: -1 });

  let billResult;
  let isNew = false;

  if (existingBill) {
    // Merge into the patient's existing active bill
    const combinedRawItems = [
      ...existingBill.items.map((it) => ({
        description: it.description,
        category: it.category,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        discountPercent: it.discountPercent,
        taxPercent: it.taxPercent,
      })),
      ...newItems,
    ];

    const summary = calculateBillSummary(combinedRawItems);

    existingBill.items = summary.items;
    existingBill.subtotal = summary.subtotal;
    existingBill.discountTotal = summary.discountTotal;
    existingBill.taxTotal = summary.taxTotal;
    existingBill.grandTotal = summary.grandTotal;
    existingBill.balanceDue = summary.grandTotal - existingBill.amountPaid;

    if (existingBill.balanceDue > 0 && existingBill.status === 'draft') {
      existingBill.status = 'finalized'; // Auto-finalize so it can be paid immediately
    } else if (existingBill.amountPaid > 0 && existingBill.balanceDue > 0) {
      existingBill.status = 'partially_paid';
    }

    existingBill.source.module = 'multi-dept';
    if (!existingBill.patient.patientId && patientId) {
      existingBill.patient.patientId = patientId;
    }
    if (!existingBill.patient.phone && patientPhone) {
      existingBill.patient.phone = patientPhone;
    }

    const appendNote = ` [Added from ${doctorName} Consultation: ${diagnosis || 'Review'}]`;
    existingBill.notes = (existingBill.notes || '') + appendNote;

    await existingBill.save();
    billResult = existingBill;
  } else {
    // Create new Unified Patient Bill
    const newBillData = {
      patient: {
        name: patientName.trim(),
        patientId: patientId ? patientId.trim() : `UHID-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
        phone: patientPhone ? patientPhone.trim() : '',
      },
      source: {
        module: 'multi-dept',
        referenceNumber: `CONS-${Date.now().toString().slice(-6)}`,
      },
      items: newItems,
      notes: `Unified Patient Bill. Consultation by ${doctorName}. Diagnosis: ${diagnosis || 'General Clinical Review'}.`,
    };

    const created = await billService.createBill(newBillData);
    // Auto-finalize so patient can immediately pay via counter or QR code
    const finalized = await billService.finalizeBill(created._id);
    billResult = finalized;
    isNew = true;
  }

  // Automatically dispatch WhatsApp notification with PDF receipt link
  let whatsappDelivery = null;
  try {
    whatsappDelivery = await whatsappService.sendBillToWhatsApp(billResult);
  } catch (waErr) {
    console.warn('[EncounterBillingService] Automated WhatsApp dispatch notice:', waErr.message);
  }

  return {
    success: true,
    bill: billResult,
    isNew,
    itemCount: newItems.length,
    whatsappDelivery,
  };
}

module.exports = {
  syncConsultationToUnifiedBill,
  estimateMedicinePrice,
  estimateTestPrice,
};

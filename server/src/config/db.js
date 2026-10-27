const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/lipms';
  try {
    // Attempt connecting to the configured URI (with a short 3s timeout)
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3000,
    });
    console.log(`MongoDB connected: ${conn.connection.host}`);
    await seedInitialData();
  } catch (error) {
    console.warn(`Local MongoDB daemon not detected (${error.message}). Initializing embedded persistent MongoDB...`);
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const dbPath = path.join(__dirname, '../../.mongo-data');
      if (!fs.existsSync(dbPath)) {
        fs.mkdirSync(dbPath, { recursive: true });
      }

      const mongod = await MongoMemoryServer.create({
        instance: {
          dbPath,
          storageEngine: 'wiredTiger',
        },
      });
      const memoryUri = mongod.getUri();
      const conn = await mongoose.connect(memoryUri);
      console.log(`Persistent Embedded MongoDB connected: ${conn.connection.host}`);

      // Seed initial sample data only if collection is empty
      await seedInitialData();
    } catch (memError) {
      console.error(`Failed to start embedded MongoDB: ${memError.message}`);
      process.exit(1);
    }
  }
};

async function seedInitialData() {
  const Bill = require('../models/Bill');
  const count = await Bill.countDocuments();
  if (count === 0) {
    const billService = require('../services/billService');
    const bill1 = await billService.createBill({
      patient: { name: 'Aarav Sharma', patientId: 'UHID-2026-001', phone: '9876543210' },
      source: { module: 'pharmacy', referenceNumber: 'RX-9921' },
      items: [
        { description: 'Amoxicillin 500mg (10 tabs)', category: 'medicine', quantity: 2, unitPrice: 120, discountPercent: 5, taxPercent: 5 },
        { description: 'Paracetamol 650mg (15 tabs)', category: 'medicine', quantity: 1, unitPrice: 45, discountPercent: 0, taxPercent: 0 }
      ],
      notes: 'Initial pharmacy prescription'
    });
    await billService.finalizeBill(bill1._id);
    await billService.recordPayment(bill1._id, {
      method: 'upi',
      amount: bill1.grandTotal,
      transactionId: 'UPI-DEMO-7788',
      receivedBy: 'Staff Cashier'
    });

    const bill2 = await billService.createBill({
      patient: { name: 'Priya Verma', patientId: 'UHID-2026-002', phone: '9811223344' },
      source: { module: 'laboratory', referenceNumber: 'LAB-401' },
      items: [
        { description: 'Complete Blood Count (CBC)', category: 'test', quantity: 1, unitPrice: 450, discountPercent: 10, taxPercent: 0 },
        { description: 'Lipid Profile Screen', category: 'test', quantity: 1, unitPrice: 750, discountPercent: 5, taxPercent: 5 }
      ],
      notes: 'Routine health screening'
    });
    await billService.finalizeBill(bill2._id);
    await billService.recordPayment(bill2._id, {
      method: 'cash',
      amount: 500,
      receivedBy: 'Staff Cashier'
    });

    const bill3 = await billService.createBill({
      patient: { name: 'Rohan Mehra', patientId: 'UHID-2026-003', phone: '9988776655' },
      source: { module: 'consultation', referenceNumber: 'OPD-882' },
      items: [
        { description: 'Senior Physician OPD Consultation', category: 'consultation', quantity: 1, unitPrice: 800, discountPercent: 0, taxPercent: 0 }
      ],
      notes: 'Draft awaiting prescription discharge'
    });

    console.log('Sample hospital billing records seeded successfully.');
  }

  // Seed Doctors, Patients, Appointments if empty
  const Doctor = require('../models/Doctor');
  const Patient = require('../models/Patient');
  const Appointment = require('../models/Appointment');

  const docCount = await Doctor.countDocuments();
  if (docCount === 0) {
    const doctors = await Doctor.create([
      { name: 'Dr. Priya Sharma', email: 'priya.sharma@pcthims.com', password: 'password123', specialization: 'General Medicine', department: 'General Medicine', status: 'Available' },
      { name: 'Dr. Arjun Mehta', email: 'arjun.mehta@pcthims.com', password: 'password123', specialization: 'Cardiology', department: 'Cardiology', status: 'Available', avgConsultMins: 12 },
      { name: 'Dr. Sunita Rao', email: 'sunita.rao@pcthims.com', password: 'password123', specialization: 'Paediatrics', department: 'Paediatrics', status: 'Available', avgConsultMins: 10 },
      { name: 'Dr. Vikram Nair', email: 'vikram.nair@pcthims.com', password: 'password123', specialization: 'Orthopaedics', department: 'Orthopaedics', status: 'Available', avgConsultMins: 15 },
      { name: 'Dr. Kavitha Iyer', email: 'kavitha.iyer@pcthims.com', password: 'password123', specialization: 'Dermatology', department: 'Dermatology', status: 'Available', avgConsultMins: 9 },
    ]);

    const patients = await Patient.create([
      { name: 'Ramesh Gupta', age: 58, gender: 'M', phone: '+91 98765 43210', bloodGroup: 'B+', lastVisit: new Date(), condition: 'Hypertension', vitals: { bp: '138/88', pulse: '76 bpm', temp: '98.4°F', spo2: '97%' } },
      { name: 'Meena Joshi', age: 32, gender: 'F', phone: '+91 91234 56789', bloodGroup: 'O+', lastVisit: new Date(), condition: 'Viral fever', vitals: { bp: '118/76', pulse: '88 bpm', temp: '101.2°F', spo2: '98%' } },
      { name: 'Lakshmi Devi', age: 45, gender: 'F', phone: '+91 99887 76655', bloodGroup: 'A+', lastVisit: new Date(), condition: 'Type 2 Diabetes', vitals: { bp: '128/82', pulse: '80 bpm', temp: '98.2°F', spo2: '99%' } },
      { name: 'Rajesh Verma', age: 48, gender: 'M', phone: '+91 98123 45678', bloodGroup: 'B+', lastVisit: new Date(), condition: 'Chest discomfort', vitals: { bp: '130/85', pulse: '82 bpm', temp: '98.6°F', spo2: '98%' } },
      { name: 'Sunita Kapoor', age: 36, gender: 'F', phone: '+91 98765 01234', bloodGroup: 'A+', lastVisit: new Date(), condition: 'Seasonal allergy', vitals: { bp: '120/80', pulse: '74 bpm', temp: '98.5°F', spo2: '99%' } },
    ]);

    const today = new Date();
    await Appointment.create([
      { patient: patients[0]._id, doctor: doctors[0]._id, date: today, time: '09:00', type: 'Follow-up', complaint: 'Hypertension follow-up', status: 'Waiting', checkedInAt: new Date(Date.now() - 15 * 60000) },
      { patient: patients[1]._id, doctor: doctors[0]._id, date: today, time: '09:30', type: 'New', complaint: 'Fever & body ache', status: 'Waiting', checkedInAt: new Date(Date.now() - 5 * 60000) },
      { patient: patients[2]._id, doctor: doctors[0]._id, date: today, time: '10:00', type: 'Follow-up', complaint: 'Diabetes review', status: 'Scheduled' },
      { patient: patients[3]._id, doctor: doctors[1]._id, date: today, time: '10:30', type: 'New', complaint: 'Chest discomfort', status: 'Waiting', urgent: true },
      { patient: patients[4]._id, doctor: doctors[0]._id, date: today, time: '11:00', type: 'New', complaint: 'Seasonal allergy & cough', status: 'Scheduled' },
    ]);

    console.log('Sample clinical doctors, patients, and appointments seeded successfully.');
  }
}

module.exports = connectDB;

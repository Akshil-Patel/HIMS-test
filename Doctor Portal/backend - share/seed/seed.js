// Populates MongoDB with data equivalent to the frontend's data/mockData.js,
// so the app looks identical the moment you switch it over to real fetch()
// calls. Run with: npm run seed   (add --destroy to just wipe collections)
require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");

const Doctor = require("../models/Doctor");
const Patient = require("../models/Patient");
const Appointment = require("../models/Appointment");
const Consultation = require("../models/Consultation");
const Prescription = require("../models/Prescription");
const LabOrder = require("../models/LabOrder");

const DEFAULT_PASSWORD = "password123"; // every seeded doctor gets this — change after login

async function destroyData() {
  await Promise.all([
    Doctor.deleteMany(),
    Patient.deleteMany(),
    Appointment.deleteMany(),
    Consultation.deleteMany(),
    Prescription.deleteMany(),
    LabOrder.deleteMany(),
  ]);
  console.log("All collections cleared.");
}

async function seedData() {
  await destroyData();

  const doctors = await Doctor.create([
    { name: "Dr. Priya Sharma", email: "priya.sharma@pcthims.com", password: DEFAULT_PASSWORD, specialization: "General Medicine", department: "General Medicine", status: "In Consult" },
    { name: "Dr. Arjun Mehta", email: "arjun.mehta@pcthims.com", password: DEFAULT_PASSWORD, specialization: "Cardiology", department: "Cardiology", status: "Available", avgConsultMins: 12 },
    { name: "Dr. Sunita Rao", email: "sunita.rao@pcthims.com", password: DEFAULT_PASSWORD, specialization: "Paediatrics", department: "Paediatrics", status: "In Consult", avgConsultMins: 10 },
    { name: "Dr. Vikram Nair", email: "vikram.nair@pcthims.com", password: DEFAULT_PASSWORD, specialization: "Orthopaedics", department: "Orthopaedics", status: "Available", avgConsultMins: 15 },
    { name: "Dr. Kavitha Iyer", email: "kavitha.iyer@pcthims.com", password: DEFAULT_PASSWORD, specialization: "Dermatology", department: "Dermatology", status: "Available", avgConsultMins: 9 },
  ]);
  const [priya, arjun, sunita, vikram, kavitha] = doctors;
  console.log(`${doctors.length} doctors seeded. Login with any email above + "${DEFAULT_PASSWORD}".`);

  const patients = await Patient.create([
    { name: "Ramesh Gupta", age: 58, gender: "M", phone: "+91 98765 43210", bloodGroup: "B+", lastVisit: new Date("2026-09-10"), condition: "Hypertension", vitals: { bp: "138/88", pulse: "76 bpm", temp: "98.4°F", spo2: "97%" } },
    { name: "Meena Joshi", age: 32, gender: "F", phone: "+91 91234 56789", bloodGroup: "O+", lastVisit: new Date("2026-09-14"), condition: "Viral fever", vitals: { bp: "118/76", pulse: "88 bpm", temp: "101.2°F", spo2: "98%" } },
    { name: "Ananya Patel", age: 7, gender: "F", condition: "Cough & cold", vitals: {} },
    { name: "Suresh Kumar", age: 67, gender: "M", condition: "Chest discomfort", vitals: {} },
    { name: "Lakshmi Devi", age: 45, gender: "F", phone: "+91 99887 76655", bloodGroup: "A+", lastVisit: new Date("2026-09-02"), condition: "Type 2 Diabetes", vitals: { bp: "128/82", pulse: "80 bpm", temp: "98.2°F", spo2: "99%" } },
    { name: "Arun Mishra", age: 38, gender: "M", condition: "Knee pain", vitals: {} },
    { name: "Pooja Singh", age: 28, gender: "F", condition: "Skin rash", vitals: {} },
    { name: "Harish Verma", age: 42, gender: "M", condition: "Post-surgery review", vitals: {} },
  ]);
  const [ramesh, meena, ananya, suresh, lakshmi, arun, pooja, harish] = patients;
  console.log(`${patients.length} patients seeded.`);

  const today = new Date();
  const appointments = await Appointment.create([
    { patient: ramesh._id, doctor: priya._id, date: today, time: "09:00", type: "Follow-up", complaint: "Hypertension follow-up", status: "In Consult" },
    { patient: meena._id, doctor: priya._id, date: today, time: "09:15", type: "New", complaint: "Fever & body ache", status: "Waiting", checkedInAt: new Date(Date.now() - 15 * 60000) },
    { patient: ananya._id, doctor: sunita._id, date: today, time: "09:20", type: "New", complaint: "Cough & cold", status: "In Consult" },
    { patient: suresh._id, doctor: arjun._id, date: today, time: "09:30", type: "Follow-up", complaint: "Chest discomfort", status: "Waiting", urgent: true, checkedInAt: new Date(Date.now() - 5 * 60000) },
    { patient: lakshmi._id, doctor: priya._id, date: today, time: "09:45", type: "New", complaint: "Diabetes check-up", status: "Waiting", checkedInAt: new Date(Date.now() - 32 * 60000) },
    { patient: arun._id, doctor: vikram._id, date: today, time: "10:00", type: "New", complaint: "Knee pain", status: "Scheduled" },
    { patient: pooja._id, doctor: kavitha._id, date: today, time: "10:15", type: "New", complaint: "Skin rash", status: "Waiting", checkedInAt: new Date(Date.now() - 10 * 60000) },
    { patient: harish._id, doctor: arjun._id, date: today, time: "10:00", type: "Follow-up", complaint: "Post-surgery review", status: "Completed" },
  ]);
  console.log(`${appointments.length} appointments seeded.`);

  await Doctor.findByIdAndUpdate(priya._id, { currentPatient: ramesh._id });
  await Doctor.findByIdAndUpdate(sunita._id, { currentPatient: ananya._id });

  const consultations = await Consultation.create([
    { patient: ramesh._id, doctor: priya._id, diagnosis: "Hypertension", notes: "Started on Amlodipine 5mg. BP 142/90.", createdAt: new Date("2026-08-12") },
    { patient: ramesh._id, doctor: priya._id, diagnosis: "Routine check-up", notes: "No complaints.", createdAt: new Date("2026-07-01") },
    { patient: meena._id, doctor: priya._id, diagnosis: "Viral fever", notes: "Fever since 2 days, body ache. Advised rest and fluids.", createdAt: new Date("2026-09-14") },
    { patient: lakshmi._id, doctor: priya._id, diagnosis: "HbA1c 7.2%", notes: "Continue Metformin, review diet plan.", createdAt: new Date("2026-09-02") },
    { patient: lakshmi._id, doctor: priya._id, diagnosis: "Type 2 Diabetes", notes: "Diagnosed with Type 2 Diabetes. Started Metformin.", createdAt: new Date("2026-06-15") },
  ]);
  console.log(`${consultations.length} consultations seeded.`);

  const prescriptions = await Prescription.create([
    { patient: ramesh._id, doctor: priya._id, consultation: consultations[0]._id, medicine: "Amlodipine 5mg", dosage: "1-0-0", duration: "30 days", createdAt: new Date("2026-08-12") },
    { patient: meena._id, doctor: priya._id, consultation: consultations[2]._id, medicine: "Paracetamol 650mg", dosage: "1-1-1", duration: "5 days", createdAt: new Date("2026-09-14") },
    { patient: lakshmi._id, doctor: priya._id, consultation: consultations[3]._id, medicine: "Metformin 500mg", dosage: "1-0-1", duration: "90 days", createdAt: new Date("2026-09-02") },
  ]);
  console.log(`${prescriptions.length} prescriptions seeded.`);

  console.log("\nSeed complete.");
}

(async () => {
  await connectDB();
  try {
    if (process.argv.includes("--destroy")) {
      await destroyData();
    } else {
      await seedData();
    }
  } catch (err) {
    console.error("Seeding failed:", err);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
})();

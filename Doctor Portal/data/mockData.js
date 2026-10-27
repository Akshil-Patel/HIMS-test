// ---------------------------------------------------------------------------
// MOCK DATA
// ---------------------------------------------------------------------------
// In a real MERN app, this data would come from your Express API, e.g.:
//   const res = await fetch("/api/doctor/appointments");
//   const data = await res.json();
// For now, we keep it here as plain JS so the front end works on its own
// while the backend is being built. Swap these for real fetch() calls later
// (see the README section "Connecting to a real backend").
// ---------------------------------------------------------------------------

export const currentDoctor = {
  id: "doc_001",
  name: "Dr. Priya Sharma",
  specialization: "General Medicine",
  avatarInitials: "PS",
  status: "In Consult",
};

export const stats = [
  { label: "Total Today", value: 12, icon: "Users" },
  { label: "In Queue", value: 5, icon: "Clock" },
  { label: "Completed", value: 2, icon: "CheckCircle2" },
  { label: "Urgent / Priority", value: 1, icon: "AlertCircle" },
];

export const appointments = [
  { id: 1, patient: "Ramesh Gupta", age: 58, gender: "M", type: "Follow-up", time: "09:00", complaint: "Hypertension follow-up", wait: "-", status: "In Consult", doctor: "Dr. Priya Sharma" },
  { id: 2, patient: "Meena Joshi", age: 32, gender: "F", type: "New", time: "09:15", complaint: "Fever & body ache", wait: "15m", status: "Waiting", doctor: "Dr. Priya Sharma" },
  { id: 3, patient: "Ananya Patel", age: 7, gender: "F", type: "New", time: "09:20", complaint: "Cough & cold", wait: "-", status: "In Consult", doctor: "Dr. Sunita Rao" },
  { id: 4, patient: "Suresh Kumar", age: 67, gender: "M", type: "Follow-up", time: "09:30", complaint: "Chest discomfort", wait: "5m", status: "Waiting", urgent: true, doctor: "Dr. Arjun Mehta" },
  { id: 5, patient: "Lakshmi Devi", age: 45, gender: "F", type: "New", time: "09:45", complaint: "Diabetes check-up", wait: "32m", status: "Waiting", doctor: "Dr. Priya Sharma" },
  { id: 6, patient: "Arun Mishra", age: 38, gender: "M", type: "New", time: "10:00", complaint: "Knee pain", wait: "-", status: "Scheduled", doctor: "Dr. Vikram Nair" },
  { id: 7, patient: "Pooja Singh", age: 28, gender: "F", type: "New", time: "10:15", complaint: "Skin rash", wait: "10m", status: "Waiting", doctor: "Dr. Kavitha Iyer" },
  { id: 8, patient: "Harish Verma", age: 42, gender: "M", type: "Follow-up", time: "10:00", complaint: "Post-surgery review", wait: "-", status: "Completed", doctor: "Dr. Arjun Mehta" },
];

export const doctorAvailability = [
  { name: "Dr. Priya Sharma", dept: "General Medicine", status: "In Consult", currentPatient: "Ramesh Gupta", seen: 14, avgMins: 8, next: "+6 min" },
  { name: "Dr. Arjun Mehta", dept: "Cardiology", status: "Available", seen: 9, avgMins: 12, next: "Now" },
  { name: "Dr. Sunita Rao", dept: "Paediatrics", status: "In Consult", currentPatient: "Ananya Patel", seen: 11, avgMins: 10, next: "+4 min" },
  { name: "Dr. Vikram Nair", dept: "Orthopaedics", status: "Available", seen: 7, avgMins: 15, next: "-20 min" },
  { name: "Dr. Kavitha Iyer", dept: "Dermatology", status: "Available", seen: 8, avgMins: 9, next: "Now" },
];

export const departmentLoad = [
  { name: "General Medicine", waiting: 5, done: 14, total: 20, pct: 70 },
  { name: "Cardiology", waiting: 6, done: 6, total: 15, pct: 40 },
  { name: "Paediatrics", waiting: 6, done: 7, total: 19, pct: 37 },
  { name: "Orthopaedics", waiting: 3, done: 4, total: 12, pct: 33 },
  { name: "Dermatology", waiting: 3, done: 8, total: 10, pct: 80 },
];

// Fuller patient records, used on the Patients list + patient detail page
export const patients = [
  {
    id: "p001",
    name: "Ramesh Gupta",
    age: 58,
    gender: "M",
    phone: "+91 98765 43210",
    bloodGroup: "B+",
    lastVisit: "2026-09-10",
    condition: "Hypertension",
    vitals: { bp: "138/88", pulse: "76 bpm", temp: "98.4°F", spo2: "97%" },
    history: [
      { date: "2026-08-12", note: "Started on Amlodipine 5mg. BP 142/90." },
      { date: "2026-07-01", note: "Routine check-up. No complaints." },
    ],
    prescriptions: [
      { date: "2026-08-12", medicine: "Amlodipine 5mg", dosage: "1-0-0", duration: "30 days" },
    ],
  },
  {
    id: "p002",
    name: "Meena Joshi",
    age: 32,
    gender: "F",
    phone: "+91 91234 56789",
    bloodGroup: "O+",
    lastVisit: "2026-09-14",
    condition: "Viral fever",
    vitals: { bp: "118/76", pulse: "88 bpm", temp: "101.2°F", spo2: "98%" },
    history: [
      { date: "2026-09-14", note: "Fever since 2 days, body ache. Advised rest and fluids." },
    ],
    prescriptions: [
      { date: "2026-09-14", medicine: "Paracetamol 650mg", dosage: "1-1-1", duration: "5 days" },
    ],
  },
  {
    id: "p003",
    name: "Lakshmi Devi",
    age: 45,
    gender: "F",
    phone: "+91 99887 76655",
    bloodGroup: "A+",
    lastVisit: "2026-09-02",
    condition: "Type 2 Diabetes",
    vitals: { bp: "128/82", pulse: "80 bpm", temp: "98.2°F", spo2: "99%" },
    history: [
      { date: "2026-09-02", note: "HbA1c 7.2%. Continue Metformin, review diet plan." },
      { date: "2026-06-15", note: "Diagnosed with Type 2 Diabetes. Started Metformin." },
    ],
    prescriptions: [
      { date: "2026-09-02", medicine: "Metformin 500mg", dosage: "1-0-1", duration: "90 days" },
    ],
  },
];

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import Layout from "../components/Layout";
import {
  Stethoscope,
  Pill,
  FlaskConical,
  Plus,
  Trash2,
  CheckCircle2,
  Receipt,
  ExternalLink,
  Sparkles,
  HeartPulse,
  User,
  AlertCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  Activity,
  X,
  Printer,
  RotateCcw,
  Loader2,
  Download,
  Share2,
} from "lucide-react";
import { patients as mockPatients } from "../data/mockData";
import { BILLING_URL, API_URL } from "../lib/constants";

const CONFETTI_COLORS = [
  "#10b981", "#06b6d4", "#3b82f6", "#f59e0b", "#ec4899", "#8b5cf6", "#14b8a6", "#6366f1"
];

const COMMON_MEDICINES = [
  { name: "Paracetamol 650mg", dosage: "1-1-1", duration: "5 days", unitPrice: 35 },
  { name: "Amoxicillin 500mg", dosage: "1-0-1", duration: "5 days", unitPrice: 120 },
  { name: "Amlodipine 5mg", dosage: "1-0-0", duration: "30 days", unitPrice: 65 },
  { name: "Metformin 500mg", dosage: "1-0-1", duration: "30 days", unitPrice: 85 },
  { name: "Azithromycin 500mg", dosage: "1-0-0", duration: "3 days", unitPrice: 140 },
  { name: "Pantoprazole 40mg", dosage: "1-0-0", duration: "14 days", unitPrice: 90 },
  { name: "Cetirizine 10mg", dosage: "0-0-1", duration: "5 days", unitPrice: 40 },
];

const COMMON_LAB_TESTS = [
  { testName: "Complete Blood Count (CBC)", notes: "Routine hemogram", unitPrice: 350 },
  { testName: "Fasting Blood Sugar (FBS)", notes: "10-12 hr fasting", unitPrice: 120 },
  { testName: "HbA1c Glycated Hemoglobin", notes: "Diabetes glycemic monitoring", unitPrice: 450 },
  { testName: "Lipid Profile Screen", notes: "Overnight fasting required", unitPrice: 600 },
  { testName: "Liver Function Test (LFT)", notes: "Enzyme evaluation", unitPrice: 650 },
  { testName: "Kidney Function Test (KFT)", notes: "Urea & creatinine screen", unitPrice: 550 },
  { testName: "Chest X-Ray PA View", notes: "Diagnostic imaging", unitPrice: 500 },
  { testName: "Urine Routine Examination", notes: "Microscopic analysis", unitPrice: 200 },
];

export default function Consultation() {
  const router = useRouter();
  const { patient: queryPatientName, patientId: queryPatientId } = router.query;

  // Selected patient
  const [patientList, setPatientList] = useState(mockPatients);
  const [selectedPatient, setSelectedPatient] = useState(null);

  // Form states
  const [complaint, setComplaint] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [notes, setNotes] = useState("");
  const [vitals, setVitals] = useState({ bp: "120/80", pulse: "76 bpm", temp: "98.6°F", spo2: "98%" });

  // Billing elements
  const [includeConsultFee, setIncludeConsultFee] = useState(true);
  const [consultationFee, setConsultationFee] = useState(500);

  // Department Items
  const [medications, setMedications] = useState([
    { name: "Paracetamol 650mg", dosage: "1-1-1", duration: "5 days", unitPrice: 35 },
  ]);
  const [labOrders, setLabOrders] = useState([]);

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [savedResult, setSavedResult] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [fieldErrorShake, setFieldErrorShake] = useState(false);
  const diagnosisInputRef = useRef(null);

  // Soft Web Audio success chime
  const playSuccessChime = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(523.25, ctx.currentTime);
      gain1.gain.setValueAtTime(0.15, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 0.25);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(783.99, ctx.currentTime + 0.12);
      gain2.gain.setValueAtTime(0.2, ctx.currentTime + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(ctx.currentTime + 0.12);
      osc2.stop(ctx.currentTime + 0.45);
    } catch (_) {}
  };

  // Try loading real patients from API, fallback to mockData
  useEffect(() => {
    fetch("/api/patients")
      .then((res) => res.json())
      .then((data) => {
        if (data.patients && data.patients.length > 0) {
          setPatientList(data.patients);
        }
      })
      .catch(() => {});
  }, []);

  // Sync selected patient from query or default
  useEffect(() => {
    if (queryPatientName) {
      const match = patientList.find(
        (p) => p.name.toLowerCase() === queryPatientName.toLowerCase() || p.id === queryPatientId
      );
      if (match) {
        setSelectedPatient(match);
        setVitals(match.vitals || { bp: "120/80", pulse: "76 bpm", temp: "98.6°F", spo2: "98%" });
        if (match.condition) setDiagnosis(match.condition);
      } else {
        const temp = {
          id: queryPatientId || "p_walkin",
          name: queryPatientName,
          age: 42,
          gender: "M",
          phone: "+91 98765 43210",
        };
        setSelectedPatient(temp);
      }
    } else if (!selectedPatient && patientList.length > 0) {
      setSelectedPatient(patientList[0]);
      if (patientList[0].vitals) setVitals(patientList[0].vitals);
      if (patientList[0].condition) setDiagnosis(patientList[0].condition);
    }
  }, [queryPatientName, queryPatientId, patientList]);

  // Medication handlers
  const addMedicationRow = () => {
    setMedications([...medications, { name: "", dosage: "1-0-1", duration: "5 days", unitPrice: 50 }]);
  };

  const removeMedicationRow = (idx) => {
    setMedications(medications.filter((_, i) => i !== idx));
  };

  const updateMedication = (idx, field, val) => {
    const copy = [...medications];
    copy[idx][field] = val;
    setMedications(copy);
  };

  const pickPresetMed = (preset) => {
    setMedications([...medications, { ...preset }]);
  };

  // Lab order handlers
  const addLabRow = () => {
    setLabOrders([...labOrders, { testName: "", notes: "", unitPrice: 350 }]);
  };

  const removeLabRow = (idx) => {
    setLabOrders(labOrders.filter((_, i) => i !== idx));
  };

  const updateLabOrder = (idx, field, val) => {
    const copy = [...labOrders];
    copy[idx][field] = val;
    setLabOrders(copy);
  };

  const pickPresetLab = (preset) => {
    setLabOrders([...labOrders, { ...preset }]);
  };

  // Calculations for billing preview
  const consultTotal = includeConsultFee ? parseFloat(consultationFee) || 0 : 0;
  const medsTotal = medications.reduce((acc, m) => acc + (parseFloat(m.unitPrice) || 0), 0);
  const medsTax = medsTotal * 0.05; // 5% GST
  const labsTotal = labOrders.reduce((acc, l) => acc + (parseFloat(l.unitPrice) || 0), 0);
  const grandEstimatedTotal = consultTotal + medsTotal + medsTax + labsTotal;

  // Submit consultation & trigger auto-billing
  const handleSubmitConsultation = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setError("");

    if (!diagnosis || !diagnosis.trim()) {
      setError("Please specify a primary clinical diagnosis before finalizing consultation.");
      setFieldErrorShake(true);
      setTimeout(() => setFieldErrorShake(false), 800);
      if (diagnosisInputRef.current) {
        diagnosisInputRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
        diagnosisInputRef.current.focus();
      }
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        patientId: selectedPatient?._id || selectedPatient?.id,
        patientName: selectedPatient?.name || "Patient",
        patientPhone: selectedPatient?.phone || "",
        diagnosis: diagnosis.trim(),
        notes: notes.trim(),
        vitals,
        consultationFee: consultTotal,
        medications: medications.filter((m) => m.name && m.name.trim()),
        labOrders: labOrders.filter((l) => l.testName && l.testName.trim()),
        doctorName: "Dr. Priya Sharma",
      };

      let res;
      try {
        res = await fetch("/api/consultations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } catch (proxyErr) {
        res = await fetch(`${API_URL || "http://localhost:5000"}/api/consultations`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to save consultation");
      }

      setSavedResult(data);
      setShowSuccessModal(true);
      playSuccessChime();
    } catch (err) {
      setError(err.message || "Error submitting consultation to hospital backend.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleNextPatient = () => {
    setShowSuccessModal(false);
    setSavedResult(null);
    setDiagnosis("");
    setComplaint("");
    setNotes("");
    setMedications([{ name: "Paracetamol 650mg", dosage: "1-1-1", duration: "5 days", unitPrice: 35 }]);
    setLabOrders([]);
    setError("");

    if (patientList && patientList.length > 1) {
      const currentIdx = patientList.findIndex(
        (p) => p.name === selectedPatient?.name || (p._id && p._id === selectedPatient?._id)
      );
      const nextIdx = (currentIdx + 1) % patientList.length;
      const nextPat = patientList[nextIdx];
      setSelectedPatient(nextPat);
      if (nextPat.vitals) setVitals(nextPat.vitals);
      if (nextPat.condition) setDiagnosis(nextPat.condition);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <Layout
      title="OPD Clinical Consultation"
      subtitle={selectedPatient ? `Patient Encounter: ${selectedPatient.name}` : "Clinical examination desk"}
    >
      <div className="space-y-6 max-w-6xl mx-auto pb-12">
        {/* Success Celebration Banner */}
        {savedResult && (
          <div className="bg-gradient-to-r from-emerald-800 to-teal-900 text-white rounded-2xl p-6 shadow-xl border border-emerald-500/40 space-y-4 animate-in fade-in slide-in-from-top-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300">
                  <CheckCircle2 size={28} />
                </div>
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-400/20 text-emerald-200 text-xs font-bold uppercase tracking-wider mb-1">
                    <Sparkles size={12} />
                    Auto-Billing Sync Completed
                  </div>
                  <h3 className="text-xl font-black text-white">
                    Consultation Saved & Unified Patient Bill Prepared!
                  </h3>
                  <p className="text-xs text-emerald-200/90 mt-0.5">
                    Consultation fee, {savedResult.itemsAdded || "prescribed"} medicines, and diagnostic lab orders have been automatically consolidated into a single unified patient invoice.
                  </p>
                </div>
              </div>

              <div className="text-right bg-white/10 px-4 py-2.5 rounded-xl border border-white/10">
                <p className="text-[10px] uppercase font-bold text-emerald-200">Unified Bill Number</p>
                <p className="text-lg font-mono font-black text-white">{savedResult.bill?.billNumber}</p>
                <p className="text-xs font-bold text-emerald-300 mt-0.5">
                  Total: ₹{savedResult.bill?.grandTotal?.toFixed(2)}
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs text-emerald-200 flex items-center gap-2">
                <ShieldCheck size={16} className="text-emerald-300" />
                <span>Invoice status: <strong>{savedResult.bill?.status?.toUpperCase()}</strong> — Patient can pay at counter or via mobile QR</span>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={`${BILLING_URL}/bills/${savedResult.bill?._id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white text-teal-900 rounded-xl text-xs font-bold shadow hover:bg-emerald-50 transition-colors"
                >
                  <Receipt size={14} className="text-teal-700" />
                  <span>Open in Billing Desk &amp; QR Checkout &rarr;</span>
                </a>

                <button
                  type="button"
                  onClick={handleNextPatient}
                  className="px-3.5 py-2 bg-white/15 hover:bg-white/20 text-white rounded-xl text-xs font-semibold transition-colors"
                >
                  Consult Next Patient
                </button>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red/10 border border-red/20 text-red text-xs rounded-xl flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Patient Selection & Quick Vitals Header */}
        <div className="bg-surface border border-border rounded-card shadow-card p-5">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border pb-4 mb-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-ink-faint">
                Active Consultation Patient
              </span>
              <div className="flex items-center gap-3 mt-1">
                <div className="w-10 h-10 rounded-xl bg-primary-light text-primary flex items-center justify-center font-bold text-sm">
                  <User size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-ink">
                    {selectedPatient?.name || "Select Patient"}
                  </h2>
                  <p className="text-xs text-ink-muted">
                    {selectedPatient?.age}y · {selectedPatient?.gender} · Phone: {selectedPatient?.phone || "N/A"}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs text-ink-muted font-medium">Switch Patient:</label>
              <select
                className="px-3 py-1.5 border border-border rounded-lg text-xs bg-base text-ink font-medium focus:outline-none focus:ring-1 focus:ring-primary"
                value={selectedPatient?.name || ""}
                onChange={(e) => {
                  const p = patientList.find((x) => x.name === e.target.value);
                  if (p) {
                    setSelectedPatient(p);
                    if (p.vitals) setVitals(p.vitals);
                    if (p.condition) setDiagnosis(p.condition);
                    setSavedResult(null);
                  }
                }}
              >
                {patientList.map((p) => (
                  <option key={p.id || p._id || p.name} value={p.name}>
                    {p.name} ({p.condition || "General OPD"})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Vitals Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-base/60 rounded-xl border border-border/80">
              <span className="text-[10px] text-ink-faint font-semibold uppercase">Blood Pressure</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <HeartPulse size={14} className="text-red" />
                <input
                  type="text"
                  value={vitals.bp || ""}
                  onChange={(e) => setVitals({ ...vitals, bp: e.target.value })}
                  placeholder="120/80"
                  className="w-full text-xs font-bold text-ink bg-transparent focus:outline-none"
                />
              </div>
            </div>

            <div className="p-3 bg-base/60 rounded-xl border border-border/80">
              <span className="text-[10px] text-ink-faint font-semibold uppercase">Pulse Rate</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Activity size={14} className="text-primary" />
                <input
                  type="text"
                  value={vitals.pulse || ""}
                  onChange={(e) => setVitals({ ...vitals, pulse: e.target.value })}
                  placeholder="76 bpm"
                  className="w-full text-xs font-bold text-ink bg-transparent focus:outline-none"
                />
              </div>
            </div>

            <div className="p-3 bg-base/60 rounded-xl border border-border/80">
              <span className="text-[10px] text-ink-faint font-semibold uppercase">Body Temp</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Clock size={14} className="text-amber" />
                <input
                  type="text"
                  value={vitals.temp || ""}
                  onChange={(e) => setVitals({ ...vitals, temp: e.target.value })}
                  placeholder="98.6°F"
                  className="w-full text-xs font-bold text-ink bg-transparent focus:outline-none"
                />
              </div>
            </div>

            <div className="p-3 bg-base/60 rounded-xl border border-border/80">
              <span className="text-[10px] text-ink-faint font-semibold uppercase">SpO2 Oxygen</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <CheckCircle2 size={14} className="text-green" />
                <input
                  type="text"
                  value={vitals.spo2 || ""}
                  onChange={(e) => setVitals({ ...vitals, spo2: e.target.value })}
                  placeholder="98%"
                  className="w-full text-xs font-bold text-ink bg-transparent focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmitConsultation} className="space-y-6">
          {/* Clinical Examination & Diagnosis */}
          <div className="bg-surface border border-border rounded-card shadow-card p-6 space-y-4">
            <div className="flex items-center gap-2 text-ink font-bold text-sm">
              <Stethoscope size={18} className="text-primary" />
              <span>Clinical Examination &amp; Diagnosis</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-ink-muted uppercase mb-1">
                  Primary Diagnosis <span className="text-red">*</span>
                </label>
                <input
                  type="text"
                  ref={diagnosisInputRef}
                  placeholder="e.g. Essential Hypertension / Acute Bronchitis"
                  value={diagnosis}
                  onChange={(e) => {
                    setDiagnosis(e.target.value);
                    if (error) setError("");
                  }}
                  className={`w-full px-3.5 py-2.5 bg-base border ${
                    fieldErrorShake ? "border-red-500 ring-2 ring-red-500/30 animate-shake" : "border-border"
                  } rounded-xl text-xs font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-primary transition-all`}
                />
                {fieldErrorShake && (
                  <p className="text-[11px] text-red mt-1 font-semibold flex items-center gap-1">
                    <AlertCircle size={12} />
                    Primary diagnosis is required to finalize bill
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-muted uppercase mb-1">
                  Chief Symptoms &amp; Complaints
                </label>
                <input
                  type="text"
                  placeholder="e.g. Headache since 3 days, mild fatigue"
                  value={complaint}
                  onChange={(e) => setComplaint(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-base border border-border rounded-xl text-xs font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-ink-muted uppercase mb-1">
                  Doctor Notes &amp; Clinical Advice
                </label>
                <textarea
                  rows={2}
                  placeholder="Advised low sodium diet, avoid strenuous exertion, review after lab reports..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2 bg-base border border-border rounded-xl text-xs text-ink focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            {/* Consultation Fee Option */}
            <div className="pt-3 border-t border-border flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 cursor-pointer font-medium text-ink">
                <input
                  type="checkbox"
                  checked={includeConsultFee}
                  onChange={(e) => setIncludeConsultFee(e.target.checked)}
                  className="w-4 h-4 text-primary rounded"
                />
                <span>Include Doctor Consultation Charge in Patient Bill</span>
              </label>

              {includeConsultFee && (
                <div className="flex items-center gap-1.5">
                  <span className="text-ink-faint">Fee (₹):</span>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={consultationFee}
                    onChange={(e) => setConsultationFee(e.target.value)}
                    className="w-20 px-2 py-1 bg-base border border-border rounded-lg text-xs font-bold text-ink text-right"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Prescriptions (Pharmacy Department Integration) */}
          <div className="bg-surface border border-border rounded-card shadow-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-ink font-bold text-sm">
                <Pill size={18} className="text-teal" />
                <span>Prescribed Medications (Pharmacy Department)</span>
              </div>
              <button
                type="button"
                onClick={addMedicationRow}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-teal-light text-teal rounded-lg text-xs font-bold hover:bg-teal-light/80 transition-colors"
              >
                <Plus size={14} /> Add Medicine
              </button>
            </div>

            {/* Quick Medicine Picker Chips */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] text-ink-faint font-medium">Quick Prescribe:</span>
              {COMMON_MEDICINES.map((preset) => (
                <button
                  type="button"
                  key={preset.name}
                  onClick={() => pickPresetMed(preset)}
                  className="px-2.5 py-1 bg-base hover:bg-border text-ink-muted hover:text-ink text-[11px] font-medium rounded-lg border border-border transition-colors flex items-center gap-1"
                >
                  <span>+ {preset.name}</span>
                  <span className="text-teal font-bold">₹{preset.unitPrice}</span>
                </button>
              ))}
            </div>

            {/* Medicine Rows */}
            <div className="space-y-2.5 pt-2">
              {medications.map((med, idx) => (
                <div key={idx} className="flex flex-wrap sm:flex-nowrap items-center gap-2 p-2.5 bg-base/60 rounded-xl border border-border">
                  <input
                    type="text"
                    placeholder="Medicine name (e.g. Paracetamol 650mg)"
                    value={med.name}
                    onChange={(e) => updateMedication(idx, "name", e.target.value)}
                    className="flex-2 min-w-[180px] px-3 py-1.5 bg-surface border border-border rounded-lg text-xs font-semibold text-ink"
                  />
                  <input
                    type="text"
                    placeholder="Dosage (1-0-1)"
                    value={med.dosage}
                    onChange={(e) => updateMedication(idx, "dosage", e.target.value)}
                    className="w-24 px-2.5 py-1.5 bg-surface border border-border rounded-lg text-xs text-ink text-center"
                  />
                  <input
                    type="text"
                    placeholder="Duration (5 days)"
                    value={med.duration}
                    onChange={(e) => updateMedication(idx, "duration", e.target.value)}
                    className="w-28 px-2.5 py-1.5 bg-surface border border-border rounded-lg text-xs text-ink text-center"
                  />
                  <div className="flex items-center gap-1 text-xs text-ink-faint">
                    <span>₹</span>
                    <input
                      type="number"
                      placeholder="Rate"
                      value={med.unitPrice}
                      onChange={(e) => updateMedication(idx, "unitPrice", e.target.value)}
                      className="w-16 px-2 py-1.5 bg-surface border border-border rounded-lg text-xs font-bold text-ink text-right"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeMedicationRow(idx)}
                    className="p-1.5 text-ink-faint hover:text-red transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Diagnostic Lab Orders (Laboratory Department Integration) */}
          <div className="bg-surface border border-border rounded-card shadow-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-ink font-bold text-sm">
                <FlaskConical size={18} className="text-primary" />
                <span>Diagnostic Lab Orders (Laboratory Department)</span>
              </div>
              <button
                type="button"
                onClick={addLabRow}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary-light text-primary rounded-lg text-xs font-bold hover:bg-primary-light/80 transition-colors"
              >
                <Plus size={14} /> Order Lab Test
              </button>
            </div>

            {/* Quick Lab Picker Chips */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] text-ink-faint font-medium">Quick Order:</span>
              {COMMON_LAB_TESTS.map((preset) => (
                <button
                  type="button"
                  key={preset.testName}
                  onClick={() => pickPresetLab(preset)}
                  className="px-2.5 py-1 bg-base hover:bg-border text-ink-muted hover:text-ink text-[11px] font-medium rounded-lg border border-border transition-colors flex items-center gap-1"
                >
                  <span>+ {preset.testName}</span>
                  <span className="text-primary font-bold">₹{preset.unitPrice}</span>
                </button>
              ))}
            </div>

            {/* Lab Order Rows */}
            {labOrders.length === 0 ? (
              <p className="text-xs text-ink-faint italic py-2">
                No lab tests ordered for this consultation yet. Use the buttons above to order diagnostic investigations.
              </p>
            ) : (
              <div className="space-y-2.5 pt-2">
                {labOrders.map((lab, idx) => (
                  <div key={idx} className="flex flex-wrap sm:flex-nowrap items-center gap-2 p-2.5 bg-base/60 rounded-xl border border-border">
                    <input
                      type="text"
                      placeholder="Test name (e.g. Complete Blood Count)"
                      value={lab.testName}
                      onChange={(e) => updateLabOrder(idx, "testName", e.target.value)}
                      className="flex-2 min-w-[200px] px-3 py-1.5 bg-surface border border-border rounded-lg text-xs font-semibold text-ink"
                    />
                    <input
                      type="text"
                      placeholder="Instructions / Notes (optional)"
                      value={lab.notes}
                      onChange={(e) => updateLabOrder(idx, "notes", e.target.value)}
                      className="flex-1 px-2.5 py-1.5 bg-surface border border-border rounded-lg text-xs text-ink"
                    />
                    <div className="flex items-center gap-1 text-xs text-ink-faint">
                      <span>₹</span>
                      <input
                        type="number"
                        placeholder="Cost"
                        value={lab.unitPrice}
                        onChange={(e) => updateLabOrder(idx, "unitPrice", e.target.value)}
                        className="w-16 px-2 py-1.5 bg-surface border border-border rounded-lg text-xs font-bold text-ink text-right"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeLabRow(idx)}
                      className="p-1.5 text-ink-faint hover:text-red transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Unified Bill Real-Time Preview Card */}
          <div className="bg-gradient-to-br from-ink via-slate-900 to-ink text-white rounded-2xl p-6 shadow-lg space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal/20 text-teal-light text-[10px] font-bold uppercase tracking-wider mb-1 border border-teal/30">
                  <Sparkles size={12} className="text-teal" />
                  Unified Multi-Department Encounter Billing
                </div>
                <h4 className="text-base font-bold text-white">
                  Automated Consolidated Invoice for {selectedPatient?.name}
                </h4>
                <p className="text-xs text-slate-300 max-w-lg mt-0.5">
                  Submitting will combine Consultation (OPD), Pharmacy medicines, and Diagnostic Lab orders into ONE unified patient invoice.
                </p>
              </div>

              <div className="text-right">
                <span className="text-xs text-slate-400">Total Encounter Payable:</span>
                <p className="text-3xl font-black text-white">
                  ₹{grandEstimatedTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            {/* Department Breakdown Strip */}
            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-700/80 text-center">
              <div className="p-2.5 bg-white/5 rounded-xl border border-white/10">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Consultancy</p>
                <p className="text-sm font-bold text-blue-300">₹{consultTotal.toFixed(2)}</p>
              </div>
              <div className="p-2.5 bg-white/5 rounded-xl border border-white/10">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Pharmacy ({medications.length} items)</p>
                <p className="text-sm font-bold text-emerald-300">₹{(medsTotal + medsTax).toFixed(2)}</p>
              </div>
              <div className="p-2.5 bg-white/5 rounded-xl border border-white/10">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Laboratory ({labOrders.length} tests)</p>
                <p className="text-sm font-bold text-purple-300">₹{labsTotal.toFixed(2)}</p>
              </div>
            </div>

            {/* Inline Error if present */}
            {error && (
              <div className="p-3 bg-red-500/20 border border-red-500/40 text-red-200 text-xs rounded-xl flex items-center gap-2 animate-in fade-in">
                <AlertCircle size={16} className="shrink-0 text-red-400" />
                <span>{error}</span>
              </div>
            )}

            {/* Action State: Completed vs Submit */}
            <div className="pt-2">
              {savedResult ? (
                <div className="bg-emerald-950/80 border border-emerald-500/50 rounded-2xl p-5 space-y-4 animate-in fade-in zoom-in-95">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300">
                        <CheckCircle2 size={24} />
                      </div>
                      <div>
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-200 text-[10px] font-bold uppercase tracking-wider mb-0.5">
                          <Sparkles size={11} />
                          Encounter Finalized
                        </div>
                        <h4 className="text-sm font-bold text-white">
                          Bill <span className="font-mono text-emerald-300">{savedResult.bill?.billNumber}</span> Ready for Payment
                        </h4>
                        <p className="text-xs text-emerald-200/80">
                          {selectedPatient?.name} · {savedResult.bill?.items?.length || 0} consolidated items
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-emerald-300">Total Billed</span>
                      <p className="text-2xl font-black text-white">
                        ₹{savedResult.bill?.grandTotal?.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>

                  {/* WhatsApp Automated Delivery Strip */}
                  <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-emerald-900/70 border border-emerald-400/30 rounded-xl text-xs text-emerald-200">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center font-black text-[11px]">
                        ✓
                      </span>
                      <span>
                        PDF Bill Automatically Sent to WhatsApp: <strong>+{savedResult.whatsappDelivery?.recipientPhone || selectedPatient?.phone || '919876543210'}</strong>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <a
                        href={savedResult.whatsappDelivery?.waLink || `https://wa.me/${savedResult.whatsappDelivery?.recipientPhone || '919876543210'}`}
                        target="_blank"
                        rel="noreferrer"
                        className="underline hover:text-white font-bold"
                      >
                        Open WhatsApp &rarr;
                      </a>
                      <span>•</span>
                      <a
                        href={`${API_URL || ""}/api/bills/${savedResult.bill?._id}/pdf`}
                        target="_blank"
                        rel="noreferrer"
                        className="underline hover:text-white font-bold flex items-center gap-1"
                      >
                        <Download size={12} />
                        Download PDF
                      </a>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-emerald-500/30">
                    <a
                      href={`${BILLING_URL}/bills/${savedResult.bill?._id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="py-3 px-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-black shadow-lg flex items-center justify-center gap-1.5 transition-all"
                    >
                      <Receipt size={15} />
                      <span>Open in Billing Desk &rarr;</span>
                    </a>

                    <button
                      type="button"
                      onClick={() => setShowSuccessModal(true)}
                      className="py-3 px-3 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold border border-white/20 flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Sparkles size={15} className="text-emerald-300" />
                      <span>View Confirmation</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleNextPatient}
                      className="py-3 px-3 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold border border-white/20 flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <RotateCcw size={15} />
                      <span>Next Patient</span>
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 bg-primary hover:bg-primary-dark text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/30 flex items-center justify-center gap-2 transition-all disabled:opacity-75 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={18} className="animate-spin text-white" />
                      <span>Saving Consultation &amp; Synchronizing Unified Bill...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={18} />
                      <span>Complete Consultation &amp; Auto-Generate Unified Bill (₹{grandEstimatedTotal.toFixed(2)})</span>
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </form>

        {/* Success Confirmation Modal Dialog */}
        {showSuccessModal && savedResult && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
            <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-slate-900 animate-in zoom-in-95 duration-200">
              
              {/* Confetti Particles */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
                {Array.from({ length: 28 }).map((_, i) => (
                  <span
                    key={i}
                    className="absolute block rounded-sm animate-confetti"
                    style={{
                      left: `${(i * 3.5) + (i % 2 === 0 ? 2 : -2)}%`,
                      top: `-12px`,
                      width: `${6 + (i % 3) * 3}px`,
                      height: `${6 + (i % 4) * 2}px`,
                      backgroundColor: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
                      animationDelay: `${(i % 8) * 0.12}s`,
                      animationDuration: `${1.6 + (i % 4) * 0.3}s`,
                    }}
                  />
                ))}
              </div>

              {/* Modal Header */}
              <div className="relative z-10 bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-6 pb-8 text-center">
                <button
                  type="button"
                  onClick={() => setShowSuccessModal(false)}
                  className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors"
                  title="Close dialog"
                >
                  <X size={16} />
                </button>

                <div className="w-16 h-16 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center mx-auto mb-3 shadow-inner">
                  <CheckCircle2 size={36} className="text-white drop-shadow-md" />
                </div>

                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-emerald-100 text-[11px] font-bold uppercase tracking-wider mb-2">
                  <Sparkles size={13} className="text-emerald-200" />
                  Auto-Billing Synchronization Active
                </div>

                <h3 className="text-xl font-black text-white tracking-tight">
                  Consultation Saved &amp; Unified Bill Ready!
                </h3>
                <p className="text-xs text-emerald-100/90 mt-1 max-w-sm mx-auto">
                  Charges for Consultation, Pharmacy, and Diagnostic Lab have been consolidated into a single patient bill.
                </p>
              </div>

              {/* Modal Content */}
              <div className="relative z-10 p-6 -mt-4 bg-white rounded-t-3xl space-y-4">
                
                {/* Bill Highlight Card */}
                <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Unified Invoice
                    </span>
                    <p className="text-lg font-mono font-black text-teal-700">
                      {savedResult.bill?.billNumber || "BILL-2026-XXXX"}
                    </p>
                    <p className="text-xs font-semibold text-slate-700 mt-0.5">
                      Patient: <span className="font-bold">{savedResult.bill?.patient?.name || selectedPatient?.name}</span>
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Total Payable
                    </span>
                    <p className="text-2xl font-black text-slate-900">
                      ₹{savedResult.bill?.grandTotal?.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </p>
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 uppercase mt-0.5">
                      {savedResult.bill?.status || "Finalized"}
                    </span>
                  </div>
                </div>

                {/* Itemized Department Breakdown */}
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between items-center py-1.5 px-3 bg-slate-50 rounded-lg text-slate-600">
                    <span className="flex items-center gap-1.5 font-medium">
                      🩺 OPD Consultation Fee
                    </span>
                    <span className="font-bold text-slate-900">₹{consultTotal.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between items-center py-1.5 px-3 bg-slate-50 rounded-lg text-slate-600">
                    <span className="flex items-center gap-1.5 font-medium">
                      💊 Prescriptions ({medications.filter((m) => m.name.trim()).length} medications)
                    </span>
                    <span className="font-bold text-slate-900">₹{(medsTotal + medsTax).toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between items-center py-1.5 px-3 bg-slate-50 rounded-lg text-slate-600">
                    <span className="flex items-center gap-1.5 font-medium">
                      🔬 Diagnostics ({labOrders.filter((l) => l.testName.trim()).length} lab tests)
                    </span>
                    <span className="font-bold text-slate-900">₹{labsTotal.toFixed(2)}</span>
                  </div>
                </div>

                {/* Automated WhatsApp Delivery Banner */}
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-base shrink-0 shadow-xs">
                      💬
                    </div>
                    <div>
                      <p className="font-bold text-emerald-950 flex items-center gap-1.5">
                        <span>PDF Sent to Patient WhatsApp</span>
                        <span className="px-1.5 py-0.5 bg-emerald-200/80 text-emerald-900 rounded text-[10px] font-mono font-bold">
                          +{savedResult.whatsappDelivery?.recipientPhone || selectedPatient?.phone || '919876543210'}
                        </span>
                      </p>
                      <p className="text-[11px] text-emerald-700 mt-0.5">
                        Official hospital PDF receipt &amp; instant UPI link transmitted automatically.
                      </p>
                    </div>
                  </div>

                  <a
                    href={savedResult.whatsappDelivery?.waLink || `https://wa.me/${savedResult.whatsappDelivery?.recipientPhone || '919876543210'}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shrink-0 transition shadow-xs"
                  >
                    <span>Open Chat &rarr;</span>
                  </a>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2 pt-1">
                  <a
                    href={`${BILLING_URL}/bills/${savedResult.bill?._id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-3.5 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-black shadow-lg shadow-teal-600/25 flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
                  >
                    <Receipt size={16} />
                    <span>Open in Billing Desk &amp; QR Checkout &rarr;</span>
                  </a>

                  <div className="grid grid-cols-3 gap-2">
                    <a
                      href={`${API_URL || ""}/api/bills/${savedResult.bill?._id}/pdf`}
                      target="_blank"
                      rel="noreferrer"
                      className="py-2.5 px-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-colors text-center"
                    >
                      <Download size={13} />
                      <span>Download PDF</span>
                    </a>

                    <a
                      href={`${BILLING_URL}/bills/${savedResult.bill?._id}/receipt`}
                      target="_blank"
                      rel="noreferrer"
                      className="py-2.5 px-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-colors text-center"
                    >
                      <Printer size={13} />
                      <span>Print Receipt</span>
                    </a>

                    <button
                      type="button"
                      onClick={handleNextPatient}
                      className="py-2.5 px-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-colors text-center"
                    >
                      <RotateCcw size={13} />
                      <span>Next Patient</span>
                    </button>
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

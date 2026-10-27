const mongoose = require("mongoose");

const prescriptionSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor", required: true },
    consultation: { type: mongoose.Schema.Types.ObjectId, ref: "Consultation", default: null },
    medicine: { type: String, required: true },
    dosage: { type: String, required: true }, // e.g. "1-0-1"
    duration: { type: String, required: true }, // e.g. "30 days"
  },
  { timestamps: true }
);

module.exports = mongoose.model("Prescription", prescriptionSchema);

const mongoose = require("mongoose");

// One Consultation = one entry in a patient's "Visit History" on the frontend.
// Created from the Consultation page form.
const consultationSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor", required: true },
    appointment: { type: mongoose.Schema.Types.ObjectId, ref: "Appointment", default: null },
    notes: { type: String, default: "" },
    diagnosis: { type: String, required: true },
    durationMins: { type: Number, default: null }, // filled in when the consult is closed out
  },
  { timestamps: true }
);

module.exports = mongoose.model("Consultation", consultationSchema);

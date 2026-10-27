const mongoose = require("mongoose");

const patientSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    age: { type: Number, required: true },
    gender: { type: String, enum: ["M", "F", "Other"], required: true },
    phone: { type: String },
    bloodGroup: { type: String },
    condition: { type: String, default: "" }, // headline condition shown on the patient card
    lastVisit: { type: Date },
    vitals: {
      bp: { type: String, default: "-" },
      pulse: { type: String, default: "-" },
      temp: { type: String, default: "-" },
      spo2: { type: String, default: "-" },
    },
  },
  { timestamps: true }
);

patientSchema.index({ name: "text" });

module.exports = mongoose.model("Patient", patientSchema);

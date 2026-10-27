const mongoose = require("mongoose");

const labOrderSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor", required: true },
    consultation: { type: mongoose.Schema.Types.ObjectId, ref: "Consultation", default: null },
    testName: { type: String, required: true },
    status: {
      type: String,
      enum: ["Ordered", "In Progress", "Completed", "Cancelled"],
      default: "Ordered",
    },
    notes: { type: String, default: "" },
    resultSummary: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("LabOrder", labOrderSchema);

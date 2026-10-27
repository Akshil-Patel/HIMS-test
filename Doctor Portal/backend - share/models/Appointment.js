const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor", required: true },
    date: { type: Date, required: true, default: Date.now }, // calendar day of the appointment
    time: { type: String, required: true }, // "09:15" — kept as a display string, like the mock data
    type: { type: String, enum: ["New", "Follow-up"], required: true },
    complaint: { type: String, required: true },
    status: {
      type: String,
      enum: ["Scheduled", "Waiting", "In Consult", "Completed", "Cancelled"],
      default: "Scheduled",
    },
    urgent: { type: Boolean, default: false },
    checkedInAt: { type: Date, default: null }, // used to compute the "wait" column
  },
  { timestamps: true }
);

appointmentSchema.index({ doctor: 1, date: 1 });
appointmentSchema.index({ status: 1 });

module.exports = mongoose.model("Appointment", appointmentSchema);

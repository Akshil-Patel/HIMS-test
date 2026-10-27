const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const doctorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6, select: false },
    specialization: { type: String, required: true }, // e.g. "General Medicine"
    department: { type: String, required: true }, // used to group DepartmentLoad stats
    status: {
      type: String,
      enum: ["Available", "In Consult", "Off Duty"],
      default: "Available",
    },
    currentPatient: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", default: null },
    avgConsultMins: { type: Number, default: 10 }, // simple running average, updated per consult
  },
  { timestamps: true }
);

// Derive the two-letter initials the frontend shows in avatars,
// instead of storing them redundantly.
doctorSchema.virtual("avatarInitials").get(function () {
  return this.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
});
doctorSchema.set("toJSON", { virtuals: true });

doctorSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

doctorSchema.methods.matchPassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model("Doctor", doctorSchema);

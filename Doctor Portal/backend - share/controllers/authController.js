const asyncHandler = require("../middleware/asyncHandler");
const Doctor = require("../models/Doctor");
const generateToken = require("../utils/generateToken");

// @desc  Log a doctor in, return a JWT + their profile
// @route POST /api/auth/login
// @body  { email, password }
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error("Email and password are required");
  }

  const doctor = await Doctor.findOne({ email: email.toLowerCase() }).select("+password");

  if (!doctor || !(await doctor.matchPassword(password))) {
    res.status(401);
    throw new Error("Invalid email or password");
  }

  res.json({
    success: true,
    token: generateToken(doctor._id),
    doctor: {
      id: doctor._id,
      name: doctor.name,
      specialization: doctor.specialization,
      department: doctor.department,
      avatarInitials: doctor.avatarInitials,
      status: doctor.status,
    },
  });
});

// @desc  Get the logged-in doctor's own profile (matches `currentDoctor` in mockData)
// @route GET /api/auth/me
const getMe = asyncHandler(async (req, res) => {
  const doctor = req.doctor;
  res.json({
    success: true,
    doctor: {
      id: doctor._id,
      name: doctor.name,
      specialization: doctor.specialization,
      department: doctor.department,
      avatarInitials: doctor.avatarInitials,
      status: doctor.status,
    },
  });
});

module.exports = { login, getMe };

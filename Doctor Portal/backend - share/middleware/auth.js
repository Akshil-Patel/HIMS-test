const jwt = require("jsonwebtoken");
const asyncHandler = require("./asyncHandler");
const Doctor = require("../models/Doctor");

// Verifies the Bearer token, loads the doctor, and attaches it to req.doctor.
// Every route except /api/auth/login goes through this.
const protect = asyncHandler(async (req, res, next) => {
  let token;
  const header = req.headers.authorization;

  if (header && header.startsWith("Bearer ")) {
    token = header.split(" ")[1];
  }

  if (!token) {
    res.status(401);
    throw new Error("Not authorized, no token provided");
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.doctor = await Doctor.findById(decoded.id);
    if (!req.doctor) {
      res.status(401);
      throw new Error("Not authorized, doctor no longer exists");
    }
    next();
  } catch (err) {
    res.status(401);
    throw new Error("Not authorized, token invalid or expired");
  }
});

module.exports = { protect };

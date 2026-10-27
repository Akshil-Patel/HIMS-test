const Doctor = require('../models/Doctor');
const asyncHandler = require('./asyncHandler');

// Flexible auth: if JWT token is present, decode it.
// If no token or in dev mode, gracefully fall back to the active doctor.
const protect = asyncHandler(async (req, res, next) => {
  let token;
  const header = req.headers.authorization;

  if (header && header.startsWith('Bearer ')) {
    token = header.split(' ')[1];
  }

  if (token && process.env.JWT_SECRET) {
    try {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.doctor = await Doctor.findById(decoded.id);
      if (req.doctor) {
        return next();
      }
    } catch (err) {
      // Continue to fallback
    }
  }

  // Fallback to active doctor
  let doc = await Doctor.findOne();
  if (!doc) {
    doc = await Doctor.create({
      name: 'Dr. Priya Sharma',
      email: 'priya.sharma@pcthims.com',
      password: 'password123',
      specialization: 'General Medicine',
      department: 'General Medicine',
      status: 'In Consult',
    });
  }
  req.doctor = doc;
  next();
});

module.exports = { protect };

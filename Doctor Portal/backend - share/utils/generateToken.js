const jwt = require("jsonwebtoken");

function generateToken(doctorId) {
  return jwt.sign({ id: doctorId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
}

module.exports = generateToken;

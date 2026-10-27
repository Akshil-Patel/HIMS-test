const jwt = require('jsonwebtoken');

function generateToken(doctorId) {
  return jwt.sign({ id: doctorId }, process.env.JWT_SECRET || 'lipms_dev_secret_key_2026', {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

module.exports = generateToken;

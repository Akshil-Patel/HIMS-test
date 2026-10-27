const express = require('express');
const cors = require('cors');
const billRoutes = require('./routes/billRoutes');
const authRoutes = require('./routes/authRoutes');
const doctorRoutes = require('./routes/doctorRoutes');
const patientRoutes = require('./routes/patientRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const consultationRoutes = require('./routes/consultationRoutes');
const labOrderRoutes = require('./routes/labOrderRoutes');
const prescriptionRoutes = require('./routes/prescriptionRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const { errorHandler, notFound } = require('./middleware/errorHandler');

const app = express();

// Middleware
app.use(cors());

// Capture raw body for Razorpay Webhook signature verification
app.use(
  express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  })
);

// Billing & Payments Routes
app.use('/api/bills', billRoutes);

// Doctor & Clinical Module Routes
app.use('/api/auth', authRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/consultations', consultationRoutes);
app.use('/api/lab-orders', labOrderRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/dashboard/doctor', dashboardRoutes);
app.use('/api/doctor-dashboard', dashboardRoutes);

// Health & status checks
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    service: 'LIPMS Billing & Clinical Backend API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      bills: '/api/bills',
      patients: '/api/patients',
      doctors: '/api/doctors',
      appointments: '/api/appointments',
      consultations: '/api/consultations',
      labOrders: '/api/lab-orders',
      prescriptions: '/api/prescriptions',
    },
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'lipms-integrated-backend',
    modules: ['billing', 'doctor-portal', 'pharmacy', 'lab'],
    timestamp: new Date().toISOString(),
  });
});

// Error handling
app.use(notFound);
app.use(errorHandler);

module.exports = app;

const express = require("express");
const {
  getAppointments,
  getAppointmentById,
  createAppointment,
  updateAppointmentStatus,
} = require("../controllers/appointmentController");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.use(protect);
router.get("/", getAppointments);
router.post("/", createAppointment);
router.get("/:id", getAppointmentById);
router.patch("/:id/status", updateAppointmentStatus);

module.exports = router;

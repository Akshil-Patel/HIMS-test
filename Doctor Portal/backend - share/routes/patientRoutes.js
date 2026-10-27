const express = require("express");
const {
  getPatients,
  getPatientById,
  createPatient,
  updateVitals,
} = require("../controllers/patientController");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.use(protect);
router.get("/", getPatients);
router.post("/", createPatient);
router.get("/:id", getPatientById);
router.patch("/:id/vitals", updateVitals);

module.exports = router;

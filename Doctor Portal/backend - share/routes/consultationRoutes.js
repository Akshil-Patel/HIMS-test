const express = require("express");
const {
  createConsultation,
  getConsultationsForPatient,
} = require("../controllers/consultationController");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.use(protect);
router.post("/", createConsultation);
router.get("/:patientId", getConsultationsForPatient);

module.exports = router;

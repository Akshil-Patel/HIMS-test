const express = require("express");
const { getDoctors, getDoctorById } = require("../controllers/doctorController");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.use(protect);
router.get("/", getDoctors);
router.get("/:id", getDoctorById);

module.exports = router;

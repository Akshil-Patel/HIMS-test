const express = require("express");
const { getStats, getDepartmentLoad } = require("../controllers/dashboardController");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.use(protect);
router.get("/stats", getStats);
router.get("/department-load", getDepartmentLoad);

module.exports = router;

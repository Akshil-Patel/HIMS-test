const express = require("express");
const {
  getLabOrders,
  createLabOrder,
  updateLabOrderStatus,
} = require("../controllers/labOrderController");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.use(protect);
router.get("/", getLabOrders);
router.post("/", createLabOrder);
router.patch("/:id/status", updateLabOrderStatus);

module.exports = router;

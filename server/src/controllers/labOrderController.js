const asyncHandler = require("../middleware/asyncHandler");
const LabOrder = require("../models/LabOrder");

// @desc  List lab orders, optionally filtered
// @route GET /api/lab-orders?status=Ordered&doctorId=...
const getLabOrders = asyncHandler(async (req, res) => {
  const { status, doctorId, patientId } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (doctorId) filter.doctor = doctorId;
  if (patientId) filter.patient = patientId;

  const orders = await LabOrder.find(filter)
    .populate("patient", "name age gender")
    .populate("doctor", "name")
    .sort({ createdAt: -1 });

  res.json({ success: true, labOrders: orders });
});

// @desc  Order a lab test directly (outside of a consultation)
// @route POST /api/lab-orders
const createLabOrder = asyncHandler(async (req, res) => {
  const { patient, testName, notes } = req.body;
  if (!patient || !testName) {
    res.status(400);
    throw new Error("patient and testName are required");
  }

  const order = await LabOrder.create({
    patient,
    doctor: req.doctor._id,
    testName,
    notes,
  });

  res.status(201).json({ success: true, labOrder: order });
});

// @desc  Update a lab order's status (e.g. when results come back)
// @route PATCH /api/lab-orders/:id/status
const updateLabOrderStatus = asyncHandler(async (req, res) => {
  const { status, resultSummary } = req.body;
  const validStatuses = ["Ordered", "In Progress", "Completed", "Cancelled"];

  if (!validStatuses.includes(status)) {
    res.status(400);
    throw new Error(`status must be one of: ${validStatuses.join(", ")}`);
  }

  const order = await LabOrder.findById(req.params.id);
  if (!order) {
    res.status(404);
    throw new Error("Lab order not found");
  }

  order.status = status;
  if (resultSummary !== undefined) order.resultSummary = resultSummary;
  await order.save();

  res.json({ success: true, labOrder: order });
});

module.exports = { getLabOrders, createLabOrder, updateLabOrderStatus };

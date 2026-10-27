/**
 * Validates the request body for creating/updating a bill.
 */
function validateBill(req, res, next) {
  const { patient, items } = req.body;
  const errors = [];

  if (!patient || !patient.name || !patient.name.trim()) {
    errors.push('Patient name is required');
  }

  if (!items || !Array.isArray(items) || items.length === 0) {
    errors.push('At least one bill item is required');
  } else {
    items.forEach((item, i) => {
      if (!item.description || !item.description.trim()) {
        errors.push(`Item ${i + 1}: description is required`);
      }
      if (item.unitPrice === undefined || item.unitPrice < 0) {
        errors.push(`Item ${i + 1}: unitPrice must be >= 0`);
      }
      if (item.quantity !== undefined && item.quantity < 1) {
        errors.push(`Item ${i + 1}: quantity must be >= 1`);
      }
    });
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, errors });
  }

  next();
}

/**
 * Validates a payment entry.
 */
function validatePayment(req, res, next) {
  const { method, amount } = req.body;
  const errors = [];

  const validMethods = ['cash', 'card', 'upi', 'net_banking', 'insurance', 'wallet', 'razorpay'];
  if (!method || !validMethods.includes(method)) {
    errors.push(`Payment method must be one of: ${validMethods.join(', ')}`);
  }

  if (!amount || amount <= 0) {
    errors.push('Payment amount must be greater than 0');
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, errors });
  }

  next();
}

module.exports = { validateBill, validatePayment };

const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/billController');
const { validateBill, validatePayment } = require('../middleware/validate');

// Gateway metadata & webhooks (must come before /:id routes)
router.get('/stats', ctrl.getStats);
router.get('/gateway/status', ctrl.getGatewayStatus);
router.post('/razorpay/webhook', ctrl.handleRazorpayWebhook);

router.route('/')
  .get(ctrl.getBills)
  .post(validateBill, ctrl.createBill);

router.route('/:id')
  .get(ctrl.getBillById)
  .put(validateBill, ctrl.updateBill);

router.patch('/:id/finalize', ctrl.finalizeBill);
router.post('/:id/payments', validatePayment, ctrl.recordPayment);
router.post('/:id/razorpay/order', ctrl.createRazorpayOrder);
router.post('/:id/razorpay/verify', ctrl.verifyRazorpayPayment);
router.get('/:id/upi/status', ctrl.checkUpiPaymentStatus);
router.post('/:id/upi/simulate-paid', ctrl.simulateUpiPayment);
router.patch('/:id/cancel', ctrl.cancelBill);
router.get('/:id/receipt', ctrl.getReceipt);
router.get('/:id/pdf', ctrl.downloadBillPdf);
router.post('/:id/whatsapp', ctrl.sendBillWhatsApp);

module.exports = router;

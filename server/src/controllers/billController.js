const billService = require('../services/billService');
const razorpayService = require('../services/razorpayService');
const pdfReceiptService = require('../services/pdfReceiptService');
const whatsappService = require('../services/whatsappService');

// POST /api/bills
exports.createBill = async (req, res, next) => {
  try {
    const bill = await billService.createBill(req.body);
    res.status(201).json({ success: true, data: bill });
  } catch (err) {
    next(err);
  }
};

// GET /api/bills
exports.getBills = async (req, res, next) => {
  try {
    const result = await billService.getBills(req.query);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

// GET /api/bills/stats
exports.getStats = async (req, res, next) => {
  try {
    const stats = await billService.getStats();
    res.json({ success: true, data: stats });
  } catch (err) {
    next(err);
  }
};

// GET /api/bills/:id
exports.getBillById = async (req, res, next) => {
  try {
    const bill = await billService.getBillById(req.params.id);
    res.json({ success: true, data: bill });
  } catch (err) {
    if (err.statusCode) res.status(err.statusCode);
    next(err);
  }
};

// PUT /api/bills/:id
exports.updateBill = async (req, res, next) => {
  try {
    const bill = await billService.updateBill(req.params.id, req.body);
    res.json({ success: true, data: bill });
  } catch (err) {
    if (err.statusCode) res.status(err.statusCode);
    next(err);
  }
};

// PATCH /api/bills/:id/finalize
exports.finalizeBill = async (req, res, next) => {
  try {
    const bill = await billService.finalizeBill(req.params.id);
    res.json({ success: true, data: bill });
  } catch (err) {
    if (err.statusCode) res.status(err.statusCode);
    next(err);
  }
};

// POST /api/bills/:id/payments
exports.recordPayment = async (req, res, next) => {
  try {
    const bill = await billService.recordPayment(req.params.id, req.body);
    // Auto-dispatch updated settled receipt to WhatsApp
    const host = `${req.protocol}://${req.get('host')}`;
    whatsappService.sendBillToWhatsApp(bill, host).catch((err) =>
      console.warn('[recordPayment] WhatsApp auto-dispatch note:', err.message)
    );
    res.json({ success: true, data: bill });
  } catch (err) {
    if (err.statusCode) res.status(err.statusCode);
    next(err);
  }
};

// PATCH /api/bills/:id/cancel
exports.cancelBill = async (req, res, next) => {
  try {
    const bill = await billService.cancelBill(req.params.id);
    res.json({ success: true, data: bill });
  } catch (err) {
    if (err.statusCode) res.status(err.statusCode);
    next(err);
  }
};

// GET /api/bills/:id/receipt
exports.getReceipt = async (req, res, next) => {
  try {
    const bill = await billService.getBillById(req.params.id);
    res.json({
      success: true,
      data: {
        ...bill,
        receiptTitle: 'LIPMS — Payment Receipt',
        printedAt: new Date().toISOString(),
      },
    });
  } catch (err) {
    if (err.statusCode) res.status(err.statusCode);
    next(err);
  }
};

// GET /api/bills/gateway/status
exports.getGatewayStatus = (req, res) => {
  res.json({
    success: true,
    data: razorpayService.getGatewayStatus(),
  });
};

// POST /api/bills/:id/razorpay/order
exports.createRazorpayOrder = async (req, res, next) => {
  try {
    const bill = await billService.getBillById(req.params.id);
    if (!['finalized', 'partially_paid'].includes(bill.status)) {
      return res.status(400).json({
        success: false,
        message: 'Razorpay orders can only be created for finalized or partially-paid bills',
      });
    }

    const requestedAmount = req.body.amount ? parseFloat(req.body.amount) : bill.balanceDue;
    if (isNaN(requestedAmount) || requestedAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid payment amount' });
    }
    if (requestedAmount > bill.balanceDue) {
      return res.status(400).json({
        success: false,
        message: `Amount exceeds balance due of ₹${bill.balanceDue}`,
      });
    }

    const orderData = await razorpayService.createRazorpayOrder(
      requestedAmount,
      bill.billNumber,
      { billId: bill._id.toString(), billNumber: bill.billNumber, patientName: bill.patient?.name || '' }
    );

    // Persist active Razorpay Order ID on the bill for reference & webhook lookups
    const Bill = require('../models/Bill');
    await Bill.findByIdAndUpdate(bill._id, { activeRazorpayOrderId: orderData.orderId });

    res.json({
      success: true,
      data: {
        ...orderData,
        billNumber: bill.billNumber,
        patient: bill.patient,
      },
    });
  } catch (err) {
    if (err.statusCode) res.status(err.statusCode);
    next(err);
  }
};

// POST /api/bills/:id/razorpay/verify
exports.verifyRazorpayPayment = async (req, res, next) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, amount, receivedBy, notes } = req.body;

    if (!razorpayOrderId || !razorpayPaymentId) {
      return res.status(400).json({
        success: false,
        message: 'razorpayOrderId and razorpayPaymentId are required',
      });
    }

    // Verify cryptographic HMAC-SHA256 signature
    const isValid = razorpayService.verifyPaymentSignature(
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature
    );

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Razorpay signature. Payment verification failed.',
      });
    }

    // Authoritative payment data lookup from Razorpay API
    const realDetails = await razorpayService.fetchPaymentDetails(razorpayPaymentId);
    const gatewayStatus = razorpayService.getGatewayStatus();

    // Map payment method
    let paymentMethod = 'razorpay';
    if (realDetails?.method) {
      if (realDetails.method === 'upi') paymentMethod = 'upi';
      else if (realDetails.method === 'card') paymentMethod = 'card';
      else if (realDetails.method === 'netbanking') paymentMethod = 'net_banking';
      else if (realDetails.method === 'wallet') paymentMethod = 'wallet';
    } else if (req.body.method && ['card', 'net_banking', 'upi', 'razorpay', 'wallet'].includes(req.body.method)) {
      paymentMethod = req.body.method;
    }

    const bill = await billService.recordPayment(req.params.id, {
      method: paymentMethod,
      amount: realDetails ? realDetails.amount : parseFloat(amount),
      transactionId: razorpayPaymentId,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      gatewayMode: gatewayStatus.mode,
      bankRrn: realDetails?.bankRrn || '',
      payerVpa: realDetails?.vpa || '',
      cardNetwork: realDetails?.cardNetwork || '',
      cardLast4: realDetails?.cardLast4 || '',
      bankName: realDetails?.bankName || '',
      receivedBy: receivedBy || `Razorpay Gateway (${gatewayStatus.mode.toUpperCase()})`,
      notes: notes || `Razorpay ${gatewayStatus.mode} verified settlement`,
    });

    // Auto-dispatch updated settled receipt to WhatsApp
    const host = `${req.protocol}://${req.get('host')}`;
    whatsappService.sendBillToWhatsApp(bill, host).catch((err) =>
      console.warn('[verifyRazorpayPayment] WhatsApp auto-dispatch note:', err.message)
    );

    res.json({
      success: true,
      message: 'Razorpay payment verified and recorded successfully',
      data: bill,
    });
  } catch (err) {
    if (err.statusCode) res.status(err.statusCode);
    next(err);
  }
};

// POST /api/bills/razorpay/webhook
// Direct server-to-server webhook endpoint for 100% reliable asynchronous auto-validation
exports.handleRazorpayWebhook = async (req, res, next) => {
  try {
    const webhookSignature = req.headers['x-razorpay-signature'];
    const rawBody = req.rawBody ? req.rawBody.toString() : JSON.stringify(req.body);

    const isValid = razorpayService.verifyWebhookSignature(rawBody, webhookSignature);
    if (!isValid && process.env.RAZORPAY_WEBHOOK_SECRET) {
      console.warn('Rejected invalid Razorpay webhook signature');
      return res.status(400).json({ success: false, message: 'Invalid webhook signature' });
    }

    const event = req.body?.event;
    console.log(`[Razorpay Webhook] Received event: ${event}`);

    if (event === 'payment.captured' || event === 'order.paid') {
      const paymentEntity = req.body.payload?.payment?.entity;
      const orderEntity = req.body.payload?.order?.entity;

      const orderId = paymentEntity?.order_id || orderEntity?.id;
      const paymentId = paymentEntity?.id;
      const amount = paymentEntity ? paymentEntity.amount / 100 : (orderEntity ? orderEntity.amount_paid / 100 : 0);
      const billId = paymentEntity?.notes?.billId || orderEntity?.notes?.billId;
      const billNumber = paymentEntity?.notes?.billNumber || orderEntity?.notes?.billNumber;

      const Bill = require('../models/Bill');
      let targetBill = null;
      if (billId) {
        targetBill = await Bill.findById(billId);
      }
      if (!targetBill && billNumber) {
        targetBill = await Bill.findOne({ billNumber });
      }
      if (!targetBill && orderId) {
        targetBill = await Bill.findOne({ activeRazorpayOrderId: orderId });
      }

      if (targetBill && ['finalized', 'partially_paid'].includes(targetBill.status)) {
        await billService.recordPayment(targetBill._id, {
          method: paymentEntity?.method === 'upi' ? 'upi' : (paymentEntity?.method === 'card' ? 'card' : 'razorpay'),
          amount: Math.min(amount, targetBill.balanceDue),
          transactionId: paymentId,
          razorpayOrderId: orderId,
          razorpayPaymentId: paymentId,
          razorpaySignature: 'webhook_verified',
          gatewayMode: razorpayService.getGatewayStatus().mode,
          bankRrn: paymentEntity?.acquirer_data?.rrn || '',
          payerVpa: paymentEntity?.vpa || '',
          receivedBy: 'Razorpay Webhook',
          notes: `Automatic webhook capture for event ${event}`,
        });
        console.log(`[Razorpay Webhook] Settled bill ${targetBill.billNumber} for ₹${amount}`);
      }
    }

    res.json({ status: 'ok' });
  } catch (err) {
    console.error('Webhook error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// GET /api/bills/:id/upi/status
// Polled by client while QR is on screen to auto-validate and auto-settle UPI payments
exports.checkUpiPaymentStatus = async (req, res, next) => {
  try {
    const bill = await billService.getBillById(req.params.id);
    res.json({
      success: true,
      data: {
        billNumber: bill.billNumber,
        status: bill.status,
        amountPaid: bill.amountPaid,
        balanceDue: bill.balanceDue,
        isSettled: bill.balanceDue === 0 || ['paid', 'partially_paid'].includes(bill.status),
        payments: bill.payments,
      },
    });
  } catch (err) {
    if (err.statusCode) res.status(err.statusCode);
    next(err);
  }
};

// POST /api/bills/:id/upi/simulate-paid
// Simulates bank settlement webhook confirmation for the dynamic UPI QR
exports.simulateUpiPayment = async (req, res, next) => {
  try {
    const { amount, utr, vpa } = req.body;
    const bill = await billService.getBillById(req.params.id);

    const payAmount = amount ? parseFloat(amount) : bill.balanceDue;
    const txnId = utr || `UTR${Date.now().toString().slice(-8)}`;

    const updated = await billService.recordPayment(req.params.id, {
      method: 'upi',
      amount: payAmount,
      transactionId: txnId,
      receivedBy: 'UPI Bank Network (Auto-Verified)',
      notes: `Dynamic UPI QR Confirmed • Payee VPA: ${vpa || 'akshil3306@okicici'} • UTR: ${txnId}`,
    });

    // Auto-dispatch updated settled receipt to WhatsApp
    const host = `${req.protocol}://${req.get('host')}`;
    whatsappService.sendBillToWhatsApp(updated, host).catch((err) =>
      console.warn('[simulateUpiPayment] WhatsApp auto-dispatch note:', err.message)
    );

    res.json({
      success: true,
      message: 'UPI payment received and settled automatically',
      data: updated,
    });
  } catch (err) {
    if (err.statusCode) res.status(err.statusCode);
    next(err);
  }
};

// GET /api/bills/:id/pdf
// Stream official vector PDF medical invoice
exports.downloadBillPdf = async (req, res, next) => {
  try {
    const bill = await billService.getBillById(req.params.id);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `inline; filename="LIPMS-Invoice-${bill.billNumber || 'receipt'}.pdf"`
    );
    pdfReceiptService.generateBillPdfStream(bill, res);
  } catch (err) {
    if (err.statusCode) res.status(err.statusCode);
    next(err);
  }
};

// POST /api/bills/:id/whatsapp
// Dispatches / resends official PDF bill to patient's WhatsApp
exports.sendBillWhatsApp = async (req, res, next) => {
  try {
    const bill = await billService.getBillById(req.params.id);
    const host = `${req.protocol}://${req.get('host')}`;
    const result = await whatsappService.sendBillToWhatsApp(bill, host);
    res.json({
      success: true,
      message: `Official PDF invoice sent to WhatsApp (+${result.recipientPhone})`,
      data: result,
    });
  } catch (err) {
    if (err.statusCode) res.status(err.statusCode);
    next(err);
  }
};

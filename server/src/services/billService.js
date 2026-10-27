const Bill = require('../models/Bill');
const { generateBillNumber, calculateBillSummary } = require('../utils/helpers');

class BillService {
  /**
   * Create a new bill (draft).
   */
  async createBill(data) {
    const billNumber = await generateBillNumber();
    const { items: computedItems, ...summary } = calculateBillSummary(data.items);

    const bill = new Bill({
      billNumber,
      patient: data.patient,
      source: data.source || {},
      items: computedItems,
      ...summary,
      balanceDue: summary.grandTotal,
      notes: data.notes || '',
      createdBy: data.createdBy || 'System',
      updatedBy: data.createdBy || 'System',
      status: 'draft',
    });

    return bill.save();
  }

  /**
   * Get all bills with optional filters.
   */
  async getBills(query = {}) {
    const filter = {};

    if (query.status) filter.status = query.status;
    if (query.module) filter['source.module'] = query.module;
    if (query.search) {
      filter.$or = [
        { billNumber: { $regex: query.search, $options: 'i' } },
        { 'patient.name': { $regex: query.search, $options: 'i' } },
      ];
    }
    if (query.from || query.to) {
      filter.createdAt = {};
      if (query.from) filter.createdAt.$gte = new Date(query.from);
      if (query.to) {
        const toDate = new Date(query.to);
        toDate.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = toDate;
      }
    }

    const page = parseInt(query.page, 10) || 1;
    const limit = parseInt(query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const [bills, total] = await Promise.all([
      Bill.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Bill.countDocuments(filter),
    ]);

    return { bills, total, page, totalPages: Math.ceil(total / limit) };
  }

  /**
   * Get a single bill by ID.
   */
  async getBillById(id) {
    const bill = await Bill.findById(id).lean();
    if (!bill) throw Object.assign(new Error('Bill not found'), { statusCode: 404 });
    return bill;
  }

  /**
   * Update a draft bill.
   */
  async updateBill(id, data) {
    const bill = await Bill.findById(id);
    if (!bill) throw Object.assign(new Error('Bill not found'), { statusCode: 404 });
    if (bill.status !== 'draft') {
      throw Object.assign(new Error('Only draft bills can be edited'), { statusCode: 400 });
    }

    if (data.patient) bill.patient = { ...bill.patient.toObject(), ...data.patient };
    if (data.source) bill.source = { ...bill.source.toObject(), ...data.source };
    if (data.notes !== undefined) bill.notes = data.notes;

    if (data.items) {
      const { items: computedItems, ...summary } = calculateBillSummary(data.items);
      bill.items = computedItems;
      bill.subtotal = summary.subtotal;
      bill.discountTotal = summary.discountTotal;
      bill.taxTotal = summary.taxTotal;
      bill.grandTotal = summary.grandTotal;
      bill.balanceDue = summary.grandTotal - bill.amountPaid;
    }

    bill.updatedBy = data.updatedBy || 'System';
    return bill.save();
  }

  /**
   * Finalize a draft bill — locks items and makes it ready for payment.
   */
  async finalizeBill(id) {
    const bill = await Bill.findById(id);
    if (!bill) throw Object.assign(new Error('Bill not found'), { statusCode: 404 });
    if (bill.status !== 'draft') {
      throw Object.assign(new Error('Only draft bills can be finalized'), { statusCode: 400 });
    }
    if (bill.items.length === 0) {
      throw Object.assign(new Error('Cannot finalize a bill with no items'), { statusCode: 400 });
    }

    bill.status = 'finalized';
    return bill.save();
  }

  /**
   * Record a payment against a bill.
   */
  async recordPayment(id, paymentData) {
    const bill = await Bill.findById(id);
    if (!bill) throw Object.assign(new Error('Bill not found'), { statusCode: 404 });

    if (!['finalized', 'partially_paid'].includes(bill.status)) {
      throw Object.assign(
        new Error('Payments can only be recorded on finalized or partially-paid bills'),
        { statusCode: 400 }
      );
    }

    // Idempotency guard: prevent duplicate recording if webhook and client callback both fire
    if (paymentData.razorpayPaymentId) {
      const existingPayment = bill.payments.find(
        (p) => p.razorpayPaymentId === paymentData.razorpayPaymentId
      );
      if (existingPayment) {
        return bill;
      }
    }

    if (paymentData.amount > bill.balanceDue) {
      throw Object.assign(
        new Error(`Payment amount (${paymentData.amount}) exceeds balance due (${bill.balanceDue})`),
        { statusCode: 400 }
      );
    }

    bill.payments.push({
      method: paymentData.method,
      amount: paymentData.amount,
      transactionId: paymentData.transactionId || paymentData.razorpayPaymentId || '',
      razorpayOrderId: paymentData.razorpayOrderId || '',
      razorpayPaymentId: paymentData.razorpayPaymentId || '',
      razorpaySignature: paymentData.razorpaySignature || '',
      gatewayMode: paymentData.gatewayMode || 'live',
      bankRrn: paymentData.bankRrn || '',
      payerVpa: paymentData.payerVpa || '',
      cardNetwork: paymentData.cardNetwork || '',
      cardLast4: paymentData.cardLast4 || '',
      bankName: paymentData.bankName || '',
      receivedBy: paymentData.receivedBy || 'Staff',
      paidAt: paymentData.paidAt || new Date(),
      notes: paymentData.notes || '',
    });

    bill.amountPaid = Math.round((bill.amountPaid + paymentData.amount) * 100) / 100;
    bill.balanceDue = Math.round((bill.grandTotal - bill.amountPaid) * 100) / 100;

    if (bill.balanceDue <= 0) {
      bill.status = 'paid';
      bill.balanceDue = 0;
    } else {
      bill.status = 'partially_paid';
    }

    return bill.save();
  }

  /**
   * Cancel a bill.
   */
  async cancelBill(id) {
    const bill = await Bill.findById(id);
    if (!bill) throw Object.assign(new Error('Bill not found'), { statusCode: 404 });

    if (['cancelled', 'refunded'].includes(bill.status)) {
      throw Object.assign(new Error('Bill is already cancelled or refunded'), { statusCode: 400 });
    }

    bill.status = 'cancelled';
    return bill.save();
  }

  /**
   * Get dashboard stats.
   */
  async getStats() {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [totals, todayBills] = await Promise.all([
      Bill.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            total: { $sum: '$grandTotal' },
            collected: { $sum: '$amountPaid' },
          },
        },
      ]),
      Bill.aggregate([
        { $match: { createdAt: { $gte: todayStart } } },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            revenue: { $sum: '$amountPaid' },
          },
        },
      ]),
    ]);

    const statusMap = {};
    totals.forEach((t) => {
      statusMap[t._id] = { count: t.count, total: t.total, collected: t.collected };
    });

    return {
      today: todayBills[0] || { count: 0, revenue: 0 },
      byStatus: statusMap,
      overall: {
        totalBills: totals.reduce((s, t) => s + t.count, 0),
        totalRevenue: totals.reduce((s, t) => s + t.collected, 0),
      },
    };
  }
}

module.exports = new BillService();

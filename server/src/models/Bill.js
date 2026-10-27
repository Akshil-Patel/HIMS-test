const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  method: {
    type: String,
    required: true,
    enum: ['cash', 'card', 'upi', 'net_banking', 'insurance', 'wallet', 'razorpay'],
  },
  amount: {
    type: Number,
    required: true,
    min: 0.01,
  },
  transactionId: {
    type: String,
    default: '',
  },
  razorpayOrderId: {
    type: String,
    default: '',
  },
  razorpayPaymentId: {
    type: String,
    default: '',
  },
  razorpaySignature: {
    type: String,
    default: '',
  },
  gatewayMode: {
    type: String,
    enum: ['live', 'test', 'demo', 'offline'],
    default: 'test',
  },
  bankRrn: {
    type: String,
    default: '',
  },
  payerVpa: {
    type: String,
    default: '',
  },
  cardNetwork: {
    type: String,
    default: '',
  },
  cardLast4: {
    type: String,
    default: '',
  },
  bankName: {
    type: String,
    default: '',
  },
  receivedBy: {
    type: String,
    default: 'Staff',
  },
  paidAt: {
    type: Date,
    default: Date.now,
  },
  notes: {
    type: String,
    default: '',
  },
});

const billItemSchema = new mongoose.Schema({
  description: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    enum: ['test', 'medicine', 'consultation', 'procedure', 'other'],
    default: 'other',
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1,
  },
  unitPrice: {
    type: Number,
    required: true,
    min: 0,
  },
  discountPercent: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  discountAmount: {
    type: Number,
    default: 0,
  },
  taxPercent: {
    type: Number,
    default: 0,
    min: 0,
  },
  taxAmount: {
    type: Number,
    default: 0,
  },
  lineTotal: {
    type: Number,
    default: 0,
  },
});

const billSchema = new mongoose.Schema(
  {
    billNumber: {
      type: String,
      unique: true,
      required: true,
    },
    patient: {
      patientId: { type: String, default: '' },
      name: { type: String, required: true },
      phone: { type: String, default: '' },
    },
    source: {
      module: {
        type: String,
        enum: ['laboratory', 'pharmacy', 'consultation', 'radiology', 'multi-dept', 'other'],
        default: 'other',
      },
      referenceId: { type: String, default: '' },
      referenceNumber: { type: String, default: '' },
    },
    items: [billItemSchema],
    subtotal: { type: Number, default: 0 },
    discountTotal: { type: Number, default: 0 },
    taxTotal: { type: Number, default: 0 },
    grandTotal: { type: Number, default: 0 },
    amountPaid: { type: Number, default: 0 },
    balanceDue: { type: Number, default: 0 },
    payments: [paymentSchema],
    activeRazorpayOrderId: { type: String, default: '' },
    status: {
      type: String,
      enum: ['draft', 'finalized', 'paid', 'partially_paid', 'cancelled', 'refunded'],
      default: 'draft',
    },
    notes: { type: String, default: '' },
    whatsappDelivery: {
      sent: { type: Boolean, default: false },
      sentAt: { type: Date },
      recipientPhone: { type: String, default: '' },
      messageId: { type: String, default: '' },
      pdfUrl: { type: String, default: '' },
      waLink: { type: String, default: '' },
      status: {
        type: String,
        enum: ['pending', 'sent', 'delivered', 'failed'],
        default: 'pending',
      },
    },
    createdBy: { type: String, default: 'System' },
    updatedBy: { type: String, default: 'System' },
  },
  {
    timestamps: true,
  }
);

// Indexes for common queries
billSchema.index({ status: 1 });
billSchema.index({ activeRazorpayOrderId: 1 });
billSchema.index({ 'patient.name': 1 });
billSchema.index({ 'source.module': 1 });
billSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Bill', billSchema);

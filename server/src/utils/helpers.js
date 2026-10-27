const Bill = require('../models/Bill');

/**
 * Generate a unique bill number in format: BILL-YYYY-XXXXX
 */
async function generateBillNumber() {
  const year = new Date().getFullYear();
  const prefix = `BILL-${year}-`;

  const lastBill = await Bill.findOne({ billNumber: new RegExp(`^${prefix}`) })
    .sort({ billNumber: -1 })
    .lean();

  let nextNum = 1;
  if (lastBill) {
    const lastNum = parseInt(lastBill.billNumber.replace(prefix, ''), 10);
    nextNum = lastNum + 1;
  }

  return `${prefix}${String(nextNum).padStart(5, '0')}`;
}

/**
 * Calculate line item totals
 */
function calculateItemTotals(item) {
  const baseAmount = (item.quantity || 1) * (item.unitPrice || 0);
  const discountAmount = (baseAmount * (item.discountPercent || 0)) / 100;
  const afterDiscount = baseAmount - discountAmount;
  const taxAmount = (afterDiscount * (item.taxPercent || 0)) / 100;
  const lineTotal = afterDiscount + taxAmount;

  return {
    ...item,
    discountAmount: Math.round(discountAmount * 100) / 100,
    taxAmount: Math.round(taxAmount * 100) / 100,
    lineTotal: Math.round(lineTotal * 100) / 100,
  };
}

/**
 * Calculate bill summary from items
 */
function calculateBillSummary(items) {
  const computed = items.map(calculateItemTotals);

  const subtotal = computed.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  const discountTotal = computed.reduce((sum, item) => sum + item.discountAmount, 0);
  const taxTotal = computed.reduce((sum, item) => sum + item.taxAmount, 0);
  const grandTotal = computed.reduce((sum, item) => sum + item.lineTotal, 0);

  return {
    items: computed,
    subtotal: Math.round(subtotal * 100) / 100,
    discountTotal: Math.round(discountTotal * 100) / 100,
    taxTotal: Math.round(taxTotal * 100) / 100,
    grandTotal: Math.round(grandTotal * 100) / 100,
  };
}

module.exports = { generateBillNumber, calculateItemTotals, calculateBillSummary };

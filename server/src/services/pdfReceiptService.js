const PDFDocument = require('pdfkit');

/**
 * Generate a PDF document stream for a given bill.
 * @param {Object} bill - Mongoose Bill document or plain object
 * @param {Object} res - Express response stream
 */
function generateBillPdfStream(bill, res) {
  const doc = new PDFDocument({
    size: 'A4',
    margin: 40,
    info: {
      Title: `Medical Receipt - ${bill.billNumber}`,
      Author: 'LIPMS Healthcare & Hospital',
      Subject: 'Patient Medical Tax Invoice',
    },
  });

  doc.pipe(res);
  buildPdfContent(doc, bill);
  doc.end();
}

/**
 * Generate a PDF buffer for attachment or background saving.
 * @param {Object} bill - Mongoose Bill document or plain object
 * @returns {Promise<Buffer>}
 */
function generateBillPdfBuffer(bill) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margin: 40,
      info: {
        Title: `Medical Receipt - ${bill.billNumber}`,
        Author: 'LIPMS Healthcare & Hospital',
      },
    });

    const buffers = [];
    doc.on('data', (chunk) => buffers.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', (err) => reject(err));

    buildPdfContent(doc, bill);
    doc.end();
  });
}

function buildPdfContent(doc, bill) {
  const primaryColor = '#0f766e'; // Teal 700
  const secondaryColor = '#0d9488'; // Teal 600
  const darkTextColor = '#1e293b';
  const lightTextColor = '#64748b';
  const borderColor = '#e2e8f0';

  // 1. Hospital Header Banner
  doc.rect(40, 40, 515, 6).fill(primaryColor);

  doc
    .fontSize(20)
    .font('Helvetica-Bold')
    .fillColor(primaryColor)
    .text('LIPMS HEALTHCARE & HOSPITAL', 40, 55);

  doc
    .fontSize(9)
    .font('Helvetica')
    .fillColor(lightTextColor)
    .text('Integrated Clinical OPD, Pharmacy, Pathology & In-Patient Services', 40, 80)
    .text('NABH Accredited | GSTIN: 07AAAAA0000A1Z5 | Reg. No: LIPMS/2026/092', 40, 93)
    .text('Emergency: +91-11-23456789 | Email: billing@lipms-hospital.org | New Delhi, India', 40, 106);

  // Status Badge on top right
  const isPaid = bill.status === 'paid' || bill.balanceDue === 0;
  const statusLabel = isPaid ? 'PAID & SETTLED' : bill.status ? bill.status.toUpperCase() : 'PENDING';
  const badgeColor = isPaid ? '#10b981' : '#f59e0b';

  doc
    .roundedRect(420, 58, 135, 26, 4)
    .fillColor(badgeColor)
    .fill();

  doc
    .fontSize(10)
    .font('Helvetica-Bold')
    .fillColor('#ffffff')
    .text(statusLabel, 420, 66, { width: 135, align: 'center' });

  // Divider line
  doc.moveTo(40, 126).lineTo(555, 126).strokeColor(borderColor).lineWidth(1).stroke();

  // 2. Patient & Invoice Meta Grid (Two columns)
  const metaTop = 136;
  doc
    .fontSize(10)
    .font('Helvetica-Bold')
    .fillColor(primaryColor)
    .text('PATIENT PARTICULARS', 40, metaTop);

  doc
    .fontSize(9)
    .font('Helvetica')
    .fillColor(darkTextColor)
    .text(`Name: `, 40, metaTop + 16, { continued: true })
    .font('Helvetica-Bold')
    .text(bill.patient?.name || 'Walk-in Patient')
    .font('Helvetica')
    .text(`Phone: `, 40, metaTop + 30, { continued: true })
    .font('Helvetica-Bold')
    .text(bill.patient?.phone || 'N/A')
    .font('Helvetica')
    .text(`UHID / Patient ID: `, 40, metaTop + 44, { continued: true })
    .font('Helvetica-Bold')
    .text(bill.patient?.patientId ? String(bill.patient.patientId).substring(0, 16) : 'LIPMS-P-Walkin');

  // Invoice Details (Right column)
  doc
    .fontSize(10)
    .font('Helvetica-Bold')
    .fillColor(primaryColor)
    .text('INVOICE DETAILS', 340, metaTop);

  const billDate = bill.createdAt ? new Date(bill.createdAt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }) : new Date().toLocaleDateString();

  doc
    .fontSize(9)
    .font('Helvetica')
    .fillColor(darkTextColor)
    .text(`Invoice No: `, 340, metaTop + 16, { continued: true })
    .font('Helvetica-Bold')
    .text(bill.billNumber || 'BILL-2026-XXXX')
    .font('Helvetica')
    .text(`Encounter Date: `, 340, metaTop + 30, { continued: true })
    .font('Helvetica-Bold')
    .text(billDate)
    .font('Helvetica')
    .text(`Encounter Type: `, 340, metaTop + 44, { continued: true })
    .font('Helvetica-Bold')
    .text(bill.source?.module === 'multi-dept' ? 'Multi-Department Consolidated' : (bill.source?.module || 'OPD'));

  // Divider line
  doc.moveTo(40, 205).lineTo(555, 205).strokeColor(borderColor).lineWidth(1).stroke();

  // 3. Consolidated Encounter Items Table
  let tableTop = 215;
  doc
    .fontSize(10)
    .font('Helvetica-Bold')
    .fillColor(primaryColor)
    .text('CONSOLIDATED MEDICAL SERVICES & MEDICINES', 40, tableTop);

  tableTop += 18;

  // Table Header
  doc
    .rect(40, tableTop, 515, 22)
    .fillColor('#f8fafc')
    .fill();

  doc
    .fontSize(8)
    .font('Helvetica-Bold')
    .fillColor(darkTextColor)
    .text('#', 48, tableTop + 6, { width: 20 })
    .text('ITEM / SERVICE DESCRIPTION', 72, tableTop + 6, { width: 230 })
    .text('DEPARTMENT', 305, tableTop + 6, { width: 75 })
    .text('QTY', 385, tableTop + 6, { width: 30, align: 'center' })
    .text('RATE (₹)', 420, tableTop + 6, { width: 55, align: 'right' })
    .text('TOTAL (₹)', 485, tableTop + 6, { width: 60, align: 'right' });

  tableTop += 24;

  const items = Array.isArray(bill.items) ? bill.items : [];

  items.forEach((item, index) => {
    // Check if we need a new page
    if (tableTop > 680) {
      doc.addPage();
      tableTop = 40;
    }

    const deptName =
      item.category === 'consultation'
        ? 'Consultancy'
        : item.category === 'medicine'
        ? 'Pharmacy'
        : item.category === 'test'
        ? 'Pathology'
        : 'Hospital';

    doc
      .fontSize(8)
      .font('Helvetica')
      .fillColor(lightTextColor)
      .text(String(index + 1), 48, tableTop, { width: 20 })
      .fillColor(darkTextColor)
      .font('Helvetica-Bold')
      .text(item.description || 'Service', 72, tableTop, { width: 230 })
      .font('Helvetica')
      .fillColor(primaryColor)
      .text(deptName, 305, tableTop, { width: 75 })
      .fillColor(darkTextColor)
      .text(String(item.quantity || 1), 385, tableTop, { width: 30, align: 'center' })
      .text(Number(item.unitPrice || 0).toFixed(2), 420, tableTop, { width: 55, align: 'right' })
      .font('Helvetica-Bold')
      .text(Number(item.lineTotal || 0).toFixed(2), 485, tableTop, { width: 60, align: 'right' });

    tableTop += 18;

    // subtle row separator
    doc.moveTo(40, tableTop - 4).lineTo(555, tableTop - 4).strokeColor('#f1f5f9').lineWidth(0.5).stroke();
  });

  tableTop += 8;

  // 4. Financial Totals & Settlement Box
  if (tableTop > 620) {
    doc.addPage();
    tableTop = 40;
  }

  // Box background
  doc
    .roundedRect(40, tableTop, 515, 85, 6)
    .fillColor('#f8fafc')
    .strokeColor(borderColor)
    .lineWidth(1)
    .fillAndStroke();

  // Left side: Payment Info
  const latestPayment = Array.isArray(bill.payments) && bill.payments.length > 0
    ? bill.payments[bill.payments.length - 1]
    : null;

  doc
    .fontSize(8)
    .font('Helvetica-Bold')
    .fillColor(primaryColor)
    .text('SETTLEMENT DETAILS', 55, tableTop + 12);

  if (latestPayment) {
    doc
      .fontSize(8)
      .font('Helvetica')
      .fillColor(darkTextColor)
      .text(`Payment Method: `, 55, tableTop + 28, { continued: true })
      .font('Helvetica-Bold')
      .text(latestPayment.method ? latestPayment.method.toUpperCase() : 'UPI / ONLINE')
      .font('Helvetica')
      .text(`Transaction / UTR: `, 55, tableTop + 42, { continued: true })
      .font('Helvetica-Bold')
      .text(latestPayment.transactionId || latestPayment.bankRrn || 'CONFIRMED-AUTO')
      .font('Helvetica')
      .text(`Settled At: `, 55, tableTop + 56, { continued: true })
      .font('Helvetica-Bold')
      .text(latestPayment.paidAt ? new Date(latestPayment.paidAt).toLocaleTimeString() : 'Verified');
  } else {
    doc
      .fontSize(8)
      .font('Helvetica')
      .fillColor(lightTextColor)
      .text('Awaiting payment at counter or via mobile QR code.', 55, tableTop + 30)
      .text('Online Payment link: ' + (process.env.CLIENT_URL || 'http://localhost:3000') + '/bills/' + bill._id, 55, tableTop + 44);
  }

  // Right side: Financial Numbers
  const rightColX = 360;
  const numColX = 475;

  doc
    .fontSize(8)
    .font('Helvetica')
    .fillColor(darkTextColor)
    .text('Gross Subtotal:', rightColX, tableTop + 12)
    .text(`₹${Number(bill.subtotal || 0).toFixed(2)}`, numColX, tableTop + 12, { width: 70, align: 'right' })

    .text('Taxes & GST (5% Pharma):', rightColX, tableTop + 26)
    .text(`+₹${Number(bill.taxTotal || 0).toFixed(2)}`, numColX, tableTop + 26, { width: 70, align: 'right' })

    .font('Helvetica-Bold')
    .fontSize(10)
    .fillColor(primaryColor)
    .text('Grand Total:', rightColX, tableTop + 42)
    .text(`₹${Number(bill.grandTotal || 0).toFixed(2)}`, numColX, tableTop + 42, { width: 70, align: 'right' });

  const balColor = bill.balanceDue > 0 ? '#b91c1c' : '#15803d';
  doc
    .fontSize(8)
    .font('Helvetica-Bold')
    .fillColor(balColor)
    .text(bill.balanceDue > 0 ? 'Balance Due:' : 'Status: Fully Paid', rightColX, tableTop + 62)
    .text(bill.balanceDue > 0 ? `₹${Number(bill.balanceDue).toFixed(2)}` : '₹0.00', numColX, tableTop + 62, { width: 70, align: 'right' });

  tableTop += 105;

  // 5. WhatsApp & Digital Verification Notice
  doc
    .roundedRect(40, tableTop, 515, 45, 6)
    .fillColor('#ecfdf5')
    .strokeColor('#6ee7b7')
    .lineWidth(0.5)
    .fillAndStroke();

  doc
    .fontSize(8)
    .font('Helvetica-Bold')
    .fillColor('#065f46')
    .text('AUTOMATED WHATSAPP RECEIPT & DIGITAL ARCHIVE', 55, tableTop + 10);

  doc
    .fontSize(8)
    .font('Helvetica')
    .fillColor('#047857')
    .text(`This official PDF invoice has been automatically transmitted to the patient's registered WhatsApp (+91 ${bill.patient?.phone || 'Registered Mobile'}).`, 55, tableTop + 22)
    .text('View or re-verify online at: ' + (process.env.CLIENT_URL || 'http://localhost:3000') + '/bills/' + bill._id + '/receipt', 55, tableTop + 33);

  // 6. Signatures and Disclaimers
  tableTop += 65;
  if (tableTop > 730) {
    doc.addPage();
    tableTop = 40;
  }

  doc
    .fontSize(8)
    .font('Helvetica')
    .fillColor(lightTextColor)
    .text('Prepared by: Computerized Hospital Billing System', 40, tableTop)
    .text('Authorized Signatory / Medical Superintendent', 370, tableTop, { align: 'right' })
    .text('LIPMS Multispecialty Healthcare Services', 370, tableTop + 12, { align: 'right' });

  // Stamp simulation
  doc
    .roundedRect(420, tableTop - 30, 95, 24, 3)
    .strokeColor(primaryColor)
    .lineWidth(1)
    .stroke();

  doc
    .fontSize(7)
    .font('Helvetica-Bold')
    .fillColor(primaryColor)
    .text('VERIFIED & AUDITED', 420, tableTop - 24, { width: 95, align: 'center' })
    .text('LIPMS MEDICAL DESK', 420, tableTop - 15, { width: 95, align: 'center' });
}

module.exports = {
  generateBillPdfStream,
  generateBillPdfBuffer,
};

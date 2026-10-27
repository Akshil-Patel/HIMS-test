import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { motion } from 'framer-motion';
import { getReceipt } from '../api/billApi';
import StatusBadge from '../components/StatusBadge';
import { PageTransition } from '../components/common/Animations';
import { ArrowLeft, Printer, ShieldCheck, CheckCircle2, Download } from 'lucide-react';

export default function ReceiptView() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [receiptData, setReceiptData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchReceipt();
  }, [id]);

  const fetchReceipt = async () => {
    try {
      setLoading(true);
      const res = await getReceipt(id);
      setReceiptData(res.data?.bill || res.data);
    } catch (err) {
      setError('Unable to load receipt data');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-gray-500">Preparing official tax receipt...</p>
        </div>
      </div>
    );
  }

  if (error || !receiptData) {
    return (
      <div className="p-8 text-center text-red-600 max-w-md mx-auto">
        <p className="font-semibold">{error || 'Receipt not found'}</p>
        <button
          onClick={() => navigate('/bills')}
          className="mt-4 px-4 py-2 bg-gray-800 text-white rounded-xl text-xs font-semibold"
        >
          Return to Bills Directory
        </button>
      </div>
    );
  }

  const b = receiptData;
  const verificationUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/bills/${b._id}/receipt`
    : `/bills/${b._id}/receipt`;

  return (
    <PageTransition className="max-w-3xl mx-auto pb-12">
      {/* Non-printable Control bar */}
      <div className="flex items-center justify-between mb-6 no-print">
        <button
          onClick={() => navigate(`/bills/${id}`)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-gray-200 bg-white text-gray-700 text-xs font-bold rounded-xl hover:bg-gray-50 transition-colors shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Bill
        </button>

        <button
          onClick={handlePrint}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-md shadow-teal-600/25 transition-all"
        >
          <Printer className="w-4 h-4" />
          Print / Save PDF Receipt
        </button>
      </div>

      {/* Printable Receipt Paper Container */}
      <div className="bg-white p-8 md:p-12 rounded-3xl border border-gray-200 shadow-sm print:border-none print:shadow-none print:p-0 print:m-0 text-gray-800 text-xs">
        {/* Hospital Header */}
        <div className="border-b-2 border-teal-700 pb-5 mb-6 flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">
              LIPMS HEALTHCARE & HOSPITAL
            </h1>
            <p className="text-xs text-gray-600 font-medium mt-0.5">
              Laboratory & In-Patient Management System (LIPMS)
            </p>
            <p className="text-[11px] text-gray-500 mt-0.5">
              Sector 12, Institutional Area, New Delhi - 110001 • Tel: +91 11 2345 6789
            </p>
          </div>
          <div className="text-right">
            <span className="px-3 py-1 bg-teal-50 border border-teal-200 text-teal-800 font-bold text-xs uppercase rounded-lg">
              Official Tax Invoice
            </span>
            <p className="text-[11px] text-gray-500 font-mono mt-2">GSTIN: 07AAAAA0000A1Z5</p>
          </div>
        </div>

        {/* Invoice Meta Grid */}
        <div className="grid grid-cols-2 gap-6 mb-6 bg-gray-50/70 p-5 rounded-2xl border border-gray-100">
          <div>
            <p className="text-[10px] uppercase font-bold text-gray-400">PATIENT DETAILS</p>
            <p className="text-base font-bold text-gray-900 mt-0.5">{b.patient?.name}</p>
            <p className="text-xs text-gray-600 mt-0.5">
              UHID: <span className="font-semibold text-gray-800">{b.patient?.patientId || 'N/A'}</span>
            </p>
            <p className="text-xs text-gray-600">
              Phone: <span className="font-semibold text-gray-800">{b.patient?.phone || 'N/A'}</span>
            </p>
          </div>

          <div className="text-right">
            <p className="text-[10px] uppercase font-bold text-gray-400">INVOICE DETAILS</p>
            <p className="text-base font-bold text-teal-800 font-mono mt-0.5">{b.billNumber}</p>
            <p className="text-xs text-gray-600 mt-0.5">
              Date: <span className="font-semibold text-gray-800">{new Date(b.createdAt).toLocaleDateString('en-IN')}</span>
            </p>
            <p className="text-xs text-gray-600">
              Department:{' '}
              {b.source?.module === 'multi-dept' ? (
                <span className="font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                  Multi-Department Encounter (Consolidated)
                </span>
              ) : (
                <span className="font-semibold capitalize text-gray-800">{b.source?.module || 'Hospital Service'}</span>
              )}
            </p>
          </div>
        </div>

        {/* Items Table */}
        <table className="w-full text-left mb-6 text-xs">
          <thead>
            <tr className="border-b-2 border-gray-200 bg-gray-100/70 text-gray-700">
              <th className="py-2.5 px-3 w-8 text-center">#</th>
              <th className="py-2.5 px-3 font-bold uppercase">Item Description / Service</th>
              <th className="py-2.5 px-3 text-center w-16 font-bold uppercase">Qty</th>
              <th className="py-2.5 px-3 text-right w-24 font-bold uppercase">Rate (₹)</th>
              <th className="py-2.5 px-3 text-right w-24 font-bold uppercase">Discount</th>
              <th className="py-2.5 px-3 text-right w-24 font-bold uppercase">Tax</th>
              <th className="py-2.5 px-3 text-right w-28 font-bold uppercase">Amount (₹)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {b.items.map((item, idx) => (
              <tr key={idx}>
                <td className="py-2.5 px-3 text-center text-gray-400 font-semibold">{idx + 1}</td>
                <td className="py-2.5 px-3 font-bold text-gray-900">
                  {item.description}
                  <span className="block text-[10px] font-medium text-gray-500 capitalize">
                    {item.category === 'consultation'
                      ? '🩺 Consultancy'
                      : item.category === 'medicine'
                      ? '💊 Pharmacy'
                      : item.category === 'test'
                      ? '🔬 Pathology / Diagnostic Lab'
                      : item.category}
                  </span>
                </td>
                <td className="py-2.5 px-3 text-center font-semibold text-gray-800">{item.quantity}</td>
                <td className="py-2.5 px-3 text-right">{item.unitPrice?.toFixed(2)}</td>
                <td className="py-2.5 px-3 text-right text-emerald-700 font-semibold">
                  {item.discountAmount > 0 ? `${item.discountAmount.toFixed(2)} (${item.discountPercent}%)` : '—'}
                </td>
                <td className="py-2.5 px-3 text-right text-gray-600">
                  {item.taxAmount > 0 ? `${item.taxAmount.toFixed(2)} (${item.taxPercent}%)` : '—'}
                </td>
                <td className="py-2.5 px-3 text-right font-bold text-gray-900">
                  {item.lineTotal?.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals Section */}
        <div className="flex justify-between items-start pt-2 border-t border-gray-200 mb-8">
          <div className="w-1/2 pr-6">
            <h4 className="text-[11px] font-bold uppercase text-gray-600 mb-2">Settlement Breakdown</h4>
            {b.payments.length === 0 ? (
              <p className="text-xs text-gray-400 italic">No payments recorded yet.</p>
            ) : (
              <div className="space-y-1.5">
                {b.payments.map((p, i) => (
                  <div key={i} className="text-[11px] bg-gray-50 p-2.5 rounded-xl border border-gray-200 space-y-1">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold uppercase text-gray-900">{p.method}</span>
                        <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">
                          VERIFIED
                        </span>
                      </div>
                      <span className="font-black text-gray-900">₹{p.amount?.toFixed(2)}</span>
                    </div>

                    <div className="text-[10px] text-gray-500 flex flex-wrap gap-x-3 gap-y-0.5">
                      {p.transactionId && <span>Txn ID: <code className="font-mono text-gray-700">{p.transactionId}</code></span>}
                      {p.bankRrn && <span>Bank UTR: <code className="font-mono text-gray-700">{p.bankRrn}</code></span>}
                      {p.payerVpa && <span>UPI VPA: <span className="font-medium text-gray-700">{p.payerVpa}</span></span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="w-72 space-y-1.5 text-xs">
            <div className="flex justify-between text-gray-600">
              <span>Gross Subtotal:</span>
              <span className="font-semibold text-gray-800">₹{b.subtotal?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Discounts:</span>
              <span className="font-semibold text-emerald-700">-₹{b.discountTotal?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>GST / Taxes:</span>
              <span className="font-semibold text-gray-800">+₹{b.taxTotal?.toFixed(2)}</span>
            </div>
            <div className="pt-2 border-t border-gray-300 flex justify-between font-bold text-sm text-gray-900">
              <span>Grand Total:</span>
              <span className="text-teal-900">₹{b.grandTotal?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs font-semibold text-emerald-800">
              <span>Total Paid:</span>
              <span>₹{b.amountPaid?.toFixed(2)}</span>
            </div>
            <div className="pt-1 border-t border-gray-200 flex justify-between font-bold text-sm">
              <span>Balance Due:</span>
              <span className={b.balanceDue > 0 ? 'text-amber-700' : 'text-emerald-700'}>
                ₹{b.balanceDue?.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Verification QR & Authorization */}
        <div className="pt-8 border-t border-gray-200 flex justify-between items-end text-xs text-gray-500">
          <div className="flex items-center gap-4">
            <div className="p-1.5 bg-white border border-gray-200 rounded-lg">
              <QRCodeSVG value={verificationUrl} size={64} level="L" />
            </div>
            <div>
              <p className="font-bold text-gray-800">Electronically Validated Tax Invoice</p>
              <p className="text-[10px] text-gray-400 mt-0.5">
                Scan QR code with any scanner to verify official authenticity.
              </p>
            </div>
          </div>

          <div className="text-center">
            <div className="w-40 border-b border-gray-400 mb-1" />
            <p className="text-[11px] font-bold text-gray-800">Authorized Signatory</p>
            <p className="text-[10px] text-gray-400">Cashier / Accounts Desk</p>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}

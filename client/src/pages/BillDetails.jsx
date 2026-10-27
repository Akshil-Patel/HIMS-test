import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import {
  getBillById,
  finalizeBill,
  recordPayment,
  cancelBill,
  sendBillWhatsApp,
  getBillPdfUrl,
} from '../api/billApi';
import StatusBadge from '../components/StatusBadge';
import PaymentModal from '../components/PaymentModal';
import PaymentSuccessOverlay from '../components/common/PaymentSuccessOverlay';
import { useToast } from '../components/common/Toast';
import { PageTransition } from '../components/common/Animations';
import {
  ArrowLeft,
  Printer,
  CheckCircle2,
  XCircle,
  CreditCard,
  User,
  Building2,
  Calendar,
  AlertCircle,
  FileText,
  Clock,
  QrCode,
  ExternalLink,
  Sparkles,
  ShieldCheck,
  Check,
  Copy,
  Download,
} from 'lucide-react';

export default function BillDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [bill, setBill] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [waSending, setWaSending] = useState(false);
  const [error, setError] = useState('');
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [celebration, setCelebration] = useState(null);

  const prevPaidAmountRef = useRef(null);

  useEffect(() => {
    fetchBill();

    // Auto-polling interval: automatically sync payment state every 3 seconds
    const pollInterval = setInterval(() => {
      syncBillSilently();
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [id]);

  const fetchBill = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await getBillById(id);
      const b = res.data?.bill || res.data;
      setBill(b);
      prevPaidAmountRef.current = b.amountPaid;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load bill details.');
    } finally {
      setLoading(false);
    }
  };

  const syncBillSilently = async () => {
    try {
      const res = await getBillById(id);
      const updated = res.data?.bill || res.data;
      if (!updated) return;

      setBill((prev) => {
        if (!prev) return updated;

        // If payment was captured remotely (e.g. from mobile QR code)
        if (updated.amountPaid > (prev.amountPaid || 0)) {
          const delta = updated.amountPaid - prev.amountPaid;
          toast.success(
            `Payment of ₹${delta.toFixed(2)} detected! Invoice updated automatically.`,
            'Payment Received'
          );
          setCelebration({
            amount: delta,
            bill: updated,
          });
          return updated;
        }

        if (
          prev.amountPaid !== updated.amountPaid ||
          prev.status !== updated.status ||
          prev.balanceDue !== updated.balanceDue
        ) {
          return updated;
        }
        return prev;
      });
    } catch (err) {
      // Ignore background poll errors silently
    }
  };

  const handleFinalize = async () => {
    if (!window.confirm('Finalize this bill? Once finalized, line items will be locked and payment collection is enabled.')) {
      return;
    }
    setActionLoading(true);
    try {
      await finalizeBill(id);
      toast.success('Bill finalized successfully! Payment can now be accepted.', 'Bill Finalized');
      await fetchBill();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error finalizing bill', 'Finalization Failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel this bill? This cannot be undone.')) {
      return;
    }
    setActionLoading(true);
    try {
      await cancelBill(id);
      toast.info('Bill has been marked as cancelled.', 'Bill Cancelled');
      await fetchBill();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error cancelling bill');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePaymentSuccess = async (paidAmt) => {
    setIsPayModalOpen(false);
    try {
      const res = await getBillById(id);
      const updated = res.data?.bill || res.data;
      setBill(updated);
      setCelebration({
        amount: paidAmt || updated.amountPaid,
        bill: updated,
      });
    } catch {
      await fetchBill();
    }
  };

  const mobilePayUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/pay/${id}`
    : `/pay/${id}`;

  const copyPatientLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(mobilePayUrl);
      setCopiedLink(true);
      toast.info('Patient payment link copied to clipboard!', 'Link Copied');
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleSendWhatsApp = async () => {
    try {
      setWaSending(true);
      const res = await sendBillWhatsApp(id);
      const waLink = res.data?.waLink;
      if (waLink) {
        window.open(waLink, '_blank');
      }
      toast.success(
        `PDF invoice transmitted to patient's WhatsApp (+${res.data?.recipientPhone || bill.patient?.phone || ''})!`,
        'WhatsApp Dispatched'
      );
      await fetchBill();
    } catch (err) {
      toast.error('Failed to dispatch WhatsApp PDF. Please check connection.', 'WhatsApp Error');
    } finally {
      setWaSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-gray-500">Loading invoice breakdown...</p>
        </div>
      </div>
    );
  }

  if (error || !bill) {
    return (
      <div className="max-w-2xl mx-auto p-8 bg-red-50 border border-red-200 rounded-3xl text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
        <h3 className="text-lg font-bold text-red-900">Invoice Unavailable</h3>
        <p className="text-sm text-red-600">{error || 'Bill not found'}</p>
        <button
          onClick={() => navigate('/bills')}
          className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-colors"
        >
          Return to Bills Directory
        </button>
      </div>
    );
  }

  const isDraft = bill.status === 'draft';
  const isFinalized = bill.status === 'finalized';
  const isPartial = bill.status === 'partially_paid';
  const isPaid = bill.status === 'paid';
  const isCancelled = bill.status === 'cancelled';
  const canCollectPayment = (isFinalized || isPartial) && bill.balanceDue > 0;

  return (
    <PageTransition className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-3xl border border-gray-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/bills')}
            className="p-2.5 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-600 transition-colors"
            title="Back to Bills"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-black text-gray-900 tracking-tight">{bill.billNumber}</h1>
              <StatusBadge status={bill.status} />
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Created {new Date(bill.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} • Department:{' '}
              <span className="font-semibold capitalize text-gray-800">{bill.source?.module || 'General'}</span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Download Official Vector PDF */}
          {!isDraft && !isCancelled && (
            <a
              href={getBillPdfUrl(bill._id)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 bg-white hover:bg-gray-50 transition-colors shadow-xs"
              title="Download official PDF Tax Receipt"
            >
              <Download className="w-4 h-4 text-teal-600" />
              <span>Download PDF</span>
            </a>
          )}

          {/* Automated WhatsApp PDF Dispatch */}
          {!isCancelled && (
            <button
              onClick={handleSendWhatsApp}
              disabled={waSending}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors disabled:opacity-50"
              title="Transmit official PDF receipt to patient WhatsApp"
            >
              <span className="text-sm">💬</span>
              <span>{waSending ? 'Sending...' : bill.whatsappDelivery?.sent ? 'Resend WhatsApp' : 'WhatsApp PDF'}</span>
            </button>
          )}

          {/* Printable Receipt for Non-Draft Bills */}
          {!isDraft && !isCancelled && (
            <Link
              to={`/bills/${bill._id}/receipt`}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              <Printer className="w-4 h-4 text-gray-500" />
              <span>Official Receipt</span>
            </Link>
          )}

          {/* Draft Actions */}
          {isDraft && (
            <>
              <button
                onClick={handleFinalize}
                disabled={actionLoading}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                Finalize & Lock Bill
              </button>
              <button
                onClick={handleCancel}
                disabled={actionLoading}
                className="inline-flex items-center gap-1.5 px-3 py-2.5 border border-red-200 text-red-600 hover:bg-red-50 rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
              >
                <XCircle className="w-4 h-4" />
                Cancel
              </button>
            </>
          )}

          {/* Primary Payment Button */}
          {canCollectPayment && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsPayModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-teal-600/25 transition-all"
            >
              <CreditCard className="w-4 h-4" />
              <span>Pay Now (₹{bill.balanceDue?.toFixed(2)})</span>
            </motion.button>
          )}
        </div>
      </div>

      {/* Patient Quick Pay & QR Scanner Widget (Patient-Facing Feature) */}
      {canCollectPayment && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden bg-gradient-to-br from-teal-900 via-teal-800 to-gray-900 rounded-3xl text-white p-6 shadow-xl border border-teal-700/50"
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Left QR Code Container */}
            <div className="flex items-center gap-5">
              <div className="p-3 bg-white rounded-2xl shadow-md flex-shrink-0">
                <QRCodeSVG
                  value={mobilePayUrl}
                  size={120}
                  level="M"
                  includeMargin={false}
                />
              </div>

              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-200 text-[10px] font-bold uppercase tracking-wider border border-teal-400/30">
                  <Sparkles className="w-3 h-3 text-teal-300" />
                  Patient Touchless Checkout
                </div>
                <h3 className="text-lg font-bold text-white">Scan to Pay via UPI or Phone</h3>
                <p className="text-xs text-teal-100/80 max-w-md leading-relaxed">
                  Patients can point their phone camera or any UPI app (GPay, PhonePe, Paytm) at this QR code to complete payment instantly on their phone.
                </p>
                <div className="flex items-center gap-2 pt-1 text-[11px] text-teal-300">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                  </span>
                  <span>Live Gateway Sync: Desktop automatically updates on phone completion</span>
                </div>
              </div>
            </div>

            {/* Right Quick Actions */}
            <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 w-full md:w-auto flex-shrink-0">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsPayModalOpen(true)}
                className="px-5 py-3 bg-white text-teal-900 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md hover:bg-teal-50 transition-colors"
              >
                <CreditCard className="w-4 h-4 text-teal-700" />
                Pay on This Screen
              </motion.button>

              <button
                onClick={copyPatientLink}
                className="px-4 py-2.5 bg-white/10 hover:bg-white/15 text-white border border-white/20 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Link Copied!' : 'Copy Patient Pay Link'}</span>
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <motion.div
          whileHover={{ y: -2 }}
          className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs flex items-start gap-4 transition-all"
        >
          <div className="p-3 bg-teal-50 text-teal-700 rounded-xl">
            <User className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Patient Details</p>
            <h4 className="text-base font-bold text-gray-900 mt-0.5">{bill.patient?.name}</h4>
            <p className="text-xs text-gray-500 mt-0.5">
              UHID: <span className="font-semibold text-gray-700">{bill.patient?.patientId || 'Unregistered'}</span>
            </p>
            <p className="text-xs text-gray-500">
              Phone: <span className="font-semibold text-gray-700">{bill.patient?.phone || 'Not provided'}</span>
            </p>
            {bill.whatsappDelivery?.sent && (
              <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-semibold">
                <span>💬 WhatsApp PDF Sent</span>
                <a
                  href={bill.whatsappDelivery.waLink || `https://wa.me/${bill.whatsappDelivery.recipientPhone}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-emerald-700 underline font-bold"
                >
                  View Chat &rarr;
                </a>
              </div>
            )}
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -2 }}
          className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs flex items-start gap-4 transition-all"
        >
          <div className="p-3 bg-blue-50 text-blue-700 rounded-xl">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Service Department</p>
            <h4 className="text-base font-bold text-gray-900 capitalize mt-0.5">
              {bill.source?.module || 'Hospital Service'}
            </h4>
            <p className="text-xs text-gray-500 mt-0.5">
              Ref Number: <span className="font-semibold text-gray-700">{bill.source?.referenceNumber || 'N/A'}</span>
            </p>
            <p className="text-xs text-gray-500">
              Registered By: <span className="font-semibold text-gray-700">{bill.createdBy || 'Staff'}</span>
            </p>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -2 }}
          className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs flex items-start gap-4 transition-all"
        >
          <div className={`p-3 rounded-xl ${bill.balanceDue > 0 ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Balance Status</p>
            <h4 className="text-xl font-black text-gray-900 mt-0.5">
              {bill.balanceDue > 0 ? (
                <span className="text-amber-600">₹{bill.balanceDue?.toFixed(2)} Due</span>
              ) : (
                <span className="text-emerald-600">Fully Settled</span>
              )}
            </h4>
            <p className="text-xs text-gray-500 mt-0.5">
              Paid ₹{bill.amountPaid?.toFixed(2)} of ₹{bill.grandTotal?.toFixed(2)}
            </p>
          </div>
        </motion.div>
      </div>

      {/* Itemized Table */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
              Billed Items &amp; Services
            </h3>
            {bill.source?.module === 'multi-dept' && (
              <span className="px-2 py-0.5 bg-teal-50 border border-teal-200 text-teal-800 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-teal-600" />
                Unified Multi-Department
              </span>
            )}
          </div>

          {/* Department Breakdown Mini Badges */}
          <div className="flex items-center gap-2 text-[11px] font-semibold">
            {bill.items.some((i) => i.category === 'consultation') && (
              <span className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200/80 rounded-lg">
                🩺 Consult: ₹{bill.items.filter((i) => i.category === 'consultation').reduce((s, i) => s + (i.lineTotal || 0), 0).toFixed(2)}
              </span>
            )}
            {bill.items.some((i) => i.category === 'medicine') && (
              <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200/80 rounded-lg">
                💊 Pharmacy: ₹{bill.items.filter((i) => i.category === 'medicine').reduce((s, i) => s + (i.lineTotal || 0), 0).toFixed(2)}
              </span>
            )}
            {bill.items.some((i) => i.category === 'test') && (
              <span className="px-2.5 py-1 bg-purple-50 text-purple-700 border border-purple-200/80 rounded-lg">
                🔬 Lab: ₹{bill.items.filter((i) => i.category === 'test').reduce((s, i) => s + (i.lineTotal || 0), 0).toFixed(2)}
              </span>
            )}
            <span className="text-xs text-gray-400 font-medium ml-1">({bill.items.length} items)</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-600">
            <thead className="bg-gray-50/80 text-[11px] font-bold uppercase text-gray-500 border-b border-gray-100">
              <tr>
                <th className="px-6 py-3 w-10 text-center">#</th>
                <th className="px-6 py-3">Description</th>
                <th className="px-6 py-3">Department Category</th>
                <th className="px-6 py-3 text-center">Qty</th>
                <th className="px-6 py-3 text-right">Unit Price</th>
                <th className="px-6 py-3 text-right">Discount</th>
                <th className="px-6 py-3 text-right">Tax</th>
                <th className="px-6 py-3 text-right font-bold text-gray-800">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {bill.items.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50/60 transition-colors">
                  <td className="px-6 py-3.5 text-center text-gray-400 font-semibold">{index + 1}</td>
                  <td className="px-6 py-3.5 font-bold text-gray-900">{item.description}</td>
                  <td className="px-6 py-3.5">
                    {item.category === 'consultation' ? (
                      <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200/80 rounded-md text-[10px] font-bold uppercase">
                        🩺 Consultation
                      </span>
                    ) : item.category === 'medicine' ? (
                      <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200/80 rounded-md text-[10px] font-bold uppercase">
                        💊 Pharmacy
                      </span>
                    ) : item.category === 'test' ? (
                      <span className="px-2.5 py-0.5 bg-purple-50 text-purple-700 border border-purple-200/80 rounded-md text-[10px] font-bold uppercase">
                        🔬 Lab Test
                      </span>
                    ) : item.category === 'procedure' ? (
                      <span className="px-2.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200/80 rounded-md text-[10px] font-bold uppercase">
                        🏥 Procedure
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 bg-gray-100 text-gray-700 rounded-md text-[10px] font-medium capitalize">
                        {item.category}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-3.5 text-center font-semibold text-gray-800">{item.quantity}</td>
                  <td className="px-6 py-3.5 text-right font-medium">₹{item.unitPrice?.toFixed(2)}</td>
                  <td className="px-6 py-3.5 text-right text-emerald-600 font-medium">
                    {item.discountAmount > 0 ? `-₹${item.discountAmount.toFixed(2)} (${item.discountPercent}%)` : '—'}
                  </td>
                  <td className="px-6 py-3.5 text-right text-gray-600">
                    {item.taxAmount > 0 ? `+₹${item.taxAmount.toFixed(2)} (${item.taxPercent}%)` : '—'}
                  </td>
                  <td className="px-6 py-3.5 text-right font-bold text-gray-900">
                    ₹{item.lineTotal?.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Financial Calculation Summary */}
        <div className="bg-gray-50/60 p-6 border-t border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="text-xs text-gray-500 max-w-sm">
            {bill.notes && (
              <div className="bg-white p-3.5 rounded-xl border border-gray-200">
                <span className="font-bold text-gray-700 block mb-0.5">Notes:</span>
                <p>{bill.notes}</p>
              </div>
            )}
          </div>

          <div className="w-full md:w-80 space-y-2 text-xs">
            <div className="flex justify-between text-gray-600">
              <span>Gross Subtotal:</span>
              <span className="font-semibold text-gray-800">₹{bill.subtotal?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Discounts Applied:</span>
              <span className="font-semibold text-emerald-600">-₹{bill.discountTotal?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>GST / Taxes:</span>
              <span className="font-semibold text-gray-800">+₹{bill.taxTotal?.toFixed(2)}</span>
            </div>
            <div className="pt-2 border-t border-gray-200 flex justify-between items-center text-sm font-bold text-gray-900">
              <span>Grand Total:</span>
              <span className="text-base text-teal-900">₹{bill.grandTotal?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-xs font-semibold text-emerald-700">
              <span>Amount Paid:</span>
              <span>₹{bill.amountPaid?.toFixed(2)}</span>
            </div>
            <div className="pt-1.5 border-t border-gray-200 flex justify-between items-center text-sm font-bold">
              <span>Balance Due:</span>
              <span className={bill.balanceDue > 0 ? 'text-amber-600' : 'text-emerald-600'}>
                ₹{bill.balanceDue?.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Payment History Log */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
            Verified Payments & Transactions
          </h3>
          {canCollectPayment && (
            <button
              onClick={() => setIsPayModalOpen(true)}
              className="text-xs font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1"
            >
              + Collect New Payment
            </button>
          )}
        </div>

        {bill.payments.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-xs">
            No payments recorded yet for this invoice.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-600">
              <thead className="bg-gray-50/80 text-[11px] font-bold uppercase text-gray-500 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-3">Paid Date</th>
                  <th className="px-6 py-3">Channel / Gateway</th>
                  <th className="px-6 py-3">Transaction / Ref ID</th>
                  <th className="px-6 py-3">Verified By</th>
                  <th className="px-6 py-3 text-right font-bold text-gray-800">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {bill.payments.map((p, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/50">
                    <td className="px-6 py-3 text-gray-700">
                      {new Date(p.paidAt).toLocaleString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 bg-gray-100 rounded text-[10px] uppercase font-bold text-gray-800">
                          {p.method}
                        </span>
                        <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 text-[9px] font-bold rounded">
                          VERIFIED
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      <div className="font-mono text-gray-800 text-[11px]">{p.transactionId || p.razorpayPaymentId || 'Direct Payment'}</div>
                      {p.bankRrn && <div className="text-[10px] text-gray-400 font-mono">UTR: {p.bankRrn}</div>}
                      {p.payerVpa && <div className="text-[10px] text-teal-700 font-medium">UPI: {p.payerVpa}</div>}
                    </td>
                    <td className="px-6 py-3 text-gray-600">{p.receivedBy}</td>
                    <td className="px-6 py-3 text-right font-bold text-emerald-600 text-sm">
                      ₹{p.amount?.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Collect Payment Modal */}
      <PaymentModal
        isOpen={isPayModalOpen}
        onClose={() => setIsPayModalOpen(false)}
        bill={bill}
        onPaymentSuccess={handlePaymentSuccess}
      />

      {/* Global Payment Success Celebration Overlay */}
      <PaymentSuccessOverlay
        isVisible={Boolean(celebration)}
        bill={celebration?.bill || bill}
        paymentAmount={celebration?.amount}
        onViewReceipt={() => {
          const targetId = celebration?.bill?._id || bill?._id || id;
          setCelebration(null);
          navigate(`/bills/${targetId}/receipt`);
        }}
        onClose={() => setCelebration(null)}
      />
    </PageTransition>
  );
}

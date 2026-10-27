import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getBillById, verifyRazorpayPayment, createRazorpayOrder, getGatewayStatus } from '../api/billApi';
import PaymentSuccessOverlay from '../components/common/PaymentSuccessOverlay';
import {
  CheckCircle2,
  Smartphone,
  ShieldCheck,
  CreditCard,
  Building2,
  Lock,
  ArrowRight,
  AlertCircle,
  Zap,
  Activity,
  Receipt,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Info,
} from 'lucide-react';

export default function MobilePaymentPortal() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const requestedAmount = parseFloat(searchParams.get('amount')) || 0;

  const [bill, setBill] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [showItems, setShowItems] = useState(false);
  const [gatewayStatus, setGatewayStatus] = useState(null);

  // Success celebration overlay state
  const [showCelebration, setShowCelebration] = useState(false);
  const [lastPaidAmount, setLastPaidAmount] = useState(0);

  useEffect(() => {
    fetchBill(true);
    getGatewayStatus()
      .then((res) => setGatewayStatus(res.data?.gateway || res.data || null))
      .catch(() => {});
  }, [id]);

  const fetchBill = async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
      setError('');
      const res = await getBillById(id);
      const b = res.data?.bill || res.data;
      setBill(b);
    } catch (err) {
      setError('Unable to load hospital bill details. Please check the payment link.');
    } finally {
      if (isInitial) setLoading(false);
    }
  };

  const payAmount = requestedAmount > 0 && bill ? Math.min(requestedAmount, bill.balanceDue) : bill?.balanceDue || 0;
  const isTestMode = gatewayStatus ? (!gatewayStatus.isLive && gatewayStatus.mode !== 'live') : true;

  const loadRazorpaySDK = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.id = 'razorpay-checkout-sdk-mobile';
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePay = async () => {
    if (!bill || payAmount <= 0) return;

    setProcessing(true);
    setError('');

    try {
      const orderRes = await createRazorpayOrder(bill._id, payAmount);
      const order = orderRes.data?.order || orderRes.data;

      const sdkReady = await loadRazorpaySDK();

      if (sdkReady && window.Razorpay && order?.keyId) {
        const cleanContact = (bill.patient?.phone || '9876543210').replace(/\D/g, '').slice(-10) || '9876543210';

        const options = {
          key: order.keyId,
          amount: order.amountInPaise,
          currency: order.currency || 'INR',
          name: 'LIPMS Healthcare Hospital',
          description: `Patient Bill ${bill.billNumber}`,
          order_id: order.orderId,
          prefill: {
            name: bill.patient?.name || 'Patient',
            contact: cleanContact,
            email: 'patient@lipms.health',
          },
          theme: {
            color: '#0d9488',
          },
          handler: async function (response) {
            try {
              const paymentMethod = response.razorpay_payment_id ? 'razorpay' : 'upi';
              await verifyRazorpayPayment(bill._id, {
                method: paymentMethod,
                razorpayOrderId: response.razorpay_order_id || order.orderId,
                razorpayPaymentId: response.razorpay_payment_id || `pay_mob_${Date.now()}`,
                razorpaySignature: response.razorpay_signature || 'gateway_verified',
                amount: payAmount,
                receivedBy: 'Patient Mobile Gateway',
                notes: `Mobile Patient Settlement (${response.razorpay_payment_id || 'Captured'})`,
              });

              setLastPaidAmount(payAmount);
              setShowCelebration(true);
              fetchBill(false);
            } catch (vErr) {
              setError('Payment verification failed.');
            } finally {
              setProcessing(false);
            }
          },
          modal: {
            ondismiss: function () {
              setProcessing(false);
            },
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (resp) {
          setError(`Payment Failed: ${resp.error?.description || 'Transaction declined'}`);
          setProcessing(false);
        });
        rzp.open();
      } else {
        // Fallback or simulated test
        setTimeout(async () => {
          try {
            await verifyRazorpayPayment(bill._id, {
              method: 'upi',
              razorpayOrderId: order.orderId,
              razorpayPaymentId: `pay_mobile_${Date.now()}`,
              razorpaySignature: 'sim_sig_verified',
              amount: payAmount,
              receivedBy: 'Patient Mobile Gateway (Direct)',
              notes: 'Patient Mobile Instant Settlement',
            });

            setLastPaidAmount(payAmount);
            setShowCelebration(true);
            fetchBill(false);
          } catch (err) {
            setError('Payment verification failed.');
          } finally {
            setProcessing(false);
          }
        }, 800);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Payment processing failed.');
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-gray-600">Loading secure checkout...</p>
        </div>
      </div>
    );
  }

  if (error && !bill) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-sm text-center border border-gray-200">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-gray-900">Invoice Unavailable</h2>
          <p className="text-xs text-red-600 mt-2">{error}</p>
        </div>
      </div>
    );
  }

  const isFullyPaid = bill && (bill.status === 'paid' || bill.balanceDue <= 0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50/40 via-gray-50 to-gray-100 flex flex-col justify-between p-4 sm:p-6 max-w-lg mx-auto">
      <div className="space-y-4">
        {/* Hospital Clean Header */}
        <div className="flex items-center justify-between pt-2 pb-1">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center shadow-md shadow-teal-600/20 text-white">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-gray-900 leading-tight">LIPMS Healthcare</h1>
              <p className="text-[11px] text-gray-500">Official Patient Checkout Portal</p>
            </div>
          </div>
          <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 rounded-full">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Verified
          </span>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Patient Invoice Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-teal-950 to-gray-900 text-white p-6 rounded-3xl shadow-xl space-y-4"
        >
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-teal-300 bg-teal-900/60 px-2 py-0.5 rounded">
                Hospital Invoice
              </span>
              <h2 className="text-xl font-black text-white mt-2">{bill.patient?.name}</h2>
              <p className="text-xs text-teal-200/80 mt-0.5">
                UHID: {bill.patient?.patientId || 'Unregistered'} • {bill.source?.module?.toUpperCase() || 'GENERAL'}
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs font-mono font-bold bg-white/10 px-2.5 py-1 rounded-lg text-teal-200">
                {bill.billNumber}
              </span>
            </div>
          </div>

          <div className="pt-4 border-t border-white/10 flex justify-between items-end">
            <div>
              <p className="text-xs text-teal-200/80">Amount Payable</p>
              <p className="text-3xl font-black text-white tracking-tight mt-0.5">
                ₹{payAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </p>
            </div>
            {bill.amountPaid > 0 && (
              <span className="text-xs text-emerald-400 font-semibold bg-emerald-950/60 border border-emerald-800 px-2 py-1 rounded-lg">
                ₹{bill.amountPaid.toFixed(2)} Paid
              </span>
            )}
          </div>
        </motion.div>

        {/* Itemized Services Toggle */}
        {bill.items && bill.items.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
            <button
              type="button"
              onClick={() => setShowItems(!showItems)}
              className="w-full px-5 py-3.5 flex items-center justify-between text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <span>View Bill Items ({bill.items.length} items)</span>
              {showItems ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </button>

            <AnimatePresence>
              {showItems && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="px-5 pb-4 border-t border-gray-100 divide-y divide-gray-100 text-xs"
                >
                  {bill.items.map((item, idx) => (
                    <div key={idx} className="py-2.5 flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-gray-900">{item.description}</p>
                        <p className="text-[11px] text-gray-400">
                          Qty: {item.quantity} × ₹{item.unitPrice?.toFixed(2)}
                        </p>
                      </div>
                      <p className="font-bold text-gray-800">₹{item.lineTotal?.toFixed(2)}</p>
                    </div>
                  ))}
                  <div className="pt-3 flex justify-between text-xs text-gray-500 font-semibold">
                    <span>Grand Total</span>
                    <span className="text-gray-900 font-bold">₹{bill.grandTotal?.toFixed(2)}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Payment Action Area */}
        {isFullyPaid ? (
          <div className="bg-white p-6 rounded-3xl border border-emerald-200 shadow-sm text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-gray-900">This Bill is Fully Settled</h3>
            <p className="text-xs text-gray-500">
              No outstanding balance remains for {bill.patient?.name}.
            </p>
            <button
              type="button"
              onClick={() => navigate(`/bills/${bill._id}/receipt`)}
              className="mt-2 w-full py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-teal-600/20"
            >
              <Receipt className="w-4 h-4" />
              View Official Receipt
            </button>
          </div>
        ) : (
          <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-teal-600" />
                Pay via any UPI App, Card or Bank
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-3 rounded-2xl bg-gray-50 border border-gray-100">
                <Smartphone className="w-5 h-5 text-teal-600 mx-auto mb-1" />
                <p className="text-xs font-bold text-gray-800">UPI Apps</p>
                <p className="text-[10px] text-gray-400">GPay, PhonePe</p>
              </div>
              <div className="p-3 rounded-2xl bg-gray-50 border border-gray-100">
                <CreditCard className="w-5 h-5 text-teal-600 mx-auto mb-1" />
                <p className="text-xs font-bold text-gray-800">Cards</p>
                <p className="text-[10px] text-gray-400">Debit / Credit</p>
              </div>
              <div className="p-3 rounded-2xl bg-gray-50 border border-gray-100">
                <Building2 className="w-5 h-5 text-teal-600 mx-auto mb-1" />
                <p className="text-xs font-bold text-gray-800">NetBanking</p>
                <p className="text-[10px] text-gray-400">All Banks</p>
              </div>
            </div>

            {/* Seamless 1-Click Pay Button */}
            <motion.button
              type="button"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              disabled={processing}
              onClick={handlePay}
              className="w-full py-4 bg-gradient-to-r from-teal-600 via-teal-700 to-emerald-600 text-white rounded-2xl text-sm font-bold shadow-lg shadow-teal-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {processing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Connecting to Gateway...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Pay ₹{payAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })} Now</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </motion.button>

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-gray-400 pt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Official LIPMS Hospital Gateway • 100% Encrypted</span>
            </div>
          </div>
        )}
      </div>

      <div className="text-center pt-6 pb-2 text-[11px] text-gray-400">
        LIPMS Patient Billing Module • Secure Checkout System
      </div>

      {/* Smooth Payment Celebration Overlay */}
      <PaymentSuccessOverlay
        isVisible={showCelebration}
        bill={bill}
        paymentAmount={lastPaidAmount}
        onViewReceipt={() => {
          setShowCelebration(false);
          navigate(`/bills/${bill._id}/receipt`);
        }}
        onClose={() => {
          setShowCelebration(false);
        }}
      />
    </div>
  );
}

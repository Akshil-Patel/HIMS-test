import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Receipt, ArrowRight, Sparkles, Check } from 'lucide-react';

// Pre-generate 60 confetti particles with radial velocity from center
function createConfettiPieces(count = 60) {
  const colors = [
    '#10b981', '#059669', '#34d399', // Emeralds
    '#0d9488', '#14b8a6', '#2dd4bf', // Teals
    '#f59e0b', '#fbbf24',           // Amber/Gold
    '#6366f1', '#818cf8',           // Indigo
    '#ec4899', '#f472b6',           // Pink
    '#3b82f6', '#60a5fa',           // Blue
  ];

  return Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * 360 + (Math.random() * 20 - 10);
    const rad = (angle * Math.PI) / 180;
    const distance = 120 + Math.random() * 320;
    const destX = Math.cos(rad) * distance;
    const destY = Math.sin(rad) * distance + (Math.random() * 150 + 50); // Add gravity down

    return {
      id: i,
      color: colors[i % colors.length],
      size: 6 + Math.random() * 8,
      destX,
      destY,
      rotation: Math.random() * 720 - 360,
      duration: 1.2 + Math.random() * 1.0,
      delay: Math.random() * 0.15,
      shape: i % 3, // 0 = square, 1 = circle, 2 = bar
    };
  });
}

export default function PaymentSuccessOverlay({
  isVisible,
  bill,
  paymentAmount,
  onViewReceipt,
  onClose,
}) {
  const confetti = useMemo(() => createConfettiPieces(60), [isVisible]);

  if (!isVisible) return null;

  const numAmount = typeof paymentAmount === 'number'
    ? paymentAmount
    : parseFloat(paymentAmount) || bill?.grandTotal || 0;

  return (
    <AnimatePresence>
      {isVisible && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-hidden">
          {/* Backdrop with rich blur */}
          <motion.div
            className="fixed inset-0 bg-gray-950/80 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
          />

          {/* Confetti Explosion (emanating from center) */}
          <div className="fixed inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
            {confetti.map((c) => (
              <motion.div
                key={c.id}
                className="absolute"
                style={{
                  width: c.shape === 2 ? c.size * 2 : c.size,
                  height: c.shape === 2 ? c.size * 0.6 : c.size,
                  backgroundColor: c.color,
                  borderRadius: c.shape === 1 ? '50%' : '2px',
                }}
                initial={{
                  x: 0,
                  y: -40,
                  scale: 0,
                  rotate: 0,
                  opacity: 1,
                }}
                animate={{
                  x: c.destX,
                  y: c.destY,
                  scale: [0, 1.2, 1, 0.8],
                  rotate: c.rotation,
                  opacity: [1, 1, 1, 0],
                }}
                transition={{
                  duration: c.duration,
                  delay: c.delay,
                  ease: [0.25, 0.46, 0.45, 0.94],
                }}
              />
            ))}
          </div>

          {/* Central Modal Card */}
          <motion.div
            className="relative z-10 w-full max-w-md bg-white rounded-3xl shadow-2xl p-7 text-center overflow-hidden border border-emerald-100"
            initial={{ scale: 0.85, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 350, damping: 25 }}
          >
            {/* Top decorative gradient glow */}
            <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 bg-gradient-to-br from-emerald-400/30 to-teal-400/20 rounded-full blur-2xl pointer-events-none" />

            {/* Pulsing Animated Checkmark Container */}
            <div className="relative w-24 h-24 mx-auto mb-5 flex items-center justify-center">
              {/* Outer pulsing ring 1 */}
              <motion.div
                className="absolute inset-0 rounded-full bg-emerald-400"
                initial={{ scale: 0.8, opacity: 0.6 }}
                animate={{ scale: [0.8, 1.5, 1.8], opacity: [0.6, 0.25, 0] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
              />

              {/* Outer pulsing ring 2 */}
              <motion.div
                className="absolute inset-0 rounded-full bg-teal-400"
                initial={{ scale: 0.8, opacity: 0.5 }}
                animate={{ scale: [0.8, 1.3, 1.6], opacity: [0.5, 0.2, 0] }}
                transition={{ duration: 1.8, delay: 0.3, repeat: Infinity, ease: 'easeOut' }}
              />

              {/* Core Badge */}
              <motion.div
                className="relative z-10 w-20 h-20 rounded-full bg-gradient-to-tr from-emerald-600 via-teal-600 to-emerald-500 flex items-center justify-center shadow-xl shadow-emerald-500/30"
                initial={{ scale: 0, rotate: -90 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 18, delay: 0.1 }}
              >
                {/* Real SVG Animated Stroke Checkmark */}
                <motion.svg
                  className="w-10 h-10 text-white"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <motion.path
                    d="M20 6L9 17L4 12"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ delay: 0.25, duration: 0.45, ease: 'easeOut' }}
                  />
                </motion.svg>
              </motion.div>
            </div>

            {/* Success Headlines */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.35 }}
            >
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold mb-2">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                Payment Confirmed
              </div>
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                Payment Successful!
              </h2>
              <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">
                Electronic settlement verified by LIPMS Hospital Accounts.
              </p>
            </motion.div>

            {/* Payment Summary Box */}
            <motion.div
              className="my-5 p-4 bg-gradient-to-br from-gray-50 to-teal-50/40 rounded-2xl border border-gray-200/80 text-left space-y-2.5"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.35 }}
            >
              <div className="flex justify-between items-baseline border-b border-gray-200/60 pb-2.5">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Amount Settled</span>
                <span className="text-2xl font-black text-emerald-600">
                  ₹{numAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>

              {bill && (
                <div className="space-y-1 pt-0.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Invoice Number:</span>
                    <span className="font-mono font-bold text-gray-800">{bill.billNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Patient Name:</span>
                    <span className="font-bold text-gray-800">{bill.patient?.name}</span>
                  </div>
                  {bill.patient?.patientId && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">UHID:</span>
                      <span className="font-medium text-gray-700">{bill.patient.patientId}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-400">Payment Status:</span>
                    <span className="font-bold text-emerald-700 flex items-center gap-1">
                      <Check className="w-3 h-3 text-emerald-600" />
                      Paid & Verified
                    </span>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              className="flex flex-col sm:flex-row gap-2.5 pt-1"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.35 }}
            >
              {onViewReceipt && (
                <button
                  type="button"
                  onClick={onViewReceipt}
                  className="flex-1 py-3 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-teal-600/20 transition-all"
                >
                  <Receipt className="w-4 h-4" />
                  <span>View Official Receipt</span>
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 px-4 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

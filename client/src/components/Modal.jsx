import React from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0, transition: { duration: 0.2, ease: 'easeIn' } },
};

const modalVariants = {
  hidden: {
    opacity: 0,
    scale: 0.92,
    y: 24,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 380,
      damping: 28,
      mass: 0.8,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.94,
    y: 16,
    transition: { duration: 0.18, ease: 'easeIn' },
  },
};

export default function Modal({ isOpen, onClose, title, children, maxWidth = 'max-w-md' }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
          />

          {/* Modal panel */}
          <motion.div
            className={`relative bg-white rounded-2xl shadow-2xl ${maxWidth} w-full max-h-[90vh] overflow-y-auto`}
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* Header */}
            <div className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
              <h2 className="text-lg font-bold text-gray-900">{title}</h2>
              <motion.button
                onClick={onClose}
                className="p-1.5 rounded-xl hover:bg-gray-100 transition-colors"
                whileHover={{ rotate: 90 }}
                whileTap={{ scale: 0.85 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                <X className="w-5 h-5 text-gray-500" />
              </motion.button>
            </div>

            {/* Body */}
            <motion.div
              className="px-6 py-5"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.25, ease: 'easeOut' }}
            >
              {children}
            </motion.div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

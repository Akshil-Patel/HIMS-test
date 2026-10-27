import React from 'react';
import { motion } from 'framer-motion';
import { FileEdit, Send, Clock, CheckCircle2, XCircle, RotateCcw } from 'lucide-react';

const BADGE_STYLES = {
  draft: 'bg-gray-100 text-gray-700 border-gray-200',
  finalized: 'bg-blue-50 text-blue-700 border-blue-200',
  partially_paid: 'bg-amber-50 text-amber-700 border-amber-200',
  paid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  cancelled: 'bg-red-50 text-red-700 border-red-200',
  refunded: 'bg-purple-50 text-purple-700 border-purple-200',
};

const LABELS = {
  draft: 'Draft',
  finalized: 'Finalized',
  partially_paid: 'Partially Paid',
  paid: 'Paid',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
};

const STATUS_ICONS = {
  draft: FileEdit,
  finalized: Send,
  partially_paid: Clock,
  paid: CheckCircle2,
  cancelled: XCircle,
  refunded: RotateCcw,
};

export default function StatusBadge({ status }) {
  const style = BADGE_STYLES[status] || BADGE_STYLES.draft;
  const label = LABELS[status] || status;
  const Icon = STATUS_ICONS[status] || FileEdit;
  const isPaid = status === 'paid';

  return (
    <motion.span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${style}`}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
    >
      {isPaid ? (
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-60" />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
        </span>
      ) : (
        <Icon className="w-3 h-3 opacity-70" />
      )}
      {label}
    </motion.span>
  );
}

import React from 'react';
import { motion } from 'framer-motion';

/** Animated number that counts up from 0 to `value` */
export function AnimatedCounter({ value, prefix = '', suffix = '', duration = 1, decimals = 0, className = '' }) {
  const [display, setDisplay] = React.useState(0);

  React.useEffect(() => {
    const target = typeof value === 'number' ? value : parseFloat(value) || 0;
    if (target === 0) { setDisplay(0); return; }

    const startTime = Date.now();
    const durationMs = duration * 1000;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / durationMs, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(target * eased);
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [value, duration]);

  const formatted = display.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return <span className={className}>{prefix}{formatted}{suffix}</span>;
}

/** Skeleton loading placeholder */
export function Skeleton({ className = '', rounded = 'rounded-lg' }) {
  return (
    <div className={`animate-shimmer ${rounded} ${className}`} />
  );
}

/** Skeleton for a stats card */
export function StatCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6">
      <Skeleton className="h-4 w-24 mb-3" />
      <Skeleton className="h-8 w-32 mb-2" />
      <Skeleton className="h-3 w-20" />
    </div>
  );
}

/** Skeleton for a table row */
export function TableRowSkeleton({ cols = 5 }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton className="h-4 w-full" />
        </td>
      ))}
    </tr>
  );
}

/** Page transition wrapper */
export function PageTransition({ children, className = '' }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}

/** Staggered list container */
export function StaggerContainer({ children, className = '', staggerDelay = 0.05 }) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: staggerDelay } },
      }}
    >
      {children}
    </motion.div>
  );
}

/** Staggered item (use inside StaggerContainer) */
export function StaggerItem({ children, className = '' }) {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: 16 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
      }}
    >
      {children}
    </motion.div>
  );
}

/** Empty state placeholder */
export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <motion.div
      className="flex flex-col items-center justify-center py-16 text-center"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
    >
      {Icon && (
        <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
          <Icon className="w-8 h-8 text-gray-400" />
        </div>
      )}
      <h3 className="text-lg font-semibold text-gray-700 mb-1">{title}</h3>
      {description && <p className="text-gray-500 text-sm mb-4 max-w-sm">{description}</p>}
      {action}
    </motion.div>
  );
}

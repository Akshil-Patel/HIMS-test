import React from 'react';
import { NavLink } from 'react-router-dom';
import { Activity, LayoutDashboard, FileText, PlusCircle, Stethoscope, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';

const NAV_ITEMS = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/bills', icon: FileText, label: 'All Bills' },
  { to: '/bills/new', icon: PlusCircle, label: 'Create Bill' },
];

const sidebarVariants = {
  hidden: { x: -20, opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: {
      duration: 0.4,
      ease: 'easeOut',
      staggerChildren: 0.07,
      delayChildren: 0.15,
    },
  },
};

const navItemVariants = {
  hidden: { x: -12, opacity: 0 },
  visible: { x: 0, opacity: 1, transition: { duration: 0.3, ease: 'easeOut' } },
};

export default function Sidebar() {
  return (
    <motion.aside
      className="w-64 bg-white border-r border-gray-200/80 flex flex-col no-print"
      variants={sidebarVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Logo Section */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <motion.div
            className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center shadow-lg shadow-teal-600/25"
            whileHover={{ scale: 1.08, rotate: -3 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
          >
            <Activity className="w-5 h-5 text-white" />
          </motion.div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-gray-900">LIPMS</h1>
            <p className="text-xs text-gray-500 font-medium">Billing Module</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <motion.div key={to} variants={navItemVariants}>
            <NavLink
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `group relative flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-teal-50 text-teal-700 shadow-sm shadow-teal-100'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {/* Active accent bar */}
                  {isActive && (
                    <motion.div
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-teal-500 rounded-full"
                      layoutId="activeNavIndicator"
                      transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                    />
                  )}
                  <motion.span
                    className="flex items-center gap-3"
                    whileHover={{ x: 3 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  >
                    <Icon className={`w-5 h-5 transition-colors duration-200 ${isActive ? 'text-teal-600' : 'text-gray-400 group-hover:text-gray-600'}`} />
                    {label}
                  </motion.span>
                </>
              )}
            </NavLink>
          </motion.div>
        ))}

        {/* Doctor Module Direct Link */}
        <div className="pt-4 mt-4 border-t border-gray-100">
          <p className="px-3 mb-2 text-[10px] font-bold tracking-wider text-gray-400 uppercase">
            Clinical Integration
          </p>
          <a
            href={import.meta.env.VITE_DOCTOR_PORTAL_URL || "http://localhost:3001"}
            target="_blank"
            rel="noreferrer"
            className="group flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-semibold text-gray-600 hover:bg-blue-50 hover:text-blue-700 transition-all"
          >
            <span className="flex items-center gap-2.5">
              <Stethoscope className="w-4 h-4 text-blue-600" />
              Doctor Portal (OPD)
            </span>
            <ExternalLink className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100" />
          </a>
        </div>
      </nav>

      {/* Footer */}
      <motion.div
        className="p-4 border-t border-gray-100"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.4 }}
      >
        <div className="flex items-center gap-2 px-3 py-2 text-xs text-gray-500">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span>Billing Counter #1</span>
        </div>
        <p className="px-3 text-xs text-gray-400">Operator: Cashier Staff</p>
      </motion.div>
    </motion.aside>
  );
}

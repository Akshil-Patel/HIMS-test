import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ShieldCheck, User, ChevronRight, LayoutDashboard, FileText, PlusCircle, Receipt } from 'lucide-react';
import { motion } from 'framer-motion';

const BREADCRUMB_MAP = {
  '/': { label: 'Dashboard', icon: LayoutDashboard },
  '/bills': { label: 'All Bills', icon: FileText },
  '/bills/new': { label: 'Create Bill', icon: PlusCircle },
};

function getBreadcrumbs(pathname) {
  const crumbs = [{ path: '/', label: 'Dashboard', icon: LayoutDashboard }];

  if (pathname === '/') return crumbs;

  if (pathname === '/bills') {
    crumbs.push({ path: '/bills', label: 'All Bills', icon: FileText });
    return crumbs;
  }

  if (pathname === '/bills/new') {
    crumbs.push({ path: '/bills', label: 'All Bills', icon: FileText });
    crumbs.push({ path: '/bills/new', label: 'Create Bill', icon: PlusCircle });
    return crumbs;
  }

  // /bills/:id or /bills/:id/receipt
  const parts = pathname.split('/').filter(Boolean);
  if (parts[0] === 'bills' && parts[1]) {
    crumbs.push({ path: '/bills', label: 'All Bills', icon: FileText });
    if (parts[2] === 'receipt') {
      crumbs.push({ path: `/bills/${parts[1]}`, label: `Bill #${parts[1].slice(0, 8)}…`, icon: FileText });
      crumbs.push({ path: pathname, label: 'Receipt', icon: Receipt });
    } else {
      crumbs.push({ path: pathname, label: `Bill #${parts[1].slice(0, 8)}…`, icon: FileText });
    }
  }

  return crumbs;
}

export default function Header() {
  const location = useLocation();
  const breadcrumbs = getBreadcrumbs(location.pathname);

  return (
    <motion.header
      className="h-16 bg-white/80 backdrop-blur-md shadow-sm shadow-gray-200/50 flex items-center justify-between px-6 lg:px-8 no-print relative z-10"
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1.5 text-sm">
        {breadcrumbs.map((crumb, idx) => {
          const isLast = idx === breadcrumbs.length - 1;
          const Icon = crumb.icon;
          return (
            <React.Fragment key={crumb.path}>
              {idx > 0 && (
                <ChevronRight className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
              )}
              {isLast ? (
                <motion.span
                  className="flex items-center gap-1.5 font-semibold text-gray-800"
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.25, delay: idx * 0.05 }}
                  key={crumb.path + location.pathname}
                >
                  <Icon className="w-4 h-4 text-teal-600" />
                  {crumb.label}
                </motion.span>
              ) : (
                <Link
                  to={crumb.path}
                  className="flex items-center gap-1.5 text-gray-400 hover:text-teal-600 transition-colors duration-200"
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{crumb.label}</span>
                </Link>
              )}
            </React.Fragment>
          );
        })}
      </nav>

      {/* Right side */}
      <div className="flex items-center gap-4">
        <motion.div
          className="flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200/80"
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, type: 'spring', stiffness: 300, damping: 20 }}
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <ShieldCheck className="w-3.5 h-3.5" />
          <span className="font-medium">Server Connected</span>
        </motion.div>

        <motion.div
          className="flex items-center gap-2.5"
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.3 }}
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center shadow-md shadow-teal-600/20">
            <span className="text-xs font-bold text-white">CS</span>
          </div>
          <span className="text-sm text-gray-600 hidden sm:inline font-medium">Cashier Counter</span>
        </motion.div>
      </div>
    </motion.header>
  );
}

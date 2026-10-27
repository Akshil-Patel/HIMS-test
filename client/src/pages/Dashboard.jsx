import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getStats, getBills } from '../api/billApi';
import StatusBadge from '../components/StatusBadge';
import { PageTransition, AnimatedCounter, StatCardSkeleton } from '../components/common/Animations';
import {
  DollarSign,
  TrendingUp,
  Receipt,
  FileCheck2,
  Clock,
  ArrowRight,
  PlusCircle,
  AlertTriangle,
  Activity,
  CreditCard,
  Sparkles,
} from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [recentBills, setRecentBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, billsRes] = await Promise.all([
        getStats(),
        getBills({ limit: 5, page: 1 }),
      ]);
      setStats(statsRes.data);
      setRecentBills(billsRes.bills || []);
    } catch (err) {
      setError('Failed to load dashboard metrics. Check server connectivity.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-32 bg-gray-200 animate-shimmer rounded-3xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>
      </div>
    );
  }

  const todayRevenue = stats?.today?.revenue || 0;
  const todayCount = stats?.today?.count || 0;
  const overallRevenue = stats?.overall?.totalRevenue || 0;
  const totalBills = stats?.overall?.totalBills || 0;
  const paidCount = stats?.byStatus?.paid?.count || 0;
  const finalizedCount = stats?.byStatus?.finalized?.count || 0;
  const partialCount = stats?.byStatus?.partially_paid?.count || 0;
  const draftCount = stats?.byStatus?.draft?.count || 0;

  return (
    <PageTransition className="space-y-6 pb-12">
      {/* Top Banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-teal-800 via-teal-900 to-gray-900 text-white p-7 rounded-3xl shadow-lg border border-teal-700/30"
      >
        <div className="space-y-1 relative z-10">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-200 text-[10px] font-bold uppercase tracking-wider border border-teal-400/30">
              Hospital Operations
            </span>
            <span className="text-xs text-teal-300 font-medium flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-teal-300" />
              Live Billing Desk
            </span>
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white">Billing & Payment Hub</h2>
          <p className="text-teal-100/80 text-xs max-w-xl">
            Real-time financial tracking, patient checkout links, automated UPI settlements, and tax invoice ledger.
          </p>
        </div>

        <Link
          to="/bills/new"
          className="relative z-10 inline-flex items-center gap-2 px-5 py-3 bg-white text-teal-900 rounded-2xl font-bold text-xs shadow-md hover:bg-teal-50 transition-all flex-shrink-0"
        >
          <PlusCircle className="w-4 h-4 text-teal-600" />
          Create New Bill
        </Link>
      </motion.div>

      {error && (
        <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-2xl flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <motion.div
          whileHover={{ y: -3 }}
          className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-xs transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Today's Collections</span>
            <div className="p-2.5 bg-teal-50 text-teal-600 rounded-xl">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-gray-900">
              <AnimatedCounter value={todayRevenue} prefix="₹" decimals={2} />
            </h3>
            <p className="text-xs text-gray-400 mt-1">{todayCount} bills settled today</p>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -3 }}
          className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-xs transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total Revenue Collected</span>
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-gray-900">
              <AnimatedCounter value={overallRevenue} prefix="₹" decimals={2} />
            </h3>
            <p className="text-xs text-gray-400 mt-1">Across {totalBills} recorded invoices</p>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -3 }}
          className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-xs transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Settled & Paid Invoices</span>
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
              <FileCheck2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-gray-900">
              <AnimatedCounter value={paidCount} />
            </h3>
            <p className="text-xs text-emerald-600 font-semibold mt-1">Zero balance remaining</p>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -3 }}
          className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-xs transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Pending Dues & Drafts</span>
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-gray-900">
              <AnimatedCounter value={finalizedCount + partialCount} />
            </h3>
            <p className="text-xs text-amber-600 font-semibold mt-1">
              {draftCount} in draft, {partialCount} partial
            </p>
          </div>
        </motion.div>
      </div>

      {/* Recent Bills Section */}
      <div className="bg-white rounded-3xl border border-gray-200/80 shadow-xs overflow-hidden">
        <div className="px-7 py-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Recent Invoices</h3>
            <p className="text-xs text-gray-400">Latest transactions registered across hospital counters</p>
          </div>
          <Link
            to="/bills"
            className="text-xs font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1 transition-colors"
          >
            <span>View All Bills</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentBills.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <Receipt className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm font-semibold">No bills generated yet.</p>
            <Link
              to="/bills/new"
              className="mt-3 inline-block text-xs font-bold text-teal-600 hover:underline"
            >
              Generate first bill &rarr;
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-600">
              <thead className="bg-gray-50/80 text-[11px] font-bold uppercase text-gray-500 border-b border-gray-100">
                <tr>
                  <th className="px-7 py-3.5">Bill Number</th>
                  <th className="px-7 py-3.5">Patient Details</th>
                  <th className="px-7 py-3.5">Module</th>
                  <th className="px-7 py-3.5">Status</th>
                  <th className="px-7 py-3.5 text-right">Grand Total</th>
                  <th className="px-7 py-3.5 text-right">Balance Due</th>
                  <th className="px-7 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentBills.map((b) => (
                  <tr key={b._id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="px-7 py-4 font-mono font-bold text-gray-900">
                      <Link to={`/bills/${b._id}`} className="hover:text-teal-600">
                        {b.billNumber}
                      </Link>
                    </td>
                    <td className="px-7 py-4">
                      <div className="font-bold text-gray-900">{b.patient?.name}</div>
                      <div className="text-[11px] text-gray-400">{b.patient?.phone || 'No phone'}</div>
                    </td>
                    <td className="px-7 py-4">
                      <span className="capitalize px-2.5 py-1 bg-gray-100 rounded-md text-[11px] font-medium text-gray-700">
                        {b.source?.module || 'other'}
                      </span>
                    </td>
                    <td className="px-7 py-4">
                      <StatusBadge status={b.status} />
                    </td>
                    <td className="px-7 py-4 text-right font-bold text-gray-900">
                      ₹{b.grandTotal?.toFixed(2)}
                    </td>
                    <td className="px-7 py-4 text-right">
                      {b.balanceDue > 0 ? (
                        <span className="font-bold text-amber-600">₹{b.balanceDue?.toFixed(2)}</span>
                      ) : (
                        <span className="text-[11px] font-bold text-emerald-600">Settled</span>
                      )}
                    </td>
                    <td className="px-7 py-4 text-right">
                      <Link
                        to={`/bills/${b._id}`}
                        className="inline-flex items-center gap-1 text-xs font-bold text-teal-600 hover:text-teal-800"
                      >
                        <span>Details</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </PageTransition>
  );
}

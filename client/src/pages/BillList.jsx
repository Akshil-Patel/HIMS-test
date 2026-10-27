import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getBills } from '../api/billApi';
import StatusBadge from '../components/StatusBadge';
import { PageTransition } from '../components/common/Animations';
import {
  Search,
  Filter,
  PlusCircle,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileSpreadsheet,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';

const STATUS_TABS = [
  { id: '', label: 'All Invoices' },
  { id: 'draft', label: 'Draft' },
  { id: 'finalized', label: 'Finalized' },
  { id: 'partially_paid', label: 'Partially Paid' },
  { id: 'paid', label: 'Settled & Paid' },
  { id: 'cancelled', label: 'Cancelled' },
];

export default function BillList() {
  const [bills, setBills] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters State
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [module, setModule] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchBills();
  }, [status, module, page]);

  const fetchBills = async () => {
    try {
      setLoading(true);
      setError('');
      const params = {
        page,
        limit: 10,
        status: status || undefined,
        module: module || undefined,
        search: search.trim() || undefined,
        from: from || undefined,
        to: to || undefined,
      };

      const res = await getBills(params);
      setBills(res.bills || []);
      setTotal(res.total || 0);
      setTotalPages(res.totalPages || 1);
    } catch (err) {
      setError('Failed to fetch bills. Check server connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchBills();
  };

  const resetFilters = () => {
    setSearch('');
    setStatus('');
    setModule('');
    setFrom('');
    setTo('');
    setPage(1);
  };

  return (
    <PageTransition className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-3xl border border-gray-200/80 shadow-xs">
        <div>
          <h1 className="text-xl font-black text-gray-900 tracking-tight">Billing & Invoices Directory</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Monitor patient billing status, search records, and process settlements ({total} records total)
          </p>
        </div>
        <Link
          to="/bills/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-md shadow-teal-600/20 transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          Create New Bill
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {STATUS_TABS.map((tab) => {
          const isActive = status === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setStatus(tab.id);
                setPage(1);
              }}
              className={`px-4 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'bg-white text-gray-600 border border-gray-200/80 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Search & Custom Filter Bar */}
      <div className="bg-white p-5 rounded-3xl border border-gray-200/80 shadow-xs space-y-4">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Bill Number (e.g. BILL-2026-00001) or Patient Name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-50/60 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <select
              value={module}
              onChange={(e) => {
                setModule(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 bg-gray-50/60 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">All Departments</option>
              <option value="multi-dept">Multi-Department (Unified)</option>
              <option value="consultation">Consultation (OPD)</option>
              <option value="pharmacy">Pharmacy</option>
              <option value="laboratory">Laboratory</option>
              <option value="radiology">Radiology</option>
              <option value="other">Other Service</option>
            </select>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-xl text-xs font-bold hover:bg-gray-800 transition-colors"
            >
              Search
            </button>
            <button
              type="button"
              onClick={resetFilters}
              className="px-3 py-2 border border-gray-200 text-gray-600 rounded-xl text-xs font-semibold hover:bg-gray-50 transition-colors"
            >
              Reset
            </button>
          </div>
        </form>

        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
          <span className="flex items-center gap-1 font-bold text-gray-600 text-[11px] uppercase tracking-wider">
            <Calendar className="w-3.5 h-3.5 text-teal-600" /> Filter by Date:
          </span>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="px-3 py-1.5 border border-gray-200 rounded-xl text-xs bg-gray-50/50"
            />
            <span className="text-gray-400">to</span>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="px-3 py-1.5 border border-gray-200 rounded-xl text-xs bg-gray-50/50"
            />
            <button
              type="button"
              onClick={() => {
                setPage(1);
                fetchBills();
              }}
              className="px-3 py-1.5 bg-teal-50 text-teal-700 font-bold rounded-xl text-xs hover:bg-teal-100 transition-colors"
            >
              Apply Date
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-2xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Bills Table */}
      <div className="bg-white rounded-3xl border border-gray-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-gray-400">
            <div className="w-8 h-8 border-3 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs font-semibold">Updating billing registry...</p>
          </div>
        ) : bills.length === 0 ? (
          <div className="p-16 text-center text-gray-400">
            <FileSpreadsheet className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="text-base font-bold text-gray-800">No matching records</p>
            <p className="text-xs text-gray-400 mt-1">Try relaxing filters or search terms.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-600">
              <thead className="bg-gray-50/80 text-[11px] font-bold uppercase text-gray-500 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-3.5">Bill Number</th>
                  <th className="px-6 py-3.5">Patient Details</th>
                  <th className="px-6 py-3.5">Department</th>
                  <th className="px-6 py-3.5">Date</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right font-bold text-gray-800">Grand Total</th>
                  <th className="px-6 py-3.5 text-right font-bold text-gray-800">Paid</th>
                  <th className="px-6 py-3.5 text-right font-bold text-gray-800">Balance Due</th>
                  <th className="px-6 py-3.5 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {bills.map((b) => (
                  <tr key={b._id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-gray-900">
                      <Link to={`/bills/${b._id}`} className="hover:text-teal-600">
                        {b.billNumber}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900">{b.patient?.name}</div>
                      <div className="text-[11px] text-gray-400">
                        {b.patient?.patientId ? `UHID: ${b.patient.patientId}` : b.patient?.phone || 'No Contact'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {b.source?.module === 'multi-dept' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-teal-50 border border-teal-200 text-teal-800 rounded-md text-[11px] font-bold">
                          Multi-Dept
                        </span>
                      ) : (
                        <span className="capitalize px-2.5 py-1 bg-gray-100 rounded-md text-[11px] font-medium text-gray-700">
                          {b.source?.module || 'other'}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {new Date(b.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={b.status} />
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-gray-900">
                      ₹{b.grandTotal?.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-right text-emerald-600 font-semibold">
                      ₹{b.amountPaid?.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {b.balanceDue > 0 ? (
                        <span className="font-bold text-amber-600">₹{b.balanceDue?.toFixed(2)}</span>
                      ) : (
                        <span className="text-[11px] font-bold text-emerald-600">Settled</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Link
                        to={`/bills/${b._id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-teal-50 hover:text-teal-700 text-gray-700 font-bold text-xs transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <div>
            Showing Page <span className="font-bold text-gray-800">{page}</span> of{' '}
            <span className="font-bold text-gray-800">{totalPages}</span> ({total} bills)
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}

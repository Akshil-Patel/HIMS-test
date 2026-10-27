import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { createBill, finalizeBill } from '../api/billApi';
import { useToast } from '../components/common/Toast';
import { PageTransition } from '../components/common/Animations';
import { Plus, Trash2, ArrowLeft, Save, CheckCircle2, AlertCircle, FileText } from 'lucide-react';

const CATEGORIES = [
  { value: 'medicine', label: 'Medicine / Pharmacy' },
  { value: 'test', label: 'Lab Test' },
  { value: 'consultation', label: 'Doctor Consultation' },
  { value: 'procedure', label: 'Clinical Procedure' },
  { value: 'other', label: 'Other Service' },
];

const MODULE_OPTIONS = [
  { value: 'pharmacy', label: 'Pharmacy' },
  { value: 'laboratory', label: 'Laboratory' },
  { value: 'consultation', label: 'OPD / Consultation' },
  { value: 'radiology', label: 'Radiology / Imaging' },
  { value: 'other', label: 'General / Other' },
];

export default function CreateBill() {
  const navigate = useNavigate();
  const toast = useToast();

  // Patient Info State
  const [patient, setPatient] = useState({
    name: '',
    patientId: '',
    phone: '',
  });

  // Source Info State
  const [source, setSource] = useState({
    module: 'pharmacy',
    referenceNumber: '',
  });

  // Line items state
  const [items, setItems] = useState([
    {
      description: '',
      category: 'medicine',
      quantity: 1,
      unitPrice: 0,
      discountPercent: 0,
      taxPercent: 0,
    },
  ]);

  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Handle row addition
  const addItem = () => {
    setItems([
      ...items,
      {
        description: '',
        category: 'medicine',
        quantity: 1,
        unitPrice: 0,
        discountPercent: 0,
        taxPercent: 0,
      },
    ]);
  };

  // Handle row removal
  const removeItem = (index) => {
    if (items.length === 1) return;
    setItems(items.filter((_, idx) => idx !== index));
  };

  // Update line item
  const updateItem = (index, field, value) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  // Real-time calculations
  const calculateRow = (item) => {
    const qty = parseFloat(item.quantity) || 0;
    const price = parseFloat(item.unitPrice) || 0;
    const discPct = parseFloat(item.discountPercent) || 0;
    const taxPct = parseFloat(item.taxPercent) || 0;

    const base = qty * price;
    const discAmount = (base * discPct) / 100;
    const afterDisc = base - discAmount;
    const taxAmount = (afterDisc * taxPct) / 100;
    const total = afterDisc + taxAmount;

    return {
      base,
      discAmount,
      taxAmount,
      total,
    };
  };

  const summary = items.reduce(
    (acc, item) => {
      const row = calculateRow(item);
      acc.subtotal += row.base;
      acc.discountTotal += row.discAmount;
      acc.taxTotal += row.taxAmount;
      acc.grandTotal += row.total;
      return acc;
    },
    { subtotal: 0, discountTotal: 0, taxTotal: 0, grandTotal: 0 }
  );

  const handleSubmit = async (finalizeImmediately = false) => {
    setError('');

    if (!patient.name.trim()) {
      const msg = 'Patient Full Name is required.';
      setError(msg);
      toast.warning(msg);
      return;
    }

    if (items.length === 0 || !items.some((it) => it.description.trim())) {
      const msg = 'At least one item with a description is required.';
      setError(msg);
      toast.warning(msg);
      return;
    }

    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (!it.description.trim()) {
        const msg = `Item #${i + 1} has no description.`;
        setError(msg);
        toast.warning(msg);
        return;
      }
      if (parseFloat(it.quantity) <= 0) {
        const msg = `Item #${i + 1} quantity must be greater than zero.`;
        setError(msg);
        toast.warning(msg);
        return;
      }
      if (parseFloat(it.unitPrice) < 0) {
        const msg = `Item #${i + 1} unit price cannot be negative.`;
        setError(msg);
        toast.warning(msg);
        return;
      }
    }

    setLoading(true);
    try {
      const payload = {
        patient,
        source,
        notes,
        items: items.map((it) => ({
          description: it.description,
          category: it.category,
          quantity: parseFloat(it.quantity) || 1,
          unitPrice: parseFloat(it.unitPrice) || 0,
          discountPercent: parseFloat(it.discountPercent) || 0,
          taxPercent: parseFloat(it.taxPercent) || 0,
        })),
      };

      const res = await createBill(payload);
      const createdId = res.data?._id || res.data?.bill?._id;

      if (finalizeImmediately) {
        await finalizeBill(createdId);
        toast.success('Bill created and finalized! Ready for payment.', 'Bill Ready');
      } else {
        toast.success('Bill saved as draft.', 'Draft Created');
      }

      navigate(`/bills/${createdId}`);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to create bill';
      setError(msg);
      toast.error(msg, 'Creation Failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTransition className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-3xl border border-gray-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/bills')}
            className="p-2.5 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl font-black text-gray-900 tracking-tight">Generate New Bill</h1>
            <p className="text-xs text-gray-400">Record patient charges, itemize medicines/tests, and generate invoice</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            disabled={loading}
            onClick={() => handleSubmit(false)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 bg-white hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4 text-gray-500" />
            Save as Draft
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => handleSubmit(true)}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-md shadow-teal-600/20 transition-all disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4" />
            Save & Finalize Bill
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-2xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Patient & Source Info Card */}
      <div className="bg-white rounded-3xl border border-gray-200/80 shadow-xs p-6">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4">
          Patient & Department Context
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
              Patient Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Rahul Sharma"
              value={patient.name}
              onChange={(e) => setPatient({ ...patient, name: e.target.value })}
              className="w-full px-3.5 py-2 bg-gray-50/50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
              UHID / Patient ID
            </label>
            <input
              type="text"
              placeholder="e.g. UHID-2026-0042"
              value={patient.patientId}
              onChange={(e) => setPatient({ ...patient, patientId: e.target.value })}
              className="w-full px-3.5 py-2 bg-gray-50/50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
              Phone Number
            </label>
            <input
              type="text"
              placeholder="e.g. 9876543210"
              value={patient.phone}
              onChange={(e) => setPatient({ ...patient, phone: e.target.value })}
              className="w-full px-3.5 py-2 bg-gray-50/50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
              Source Department
            </label>
            <select
              value={source.module}
              onChange={(e) => setSource({ ...source, module: e.target.value })}
              className="w-full px-3.5 py-2 bg-gray-50/50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              {MODULE_OPTIONS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
              Prescription / Reference No.
            </label>
            <input
              type="text"
              placeholder="e.g. RX-9941 / LAB-302"
              value={source.referenceNumber}
              onChange={(e) => setSource({ ...source, referenceNumber: e.target.value })}
              className="w-full px-3.5 py-2 bg-gray-50/50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
              Clinical Notes
            </label>
            <input
              type="text"
              placeholder="Optional billing remarks"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 bg-gray-50/50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>
      </div>

      {/* Line Items Table */}
      <div className="bg-white rounded-3xl border border-gray-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-800">
            Billable Items & Services
          </h3>
          <button
            type="button"
            onClick={addItem}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-teal-50 text-teal-700 text-xs font-bold rounded-xl hover:bg-teal-100 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Item
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-600">
            <thead className="bg-gray-50/80 text-[11px] font-bold uppercase text-gray-500 border-b border-gray-100">
              <tr>
                <th className="px-4 py-3 w-10 text-center">#</th>
                <th className="px-4 py-3 min-w-[220px]">Item Description</th>
                <th className="px-4 py-3 w-44">Category</th>
                <th className="px-4 py-3 w-24 text-center">Qty</th>
                <th className="px-4 py-3 w-28 text-right">Unit Price (₹)</th>
                <th className="px-4 py-3 w-24 text-center">Disc (%)</th>
                <th className="px-4 py-3 w-24 text-center">Tax (%)</th>
                <th className="px-4 py-3 w-32 text-right font-bold text-gray-800">Net Total (₹)</th>
                <th className="px-4 py-3 w-12 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((item, idx) => {
                const calc = calculateRow(item);
                return (
                  <tr key={idx} className="hover:bg-gray-50/60">
                    <td className="px-4 py-3 text-center text-xs font-bold text-gray-400">
                      {idx + 1}
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        placeholder="e.g. Paracetamol 650mg (15 Tabs)"
                        value={item.description}
                        onChange={(e) => updateItem(idx, 'description', e.target.value)}
                        className="w-full px-3 py-1.5 bg-gray-50/50 border border-gray-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-teal-500"
                        required
                      />
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={item.category}
                        onChange={(e) => updateItem(idx, 'category', e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-gray-50/50 border border-gray-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-teal-500"
                      >
                        {CATEGORIES.map((c) => (
                          <option key={c.value} value={c.value}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={item.quantity}
                        onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                        className="w-full px-2 py-1.5 bg-gray-50/50 border border-gray-200 rounded-lg text-xs font-semibold text-center focus:outline-none focus:ring-1 focus:ring-teal-500"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(e) => updateItem(idx, 'unitPrice', e.target.value)}
                        className="w-full px-2 py-1.5 bg-gray-50/50 border border-gray-200 rounded-lg text-xs font-semibold text-right focus:outline-none focus:ring-1 focus:ring-teal-500"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={item.discountPercent}
                        onChange={(e) => updateItem(idx, 'discountPercent', e.target.value)}
                        className="w-full px-2 py-1.5 bg-gray-50/50 border border-gray-200 rounded-lg text-xs font-semibold text-center focus:outline-none focus:ring-1 focus:ring-teal-500"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={item.taxPercent}
                        onChange={(e) => updateItem(idx, 'taxPercent', e.target.value)}
                        className="w-full px-2 py-1.5 bg-gray-50/50 border border-gray-200 rounded-lg text-xs font-semibold text-center focus:outline-none focus:ring-1 focus:ring-teal-500"
                      />
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-gray-900">
                      ₹{calc.total.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => removeItem(idx)}
                        disabled={items.length === 1}
                        className="p-1 text-gray-400 hover:text-red-500 disabled:opacity-20 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Calculation Summary Footer */}
        <div className="bg-gray-50/60 p-6 border-t border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="text-xs text-gray-400 max-w-sm">
            <p>
              * Prices and taxes are calculated per line item in real time. Tax invoice is prepared automatically upon finalization.
            </p>
          </div>

          <div className="w-full md:w-80 space-y-2 text-xs">
            <div className="flex justify-between text-gray-600">
              <span>Gross Subtotal:</span>
              <span className="font-semibold text-gray-800">₹{summary.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Discounts:</span>
              <span className="font-semibold text-emerald-600">-₹{summary.discountTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Taxes (GST):</span>
              <span className="font-semibold text-gray-800">+₹{summary.taxTotal.toFixed(2)}</span>
            </div>
            <div className="pt-2 border-t border-gray-300 flex justify-between items-center text-sm font-bold text-gray-900">
              <span>Grand Total Payable:</span>
              <span className="text-base text-teal-800">₹{summary.grandTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}

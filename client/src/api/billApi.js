import axios from 'axios';

const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

const api = axios.create({
  baseURL: `${API_BASE}/api/bills`,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getStats = async () => {
  const res = await api.get('/stats');
  return res.data;
};

export const getGatewayStatus = async () => {
  const res = await api.get('/gateway/status');
  return res.data;
};

export const getBills = async (params = {}) => {
  const res = await api.get('/', { params });
  return res.data;
};

export const getBillById = async (id) => {
  const res = await api.get(`/${id}`);
  return res.data;
};

export const createBill = async (billData) => {
  const res = await api.post('/', billData);
  return res.data;
};

export const updateBill = async (id, billData) => {
  const res = await api.put(`/${id}`, billData);
  return res.data;
};

export const finalizeBill = async (id) => {
  const res = await api.patch(`/${id}/finalize`);
  return res.data;
};

export const recordPayment = async (id, paymentData) => {
  const res = await api.post(`/${id}/payments`, paymentData);
  return res.data;
};

export const cancelBill = async (id) => {
  const res = await api.patch(`/${id}/cancel`);
  return res.data;
};

export const getReceipt = async (id) => {
  const res = await api.get(`/${id}/receipt`);
  return res.data;
};

export const createRazorpayOrder = async (id, amount) => {
  const res = await api.post(`/${id}/razorpay/order`, { amount });
  return res.data;
};

export const verifyRazorpayPayment = async (id, verificationData) => {
  const res = await api.post(`/${id}/razorpay/verify`, verificationData);
  return res.data;
};

export const checkUpiPaymentStatus = async (id) => {
  const res = await api.get(`/${id}/upi/status`);
  return res.data;
};

export const simulateUpiPayment = async (id, data) => {
  const res = await api.post(`/${id}/upi/simulate-paid`, data);
  return res.data;
};

export const sendBillWhatsApp = async (id) => {
  const res = await api.post(`/${id}/whatsapp`);
  return res.data;
};

export const getBillPdfUrl = (id) => {
  return `${API_BASE}/api/bills/${id}/pdf`;
};

export default api;

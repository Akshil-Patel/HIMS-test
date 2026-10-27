import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import BillList from './pages/BillList';
import CreateBill from './pages/CreateBill';
import BillDetails from './pages/BillDetails';
import ReceiptView from './pages/ReceiptView';
import MobilePaymentPortal from './pages/MobilePaymentPortal';
import { ToastProvider } from './components/common/Toast';

function AppShell() {
  const location = useLocation();

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900 font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/bills" element={<BillList />} />
              <Route path="/bills/new" element={<CreateBill />} />
              <Route path="/bills/:id" element={<BillDetails />} />
              <Route path="/bills/:id/receipt" element={<ReceiptView />} />
            </Routes>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <Routes>
        <Route path="/pay/:id" element={<MobilePaymentPortal />} />
        <Route path="*" element={<AppShell />} />
      </Routes>
    </ToastProvider>
  );
}

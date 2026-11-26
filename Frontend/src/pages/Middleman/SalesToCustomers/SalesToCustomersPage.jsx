import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { History, Check, ArrowRight } from 'lucide-react';
import { useMiddleman } from '../../../context/middleman';
import { MiddlemanPageHeader } from '../components/layout/MiddlemanPageHeader';
import { CustomerSalesForm } from '../components/sales/CustomerSalesForm';
import { formatINR } from '../../../utils/middleman/formatters';

export const SalesToCustomersPage = ({ initialDraftSaved = false }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { customers, inventory, createCustomerSale } = useMiddleman();

  const isDraftRoute =
    initialDraftSaved ||
    location.pathname.endsWith('/draft-saved') ||
    location.pathname.endsWith('/draft') ||
    Boolean(location.state?.showDraftSaved);

  const [submittedTxn, setSubmittedTxn] = useState(() => {
    if (isDraftRoute) {
      return {
        saleId: location.state?.saleId || 'CUS-SAL-7062',
        customerName: location.state?.customerName || 'Direct Customer',
        quantity: location.state?.quantity ?? 0,
        unit: location.state?.unit || 'Quintal',
        cropName: location.state?.cropName || '',
        finalAmount: location.state?.finalAmount ?? 0,
        otpStatus: 'Draft',
      };
    }
    return null;
  });

  useEffect(() => {
    if (isDraftRoute && !submittedTxn) {
      setSubmittedTxn({
        saleId: location.state?.saleId || 'CUS-SAL-7062',
        customerName: location.state?.customerName || 'Direct Customer',
        quantity: location.state?.quantity ?? 0,
        unit: location.state?.unit || 'Quintal',
        cropName: location.state?.cropName || '',
        finalAmount: location.state?.finalAmount ?? 0,
        otpStatus: 'Draft',
      });
    }
  }, [isDraftRoute]);

  const handleSubmit = (payload) => {
    const created = createCustomerSale(payload, false);
    setSubmittedTxn(created);
  };

  const handleSaveDraft = (payload) => {
    const created = createCustomerSale(payload, true);
    setSubmittedTxn(created);
  };

  const handleCloseModal = () => {
    setSubmittedTxn(null);
    if (location.pathname.endsWith('/draft-saved') || location.pathname.endsWith('/draft')) {
      navigate('/middleman/sales/customers', { replace: true });
    }
  };

  return (
    <div className="space-y-6">
      <MiddlemanPageHeader
        title="Sales to Customers"
        subtitle="Manage direct agricultural sales to local stores and end-consumers."
        actions={
          <button
            type="button"
            onClick={() => navigate('/middleman/sales-history', { state: { activeTab: 'customer' } })}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold border border-[#E2E8F0] bg-white hover:bg-slate-50 text-[#1F2937] shadow-2xs transition-all cursor-pointer"
          >
            <History className="w-3.5 h-3.5 text-[#0F766E]" />
            <span>Customer Sales History</span>
          </button>
        }
      />

      <CustomerSalesForm
        customers={customers}
        inventory={inventory}
        onSubmit={handleSubmit}
        onSaveDraft={handleSaveDraft}
      />

      {submittedTxn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-[440px] bg-white rounded-3xl shadow-2xl border border-slate-100 p-7 text-center">
            {/* Circular Green Badge with checkmark icon matching Screenshot 2026-11-20 104645.png */}
            <div className="w-14 h-14 rounded-2xl bg-[#E6F4EA] flex items-center justify-center mx-auto mb-4 text-[#0F766E]">
              <div className="w-7 h-7 rounded-full border-2 border-[#0F766E] flex items-center justify-center">
                <Check className="w-4 h-4 stroke-[2.5]" />
              </div>
            </div>

            <h3 className="text-xl font-bold text-[#1E293B]">
              {submittedTxn.otpStatus === 'Draft' ? 'Order Draft Saved' : 'Customer Sale Request Created!'}
            </h3>
            <p className="text-xs sm:text-sm text-[#64748B] mt-1.5 font-medium">
              Transaction ID: <span className="font-bold text-[#0F766E] font-mono">{submittedTxn.saleId}</span>
            </p>

            <div className="bg-[#F8FAFC] rounded-2xl p-4 sm:p-5 my-5 text-xs sm:text-sm space-y-3 text-left border border-slate-100">
              <div className="flex justify-between items-center">
                <span className="text-[#64748B]">Customer:</span>
                <span className="font-semibold text-[#1E293B]">{submittedTxn.customerName || 'Direct Customer'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#64748B]">Quantity:</span>
                <span className="font-semibold text-[#1E293B]">
                  {submittedTxn.quantity ?? 0} {submittedTxn.unit || 'Quintal'}
                  {submittedTxn.cropName ? ` ${submittedTxn.cropName}` : ''}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#64748B]">Final Amount:</span>
                <span className="font-bold text-[#0F766E]">{formatINR(submittedTxn.finalAmount || 0)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#64748B]">OTP Status:</span>
                <span className="font-bold text-[#D97706]">{submittedTxn.otpStatus}</span>
              </div>
            </div>

            <p className="text-xs text-[#64748B] text-center mb-6 leading-relaxed">
              {submittedTxn.otpStatus === 'Draft'
                ? 'Draft saved. You can reopen and finalize later.'
                : 'Customer OTP confirmation request logged. Inventory will be updated on delivery confirmation.'}
            </p>

            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <button
                type="button"
                onClick={handleCloseModal}
                className="py-3 px-4 rounded-xl text-sm font-semibold border border-[#CBD5E1] bg-white hover:bg-slate-50 text-[#1E293B] cursor-pointer transition-colors shadow-2xs"
              >
                Create Another
              </button>

              <button
                type="button"
                onClick={() => navigate('/middleman/confirmations')}
                className="py-3 px-4 rounded-xl text-sm font-bold bg-[#0F766E] hover:bg-[#115E59] text-white inline-flex items-center justify-center gap-1.5 shadow-sm cursor-pointer transition-colors"
              >
                <span>Confirmations</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesToCustomersPage;

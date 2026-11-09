import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { History, CheckCircle2, ArrowRight } from 'lucide-react';
import { useMiddleman } from '../../../context/middleman';
import { MiddlemanPageHeader } from '../components/layout/MiddlemanPageHeader';
import { PurchaseForm } from '../components/purchases/PurchaseForm';
import { formatINR } from '../../../utils/middleman/formatters';

export const PurchaseFromFarmersPage = () => {
  const navigate = useNavigate();
  const { farmers, createPurchase } = useMiddleman();

  const [submittedTxn, setSubmittedTxn] = useState(null);

  const handleSubmitPurchase = (payload) => {
    const created = createPurchase(payload, false);
    setSubmittedTxn(created);
  };

  const handleSaveDraft = (payload) => {
    const created = createPurchase(payload, true);
    setSubmittedTxn(created);
  };

  return (
    <div className="space-y-6">
      <MiddlemanPageHeader
        title="Purchase from Farmers"
        subtitle="Create procurement transactions directly from registered agricultural producers."
        actions={
          <button
            type="button"
            onClick={() => navigate('/middleman/purchase-history')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border border-[#E2E8F0] bg-white hover:bg-slate-50 text-[#1F2937] shadow-2xs transition-all"
          >
            <History className="w-3.5 h-3.5 text-[#0F766E]" />
            <span>Purchase History</span>
          </button>
        }
      />

      {/* Main Multi-section Purchase Form */}
      <PurchaseForm
        farmers={farmers}
        onSubmit={handleSubmitPurchase}
        onSaveDraft={handleSaveDraft}
      />

      {/* Success / OTP Pending Modal */}
      {submittedTxn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-[#E2E8F0] p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-[#0F766E] flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="text-base font-bold text-[#1F2937]">
                {submittedTxn.otpStatus === 'Draft' ? 'Purchase Draft Saved' : 'Purchase Request Created!'}
              </h3>
              <p className="text-xs text-[#64748B] mt-1">
                Transaction ID: <span className="font-mono font-bold text-[#0F766E]">{submittedTxn.purchaseId}</span>
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl space-y-1.5 text-xs">
              <div className="flex justify-between text-[#64748B]">
                <span>Farmer:</span>
                <span className="font-semibold text-[#1F2937]">{submittedTxn.farmerName}</span>
              </div>
              <div className="flex justify-between text-[#64748B]">
                <span>Produce:</span>
                <span className="font-semibold text-[#1F2937]">
                  {submittedTxn.quantity} {submittedTxn.unit} {submittedTxn.cropName}
                </span>
              </div>
              <div className="flex justify-between text-[#64748B]">
                <span>Total Amount:</span>
                <span className="font-bold text-[#0F766E]">{formatINR(submittedTxn.totalAmount)}</span>
              </div>
              <div className="flex justify-between text-[#64748B]">
                <span>OTP Status:</span>
                <span className="font-bold text-[#D97706]">{submittedTxn.otpStatus}</span>
              </div>
            </div>

            <p className="text-[11px] text-[#64748B] text-center leading-relaxed">
              {submittedTxn.otpStatus === 'Draft'
                ? 'Draft saved locally. You can reopen and complete it anytime.'
                : 'A confirmation request has been dispatched to the farmer. Complete authorization in the OTP Confirmations center to allocate stock to inventory.'}
            </p>

            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSubmittedTxn(null)}
                className="w-1/2 py-2 rounded-xl text-xs font-semibold border border-[#E2E8F0] hover:bg-slate-50 text-[#1F2937] cursor-pointer"
              >
                Create Another
              </button>

              <button
                type="button"
                onClick={() => navigate('/middleman/confirmations')}
                className="w-1/2 inline-flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold bg-[#0F766E] text-white hover:bg-[#115E59] shadow-xs cursor-pointer"
              >
                <span>Confirmations</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseFromFarmersPage;

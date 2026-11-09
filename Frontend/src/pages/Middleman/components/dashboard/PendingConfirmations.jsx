import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, ShieldCheck, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useMiddleman } from '../../../../context/middleman';
import { formatINR } from '../../../../utils/middleman/formatters';

export const PendingConfirmations = ({ className = '' }) => {
  const navigate = useNavigate();
  const { confirmations } = useMiddleman();

  const pendingList = confirmations.filter((c) => c.otpStatus === 'Pending');

  if (pendingList.length === 0) {
    return (
      <div className={`p-6 bg-white rounded-2xl border border-[#E2E8F0] text-center space-y-2 ${className}`}>
        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#15803D] flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-5 h-5" />
        </div>
        <h4 className="text-sm font-bold text-[#1F2937]">All Clear!</h4>
        <p className="text-xs text-[#64748B]">No pending OTP confirmations currently awaiting action.</p>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {pendingList.map((item) => (
        <div
          key={item.confirmationId}
          className="p-3.5 rounded-xl border border-amber-200/80 bg-amber-50/40 hover:bg-amber-50/70 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        >
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-[#D97706] flex items-center justify-center flex-shrink-0 mt-0.5">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#1F2937]">{item.partyName}</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white border border-amber-200 text-[#D97706]">
                  {item.transactionType}
                </span>
              </div>
              <p className="text-xs text-[#64748B] mt-0.5">
                {item.quantity} {item.unit} {item.crop} &bull;{' '}
                <span className="font-bold text-[#1F2937]">{formatINR(item.transactionAmount)}</span>
              </p>
              <span className="text-[10px] text-[#94A3B8]">
                Requested: {item.requestDate} &bull; Txn: {item.transactionId}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => navigate('/middleman/confirmations')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#0F766E] text-white hover:bg-[#115E59] shadow-xs cursor-pointer transition-all"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#CCFBF1]" />
              <span>Verify OTP</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PendingConfirmations;

import React, { useState } from 'react';
import { X, ShieldCheck, Clock, Phone } from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge';
import { formatINR, formatQuantity } from '../../../../utils/middleman/formatters';

export const ConfirmationDetails = ({
  item,
  onClose,
  onConfirm,
  onReject,
}) => {
  const [simulatedOtp, setSimulatedOtp] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);

  if (!item) return null;

  const handleSimulateApprove = () => {
    setIsVerifying(true);
    setTimeout(() => {
      onConfirm(item.confirmationId);
      setIsVerifying(false);
      onClose();
    }, 400);
  };

  const handleSimulateReject = () => {
    onReject(item.confirmationId, rejectReason || 'Declined during demonstration');
    setIsRejecting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-[#E2E8F0] p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold text-[#1F2937]">
                OTP Authorization &bull; <span className="font-mono text-[#0F766E]">{item.transactionId}</span>
              </h3>
              <StatusBadge status={item.otpStatus} size="sm" />
            </div>
            <p className="text-xs text-[#64748B]">{item.transactionType} Confirmation Lifecycle</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-[#94A3B8] hover:text-[#1F2937] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Financial & Produce Card */}
        <div className="p-4 bg-teal-50/50 rounded-2xl border border-teal-100 flex items-center justify-between">
          <div>
            <span className="text-xs text-[#64748B] block">Transaction Value</span>
            <span className="text-xl font-black text-[#0F766E]">{formatINR(item.transactionAmount)}</span>
          </div>
          <div className="text-right">
            <span className="text-xs text-[#64748B] block">Product &amp; Quantity</span>
            <span className="text-sm font-bold text-[#1F2937]">
              {formatQuantity(item.quantity, item.unit)} {item.crop}
            </span>
          </div>
        </div>

        {/* Party and Date Specs */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl space-y-1">
            <span className="text-[10px] font-bold text-[#64748B] uppercase">Counterparty Info</span>
            <div className="font-bold text-[#1F2937]">{item.partyName}</div>
            <div className="text-[#64748B] flex items-center gap-1">
              <Phone className="w-3 h-3 text-[#0F766E]" />
              <span>+91 {item.partyMobile}</span>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl space-y-1">
            <span className="text-[10px] font-bold text-[#64748B] uppercase">Timeline Info</span>
            <div className="text-[#64748B]">Requested: <span className="text-[#1F2937] font-semibold">{item.requestDate}</span></div>
            <div className="text-[#64748B]">Expires: <span className="text-[#1F2937] font-semibold">{item.expiryDate}</span></div>
          </div>
        </div>

        {/* Simulated Demonstration Banner */}
        {item.otpStatus === 'Pending' && !isRejecting && (
          <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200 space-y-3">
            <div className="flex items-start gap-2 text-xs text-[#D97706]">
              <Clock className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Frontend Demonstration Verification</span>
                <span className="text-[11px] text-[#64748B]">
                  Simulates party submitting the 6-digit SMS OTP to finalize the transaction.
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                maxLength={6}
                value={simulatedOtp}
                onChange={(e) => setSimulatedOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="Enter demo 6-digit OTP (e.g. 123456)"
                className="flex-1 px-3 py-2 text-xs font-mono font-bold rounded-xl border border-amber-300 bg-white focus:outline-none"
              />

              <button
                type="button"
                onClick={handleSimulateApprove}
                disabled={isVerifying}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#0F766E] text-white hover:bg-[#115E59] shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-[#CCFBF1]" />
                <span>{isVerifying ? 'Verifying...' : 'Authorize'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Reject Input */}
        {isRejecting && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 space-y-2">
            <span className="text-xs font-bold text-[#DC2626] block">Reason for Rejection</span>
            <input
              type="text"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Moisture mismatch, price disagreement..."
              className="w-full px-3 py-2 text-xs rounded-xl border border-red-300 bg-white outline-none"
            />
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsRejecting(false)}
                className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleSimulateReject}
                className="px-3 py-1.5 text-xs font-bold rounded-lg bg-[#DC2626] text-white hover:bg-red-700 cursor-pointer"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-[#E2E8F0]">
          {item.otpStatus === 'Pending' && !isRejecting ? (
            <button
              type="button"
              onClick={() => setIsRejecting(true)}
              className="text-xs font-semibold text-[#DC2626] hover:underline cursor-pointer"
            >
              Reject Verification
            </button>
          ) : <div />}

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-[#1F2937] cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationDetails;

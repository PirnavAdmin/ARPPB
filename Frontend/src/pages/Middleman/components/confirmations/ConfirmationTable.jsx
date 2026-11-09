import React from 'react';
import { Eye, ShieldCheck, XCircle } from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge';
import { formatINR, formatQuantity } from '../../../../utils/middleman/formatters';

export const ConfirmationTable = ({
  confirmations = [],
  onViewDetails,
  onQuickVerify,
  onQuickReject,
}) => {
  return (
    <div className="w-full overflow-x-auto rounded-xl border border-[#E2E8F0] bg-white">
      <table className="w-full text-left border-collapse min-w-[950px]">
        <thead>
          <tr className="bg-slate-50/80 border-b border-[#E2E8F0]">
            <th className="py-3 px-3.5 text-[11px] font-semibold text-[#64748B] uppercase">Txn ID</th>
            <th className="py-3 px-3.5 text-[11px] font-semibold text-[#64748B] uppercase">Type</th>
            <th className="py-3 px-3.5 text-[11px] font-semibold text-[#64748B] uppercase">Party Name</th>
            <th className="py-3 px-3.5 text-[11px] font-semibold text-[#64748B] uppercase">Mobile</th>
            <th className="py-3 px-3.5 text-[11px] font-semibold text-[#64748B] uppercase">Crop</th>
            <th className="py-3 px-3.5 text-[11px] font-semibold text-[#64748B] uppercase text-right">Quantity</th>
            <th className="py-3 px-3.5 text-[11px] font-semibold text-[#64748B] uppercase text-right">Amount</th>
            <th className="py-3 px-3.5 text-[11px] font-semibold text-[#64748B] uppercase">OTP Status</th>
            <th className="py-3 px-3.5 text-[11px] font-semibold text-[#64748B] uppercase">Requested</th>
            <th className="py-3 px-3.5 text-[11px] font-semibold text-[#64748B] uppercase">Confirmed On</th>
            <th className="py-3 px-3.5 text-[11px] font-semibold text-[#64748B] uppercase text-center">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#E2E8F0] text-xs text-[#1F2937]">
          {confirmations.map((item) => (
            <tr key={item.confirmationId} className="hover:bg-slate-50/60 transition-colors">
              <td className="py-3 px-3.5 font-mono font-bold text-[#0F766E]">{item.transactionId}</td>
              <td className="py-3 px-3.5 font-medium">{item.transactionType}</td>
              <td className="py-3 px-3.5 font-bold text-[#1F2937] max-w-[150px] truncate">
                {item.partyName}
              </td>
              <td className="py-3 px-3.5 font-mono text-[#64748B]">{item.partyMobile}</td>
              <td className="py-3 px-3.5">{item.crop}</td>
              <td className="py-3 px-3.5 text-right font-medium">{formatQuantity(item.quantity, item.unit)}</td>
              <td className="py-3 px-3.5 text-right font-bold text-[#0F766E]">{formatINR(item.transactionAmount)}</td>
              <td className="py-3 px-3.5">
                <StatusBadge status={item.otpStatus} size="sm" />
              </td>
              <td className="py-3 px-3.5 text-[#64748B] whitespace-nowrap">{item.requestDate}</td>
              <td className="py-3 px-3.5 text-[#64748B] whitespace-nowrap">
                {item.confirmationDate ? item.confirmationDate : '—'}
              </td>
              <td className="py-3 px-3.5 text-center whitespace-nowrap">
                <div className="flex items-center justify-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => onViewDetails(item)}
                    className="p-1 rounded-lg hover:bg-slate-100 text-[#0F766E] cursor-pointer"
                    title="View Full Confirmation Details"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>

                  {item.otpStatus === 'Pending' && (
                    <>
                      <button
                        type="button"
                        onClick={() => onQuickVerify(item)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-[#0F766E] text-white hover:bg-[#115E59] cursor-pointer shadow-2xs"
                        title="Simulate OTP Approval"
                      >
                        <ShieldCheck className="w-3 h-3 text-[#CCFBF1]" />
                        <span>Confirm</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onQuickReject(item)}
                        className="p-1 rounded-lg hover:bg-red-50 text-[#DC2626] cursor-pointer"
                        title="Reject Verification"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ConfirmationTable;

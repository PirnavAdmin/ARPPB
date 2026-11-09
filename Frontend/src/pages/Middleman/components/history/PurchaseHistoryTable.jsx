import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, BookOpen } from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge';
import { formatINR, formatDate, formatQuantity } from '../../../../utils/middleman/formatters';

export const PurchaseHistoryTable = ({
  purchases = [],
  onViewDetails,
}) => {
  const navigate = useNavigate();

  return (
    <div className="w-full overflow-x-auto rounded-xl border border-[#E2E8F0] bg-white">
      <table className="w-full text-left border-collapse min-w-[900px]">
        <thead>
          <tr className="bg-slate-50/80 border-b border-[#E2E8F0]">
            <th className="py-3 px-3.5 text-[11px] font-semibold text-[#64748B] uppercase">Purchase ID</th>
            <th className="py-3 px-3.5 text-[11px] font-semibold text-[#64748B] uppercase">Farmer Name</th>
            <th className="py-3 px-3.5 text-[11px] font-semibold text-[#64748B] uppercase">Crop &amp; Variety</th>
            <th className="py-3 px-3.5 text-[11px] font-semibold text-[#64748B] uppercase text-right">Quantity</th>
            <th className="py-3 px-3.5 text-[11px] font-semibold text-[#64748B] uppercase text-right">Rate</th>
            <th className="py-3 px-3.5 text-[11px] font-semibold text-[#64748B] uppercase text-right">Total Amount</th>
            <th className="py-3 px-3.5 text-[11px] font-semibold text-[#64748B] uppercase">Purchase Date</th>
            <th className="py-3 px-3.5 text-[11px] font-semibold text-[#64748B] uppercase">OTP Status</th>
            <th className="py-3 px-3.5 text-[11px] font-semibold text-[#64748B] uppercase">Due Date</th>
            <th className="py-3 px-3.5 text-[11px] font-semibold text-[#64748B] uppercase">Status</th>
            <th className="py-3 px-3.5 text-[11px] font-semibold text-[#64748B] uppercase text-center">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#E2E8F0] text-xs text-[#1F2937]">
          {purchases.map((p) => (
            <tr key={p.purchaseId} className="hover:bg-slate-50/60 transition-colors">
              <td className="py-3 px-3.5 font-mono font-bold text-[#0F766E]">{p.purchaseId}</td>
              <td className="py-3 px-3.5 font-bold text-[#1F2937]">{p.farmerName}</td>
              <td className="py-3 px-3.5">
                <span className="font-semibold text-[#1F2937]">{p.cropName}</span>
                <span className="block text-[10px] text-[#64748B]">{p.variety || 'Standard'}</span>
              </td>
              <td className="py-3 px-3.5 text-right font-medium">{formatQuantity(p.quantity, p.unit)}</td>
              <td className="py-3 px-3.5 text-right text-[#64748B]">{formatINR(p.rate)}</td>
              <td className="py-3 px-3.5 text-right font-bold text-[#0F766E]">{formatINR(p.totalAmount)}</td>
              <td className="py-3 px-3.5 text-[#64748B] whitespace-nowrap">{formatDate(p.purchaseDate)}</td>
              <td className="py-3 px-3.5">
                <StatusBadge status={p.otpStatus} size="sm" />
              </td>
              <td className="py-3 px-3.5 text-[#64748B] whitespace-nowrap">{formatDate(p.expectedPaymentDate)}</td>
              <td className="py-3 px-3.5">
                <StatusBadge status={p.status} size="sm" />
              </td>
              <td className="py-3 px-3.5 text-center whitespace-nowrap">
                <div className="flex items-center justify-center gap-1">
                  <button
                    type="button"
                    onClick={() => onViewDetails(p)}
                    className="p-1 rounded-lg hover:bg-slate-100 text-[#0F766E] cursor-pointer"
                    title="View Full Details"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/middleman/ledger', { state: { partyFilter: p.farmerId } })}
                    className="p-1 rounded-lg hover:bg-slate-100 text-[#D97706] cursor-pointer"
                    title="View Related Ledger"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PurchaseHistoryTable;

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, BookOpen } from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge';
import { formatINR, formatDate, formatQuantity } from '../../../../utils/middleman/formatters';

export const VendorSalesTable = ({
  sales = [],
  onViewDetails,
}) => {
  const navigate = useNavigate();

  return (
    <div className="w-full overflow-x-auto rounded-xl border border-[#E2E8F0] bg-white">
      <table className="w-full text-left border-collapse min-w-[850px]">
        <thead>
          <tr className="bg-slate-50/80 border-b border-[#E2E8F0]">
            <th className="py-3 px-3.5 text-[11px] font-semibold text-[#64748B] uppercase">Order ID</th>
            <th className="py-3 px-3.5 text-[11px] font-semibold text-[#64748B] uppercase">Vendor Name</th>
            <th className="py-3 px-3.5 text-[11px] font-semibold text-[#64748B] uppercase">Crop</th>
            <th className="py-3 px-3.5 text-[11px] font-semibold text-[#64748B] uppercase text-right">Quantity</th>
            <th className="py-3 px-3.5 text-[11px] font-semibold text-[#64748B] uppercase text-right">Rate</th>
            <th className="py-3 px-3.5 text-[11px] font-semibold text-[#64748B] uppercase text-right">Total</th>
            <th className="py-3 px-3.5 text-[11px] font-semibold text-[#64748B] uppercase">Date</th>
            <th className="py-3 px-3.5 text-[11px] font-semibold text-[#64748B] uppercase">OTP Status</th>
            <th className="py-3 px-3.5 text-[11px] font-semibold text-[#64748B] uppercase">Due Date</th>
            <th className="py-3 px-3.5 text-[11px] font-semibold text-[#64748B] uppercase text-center">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#E2E8F0] text-xs text-[#1F2937]">
          {sales.map((s) => (
            <tr key={s.saleId} className="hover:bg-slate-50/60 transition-colors">
              <td className="py-3 px-3.5 font-mono font-bold text-[#0F766E]">{s.saleId}</td>
              <td className="py-3 px-3.5 font-bold text-[#1F2937] max-w-[160px] truncate">
                {s.businessName || s.vendorName}
              </td>
              <td className="py-3 px-3.5 font-medium">{s.cropName}</td>
              <td className="py-3 px-3.5 text-right font-medium">{formatQuantity(s.quantity, s.unit)}</td>
              <td className="py-3 px-3.5 text-right text-[#64748B]">{formatINR(s.rate)}</td>
              <td className="py-3 px-3.5 text-right font-bold text-[#0F766E]">{formatINR(s.totalAmount)}</td>
              <td className="py-3 px-3.5 text-[#64748B] whitespace-nowrap">{formatDate(s.salesDate)}</td>
              <td className="py-3 px-3.5">
                <StatusBadge status={s.otpStatus} size="sm" />
              </td>
              <td className="py-3 px-3.5 text-[#64748B] whitespace-nowrap">{formatDate(s.expectedPaymentDate)}</td>
              <td className="py-3 px-3.5 text-center whitespace-nowrap">
                <div className="flex items-center justify-center gap-1">
                  <button
                    type="button"
                    onClick={() => onViewDetails && onViewDetails(s)}
                    className="p-1 rounded-lg hover:bg-slate-100 text-[#0F766E] cursor-pointer"
                    title="View Details"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/middleman/ledger', { state: { partyFilter: s.vendorId } })}
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

export default VendorSalesTable;


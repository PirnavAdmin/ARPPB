import React from 'react';
import { Eye, Edit2, ShoppingBag } from 'lucide-react';
import { formatINR, formatIndianNumber } from '../../../../utils/middleman/formatters';

export const CustomerTable = ({
  customers = [],
  onView,
  onEdit,
  onViewSales,
}) => {
  return (
    <div className="w-full overflow-x-auto rounded-xl border border-[#E2E8F0] bg-white">
      <table className="w-full text-left border-collapse min-w-[700px]">
        <thead>
          <tr className="bg-slate-50/80 border-b border-[#E2E8F0]">
            <th className="py-3 px-3.5 text-[11px] font-semibold text-[#64748B] uppercase">Customer ID</th>
            <th className="py-3 px-3.5 text-[11px] font-semibold text-[#64748B] uppercase">Customer Name</th>
            <th className="py-3 px-3.5 text-[11px] font-semibold text-[#64748B] uppercase">Mobile</th>
            <th className="py-3 px-3.5 text-[11px] font-semibold text-[#64748B] uppercase">District</th>
            <th className="py-3 px-3.5 text-[11px] font-semibold text-[#64748B] uppercase text-center">Orders</th>
            <th className="py-3 px-3.5 text-[11px] font-semibold text-[#64748B] uppercase text-right">Total Purchases</th>
            <th className="py-3 px-3.5 text-[11px] font-semibold text-[#64748B] uppercase text-center">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#E2E8F0] text-xs text-[#1F2937]">
          {customers.map((c) => (
            <tr key={c.customerId} className="hover:bg-slate-50/60 transition-colors">
              <td className="py-3 px-3.5 font-mono font-bold text-[#0F766E]">{c.customerId}</td>
              <td className="py-3 px-3.5 font-bold text-[#1F2937]">{c.name}</td>
              <td className="py-3 px-3.5 font-mono text-[#64748B]">{c.mobile}</td>
              <td className="py-3 px-3.5">{c.district}</td>
              <td className="py-3 px-3.5 text-center font-bold text-[#1F2937]">
                {formatIndianNumber(c.totalPurchases || 0)}
              </td>
              <td className="py-3 px-3.5 font-bold text-right text-[#0F766E]">
                {formatINR(c.totalPurchaseValue || 0)}
              </td>
              <td className="py-3 px-3.5 text-center whitespace-nowrap">
                <div className="flex items-center justify-center gap-1">
                  <button
                    type="button"
                    onClick={() => onView(c)}
                    className="p-1 rounded-lg hover:bg-slate-100 text-[#0F766E] cursor-pointer"
                    title="View Customer Profile"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onEdit(c)}
                    className="p-1 rounded-lg hover:bg-slate-100 text-[#14B8A6] cursor-pointer"
                    title="Edit Customer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onViewSales(c)}
                    className="p-1 rounded-lg hover:bg-slate-100 text-[#2563EB] cursor-pointer"
                    title="View Customer Orders"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
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

export default CustomerTable;


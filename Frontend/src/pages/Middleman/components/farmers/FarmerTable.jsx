import React from 'react';
import { Eye, Edit2, ShoppingCart } from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge';
import { formatIndianNumber } from '../../../../utils/middleman/formatters';

export const FarmerTable = ({
  farmers = [],
  onView,
  onEdit,
  onViewPurchases,
}) => {
  return (
    <div className="w-full overflow-x-auto rounded-xl border border-[#E2E8F0] bg-white">
      <table className="w-full text-left border-collapse min-w-[760px]">
        <thead>
          <tr className="bg-slate-50/80 border-b border-[#E2E8F0]">
            <th className="py-3 px-3.5 text-[11px] font-semibold text-[#64748B] uppercase">Farmer ID</th>
            <th className="py-3 px-3.5 text-[11px] font-semibold text-[#64748B] uppercase">Farmer Name</th>
            <th className="py-3 px-3.5 text-[11px] font-semibold text-[#64748B] uppercase">Mobile</th>
            <th className="py-3 px-3.5 text-[11px] font-semibold text-[#64748B] uppercase">Village</th>
            <th className="py-3 px-3.5 text-[11px] font-semibold text-[#64748B] uppercase">District</th>
            <th className="py-3 px-3.5 text-[11px] font-semibold text-[#64748B] uppercase">Available Crops</th>
            <th className="py-3 px-3.5 text-[11px] font-semibold text-[#64748B] uppercase text-center">Purchases</th>
            <th className="py-3 px-3.5 text-[11px] font-semibold text-[#64748B] uppercase">Status</th>
            <th className="py-3 px-3.5 text-[11px] font-semibold text-[#64748B] uppercase text-center">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#E2E8F0] text-xs text-[#1F2937]">
          {farmers.map((farmer) => (
            <tr key={farmer.farmerId} className="hover:bg-slate-50/60 transition-colors">
              <td className="py-3 px-3.5 font-mono font-bold text-[#0F766E]">{farmer.farmerId}</td>
              <td className="py-3 px-3.5 font-bold text-[#1F2937]">{farmer.name}</td>
              <td className="py-3 px-3.5 font-mono text-[#64748B]">{farmer.mobile}</td>
              <td className="py-3 px-3.5">{farmer.village}</td>
              <td className="py-3 px-3.5">{farmer.district}</td>
              <td className="py-3 px-3.5">
                <div className="flex flex-wrap gap-1">
                  {farmer.crops?.map((c) => (
                    <span
                      key={c}
                      className="px-1.5 py-0.5 text-[10px] rounded-md bg-teal-50 text-[#0F766E] font-medium border border-teal-100"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </td>
              <td className="py-3 px-3.5 text-center font-bold text-[#1F2937]">
                {formatIndianNumber(farmer.totalPurchases || 0)}
              </td>
              <td className="py-3 px-3.5">
                <StatusBadge status={farmer.status || 'Active'} size="sm" />
              </td>
              <td className="py-3 px-3.5 text-center whitespace-nowrap">
                <div className="flex items-center justify-center gap-1">
                  <button
                    type="button"
                    onClick={() => onView(farmer)}
                    className="p-1 rounded-lg hover:bg-slate-100 text-[#0F766E] cursor-pointer"
                    title="View Profile"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onEdit(farmer)}
                    className="p-1 rounded-lg hover:bg-slate-100 text-[#14B8A6] cursor-pointer"
                    title="Edit Farmer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onViewPurchases(farmer)}
                    className="p-1 rounded-lg hover:bg-slate-100 text-[#2563EB] cursor-pointer"
                    title="Purchase History"
                  >
                    <ShoppingCart className="w-3.5 h-3.5" />
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

export default FarmerTable;

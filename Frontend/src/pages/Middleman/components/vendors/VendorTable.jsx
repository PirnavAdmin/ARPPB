import React from 'react';
import { Eye, Edit2, ShoppingBag } from 'lucide-react';
import { formatINR, formatIndianNumber } from '../../../../utils/middleman/formatters';

export const VendorTable = ({
  vendors = [],
  onView,
  onEdit,
  onViewSales,
}) => {
  return (
    <div className="w-full overflow-x-auto rounded-xl border border-[#E2E8F0] bg-white">
      <table className="w-full text-left border-collapse min-w-[850px]">
        <thead>
          <tr className="bg-slate-50/80 border-b border-[#E2E8F0]">
            <th className="py-3 px-3.5 text-[11px] font-semibold text-[#64748B] uppercase">Vendor ID</th>
            <th className="py-3 px-3.5 text-[11px] font-semibold text-[#64748B] uppercase">Business Name</th>
            <th className="py-3 px-3.5 text-[11px] font-semibold text-[#64748B] uppercase">Owner / Contact</th>
            <th className="py-3 px-3.5 text-[11px] font-semibold text-[#64748B] uppercase">Mobile</th>
            <th className="py-3 px-3.5 text-[11px] font-semibold text-[#64748B] uppercase">Type</th>
            <th className="py-3 px-3.5 text-[11px] font-semibold text-[#64748B] uppercase">District</th>
            <th className="py-3 px-3.5 text-[11px] font-semibold text-[#64748B] uppercase">GSTIN</th>
            <th className="py-3 px-3.5 text-[11px] font-semibold text-[#64748B] uppercase text-center">Orders</th>
            <th className="py-3 px-3.5 text-[11px] font-semibold text-[#64748B] uppercase text-right">Total Value</th>
            <th className="py-3 px-3.5 text-[11px] font-semibold text-[#64748B] uppercase text-center">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#E2E8F0] text-xs text-[#1F2937]">
          {vendors.map((vendor) => (
            <tr key={vendor.vendorId} className="hover:bg-slate-50/60 transition-colors">
              <td className="py-3 px-3.5 font-mono font-bold text-[#0F766E]">{vendor.vendorId}</td>
              <td className="py-3 px-3.5 font-bold text-[#1F2937] max-w-[170px] truncate">
                {vendor.businessName}
              </td>
              <td className="py-3 px-3.5 text-[#64748B]">{vendor.ownerName}</td>
              <td className="py-3 px-3.5 font-mono text-[#64748B]">{vendor.mobile}</td>
              <td className="py-3 px-3.5">
                <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-[#1F2937] border border-slate-200">
                  {vendor.businessType}
                </span>
              </td>
              <td className="py-3 px-3.5">{vendor.district}</td>
              <td className="py-3 px-3.5 font-mono text-[11px] text-[#64748B]">
                {vendor.gstNumber || '—'}
              </td>
              <td className="py-3 px-3.5 text-center font-bold text-[#1F2937]">
                {formatIndianNumber(vendor.totalPurchases || 0)}
              </td>
              <td className="py-3 px-3.5 font-bold text-right text-[#0F766E]">
                {formatINR(vendor.totalPurchaseValue || 0)}
              </td>
              <td className="py-3 px-3.5 text-center whitespace-nowrap">
                <div className="flex items-center justify-center gap-1">
                  <button
                    type="button"
                    onClick={() => onView(vendor)}
                    className="p-1 rounded-lg hover:bg-slate-100 text-[#0F766E] cursor-pointer"
                    title="View Vendor Profile"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onEdit(vendor)}
                    className="p-1 rounded-lg hover:bg-slate-100 text-[#14B8A6] cursor-pointer"
                    title="Edit Vendor"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onViewSales(vendor)}
                    className="p-1 rounded-lg hover:bg-slate-100 text-[#2563EB] cursor-pointer"
                    title="View Sales History"
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

export default VendorTable;

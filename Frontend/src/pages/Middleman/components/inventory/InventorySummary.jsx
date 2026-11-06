import React from 'react';
import { Boxes, ArrowDownLeft, ArrowUpRight, AlertTriangle } from 'lucide-react';
import { formatIndianNumber } from '../../../../utils/middleman/formatters';

export const InventorySummary = ({
  batches = [],
}) => {
  const totalPurchased = batches.reduce((acc, b) => acc + (Number(b.purchasedQuantity) || 0), 0);
  const totalSold = batches.reduce((acc, b) => acc + (Number(b.soldQuantity) || 0), 0);
  const availableStock = batches.reduce((acc, b) => acc + (Number(b.availableQuantity) || 0), 0);
  const lowStockCount = batches.filter((b) => b.status === 'Low Stock').length;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
      {/* 1. Total Purchased Stock */}
      <div className="p-4 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-[#64748B] block">Total Purchased Stock</span>
          <span className="text-lg sm:text-xl font-extrabold text-[#1F2937] mt-1 block">
            {formatIndianNumber(totalPurchased)} Qtl
          </span>
          <span className="text-[11px] text-[#64748B]">Across all active batches</span>
        </div>
        <div className="w-10 h-10 rounded-xl bg-teal-50 text-[#0F766E] flex items-center justify-center">
          <ArrowDownLeft className="w-5 h-5" />
        </div>
      </div>

      {/* 2. Total Sold Stock */}
      <div className="p-4 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-[#64748B] block">Total Sold Stock</span>
          <span className="text-lg sm:text-xl font-extrabold text-[#1F2937] mt-1 block">
            {formatIndianNumber(totalSold)} Qtl
          </span>
          <span className="text-[11px] text-[#64748B]">To vendors &amp; customers</span>
        </div>
        <div className="w-10 h-10 rounded-xl bg-teal-50/60 text-[#14B8A6] flex items-center justify-center">
          <ArrowUpRight className="w-5 h-5" />
        </div>
      </div>

      {/* 3. Available Stock */}
      <div className="p-4 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-[#0F766E] block font-bold">Available Stock</span>
          <span className="text-lg sm:text-xl font-extrabold text-[#0F766E] mt-1 block">
            {formatIndianNumber(availableStock)} Qtl
          </span>
          <span className="text-[11px] text-[#64748B]">Ready for allocation</span>
        </div>
        <div className="w-10 h-10 rounded-xl bg-teal-50 text-[#0F766E] flex items-center justify-center">
          <Boxes className="w-5 h-5" />
        </div>
      </div>

      {/* 4. Low Stock Batches */}
      <div className="p-4 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-[#D97706] block font-bold">Low Stock Batches</span>
          <span className="text-lg sm:text-xl font-extrabold text-[#D97706] mt-1 block">
            {lowStockCount} Batches
          </span>
          <span className="text-[11px] text-[#64748B]">Below threshold level</span>
        </div>
        <div className="w-10 h-10 rounded-xl bg-amber-50 text-[#D97706] flex items-center justify-center">
          <AlertTriangle className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
};

export default InventorySummary;


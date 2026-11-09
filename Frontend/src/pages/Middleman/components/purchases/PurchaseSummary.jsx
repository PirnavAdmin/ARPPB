import React from 'react';
import { Info } from 'lucide-react';
import { formatINR } from '../../../../utils/middleman/formatters';

export const PurchaseSummary = ({
  subtotal = 0,
  transportation = 0,
  loading = 0,
  otherCharges = 0,
  totalAmount = 0,
  averageCostPerUnit = 0,
  unit = 'Quintal',
}) => {
  const totalCharges = Number(transportation) + Number(loading) + Number(otherCharges);

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-teal-50/50 border border-teal-100 space-y-3">
      <div className="flex items-center justify-between pb-2 border-b border-teal-100/80">
        <span className="text-xs font-bold text-[#0F766E] uppercase tracking-wider">
          Live Purchase Cost Calculation
        </span>
        <span className="text-[11px] text-[#64748B]">Batch Landed Estimate</span>
      </div>

      <div className="space-y-1.5 text-xs">
        <div className="flex justify-between text-[#64748B]">
          <span>Raw Crop Subtotal:</span>
          <span className="font-semibold text-[#1F2937]">{formatINR(subtotal)}</span>
        </div>

        <div className="flex justify-between text-[#64748B]">
          <span>Total Direct Surcharges (Transport + Loading + Other):</span>
          <span className="font-semibold text-[#1F2937]">{formatINR(totalCharges)}</span>
        </div>

        <div className="flex justify-between text-sm pt-2 border-t border-teal-200/60 font-bold text-[#1F2937]">
          <span>Total Payable to Farmer:</span>
          <span className="text-base text-[#0F766E]">{formatINR(totalAmount)}</span>
        </div>

        <div className="flex justify-between text-xs text-[#0F766E] font-medium pt-1">
          <span>Effective Average Landed Cost per {unit}:</span>
          <span className="font-bold">{formatINR(averageCostPerUnit, true)}</span>
        </div>
      </div>

      <div className="flex items-start gap-2 p-2.5 rounded-xl bg-white/80 border border-teal-100 text-[11px] text-[#64748B] mt-2">
        <Info className="w-3.5 h-3.5 text-[#0F766E] flex-shrink-0 mt-0.5" />
        <p className="leading-snug">
          Submitting creates a <span className="font-semibold text-[#1F2937]">Pending Confirmation</span>.
          Stock is allocated to inventory only upon OTP authorization from the farmer.
        </p>
      </div>
    </div>
  );
};

export default PurchaseSummary;

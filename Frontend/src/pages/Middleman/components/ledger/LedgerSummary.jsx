import React from 'react';
import { formatINR } from '../../../../utils/middleman/formatters';

export const LedgerSummary = ({ metrics }) => {
  const {
    totalPurchaseValue,
    totalSalesValue,
    expectedPayables,
    expectedReceivables,
    amountReceived,
    netOutstanding,
    grossProfit,
  } = metrics;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
      {/* 1. Total Purchases */}
      <div className="p-3.5 bg-white rounded-2xl border border-[#E2E8F0] shadow-xs">
        <span className="text-[11px] font-semibold text-[#64748B] block truncate">1. Purchases</span>
        <span className="text-sm sm:text-base font-extrabold text-[#1F2937] mt-1 block truncate">
          {formatINR(totalPurchaseValue)}
        </span>
        <span className="text-[10px] text-[#64748B]">Procured stock</span>
      </div>

      {/* 2. Total Sales */}
      <div className="p-3.5 bg-white rounded-2xl border border-[#E2E8F0] shadow-xs">
        <span className="text-[11px] font-semibold text-[#64748B] block truncate">2. Sales</span>
        <span className="text-sm sm:text-base font-extrabold text-[#0F766E] mt-1 block truncate">
          {formatINR(totalSalesValue)}
        </span>
        <span className="text-[10px] text-[#64748B]">Total billing</span>
      </div>

      {/* 3. Total Payables */}
      <div className="p-3.5 bg-white rounded-2xl border border-[#E2E8F0] shadow-xs">
        <span className="text-[11px] font-semibold text-[#DC2626] block truncate">3. Payables Due</span>
        <span className="text-sm sm:text-base font-extrabold text-[#DC2626] mt-1 block truncate">
          {formatINR(expectedPayables)}
        </span>
        <span className="text-[10px] text-[#64748B]">Owed to farmers</span>
      </div>

      {/* 4. Total Receivables */}
      <div className="p-3.5 bg-white rounded-2xl border border-[#E2E8F0] shadow-xs">
        <span className="text-[11px] font-semibold text-[#15803D] block truncate">4. Receivables</span>
        <span className="text-sm sm:text-base font-extrabold text-[#15803D] mt-1 block truncate">
          {formatINR(expectedReceivables)}
        </span>
        <span className="text-[10px] text-[#64748B]">Due from buyers</span>
      </div>

      {/* 5. Amount Received */}
      <div className="p-3.5 bg-white rounded-2xl border border-[#E2E8F0] shadow-xs">
        <span className="text-[11px] font-semibold text-[#64748B] block truncate">5. Settled Cash</span>
        <span className="text-sm sm:text-base font-extrabold text-[#1F2937] mt-1 block truncate">
          {formatINR(amountReceived)}
        </span>
        <span className="text-[10px] text-[#64748B]">Inward receipts</span>
      </div>

      {/* 6. Net Outstanding Balance */}
      <div className="p-3.5 bg-white rounded-2xl border border-[#E2E8F0] shadow-xs">
        <span className="text-[11px] font-semibold text-[#0F766E] block truncate">6. Net Position</span>
        <span
          className={`text-sm sm:text-base font-extrabold mt-1 block truncate ${
            netOutstanding >= 0 ? 'text-[#15803D]' : 'text-[#DC2626]'
          }`}
        >
          {formatINR(netOutstanding)}
        </span>
        <span className="text-[10px] text-[#64748B]">Recv − Pay</span>
      </div>

      {/* 7. Gross Profit */}
      <div className="p-3.5 bg-teal-50/60 rounded-2xl border border-teal-100 shadow-xs col-span-2 sm:col-span-1">
        <span className="text-[11px] font-bold text-[#0F766E] block truncate">7. Gross Profit</span>
        <span className="text-sm sm:text-base font-black text-[#0F766E] mt-1 block truncate">
          {formatINR(grossProfit)}
        </span>
        <span className="text-[10px] text-[#0F766E]/80">Net trading profit</span>
      </div>
    </div>
  );
};

export default LedgerSummary;

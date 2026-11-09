import React from 'react';
import { TrendingUp, HelpCircle } from 'lucide-react';
import { useMiddleman } from '../../../../context/middleman';
import { formatINR } from '../../../../utils/middleman/formatters';

export const ProfitOverviewChart = ({ className = '' }) => {
  const { dashboardMetrics } = useMiddleman();

  const {
    totalSalesValue,
    totalCogs,
    grossProfit,
    marginPercentage,
  } = dashboardMetrics;

  const operatingExpenses = 35000; // Handled charges & godown rent

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Gross Profit Hero Card */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-teal-50 to-emerald-50 border border-teal-100 flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-[#0F766E] uppercase tracking-wider">
            Gross Trading Profit
          </span>
          <div className="text-2xl font-black text-[#0F766E] mt-0.5">
            {formatINR(grossProfit)}
          </div>
          <span className="text-[11px] font-semibold text-[#15803D] inline-flex items-center gap-1 mt-1">
            <TrendingUp className="w-3.5 h-3.5" />
            {marginPercentage}% Net Trading Margin
          </span>
        </div>

        <div className="text-right text-xs text-[#64748B]">
          <span className="block text-[11px]">Formula Applied:</span>
          <span className="font-mono text-[10px] text-[#1F2937]">Sales − COGS − Exp</span>
        </div>
      </div>

      {/* 4 Financial Component Breakdown */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 bg-slate-50/70 rounded-xl border border-[#E2E8F0]">
          <span className="text-[11px] text-[#64748B] block">Total Confirmed Sales</span>
          <span className="text-sm font-bold text-[#1F2937]">{formatINR(totalSalesValue)}</span>
        </div>

        <div className="p-3 bg-slate-50/70 rounded-xl border border-[#E2E8F0]">
          <span className="text-[11px] text-[#64748B] block">Cost of Goods Sold (COGS)</span>
          <span className="text-sm font-bold text-[#DC2626]">{formatINR(totalCogs)}</span>
        </div>

        <div className="p-3 bg-slate-50/70 rounded-xl border border-[#E2E8F0]">
          <span className="text-[11px] text-[#64748B] block">Operating Expenses</span>
          <span className="text-sm font-bold text-[#D97706]">{formatINR(operatingExpenses)}</span>
        </div>

        <div className="p-3 bg-teal-50/40 rounded-xl border border-teal-100">
          <span className="text-[11px] text-[#0F766E] block font-medium">Batch Allocation Method</span>
          <span className="text-xs font-bold text-[#0F766E]">FIFO Landed Cost</span>
        </div>
      </div>

      {/* Accounting Clarification Note */}
      <div className="flex items-start gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-[#64748B]">
        <HelpCircle className="w-3.5 h-3.5 text-[#0F766E] flex-shrink-0 mt-0.5" />
        <p className="leading-snug">
          Gross Profit is computed from sales minus batch-allocated FIFO Cost of Goods Sold.
          Unsold stock remains on the balance sheet as inventory assets.
        </p>
      </div>
    </div>
  );
};

export default ProfitOverviewChart;

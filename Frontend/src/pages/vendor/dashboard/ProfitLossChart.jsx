import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts';
import { Info } from 'lucide-react';
import { formatCurrency } from '../../../utils/formatCurrency';

export function ProfitLossChart({ financialData }) {
  const {
    rawMaterialCost = 0,
    processingExpenses = 0,
    salesRevenue = 0,
    estimatedProfit = 0,
  } = financialData || {};

  const chartData = [
    {
      label: 'Sales Revenue',
      amount: salesRevenue,
      fill: '#0F766E',
    },
    {
      label: 'Allocated Raw Material Cost',
      amount: rawMaterialCost,
      fill: '#14B8A6',
    },
    {
      label: 'Processing Expenses',
      amount: processingExpenses,
      fill: '#0D9488',
    },
    {
      label: 'Estimated Profit',
      amount: Math.max(0, estimatedProfit),
      fill: estimatedProfit >= 0 ? '#16A34A' : '#DC2626',
    },
  ];

  return (
    <div className="bg-brand-surface rounded-2xl border border-brand-border p-5 shadow-2xs flex flex-col justify-between">
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div>
            <h3 className="text-base font-bold text-brand-primary">
              Profit & Loss Overview (Estimated)
            </h3>
            <p className="text-xs text-brand-muted">
              Estimated Profit = Sales Revenue − Allocated Cost of Raw Material Sold − Processing Expenses
            </p>
          </div>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-brand-light text-brand-primary text-xs font-semibold">
            <Info className="w-3.5 h-3.5" />
            Provisional Operational P&amp;L
          </span>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <div className="p-3 rounded-xl bg-brand-background border border-brand-border">
            <span className="text-[10px] font-bold uppercase text-brand-muted">
              Raw Material Cost (COGS)
            </span>
            <p className="text-sm font-bold text-brand-text mt-1">
              {formatCurrency(rawMaterialCost)}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-brand-background border border-brand-border">
            <span className="text-[10px] font-bold uppercase text-brand-muted">
              Processing Expenses
            </span>
            <p className="text-sm font-bold text-brand-text mt-1">
              {formatCurrency(processingExpenses)}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-brand-background border border-brand-border">
            <span className="text-[10px] font-bold uppercase text-brand-muted">
              Sales Revenue
            </span>
            <p className="text-sm font-bold text-brand-primary mt-1">
              {formatCurrency(salesRevenue)}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-brand-light/50 border border-brand-secondary/40">
            <span className="text-[10px] font-bold uppercase text-brand-primary">
              Estimated Profit
            </span>
            <p
              className={`text-sm font-bold mt-1 ${
                estimatedProfit >= 0 ? 'text-brand-success' : 'text-brand-error'
              }`}
            >
              {formatCurrency(estimatedProfit)}
            </p>
          </div>
        </div>

        <div className="h-60 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 15, left: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#0F172A' }} />
              <YAxis
                tick={{ fontSize: 11, fill: '#64748B' }}
                tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  borderColor: '#E2E8F0',
                  borderRadius: '12px',
                  fontSize: '12px',
                }}
                formatter={(val) => [formatCurrency(val), 'Amount']}
              />
              <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                {chartData.map((entry) => (
                  <Cell key={entry.label} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <p className="text-[11px] text-brand-muted mt-3 bg-brand-background p-2.5 rounded-lg border border-brand-border">
          <strong>Accounting Note:</strong> Raw Material Cost above reflects the allocated cost of raw
          materials consumed for sold goods rather than unconsumed warehouse stock purchases. Figures are
          labeled as estimated pending final statutory audit.
        </p>
      </div>
    </div>
  );
}

export default ProfitLossChart;


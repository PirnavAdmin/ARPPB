import { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import dayjs from 'dayjs';
import { formatCurrency, formatNumber } from '../../../utils/formatCurrency';
import VendorEmptyState from '../VendorEmptyState';

export function PurchaseOverviewChart({ purchases = [] }) {
  const [metricMode, setMetricMode] = useState('amount'); // 'amount' | 'quantity'

  const chartData = useMemo(() => {
    const grouped = {};
    purchases.forEach((p) => {
      if (p.status === 'Draft') return;
      const periodKey = dayjs(p.purchaseDate).format('DD MMM');
      if (!grouped[periodKey]) {
        grouped[periodKey] = {
          period: periodKey,
          sortDate: p.purchaseDate,
          farmerAmount: 0,
          middlemanAmount: 0,
          farmerQty: 0,
          middlemanQty: 0,
          farmerTxns: 0,
          middlemanTxns: 0,
        };
      }
      if (p.supplierCategory === 'Farmer') {
        grouped[periodKey].farmerAmount += Number(p.totalAmount || 0);
        grouped[periodKey].farmerQty += Number(p.quantity || 0);
        grouped[periodKey].farmerTxns += 1;
      } else {
        grouped[periodKey].middlemanAmount += Number(p.totalAmount || 0);
        grouped[periodKey].middlemanQty += Number(p.quantity || 0);
        grouped[periodKey].middlemanTxns += 1;
      }
    });

    return Object.values(grouped).sort((a, b) =>
      String(a.sortDate).localeCompare(String(b.sortDate))
    );
  }, [purchases]);

  const summary = useMemo(() => {
    const farmerList = purchases.filter((p) => p.supplierCategory === 'Farmer' && p.status !== 'Draft');
    const midList = purchases.filter((p) => p.supplierCategory === 'Middleman' && p.status !== 'Draft');
    return {
      farmerTxns: farmerList.length,
      farmerQty: farmerList.reduce((s, p) => s + Number(p.quantity || 0), 0),
      farmerAmt: farmerList.reduce((s, p) => s + Number(p.totalAmount || 0), 0),
      midTxns: midList.length,
      midQty: midList.reduce((s, p) => s + Number(p.quantity || 0), 0),
      midAmt: midList.reduce((s, p) => s + Number(p.totalAmount || 0), 0),
    };
  }, [purchases]);

  return (
    <div className="bg-brand-surface rounded-2xl border border-brand-border p-5 shadow-2xs flex flex-col justify-between">
      <div>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-base font-bold text-brand-primary">Purchase Overview</h3>
            <p className="text-xs text-brand-muted">
              Date-wise comparison of Purchases from Farmers vs. Purchases from Middlemen
            </p>
          </div>
          <div className="inline-flex rounded-xl bg-brand-background p-1 border border-brand-border">
            <button
              type="button"
              onClick={() => setMetricMode('amount')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                metricMode === 'amount'
                  ? 'bg-brand-primary text-white'
                  : 'text-brand-muted hover:text-brand-primary'
              }`}
            >
              Amount (₹)
            </button>
            <button
              type="button"
              onClick={() => setMetricMode('quantity')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                metricMode === 'quantity'
                  ? 'bg-brand-primary text-white'
                  : 'text-brand-muted hover:text-brand-primary'
              }`}
            >
              Quantity (Qtl)
            </button>
          </div>
        </div>

        {/* Category Summary Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <div className="p-3 rounded-xl bg-brand-light/40 border border-brand-secondary/30 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase text-brand-primary">
                Purchases from Farmers
              </span>
              <p className="text-base font-bold text-brand-text mt-0.5">
                {formatCurrency(summary.farmerAmt)}
              </p>
            </div>
            <div className="text-right text-xs text-brand-muted">
              <p className="font-semibold text-brand-primary">
                {formatNumber(summary.farmerQty)} Quintal
              </p>
              <p>{summary.farmerTxns} transactions</p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-brand-background border border-brand-border flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase text-brand-secondary">
                Purchases from Middlemen
              </span>
              <p className="text-base font-bold text-brand-text mt-0.5">
                {formatCurrency(summary.midAmt)}
              </p>
            </div>
            <div className="text-right text-xs text-brand-muted">
              <p className="font-semibold text-brand-primary">
                {formatNumber(summary.midQty)} Quintal
              </p>
              <p>{summary.midTxns} transactions</p>
            </div>
          </div>
        </div>

        {chartData.length === 0 ? (
          <VendorEmptyState
            title="No purchase records in selected period"
            description="Adjust the dashboard date range filter to view purchase trends."
          />
        ) : (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 15, left: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="period" tick={{ fontSize: 11, fill: '#64748B' }} />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  tickFormatter={(val) =>
                    metricMode === 'amount' ? `₹${(val / 1000).toFixed(0)}k` : `${val} Q`
                  }
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderColor: '#E2E8F0',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                  formatter={(value, name) => [
                    metricMode === 'amount'
                      ? formatCurrency(value)
                      : `${formatNumber(value)} Quintal`,
                    name,
                  ]}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar
                  dataKey={metricMode === 'amount' ? 'farmerAmount' : 'farmerQty'}
                  name="Purchases from Farmers"
                  fill="#0F766E"
                  radius={[6, 6, 0, 0]}
                />
                <Bar
                  dataKey={metricMode === 'amount' ? 'middlemanAmount' : 'middlemanQty'}
                  name="Purchases from Middlemen"
                  fill="#14B8A6"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}

export default PurchaseOverviewChart;


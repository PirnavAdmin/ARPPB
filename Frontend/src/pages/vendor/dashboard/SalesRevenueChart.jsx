import { useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
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

export function SalesRevenueChart({ sales = [] }) {
  const confirmedSales = useMemo(
    () =>
      sales.filter(
        (s) => s.confirmationStatus === 'Verified' && s.salesStatus !== 'Cancelled'
      ),
    [sales]
  );

  const metrics = useMemo(() => {
    const totalRevenue = confirmedSales.reduce(
      (sum, s) => sum + Number(s.totalAmount || 0),
      0
    );
    const totalOrders = confirmedSales.length;
    const totalQty = confirmedSales.reduce((sum, s) => sum + Number(s.quantity || 0), 0);
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    return {
      totalRevenue,
      totalOrders,
      totalQty,
      avgOrderValue,
    };
  }, [confirmedSales]);

  const trendData = useMemo(() => {
    const grouped = {};
    confirmedSales.forEach((s) => {
      const key = dayjs(s.salesDate).format('DD MMM');
      if (!grouped[key]) {
        grouped[key] = {
          period: key,
          sortDate: s.salesDate,
          revenue: 0,
          orders: 0,
        };
      }
      grouped[key].revenue += Number(s.totalAmount || 0);
      grouped[key].orders += 1;
    });
    return Object.values(grouped).sort((a, b) =>
      String(a.sortDate).localeCompare(String(b.sortDate))
    );
  }, [confirmedSales]);

  const productRevenueData = useMemo(() => {
    const map = {};
    confirmedSales.forEach((s) => {
      const items =
        Array.isArray(s.items) && s.items.length > 0
          ? s.items
          : [{ productName: s.product, subtotal: s.totalAmount, sellingQuantity: s.quantity }];
      items.forEach((it) => {
        const name = it.productName || s.product;
        if (!map[name]) {
          map[name] = { product: name, revenue: 0, quantity: 0 };
        }
        map[name].revenue += Number(it.subtotal || s.totalAmount || 0);
        map[name].quantity += Number(it.sellingQuantity || s.quantity || 0);
      });
    });
    return Object.values(map).sort((a, b) => b.revenue - a.revenue);
  }, [confirmedSales]);

  return (
    <div className="bg-brand-surface rounded-2xl border border-brand-border p-5 shadow-2xs">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-base font-bold text-brand-primary">Sales & Revenue Analytics</h3>
          <p className="text-xs text-brand-muted">
            Period revenue line trend and product-wise sales revenue comparison
          </p>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <div className="p-3 rounded-xl bg-brand-light/40 border border-brand-secondary/30">
          <span className="text-[11px] font-bold uppercase text-brand-primary">Total Revenue</span>
          <p className="text-base font-bold text-brand-text mt-0.5">
            {formatCurrency(metrics.totalRevenue)}
          </p>
        </div>
        <div className="p-3 rounded-xl bg-brand-background border border-brand-border">
          <span className="text-[11px] font-bold uppercase text-brand-muted">Number of Orders</span>
          <p className="text-base font-bold text-brand-text mt-0.5">
            {formatNumber(metrics.totalOrders, 0)} Orders
          </p>
        </div>
        <div className="p-3 rounded-xl bg-brand-background border border-brand-border">
          <span className="text-[11px] font-bold uppercase text-brand-muted">Sales Volume</span>
          <p className="text-base font-bold text-brand-text mt-0.5">
            {formatNumber(metrics.totalQty)} Units
          </p>
        </div>
        <div className="p-3 rounded-xl bg-brand-background border border-brand-border">
          <span className="text-[11px] font-bold uppercase text-brand-muted">
            Average Order Value
          </span>
          <p className="text-base font-bold text-brand-primary mt-0.5">
            {formatCurrency(metrics.avgOrderValue)}
          </p>
        </div>
      </div>

      {confirmedSales.length === 0 ? (
        <VendorEmptyState
          title="No confirmed sales in selected date range"
          description="Change the date range filter or confirm pending customer sales orders."
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Trend Line Chart */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-brand-muted mb-2">
              Revenue Trend
            </h4>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 10, right: 15, left: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="period" tick={{ fontSize: 11, fill: '#64748B' }} />
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
                    formatter={(val) => [formatCurrency(val), 'Sales Revenue']}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    name="Sales Revenue (₹)"
                    stroke="#0F766E"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#14B8A6', stroke: '#0F766E', strokeWidth: 2 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Product-wise Revenue Comparison */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-brand-muted mb-2">
              Product-wise Revenue Comparison
            </h4>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={productRevenueData}
                  layout="vertical"
                  margin={{ top: 10, right: 20, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11, fill: '#64748B' }}
                    tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                  />
                  <YAxis
                    type="category"
                    dataKey="product"
                    width={110}
                    tick={{ fontSize: 11, fill: '#0F172A' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderColor: '#E2E8F0',
                      borderRadius: '12px',
                      fontSize: '12px',
                    }}
                    formatter={(val) => [formatCurrency(val), 'Product Revenue']}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar
                    dataKey="revenue"
                    name="Product Revenue (₹)"
                    fill="#14B8A6"
                    radius={[0, 6, 6, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SalesRevenueChart;


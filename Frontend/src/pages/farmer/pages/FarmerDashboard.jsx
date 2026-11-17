import { useMemo, useState } from 'react';
import {
  Sprout,
  Boxes,
  CheckCircle2,
  TrendingUp,
  CreditCard,
  ShieldCheck,
  Plus,
  ArrowRight,
  Search,
  Building2,
  Users,
  ShoppingBag,
} from 'lucide-react';
import { useFarmer } from '../context/FarmerContext';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import { formatCurrency, formatDate, buyerCategoryStyles } from '../utils/farmerHelpers';

export default function FarmerDashboard() {
  const {
    crops,
    sales,
    otpRequests,
    searchQuery,
    navigateTo,
    setSelectedTransaction,
    setActiveOtpRequest,
    profile,
  } = useFarmer();

  const [activeChartMetric, setActiveChartMetric] = useState('value'); // 'value' or 'quantity'

  // Summary Metrics Calculated in Real-Time
  const totalCropTypes = crops.length;
  const totalAvailableStock = useMemo(
    () => crops.reduce((sum, c) => sum + (Number(c.availableQuantity) || 0), 0),
    [crops]
  );
  const totalQuantitySold = useMemo(
    () => crops.reduce((sum, c) => sum + (Number(c.soldQuantity) || 0), 0),
    [crops]
  );
  const totalSalesAmount = useMemo(
    () =>
      sales
        .filter((s) => s.transactionStatus === 'Confirmed')
        .reduce((sum, s) => sum + (Number(s.totalAmount) || 0), 0),
    [sales]
  );
  const expectedReceivables = useMemo(
    () =>
      sales
        .filter(
          (s) =>
            s.transactionStatus === 'Confirmed' &&
            s.paymentStatus === 'Payment Expected'
        )
        .reduce((sum, s) => sum + (Number(s.totalAmount) || 0), 0),
    [sales]
  );
  const pendingOtpList = useMemo(
    () => otpRequests.filter((o) => o.otpStatus === 'Pending'),
    [otpRequests]
  );

  const searchTerm = (searchQuery || '').trim().toLowerCase();

  // Recent Sales (latest 5)
  const recentSales = useMemo(() => {
    if (!searchTerm) return sales.slice(0, 5);

    return sales.filter((item) => {
      const haystack = [
        item.id,
        item.cropName,
        item.buyerName,
        item.buyerCategory,
        item.transactionStatus,
        item.otpStatus,
      ]
        .join(' ')
        .toLowerCase();

      return haystack.includes(searchTerm);
    });
  }, [sales, searchTerm]);

  // Monthly Sales Chart Data
  const monthlyData = [
    { month: 'Sep', qty: 110, value: 2.85 },
    { month: 'Oct', qty: 160, value: 4.12 },
    { month: 'Nov', qty: 195, value: 5.34 },
    { month: 'Dec', qty: 240, value: 6.95 },
    { month: 'Jan', qty: 310, value: 8.64 },
    { month: 'Feb', qty: 380, value: 10.42 },
  ];

  // Crop-wise Sales Breakdown
  const cropSalesBreakdown = [
    { name: 'Paddy', qty: 195, value: 4.38, pct: 36, color: '#0F766E' },
    { name: 'Turmeric', qty: 40, value: 3.36, pct: 28, color: '#D97706' },
    { name: 'Groundnut', qty: 70, value: 4.27, pct: 20, color: '#0284C7' },
    { name: 'Maize', qty: 95, value: 2.51, pct: 10, color: '#EAB308' },
    { name: 'Chilli & Cotton', qty: 45, value: 5.37, pct: 6, color: '#DC2626' },
  ];

  // Sales Distribution by Buyer Category
  const buyerDistribution = [
    { category: 'Middlemen', count: 4, amount: 952500, share: 45, color: '#0284C7', icon: Users },
    { category: 'Vendors', count: 5, amount: 812800, share: 38, color: '#7C3AED', icon: Building2 },
    { category: 'Customers', count: 2, amount: 352500, share: 17, color: '#16A34A', icon: ShoppingBag },
  ];

  // Expected Payments Status
  const paymentBreakdown = [
    { label: 'Expected (Within 3 Days)', amount: expectedReceivables, color: '#D97706', pct: 62 },
    { label: 'Received & Settled', amount: 677800, color: '#16A34A', pct: 33 },
    { label: 'Delayed / Audit Pending', amount: 75000, color: '#DC2626', pct: 5 },
  ];

  const recentSalesColumns = [
    {
      key: 'id',
      label: 'Txn ID',
      render: (val, row) => (
        <span
          className="font-bold text-[#0F766E] hover:underline cursor-pointer"
          onClick={() => setSelectedTransaction(row)}
        >
          {val}
        </span>
      ),
    },
    {
      key: 'date',
      label: 'Date',
      render: (val) => formatDate(val),
    },
    {
      key: 'cropName',
      label: 'Crop Name',
      render: (val) => <span className="font-semibold text-slate-900">{val}</span>,
    },
    {
      key: 'buyerName',
      label: 'Buyer Name',
      render: (val) => <span className="text-slate-800 font-medium">{val}</span>,
    },
    {
      key: 'buyerCategory',
      label: 'Buyer Category',
      render: (val) => {
        const style = buyerCategoryStyles[val] || { bg: '#F1F5F9', color: '#475569' };
        return (
          <span
            className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold"
            style={{ backgroundColor: style.bg, color: style.color }}
          >
            {val}
          </span>
        );
      },
    },
    {
      key: 'quantity',
      label: 'Qty Sold',
      render: (val, row) => `${val} ${row.unit}`,
    },
    {
      key: 'rate',
      label: 'Rate',
      render: (val, row) => `${formatCurrency(val)}/${row.unit}`,
    },
    {
      key: 'totalAmount',
      label: 'Total Amount',
      render: (val) => (
        <span className="font-extrabold text-[#0F766E]">{formatCurrency(val)}</span>
      ),
    },
    {
      key: 'transactionStatus',
      label: 'Txn Status',
      badge: 'transactionStatus',
    },
    {
      key: 'otpStatus',
      label: 'OTP Status',
      badge: 'otpStatus',
    },
    {
      key: 'expectedPaymentDate',
      label: 'Expected Payment',
      render: (val) => formatDate(val),
    },
    {
      key: 'actions',
      label: 'Action',
      render: (_, row) => (
        <button
          type="button"
          className="px-3 py-1 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
          onClick={() => setSelectedTransaction(row)}
        >
          Details
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Search notification banner if filtered */}
      {searchTerm && (
        <div className="bg-[#CCFBF1]/40 border border-[#0F766E]/20 rounded-xl p-3 px-4 flex items-center justify-between text-xs font-semibold text-[#0F766E]">
          <span className="flex items-center gap-1.5">
            <Search className="w-3.5 h-3.5" />
            Showing search results for &quot;<strong className="text-slate-900">{searchQuery}</strong>&quot;
          </span>
          <span className="text-slate-500">
            {recentSales.length} match{recentSales.length === 1 ? '' : 'es'} found
          </span>
        </div>
      )}

      {/* Page Header and Welcome Section */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#CCFBF1] text-[#0F766E] border border-[#0F766E]/20 text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-[#0F766E] animate-pulse" />
            Live Agricultural Trading Portal
          </div>
          <h1 className="text-xl md:text-2xl font-extrabold text-slate-900">
            Welcome back, {profile.farmerName || 'Farmer'}!
          </h1>
          <p className="text-xs md:text-sm text-slate-500 max-w-2xl">
            {profile.farmName || 'Kisan Agro Enterprise'} • {profile.village || 'Dispatch Center'}, {profile.district || 'Andhra Pradesh'}.
            Mandi rates for Paddy and Chilli are trending upward across AP and Telangana markets today.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => navigateTo('sell')}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs md:text-sm font-semibold rounded-lg bg-[#0F766E] hover:bg-[#115E59] text-white shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Create Sale Order
          </button>
          <button
            type="button"
            onClick={() => navigateTo('crops')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs md:text-sm font-semibold rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <Sprout className="w-4 h-4 text-[#0F766E]" />
            Manage Crops
          </button>
          <button
            type="button"
            onClick={() => navigateTo('prices')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs md:text-sm font-semibold rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <TrendingUp className="w-4 h-4 text-[#0F766E]" />
            Mandi Prices
          </button>
        </div>
      </div>

      {/* KPI Statistic Cards (6 Standard Summary Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Card 1 */}
        <div
          onClick={() => navigateTo('crops')}
          className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-[#CCFBF1] text-[#0F766E] flex items-center justify-center font-bold">
              <Sprout className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              +2 Season
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-900">{totalCropTypes} Crops</div>
            <div className="text-xs font-semibold text-slate-500">Total Crop Types</div>
            <div className="text-[11px] text-slate-400 mt-1 truncate">Paddy, Turmeric, Groundnut</div>
          </div>
        </div>

        {/* Card 2 */}
        <div
          onClick={() => navigateTo('stock')}
          className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-[#CCFBF1] text-[#0F766E] flex items-center justify-center font-bold">
              <Boxes className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-50 text-slate-600 border border-slate-200">
              3 Storage Bays
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-900">{totalAvailableStock} qtl</div>
            <div className="text-xs font-semibold text-slate-500">Available Stock</div>
            <div className="text-[11px] text-slate-400 mt-1 truncate">Ready for sale &amp; dispatch</div>
          </div>
        </div>

        {/* Card 3 */}
        <div
          onClick={() => navigateTo('sales')}
          className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-[#CCFBF1] text-[#0F766E] flex items-center justify-center font-bold">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              +18.4% MoM
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-900">{totalQuantitySold} qtl</div>
            <div className="text-xs font-semibold text-slate-500">Quantity Sold</div>
            <div className="text-[11px] text-slate-400 mt-1 truncate">Dispatched across 8 orders</div>
          </div>
        </div>

        {/* Card 4 */}
        <div
          onClick={() => navigateTo('sales')}
          className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-[#CCFBF1] text-[#0F766E] flex items-center justify-center font-bold">
              <TrendingUp className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              +14.2% Growth
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-900">{formatCurrency(totalSalesAmount)}</div>
            <div className="text-xs font-semibold text-slate-500">Total Sales Amount</div>
            <div className="text-[11px] text-slate-400 mt-1 truncate">Confirmed transactions</div>
          </div>
        </div>

        {/* Card 5 */}
        <div
          onClick={() => navigateTo('sales')}
          className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center font-bold">
              <CreditCard className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
              Due in 3 Days
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-900">{formatCurrency(expectedReceivables)}</div>
            <div className="text-xs font-semibold text-slate-500">Expected Receivables</div>
            <div className="text-[11px] text-slate-400 mt-1 truncate">Awaiting bank settlement</div>
          </div>
        </div>

        {/* Card 6 */}
        <div
          onClick={() => navigateTo('otp')}
          className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-[#CCFBF1] text-[#0F766E] flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <span
              className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                pendingOtpList.length > 0
                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              }`}
            >
              {pendingOtpList.length > 0 ? 'Action Required' : 'All Clear'}
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-900">{pendingOtpList.length} Orders</div>
            <div className="text-xs font-semibold text-slate-500">Pending OTPs</div>
            <div className="text-[11px] text-slate-400 mt-1 truncate">Buyer verification security</div>
          </div>
        </div>
      </div>

      {/* Pending OTP Confirmations Quick Action Card */}
      {pendingOtpList.length > 0 && (
        <div className="bg-white rounded-xl border border-amber-200 p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm md:text-base font-bold text-slate-900">
                  Pending Buyer OTP Confirmations ({pendingOtpList.length})
                </h3>
                <p className="text-xs text-slate-500">
                  Incoming purchase orders require OTP confirmation before reserved stock is deducted.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigateTo('otp')}
              className="inline-flex items-center gap-1 text-xs font-bold text-[#0F766E] hover:underline cursor-pointer"
            >
              View All OTPs ({otpRequests.length})
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {pendingOtpList.map((otp) => (
              <div
                key={otp.id}
                className="p-4 rounded-xl bg-amber-50/40 border border-amber-200 flex flex-col justify-between gap-3"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-[#0F766E]">{otp.transactionId}</span>
                    <StatusBadge status={otp.otpStatus} />
                  </div>
                  <div className="text-sm font-bold text-slate-900 mt-2">
                    {otp.crop} • {otp.quantity} {otp.unit}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Buyer: <strong className="text-slate-700">{otp.buyerName}</strong> ({otp.buyerCategory})
                  </div>
                  <div className="text-base font-extrabold text-slate-900 mt-2">
                    {formatCurrency(otp.totalAmount)}
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-amber-200/60">
                  <button
                    type="button"
                    onClick={() => setActiveOtpRequest(otp)}
                    className="flex-1 py-1.5 text-xs font-bold rounded-lg bg-[#0F766E] hover:bg-[#115E59] text-white transition-colors cursor-pointer"
                  >
                    Confirm OTP
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const match = sales.find((s) => s.id === otp.transactionId);
                      if (match) setSelectedTransaction(match);
                    }}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4 Professional Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Monthly Crop Sales Growth */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm md:text-base font-bold text-slate-900">
                Monthly Crop Sales Growth
              </h3>
              <p className="text-xs text-slate-500">
                Quantity (qtl) vs Sales Turnover (₹ in Lakhs)
              </p>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-lg border border-slate-200">
              <button
                type="button"
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                  activeChartMetric === 'value'
                    ? 'bg-[#0F766E] text-white shadow-xs'
                    : 'text-slate-600 hover:bg-white'
                }`}
                onClick={() => setActiveChartMetric('value')}
              >
                ₹ Value
              </button>
              <button
                type="button"
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                  activeChartMetric === 'quantity'
                    ? 'bg-[#0F766E] text-white shadow-xs'
                    : 'text-slate-600 hover:bg-white'
                }`}
                onClick={() => setActiveChartMetric('quantity')}
              >
                Quintals (qtl)
              </button>
            </div>
          </div>

          <div className="flex items-end gap-3 h-48 pt-4 border-b border-slate-100 px-2">
            {monthlyData.map((d) => {
              const maxVal = activeChartMetric === 'value' ? 12 : 420;
              const current = activeChartMetric === 'value' ? d.value : d.qty;
              const heightPct = Math.round((current / maxVal) * 100);

              return (
                <div key={d.month} className="flex-1 flex flex-col items-center h-full justify-end group">
                  <span className="text-[11px] font-bold text-[#0F766E] mb-1.5 opacity-90 group-hover:scale-105 transition-transform">
                    {activeChartMetric === 'value' ? `₹${d.value}L` : `${d.qty}q`}
                  </span>
                  <div
                    style={{ height: `${heightPct}%` }}
                    className="w-4/5 max-w-[42px] bg-gradient-to-t from-[#115E59] to-[#0F766E] rounded-t-md transition-all group-hover:brightness-110"
                  />
                  <span className="text-xs font-semibold text-slate-500 mt-2">
                    {d.month}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chart 2: Crop-Wise Sales Volume */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm md:text-base font-bold text-slate-900">
                Crop-Wise Sales Volume
              </h3>
              <p className="text-xs text-slate-500">Distribution across harvested crops</p>
            </div>
            <span className="text-xs font-bold text-[#0F766E] bg-[#CCFBF1] px-2.5 py-1 rounded-md">
              Total: 440 qtl
            </span>
          </div>

          <div className="space-y-3 pt-1">
            {cropSalesBreakdown.map((item) => (
              <div key={item.name} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-900">{item.name}</span>
                  <span className="text-slate-500">
                    {item.qty} qtl (₹{item.value} Lakhs) • <strong className="text-slate-800">{item.pct}%</strong>
                  </span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${item.pct}%`, backgroundColor: item.color }}
                    className="h-full rounded-full transition-all duration-500"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chart 3: Sales Channel Distribution */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm md:text-base font-bold text-slate-900">
                Sales Channel Distribution
              </h3>
              <p className="text-xs text-slate-500">Middlemen, Vendors &amp; Direct Consumers</p>
            </div>
            <span className="text-xs font-semibold text-slate-500">100% Verified Trades</span>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {buyerDistribution.map((b) => {
              const Icon = b.icon;
              return (
                <div
                  key={b.category}
                  className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200 text-center flex flex-col items-center justify-center"
                >
                  <Icon className="w-5 h-5 mb-1" style={{ color: b.color }} />
                  <div className="text-xl font-extrabold" style={{ color: b.color }}>
                    {b.share}%
                  </div>
                  <div className="text-xs font-bold text-slate-800 mt-0.5">{b.category}</div>
                  <div className="text-[11px] text-slate-500">{formatCurrency(b.amount)}</div>
                  <div className="text-[10px] font-bold text-[#0F766E] mt-1">{b.count} Orders</div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 h-2.5 flex rounded-full overflow-hidden">
            <div style={{ width: '45%', backgroundColor: '#0284C7' }} title="Middlemen: 45%" />
            <div style={{ width: '38%', backgroundColor: '#7C3AED' }} title="Vendors: 38%" />
            <div style={{ width: '17%', backgroundColor: '#16A34A' }} title="Customers: 17%" />
          </div>
        </div>

        {/* Chart 4: Expected Payments & Cashflow */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm md:text-base font-bold text-slate-900">
                Expected Payments &amp; Settlement Timeline
              </h3>
              <p className="text-xs text-slate-500">Automated APMC bank escrow settlement</p>
            </div>
          </div>

          <div className="space-y-2.5">
            {paymentBreakdown.map((p) => (
              <div
                key={p.label}
                className="flex items-center justify-between p-3 rounded-lg bg-slate-50/80 border border-slate-200"
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: p.color }}
                  />
                  <span className="text-xs font-bold text-slate-800">{p.label}</span>
                </div>
                <div className="text-right">
                  <div className="text-xs font-extrabold text-slate-900">
                    {formatCurrency(p.amount)}
                  </div>
                  <span className="text-[10px] text-slate-400">{p.pct}% of monthly revenue</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Sales Table */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm md:text-base font-bold text-slate-900">
              Recent Sales Transactions
            </h3>
            <p className="text-xs text-slate-500">
              Latest transactions across Middleman, Vendor, and Direct Consumer channels
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigateTo('sales')}
            className="inline-flex items-center gap-1 text-xs font-bold text-[#0F766E] hover:underline cursor-pointer"
          >
            View Full Sales History ({sales.length})
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <DataTable columns={recentSalesColumns} rows={recentSales} />
      </div>
    </div>
  );
}

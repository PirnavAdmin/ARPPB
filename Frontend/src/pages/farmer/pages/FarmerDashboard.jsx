import { useMemo, useState } from 'react';
import {
  LayoutDashboard,
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
  RefreshCw,
  MapPin,
  Calendar,
  Receipt,
  Eye,
} from 'lucide-react';
import { toast } from 'sonner';
import { useFarmer } from '../context/FarmerContext';
import FarmerPageHeader from '../components/FarmerPageHeader';
import FarmerStatCard from '../components/FarmerStatCard';
import { formatCurrency, formatDate, buyerCategoryStyles } from '../utils/farmerHelpers';

export default function FarmerDashboard() {
  const {
    crops,
    sales,
    otpRequests,
    searchQuery,
    navigateTo,
    setSelectedTransaction,
    profile,
  } = useFarmer();

  const [activeChartMetric, setActiveChartMetric] = useState('value'); // 'value' or 'quantity'
  const [lastRefreshed, setLastRefreshed] = useState(() => new Date());

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

  const handleRefresh = () => {
    setLastRefreshed(new Date());
    toast.success('Farmer Dashboard refreshed successfully.');
  };

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

      {/* Page Header (Matches VendorPageHeader & CustomerPageHeader) */}
      <FarmerPageHeader
        title="Farmer Dashboard"
        subtitle="Overview of your agricultural harvest inventory, active mandi prices, dispatches, and bank settlements."
        icon={LayoutDashboard}
        badge="Live Agricultural Trading Portal"
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => navigateTo('sell')}
              className="inline-flex items-center justify-center gap-2 h-9 px-4 rounded-xl text-xs font-semibold bg-[#0F766E] text-white hover:bg-[#115E59] transition-all duration-200 cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2] shrink-0" />
              <span>Create Sale Order</span>
            </button>
            <button
              type="button"
              onClick={() => navigateTo('prices')}
              className="inline-flex items-center justify-center gap-2 h-9 px-3.5 rounded-xl text-xs font-semibold bg-[#CCFBF1] text-[#0F766E] border border-[#14B8A6]/30 hover:bg-[#115E59] hover:text-white transition-all duration-200 cursor-pointer shadow-2xs"
            >
              <TrendingUp className="w-3.5 h-3.5 stroke-[2] shrink-0" />
              <span>Mandi Prices</span>
            </button>
            <button
              type="button"
              onClick={handleRefresh}
              className="inline-flex items-center justify-center gap-2 h-9 px-3.5 rounded-xl text-xs font-semibold bg-white text-[#0F766E] border border-[#E2E8F0] hover:bg-slate-50 transition-all duration-200 cursor-pointer shadow-2xs"
            >
              <RefreshCw className="w-3.5 h-3.5 stroke-[2] shrink-0" />
              <span>Refresh</span>
            </button>
          </div>
        }
      />

      {/* Business & Farm Info Bar (Matches Vendor & Middleman info bars) */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] px-5 py-3.5 flex flex-wrap items-center justify-between gap-4 text-xs text-[#64748B] shadow-xs">
        <div className="flex flex-wrap items-center gap-4 sm:gap-5">
          <div className="inline-flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-[#CCFBF1] text-[#0F766E] flex items-center justify-center shrink-0">
              <Building2 className="w-4 h-4 stroke-[2]" />
            </span>
            <span className="font-bold text-sm text-[#0F766E]">
              {profile.farmName || 'Kisan Agro Enterprise'}
            </span>
          </div>

          <span className="hidden sm:inline-block h-4 w-px bg-[#E2E8F0]" aria-hidden="true" />

          <div className="inline-flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-[#F8FAFC] text-[#0F766E] border border-[#E2E8F0] flex items-center justify-center shrink-0">
              <MapPin className="w-3.5 h-3.5 stroke-[2]" />
            </span>
            <span>
              Village / Mandal:{' '}
              <strong className="font-semibold text-[#0F172A]">
                {profile.village ? `${profile.village}, ${profile.district || 'Kurnool'}` : 'Kurnool Hub'}
              </strong>
            </span>
          </div>

          <span className="hidden sm:inline-block h-4 w-px bg-[#E2E8F0]" aria-hidden="true" />

          <div className="inline-flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-[#F8FAFC] text-[#0F766E] border border-[#E2E8F0] flex items-center justify-center shrink-0">
              <Calendar className="w-3.5 h-3.5 stroke-[2]" />
            </span>
            <span>
              Current Crop Season:{' '}
              <strong className="font-semibold text-[#0F172A]">Rabi / Kharif 2026</strong>
            </span>
          </div>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F8FAFC] border border-[#E2E8F0] text-xs font-medium text-[#64748B]">
          <span className="w-2 h-2 rounded-full bg-[#16A34A]" aria-hidden="true" />
          <span>Last synced: {lastRefreshed.toLocaleTimeString('en-IN')}</span>
        </div>
      </div>

      {/* 6 Standard Summary KPI Cards (Using FarmerStatCard matching VendorStatCard) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <FarmerStatCard
          title="Total Crops"
          value={`${totalCropTypes} Types`}
          subtitle="Paddy, Turmeric, Groundnut"
          icon={Sprout}
          trend={{ value: '+2 Season', direction: 'up' }}
          onClick={() => navigateTo('crops')}
        />
        <FarmerStatCard
          title="Available Stock"
          value={`${totalAvailableStock} qtl`}
          subtitle="Ready for dispatch"
          icon={Boxes}
          onClick={() => navigateTo('crops')}
        />
        <FarmerStatCard
          title="Quantity Sold"
          value={`${totalQuantitySold} qtl`}
          subtitle="Dispatched across orders"
          icon={CheckCircle2}
          trend={{ value: '+18.4% MoM', direction: 'up' }}
          onClick={() => navigateTo('sales')}
        />
        <FarmerStatCard
          title="Gross Sales"
          value={formatCurrency(totalSalesAmount)}
          subtitle="Total confirmed sales"
          icon={TrendingUp}
          onClick={() => navigateTo('sales')}
        />
        <FarmerStatCard
          title="Receivables"
          value={formatCurrency(expectedReceivables)}
          subtitle="Pending settlement"
          icon={CreditCard}
          trend={{ value: 'Expected', direction: 'up' }}
          onClick={() => navigateTo('sales')}
        />
        <FarmerStatCard
          title="Buyer OTP Pending"
          value={`${pendingOtpList.length} Pending`}
          subtitle="Awaiting authorization"
          icon={ShieldCheck}
          trend={pendingOtpList.length > 0 ? { value: 'Action req.', direction: 'down' } : null}
          onClick={() => navigateTo('otp')}
        />
      </div>

      {/* Pending OTP Authorization Alert Bar if any */}
      {pendingOtpList.length > 0 && (
        <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-amber-900">
                {pendingOtpList.length} Buyer OTP Confirmation{pendingOtpList.length > 1 ? 's' : ''} Awaiting Your Verification
              </h4>
              <p className="text-xs text-amber-700 mt-0.5">
                Buyers have requested dispatch confirmation. Authorize the transaction to trigger instant ledger &amp; bank settlement.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigateTo('otp')}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors cursor-pointer shrink-0 self-start sm:self-center"
          >
            <span>Review OTP Queue</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Charts & Visual Analytics Section (Grid of 2 Columns) */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Chart 1: Monthly Sales & Production Performance */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E2E8F0]">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-[#0F766E] tracking-tight">
                  Monthly Sales &amp; Production Performance
                </h3>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Last 6 months volume and revenue trends across AP &amp; Telangana Mandis
                </p>
              </div>

              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] shrink-0 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setActiveChartMetric('value')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeChartMetric === 'value'
                      ? 'bg-[#0F766E] text-white shadow-xs'
                      : 'text-[#64748B] hover:text-[#0F172A]'
                  }`}
                >
                  Revenue (₹ Lakh)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveChartMetric('quantity')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeChartMetric === 'quantity'
                      ? 'bg-[#0F766E] text-white shadow-xs'
                      : 'text-[#64748B] hover:text-[#0F172A]'
                  }`}
                >
                  Quantity (Qtl)
                </button>
              </div>
            </div>

            {/* Visual Bars Container */}
            <div className="pt-6 pb-2">
              <div className="flex items-end justify-between gap-3 sm:gap-6 h-48 px-2">
                {monthlyData.map((d) => {
                  const maxVal = 12;
                  const maxQty = 400;
                  const heightPct =
                    activeChartMetric === 'value'
                      ? Math.round((d.value / maxVal) * 100)
                      : Math.round((d.qty / maxQty) * 100);

                  return (
                    <div key={d.month} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                      <div className="text-[11px] font-bold text-[#0F766E] opacity-0 group-hover:opacity-100 transition-opacity">
                        {activeChartMetric === 'value' ? `₹${d.value}L` : `${d.qty}q`}
                      </div>
                      <div
                        style={{ height: `${Math.max(12, heightPct)}%` }}
                        className="w-full max-w-[42px] rounded-t-xl bg-gradient-to-t from-[#0F766E] to-[#14B8A6] group-hover:brightness-110 transition-all duration-300 shadow-2xs relative"
                      />
                      <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider">
                        {d.month}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[#E2E8F0] flex items-center justify-between text-xs text-[#64748B]">
            <span>Average monthly growth rate: <strong className="text-[#0F766E]">+16.8%</strong></span>
            <button
              type="button"
              onClick={() => navigateTo('sales')}
              className="text-[#0F766E] font-bold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>View Full Ledger</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Chart 2: Crop-wise Harvest & Sales Breakdown */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-[#E2E8F0]">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-[#0F766E] tracking-tight">
                  Crop Harvest &amp; Revenue Distribution
                </h3>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Breakdown by harvested agricultural commodity
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigateTo('crops')}
                className="text-xs text-[#0F766E] font-bold hover:underline cursor-pointer"
              >
                Manage Crops
              </button>
            </div>

            <div className="pt-4 space-y-3.5">
              {cropSalesBreakdown.map((crop) => (
                <div key={crop.name} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#0F172A]">{crop.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[#64748B] font-medium">{crop.qty} qtl</span>
                      <span className="font-extrabold text-[#0F766E]">₹{crop.value} Lakh</span>
                      <span className="px-1.5 py-0.2 rounded-md bg-[#F8FAFC] border border-[#E2E8F0] font-bold text-[10px] text-[#64748B]">
                        {crop.pct}%
                      </span>
                    </div>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-[#F1F5F9] overflow-hidden">
                    <div
                      style={{ width: `${crop.pct}%`, backgroundColor: crop.color }}
                      className="h-full rounded-full transition-all duration-500"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-[#E2E8F0] flex items-center justify-between text-xs text-[#64748B]">
            <span>Leading crop: <strong className="text-[#0F172A]">Paddy (BPT 5204 Samba)</strong></span>
            <span>Total Harvest Value: <strong className="text-[#0F766E]">₹20.68 Lakh</strong></span>
          </div>
        </div>
      </div>

      {/* Distribution & Settlement Status Row (2 Columns) */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Buyer Channel Distribution */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 sm:p-6 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-[#E2E8F0]">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-[#0F766E] tracking-tight">
                Sales by Buyer Channel
              </h3>
              <p className="text-xs text-[#64748B] mt-0.5">
                Procurement volume split between vendors, middlemen, and direct buyers
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#CCFBF1] text-[#0F766E]">
              11 Orders
            </span>
          </div>

          <div className="pt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {buyerDistribution.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.category}
                  className="p-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] flex flex-col justify-between space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div
                      style={{ backgroundColor: `${item.color}15`, color: item.color }}
                      className="w-8 h-8 rounded-lg flex items-center justify-center font-bold"
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-extrabold text-[#0F766E]">{item.share}%</span>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#0F172A]">{item.category}</div>
                    <div className="text-sm font-extrabold text-[#0F766E] mt-0.5">
                      {formatCurrency(item.amount)}
                    </div>
                    <div className="text-[11px] text-[#64748B] mt-0.5">
                      {item.count} Confirmed Orders
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Payment Settlement Health */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-[#E2E8F0]">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-[#0F766E] tracking-tight">
                  Bank Settlement Health
                </h3>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Direct Mandi ECS and RTGS settlement timelines
                </p>
              </div>
              <span className="inline-flex items-center gap-1 text-xs font-bold text-[#16A34A]">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Treasury Active
              </span>
            </div>

            <div className="pt-4 space-y-3.5">
              {paymentBreakdown.map((item) => (
                <div key={item.label} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#0F172A]">{item.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-[#0F766E]">
                        {formatCurrency(item.amount)}
                      </span>
                      <span className="px-1.5 py-0.2 rounded-md bg-[#F8FAFC] border border-[#E2E8F0] font-bold text-[10px] text-[#64748B]">
                        {item.pct}%
                      </span>
                    </div>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#F1F5F9] overflow-hidden">
                    <div
                      style={{ width: `${item.pct}%`, backgroundColor: item.color }}
                      className="h-full rounded-full transition-all duration-500"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-[#E2E8F0] flex items-center justify-between text-xs text-[#64748B]">
            <span>Bank: <strong className="text-[#0F172A]">{profile.bankDetails?.bankName || 'State Bank of India'}</strong></span>
            <span>A/C: <strong className="font-mono text-[#0F766E]">•••• {String(profile.bankDetails?.accountNumber || '4820').slice(-4)}</strong></span>
          </div>
        </div>
      </div>

      {/* Recent Sales Transactions Table (Matches VendorDataTable layout & design) */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-xs overflow-hidden">
        <div className="p-5 border-b border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2.5">
              <h3 className="text-base font-bold text-[#0F766E] tracking-tight">
                Recent Sales Transactions
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#CCFBF1] text-[#0F766E] border border-[#14B8A6]/30">
                Latest {recentSales.length} Transactions
              </span>
            </div>
            <p className="text-xs text-[#64748B] mt-0.5">
              Track purchase orders, quantity dispatched, OTP clearance, and payment settlement dates
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => navigateTo('sales')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E2E8F0] text-xs font-semibold text-[#0F766E] hover:bg-[#F8FAFC] transition-colors cursor-pointer"
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>All Sales History</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] uppercase tracking-wider font-bold">
                <th className="py-3 px-4">Txn ID</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Crop Name</th>
                <th className="py-3 px-4">Buyer Name</th>
                <th className="py-3 px-4">Channel</th>
                <th className="py-3 px-4">Qty Sold</th>
                <th className="py-3 px-4">Rate</th>
                <th className="py-3 px-4">Total Amount</th>
                <th className="py-3 px-4">Txn Status</th>
                <th className="py-3 px-4">OTP Status</th>
                <th className="py-3 px-4">Expected Payment</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {recentSales.length === 0 ? (
                <tr>
                  <td colSpan="12" className="py-8 text-center text-xs text-[#64748B]">
                    No sales transactions match your search filter.
                  </td>
                </tr>
              ) : (
                recentSales.map((row) => {
                  const channelStyle = buyerCategoryStyles[row.buyerCategory] || {
                    bg: '#F1F5F9',
                    color: '#475569',
                  };

                  return (
                    <tr
                      key={row.id}
                      className="hover:bg-[#CCFBF1]/20 transition-colors"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-[#0F766E]">
                        <button
                          type="button"
                          onClick={() => setSelectedTransaction(row)}
                          className="hover:underline cursor-pointer"
                        >
                          {row.id}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-[#64748B] whitespace-nowrap">
                        {formatDate(row.date)}
                      </td>
                      <td className="py-3 px-4 font-bold text-[#0F172A] whitespace-nowrap">
                        {row.cropName}
                      </td>
                      <td className="py-3 px-4 font-medium text-[#0F172A] whitespace-nowrap">
                        {row.buyerName}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold"
                          style={{ backgroundColor: channelStyle.bg, color: channelStyle.color }}
                        >
                          {row.buyerCategory}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[#0F172A] whitespace-nowrap">
                        {row.quantity} {row.unit}
                      </td>
                      <td className="py-3 px-4 text-[#64748B] whitespace-nowrap">
                        {formatCurrency(row.rate)}/{row.unit}
                      </td>
                      <td className="py-3 px-4 font-extrabold text-[#0F766E] whitespace-nowrap">
                        {formatCurrency(row.totalAmount)}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${
                            row.transactionStatus === 'Confirmed'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {row.transactionStatus}
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${
                            row.otpStatus === 'Confirmed'
                              ? 'bg-[#CCFBF1] text-[#0F766E] border border-[#14B8A6]/30'
                              : row.otpStatus === 'Pending'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {row.otpStatus}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[#64748B] whitespace-nowrap">
                        {formatDate(row.expectedPaymentDate)}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setSelectedTransaction(row)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A] hover:bg-[#F8FAFC] hover:text-[#0F766E] transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Details</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

import { useState, useMemo } from 'react';
import { LayoutDashboard, RefreshCw, Download, Building2, MapPin, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../../hooks/useAuth';
import { useVendor } from '../../../hooks/useVendor';
import VendorPageHeader from '../VendorPageHeader';
import VendorDatePicker from '../VendorDatePicker';
import DashboardStats from './DashboardStats';
import PurchaseOverviewChart from './PurchaseOverviewChart';
import RawMaterialChart from './RawMaterialChart';
import FinishedProductChart from './FinishedProductChart';
import SalesRevenueChart from './SalesRevenueChart';
import ProfitLossChart from './ProfitLossChart';
import RecentTransactions from './RecentTransactions';
import PendingConfirmations from './PendingConfirmations';
import { isDateInRange, formatDate } from '../../../utils/formatDate';
import { round2, safeNumber } from '../../../utils/calculations';
import { exportToCSV } from '../../../utils/exportUtils';

export function VendorDashboard() {
  const { vendorUser } = useAuth();
  const {
    farmers,
    middlemen,
    purchases,
    inventory,
    processingRecords,
    products,
    orders,
    sales,
    financialSummary,
  } = useVendor();

  const [datePreset, setDatePreset] = useState('all');
  const [customStart, setCustomStart] = useState('2026-10-01');
  const [customEnd, setCustomEnd] = useState('2026-11-05');
  const [lastRefreshed, setLastRefreshed] = useState(() => new Date());

  // Reference date is 2026-11-05 so presets like Today, Yesterday, Last 7 Days, This Month, Last Month match the realistic dataset
  const referenceDate = '2026-11-05';

  const filteredPurchases = useMemo(
    () =>
      purchases.filter((p) =>
        isDateInRange(p.purchaseDate, datePreset, customStart, customEnd, referenceDate)
      ),
    [purchases, datePreset, customStart, customEnd]
  );

  const filteredSales = useMemo(
    () =>
      sales.filter((s) =>
        isDateInRange(s.salesDate, datePreset, customStart, customEnd, referenceDate)
      ),
    [sales, datePreset, customStart, customEnd]
  );

  const filteredOrders = useMemo(
    () =>
      orders.filter((o) =>
        isDateInRange(o.orderDate, datePreset, customStart, customEnd, referenceDate)
      ),
    [orders, datePreset, customStart, customEnd]
  );

  const filteredProcessing = useMemo(
    () =>
      processingRecords.filter((r) =>
        isDateInRange(r.processingDate, datePreset, customStart, customEnd, referenceDate)
      ),
    [processingRecords, datePreset, customStart, customEnd]
  );

  const dashboardMetrics = useMemo(() => {
    const confirmedPurchases = filteredPurchases.filter((p) => p.status === 'Confirmed');
    const totalPurchasesAmount = round2(
      confirmedPurchases.reduce((sum, p) => sum + safeNumber(p.totalAmount, 0), 0)
    );
    const totalPurchaseQty = round2(
      confirmedPurchases.reduce((sum, p) => sum + safeNumber(p.quantity, 0), 0)
    );

    const rawMaterialStockQty = round2(
      inventory.reduce((sum, b) => sum + safeNumber(b.availableQuantity, 0), 0)
    );
    const lowStockRawCount = inventory.filter(
      (b) => safeNumber(b.availableQuantity, 0) <= safeNumber(b.minimumThreshold, 15)
    ).length;

    const completedProc = filteredProcessing.filter((r) => r.status === 'Completed');
    const totalProcessedInputQty = round2(
      completedProc.reduce((sum, r) => sum + safeNumber(r.inputQuantity, 0), 0)
    );

    const finishedQuintalQty = round2(
      products
        .filter((p) => p.unit === 'Quintal')
        .reduce((sum, p) => sum + safeNumber(p.availableQuantity, 0), 0)
    );
    const finishedUnitQty = round2(
      products
        .filter((p) => p.unit !== 'Quintal')
        .reduce((sum, p) => sum + safeNumber(p.availableQuantity, 0), 0)
    );

    const validOrders = filteredOrders.filter((o) => o.orderStatus !== 'Cancelled');
    const completedOrdersCount = validOrders.filter((o) => o.orderStatus === 'Completed').length;
    const activeOrdersCount = validOrders.length - completedOrdersCount;

    const confirmedSales = filteredSales.filter(
      (s) => s.confirmationStatus === 'Verified' && s.salesStatus !== 'Cancelled'
    );
    const totalSalesAmount = round2(
      confirmedSales.reduce((sum, s) => sum + safeNumber(s.totalAmount, 0), 0)
    );

    // Period P&L calculation
    let periodSoldRawMaterialCost = 0;
    confirmedSales.forEach((s) => {
      (s.items || []).forEach((it) => {
        const q = safeNumber(it.sellingQuantity ?? it.quantity, 0);
        const c = safeNumber(it.productionCost, safeNumber(it.pricePerUnit, 0) * 0.76);
        periodSoldRawMaterialCost = round2(periodSoldRawMaterialCost + q * c * 0.88);
      });
    });

    const periodProcessingExpenses = round2(
      completedProc.reduce((sum, r) => sum + safeNumber(r.totalProcessingExpenses, 0), 0)
    );
    const periodEstimatedProfit = round2(
      totalSalesAmount - periodSoldRawMaterialCost - periodProcessingExpenses
    );

    return {
      totalFarmers: farmers.length,
      activeFarmers: farmers.filter((f) => f.status === 'Active').length,
      totalMiddlemen: middlemen.length,
      activeMiddlemen: middlemen.filter((m) => m.status === 'Active').length,
      confirmedPurchasesCount: confirmedPurchases.length,
      totalPurchasesAmount,
      totalPurchaseQty,
      rawMaterialStockQty,
      activeRawBatchesCount: inventory.filter((b) => b.availableQuantity > 0).length,
      lowStockRawCount,
      completedProcessingCount: completedProc.length,
      totalProcessedInputQty,
      finishedProductTypesCount: products.length,
      finishedQuintalQty,
      finishedUnitQty,
      totalOrdersCount: validOrders.length,
      completedOrdersCount,
      activeOrdersCount,
      confirmedSalesCount: confirmedSales.length,
      totalSalesAmount,
      expectedReceivables: financialSummary.expectedReceivables,
      expectedPayables: financialSummary.expectedPayables,
      // Period P&L
      pnl: {
        rawMaterialCost: periodSoldRawMaterialCost,
        processingExpenses: periodProcessingExpenses,
        salesRevenue: totalSalesAmount,
        estimatedProfit: periodEstimatedProfit,
      },
      // Trends (only when viewing all/monthly data where oct vs nov comparison exists)
      farmersTrend: { value: '+10.0%', direction: 'up' },
      middlemenTrend: null,
      purchasesTrend: datePreset === 'all' ? { value: '+14.2%', direction: 'up' } : null,
      processingTrend: datePreset === 'all' ? { value: '+8.5%', direction: 'up' } : null,
      ordersTrend: datePreset === 'all' ? { value: '+12.4%', direction: 'up' } : null,
      salesTrend: datePreset === 'all' ? { value: '+16.8%', direction: 'up' } : null,
    };
  }, [
    farmers,
    middlemen,
    filteredPurchases,
    inventory,
    filteredProcessing,
    products,
    filteredOrders,
    filteredSales,
    financialSummary,
    datePreset,
  ]);

  const handleRefresh = () => {
    setLastRefreshed(new Date());
    toast.success('Dashboard metrics and charts refreshed.');
  };

  const handleExportReport = () => {
    const reportRows = [
      { metric: 'Total Farmers', value: dashboardMetrics.totalFarmers },
      { metric: 'Total Middlemen', value: dashboardMetrics.totalMiddlemen },
      { metric: 'Confirmed Purchases Value (INR)', value: dashboardMetrics.totalPurchasesAmount },
      { metric: 'Raw Material Stock (Quintal)', value: dashboardMetrics.rawMaterialStockQty },
      { metric: 'Completed Processing Batches', value: dashboardMetrics.completedProcessingCount },
      { metric: 'Finished Product Types', value: dashboardMetrics.finishedProductTypesCount },
      { metric: 'Total Customer Orders', value: dashboardMetrics.totalOrdersCount },
      { metric: 'Confirmed Sales Revenue (INR)', value: dashboardMetrics.totalSalesAmount },
      { metric: 'Expected Receivables (INR)', value: dashboardMetrics.expectedReceivables },
      { metric: 'Expected Payables (INR)', value: dashboardMetrics.expectedPayables },
      { metric: 'Estimated Profit (INR)', value: dashboardMetrics.pnl.estimatedProfit },
    ];
    exportToCSV(
      reportRows,
      [
        { key: 'metric', header: 'KPI Metric' },
        { key: 'value', header: 'Value' },
      ],
      `vendor_dashboard_report_${datePreset}.csv`
    );
    toast.success('Dashboard executive report exported to CSV.');
  };

  return (
    <div className="space-y-6">
      <VendorPageHeader
        title="Vendor Dashboard"
        subtitle="Overview of your agricultural business operations."
        icon={LayoutDashboard}
        showBreadcrumb={false}
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            <VendorDatePicker
              preset={datePreset}
              onPresetChange={setDatePreset}
              startDate={customStart}
              endDate={customEnd}
              onStartDateChange={setCustomStart}
              onEndDateChange={setCustomEnd}
            />
            <button
              type="button"
              onClick={handleRefresh}
              className="inline-flex items-center justify-center gap-2 h-9 px-3.5 rounded-xl text-xs font-semibold bg-[#CCFBF1] text-[#0F766E] border border-[#14B8A6]/30 hover:bg-[#115E59] hover:text-white transition-all duration-200 cursor-pointer shadow-2xs"
            >
              <RefreshCw className="w-3.5 h-3.5 stroke-[2] shrink-0" />
              <span>Refresh</span>
            </button>
            <button
              type="button"
              onClick={handleExportReport}
              className="inline-flex items-center justify-center gap-2 h-9 px-4 rounded-xl text-xs font-semibold bg-[#0F766E] text-white hover:bg-[#115E59] transition-all duration-200 cursor-pointer shadow-xs"
            >
              <Download className="w-3.5 h-3.5 stroke-[2] shrink-0" />
              <span>Export Report</span>
            </button>
          </div>
        }
      />

      {/* Business & Branch Info Bar */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] px-5 py-3.5 flex flex-wrap items-center justify-between gap-4 text-xs text-[#64748B] shadow-xs">
        <div className="flex flex-wrap items-center gap-4 sm:gap-5">
          <div className="inline-flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-[#CCFBF1] text-[#0F766E] flex items-center justify-center shrink-0">
              <Building2 className="w-4 h-4 stroke-[2]" />
            </span>
            <span className="font-bold text-sm text-[#0F766E]">
              {vendorUser?.businessName}
            </span>
          </div>

          <span className="hidden sm:inline-block h-4 w-px bg-[#E2E8F0]" aria-hidden="true" />

          <div className="inline-flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-[#F5FAF8] text-[#0F766E] border border-[#E2E8F0] flex items-center justify-center shrink-0">
              <MapPin className="w-3.5 h-3.5 stroke-[2]" />
            </span>
            <span>
              Branch: <strong className="font-semibold text-[#172B29]">{vendorUser?.branchName}</strong>
            </span>
          </div>

          <span className="hidden sm:inline-block h-4 w-px bg-[#E2E8F0]" aria-hidden="true" />

          <div className="inline-flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-[#F5FAF8] text-[#0F766E] border border-[#E2E8F0] flex items-center justify-center shrink-0">
              <Calendar className="w-3.5 h-3.5 stroke-[2]" />
            </span>
            <span>
              Current Date: <strong className="font-semibold text-[#172B29]">{formatDate(referenceDate)}</strong>
            </span>
          </div>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F5FAF8] border border-[#E2E8F0] text-xs font-medium text-[#64748B]">
          <span className="w-2 h-2 rounded-full bg-[#16A34A]" aria-hidden="true" />
          <span>Last synced: {lastRefreshed.toLocaleTimeString('en-IN')}</span>
        </div>
      </div>

      {/* 6.2 10 Summary KPI Cards */}
      <DashboardStats stats={dashboardMetrics} />

      {/* 6.9 Pending Confirmations Panel */}
      <PendingConfirmations />

      {/* 6.3 Purchase Overview & 6.4 Raw Material Inventory Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <PurchaseOverviewChart purchases={filteredPurchases} />
        <RawMaterialChart inventory={inventory} />
      </div>

      {/* 6.5 Finished Product Overview */}
      <FinishedProductChart products={products} />

      {/* 6.6 Sales & Revenue Analytics & 6.7 Profit & Loss Overview */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <SalesRevenueChart sales={filteredSales} />
        </div>
        <div>
          <ProfitLossChart financialData={dashboardMetrics.pnl} />
        </div>
      </div>

      {/* 6.8 Recent Transactions */}
      <RecentTransactions
        purchases={filteredPurchases}
        sales={filteredSales}
        processingRecords={filteredProcessing}
      />
    </div>
  );
}

export default VendorDashboard;


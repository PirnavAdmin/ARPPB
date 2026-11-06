import React, { useState } from 'react';
import {
  Users,
  Building2,
  ShoppingBag,
  ShoppingCart,
  BadgePercent,
  Boxes,
  TrendingDown,
  TrendingUp,
  RotateCw,
  ArrowRight,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useMiddleman } from '../../../context/middleman';
import { formatINR, formatIndianNumber } from '../../../utils/middleman/formatters';
import { DashboardSummaryCard } from '../components/dashboard/DashboardSummaryCard';
import { PurchaseSalesChart } from '../components/dashboard/PurchaseSalesChart';
import { CropInventoryChart } from '../components/dashboard/CropInventoryChart';
import { ProfitOverviewChart } from '../components/dashboard/ProfitOverviewChart';
import { SalesDistributionChart } from '../components/dashboard/SalesDistributionChart';
import { RecentTransactionsTable } from '../components/dashboard/RecentTransactionsTable';
import { PendingConfirmations } from '../components/dashboard/PendingConfirmations';
import { SectionCard } from '../components/common/SectionCard';
import { DateRangePicker } from '../components/common/DateRangePicker';

export const MiddlemanDashboard = () => {
  const navigate = useNavigate();
  const { profile, dashboardMetrics, purchases, vendorSales, customerSales, confirmations } = useMiddleman();

  const [dateFilter, setDateFilter] = useState('This Month');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 500);
  };

  // Combine recent purchases and sales for recent transactions
  const allRecentTransactions = [
    ...purchases.map((p) => ({ ...p, type: 'Farmer Purchase' })),
    ...vendorSales.map((s) => ({ ...s, type: 'Vendor Sale' })),
    ...customerSales.map((c) => ({ ...c, type: 'Customer Sale' })),
  ].sort((a, b) => new Date(b.purchaseDate || b.salesDate) - new Date(a.purchaseDate || a.salesDate));

  const pendingConfirmationsCount = confirmations.filter((c) => c.otpStatus === 'Pending').length;

  return (
    <div className="space-y-6">
      {/* 6.2 Dashboard Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#E2E8F0]">
        <div>
          <span className="text-xs font-semibold text-[#0F766E] uppercase tracking-wider">
            {profile.businessName}
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-[#1F2937] tracking-tight mt-0.5">
            Middleman Dashboard
          </h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            Welcome back, <span className="font-semibold text-[#1F2937]">{profile.ownerName}</span>. Trading health overview for {dateFilter}.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <DateRangePicker value={dateFilter} onChange={setDateFilter} />

          <button
            type="button"
            onClick={handleRefresh}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-[#E2E8F0] bg-white hover:bg-slate-50 text-[#1F2937] cursor-pointer transition-all shadow-2xs"
            title="Refresh dashboard metrics"
          >
            <RotateCw className={`w-3.5 h-3.5 text-[#0F766E] ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* 6.3 All Ten Dashboard Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* 1. Total Farmers */}
        <DashboardSummaryCard
          title="Total Farmers"
          value={formatIndianNumber(dashboardMetrics.totalFarmers)}
          icon={Users}
          description="Registered suppliers"
          trend={{ value: '+2', isPositive: true }}
          accentColor="teal"
        />

        {/* 2. Total Vendors */}
        <DashboardSummaryCard
          title="Total Vendors"
          value={formatIndianNumber(dashboardMetrics.totalVendors)}
          icon={Building2}
          description="Wholesale buyers & mills"
          trend={{ value: '+1', isPositive: true }}
          accentColor="teal"
        />

        {/* 3. Total Customers */}
        <DashboardSummaryCard
          title="Total Customers"
          value={formatIndianNumber(dashboardMetrics.totalCustomers)}
          icon={ShoppingBag}
          description="Retail & local stores"
          trend={{ value: 'Active', isPositive: true }}
          accentColor="teal"
        />

        {/* 4. Total Purchases */}
        <DashboardSummaryCard
          title="Total Purchases"
          value={formatIndianNumber(dashboardMetrics.totalPurchasesCount)}
          icon={ShoppingCart}
          description="Confirmed transactions"
          trend={{ value: '+15%', isPositive: true }}
          accentColor="teal"
        />

        {/* 5. Total Sales */}
        <DashboardSummaryCard
          title="Total Sales"
          value={formatIndianNumber(dashboardMetrics.totalSalesCount)}
          icon={BadgePercent}
          description="Completed orders"
          trend={{ value: '+18%', isPositive: true }}
          accentColor="emerald"
        />

        {/* 6. Available Inventory */}
        <DashboardSummaryCard
          title="Available Inventory"
          value={`${formatIndianNumber(dashboardMetrics.availableInventory)} Qtl`}
          icon={Boxes}
          description="Across 6 active crops"
          trend={{ value: 'Healthy', isPositive: true }}
          accentColor="teal"
        />

        {/* 7. Total Purchase Value */}
        <DashboardSummaryCard
          title="Total Purchase Value"
          value={formatINR(dashboardMetrics.totalPurchaseValue)}
          icon={TrendingDown}
          description="Farmer purchases"
          trend={{ value: 'Inflow', isPositive: true }}
          accentColor="teal"
        />

        {/* 8. Total Sales Value */}
        <DashboardSummaryCard
          title="Total Sales Value"
          value={formatINR(dashboardMetrics.totalSalesValue)}
          icon={TrendingUp}
          description="Revenue generated"
          trend={{ value: '+22%', isPositive: true }}
          accentColor="emerald"
        />

        {/* 9. Expected Receivables */}
        <DashboardSummaryCard
          title="Expected Receivables"
          value={formatINR(dashboardMetrics.expectedReceivables)}
          icon={TrendingUp}
          description="Due from buyers"
          trend={{ value: 'Receivable', isPositive: true }}
          accentColor="amber"
        />

        {/* 10. Expected Payables */}
        <DashboardSummaryCard
          title="Expected Payables"
          value={formatINR(dashboardMetrics.expectedPayables)}
          icon={TrendingDown}
          description="Obligation to farmers"
          trend={{ value: 'Payable', isPositive: false }}
          accentColor="amber"
        />
      </div>

      {/* Main Analytical Grid: Purchase vs Sales & Crop-wise Inventory */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Purchase vs Sales Chart (Spans 2 columns) */}
        <div className="lg:col-span-2">
          <SectionCard
            title="Purchase vs Sales Comparison"
            subtitle="Monthly breakdown of Farmer Purchases vs Vendor and Customer Sales (in INR)"
          >
            <PurchaseSalesChart />
          </SectionCard>
        </div>

        {/* Crop-wise Inventory Distribution (Spans 1 column) */}
        <div>
          <SectionCard
            title="Crop-wise Inventory"
            subtitle="Current stock across active crop batches"
            action={
              <button
                type="button"
                onClick={() => navigate('/middleman/inventory')}
                className="text-xs font-semibold text-[#0F766E] hover:underline"
              >
                View Batches &rarr;
              </button>
            }
          >
            <CropInventoryChart />
          </SectionCard>
        </div>
      </div>

      {/* Secondary Analytical Grid: Profit Overview & Sales Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 6.6 Profit Overview */}
        <SectionCard
          title="Profitability & Landed Cost Breakdown"
          subtitle="Accrued from confirmed sales against batch-allocated FIFO Cost of Goods Sold"
        >
          <ProfitOverviewChart />
        </SectionCard>

        {/* 6.7 Sales Distribution */}
        <SectionCard
          title="Sales Channel Distribution"
          subtitle="Comparison between Wholesale Vendors and Direct Customer buyers"
        >
          <SalesDistributionChart />
        </SectionCard>
      </div>

      {/* 6.9 Pending Confirmations Section */}
      {pendingConfirmationsCount > 0 && (
        <SectionCard
          title="Action Required: Pending Confirmations"
          subtitle="Transactions awaiting OTP authorization from Farmers, Vendors, or Customers"
          badge={
            <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-amber-100 text-[#D97706] border border-amber-200">
              {pendingConfirmationsCount} Pending
            </span>
          }
          action={
            <button
              type="button"
              onClick={() => navigate('/middleman/confirmations')}
              className="inline-flex items-center gap-1 text-xs font-bold text-[#0F766E] hover:underline"
            >
              <span>Manage All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          }
        >
          <PendingConfirmations />
        </SectionCard>
      )}

      {/* 6.8 Recent Transactions Table */}
      <SectionCard
        title="Recent Transactions"
        subtitle="Latest agricultural purchases and sales recorded in the portal"
        action={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/middleman/purchase-history')}
              className="text-xs font-semibold text-[#0F766E] hover:underline"
            >
              Purchases &rarr;
            </button>
            <span className="text-slate-300">|</span>
            <button
              type="button"
              onClick={() => navigate('/middleman/sales-history')}
              className="text-xs font-semibold text-[#0F766E] hover:underline"
            >
              Sales &rarr;
            </button>
          </div>
        }
      >
        <RecentTransactionsTable transactions={allRecentTransactions} />
      </SectionCard>
    </div>
  );
};

export default MiddlemanDashboard;

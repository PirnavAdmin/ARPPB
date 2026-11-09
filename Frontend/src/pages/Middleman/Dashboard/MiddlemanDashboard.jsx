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
  ArrowRight,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useMiddleman } from '../../../context/middleman';
import { formatINR, formatIndianNumber } from '../../../utils/middleman/formatters';
import { DashboardSummaryCard } from '../components/dashboard/DashboardSummaryCard';
import { PurchaseSalesChart } from '../components/dashboard/PurchaseSalesChart';
import { CropInventoryChart } from '../components/dashboard/CropInventoryChart';
import { RecentTransactionsTable } from '../components/dashboard/RecentTransactionsTable';
import { PendingConfirmations } from '../components/dashboard/PendingConfirmations';
import { SectionCard } from '../components/common/SectionCard';

export const MiddlemanDashboard = () => {
  const navigate = useNavigate();
  const { profile, dashboardMetrics, purchases, vendorSales, customerSales, confirmations } = useMiddleman();

  // 0 = First Group (Primary Metrics 1/2), 1 = Second Group (Additional Metrics 2/2)
  const [activeKpiGroup, setActiveKpiGroup] = useState(0);

  // First Group – 5 Primary KPI Cards
  const primaryKpiCards = [
    {
      id: 'total-farmers',
      title: 'Total Farmers',
      value: formatIndianNumber(dashboardMetrics.totalFarmers),
      icon: Users,
      description: 'Registered suppliers',
      trend: { value: '+2', isPositive: true },
      onClick: () => navigate('/middleman/farmers'),
    },
    {
      id: 'total-vendors',
      title: 'Total Vendors',
      value: formatIndianNumber(dashboardMetrics.totalVendors),
      icon: Building2,
      description: 'Wholesale buyers & mills',
      trend: { value: '+1', isPositive: true },
      onClick: () => navigate('/middleman/vendors'),
    },
    {
      id: 'total-customers',
      title: 'Total Customers',
      value: formatIndianNumber(dashboardMetrics.totalCustomers),
      icon: ShoppingBag,
      description: 'Retail & local stores',
      trend: { value: 'Active', isPositive: true },
      onClick: () => navigate('/middleman/customers'),
    },
    {
      id: 'total-purchases',
      title: 'Total Purchases',
      value: formatIndianNumber(dashboardMetrics.totalPurchasesCount),
      icon: ShoppingCart,
      description: 'Confirmed transactions',
      trend: { value: '+15%', isPositive: true },
      onClick: () => navigate('/middleman/sales-history', { state: { activeTab: 'farmer' } }),
    },
    {
      id: 'total-sales',
      title: 'Total Sales',
      value: formatIndianNumber(dashboardMetrics.totalSalesCount),
      icon: BadgePercent,
      description: 'Completed orders',
      trend: { value: '+18%', isPositive: true },
      onClick: () => navigate('/middleman/sales-history', { state: { activeTab: 'vendor' } }),
    },
  ];

  // Second Group – 5 Additional KPI Cards
  const secondaryKpiCards = [
    {
      id: 'available-inventory',
      title: 'Available Inventory',
      value: `${formatIndianNumber(dashboardMetrics.availableInventory)} Qtl`,
      icon: Boxes,
      description: 'Across 6 active crops',
      trend: { value: 'Healthy', isPositive: true },
      onClick: () => navigate('/middleman/inventory'),
    },
    {
      id: 'total-purchase-value',
      title: 'Total Purchase Value',
      value: formatINR(dashboardMetrics.totalPurchaseValue),
      icon: TrendingDown,
      description: 'Farmer purchases',
      trend: { value: 'Inflow', isPositive: true },
      onClick: () => navigate('/middleman/sales-history', { state: { activeTab: 'farmer' } }),
    },
    {
      id: 'total-sales-value',
      title: 'Total Sales Value',
      value: formatINR(dashboardMetrics.totalSalesValue),
      icon: TrendingUp,
      description: 'Revenue generated',
      trend: { value: '+22%', isPositive: true },
      onClick: () => navigate('/middleman/sales-history', { state: { activeTab: 'vendor' } }),
    },
    {
      id: 'expected-receivables',
      title: 'Expected Receivables',
      value: formatINR(dashboardMetrics.expectedReceivables),
      icon: TrendingUp,
      description: 'Due from buyers',
      trend: { value: 'Receivable', isPositive: true },
    },
    {
      id: 'expected-payables',
      title: 'Expected Payables',
      value: formatINR(dashboardMetrics.expectedPayables),
      icon: TrendingDown,
      description: 'Obligation to farmers',
      trend: { value: 'Payable', isPositive: false },
    },
  ];

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
            Welcome back, <span className="font-semibold text-[#1F2937]">{profile.ownerName}</span>. Trading health overview.
          </p>
        </div>
      </div>

      {/* 6.3 Horizontal Sliding KPI Cards Carousel (10 KPI Cards in 2 Landscape Slides) */}
      <div className="space-y-2.5">
        <div className="flex items-center gap-3">
          {/* Left Arrow Button – Visible when Second Group (Additional Metrics) is active */}
          {activeKpiGroup === 1 && (
            <button
              type="button"
              onClick={() => setActiveKpiGroup(0)}
              aria-label="Back to primary metrics"
              title="Back to primary metrics"
              className="group shrink-0 w-10 h-10 rounded-full border border-[#E2E8F0] bg-white text-[#0F766E] hover:bg-[#CCFBF1] hover:border-[#14B8A6] shadow-xs hover:shadow-md flex items-center justify-center transition-all duration-200 cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5 stroke-[2.2] transition-transform duration-200 group-hover:-translate-x-0.5" />
            </button>
          )}

          {/* Horizontal Sliding Viewport */}
          <div className="flex-1 min-w-0 overflow-hidden py-1 -my-1 px-0.5 -mx-0.5">
            <div
              className={`flex w-[200%] transition-transform duration-500 ease-in-out ${
                activeKpiGroup === 0 ? 'translate-x-0' : '-translate-x-1/2'
              }`}
            >
              {/* Slide 1: First Group – 5 Primary KPI Cards in Landscape Row */}
              <div
                aria-hidden={activeKpiGroup !== 0}
                className="w-1/2 shrink-0 pr-2"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 items-stretch">
                  {primaryKpiCards.map((card) => (
                    <DashboardSummaryCard key={card.id} {...card} />
                  ))}
                </div>
              </div>

              {/* Slide 2: Second Group – 5 Additional KPI Cards in Landscape Row */}
              <div
                aria-hidden={activeKpiGroup !== 1}
                className="w-1/2 shrink-0 pl-2"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 items-stretch">
                  {secondaryKpiCards.map((card) => (
                    <DashboardSummaryCard key={card.id} {...card} />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Arrow Button – Visible when First Group (Primary Metrics) is active */}
          {activeKpiGroup === 0 && (
            <button
              type="button"
              onClick={() => setActiveKpiGroup(1)}
              aria-label="View additional metrics"
              title="View additional metrics"
              className="group shrink-0 w-10 h-10 rounded-full border border-[#E2E8F0] bg-white text-[#0F766E] hover:bg-[#CCFBF1] hover:border-[#14B8A6] shadow-xs hover:shadow-md flex items-center justify-center transition-all duration-200 cursor-pointer"
            >
              <ChevronRight className="w-5 h-5 stroke-[2.2] transition-transform duration-200 group-hover:translate-x-0.5" />
            </button>
          )}
        </div>

        {/* Subtle Carousel Pagination Indicator */}
        <div className="flex items-center justify-end gap-2.5 px-1">
          <span className="text-[11px] font-semibold text-[#64748B]">
            {activeKpiGroup === 0
              ? 'Primary Metrics – 1/2'
              : 'Additional Metrics – 2/2'}
          </span>
          <div className="inline-flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setActiveKpiGroup(0)}
              aria-label="Show Primary Metrics (1/2)"
              title="Primary Metrics – 1/2"
              className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                activeKpiGroup === 0
                  ? 'w-5 bg-[#0F766E]'
                  : 'w-2 bg-[#CBD5E1] hover:bg-[#14B8A6]'
              }`}
            />
            <button
              type="button"
              onClick={() => setActiveKpiGroup(1)}
              aria-label="Show Additional Metrics (2/2)"
              title="Additional Metrics – 2/2"
              className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                activeKpiGroup === 1
                  ? 'w-5 bg-[#0F766E]'
                  : 'w-2 bg-[#CBD5E1] hover:bg-[#14B8A6]'
              }`}
            />
          </div>
        </div>
      </div>

      {/* Main Analytical Grid: Cropwise Inventory & Purchase vs Sales Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        {/* Cropwise Inventory (Spans 1 column, equal height with internal scrolling) */}
        <div className="lg:col-span-1 flex">
          <SectionCard
            title="Cropwise Inventory"
            subtitle="Current stock across active crop batches"
            className="w-full h-[420px] flex flex-col"
            bodyClassName="p-5 sm:p-6 flex-1 min-h-0 flex flex-col overflow-hidden"
            action={
              <button
                type="button"
                onClick={() => navigate('/middleman/inventory')}
                className="text-xs font-semibold text-[#0F766E] hover:underline cursor-pointer shrink-0"
              >
                View Batches &rarr;
              </button>
            }
          >
            <CropInventoryChart />
          </SectionCard>
        </div>

        {/* Purchase vs Sales Comparison (Spans 2 columns, equal height) */}
        <div className="lg:col-span-2 flex">
          <SectionCard
            title="Purchase vs Sales Comparison"
            subtitle="Monthly breakdown of Farmer Purchases vs Vendor and Customer Sales (in INR)"
            className="w-full h-[420px] flex flex-col"
            bodyClassName="p-5 sm:p-6 flex-1 min-h-0 flex flex-col"
          >
            <PurchaseSalesChart />
          </SectionCard>
        </div>
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
              className="inline-flex items-center gap-1 text-xs font-bold text-[#0F766E] hover:underline cursor-pointer"
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
              onClick={() => navigate('/middleman/sales-history', { state: { activeTab: 'farmer' } })}
              className="text-xs font-semibold text-[#0F766E] hover:underline cursor-pointer"
            >
              Purchases &rarr;
            </button>
            <span className="text-slate-300">|</span>
            <button
              type="button"
              onClick={() => navigate('/middleman/sales-history', { state: { activeTab: 'vendor' } })}
              className="text-xs font-semibold text-[#0F766E] hover:underline cursor-pointer"
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

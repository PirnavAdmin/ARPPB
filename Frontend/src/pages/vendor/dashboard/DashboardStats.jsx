import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sprout,
  BriefcaseBusiness,
  ShoppingCart,
  Warehouse,
  Factory,
  PackageCheck,
  UserRoundCheck,
  TrendingUp,
  TrendingDown,
  Wallet,
  ArrowUpRight,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import { formatCurrency, formatNumber } from '../../../utils/formatCurrency';

function DashboardKpiCard({
  title,
  value,
  description,
  icon: Icon,
  trend = null,
  onClick = null,
}) {
  const Wrapper = onClick ? 'button' : 'div';

  return (
    <Wrapper
      type={onClick ? 'button' : undefined}
      onClick={onClick || undefined}
      className={`group w-full h-[148px] text-left rounded-2xl bg-white border border-[#E2E8F0] p-5 shadow-xs flex flex-col justify-between transition-all duration-200 ${
        onClick
          ? 'hover:border-[#14B8A6] hover:shadow-md hover:-translate-y-0.5 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20'
          : ''
      }`}
    >
      {/* Top Section: KPI Title on Left, Uniform Icon Container on Right */}
      <div className="flex items-center justify-between gap-2.5 w-full">
        <span className="text-xs font-bold uppercase tracking-wide text-[#64748B] leading-snug">
          {title}
        </span>

        {Icon && (
          <div className="w-10 h-10 min-w-[2.5rem] min-h-[2.5rem] rounded-xl bg-[#CCFBF1] text-[#0F766E] border border-[#14B8A6]/25 flex items-center justify-center shrink-0 group-hover:bg-[#0F766E] group-hover:text-white transition-colors duration-200">
            <Icon className="w-5 h-5 stroke-[2] shrink-0" />
          </div>
        )}
      </div>

      {/* Middle Section: Full-Width Large KPI Value */}
      <div className="my-1 w-full">
        <p className="text-xl xl:text-[21px] 2xl:text-2xl font-extrabold text-[#0F766E] tracking-tight leading-tight whitespace-nowrap truncate">
          {value}
        </p>
      </div>

      {/* Bottom Section: Supporting Info, Growth Indicator & Directional Arrow */}
      <div className="pt-2.5 border-t border-[#E2E8F0] flex items-center justify-between gap-2 w-full">
        <span className="text-xs font-medium text-[#64748B] truncate">
          {description}
        </span>

        <div className="flex items-center gap-1.5 shrink-0">
          {trend && trend.value ? (
            <span
              className={`inline-flex items-center gap-0.5 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                trend.direction === 'down'
                  ? 'bg-red-50 text-red-600'
                  : 'bg-[#DCFCE7] text-[#16A34A]'
              }`}
            >
              {trend.direction === 'down' ? (
                <TrendingDown className="w-3 h-3 shrink-0" />
              ) : (
                <TrendingUp className="w-3 h-3 shrink-0" />
              )}
              {trend.value}
            </span>
          ) : null}

          {onClick && (
            <ArrowUpRight className="w-3.5 h-3.5 text-[#64748B] group-hover:text-[#0F766E] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-200 shrink-0" />
          )}
        </div>
      </div>
    </Wrapper>
  );
}

export function DashboardStats({ stats }) {
  const navigate = useNavigate();
  // 0 = First Group (Primary Metrics 1/2), 1 = Second Group (Additional Metrics 2/2)
  const [activeGroup, setActiveGroup] = useState(0);

  // First Group – Primary Metrics (5 KPI Cards)
  const primaryCards = [
    {
      id: 'total-farmers',
      title: 'Total Farmers',
      value: formatNumber(stats.totalFarmers, 0),
      description: `${stats.activeFarmers} active registered farmers`,
      icon: Sprout,
      trend: stats.farmersTrend,
      onClick: () => navigate('/vendor/farmers'),
    },
    {
      id: 'total-middlemen',
      title: 'Total Middlemen',
      value: formatNumber(stats.totalMiddlemen, 0),
      description: `${stats.activeMiddlemen} active mandi traders`,
      icon: BriefcaseBusiness,
      trend: stats.middlemenTrend,
      onClick: () => navigate('/vendor/middlemen'),
    },
    {
      id: 'total-purchases',
      title: 'Total Purchases',
      value: formatCurrency(stats.totalPurchasesAmount),
      description: `${stats.confirmedPurchasesCount} confirmed • ${stats.totalPurchaseQty} Qtl`,
      icon: ShoppingCart,
      trend: stats.purchasesTrend,
      onClick: () => navigate('/vendor/farmers'),
    },
    {
      id: 'total-sales',
      title: 'Total Sales',
      value: formatCurrency(stats.totalSalesAmount),
      description: `${stats.confirmedSalesCount} confirmed sales invoices`,
      icon: TrendingUp,
      trend: stats.salesTrend,
      onClick: () => navigate('/vendor/sales/history'),
    },
    {
      id: 'customer-orders',
      title: 'Total Customers',
      value: formatNumber(stats.totalOrdersCount, 0),
      description: `${stats.completedOrdersCount} completed • ${stats.activeOrdersCount} in fulfilment`,
      icon: UserRoundCheck,
      trend: stats.ordersTrend,
      onClick: () => navigate('/vendor/orders'),
    },
  ];

  // Second Group – Additional Metrics (5 KPI Cards)
  const secondaryCards = [
    {
      id: 'raw-material-stock',
      title: 'Raw Material Stock',
      value: `${formatNumber(stats.rawMaterialStockQty)} Qtl`,
      description: `${stats.activeRawBatchesCount} active batches (${stats.lowStockRawCount} low stock)`,
      icon: Warehouse,
      trend: null,
      onClick: () => navigate('/vendor/inventory'),
    },
    {
      id: 'products-processed',
      title: 'Products Processed',
      value: `${formatNumber(stats.completedProcessingCount, 0)} Batches`,
      description: `${formatNumber(stats.totalProcessedInputQty)} Qtl raw input converted`,
      icon: Factory,
      trend: stats.processingTrend,
      onClick: () => navigate('/vendor/processing'),
    },
    {
      id: 'finished-stock',
      title: 'Finished Products Stock',
      value: `${formatNumber(stats.finishedProductTypesCount, 0)} Products`,
      description: `${formatNumber(stats.finishedQuintalQty)} Qtl + ${formatNumber(stats.finishedUnitQty)} Kg/L`,
      icon: PackageCheck,
      trend: null,
      onClick: () => navigate('/vendor/finished-products'),
    },
    {
      id: 'expected-receivables',
      title: 'Expected Receivables',
      value: formatCurrency(stats.expectedReceivables),
      description: 'Outstanding customer dues to collect',
      icon: Wallet,
      trend: null,
    },
    {
      id: 'expected-payables',
      title: 'Expected Payables',
      value: formatCurrency(stats.expectedPayables),
      description: 'Outstanding farmer & middleman dues',
      icon: ArrowUpRight,
      trend: null,
    },
  ];

  return (
    <div className="space-y-2.5">
      {/* Landscape Horizontal Sliding KPI Carousel Row */}
      <div className="flex items-center gap-3">
        {/* Left Arrow Button – Visible when Second Group (Additional Metrics) is active */}
        {activeGroup === 1 && (
          <button
            type="button"
            onClick={() => setActiveGroup(0)}
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
              activeGroup === 0 ? 'translate-x-0' : '-translate-x-1/2'
            }`}
          >
            {/* Slide 1: First Group – 5 Primary KPI Cards in Landscape Row */}
            <div
              aria-hidden={activeGroup !== 0}
              className="w-1/2 shrink-0 pr-2"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 items-stretch">
                {primaryCards.map((card) => (
                  <DashboardKpiCard key={card.id} {...card} />
                ))}
              </div>
            </div>

            {/* Slide 2: Second Group – 5 Additional KPI Cards in Landscape Row */}
            <div
              aria-hidden={activeGroup !== 1}
              className="w-1/2 shrink-0 pl-2"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 items-stretch">
                {secondaryCards.map((card) => (
                  <DashboardKpiCard key={card.id} {...card} />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Arrow Button – Visible when First Group (Primary Metrics) is active */}
        {activeGroup === 0 && (
          <button
            type="button"
            onClick={() => setActiveGroup(1)}
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
          {activeGroup === 0
            ? 'Primary Metrics – 1/2'
            : 'Additional Metrics – 2/2'}
        </span>
        <div className="inline-flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveGroup(0)}
            aria-label="Show Primary Metrics (1/2)"
            title="Primary Metrics – 1/2"
            className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
              activeGroup === 0
                ? 'w-5 bg-[#0F766E]'
                : 'w-2 bg-[#CBD5E1] hover:bg-[#14B8A6]'
            }`}
          />
          <button
            type="button"
            onClick={() => setActiveGroup(1)}
            aria-label="Show Additional Metrics (2/2)"
            title="Additional Metrics – 2/2"
            className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
              activeGroup === 1
                ? 'w-5 bg-[#0F766E]'
                : 'w-2 bg-[#CBD5E1] hover:bg-[#14B8A6]'
            }`}
          />
        </div>
      </div>
    </div>
  );
}

export default DashboardStats;

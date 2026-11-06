import { useNavigate } from 'react-router-dom';
import {
  Sprout,
  Briefcase,
  ShoppingCart,
  Warehouse,
  Factory,
  PackageCheck,
  Truck,
  TrendingUp,
  ArrowDownLeft,
  ArrowUpRight,
} from 'lucide-react';
import VendorStatCard from '../VendorStatCard';
import { formatCurrency, formatNumber } from '../../../utils/formatCurrency';

export function DashboardStats({ stats }) {
  const navigate = useNavigate();

  const cards = [
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
      icon: Briefcase,
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
      onClick: () => navigate('/vendor/purchases/history'),
      highlight: true,
    },
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
      id: 'customer-orders',
      title: 'Total Customer Orders',
      value: formatNumber(stats.totalOrdersCount, 0),
      description: `${stats.completedOrdersCount} completed • ${stats.activeOrdersCount} in fulfilment`,
      icon: Truck,
      trend: stats.ordersTrend,
      onClick: () => navigate('/vendor/orders'),
    },
    {
      id: 'total-sales',
      title: 'Total Sales',
      value: formatCurrency(stats.totalSalesAmount),
      description: `${stats.confirmedSalesCount} confirmed sales invoices`,
      icon: TrendingUp,
      trend: stats.salesTrend,
      onClick: () => navigate('/vendor/sales/history'),
      highlight: true,
    },
    {
      id: 'expected-receivables',
      title: 'Expected Receivables',
      value: formatCurrency(stats.expectedReceivables),
      description: 'Outstanding customer dues to collect',
      icon: ArrowDownLeft,
      trend: null,
      onClick: () => navigate('/vendor/ledger?tab=receivables'),
    },
    {
      id: 'expected-payables',
      title: 'Expected Payables',
      value: formatCurrency(stats.expectedPayables),
      description: 'Outstanding farmer & middleman dues',
      icon: ArrowUpRight,
      trend: null,
      onClick: () => navigate('/vendor/ledger?tab=payables'),
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {cards.map((card) => (
        <VendorStatCard key={card.id} {...card} />
      ))}
    </div>
  );
}

export default DashboardStats;


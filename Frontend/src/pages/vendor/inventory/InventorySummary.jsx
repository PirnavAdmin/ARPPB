import { Warehouse, CheckCircle2, Factory, AlertTriangle } from 'lucide-react';
import VendorStatCard from '../VendorStatCard';
import { formatNumber, formatCurrency } from '../../../utils/formatCurrency';

export function InventorySummary({ inventory = [], onFilterLowStock }) {
  const totalPurchased = inventory.reduce((s, b) => s + Number(b.purchasedQuantity || 0), 0);
  const totalAvailable = inventory.reduce((s, b) => s + Number(b.availableQuantity || 0), 0);
  const totalProcessed = inventory.reduce((s, b) => s + Number(b.processedQuantity || 0), 0);
  const totalStockValue = inventory.reduce(
    (s, b) => s + Number(b.availableQuantity || 0) * Number(b.averageCost || 0),
    0
  );
  const lowStockCount = inventory.filter(
    (b) =>
      Number(b.availableQuantity || 0) <= Number(b.minimumThreshold || 15) &&
      Number(b.availableQuantity || 0) > 0
  ).length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <VendorStatCard
        title="Total Raw Material Stock"
        value={`${formatNumber(totalPurchased)} Qtl`}
        description={`${inventory.length} traceable inward batches`}
        icon={Warehouse}
      />
      <VendorStatCard
        title="Available Quantity"
        value={`${formatNumber(totalAvailable)} Qtl`}
        description={`Valuation: ${formatCurrency(totalStockValue)}`}
        icon={CheckCircle2}
        highlight
      />
      <VendorStatCard
        title="Processed Quantity"
        value={`${formatNumber(totalProcessed)} Qtl`}
        description="Issued to milling & processing"
        icon={Factory}
      />
      <VendorStatCard
        title="Low Stock Items"
        value={`${formatNumber(lowStockCount, 0)} Batches`}
        description="Click to filter low-stock batches"
        icon={AlertTriangle}
        onClick={onFilterLowStock}
      />
    </div>
  );
}

export default InventorySummary;


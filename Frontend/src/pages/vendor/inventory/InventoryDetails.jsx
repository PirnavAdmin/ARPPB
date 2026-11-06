import { useNavigate } from 'react-router-dom';
import { Factory, PackageCheck, FileSpreadsheet } from 'lucide-react';
import VendorStatusBadge from '../VendorStatusBadge';
import StockMovementHistory from './StockMovementHistory';
import { formatCurrency, formatNumber } from '../../../utils/formatCurrency';
import { formatDate } from '../../../utils/formatDate';

export function InventoryDetails({
  stock,
  movements = [],
  processingRecords = [],
  productBatches = [],
  onClose,
}) {
  const navigate = useNavigate();
  if (!stock) return null;

  const relatedProcessing = processingRecords.filter((p) => p.stockId === stock.id);
  const relatedFgBatches = productBatches.filter((b) => b.rawMaterialStockId === stock.id);

  return (
    <div className="space-y-6 text-xs">
      {/* Header Banner */}
      <div className="p-4 rounded-xl bg-brand-light/40 border border-brand-secondary/30 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md bg-brand-primary text-white font-mono font-bold">
              {stock.id}
            </span>
            <span className="font-mono font-bold text-brand-primary bg-white px-2.5 py-0.5 rounded border border-brand-secondary/30">
              {stock.batchNumber}
            </span>
            <VendorStatusBadge status={stock.status} size="xs" />
          </div>
          <h3 className="text-base font-bold text-brand-text mt-1.5">
            {stock.cropName} – {stock.cropVariety} ({stock.qualityGrade})
          </h3>
        </div>

        {stock.availableQuantity > 0 && (
          <button
            type="button"
            onClick={() => {
              onClose();
              navigate(`/vendor/processing?stockId=${stock.id}`);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl font-semibold bg-brand-primary text-white hover:bg-brand-secondary transition-colors cursor-pointer"
          >
            <Factory className="w-4 h-4" />
            Process This Batch
          </button>
        )}
      </div>

      {/* Quantity & Cost Breakdown */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-brand-background border border-brand-border">
          <span className="text-brand-muted uppercase font-bold text-[10px]">
            Purchased Quantity
          </span>
          <p className="text-base font-bold text-brand-text mt-0.5">
            {formatNumber(stock.purchasedQuantity)} {stock.unit}
          </p>
        </div>
        <div className="p-3.5 rounded-xl bg-brand-background border border-brand-border">
          <span className="text-brand-muted uppercase font-bold text-[10px]">
            Processed Quantity
          </span>
          <p className="text-base font-bold text-brand-primary mt-0.5">
            {formatNumber(stock.processedQuantity)} {stock.unit}
          </p>
        </div>
        <div className="p-3.5 rounded-xl bg-brand-light/40 border border-brand-secondary/40">
          <span className="text-brand-primary uppercase font-bold text-[10px]">
            Available Quantity
          </span>
          <p className="text-base font-bold text-brand-primary mt-0.5">
            {formatNumber(stock.availableQuantity)} {stock.unit}
          </p>
        </div>
        <div className="p-3.5 rounded-xl bg-brand-background border border-brand-border">
          <span className="text-brand-muted uppercase font-bold text-[10px]">
            Average Cost / {stock.unit}
          </span>
          <p className="text-base font-bold text-brand-text mt-0.5">
            {formatCurrency(stock.averageCost)}
          </p>
        </div>
      </div>

      {/* Traceability Grid: Supplier, Original Purchase, Storage */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-brand-surface border border-brand-border space-y-2">
          <h4 className="font-bold text-brand-primary uppercase tracking-wider">
            Source Supplier &amp; Purchase Reference
          </h4>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-brand-muted block">Supplier Name</span>
              <strong className="text-brand-text">{stock.supplierName}</strong>
            </div>
            <div>
              <span className="text-brand-muted block">Supplier ID &amp; Category</span>
              <strong className="text-brand-primary">
                {stock.supplierId} ({stock.supplierCategory})
              </strong>
            </div>
            <div>
              <span className="text-brand-muted block">Original Purchase ID</span>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  navigate(`/vendor/purchases/history?purchaseId=${stock.purchaseId}`);
                }}
                className="inline-flex items-center gap-1 font-mono font-bold text-brand-primary hover:underline cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                {stock.purchaseId}
              </button>
            </div>
            <div>
              <span className="text-brand-muted block">Purchase Date</span>
              <span>{formatDate(stock.purchaseDate)}</span>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-brand-surface border border-brand-border space-y-2">
          <h4 className="font-bold text-brand-primary uppercase tracking-wider">
            Processing &amp; Finished Product Traceability
          </h4>
          <div className="space-y-2">
            <div>
              <span className="text-brand-muted block mb-1">Processing Batches Linked:</span>
              {relatedProcessing.length === 0 ? (
                <span className="text-brand-muted">No processing runs completed on this batch yet</span>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {relatedProcessing.map((proc) => (
                    <span
                      key={proc.id}
                      className="px-2.5 py-1 rounded-lg bg-brand-light text-brand-primary font-semibold"
                    >
                      {proc.id} ({proc.batchNumber} • {proc.inputQuantity} {proc.inputUnit})
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div>
              <span className="text-brand-muted block mb-1">Related Finished Product Batches:</span>
              {relatedFgBatches.length === 0 ? (
                <span className="text-brand-muted">None</span>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {relatedFgBatches.map((fg) => (
                    <span
                      key={fg.id}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-brand-background border border-brand-border text-brand-text font-semibold"
                    >
                      <PackageCheck className="w-3.5 h-3.5 text-brand-primary" />
                      {fg.batchNumber} ({fg.productName}: {fg.initialQuantity} {fg.unit})
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stock Movement History */}
      <div>
        <h4 className="font-bold text-brand-primary uppercase tracking-wider mb-2">
          Batch Stock Movement History
        </h4>
        <StockMovementHistory movements={movements} stockIdFilter={stock.id} />
      </div>
    </div>
  );
}

export default InventoryDetails;


import { useNavigate } from 'react-router-dom';
import { PackageCheck, ShoppingBag, Factory } from 'lucide-react';
import VendorStatusBadge from '../VendorStatusBadge';
import ProductSalesHistory from './ProductSalesHistory';
import { formatCurrency, formatNumber } from '../../../utils/formatCurrency';
import { formatDate } from '../../../utils/formatDate';

export function ProductDetails({
  product,
  batches = [],
  sales = [],
  onEdit,
  onOpenStockUpdate,
  onClose,
}) {
  const navigate = useNavigate();
  if (!product) return null;

  const prodBatches = batches.filter((b) => b.productId === product.id);

  return (
    <div className="space-y-6 text-xs">
      {/* Header Banner */}
      <div className="p-4 rounded-xl bg-brand-light/40 border border-brand-secondary/30 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-14 h-14 rounded-xl bg-brand-primary text-white flex items-center justify-center overflow-hidden shrink-0">
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.productName}
                className="w-full h-full object-cover"
              />
            ) : (
              <PackageCheck className="w-7 h-7" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-brand-primary text-white font-mono font-bold">
                {product.id}
              </span>
              <h3 className="text-lg font-bold text-brand-text">{product.productName}</h3>
              <VendorStatusBadge status={product.status} size="xs" />
            </div>
            <p className="text-brand-muted mt-1">
              Brand: <strong>{product.brandName}</strong> • Category:{' '}
              <strong>{product.category}</strong> • Source Raw Material:{' '}
              <strong>{product.sourceRawMaterial}</strong>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {product.status === 'Active' && product.availableQuantity > 0 && (
            <button
              type="button"
              onClick={() => {
                onClose();
                navigate(`/vendor/sales/new?productId=${product.id}`);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-semibold bg-brand-primary text-white hover:bg-brand-secondary cursor-pointer"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              Sell Product
            </button>
          )}
          <button
            type="button"
            onClick={() => onOpenStockUpdate(product)}
            className="px-3 py-1.5 rounded-lg font-semibold bg-brand-light text-brand-primary hover:bg-brand-secondary hover:text-white cursor-pointer"
          >
            Update Stock
          </button>
          <button
            type="button"
            onClick={() => onEdit(product)}
            className="px-3 py-1.5 rounded-lg font-semibold bg-brand-surface border border-brand-border text-brand-text hover:bg-brand-light cursor-pointer"
          >
            Edit Product
          </button>
        </div>
      </div>

      {/* Stock, Pricing & Margin KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3 rounded-xl bg-brand-light/40 border border-brand-secondary/30">
          <span className="text-[10px] font-bold uppercase text-brand-primary">
            Remaining Stock
          </span>
          <p className="text-base font-bold text-brand-primary mt-0.5">
            {formatNumber(product.availableQuantity)} {product.unit}
          </p>
        </div>
        <div className="p-3 rounded-xl bg-brand-background border border-brand-border">
          <span className="text-[10px] font-bold uppercase text-brand-muted">
            Reserved Stock
          </span>
          <p className="text-base font-bold text-brand-warning mt-0.5">
            {formatNumber(product.reservedQuantity || 0)} {product.unit}
          </p>
        </div>
        <div className="p-3 rounded-xl bg-brand-background border border-brand-border">
          <span className="text-[10px] font-bold uppercase text-brand-muted">Sold Quantity</span>
          <p className="text-base font-bold text-brand-text mt-0.5">
            {formatNumber(product.soldQuantity)} {product.unit}
          </p>
        </div>
        <div className="p-3 rounded-xl bg-brand-background border border-brand-border">
          <span className="text-[10px] font-bold uppercase text-brand-muted">
            Production Cost
          </span>
          <p className="text-base font-bold text-brand-text mt-0.5">
            {formatCurrency(product.productionCost)}/{product.unit}
          </p>
        </div>
        <div className="p-3 rounded-xl bg-brand-background border border-brand-border">
          <span className="text-[10px] font-bold uppercase text-brand-muted">Selling Price</span>
          <p className="text-base font-bold text-brand-primary mt-0.5">
            {formatCurrency(product.sellingPrice)}/{product.unit}
          </p>
        </div>
        <div className="p-3 rounded-xl bg-brand-success-light/60 border border-brand-success/30">
          <span className="text-[10px] font-bold uppercase text-brand-success">
            Profit Margin %
          </span>
          <p className="text-base font-bold text-brand-success mt-0.5">
            {formatNumber(product.profitMargin)}%
          </p>
        </div>
      </div>

      {/* Packaging & Expiry Info */}
      <div className="p-4 rounded-xl bg-brand-surface border border-brand-border grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div>
          <span className="text-brand-muted block">Packaging Type &amp; Size</span>
          <strong className="text-brand-text">
            {product.packagingType} ({product.packageSize})
          </strong>
        </div>
        <div>
          <span className="text-brand-muted block">Minimum Stock Level</span>
          <strong className="text-brand-text">
            {product.minimumStockLevel} {product.unit}
          </strong>
        </div>
        <div>
          <span className="text-brand-muted block">Manufacturing Date</span>
          <strong>{formatDate(product.manufacturingDate)}</strong>
        </div>
        <div>
          <span className="text-brand-muted block">Expiry Date</span>
          <strong>{formatDate(product.expiryDate)}</strong>
        </div>
      </div>

      {/* Traceable Manufacturing Batches */}
      <div>
        <h4 className="font-bold text-brand-primary uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Factory className="w-4 h-4" />
          Traceable Manufacturing Batches ({prodBatches.length})
        </h4>
        <div className="rounded-xl border border-brand-border overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-brand-light/40 border-b border-brand-border text-brand-primary font-bold uppercase">
                <th className="p-3">Batch ID</th>
                <th className="p-3">Batch Number</th>
                <th className="p-3">Processing Ref</th>
                <th className="p-3">Source Raw Batch</th>
                <th className="p-3">Original Purchase</th>
                <th className="p-3 text-right">Initial Qty</th>
                <th className="p-3 text-right">Avail Qty</th>
                <th className="p-3 text-right">Prod Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border bg-brand-surface">
              {prodBatches.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-4 text-center text-brand-muted">
                    No processing batches linked yet
                  </td>
                </tr>
              ) : (
                prodBatches.map((b) => (
                  <tr key={b.id}>
                    <td className="p-3 font-mono font-bold text-brand-primary">{b.id}</td>
                    <td className="p-3 font-mono font-semibold">{b.batchNumber}</td>
                    <td className="p-3 font-mono text-brand-primary">{b.processingId}</td>
                    <td className="p-3 font-mono">
                      {b.rawMaterialBatchNumber} ({b.rawMaterialStockId})
                    </td>
                    <td className="p-3 font-mono text-brand-primary">{b.originalPurchaseId}</td>
                    <td className="p-3 text-right">
                      {formatNumber(b.initialQuantity)} {b.unit}
                    </td>
                    <td className="p-3 text-right font-bold text-brand-primary">
                      {formatNumber(b.availableQuantity)} {b.unit}
                    </td>
                    <td className="p-3 text-right">{formatCurrency(b.productionCost)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sales History */}
      <div>
        <h4 className="font-bold text-brand-primary uppercase tracking-wider mb-2">
          Product Sales History
        </h4>
        <ProductSalesHistory product={product} sales={sales} />
      </div>
    </div>
  );
}

export default ProductDetails;


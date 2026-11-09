import { useNavigate } from 'react-router-dom';
import { PackageCheck, AlertTriangle, ArrowUpRight, Droplets, Wheat, Flame, Sparkles } from 'lucide-react';
import { formatNumber, formatCurrency } from '../../../utils/formatCurrency';
import VendorStatusBadge from '../VendorStatusBadge';

function getProductIcon(name = '') {
  const lower = name.toLowerCase();
  if (lower.includes('oil')) return Droplets;
  if (lower.includes('chilli') || lower.includes('turmeric') || lower.includes('spice')) return Flame;
  if (lower.includes('rice') || lower.includes('wheat') || lower.includes('maize')) return Wheat;
  return Sparkles;
}

export function FinishedProductChart({ products = [] }) {
  const navigate = useNavigate();

  return (
    <div className="bg-brand-surface rounded-2xl border border-brand-border p-5 shadow-2xs">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-base font-bold text-brand-primary">Finished Product Overview</h3>
          <p className="text-xs text-brand-muted">
            Live finished product stock, sold volume, and low-stock indicators across processed items
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate('/vendor/finished-products')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-light text-brand-primary hover:bg-brand-secondary hover:text-white text-xs font-semibold transition-colors cursor-pointer"
        >
          <PackageCheck className="w-3.5 h-3.5" />
          <span>Manage Finished Stock</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {products.map((prod) => {
          const isLowStock =
            Number(prod.availableQuantity || 0) <= Number(prod.minimumStockLevel || 15);
          const IconComp = getProductIcon(prod.productName);
          const totalPool =
            Number(prod.availableQuantity || 0) +
            Number(prod.soldQuantity || 0) +
            Number(prod.reservedQuantity || 0);
          const availPercent =
            totalPool > 0
              ? Math.min(100, Math.round((Number(prod.availableQuantity || 0) / totalPool) * 100))
              : 0;

          return (
            <div
              key={prod.id}
              onClick={() => navigate('/vendor/finished-products')}
              className="group rounded-xl border border-brand-border bg-brand-background/50 hover:bg-brand-surface hover:border-brand-secondary hover:shadow-md p-4 transition-all cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-brand-light text-brand-primary flex items-center justify-center shrink-0">
                      {prod.imageUrl ? (
                        <img
                          src={prod.imageUrl}
                          alt={prod.productName}
                          className="w-full h-full object-cover rounded-xl"
                        />
                      ) : (
                        <IconComp className="w-5 h-5" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-brand-text truncate group-hover:text-brand-primary">
                        {prod.productName}
                      </h4>
                      <p className="text-[11px] text-brand-muted truncate">
                        {prod.brandName} • {prod.category}
                      </p>
                    </div>
                  </div>
                  <VendorStatusBadge
                    status={isLowStock ? 'Low Stock' : 'In Stock'}
                    size="xs"
                  />
                </div>

                {isLowStock && (
                  <div className="mt-2.5 px-2.5 py-1 rounded-lg bg-brand-warning-light/70 border border-brand-warning/30 flex items-center gap-1.5 text-[11px] font-semibold text-brand-warning">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>Below min stock ({prod.minimumStockLevel} {prod.unit})</span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-brand-border">
                  <div>
                    <span className="text-[10px] font-semibold uppercase text-brand-muted">
                      Available Qty
                    </span>
                    <p className="text-sm font-bold text-brand-primary">
                      {formatNumber(prod.availableQuantity)} {prod.unit}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold uppercase text-brand-muted">
                      Sold Qty
                    </span>
                    <p className="text-sm font-bold text-brand-text">
                      {formatNumber(prod.soldQuantity)} {prod.unit}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-brand-border/60">
                <div className="flex items-center justify-between text-[11px] text-brand-muted mb-1">
                  <span>Selling Price: {formatCurrency(prod.sellingPrice)}/{prod.unit}</span>
                  <span className="font-semibold text-brand-primary">{availPercent}% Avail</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-brand-border overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      isLowStock ? 'bg-brand-warning' : 'bg-brand-secondary'
                    }`}
                    style={{ width: `${availPercent}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default FinishedProductChart;


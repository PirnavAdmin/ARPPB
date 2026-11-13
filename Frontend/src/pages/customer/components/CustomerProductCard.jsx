import { useState } from 'react';
import {
  ShoppingCart,
  Eye,
  MapPin,
  Award,
  Package,
  Plus,
  Minus,
} from 'lucide-react';
import CustomerStatusBadge from './CustomerStatusBadge';
import { formatCurrency } from '../../../utils/formatCurrency';

export function CustomerProductCard({
  product,
  onViewDetails,
  onAddToCart,
}) {
  const [qty, setQty] = useState(1);

  const isOutOfStock = product.availableQuantity <= 0;
  const isLowStock =
    !isOutOfStock && product.availableQuantity <= Math.max(20, (product.minOrderQty || 1) * 3);

  const availabilityLabel = isOutOfStock
    ? 'Out of Stock'
    : isLowStock
    ? 'Low Stock'
    : 'In Stock';

  const handleQtyChange = (delta) => {
    setQty((prev) =>
      Math.max(1, Math.min(prev + delta, Math.max(1, product.availableQuantity)))
    );
  };

  return (
    <article className="group rounded-2xl bg-white border border-[#E2E8F0] shadow-xs hover:border-[#14B8A6] hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col">
      {/* Product Image */}
      <div className="relative h-44 bg-[#F8FAFC] border-b border-[#E2E8F0] overflow-hidden shrink-0">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />

        <div className="absolute top-3 left-3 flex items-center gap-1.5">
          <CustomerStatusBadge status={availabilityLabel} size="xs" />
        </div>

        {product.isBestPrice && !isOutOfStock && (
          <span className="absolute bottom-2.5 left-3 px-2 py-0.5 rounded-md bg-[#0F766E] text-white text-[10px] font-bold tracking-wide shadow-xs">
            BEST PRICE
          </span>
        )}
      </div>

      {/* Product Metadata */}
      <div className="p-4 flex-1 flex flex-col gap-3">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#0F766E]">
            {product.category}
          </span>
          <h3 className="text-sm sm:text-base font-bold text-[#0F172A] mt-0.5 line-clamp-1 group-hover:text-[#0F766E] transition-colors">
            {product.name}
          </h3>
        </div>

        {/* Grade & Origin Location */}
        <div className="space-y-1.5 text-xs text-[#64748B]">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 truncate">
              <Award className="w-3.5 h-3.5 text-[#0F766E] shrink-0" />
              <span className="truncate font-medium text-[#0F172A]">
                {product.qualityGrade}
              </span>
            </span>
          </div>

          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 truncate">
              <MapPin className="w-3.5 h-3.5 text-[#14B8A6] shrink-0" />
              <span className="truncate">
                {product.location}, {product.state}
              </span>
            </span>
          </div>
        </div>

        {/* Price & Available Qty */}
        <div className="pt-2.5 border-t border-[#E2E8F0] flex items-end justify-between gap-2">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-extrabold text-[#0F766E]">
                {formatCurrency(product.price, false)}
              </span>
              <span className="text-[11px] font-medium text-[#64748B]">
                / {product.unit}
              </span>
            </div>
            {product.originalPrice > product.price && (
              <span className="text-[11px] text-[#64748B] line-through">
                {formatCurrency(product.originalPrice, false)}
              </span>
            )}
          </div>

          <div className="text-right">
            <span className="text-[10px] uppercase tracking-wider text-[#64748B] block">
              Available Stock
            </span>
            <span
              className={`inline-flex items-center gap-1 text-xs font-bold ${
                isOutOfStock ? 'text-[#DC2626]' : 'text-[#0F172A]'
              }`}
            >
              <Package className="w-3.5 h-3.5 text-[#0F766E]" />
              {isOutOfStock
                ? 'Out of stock'
                : `${product.availableQuantity} ${product.unit}`}
            </span>
          </div>
        </div>

        {/* Quantity Selector + Actions */}
        <div className="mt-auto pt-2 flex flex-col gap-2">
          {!isOutOfStock && (
            <div className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
              <span className="text-[11px] font-semibold text-[#64748B]">
                Qty ({product.unit})
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleQtyChange(-1)}
                  disabled={qty <= 1}
                  aria-label="Decrease quantity"
                  className="w-6 h-6 rounded-md bg-white border border-[#E2E8F0] text-[#0F766E] flex items-center justify-center hover:bg-[#CCFBF1] disabled:opacity-40 cursor-pointer"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="text-xs font-bold text-[#0F172A] min-w-[20px] text-center">
                  {qty}
                </span>
                <button
                  type="button"
                  onClick={() => handleQtyChange(1)}
                  disabled={qty >= product.availableQuantity}
                  aria-label="Increase quantity"
                  className="w-6 h-6 rounded-md bg-white border border-[#E2E8F0] text-[#0F766E] flex items-center justify-center hover:bg-[#CCFBF1] disabled:opacity-40 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onViewDetails?.(product)}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-[#CCFBF1]/70 text-[#0F766E] border border-[#14B8A6]/30 hover:bg-[#CCFBF1] transition-colors cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5 shrink-0" />
              <span>View Details</span>
            </button>

            <button
              type="button"
              disabled={isOutOfStock}
              onClick={() => {
                onAddToCart?.(product.id, qty);
                setQty(1);
              }}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-[#0F766E] text-white hover:bg-[#115E59] disabled:bg-slate-300 disabled:text-slate-600 disabled:cursor-not-allowed transition-colors cursor-pointer shadow-2xs"
            >
              <ShoppingCart className="w-3.5 h-3.5 shrink-0" />
              <span>{isOutOfStock ? 'Unavailable' : 'Add to Cart'}</span>
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

export default CustomerProductCard;

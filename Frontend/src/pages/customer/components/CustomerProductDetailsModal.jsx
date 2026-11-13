import { useState } from 'react';
import {
  MapPin,
  Award,
  Package,
  ShoppingCart,
  Calendar,
  Tag,
  Layers,
  Plus,
  Minus,
} from 'lucide-react';
import CustomerModal from './CustomerModal';
import CustomerStatusBadge from './CustomerStatusBadge';
import { formatCurrency } from '../../../utils/formatCurrency';
import { formatDate } from '../../../utils/formatDate';

export function CustomerProductDetailsModal({
  product,
  isOpen,
  onClose,
  onAddToCart,
}) {
  const [qty, setQty] = useState(1);
  const [trackedProductId, setTrackedProductId] = useState(product?.id || null);

  if ((product?.id || null) !== trackedProductId) {
    setTrackedProductId(product?.id || null);
    setQty(1);
  }

  if (!product) return null;

  const isOutOfStock = product.availableQuantity <= 0;
  const lineEstimate = qty * product.price;

  return (
    <CustomerModal
      isOpen={isOpen}
      onClose={onClose}
      title={product.name}
      subtitle={`${product.category} • Lot ${product.batchCode}`}
      size="lg"
      footer={
        <div className="flex flex-wrap items-center justify-between w-full gap-3">
          <div className="text-xs text-[#64748B]">
            Estimated Subtotal:{' '}
            <strong className="text-sm font-extrabold text-[#0F766E]">
              {formatCurrency(lineEstimate)}
            </strong>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-xl border border-[#E2E8F0] bg-white text-[#0F172A] hover:bg-[#F8FAFC] cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              disabled={isOutOfStock}
              onClick={() => {
                onAddToCart?.(product.id, qty);
                onClose();
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-[#0F766E] text-white hover:bg-[#115E59] disabled:opacity-50 cursor-pointer"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Add to Cart ({qty} {product.unit})</span>
            </button>
          </div>
        </div>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="md:col-span-2">
          <div className="rounded-2xl border border-[#E2E8F0] overflow-hidden bg-[#F8FAFC]">
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-56 object-cover"
            />
          </div>

          <div className="mt-3 p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[#64748B]">Availability</span>
              <CustomerStatusBadge
                status={
                  isOutOfStock
                    ? 'Out of Stock'
                    : product.availableQuantity <= 20
                    ? 'Low Stock'
                    : 'In Stock'
                }
                size="xs"
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#64748B]">Listed Date</span>
              <span className="font-semibold text-[#0F172A] inline-flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[#0F766E]" />
                {formatDate(product.addedDate)}
              </span>
            </div>
          </div>
        </div>

        <div className="md:col-span-3 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md bg-[#CCFBF1] text-[#0F766E] text-xs font-bold">
              {product.category}
            </span>
            <span className="px-2.5 py-0.5 rounded-md bg-[#F8FAFC] border border-[#E2E8F0] text-[#0F172A] font-mono text-xs font-semibold">
              {product.batchCode}
            </span>
          </div>

          <p className="text-sm text-[#64748B] leading-relaxed">
            {product.description}
          </p>

          <div className="p-4 rounded-xl bg-[#CCFBF1]/35 border border-[#14B8A6]/30 flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-[11px] font-bold uppercase text-[#64748B] block">
                Unit Price
              </span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-2xl font-extrabold text-[#0F766E]">
                  {formatCurrency(product.price)}
                </span>
                <span className="text-xs font-medium text-[#64748B]">
                  per {product.unit}
                </span>
              </div>
            </div>

            {!isOutOfStock && (
              <div className="flex items-center gap-2.5 bg-white px-3 py-1.5 rounded-xl border border-[#E2E8F0]">
                <span className="text-xs font-semibold text-[#64748B]">Quantity:</span>
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  disabled={qty <= 1}
                  className="w-7 h-7 rounded-lg bg-[#CCFBF1]/70 text-[#0F766E] flex items-center justify-center hover:bg-[#0F766E] hover:text-white disabled:opacity-40 cursor-pointer"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="text-sm font-extrabold text-[#0F172A] min-w-[28px] text-center">
                  {qty}
                </span>
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.min(product.availableQuantity, q + 1))}
                  disabled={qty >= product.availableQuantity}
                  className="w-7 h-7 rounded-lg bg-[#CCFBF1]/70 text-[#0F766E] flex items-center justify-center hover:bg-[#0F766E] hover:text-white disabled:opacity-40 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
              <span className="text-[#64748B] flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-[#0F766E]" />
                Product Category
              </span>
              <p className="font-bold text-[#0F172A]">{product.category}</p>
              <p className="text-[#64748B]">Raw Agricultural Commodity</p>
            </div>

            <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
              <span className="text-[#64748B] flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-[#0F766E]" />
                Origin Region
              </span>
              <p className="font-bold text-[#0F172A]">{product.location}</p>
              <p className="text-[#64748B]">{product.state}</p>
            </div>

            <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
              <span className="text-[#64748B] flex items-center gap-1">
                <Award className="w-3.5 h-3.5 text-[#0F766E]" />
                Quality Grade
              </span>
              <p className="font-bold text-[#0F172A]">{product.qualityGrade}</p>
            </div>

            <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
              <span className="text-[#64748B] flex items-center gap-1">
                <Package className="w-3.5 h-3.5 text-[#0F766E]" />
                Available Stock
              </span>
              <p className="font-bold text-[#0F172A]">
                {product.availableQuantity} {product.unit}
              </p>
              <p className="text-[#64748B] inline-flex items-center gap-1">
                <Tag className="w-3 h-3" /> Min Order: {product.minOrderQty || 1} {product.unit}
              </p>
            </div>
          </div>
        </div>
      </div>
    </CustomerModal>
  );
}

export default CustomerProductDetailsModal;

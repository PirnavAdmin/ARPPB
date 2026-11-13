import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  ArrowLeft,
  ClipboardCheck,
  MapPin,
  ShieldCheck,
  PackageCheck,
  Award,
} from 'lucide-react';
import { useCustomer } from '../context/useCustomer';
import CustomerPageHeader from '../components/CustomerPageHeader';
import CustomerEmptyState from '../components/CustomerEmptyState';
import CustomerModal from '../components/CustomerModal';
import { formatCurrency } from '../../../utils/formatCurrency';

export function MyCart() {
  const navigate = useNavigate();
  const {
    profile,
    cartItems,
    cartItemCount,
    cartTotalUnits,
    cartSubtotal,
    updateCartQuantity,
    removeFromCart,
    placeOrdersFromCart,
  } = useCustomer();

  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState(() => {
    const def = (profile.deliveryAddresses || []).find((a) => a.isDefault);
    return def?.id || profile.deliveryAddresses?.[0]?.id || '';
  });
  const [orderSubmittedInfo, setOrderSubmittedInfo] = useState(null);

  const selectedAddressObj =
    (profile.deliveryAddresses || []).find((a) => a.id === selectedAddressId) ||
    profile.deliveryAddresses?.[0] ||
    null;

  const handleConfirmReviewOrder = () => {
    const res = placeOrdersFromCart(selectedAddressObj);
    if (res.success) {
      setIsReviewOpen(false);
      setOrderSubmittedInfo({
        orders: res.orders,
        otps: res.otps,
      });
    }
  };

  return (
    <div className="space-y-6">
      <CustomerPageHeader
        title="My Cart"
        subtitle="Review selected raw agricultural products, adjust order quantities against available stock, and submit orders for OTP confirmation."
        icon={ShoppingCart}
        badge={`${cartItemCount} ${cartItemCount === 1 ? 'Product' : 'Products'}`}
        actions={
          <button
            type="button"
            onClick={() => navigate('/customer/products')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#CCFBF1] text-[#0F766E] border border-[#14B8A6]/30 hover:bg-[#0F766E] hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Continue Browsing</span>
          </button>
        }
      />

      {/* Post-Review Submission Banner */}
      {orderSubmittedInfo && (
        <div className="p-5 rounded-2xl bg-[#DCFCE7] border border-[#16A34A]/30 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#16A34A] text-white flex items-center justify-center shrink-0">
              <PackageCheck className="w-5 h-5" />
            </div>
            <div className="text-xs sm:text-sm text-[#0F172A] space-y-1">
              <p className="font-bold text-[#15803D]">
                Order Submitted for Customer Confirmation ({orderSubmittedInfo.orders.map((o) => o.id).join(', ')})
              </p>
              <p className="text-[#0F172A]/80">
                No online payment is processed at cart stage. Please verify the 6-digit OTP on the OTP Confirmations screen to confirm your purchase.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => navigate('/customer/orders')}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white border border-[#E2E8F0] text-[#0F172A] hover:bg-[#F8FAFC] cursor-pointer"
            >
              View My Orders
            </button>
            <button
              type="button"
              onClick={() => navigate('/customer/confirmations')}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#0F766E] text-white hover:bg-[#115E59] cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Go to OTP Confirmations</span>
            </button>
          </div>
        </div>
      )}

      {cartItems.length === 0 ? (
        <CustomerEmptyState
          icon={ShoppingCart}
          title="Your Cart Is Empty"
          description="Browse fresh raw agricultural harvests, pulses, oil seeds, and commercial crops to add items to your cart."
          actionLabel="Continue Browsing Products"
          onAction={() => navigate('/customer/products')}
        />
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
          {/* Cart Items List */}
          <div className="xl:col-span-2 space-y-4">
            {cartItems.map(({ productId, quantity, product, lineTotal }) => (
              <article
                key={productId}
                className="bg-white rounded-2xl border border-[#E2E8F0] p-4 sm:p-5 shadow-2xs flex flex-col sm:flex-row gap-4 sm:items-center justify-between"
              >
                <div className="flex items-start sm:items-center gap-4 min-w-0 flex-1">
                  <div className="w-24 h-24 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] overflow-hidden shrink-0">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="min-w-0 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#0F766E]">
                        {product.category}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#F8FAFC] border border-[#E2E8F0] text-[#0F172A]">
                        Lot {product.batchCode}
                      </span>
                    </div>

                    <h3 className="text-sm sm:text-base font-bold text-[#0F172A] truncate">
                      {product.name}
                    </h3>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#64748B]">
                      <span className="inline-flex items-center gap-1">
                        <Award className="w-3.5 h-3.5 text-[#0F766E]" />
                        {product.qualityGrade}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-[#14B8A6]" />
                        {product.location}, {product.state}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs pt-0.5">
                      <span className="text-[#64748B]">
                        Available:{' '}
                        <strong className="text-[#0F172A]">
                          {product.availableQuantity} {product.unit}
                        </strong>
                      </span>
                      <span className="text-[#64748B]">
                        Unit Price:{' '}
                        <strong className="text-[#0F766E]">
                          {formatCurrency(product.price)} / {product.unit}
                        </strong>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quantity Controls, Line Total & Remove */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-[#E2E8F0] shrink-0">
                  <div className="text-left sm:text-right">
                    <span className="text-[11px] text-[#64748B] block">Total Price</span>
                    <strong className="text-base sm:text-lg font-extrabold text-[#0F766E]">
                      {formatCurrency(lineTotal)}
                    </strong>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                      <button
                        type="button"
                        onClick={() => updateCartQuantity(productId, quantity - 1)}
                        disabled={quantity <= 1}
                        aria-label={`Decrease quantity of ${product.name}`}
                        className="w-7 h-7 rounded-lg bg-white border border-[#E2E8F0] text-[#0F766E] flex items-center justify-center hover:bg-[#CCFBF1] disabled:opacity-40 cursor-pointer"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>

                      <span className="min-w-[44px] text-center text-xs font-bold text-[#0F172A]">
                        {quantity} {product.unit}
                      </span>

                      <button
                        type="button"
                        onClick={() => updateCartQuantity(productId, quantity + 1)}
                        disabled={quantity >= product.availableQuantity}
                        aria-label={`Increase quantity of ${product.name}`}
                        className="w-7 h-7 rounded-lg bg-white border border-[#E2E8F0] text-[#0F766E] flex items-center justify-center hover:bg-[#CCFBF1] disabled:opacity-40 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeFromCart(productId)}
                      aria-label={`Remove ${product.name} from cart`}
                      title="Remove Product"
                      className="p-2 rounded-xl border border-red-200 text-[#DC2626] hover:bg-[#FEE2E2] transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {/* Right Column: Order Summary */}
          <aside className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-2xs space-y-4 sticky top-20">
            <div className="pb-3 border-b border-[#E2E8F0]">
              <h2 className="text-base font-bold text-[#0F172A]">Cart Order Summary</h2>
              <p className="text-xs text-[#64748B] mt-0.5">
                Offline-settled agricultural procurement summary
              </p>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between text-[#64748B]">
                <span>Selected Products</span>
                <strong className="text-[#0F172A]">{cartItemCount}</strong>
              </div>
              <div className="flex items-center justify-between text-[#64748B]">
                <span>Total Units Ordered</span>
                <strong className="text-[#0F172A]">{cartTotalUnits}</strong>
              </div>
              <div className="flex items-center justify-between text-[#64748B]">
                <span>Online Payment Gateway</span>
                <span className="font-semibold text-[#0F766E]">Not Required</span>
              </div>
              <div className="pt-3 border-t border-[#E2E8F0] flex items-center justify-between text-sm font-extrabold text-[#0F766E]">
                <span>Estimated Total</span>
                <span>{formatCurrency(cartSubtotal)}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#CCFBF1]/35 border border-[#14B8A6]/30 text-[11px] text-[#0F172A] space-y-1">
              <p className="font-bold text-[#0F766E] flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                OTP Confirmation Workflow
              </p>
              <p className="text-[#64748B]">
                Reviewing and submitting creates purchase orders confirmed through a 6-digit OTP verification step without online card/UPI checkout.
              </p>
            </div>

            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => setIsReviewOpen(true)}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-[#0F766E] text-white hover:bg-[#115E59] shadow-xs transition-colors cursor-pointer"
              >
                <ClipboardCheck className="w-4 h-4" />
                <span>Review Order</span>
              </button>

              <button
                type="button"
                onClick={() => navigate('/customer/products')}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border border-[#E2E8F0] bg-[#F8FAFC] text-[#0F172A] hover:bg-[#CCFBF1]/50 hover:text-[#0F766E] transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Continue Browsing</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Review Order Modal (No Online Payment Gateway) */}
      <CustomerModal
        isOpen={isReviewOpen}
        onClose={() => setIsReviewOpen(false)}
        title="Review Purchase Order"
        subtitle="Verify items, quality grades, and delivery location before creating order confirmation requests"
        size="lg"
        footer={
          <div className="flex flex-wrap items-center justify-between w-full gap-3">
            <span className="text-xs text-[#64748B]">
              Order Total:{' '}
              <strong className="text-sm font-extrabold text-[#0F766E]">
                {formatCurrency(cartSubtotal)}
              </strong>
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsReviewOpen(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-[#E2E8F0] bg-white text-[#0F172A] hover:bg-[#F8FAFC] cursor-pointer"
              >
                Back to Cart
              </button>
              <button
                type="button"
                onClick={handleConfirmReviewOrder}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-[#0F766E] text-white hover:bg-[#115E59] cursor-pointer"
              >
                <PackageCheck className="w-4 h-4" />
                <span>Submit Order for OTP Verification</span>
              </button>
            </div>
          </div>
        }
      >
        <div className="space-y-5 text-xs">
          {/* Delivery Address Selection */}
          <div className="space-y-2">
            <label className="font-bold text-[#0F172A] flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-[#0F766E]" />
              Select Delivery Address
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(profile.deliveryAddresses || []).map((addr) => {
                const active = addr.id === selectedAddressObj?.id;
                return (
                  <button
                    key={addr.id}
                    type="button"
                    onClick={() => setSelectedAddressId(addr.id)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      active
                        ? 'bg-[#CCFBF1]/40 border-[#0F766E] ring-1 ring-[#0F766E]'
                        : 'bg-[#F8FAFC] border-[#E2E8F0] hover:border-[#14B8A6]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-bold text-[#0F172A]">{addr.label}</span>
                      {addr.isDefault && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#0F766E] text-white">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="text-[#64748B]">{addr.addressLine}</p>
                    <p className="text-[#0F172A] font-medium mt-0.5">
                      {addr.district}, {addr.state} - {addr.pinCode}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Itemized Review Table */}
          <div className="rounded-xl border border-[#E2E8F0] overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#CCFBF1]/45 border-b border-[#E2E8F0] text-[#0F766E]">
                  <th className="px-3.5 py-2.5 font-bold uppercase">Product</th>
                  <th className="px-3.5 py-2.5 font-bold uppercase">Grade &amp; Origin</th>
                  <th className="px-3.5 py-2.5 font-bold uppercase">Qty</th>
                  <th className="px-3.5 py-2.5 font-bold uppercase text-right">Unit Price</th>
                  <th className="px-3.5 py-2.5 font-bold uppercase text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {cartItems.map(({ productId, quantity, product, lineTotal }) => (
                  <tr key={productId}>
                    <td className="px-3.5 py-2.5 font-semibold text-[#0F172A]">
                      {product.name}
                    </td>
                    <td className="px-3.5 py-2.5">
                      <span className="block text-[#0F172A]">{product.qualityGrade}</span>
                      <span className="text-[11px] text-[#64748B]">
                        {product.location}, {product.state}
                      </span>
                    </td>
                    <td className="px-3.5 py-2.5 font-semibold">
                      {quantity} {product.unit}
                    </td>
                    <td className="px-3.5 py-2.5 text-right">
                      {formatCurrency(product.price)}
                    </td>
                    <td className="px-3.5 py-2.5 text-right font-bold text-[#0F766E]">
                      {formatCurrency(lineTotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </CustomerModal>
    </div>
  );
}

export default MyCart;

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin,
  Package,
  ShieldCheck,
  ArrowRight,
  XCircle,
  Printer,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { useVendor } from '../../../hooks/useVendor';
import { formatCurrency } from '../../../utils/formatCurrency';
import { formatDate } from '../../../utils/formatDate';
import { VALID_ORDER_TRANSITIONS } from '../../../utils/constants';
import { printDocumentSummary } from '../../../utils/exportUtils';
import VendorModal from '../VendorModal';
import VendorStatusBadge from '../VendorStatusBadge';
import OrderStatusTimeline from './OrderStatusTimeline';

export default function OrderDetails({ order, isOpen, onClose }) {
  const navigate = useNavigate();
  const {
    updateOrderStatus,
    confirmations,
    verifyTransactionOtp,
  } = useVendor();

  const [showCancelPrompt, setShowCancelPrompt] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');
  const [cancelError, setCancelError] = useState('');
  const [otpInput, setOtpInput] = useState('');

  if (!order) return null;

  const allowedTransitions = VALID_ORDER_TRANSITIONS[order.orderStatus] || [];
  const nextForwardStatus = allowedTransitions.find((s) => s !== 'Cancelled') || null;
  const canCancel = allowedTransitions.includes('Cancelled');

  const linkedOtp = confirmations.find(
    (c) => c.id === order.otpId || c.transactionId === order.salesId
  );

  const handleAdvanceStatus = () => {
    if (!nextForwardStatus) return;
    updateOrderStatus(
      order.id,
      nextForwardStatus,
      `Order advanced from ${order.orderStatus} to ${nextForwardStatus}`
    );
  };

  const handleConfirmCancellation = (e) => {
    e.preventDefault();
    if (!cancellationReason.trim()) {
      setCancelError('Please provide a valid cancellation reason before cancelling.');
      return;
    }
    const res = updateOrderStatus(order.id, 'Cancelled', cancellationReason.trim());
    if (res?.success) {
      setShowCancelPrompt(false);
      setCancellationReason('');
      setCancelError('');
    }
  };

  const handleInlineOtpVerify = () => {
    const codeToUse = otpInput.trim() || linkedOtp?.demoOtpCode || '';
    verifyTransactionOtp({
      otpId: order.otpId || linkedOtp?.id,
      transactionId: order.salesId,
      enteredCode: codeToUse,
    });
  };

  const handlePrintOrder = () => {
    printDocumentSummary({
      title: `Customer Order Fulfilment Sheet – ${order.id}`,
      subtitle: `Sales Ref: ${order.salesId} | Customer: ${order.customerName}`,
      metadata: [
        { label: 'Order ID', value: order.id },
        { label: 'Sales Invoice ID', value: order.salesId || '—' },
        { label: 'Customer Name', value: order.customerName },
        { label: 'Mobile Number', value: order.mobileNumber || '—' },
        { label: 'Delivery Address', value: order.deliveryAddress || '—' },
        { label: 'Order Date', value: formatDate(order.orderDate) },
        { label: 'Expected Delivery', value: formatDate(order.expectedDeliveryDate) },
        { label: 'OTP Confirmation', value: order.otpStatus },
        { label: 'Payment Status', value: order.paymentStatus },
        { label: 'Current Order Status', value: order.orderStatus },
      ],
      items: [
        {
          Product: order.product,
          'Batch References': (order.batchReferences || []).join(', ') || 'Standard',
          Quantity: `${order.quantity} ${order.unit}`,
          'Unit Price': formatCurrency(order.price),
          Discount: formatCurrency(order.discount || 0),
          'Tax & Delivery': formatCurrency(
            Number(order.tax || 0) + Number(order.deliveryCharges || 0)
          ),
          'Total Amount': formatCurrency(order.totalAmount),
        },
      ],
    });
  };

  return (
    <VendorModal
      isOpen={isOpen}
      onClose={() => {
        setShowCancelPrompt(false);
        setCancelError('');
        onClose();
      }}
      title={`Customer Order Details – ${order.id}`}
      subtitle={`Sales Invoice: ${order.salesId} | Customer: ${order.customerName} (${order.customerId})`}
      size="xl"
      footer={
        <div className="flex flex-wrap items-center justify-between w-full gap-2">
          <button
            type="button"
            onClick={handlePrintOrder}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-brand-border bg-brand-surface text-brand-text hover:bg-brand-light/40 transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-brand-primary" />
            Print Order Sheet
          </button>

          <div className="flex flex-wrap items-center gap-2">
            {canCancel && !showCancelPrompt && (
              <button
                type="button"
                onClick={() => setShowCancelPrompt(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg border border-red-200 bg-red-50 text-brand-error hover:bg-red-100 transition-colors cursor-pointer"
              >
                <XCircle className="w-3.5 h-3.5" />
                Cancel Order
              </button>
            )}

            {nextForwardStatus && (
              <button
                type="button"
                onClick={handleAdvanceStatus}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg bg-brand-primary text-white hover:bg-brand-secondary transition-colors cursor-pointer"
              >
                <span>Mark as {nextForwardStatus}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-lg border border-brand-border text-brand-text hover:bg-brand-background cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-5">
        {/* Cancellation Confirmation Box (when triggered) */}
        {showCancelPrompt && (
          <form
            onSubmit={handleConfirmCancellation}
            className="p-4 rounded-xl bg-red-50 border border-red-200 space-y-3"
          >
            <div className="flex items-start gap-2.5 text-brand-error">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="text-xs">
                <h4 className="font-bold text-sm">
                  Confirm Order Cancellation ({order.id})
                </h4>
                <p>
                  Cancelling this order will automatically restore{' '}
                  <strong>
                    {order.quantity} {order.unit}
                  </strong>{' '}
                  of <strong>{order.product}</strong> back into Finished Products Inventory.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-brand-text mb-1">
                Mandatory Cancellation Reason <span className="text-brand-error">*</span>
              </label>
              <input
                type="text"
                value={cancellationReason}
                onChange={(e) => {
                  setCancellationReason(e.target.value);
                  if (cancelError) setCancelError('');
                }}
                placeholder="e.g., Customer requested schedule change / Transport unavailable..."
                className="w-full px-3 py-2 text-xs rounded-lg border border-red-300 bg-white text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-error"
              />
              {cancelError && (
                <p className="text-xs font-semibold text-brand-error mt-1">{cancelError}</p>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowCancelPrompt(false);
                  setCancelError('');
                }}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-brand-border bg-white text-brand-text cursor-pointer"
              >
                Keep Order Active
              </button>
              <button
                type="submit"
                className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-brand-error text-white hover:bg-red-700 cursor-pointer"
              >
                Confirm Cancellation & Restore Stock
              </button>
            </div>
          </form>
        )}

        {/* Quick OTP Verification Prompt if Order is New & OTP is Pending */}
        {order.orderStatus === 'New' && order.otpStatus !== 'Verified' && (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-xs text-amber-950 space-y-0.5">
              <span className="font-bold flex items-center gap-1.5 text-brand-warning">
                <ShieldCheck className="w-4 h-4" />
                Customer OTP Verification Required to Confirm Order
              </span>
              <p>
                Demo OTP for <strong>{order.customerName}</strong>:{' '}
                <strong className="font-mono bg-white px-2 py-0.5 rounded border border-amber-300">
                  {linkedOtp?.demoOtpCode || '551904'}
                </strong>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                maxLength={6}
                value={otpInput}
                onChange={(e) => setOtpInput(e.target.value)}
                placeholder={linkedOtp?.demoOtpCode || 'Enter OTP'}
                className="w-28 px-2.5 py-1.5 text-xs font-mono font-bold rounded-lg border border-amber-300 bg-white text-brand-text"
              />
              <button
                type="button"
                onClick={handleInlineOtpVerify}
                className="px-3 py-1.5 text-xs font-bold rounded-lg bg-brand-primary text-white hover:bg-brand-secondary transition-colors cursor-pointer"
              >
                Verify & Confirm Order
              </button>
            </div>
          </div>
        )}

        {/* Order Status Timeline */}
        <OrderStatusTimeline
          currentStatus={order.orderStatus}
          timeline={order.timeline || []}
          cancellationReason={order.cancellationReason}
        />

        {/* Customer, Product & Financial Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* Customer Info */}
          <div className="p-4 rounded-xl border border-brand-border bg-brand-background/50 space-y-2">
            <h4 className="font-bold text-brand-text flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-brand-primary" />
              Customer & Delivery
            </h4>
            <div>
              <span className="text-brand-muted block">Customer Name</span>
              <span className="font-bold text-brand-text">{order.customerName}</span>
            </div>
            <div>
              <span className="text-brand-muted block">Business Name</span>
              <span className="font-medium text-brand-text">
                {order.businessName || 'Direct Buyer'}
              </span>
            </div>
            <div>
              <span className="text-brand-muted block">Mobile Number</span>
              <span className="font-semibold text-brand-text">
                {order.mobileNumber || '—'}
              </span>
            </div>
            <div>
              <span className="text-brand-muted block">Delivery Address</span>
              <span className="font-medium text-brand-text">
                {order.deliveryAddress || 'Kurnool, Andhra Pradesh'}
              </span>
            </div>
          </div>

          {/* Product & Batch Info */}
          <div className="p-4 rounded-xl border border-brand-border bg-brand-background/50 space-y-2">
            <h4 className="font-bold text-brand-text flex items-center gap-1.5">
              <Package className="w-4 h-4 text-brand-primary" />
              Product & Batch References
            </h4>
            <div>
              <span className="text-brand-muted block">Finished Product</span>
              <span className="font-bold text-brand-primary">{order.product}</span>
            </div>
            <div>
              <span className="text-brand-muted block">Traceable Batch Reference(s)</span>
              <span className="font-mono font-semibold text-brand-text">
                {(order.batchReferences || []).join(', ') || 'Standard Batch'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-brand-muted block">Order Quantity</span>
                <span className="font-bold text-brand-text">
                  {order.quantity} {order.unit}
                </span>
              </div>
              <div>
                <span className="text-brand-muted block">Stock Stage</span>
                <span className="font-semibold text-brand-primary">
                  {order.stockAllocationStage || 'Reserved'}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-brand-muted block">Order Date</span>
                <span className="font-medium">{formatDate(order.orderDate)}</span>
              </div>
              <div>
                <span className="text-brand-muted block">Expected Delivery</span>
                <span className="font-semibold text-brand-primary">
                  {formatDate(order.expectedDeliveryDate)}
                </span>
              </div>
            </div>
          </div>

          {/* Financial & Confirmation Summary */}
          <div className="p-4 rounded-xl border border-brand-border bg-brand-background/50 space-y-2">
            <h4 className="font-bold text-brand-text flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-brand-primary" />
              Pricing, Tax & Status
            </h4>
            <div className="flex justify-between">
              <span className="text-brand-muted">Unit Price</span>
              <span className="font-semibold">{formatCurrency(order.price)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-brand-muted">Subtotal</span>
              <span className="font-semibold">
                {formatCurrency(order.subtotal || order.quantity * order.price)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-brand-muted">Discount</span>
              <span className="text-brand-error font-semibold">
                - {formatCurrency(order.discount || 0)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-brand-muted">Tax & Delivery</span>
              <span className="font-semibold">
                +{' '}
                {formatCurrency(
                  Number(order.tax || 0) + Number(order.deliveryCharges || 0)
                )}
              </span>
            </div>
            <div className="pt-1.5 border-t border-brand-border flex justify-between text-sm font-extrabold text-brand-primary">
              <span>Total Order Value</span>
              <span>{formatCurrency(order.totalAmount)}</span>
            </div>
            <div className="pt-2 flex items-center justify-between">
              <span className="text-brand-muted">OTP Status:</span>
              <VendorStatusBadge status={order.otpStatus} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-brand-muted">Payment Status:</span>
              <VendorStatusBadge status={order.paymentStatus} />
            </div>
          </div>
        </div>
      </div>
    </VendorModal>
  );
}


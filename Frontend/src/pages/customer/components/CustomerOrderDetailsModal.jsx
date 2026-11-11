import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  Circle,
  XCircle,
  Clock,
  MapPin,
  Package,
  ShieldCheck,
  Calendar,
} from 'lucide-react';
import CustomerModal from './CustomerModal';
import CustomerStatusBadge from './CustomerStatusBadge';
import { formatCurrency } from '../../../utils/formatCurrency';
import { formatDate } from '../../../utils/formatDate';

const PIPELINE_STEPS = [
  'New',
  'Confirmed',
  'Processing',
  'Packed',
  'Shipped',
  'Delivered',
  'Completed',
];

export function CustomerOrderDetailsModal({ order, isOpen, onClose }) {
  const navigate = useNavigate();

  if (!order) return null;

  const isCancelled = order.orderStatus === 'Cancelled';
  const currentIdx = PIPELINE_STEPS.indexOf(order.orderStatus);
  const timeline = order.timeline || [];

  return (
    <CustomerModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Order Details – ${order.id}`}
      subtitle={`Transaction Reference: ${order.transactionId || '—'} | Status: ${order.orderStatus}`}
      size="xl"
      footer={
        <div className="flex flex-wrap items-center justify-between w-full gap-2">
          <div>
            {order.orderStatus === 'New' && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  navigate('/customer/confirmations');
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-[#CCFBF1] text-[#0F766E] border border-[#14B8A6]/30 hover:bg-[#0F766E] hover:text-white transition-colors cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Go to OTP Confirmations</span>
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-xl border border-[#E2E8F0] bg-white text-[#0F172A] hover:bg-[#F8FAFC] cursor-pointer"
          >
            Close
          </button>
        </div>
      }
    >
      <div className="space-y-5">
        {/* 7-Stage Fulfilment Pipeline Stepper */}
        <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0F172A]">
              Order Fulfilment Pipeline
            </span>
            {isCancelled ? (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-[#DC2626]">
                <XCircle className="w-4 h-4" />
                Order Cancelled
              </span>
            ) : (
              <span className="text-xs font-semibold text-[#0F766E]">
                Stage {Math.max(1, currentIdx + 1)} of {PIPELINE_STEPS.length}:{' '}
                <strong>{order.orderStatus}</strong>
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-7 gap-2">
            {PIPELINE_STEPS.map((step, idx) => {
              const isCompleted = !isCancelled && idx <= currentIdx;
              const isCurrent = !isCancelled && idx === currentIdx;
              const log = timeline.find((t) => t.status === step);

              return (
                <div
                  key={step}
                  className={`p-2.5 rounded-lg border text-xs transition-all ${
                    isCurrent
                      ? 'bg-[#CCFBF1] border-[#0F766E] text-[#0F766E] shadow-xs'
                      : isCompleted
                      ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                      : 'bg-white border-[#E2E8F0] text-[#64748B] opacity-75'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold mb-1">
                    {isCompleted ? (
                      <CheckCircle2
                        className={`w-4 h-4 shrink-0 ${
                          isCurrent ? 'text-[#0F766E]' : 'text-[#16A34A]'
                        }`}
                      />
                    ) : (
                      <Circle className="w-3.5 h-3.5 shrink-0 text-[#64748B]" />
                    )}
                    <span className="truncate">{step}</span>
                  </div>
                  <div className="text-[10px] leading-tight truncate opacity-80">
                    {log ? log.timestamp : 'Pending'}
                  </div>
                </div>
              );
            })}
          </div>

          {isCancelled && (
            <div className="mt-3 p-3 rounded-lg bg-[#FEE2E2] border border-[#DC2626]/20 text-xs text-[#DC2626] flex items-start gap-2">
              <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Order Cancelled</span>
                <span>
                  {order.cancellationReason ||
                    'This order was cancelled prior to dispatch.'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Delivery, Product & Financial Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC]/60 space-y-2">
            <h4 className="font-bold text-[#0F172A] flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-[#0F766E]" />
              Delivery &amp; Reference
            </h4>
            <div>
              <span className="text-[#64748B] block">Order Reference</span>
              <span className="font-bold text-[#0F766E]">{order.id}</span>
            </div>
            <div>
              <span className="text-[#64748B] block">Category</span>
              <span className="font-semibold text-[#0F172A]">{order.category}</span>
            </div>
            <div>
              <span className="text-[#64748B] block flex items-center gap-1">
                <MapPin className="w-3 h-3 text-[#0F766E]" /> Delivery Address
              </span>
              <span className="font-medium text-[#0F172A]">
                {order.deliveryAddress}
              </span>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC]/60 space-y-2">
            <h4 className="font-bold text-[#0F172A] flex items-center gap-1.5">
              <Package className="w-4 h-4 text-[#0F766E]" />
              Product & Schedule
            </h4>
            <div>
              <span className="text-[#64748B] block">Product</span>
              <span className="font-bold text-[#0F766E]">{order.product}</span>
            </div>
            <div>
              <span className="text-[#64748B] block">Batch / Lot Reference</span>
              <span className="font-mono font-semibold text-[#0F172A]">
                {order.batchReference || 'Standard Lot'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-[#64748B] block">Quantity</span>
                <span className="font-bold text-[#0F172A]">
                  {order.quantity} {order.unit}
                </span>
              </div>
              <div>
                <span className="text-[#64748B] block">Order Date</span>
                <span className="font-medium">{formatDate(order.orderDate)}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-[#64748B] block">Expected Delivery</span>
                <span className="font-semibold text-[#0F766E] inline-flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatDate(order.expectedDeliveryDate)}
                </span>
              </div>
              <div>
                <span className="text-[#64748B] block">Expected Payment</span>
                <span className="font-semibold text-[#0F172A]">
                  {formatDate(order.expectedPaymentDate)}
                </span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC]/60 space-y-2">
            <h4 className="font-bold text-[#0F172A] flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#0F766E]" />
              Order Summary
            </h4>
            <div className="flex justify-between">
              <span className="text-[#64748B]">Unit Price</span>
              <span className="font-semibold">
                {formatCurrency(order.unitPrice)} / {order.unit}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#64748B]">Ordered Quantity</span>
              <span className="font-semibold">
                {order.quantity} {order.unit}
              </span>
            </div>
            <div className="pt-2 border-t border-[#E2E8F0] flex justify-between text-sm font-extrabold text-[#0F766E]">
              <span>Total Amount</span>
              <span>{formatCurrency(order.totalAmount)}</span>
            </div>
            <div className="pt-2 flex items-center justify-between">
              <span className="text-[#64748B]">Order Status:</span>
              <CustomerStatusBadge status={order.orderStatus} size="xs" />
            </div>
            {order.transactionId && (
              <div className="flex items-center justify-between">
                <span className="text-[#64748B]">Transaction ID:</span>
                <span className="font-mono font-bold text-[#0F766E]">
                  {order.transactionId}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Chronological Timeline Log */}
        {timeline.length > 0 && (
          <div className="p-4 rounded-xl border border-[#E2E8F0] bg-white space-y-2.5">
            <h4 className="text-xs font-bold text-[#0F172A] flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#0F766E]" />
              Chronological Status History
            </h4>
            <div className="space-y-2">
              {timeline.map((log, i) => (
                <div
                  key={`${log.status}-${i}`}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs py-1.5 border-b last:border-b-0 border-[#E2E8F0]"
                >
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-[#CCFBF1] text-[#0F766E] font-bold text-[11px]">
                      {log.status}
                    </span>
                    <span className="text-[#0F172A] font-medium">{log.note}</span>
                  </div>
                  <span className="text-[11px] font-mono text-[#64748B]">
                    {log.timestamp}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </CustomerModal>
  );
}

export default CustomerOrderDetailsModal;


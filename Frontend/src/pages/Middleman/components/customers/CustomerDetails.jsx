import React from 'react';
import { X, Phone, Mail, MapPin, Edit2 } from 'lucide-react';
import { formatINR } from '../../../../utils/middleman/formatters';
import { getPaymentStatusBadgeClasses, calculatePaymentStatus } from '../../../../utils/middleman/paymentStatusHelpers';

export const CustomerDetails = ({
  customer,
  sales = [],
  onClose,
  onEdit,
}) => {
  if (!customer) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-[#E2E8F0] p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-[#1F2937]">{customer.name}</h3>
            <p className="text-xs font-mono text-[#0F766E]">{customer.customerId}</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-[#94A3B8] hover:text-[#1F2937] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Snapshot Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="p-3 bg-teal-50/50 rounded-xl border border-teal-100">
            <span className="text-[11px] text-[#0F766E] font-medium block">Total Orders</span>
            <span className="text-sm font-bold text-[#1F2937]">{customer.totalPurchases || 0}</span>
          </div>

          <div className="p-3 bg-teal-50/50 rounded-xl border border-teal-100">
            <span className="text-[11px] text-[#0F766E] font-medium block">Total Value</span>
            <span className="text-sm font-bold text-[#1F2937]">{formatINR(customer.totalPurchaseValue || 0)}</span>
          </div>

          <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200">
            <span className="text-[11px] text-emerald-700 font-medium block">Total Received</span>
            <span className="text-sm font-bold text-emerald-700">
              {formatINR(customer.totalReceived || Math.max(0, (Number(customer.totalPurchaseValue) || 0) - (Number(customer.outstandingReceivables) || 0)))}
            </span>
          </div>

          <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200">
            <span className="text-[11px] text-[#D97706] font-medium block">Receivables Due</span>
            <span className="text-sm font-bold text-[#D97706]">{formatINR(customer.outstandingReceivables || 0)}</span>
          </div>
        </div>

        {/* Order Payment Status Summary */}
        {(customer.unpaidCount !== undefined || customer.partiallyPaidCount !== undefined || customer.paidCount !== undefined) && (
          <div className="flex flex-wrap items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl border border-[#E2E8F0] text-xs">
            <span className="font-semibold text-[#64748B]">Order Payment Summary:</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
              Unpaid: {customer.unpaidCount || 0}
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
              Partially Paid: {customer.partiallyPaidCount || 0}
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Paid: {customer.paidCount || 0}
            </span>
          </div>
        )}

        {/* Contact & Location Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl space-y-2">
            <span className="font-bold text-[#64748B] uppercase tracking-wider block text-[10px]">Contact Info</span>
            <div className="flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-[#0F766E]" />
              <span className="font-semibold text-[#1F2937]">{customer.mobile}</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-[#64748B]" />
              <span className="truncate">{customer.email || 'No email registered'}</span>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl space-y-2">
            <span className="font-bold text-[#64748B] uppercase tracking-wider block text-[10px]">Delivery Address</span>
            <div className="flex items-start gap-2">
              <MapPin className="w-3.5 h-3.5 text-[#0F766E] mt-0.5 flex-shrink-0" />
              <span>{customer.address || 'Local Pick-up'}, {customer.district}, {customer.state}</span>
            </div>
          </div>
        </div>

        {/* Recent Orders Preview */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-[#64748B] uppercase tracking-wider">Recent Direct Orders</h4>
          {sales.length === 0 ? (
            <p className="text-xs text-[#64748B] py-3 text-center bg-slate-50 rounded-xl">No orders recorded yet.</p>
          ) : (
            <div className="divide-y divide-[#E2E8F0] border border-[#E2E8F0] rounded-xl overflow-hidden text-xs">
              {sales.slice(0, 4).map((s) => {
                const total = Number(s.finalAmount ?? s.totalAmount ?? 0);
                const received = Number(s.paidAmount ?? 0);
                const due = s.outstandingAmount !== undefined && s.outstandingAmount !== null
                  ? Number(s.outstandingAmount)
                  : Math.max(0, total - received);
                const payStatus = s.paymentStatus || calculatePaymentStatus(total, received, due, s.status);

                return (
                  <div key={s.saleId} className="p-2.5 flex items-center justify-between hover:bg-slate-50 gap-2">
                    <div className="min-w-0">
                      <span className="font-mono font-bold text-[#0F766E] mr-2">{s.saleId}</span>
                      <span className="text-[#1F2937]">{s.quantity} {s.unit} {s.cropName}</span>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0 text-right">
                      <div>
                        <div className="font-bold text-[#1F2937]">{formatINR(total)}</div>
                        <div className="text-[10px] text-emerald-600">Rec: {formatINR(received)} &bull; Due: {formatINR(due)}</div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] ${getPaymentStatusBadgeClasses(payStatus)}`}>
                        {payStatus}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-[#E2E8F0]">
          <button
            type="button"
            onClick={() => onEdit(customer)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[#0F766E] text-white hover:bg-[#115E59] cursor-pointer"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Edit Customer</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold border border-[#E2E8F0] hover:bg-slate-50 text-[#1F2937] cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomerDetails;

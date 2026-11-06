import React from 'react';
import { X } from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge';
import { formatINR, formatDate, formatQuantity } from '../../../../utils/middleman/formatters';

export const FarmerHistory = ({
  farmer,
  purchases = [],
  onClose,
}) => {
  if (!farmer) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-[#E2E8F0] p-6 space-y-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
          <div>
            <h3 className="text-base font-bold text-[#1F2937]">
              Purchase History &bull; <span className="text-[#0F766E]">{farmer.name}</span>
            </h3>
            <p className="text-xs text-[#64748B]">
              Farmer ID: {farmer.farmerId} &bull; {purchases.length} Recorded Transactions
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-[#94A3B8] hover:text-[#1F2937] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Purchase Records Table */}
        <div className="flex-1 overflow-y-auto">
          {purchases.length === 0 ? (
            <p className="text-xs text-[#64748B] text-center py-8">
              No purchase transactions recorded yet for this farmer.
            </p>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-[#E2E8F0] text-[11px] font-semibold text-[#64748B]">
                  <th className="py-2.5 px-3">Purchase ID</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Crop</th>
                  <th className="py-2.5 px-3">Quantity</th>
                  <th className="py-2.5 px-3">Rate</th>
                  <th className="py-2.5 px-3 text-right">Total Amount</th>
                  <th className="py-2.5 px-3">OTP Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {purchases.map((p) => (
                  <tr key={p.purchaseId} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-mono font-bold text-[#0F766E]">{p.purchaseId}</td>
                    <td className="py-2.5 px-3 text-[#64748B]">{formatDate(p.purchaseDate)}</td>
                    <td className="py-2.5 px-3 font-medium">{p.cropName}</td>
                    <td className="py-2.5 px-3">{formatQuantity(p.quantity, p.unit)}</td>
                    <td className="py-2.5 px-3">{formatINR(p.rate)}</td>
                    <td className="py-2.5 px-3 font-bold text-right">{formatINR(p.totalAmount)}</td>
                    <td className="py-2.5 px-3">
                      <StatusBadge status={p.otpStatus} size="sm" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-[#E2E8F0]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-[#1F2937] cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default FarmerHistory;


import React from 'react';
import { X } from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge';
import { formatINR, formatDate, formatQuantity } from '../../../../utils/middleman/formatters';

export const BatchDetails = ({
  batch,
  onClose,
}) => {
  if (!batch) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-[#E2E8F0] p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold text-[#1F2937]">
                Batch Traceability &bull; <span className="font-mono text-[#0F766E]">{batch.stockId}</span>
              </h3>
              <StatusBadge status={batch.status} size="sm" />
            </div>
            <p className="text-xs text-[#64748B]">Origin Purchase: {batch.purchaseId}</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-[#94A3B8] hover:text-[#1F2937] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quantities Hero Bar */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-[11px] text-[#64748B] block">Initial Purchased</span>
            <span className="text-sm font-bold text-[#1F2937]">{formatQuantity(batch.purchasedQuantity, batch.unit)}</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-[11px] text-[#64748B] block">Quantity Sold</span>
            <span className="text-sm font-bold text-[#64748B]">{formatQuantity(batch.soldQuantity, batch.unit)}</span>
          </div>

          <div className="p-3 bg-teal-50 rounded-xl border border-teal-100">
            <span className="text-[11px] text-[#0F766E] block font-bold">Remaining Available</span>
            <span className="text-base font-extrabold text-[#0F766E]">
              {formatQuantity(batch.availableQuantity, batch.unit)}
            </span>
          </div>
        </div>

        {/* Product & Cost Allocation Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl space-y-1.5">
            <span className="font-bold text-[#64748B] uppercase tracking-wider block text-[10px]">Produce Origin</span>
            <div>
              <span className="text-[#64748B]">Crop: </span>
              <span className="font-bold text-[#1F2937]">{batch.cropName} ({batch.variety || 'Standard'})</span>
            </div>
            <div>
              <span className="text-[#64748B]">Farmer Supplier: </span>
              <span className="font-semibold text-[#1F2937]">{batch.farmerName}</span>
            </div>
            <div>
              <span className="text-[#64748B]">Purchase Date: </span>
              <span>{formatDate(batch.purchaseDate)}</span>
            </div>
            <div>
              <span className="text-[#64748B]">Quality Grade: </span>
              <span className="font-semibold text-[#0F766E]">{batch.quality || 'Grade A'}</span>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl space-y-1.5">
            <span className="font-bold text-[#64748B] uppercase tracking-wider block text-[10px]">Cost &amp; Valuation</span>
            <div>
              <span className="text-[#64748B]">Purchase Rate: </span>
              <span className="font-semibold text-[#1F2937]">{formatINR(batch.purchaseRate)} / {batch.unit}</span>
            </div>
            <div>
              <span className="text-[#64748B]">Allocated Surcharges: </span>
              <span>{formatINR(batch.allocatedCharges || 0)}</span>
            </div>
            <div className="pt-1 border-t border-slate-200">
              <span className="text-[#64748B]">Average Landed Cost: </span>
              <span className="font-bold text-[#0F766E]">{formatINR(batch.averageCost, true)} / {batch.unit}</span>
            </div>
            <div>
              <span className="text-[#64748B]">Godown Shed: </span>
              <span>{batch.godownLocation || 'Main AMC Warehouse'}</span>
            </div>
          </div>
        </div>

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

export default BatchDetails;

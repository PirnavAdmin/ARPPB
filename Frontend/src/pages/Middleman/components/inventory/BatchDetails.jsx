import React, { useState } from 'react';
import { X, Edit2, Check, RotateCcw } from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge';
import { formatINR, formatDate, formatQuantity } from '../../../../utils/middleman/formatters';

export const BatchDetails = ({
  batch,
  onClose,
  onUpdateBatch,
}) => {
  if (!batch) return null;

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    availableQuantity: batch.availableQuantity ?? batch.purchasedQuantity ?? 0,
    soldQuantity: batch.soldQuantity ?? 0,
    godownLocation: batch.godownLocation || 'Main AMC Warehouse',
    minimumThreshold: batch.minimumThreshold ?? 10,
    status: batch.status || 'In Stock',
  });

  const handleSave = async () => {
    if (!onUpdateBatch) return;
    setIsSaving(true);
    try {
      await onUpdateBatch(batch.stockId || batch.id, editForm);
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-[#E2E8F0] p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold text-[#1F2937]">
                Batch Traceability &bull; <span className="font-mono text-[#0F766E]">{batch.stockId}</span>
              </h3>
              <StatusBadge status={isEditing ? editForm.status : batch.status} size="sm" />
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
            {isEditing ? (
              <input
                type="number"
                min="0"
                value={editForm.soldQuantity}
                onChange={(e) => setEditForm((prev) => ({ ...prev, soldQuantity: Number(e.target.value) || 0 }))}
                className="w-full mt-1 px-2 py-1 text-xs border border-[#E2E8F0] rounded-lg focus:outline-hidden focus:border-[#0F766E]"
              />
            ) : (
              <span className="text-sm font-bold text-[#64748B]">{formatQuantity(batch.soldQuantity, batch.unit)}</span>
            )}
          </div>

          <div className="p-3 bg-teal-50 rounded-xl border border-teal-100">
            <span className="text-[11px] text-[#0F766E] block font-bold">Remaining Available</span>
            {isEditing ? (
              <input
                type="number"
                min="0"
                value={editForm.availableQuantity}
                onChange={(e) => setEditForm((prev) => ({ ...prev, availableQuantity: Number(e.target.value) || 0 }))}
                className="w-full mt-1 px-2 py-1 text-xs border border-teal-300 rounded-lg focus:outline-hidden focus:border-[#0F766E] font-bold text-[#0F766E]"
              />
            ) : (
              <span className="text-base font-extrabold text-[#0F766E]">
                {formatQuantity(batch.availableQuantity, batch.unit)}
              </span>
            )}
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
            <span className="font-bold text-[#64748B] uppercase tracking-wider block text-[10px]">Cost &amp; Storage Details</span>
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
              {isEditing ? (
                <input
                  type="text"
                  value={editForm.godownLocation}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, godownLocation: e.target.value }))}
                  className="w-full mt-1 px-2 py-1 text-xs border border-[#E2E8F0] rounded-lg focus:outline-hidden focus:border-[#0F766E]"
                />
              ) : (
                <span>{batch.godownLocation || 'Main AMC Warehouse'}</span>
              )}
            </div>
            {isEditing && (
              <div>
                <span className="text-[#64748B]">Stock Status: </span>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, status: e.target.value }))}
                  className="w-full mt-1 px-2 py-1 text-xs border border-[#E2E8F0] rounded-lg bg-white focus:outline-hidden focus:border-[#0F766E]"
                >
                  <option value="In Stock">In Stock</option>
                  <option value="Low Stock">Low Stock</option>
                  <option value="Exhausted">Exhausted</option>
                </select>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-[#E2E8F0]">
          {onUpdateBatch && (
            isEditing ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-[#0F766E] text-white hover:bg-[#115E59] shadow-xs cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{isSaving ? 'Saving...' : 'Save to DB'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-[#1F2937] cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Cancel</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-[#E2E8F0] hover:bg-slate-50 text-[#0F766E] cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Adjust Stock in DB</span>
              </button>
            )
          )}

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-[#1F2937] cursor-pointer ml-auto"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default BatchDetails;

import React from 'react';
import { X, Phone, Mail, MapPin, Edit2 } from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge';
import { formatINR, formatIndianNumber } from '../../../../utils/middleman/formatters';

export const FarmerDetails = ({
  farmer,
  onClose,
  onEdit,
}) => {
  if (!farmer) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-[#E2E8F0] p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold text-[#1F2937]">{farmer.name}</h3>
              <StatusBadge status={farmer.status || 'Active'} size="sm" />
            </div>
            <p className="text-xs font-mono text-[#0F766E]">{farmer.farmerId}</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-[#94A3B8] hover:text-[#1F2937] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Financial & Metric Snapshot Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="p-3 bg-teal-50/50 rounded-xl border border-teal-100">
            <span className="text-[11px] text-[#0F766E] font-medium block">Total Transactions</span>
            <span className="text-sm font-bold text-[#1F2937]">{farmer.totalPurchases || 0}</span>
          </div>

          <div className="p-3 bg-teal-50/50 rounded-xl border border-teal-100">
            <span className="text-[11px] text-[#0F766E] font-medium block">Total Purchased</span>
            <span className="text-sm font-bold text-[#1F2937]">
              {formatIndianNumber(farmer.totalQuantityPurchased || 0)} Qtl
            </span>
          </div>

          <div className="p-3 bg-teal-50/50 rounded-xl border border-teal-100">
            <span className="text-[11px] text-[#0F766E] font-medium block">Total Value</span>
            <span className="text-sm font-bold text-[#1F2937]">
              {formatINR(farmer.totalPurchaseValue || 0)}
            </span>
          </div>

          <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200">
            <span className="text-[11px] text-[#D97706] font-medium block">Payables Due</span>
            <span className="text-sm font-bold text-[#D97706]">
              {formatINR(farmer.outstandingPayables || 0)}
            </span>
          </div>
        </div>

        {/* Contact & Address Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="space-y-2">
            <h4 className="font-bold text-[#1F2937] text-xs uppercase tracking-wider text-[#64748B]">
              Contact Details
            </h4>
            <div className="p-3 bg-slate-50 rounded-xl space-y-2">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#0F766E]" />
                <span className="font-semibold">{farmer.mobile}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#64748B]" />
                <span>{farmer.email || 'No email provided'}</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold text-[#1F2937] text-xs uppercase tracking-wider text-[#64748B]">
              Location &amp; Address
            </h4>
            <div className="p-3 bg-slate-50 rounded-xl space-y-1">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-[#0F766E] mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-[#1F2937]">
                    {farmer.village}, {farmer.mandal ? `${farmer.mandal} Mandal, ` : ''}{farmer.district}
                  </p>
                  <p className="text-[#64748B]">{farmer.state} - {farmer.pinCode}</p>
                  {farmer.completeAddress && (
                    <p className="text-[11px] text-[#64748B] mt-1">{farmer.completeAddress}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Crops Cultivated */}
        <div className="space-y-1.5">
          <h4 className="font-bold text-xs uppercase tracking-wider text-[#64748B]">Available Crops Cultivated</h4>
          <div className="flex flex-wrap gap-1.5">
            {farmer.crops?.map((c) => (
              <span
                key={c}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-teal-50 text-[#0F766E] border border-teal-100"
              >
                {c}
              </span>
            ))}
          </div>
        </div>

        {/* Notes */}
        {farmer.notes && (
          <div className="p-3 rounded-xl bg-slate-50 border border-[#E2E8F0] text-xs">
            <span className="font-semibold text-[#64748B] block mb-0.5">Notes &amp; Observations:</span>
            <p className="text-[#1F2937] leading-relaxed">{farmer.notes}</p>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-[#E2E8F0]">
          <button
            type="button"
            onClick={() => onEdit(farmer)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[#0F766E] text-white hover:bg-[#115E59] cursor-pointer"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Edit Profile</span>
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

export default FarmerDetails;

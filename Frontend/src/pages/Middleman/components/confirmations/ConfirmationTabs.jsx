import React from 'react';
import { Users, Building2, Store } from 'lucide-react';

export const ConfirmationTabs = ({
  activeTab = 'Farmer',
  onTabChange,
  statusFilter = 'ALL',
  onStatusChange,
  counts = {},
}) => {
  return (
    <div className="space-y-4">
      {/* Primary Party Tabs */}
      <div className="flex items-center border-b border-[#E2E8F0] gap-2 sm:gap-4 overflow-x-auto">
        <button
          type="button"
          onClick={() => onTabChange('Farmer')}
          className={`flex items-center gap-2 pb-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'Farmer'
              ? 'border-[#0F766E] text-[#0F766E]'
              : 'border-transparent text-[#64748B] hover:text-[#1F2937]'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Farmer Confirmations</span>
          <span className="px-2 py-0.5 text-xs rounded-full bg-slate-100 text-[#64748B]">
            {counts.farmer || 0}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onTabChange('Vendor')}
          className={`flex items-center gap-2 pb-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'Vendor'
              ? 'border-[#0F766E] text-[#0F766E]'
              : 'border-transparent text-[#64748B] hover:text-[#1F2937]'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Vendor Confirmations</span>
          <span className="px-2 py-0.5 text-xs rounded-full bg-slate-100 text-[#64748B]">
            {counts.vendor || 0}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onTabChange('Customer')}
          className={`flex items-center gap-2 pb-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'Customer'
              ? 'border-[#0F766E] text-[#0F766E]'
              : 'border-transparent text-[#64748B] hover:text-[#1F2937]'
          }`}
        >
          <Store className="w-4 h-4" />
          <span>Customer Confirmations</span>
          <span className="px-2 py-0.5 text-xs rounded-full bg-slate-100 text-[#64748B]">
            {counts.customer || 0}
          </span>
        </button>
      </div>

      {/* Status Filter Chips */}
      <div className="flex flex-wrap items-center gap-1.5">
        {['ALL', 'Pending', 'Confirmed', 'Rejected', 'Expired'].map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => onStatusChange(status)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
              statusFilter === status
                ? 'bg-[#0F766E] text-white shadow-xs'
                : 'bg-white border border-[#E2E8F0] text-[#64748B] hover:bg-slate-50 hover:text-[#1F2937]'
            }`}
          >
            {status === 'ALL' ? 'All Statuses' : status}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ConfirmationTabs;


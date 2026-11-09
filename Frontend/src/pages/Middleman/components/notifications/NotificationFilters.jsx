import React from 'react';
import { CheckCheck } from 'lucide-react';
import { NOTIFICATION_CATEGORIES } from '../../../../data/mock/middleman/notificationData';

export const NotificationFilters = ({
  statusFilter = 'ALL',
  onStatusChange,
  categoryFilter = 'ALL',
  onCategoryChange,
  onMarkAllRead,
  unreadCount = 0,
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-[#E2E8F0]">
      {/* Read Status Chips */}
      <div className="flex items-center gap-1.5">
        {[
          { key: 'ALL', label: 'All' },
          { key: 'UNREAD', label: `Unread (${unreadCount})` },
          { key: 'READ', label: 'Read' },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => onStatusChange(tab.key)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
              statusFilter === tab.key
                ? 'bg-[#0F766E] text-white shadow-xs'
                : 'bg-slate-50 border border-[#E2E8F0] text-[#64748B] hover:text-[#1F2937]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Categories & Mark All Read */}
      <div className="flex items-center gap-2.5 flex-wrap">
        <select
          value={categoryFilter}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-[#E2E8F0] bg-white text-[#1F2937] outline-none cursor-pointer"
        >
          <option value="ALL">All Categories</option>
          {NOTIFICATION_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={onMarkAllRead}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-teal-50 border border-teal-200 text-[#0F766E] hover:bg-teal-100/60 cursor-pointer transition-all"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>Mark all read</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default NotificationFilters;


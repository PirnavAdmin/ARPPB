import React from 'react';
import { Calendar, ChevronDown } from 'lucide-react';
import { DATE_FILTER_OPTIONS } from '../../../../data/mock/middleman/dashboardData';

export const DateRangePicker = ({
  value = 'This Month',
  onChange,
  className = '',
}) => {
  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <Calendar className="w-3.5 h-3.5 text-[#0F766E] absolute left-3 pointer-events-none" />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-8 pr-8 py-2 text-xs sm:text-sm bg-white rounded-xl border border-[#E2E8F0] text-[#1F2937] font-medium hover:border-[#CBD5E1] focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15 outline-none cursor-pointer appearance-none transition-all shadow-2xs"
      >
        {DATE_FILTER_OPTIONS.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
      <ChevronDown className="w-3.5 h-3.5 text-[#64748B] absolute right-2.5 pointer-events-none" />
    </div>
  );
};

export default DateRangePicker;


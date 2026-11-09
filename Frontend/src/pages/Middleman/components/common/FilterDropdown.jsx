import React from 'react';
import { Filter, ChevronDown } from 'lucide-react';

export const FilterDropdown = ({
  label,
  value,
  onChange,
  options = [],
  icon: Icon = Filter,
  className = '',
}) => {
  return (
    <div className={`relative inline-flex items-center ${className}`}>
      {Icon && (
        <Icon className="w-3.5 h-3.5 text-[#64748B] absolute left-3 pointer-events-none" />
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-8 pr-8 py-2 text-xs sm:text-sm bg-white rounded-xl border border-[#E2E8F0] text-[#1F2937] hover:border-[#CBD5E1] focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15 outline-none cursor-pointer appearance-none transition-all font-medium"
      >
        {label && <option value="ALL">{label}: All</option>}
        {options.map((opt) => {
          const val = typeof opt === 'string' ? opt : opt.value;
          const text = typeof opt === 'string' ? opt : opt.label;
          return (
            <option key={val} value={val}>
              {text}
            </option>
          );
        })}
      </select>
      <ChevronDown className="w-3.5 h-3.5 text-[#64748B] absolute right-2.5 pointer-events-none" />
    </div>
  );
};

export default FilterDropdown;


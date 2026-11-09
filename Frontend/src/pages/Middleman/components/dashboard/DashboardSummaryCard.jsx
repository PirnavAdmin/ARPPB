import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

export const DashboardSummaryCard = ({
  title,
  value,
  icon: Icon,
  description,
  trend = null, // { value: '+12%', isPositive: true }
  trendLabel = 'vs last month',
  accentColor = 'teal',
  className = '',
}) => {
  return (
    <div
      className={`bg-white rounded-2xl border border-[#E2E8F0] p-4 sm:p-5 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="text-xs font-semibold text-[#64748B] tracking-tight">{title}</span>
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
            accentColor === 'amber'
              ? 'bg-amber-50 text-[#D97706]'
              : accentColor === 'emerald'
              ? 'bg-emerald-50 text-[#15803D]'
              : accentColor === 'blue'
              ? 'bg-blue-50 text-[#2563EB]'
              : 'bg-teal-50 text-[#0F766E]'
          }`}
        >
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="mt-2.5">
        <div className="text-xl sm:text-2xl font-extrabold text-[#1F2937] tracking-tight truncate">
          {value}
        </div>

        <div className="flex items-center gap-2 mt-1.5 text-xs">
          {trend && (
            <span
              className={`inline-flex items-center text-[11px] font-bold ${
                trend.isPositive ? 'text-[#15803D]' : 'text-[#DC2626]'
              }`}
            >
              {trend.isPositive ? (
                <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
              ) : (
                <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />
              )}
              {trend.value}
            </span>
          )}
          <span className="text-[11px] text-[#64748B] truncate">{description || trendLabel}</span>
        </div>
      </div>
    </div>
  );
};

export default DashboardSummaryCard;


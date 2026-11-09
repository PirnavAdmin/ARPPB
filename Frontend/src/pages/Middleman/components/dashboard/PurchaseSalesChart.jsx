import React, { useState } from 'react';
import { MONTHLY_PURCHASE_SALES_SERIES } from '../../../../data/mock/middleman/dashboardData';
import { formatINR } from '../../../../utils/middleman/formatters';

export const PurchaseSalesChart = ({ className = '' }) => {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const series = MONTHLY_PURCHASE_SALES_SERIES;
  const maxValue = Math.max(
    ...series.map((s) => Math.max(s.purchases, s.vendorSales + s.customerSales))
  );

  return (
    <div className={`flex flex-col flex-1 min-h-0 justify-between gap-4 ${className}`}>
      {/* Chart Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-[#64748B] shrink-0">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-md bg-[#0F766E]" />
          <span>Farmer Purchases</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-md bg-[#14B8A6]" />
          <span>Vendor Sales</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-md bg-[#10B981]" />
          <span>Customer Sales</span>
        </div>
      </div>

      {/* Responsive Bar Chart Container */}
      <div className="flex-1 min-h-0 h-64 pt-6 flex items-end justify-between gap-2 sm:gap-4 border-b border-[#E2E8F0] relative">
        {series.map((item, index) => {
          const purchaseHeight = (item.purchases / maxValue) * 100;
          const vendorHeight = (item.vendorSales / maxValue) * 100;
          const customerHeight = (item.customerSales / maxValue) * 100;

          const isHovered = hoveredIndex === index;

          return (
            <div
              key={item.month}
              className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer relative"
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {/* Tooltip */}
              {isHovered && (
                <div className="absolute -top-16 z-20 bg-[#1F2937] text-white p-2.5 rounded-xl shadow-xl text-[11px] whitespace-nowrap pointer-events-none animate-fadeIn">
                  <div className="font-bold text-center border-b border-gray-700 pb-1 mb-1">
                    {item.month} Summary
                  </div>
                  <div className="text-[#CCFBF1]">Purchases: {formatINR(item.purchases)}</div>
                  <div className="text-[#5EEAD4]">Vendor Sales: {formatINR(item.vendorSales)}</div>
                  <div className="text-[#6EE7B7]">Customer Sales: {formatINR(item.customerSales)}</div>
                </div>
              )}

              {/* Bars Group */}
              <div className="w-full max-w-[48px] flex items-end justify-center gap-1 sm:gap-1.5 h-full">
                {/* Purchase Bar */}
                <div
                  className="w-1/3 bg-[#0F766E] rounded-t-md transition-all duration-300 group-hover:brightness-110"
                  style={{ height: `${purchaseHeight}%` }}
                />

                {/* Vendor Sale Bar */}
                <div
                  className="w-1/3 bg-[#14B8A6] rounded-t-md transition-all duration-300 group-hover:brightness-110"
                  style={{ height: `${vendorHeight}%` }}
                />

                {/* Customer Sale Bar */}
                <div
                  className="w-1/3 bg-[#10B981] rounded-t-md transition-all duration-300 group-hover:brightness-110"
                  style={{ height: `${customerHeight}%` }}
                />
              </div>

              {/* X Axis Label */}
              <span className="mt-2 text-xs font-semibold text-[#64748B] group-hover:text-[#0F766E]">
                {item.month}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PurchaseSalesChart;


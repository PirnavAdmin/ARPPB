import React from 'react';
import { useMiddleman } from '../../../../context/middleman';
import { aggregateInventoryByCrop } from '../../../../utils/middleman/inventoryHelpers';
import { formatIndianNumber } from '../../../../utils/middleman/formatters';

const CROP_COLORS = {
  Paddy: '#0F766E',
  Wheat: '#F59E0B',
  Maize: '#EAB308',
  Groundnut: '#84CC16',
  Cotton: '#14B8A6',
  Chilli: '#EF4444',
  default: '#64748B',
};

export const CropInventoryChart = ({ className = '' }) => {
  const { inventory } = useMiddleman();

  const aggregated = aggregateInventoryByCrop(inventory);
  const maxQty = Math.max(...aggregated.map((c) => c.availableQuantity), 100);

  return (
    <div className={`flex flex-col flex-1 min-h-0 h-full overflow-hidden ${className}`}>
      {/* Fixed Inventory Column Header */}
      <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-[#E2E8F0] text-[11px] font-bold uppercase tracking-wider text-[#64748B] shrink-0">
        <span>Crop ({aggregated.length})</span>
        <span>Available Stock</span>
      </div>

      {/* Vertically Scrollable Inventory Records List */}
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden pr-1.5 space-y-3">
        {aggregated.map((item) => {
          const pct = Math.min(100, Math.round((item.availableQuantity / maxQty) * 100));
          const color = CROP_COLORS[item.cropName] || CROP_COLORS.default;

          return (
            <div
              key={item.cropName}
              className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]/80 space-y-2 transition-colors hover:border-[#14B8A6]/40"
            >
              <div className="flex items-center justify-between text-xs gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  <span className="font-bold text-[#1F2937] truncate">{item.cropName}</span>
                </div>
                <span className="font-extrabold text-[#0F766E] whitespace-nowrap shrink-0">
                  {formatIndianNumber(item.availableQuantity)} {item.unit}
                </span>
              </div>

              <div className="w-full h-2.5 bg-slate-200/70 rounded-full overflow-hidden flex">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: color,
                  }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-[#64748B]">
                <span>
                  Purchased: <strong className="text-[#1F2937]">{formatIndianNumber(item.totalPurchased)} {item.unit}</strong>
                </span>
                <span>
                  Sold: <strong className="text-[#1F2937]">{formatIndianNumber(item.totalSold)} {item.unit}</strong>
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CropInventoryChart;


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
    <div className={`space-y-3.5 ${className}`}>
      {aggregated.map((item) => {
        const pct = Math.min(100, Math.round((item.availableQuantity / maxQty) * 100));
        const color = CROP_COLORS[item.cropName] || CROP_COLORS.default;

        return (
          <div key={item.cropName} className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[#1F2937]">{item.cropName}</span>
              <span className="font-semibold text-[#0F766E]">
                {formatIndianNumber(item.availableQuantity)} {item.unit}
              </span>
            </div>

            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden flex">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${pct}%`,
                  backgroundColor: color,
                }}
              />
            </div>

            <div className="flex justify-between text-[10px] text-[#64748B]">
              <span>Purchased: {formatIndianNumber(item.totalPurchased)} {item.unit}</span>
              <span>Sold: {formatIndianNumber(item.totalSold)} {item.unit}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default CropInventoryChart;

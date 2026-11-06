import React from 'react';
import { Eye } from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge';
import { formatINR, formatDate, formatQuantity } from '../../../../utils/middleman/formatters';

export const InventoryTable = ({
  batches = [],
  onViewBatch,
}) => {
  return (
    <div className="w-full overflow-x-auto rounded-xl border border-[#E2E8F0] bg-white">
      <table className="w-full text-left border-collapse min-w-[920px]">
        <thead>
          <tr className="bg-slate-50/80 border-b border-[#E2E8F0]">
            <th className="py-3 px-3 text-[11px] font-semibold text-[#64748B] uppercase">Stock ID</th>
            <th className="py-3 px-3 text-[11px] font-semibold text-[#64748B] uppercase">Crop Name</th>
            <th className="py-3 px-3 text-[11px] font-semibold text-[#64748B] uppercase">Farmer Name</th>
            <th className="py-3 px-3 text-[11px] font-semibold text-[#64748B] uppercase">Purchase Date</th>
            <th className="py-3 px-3 text-[11px] font-semibold text-[#64748B] uppercase text-right">Purchased</th>
            <th className="py-3 px-3 text-[11px] font-semibold text-[#64748B] uppercase text-right">Sold</th>
            <th className="py-3 px-3 text-[11px] font-semibold text-[#64748B] uppercase text-right">Available</th>
            <th className="py-3 px-3 text-[11px] font-semibold text-[#64748B] uppercase text-right">Purchase Rate</th>
            <th className="py-3 px-3 text-[11px] font-semibold text-[#64748B] uppercase text-right">Average Cost</th>
            <th className="py-3 px-3 text-[11px] font-semibold text-[#64748B] uppercase">Quality</th>
            <th className="py-3 px-3 text-[11px] font-semibold text-[#64748B] uppercase">Status</th>
            <th className="py-3 px-3 text-[11px] font-semibold text-[#64748B] uppercase text-center">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#E2E8F0] text-xs text-[#1F2937]">
          {batches.map((batch) => (
            <tr key={batch.stockId} className="hover:bg-slate-50/60 transition-colors">
              <td className="py-3 px-3 font-mono font-bold text-[#0F766E]">{batch.stockId}</td>
              <td className="py-3 px-3 font-bold text-[#1F2937]">
                {batch.cropName}
                <span className="block text-[10px] text-[#64748B] font-normal">{batch.variety || 'Standard'}</span>
              </td>
              <td className="py-3 px-3 font-medium text-[#1F2937]">{batch.farmerName}</td>
              <td className="py-3 px-3 text-[#64748B] whitespace-nowrap">{formatDate(batch.purchaseDate)}</td>
              <td className="py-3 px-3 text-right font-medium">{formatQuantity(batch.purchasedQuantity, batch.unit)}</td>
              <td className="py-3 px-3 text-right text-[#64748B]">{formatQuantity(batch.soldQuantity, batch.unit)}</td>
              <td className="py-3 px-3 text-right font-extrabold text-[#0F766E]">
                {formatQuantity(batch.availableQuantity, batch.unit)}
              </td>
              <td className="py-3 px-3 text-right text-[#64748B]">{formatINR(batch.purchaseRate)}</td>
              <td className="py-3 px-3 text-right font-bold text-[#1F2937]">{formatINR(batch.averageCost, true)}</td>
              <td className="py-3 px-3">
                <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-[#1F2937]">
                  {batch.quality || 'Grade A'}
                </span>
              </td>
              <td className="py-3 px-3">
                <StatusBadge status={batch.status} size="sm" />
              </td>
              <td className="py-3 px-3 text-center">
                <button
                  type="button"
                  onClick={() => onViewBatch(batch)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-[#0F766E] cursor-pointer"
                  title="View Batch Traceability"
                >
                  <Eye className="w-4 h-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default InventoryTable;

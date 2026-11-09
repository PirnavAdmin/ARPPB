import React from 'react';
import { EmptyState } from './EmptyState';

export const DataTable = ({
  columns = [],
  data = [],
  keyField = 'id',
  emptyTitle = 'No data available',
  emptyDescription = 'There are no records matching the current selection.',
  className = '',
  onRowClick = null,
}) => {
  if (!data || data.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className={`w-full overflow-x-auto rounded-xl border border-[#E2E8F0] bg-white ${className}`}>
      <table className="w-full text-left border-collapse min-w-[640px]">
        <thead>
          <tr className="bg-slate-50/80 border-b border-[#E2E8F0]">
            {columns.map((col, idx) => (
              <th
                key={idx}
                className={`py-3 px-3.5 sm:px-4 text-[11px] sm:text-xs font-semibold text-[#64748B] uppercase tracking-wider ${
                  col.align === 'right'
                    ? 'text-right'
                    : col.align === 'center'
                    ? 'text-center'
                    : 'text-left'
                } ${col.className || ''}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#E2E8F0] text-xs sm:text-sm text-[#1F2937]">
          {data.map((row, rowIdx) => {
            const key = row[keyField] || rowIdx;
            return (
              <tr
                key={key}
                onClick={() => onRowClick && onRowClick(row)}
                className={`transition-colors duration-150 ${
                  onRowClick ? 'cursor-pointer hover:bg-teal-50/30' : 'hover:bg-slate-50/60'
                }`}
              >
                {columns.map((col, colIdx) => {
                  let content = null;
                  if (typeof col.render === 'function') {
                    content = col.render(row, rowIdx);
                  } else if (col.accessor) {
                    content = row[col.accessor];
                  }

                  return (
                    <td
                      key={colIdx}
                      className={`py-3 px-3.5 sm:px-4 align-middle ${
                        col.align === 'right'
                          ? 'text-right'
                          : col.align === 'center'
                          ? 'text-center'
                          : 'text-left'
                      } ${col.className || ''}`}
                    >
                      {content !== undefined && content !== null ? content : '—'}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;


import { useState, useMemo } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import VendorEmptyState from './VendorEmptyState';
import VendorLoading from './VendorLoading';
import VendorError from './VendorError';
import VendorPagination from './VendorPagination';
import { usePagination } from '../../hooks/usePagination';

export function VendorDataTable({
  columns = [],
  data = [],
  rowKey = 'id',
  isLoading = false,
  error = null,
  onRetry = null,
  emptyTitle = 'No matching records found',
  emptyDescription = 'Try clearing your search or changing filter criteria.',
  emptyIcon,
  onResetFilters = null,
  initialPageSize = 10,
  enablePagination = true,
  onRowClick = null,
}) {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  const sortedData = useMemo(() => {
    if (!sortConfig.key) return data;
    const col = columns.find((c) => c.key === sortConfig.key);
    return [...data].sort((a, b) => {
      const valA = col?.sortAccessor ? col.sortAccessor(a) : a?.[sortConfig.key];
      const valB = col?.sortAccessor ? col.sortAccessor(b) : b?.[sortConfig.key];

      if (valA === valB) return 0;
      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;

      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortConfig.direction === 'asc' ? valA - valB : valB - valA;
      }

      const strA = String(valA).toLowerCase();
      const strB = String(valB).toLowerCase();
      if (strA < strB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (strA > strB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortConfig, columns]);

  const {
    currentPage,
    pageSize,
    totalRecords,
    totalPages,
    paginatedItems,
    setCurrentPage,
    setPageSize,
    startIndex,
    endIndex,
  } = usePagination(sortedData, initialPageSize);

  const rowsToDisplay = enablePagination ? paginatedItems : sortedData;

  const handleSort = (col) => {
    if (!col.sortable) return;
    setSortConfig((prev) => {
      if (prev.key === col.key) {
        return { key: col.key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key: col.key, direction: 'asc' };
    });
  };

  if (isLoading) {
    return <VendorLoading />;
  }

  if (error) {
    return <VendorError message={error} onRetry={onRetry} />;
  }

  if (!data || data.length === 0) {
    return (
      <VendorEmptyState
        icon={emptyIcon}
        title={emptyTitle}
        description={emptyDescription}
        actionLabel={onResetFilters ? 'Reset Search & Filters' : ''}
        onAction={onResetFilters}
      />
    );
  }

  return (
    <div className="bg-brand-surface rounded-xl border border-brand-border shadow-2xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-brand-light/45 border-b border-brand-border">
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col)}
                  className={`px-4 py-3 text-xs font-bold text-brand-primary uppercase tracking-wider whitespace-nowrap ${
                    col.align === 'right'
                      ? 'text-right'
                      : col.align === 'center'
                      ? 'text-center'
                      : 'text-left'
                  } ${col.sortable ? 'cursor-pointer select-none hover:bg-brand-light/80' : ''}`}
                >
                  <div
                    className={`inline-flex items-center gap-1 ${
                      col.align === 'right' ? 'justify-end w-full' : ''
                    }`}
                  >
                    <span>{col.header || col.label}</span>
                    {col.sortable && (
                      <span className="text-brand-primary/70 shrink-0">
                        {sortConfig.key === col.key ? (
                          sortConfig.direction === 'asc' ? (
                            <ArrowUp className="w-3.5 h-3.5 shrink-0" />
                          ) : (
                            <ArrowDown className="w-3.5 h-3.5 shrink-0" />
                          )
                        ) : (
                          <ArrowUpDown className="w-3.5 h-3.5 opacity-50 shrink-0" />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-border">
            {rowsToDisplay.map((row, idx) => {
              const keyVal =
                typeof rowKey === 'function' ? rowKey(row) : row?.[rowKey] || `row-${idx}`;
              return (
                <tr
                  key={keyVal}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={`transition-colors hover:bg-brand-light/25 ${
                    onRowClick ? 'cursor-pointer' : ''
                  }`}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`px-4 py-3 text-sm text-brand-text align-middle ${
                        col.align === 'right'
                          ? 'text-right'
                          : col.align === 'center'
                          ? 'text-center'
                          : 'text-left'
                      } ${col.key === 'actions' ? 'whitespace-nowrap' : ''} ${col.className || ''}`}
                    >
                      {typeof col.render === 'function'
                        ? col.render(row)
                        : row?.[col.key] ?? '—'}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {enablePagination && (
        <VendorPagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalRecords={totalRecords}
          pageSize={pageSize}
          startIndex={startIndex}
          endIndex={endIndex}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
        />
      )}
    </div>
  );
}

export default VendorDataTable;


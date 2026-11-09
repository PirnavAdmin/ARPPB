import { ChevronLeft, ChevronRight } from 'lucide-react';

export function VendorPagination({
  currentPage = 1,
  totalPages = 1,
  totalRecords = 0,
  pageSize = 10,
  startIndex = 0,
  endIndex = 0,
  onPageChange,
  onPageSizeChange,
}) {
  if (totalRecords === 0) return null;

  // Build ellipsis page items
  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i += 1) pages.push(i);
      return pages;
    }
    pages.push(1);
    if (currentPage > 3) pages.push('...');
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    for (let i = start; i <= end; i += 1) pages.push(i);
    if (currentPage < totalPages - 2) pages.push('...');
    pages.push(totalPages);
    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-brand-surface border-t border-brand-border text-xs text-brand-muted">
      <div className="flex items-center gap-3">
        <span>
          Showing <strong className="text-brand-text">{startIndex}</strong> to{' '}
          <strong className="text-brand-text">{endIndex}</strong> of{' '}
          <strong className="text-brand-text">{totalRecords}</strong> records
        </span>
        {onPageSizeChange && (
          <div className="flex items-center gap-1.5">
            <span>Rows:</span>
            <select
              aria-label="Rows per page"
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="px-2 py-1 bg-brand-background border border-brand-border rounded-md text-brand-text font-medium focus:outline-none focus:border-brand-primary cursor-pointer"
            >
              {[5, 10, 20, 50].map((sz) => (
                <option key={sz} value={sz}>
                  {sz}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-brand-border bg-brand-surface text-brand-text font-medium hover:bg-brand-light hover:text-brand-primary disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          Previous
        </button>

        <div className="flex items-center gap-1">
          {getPageNumbers().map((pg, idx) =>
            pg === '...' ? (
              <span key={`ell-${idx}`} className="px-2 py-1 text-brand-muted">
                ...
              </span>
            ) : (
              <button
                key={pg}
                type="button"
                onClick={() => onPageChange(pg)}
                className={`min-w-[30px] h-7 px-2 rounded-lg font-semibold transition-colors cursor-pointer ${
                  pg === currentPage
                    ? 'bg-brand-primary text-white shadow-xs'
                    : 'bg-brand-surface border border-brand-border text-brand-text hover:bg-brand-light hover:text-brand-primary'
                }`}
              >
                {pg}
              </button>
            )
          )}
        </div>

        <button
          type="button"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-brand-border bg-brand-surface text-brand-text font-medium hover:bg-brand-light hover:text-brand-primary disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
        >
          Next
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

export default VendorPagination;


import { Filter, RotateCcw } from 'lucide-react';

export function VendorFilters({
  filters = [],
  onFilterChange = null,
  onReset = null,
  children,
}) {
  const hasActiveFilter = filters.some(
    (f) =>
      f.value &&
      f.value !== 'All' &&
      f.value !== 'all' &&
      f.value !== 'All Time' &&
      f.value !== ''
  );

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <div className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-brand-muted mr-1">
        <Filter className="w-3.5 h-3.5 text-brand-primary" />
        <span>Filters:</span>
      </div>
      {filters.map((filter) => {
        const opts = filter.options || [];
        const hasBuiltInAll = opts.some((opt) => {
          const val = typeof opt === 'object' ? opt.value : opt;
          return val === 'All' || val === 'all' || val === 'All Time';
        });

        return (
          <div key={filter.key} className="flex items-center">
            <select
              aria-label={filter.label}
              value={filter.value}
              onChange={(e) => {
                const nextVal = e.target.value;
                if (typeof filter.onChange === 'function') {
                  filter.onChange(nextVal);
                } else if (typeof onFilterChange === 'function') {
                  onFilterChange(filter.key, nextVal);
                }
              }}
              className="px-3 py-2 text-xs font-medium bg-brand-surface border border-brand-border rounded-lg text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary cursor-pointer"
            >
              {!hasBuiltInAll && <option value="All">{filter.label}: All</option>}
              {opts.map((opt) => {
                const val = typeof opt === 'object' ? opt.value : opt;
                const lbl = typeof opt === 'object' ? opt.label : opt;
                return (
                  <option key={val} value={val}>
                    {lbl}
                  </option>
                );
              })}
            </select>
          </div>
        );
      })}
      {children}
      {hasActiveFilter && onReset && (
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-brand-light text-brand-primary hover:bg-brand-secondary hover:text-white transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset
        </button>
      )}
    </div>
  );
}

export default VendorFilters;

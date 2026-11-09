import { Calendar } from 'lucide-react';
import { DATE_RANGE_PRESETS } from '../../utils/constants';

export function VendorDatePicker({
  preset = 'all',
  onPresetChange,
  startDate = '',
  endDate = '',
  onStartDateChange,
  onEndDateChange,
  showPresets = true,
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {showPresets && onPresetChange && (
        <div className="relative flex items-center">
          <Calendar className="w-3.5 h-3.5 text-brand-primary absolute left-3 pointer-events-none" />
          <select
            aria-label="Select date range preset"
            value={preset}
            onChange={(e) => onPresetChange(e.target.value)}
            className="pl-8 pr-3 py-2 text-xs font-semibold bg-brand-surface border border-brand-border rounded-lg text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary cursor-pointer"
          >
            {DATE_RANGE_PRESETS.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {(preset === 'custom' || !showPresets) && (
        <div className="flex flex-wrap items-center gap-1.5">
          <input
            type="date"
            aria-label="Start date"
            value={startDate}
            onChange={(e) => onStartDateChange && onStartDateChange(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-brand-surface border border-brand-border rounded-lg text-brand-text focus:outline-none focus:border-brand-primary"
          />
          <span className="text-xs text-brand-muted">to</span>
          <input
            type="date"
            aria-label="End date"
            value={endDate}
            onChange={(e) => onEndDateChange && onEndDateChange(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-brand-surface border border-brand-border rounded-lg text-brand-text focus:outline-none focus:border-brand-primary"
          />
        </div>
      )}
    </div>
  );
}

export default VendorDatePicker;


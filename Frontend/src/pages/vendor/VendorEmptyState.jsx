import { Inbox, RotateCcw } from 'lucide-react';

export function VendorEmptyState({
  icon: Icon = Inbox,
  title = 'No records found',
  description = 'Try adjusting your search query or active filters to see matching agricultural records.',
  actionLabel = '',
  onAction = null,
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-brand-surface rounded-xl border border-dashed border-brand-border">
      <div className="w-12 h-12 rounded-full bg-brand-light flex items-center justify-center text-brand-primary mb-3">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-base font-semibold text-brand-text mb-1">{title}</h3>
      <p className="text-sm text-brand-muted max-w-md mb-4">{description}</p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-brand-light text-brand-primary hover:bg-brand-secondary hover:text-white transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export default VendorEmptyState;


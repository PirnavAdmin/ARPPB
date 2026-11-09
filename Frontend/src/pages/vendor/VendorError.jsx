import { AlertTriangle, RefreshCw } from 'lucide-react';

export function VendorError({
  title = 'Unable to load section data',
  message = 'An unexpected error occurred while retrieving records.',
  onRetry = null,
}) {
  return (
    <div
      role="alert"
      className="bg-brand-error-light/60 border border-brand-error/30 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
    >
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-brand-error/10 text-brand-error shrink-0">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-brand-text">{title}</h4>
          <p className="text-xs text-brand-muted mt-0.5">{message}</p>
        </div>
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-brand-primary text-white hover:bg-brand-secondary transition-colors cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Retry
        </button>
      )}
    </div>
  );
}

export default VendorError;


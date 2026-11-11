import { Inbox, RotateCcw } from 'lucide-react';

export function CustomerEmptyState({
  icon: Icon = Inbox,
  title = 'No records found',
  description = 'Try adjusting your search query or active filters to see matching records.',
  actionLabel = '',
  onAction = null,
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-white rounded-xl border border-dashed border-[#E2E8F0]">
      <div className="w-12 h-12 rounded-full bg-[#CCFBF1] flex items-center justify-center text-[#0F766E] mb-3">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-base font-semibold text-[#0F172A] mb-1">{title}</h3>
      <p className="text-sm text-[#64748B] max-w-md mb-4">{description}</p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-[#CCFBF1] text-[#0F766E] hover:bg-[#14B8A6] hover:text-white transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export default CustomerEmptyState;


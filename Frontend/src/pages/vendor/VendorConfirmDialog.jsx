import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import VendorModal from './VendorModal';

export function VendorConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  description = 'Are you sure you want to proceed with this action?',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger', // 'danger' | 'primary'
  children = null,
}) {
  const isDanger = variant === 'danger';

  return (
    <VendorModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-brand-light text-brand-primary hover:bg-brand-secondary hover:text-white transition-colors cursor-pointer"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 rounded-lg text-xs font-semibold text-white transition-colors cursor-pointer ${
              isDanger
                ? 'bg-brand-error hover:bg-brand-error/90'
                : 'bg-brand-primary hover:bg-brand-secondary'
            }`}
          >
            {confirmLabel}
          </button>
        </>
      }
    >
      <div className="flex items-start gap-3.5">
        <div
          className={`p-2.5 rounded-xl shrink-0 ${
            isDanger
              ? 'bg-brand-error-light text-brand-error'
              : 'bg-brand-light text-brand-primary'
          }`}
        >
          {isDanger ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
        </div>
        <div className="flex-1">
          <p className="text-sm text-brand-text leading-relaxed">{description}</p>
          {children && <div className="mt-3">{children}</div>}
        </div>
      </div>
    </VendorModal>
  );
}

export default VendorConfirmDialog;


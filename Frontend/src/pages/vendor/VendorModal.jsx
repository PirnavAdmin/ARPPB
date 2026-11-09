import { useEffect } from 'react';
import { X } from 'lucide-react';

export function VendorModal({
  isOpen,
  onClose,
  title,
  subtitle = '',
  size = 'lg',
  children,
  footer = null,
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClass =
    size === 'sm'
      ? 'max-w-md'
      : size === 'md'
      ? 'max-w-xl'
      : size === 'xl'
      ? 'max-w-5xl'
      : 'max-w-3xl';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="vendor-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-text/50 backdrop-blur-xs overflow-y-auto"
    >
      <div
        className={`relative w-full ${sizeClass} bg-brand-surface rounded-2xl border border-brand-border shadow-xl my-8 overflow-hidden flex flex-col max-h-[90vh]`}
      >
        <div className="flex items-start justify-between gap-4 px-6 py-4 bg-brand-light/40 border-b border-brand-border shrink-0">
          <div>
            <h2 id="vendor-modal-title" className="text-lg font-bold text-brand-primary">
              {title}
            </h2>
            {subtitle && <p className="text-xs text-brand-muted mt-0.5">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 rounded-lg text-brand-muted hover:text-brand-primary hover:bg-brand-light transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">{children}</div>

        {footer && (
          <div className="px-6 py-3.5 bg-brand-background border-t border-brand-border flex items-center justify-end gap-2.5 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export default VendorModal;


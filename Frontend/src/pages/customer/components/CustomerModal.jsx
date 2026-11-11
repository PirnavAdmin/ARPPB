import { useEffect } from 'react';
import { X } from 'lucide-react';

export function CustomerModal({
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
      aria-labelledby="customer-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F172A]/50 backdrop-blur-xs overflow-y-auto"
    >
      <div
        className={`relative w-full ${sizeClass} bg-white rounded-2xl border border-[#E2E8F0] shadow-xl my-8 overflow-hidden flex flex-col max-h-[90vh]`}
      >
        <div className="flex items-start justify-between gap-4 px-6 py-4 bg-[#CCFBF1]/40 border-b border-[#E2E8F0] shrink-0">
          <div>
            <h2 id="customer-modal-title" className="text-lg font-bold text-[#0F766E]">
              {title}
            </h2>
            {subtitle && <p className="text-xs text-[#64748B] mt-0.5">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 rounded-lg text-[#64748B] hover:text-[#0F766E] hover:bg-[#CCFBF1] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 text-[#0F172A]">{children}</div>

        {footer && (
          <div className="px-6 py-3.5 bg-[#F8FAFC] border-t border-[#E2E8F0] flex items-center justify-end gap-2.5 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export default CustomerModal;


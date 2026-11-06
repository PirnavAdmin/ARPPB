export function VendorFormField({
  label,
  id,
  required = false,
  error = '',
  hint = '',
  children,
  className = '',
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label htmlFor={id} className="text-xs font-semibold text-brand-text flex items-center gap-1">
          <span>{label}</span>
          {required && <span className="text-brand-error">*</span>}
        </label>
      )}
      {children}
      {hint && !error && <p className="text-[11px] text-brand-muted">{hint}</p>}
      {error && (
        <p role="alert" className="text-xs font-medium text-brand-error">
          {error}
        </p>
      )}
    </div>
  );
}

export const INPUT_CLASSES =
  'w-full px-3 py-2 text-sm bg-brand-surface border border-brand-border rounded-lg text-brand-text placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary disabled:bg-brand-background disabled:text-brand-muted transition-all';

export default VendorFormField;


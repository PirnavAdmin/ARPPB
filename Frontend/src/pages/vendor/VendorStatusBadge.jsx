import { BRAND_THEME } from '../../config/theme';

export function VendorStatusBadge({ status, size = 'sm', className = '' }) {
  const label = status || 'Unknown';
  const styleClass =
    BRAND_THEME.statusStyles[label] ||
    'bg-brand-light/70 text-brand-primary border-brand-secondary/30';

  const sizeClass =
    size === 'xs'
      ? 'px-2 py-0.5 text-[11px]'
      : size === 'md'
      ? 'px-3 py-1 text-xs'
      : 'px-2.5 py-0.5 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold rounded-full border whitespace-nowrap ${sizeClass} ${styleClass} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      {label}
    </span>
  );
}

export default VendorStatusBadge;


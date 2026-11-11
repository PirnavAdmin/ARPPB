const STATUS_STYLE_MAP = {
  Active: 'bg-[#DCFCE7] text-[#16A34A] border-[#16A34A]/20',
  Inactive: 'bg-[#F8FAFC] text-[#64748B] border-[#E2E8F0]',
  New: 'bg-[#CCFBF1] text-[#0F766E] border-[#14B8A6]/30',
  Confirmed: 'bg-[#CCFBF1] text-[#0F766E] border-[#14B8A6]/30',
  Verified: 'bg-[#DCFCE7] text-[#16A34A] border-[#16A34A]/20',
  Processing: 'bg-[#FEF3C7] text-[#D97706] border-[#D97706]/20',
  Packed: 'bg-[#E0F2FE] text-[#0369A1] border-[#0369A1]/20',
  Shipped: 'bg-[#CCFBF1] text-[#0F766E] border-[#14B8A6]/30',
  Delivered: 'bg-[#DCFCE7] text-[#15803D] border-[#15803D]/20',
  Completed: 'bg-[#DCFCE7] text-[#16A34A] border-[#16A34A]/20',
  Cancelled: 'bg-[#FEE2E2] text-[#DC2626] border-[#DC2626]/20',
  Pending: 'bg-[#FEF3C7] text-[#D97706] border-[#D97706]/20',
  Sent: 'bg-[#CCFBF1] text-[#0F766E] border-[#14B8A6]/30',
  Expired: 'bg-[#FEE2E2] text-[#DC2626] border-[#DC2626]/20',
  Failed: 'bg-[#FEE2E2] text-[#DC2626] border-[#DC2626]/20',
  'Failed Attempt': 'bg-[#FEE2E2] text-[#DC2626] border-[#DC2626]/20',
  Rejected: 'bg-[#FEE2E2] text-[#DC2626] border-[#DC2626]/20',
  'In Stock': 'bg-[#DCFCE7] text-[#16A34A] border-[#16A34A]/20',
  'Low Stock': 'bg-[#FEF3C7] text-[#D97706] border-[#D97706]/20',
  'Out of Stock': 'bg-[#FEE2E2] text-[#DC2626] border-[#DC2626]/20',
  High: 'bg-[#FEE2E2] text-[#DC2626] border-[#DC2626]/20',
  Medium: 'bg-[#FEF3C7] text-[#D97706] border-[#D97706]/20',
  Low: 'bg-[#CCFBF1] text-[#0F766E] border-[#14B8A6]/30',
};

export function CustomerStatusBadge({ status, size = 'sm', className = '' }) {
  const label = status || 'Unknown';
  const styleClass =
    STATUS_STYLE_MAP[label] ||
    'bg-[#CCFBF1]/70 text-[#0F766E] border-[#14B8A6]/30';

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
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80 shrink-0" />
      {label}
    </span>
  );
}

export default CustomerStatusBadge;


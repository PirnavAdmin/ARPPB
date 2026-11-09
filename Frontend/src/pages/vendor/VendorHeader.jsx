import { Building2, MapPin, Calendar } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { formatDate } from '../../utils/formatDate';

export function VendorHeader({ rightActions = null }) {
  const { vendorUser } = useAuth();
  const todayFormatted = formatDate(new Date(), 'dddd, DD MMM YYYY');

  return (
    <div className="bg-brand-surface rounded-xl border border-brand-border px-4 py-3 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
      <div className="flex flex-wrap items-center gap-4 text-xs text-brand-muted">
        <span className="inline-flex items-center gap-1.5 font-semibold text-brand-primary">
          <Building2 className="w-4 h-4 text-brand-secondary" />
          {vendorUser?.businessName}
        </span>
        <span className="inline-flex items-center gap-1">
          <MapPin className="w-3.5 h-3.5 text-brand-primary" />
          {vendorUser?.branchName || `${vendorUser?.district}, ${vendorUser?.state}`}
        </span>
        <span className="inline-flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5 text-brand-primary" />
          {todayFormatted}
        </span>
      </div>
      {rightActions && <div className="flex items-center gap-2">{rightActions}</div>}
    </div>
  );
}

export default VendorHeader;


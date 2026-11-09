import { ArrowLeft } from 'lucide-react';
import VendorPageHeader from './VendorPageHeader';

/**
 * Full-page detail view shell used by the Partners & Directory screens
 * (Farmers, Middlemen, Customers) when a record is opened via the Eye icon.
 * Renders inside the existing Vendor layout (sidebar + navbar remain visible).
 */
export function VendorDetailPage({
  title,
  subtitle = '',
  icon = null,
  backLabel = 'Back',
  onBack,
  children,
}) {
  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={onBack}
        className="group inline-flex items-center gap-2 h-9 px-3.5 rounded-xl text-xs font-semibold bg-white border border-[#E2E8F0] text-[#0F766E] hover:bg-[#CCFBF1] hover:border-[#14B8A6] shadow-2xs transition-colors duration-200 cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4 stroke-[2.2] transition-transform duration-200 group-hover:-translate-x-0.5" />
        <span>{backLabel}</span>
      </button>

      <VendorPageHeader title={title} subtitle={subtitle} icon={icon} showBreadcrumb={false} />

      <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-xs p-4 sm:p-6">
        {children}
      </div>
    </div>
  );
}

export default VendorDetailPage;


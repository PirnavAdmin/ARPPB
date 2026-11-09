import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { VENDOR_NAVIGATION } from '../../config/navigation';

export function VendorBreadcrumb({ customTitle = '' }) {
  const location = useLocation();
  const currentItem = VENDOR_NAVIGATION.find((item) =>
    location.pathname.startsWith(item.path)
  );

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-brand-muted">
      <Link
        to="/vendor/dashboard"
        className="inline-flex items-center gap-1 text-brand-muted hover:text-brand-primary transition-colors font-medium"
      >
        <Home className="w-3.5 h-3.5 text-brand-primary" />
        <span className="hidden sm:inline">Vendor Portal</span>
      </Link>

      {currentItem && (
        <>
          <ChevronRight className="w-3.5 h-3.5 text-brand-border shrink-0" />
          <span className="hidden md:inline text-brand-muted">{currentItem.group}</span>
          <ChevronRight className="hidden md:inline w-3.5 h-3.5 text-brand-border shrink-0" />
          <span className="font-semibold text-brand-primary truncate max-w-[200px]">
            {customTitle || currentItem.label}
          </span>
        </>
      )}
    </nav>
  );
}

export default VendorBreadcrumb;


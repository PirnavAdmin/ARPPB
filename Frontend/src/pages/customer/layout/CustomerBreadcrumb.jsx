import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

const CUSTOMER_ROUTE_META = [
  { path: '/customer/dashboard', label: 'Dashboard', group: 'Overview' },
  { path: '/customer/products', label: 'Browse Products', group: 'Marketplace' },
  { path: '/customer/categories', label: 'Categories', group: 'Marketplace' },
  { path: '/customer/cart', label: 'My Cart', group: 'Marketplace' },
  { path: '/customer/orders', label: 'My Orders', group: 'Orders & Verification' },
  { path: '/customer/purchase-history', label: 'Purchase History', group: 'Orders & Verification' },
  { path: '/customer/confirmations', label: 'OTP Confirmations', group: 'Orders & Verification' },
  { path: '/customer/notifications', label: 'Notifications', group: 'Account & Alerts' },
  { path: '/customer/profile', label: 'My Profile', group: 'Account & Alerts' },
];

export function CustomerBreadcrumb({ customTitle = '' }) {
  const location = useLocation();
  const currentItem = CUSTOMER_ROUTE_META.find((item) =>
    location.pathname.startsWith(item.path)
  );

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-[#64748B]">
      <Link
        to="/customer/dashboard"
        className="inline-flex items-center gap-1 text-[#64748B] hover:text-[#0F766E] transition-colors font-medium"
      >
        <Home className="w-3.5 h-3.5 text-[#0F766E] shrink-0" />
        <span className="hidden sm:inline">Customer Portal</span>
      </Link>

      {currentItem && (
        <>
          <ChevronRight className="w-3.5 h-3.5 text-[#CBD5E1] shrink-0" />
          <span className="hidden md:inline text-[#64748B]">{currentItem.group}</span>
          <ChevronRight className="hidden md:inline w-3.5 h-3.5 text-[#CBD5E1] shrink-0" />
          <span className="font-semibold text-[#0F766E] truncate max-w-[200px]">
            {customTitle || currentItem.label}
          </span>
        </>
      )}
    </nav>
  );
}

export default CustomerBreadcrumb;


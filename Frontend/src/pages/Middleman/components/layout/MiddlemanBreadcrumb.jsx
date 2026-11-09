import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

const ROUTE_LABELS = {
  middleman: 'Portal',
  dashboard: 'Dashboard',
  farmers: 'Farmers',
  vendors: 'Vendors',
  customers: 'Customers',
  purchases: 'Purchase from Farmers',
  sales: 'Sales',
  inventory: 'My Inventory',
  'purchase-history': 'Purchase History',
  'sales-history': 'Sales History',
  confirmations: 'OTP Confirmations',
  notifications: 'Notifications',
  profile: 'My Profile',
};

export const MiddlemanBreadcrumb = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  return (
    <nav className="flex items-center space-x-1 text-xs text-[#64748B]" aria-label="Breadcrumb">
      <Link
        to="/middleman/dashboard"
        className="inline-flex items-center gap-1 hover:text-[#0F766E] transition-colors"
      >
        <Home className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Home</span>
      </Link>

      {pathnames.slice(1).map((segment, index) => {
        const isLast = index === pathnames.slice(1).length - 1;
        const to = `/${pathnames.slice(0, index + 2).join('/')}`;
        const label = ROUTE_LABELS[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);

        return (
          <React.Fragment key={to}>
            <ChevronRight className="w-3.5 h-3.5 text-[#CBD5E1]" />
            {isLast ? (
              <span className="font-semibold text-[#1F2937] truncate">{label}</span>
            ) : (
              <Link to={to} className="hover:text-[#0F766E] transition-colors truncate">
                {label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};

export default MiddlemanBreadcrumb;

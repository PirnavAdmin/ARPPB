import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Sprout,
  LayoutDashboard,
  Users,
  Building2,
  ShoppingBag,
  ShoppingCart,
  ArrowUpRight,
  Store,
  Boxes,
  History,
  BadgePercent,
  ShieldCheck,
  BookOpen,
  Bell,
  UserCheck,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useMiddleman } from '../../../../context/middleman';

const NAV_ITEMS = [
  { path: '/middleman/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/middleman/farmers', label: 'Farmers', icon: Users },
  { path: '/middleman/vendors', label: 'Vendors', icon: Building2 },
  { path: '/middleman/customers', label: 'Customers', icon: ShoppingBag },
  { path: '/middleman/purchases', label: 'Purchase from Farmers', icon: ShoppingCart },
  { path: '/middleman/sales/vendors', label: 'Sales to Vendors', icon: ArrowUpRight },
  { path: '/middleman/sales/customers', label: 'Sales to Customers', icon: Store },
  { path: '/middleman/inventory', label: 'My Inventory', icon: Boxes },
  { path: '/middleman/purchase-history', label: 'Purchase History', icon: History },
  { path: '/middleman/sales-history', label: 'Sales History', icon: BadgePercent },
  { path: '/middleman/confirmations', label: 'OTP Confirmations', icon: ShieldCheck, hasBadge: 'confirmations' },
  { path: '/middleman/ledger', label: 'My Ledger', icon: BookOpen },
  { path: '/middleman/notifications', label: 'Notifications', icon: Bell, hasBadge: 'notifications' },
  { path: '/middleman/profile', label: 'My Profile', icon: UserCheck },
];

export const MiddlemanSidebar = ({
  isCollapsed = false,
  onToggleCollapse,
  className = '',
  onItemClick,
}) => {
  const { confirmations, notifications } = useMiddleman();

  const pendingConfirmationsCount = confirmations.filter((c) => c.otpStatus === 'Pending').length;
  const unreadNotificationsCount = notifications.filter((n) => !n.isRead).length;

  return (
    <aside
      className={`
        bg-[#0F766E] border-r border-[#115E59] text-white flex flex-col justify-between h-screen sticky top-0 z-30 transition-all duration-300
        ${isCollapsed ? 'w-20' : 'w-64'} ${className}
      `}
    >
      {/* Top Branding Section */}
      <div className="flex flex-col h-full overflow-hidden">
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <NavLink
            to="/middleman/dashboard"
            className="flex items-center gap-2.5 overflow-hidden select-none"
            onClick={onItemClick}
          >
            <div className="w-10 h-10 rounded-xl bg-[#14B8A6] text-white flex items-center justify-center flex-shrink-0 shadow-md shadow-black/10">
              <Sprout className="w-6 h-6 text-white" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col min-w-0">
                <span className="text-base font-extrabold text-white tracking-tight leading-none">
                  AgriConnect
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#CCFBF1] mt-1">
                  Middleman Portal
                </span>
              </div>
            )}
          </NavLink>

          {onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              className="p-1.5 rounded-lg text-[#CCFBF1] hover:bg-white/10 hover:text-white transition-colors cursor-pointer hidden md:flex"
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          )}
        </div>

        {/* Navigation Items (Scrollable) */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1 sidebar-scrollbar">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            let badgeCount = null;
            if (item.hasBadge === 'confirmations' && pendingConfirmationsCount > 0) {
              badgeCount = pendingConfirmationsCount;
            } else if (item.hasBadge === 'notifications' && unreadNotificationsCount > 0) {
              badgeCount = unreadNotificationsCount;
            }

            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onItemClick}
                className={({ isActive }) => `
                  relative group flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all duration-150 select-none
                  ${
                    isActive
                      ? 'bg-[#CCFBF1] text-[#0F766E] font-bold shadow-sm border-l-4 border-[#14B8A6]'
                      : 'text-white bg-transparent hover:bg-[#14B8A6]/20 hover:text-white'
                  }
                  ${isCollapsed ? 'justify-center px-2' : ''}
                `}
                title={isCollapsed ? item.label : undefined}
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className={`flex-shrink-0 transition-colors ${
                        isCollapsed ? 'w-5 h-5' : 'w-4 h-4'
                      } ${isActive ? 'text-[#0F766E]' : 'text-[#CCFBF1] group-hover:text-white'}`}
                    />
                    {!isCollapsed && (
                      <span className="flex-1 truncate">{item.label}</span>
                    )}
                    {!isCollapsed && badgeCount !== null && (
                      <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-[#14B8A6] text-white shadow-xs">
                        {badgeCount}
                      </span>
                    )}
                    {isCollapsed && badgeCount !== null && (
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#14B8A6] ring-2 ring-[#0F766E]" />
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Footer Version / Info */}
      {!isCollapsed && (
        <div className="p-3 border-t border-white/10 bg-[#0F766E]">
          <div className="text-[11px] text-[#CCFBF1] text-center font-medium">
            <span className="font-bold text-white">AgriConnect ERP</span> &bull; <span>v2.6 Enterprise</span>
          </div>
        </div>
      )}
    </aside>
  );
};

export default MiddlemanSidebar;

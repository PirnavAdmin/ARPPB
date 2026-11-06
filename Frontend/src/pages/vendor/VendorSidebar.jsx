import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Sprout,
  Briefcase,
  Users,
  Tractor,
  Handshake,
  FileSpreadsheet,
  Warehouse,
  Factory,
  PackageCheck,
  ShoppingBag,
  Truck,
  Receipt,
  ShieldCheck,
  Landmark,
  Bell,
  UserCheck,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Wheat,
  X,
} from 'lucide-react';
import { VENDOR_NAVIGATION } from '../../config/navigation';
import { useAuth } from '../../hooks/useAuth';
import { useVendor } from '../../hooks/useVendor';

const ICON_MAP = {
  LayoutDashboard,
  Sprout,
  Briefcase,
  Users,
  Tractor,
  Handshake,
  FileSpreadsheet,
  Warehouse,
  Factory,
  PackageCheck,
  ShoppingBag,
  Truck,
  Receipt,
  ShieldCheck,
  Landmark,
  Bell,
  UserCheck,
};

const GROUPS = [
  'Overview',
  'Partners & Directory',
  'Procurement',
  'Inventory & Processing',
  'Sales & Orders',
  'Finance & Compliance',
  'System & Account',
];

export function VendorSidebar({
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
}) {
  const location = useLocation();
  const { vendorUser, logout } = useAuth();
  const { unreadNotificationsCount, pendingConfirmationsCount } = useVendor();

  const [expandedGroups, setExpandedGroups] = useState({
    Overview: true,
    'Partners & Directory': true,
    Procurement: true,
    'Inventory & Processing': true,
    'Sales & Orders': true,
    'Finance & Compliance': true,
    'System & Account': true,
  });

  const toggleGroup = (groupName) => {
    if (isCollapsed) return;
    setExpandedGroups((prev) => ({
      ...prev,
      [groupName]: !prev[groupName],
    }));
  };

  const getBadgeValue = (badgeKey) => {
    if (badgeKey === 'unreadNotificationsCount') return unreadNotificationsCount;
    if (badgeKey === 'pendingConfirmationsCount') return pendingConfirmationsCount;
    return 0;
  };

  const renderSidebarContent = (mobileView = false) => {
    const collapsed = !mobileView && isCollapsed;

    return (
      <div className="flex flex-col h-full bg-brand-primary text-white select-none">
        {/* Brand Header */}
        <div className="flex items-center justify-between gap-3 px-4 py-4 border-b border-white/15 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-brand-light text-brand-primary flex items-center justify-center shrink-0 font-bold shadow-sm">
              {vendorUser?.logoUrl ? (
                <img
                  src={vendorUser.logoUrl}
                  alt="Logo"
                  className="w-full h-full object-cover rounded-xl"
                />
              ) : (
                <Wheat className="w-6 h-6 text-brand-primary" />
              )}
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md bg-brand-light text-brand-primary">
                    Vendor Portal
                  </span>
                </div>
                <p
                  className="text-sm font-bold text-white truncate mt-1"
                  title={vendorUser?.businessName}
                >
                  {vendorUser?.businessName || 'Sri Rayalaseema Agri ERP'}
                </p>
              </div>
            )}
          </div>

          {mobileView ? (
            <button
              type="button"
              onClick={onCloseMobile}
              aria-label="Close navigation menu"
              className="p-1.5 rounded-lg text-brand-light hover:bg-white/10 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onToggleCollapse}
              title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
              aria-label={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
              className="p-1.5 rounded-lg text-brand-light hover:bg-brand-secondary hover:text-white transition-colors cursor-pointer shrink-0"
            >
              {collapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </button>
          )}
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
          {GROUPS.map((groupName) => {
            const items = VENDOR_NAVIGATION.filter((i) => i.group === groupName);
            const isExpanded = expandedGroups[groupName] !== false;

            return (
              <div key={groupName} className="space-y-1">
                {!collapsed && (
                  <button
                    type="button"
                    onClick={() => toggleGroup(groupName)}
                    className="w-full flex items-center justify-between px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-brand-light/80 hover:text-white transition-colors cursor-pointer"
                  >
                    <span>{groupName}</span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 transition-transform ${
                        isExpanded ? 'rotate-0' : '-rotate-90'
                      }`}
                    />
                  </button>
                )}

                {(collapsed || isExpanded) && (
                  <div className="space-y-1">
                    {items.map((nav) => {
                      const IconComponent = ICON_MAP[nav.icon] || LayoutDashboard;
                      const badgeCount = nav.badgeKey ? getBadgeValue(nav.badgeKey) : 0;
                      const isActive = location.pathname === nav.path;

                      return (
                        <NavLink
                          key={nav.id}
                          to={nav.path}
                          onClick={mobileView ? onCloseMobile : undefined}
                          title={collapsed ? `${nav.label}${badgeCount ? ` (${badgeCount})` : ''}` : undefined}
                          className={`group relative flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                            isActive
                              ? 'bg-brand-light text-brand-primary shadow-xs font-bold'
                              : 'text-white/90 hover:bg-brand-secondary hover:text-white'
                          } ${collapsed ? 'justify-center px-2' : ''}`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <IconComponent
                              className={`w-4 h-4 shrink-0 ${
                                isActive
                                  ? 'text-brand-primary'
                                  : 'text-brand-light group-hover:text-white'
                              }`}
                            />
                            {!collapsed && <span className="truncate">{nav.label}</span>}
                          </div>

                          {badgeCount > 0 && (
                            <span
                              className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-bold ${
                                isActive
                                  ? 'bg-brand-primary text-white'
                                  : 'bg-brand-light text-brand-primary'
                              } ${collapsed ? 'absolute -top-1 -right-1 scale-75' : ''}`}
                            >
                              {badgeCount}
                            </span>
                          )}
                        </NavLink>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer / Logout */}
        <div className="p-3 border-t border-white/15 shrink-0">
          <button
            type="button"
            onClick={() => {
              if (mobileView && onCloseMobile) onCloseMobile();
              logout();
            }}
            title={collapsed ? 'Logout' : undefined}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-brand-light hover:bg-brand-secondary hover:text-white transition-colors cursor-pointer ${
              collapsed ? 'justify-center px-2' : ''
            }`}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Fixed Desktop Sidebar */}
      <aside
        className={`hidden lg:flex flex-col fixed inset-y-0 left-0 z-30 transition-all duration-200 shadow-lg ${
          isCollapsed ? 'w-20' : 'w-68'
        }`}
      >
        {renderSidebarContent(false)}
      </aside>

      {/* Responsive Mobile Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-brand-text/50 backdrop-blur-xs"
            onClick={onCloseMobile}
          />
          <aside className="relative w-72 max-w-[85vw] h-full z-10 shadow-2xl">
            {renderSidebarContent(true)}
          </aside>
        </div>
      )}
    </>
  );
}

export default VendorSidebar;


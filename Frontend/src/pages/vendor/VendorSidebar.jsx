import { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Sprout,
  Briefcase,
  Users,
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
  const navigate = useNavigate();
  const { vendorUser, logout } = useAuth();
  const { unreadNotificationsCount, pendingConfirmationsCount } = useVendor();

  const [expandedGroups, setExpandedGroups] = useState({
    Overview: true,
    'Partners & Directory': true,
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
      <div className="flex flex-col justify-between h-full bg-[#0F766E] text-white select-none overflow-hidden">
        {/* Top Branding Section (Matches MiddlemanSidebar) */}
        <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="p-4 border-b border-white/10 flex items-center justify-between gap-2 shrink-0">
            <NavLink
              to="/vendor/dashboard"
              onClick={mobileView ? onCloseMobile : undefined}
              className="flex items-center gap-2.5 overflow-hidden select-none min-w-0"
            >
              <div className="w-10 h-10 rounded-xl bg-[#14B8A6] text-white flex items-center justify-center shrink-0 shadow-md shadow-black/10">
                {vendorUser?.logoUrl ? (
                  <img
                    src={vendorUser.logoUrl}
                    alt="Logo"
                    className="w-full h-full object-cover rounded-xl"
                  />
                ) : (
                  <Sprout className="w-6 h-6 text-white shrink-0" />
                )}
              </div>
              {!collapsed && (
                <div className="flex flex-col min-w-0">
                  <span
                    className="text-base !font-extrabold text-white tracking-tight leading-none truncate"
                    title={vendorUser?.businessName || 'AgriConnect'}
                  >
                    AgriConnect
                  </span>
                  <span className="!text-[10px] uppercase !font-bold tracking-wider text-[#CCFBF1] mt-1 truncate">
                    Vendor Portal
                  </span>
                </div>
              )}
            </NavLink>

            {mobileView ? (
              <button
                type="button"
                onClick={onCloseMobile}
                aria-label="Close navigation menu"
                className="p-1.5 rounded-lg text-[#CCFBF1] hover:bg-white/10 hover:text-white transition-colors cursor-pointer shrink-0"
              >
                <X className="w-5 h-5 shrink-0" />
              </button>
            ) : (
              <button
                type="button"
                onClick={onToggleCollapse}
                title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
                aria-label={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
                className="p-1.5 rounded-lg text-[#CCFBF1] hover:bg-white/10 hover:text-white transition-colors cursor-pointer shrink-0"
              >
                {collapsed ? (
                  <ChevronRight className="w-4 h-4 shrink-0" />
                ) : (
                  <ChevronLeft className="w-4 h-4 shrink-0" />
                )}
              </button>
            )}
          </div>

          {/* Navigation Links (Scrollable, Matches MiddlemanSidebar Typography & Spacing) */}
          <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5 sidebar-scrollbar">
            {GROUPS.map((groupName) => {
              const items = VENDOR_NAVIGATION.filter((i) => i.group === groupName);
              const isExpanded = expandedGroups[groupName] !== false;

              return (
                <div key={groupName} className="space-y-1 select-none">
                  {!collapsed && (
                    <button
                      type="button"
                      onClick={() => toggleGroup(groupName)}
                      aria-expanded={isExpanded}
                      className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg !text-[11px] !font-bold uppercase tracking-wider text-[#CCFBF1]/80 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                    >
                      <span className="truncate text-left">{groupName}</span>
                      {isExpanded ? (
                        <ChevronDown className="w-3.5 h-3.5 text-[#CCFBF1] shrink-0 transition-transform duration-200" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 text-[#CCFBF1]/80 shrink-0 transition-transform duration-200" />
                      )}
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
                            title={
                              collapsed
                                ? `${nav.label}${badgeCount ? ` (${badgeCount})` : ''}`
                                : undefined
                            }
                            className={`relative group flex items-center gap-3 px-3 py-2.5 rounded-xl !text-xs sm:!text-sm !font-medium transition-all duration-150 select-none ${
                              isActive
                                ? 'bg-[#CCFBF1] text-[#0F766E] !font-bold shadow-sm border-l-4 border-[#14B8A6]'
                                : 'text-white bg-transparent hover:bg-[#14B8A6]/20 hover:text-white'
                            } ${collapsed ? 'justify-center px-2' : ''}`}
                          >
                            <IconComponent
                              className={`shrink-0 transition-colors ${
                                collapsed ? 'w-5 h-5' : 'w-4 h-4'
                              } ${
                                isActive
                                  ? 'text-[#0F766E]'
                                  : 'text-[#CCFBF1] group-hover:text-white'
                              }`}
                            />
                            {!collapsed && (
                              <span className="flex-1 truncate leading-snug">
                                {nav.label}
                              </span>
                            )}

                            {!collapsed && badgeCount > 0 && (
                              <span
                                className={`px-1.5 py-0.5 !text-[10px] !font-bold rounded-full shadow-xs shrink-0 ${
                                  isActive
                                    ? 'bg-[#0F766E] text-white'
                                    : 'bg-[#14B8A6] text-white'
                                }`}
                              >
                                {badgeCount}
                              </span>
                            )}

                            {collapsed && badgeCount > 0 && (
                              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#14B8A6] ring-2 ring-[#0F766E]" />
                            )}
                          </NavLink>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        {/* Footer / Logout */}
        <div className="p-3 border-t border-white/10 bg-[#0F766E] shrink-0">
          <button
            type="button"
            onClick={() => {
              if (mobileView && onCloseMobile) onCloseMobile();
              logout();
              navigate('/login');
            }}
            title={collapsed ? 'Logout' : undefined}
            className={`w-full group flex items-center gap-3 px-3 py-2.5 rounded-xl !text-xs sm:!text-sm !font-medium text-[#CCFBF1] hover:bg-[#14B8A6]/20 hover:text-white transition-all duration-150 cursor-pointer ${
              collapsed ? 'justify-center px-2' : ''
            }`}
          >
            <LogOut
              className={`shrink-0 transition-colors ${
                collapsed ? 'w-5 h-5' : 'w-4 h-4'
              } text-[#CCFBF1] group-hover:text-white`}
            />
            {!collapsed && <span className="truncate">Logout</span>}
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Fixed Desktop Sidebar */}
      <aside
        className={`hidden lg:flex flex-col fixed inset-y-0 left-0 z-30 bg-[#0F766E] border-r border-[#115E59] text-white transition-all duration-300 shadow-lg ${
          isCollapsed ? 'w-20' : 'w-64'
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
          <aside className="relative w-64 max-w-[85vw] h-full z-10 bg-[#0F766E] border-r border-[#115E59] shadow-2xl">
            {renderSidebarContent(true)}
          </aside>
        </div>
      )}
    </>
  );
}

export default VendorSidebar;


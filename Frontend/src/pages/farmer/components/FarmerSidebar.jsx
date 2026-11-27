import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Sprout,
  TrendingUp,
  ShoppingBag,
  Receipt,
  ShieldCheck,
  Bell,
  UserCheck,
  Building2,
  Users,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  X,
} from 'lucide-react';
import { useFarmer } from '../context/FarmerContext';
import { useAuth } from '../../../hooks/useAuth';

const FARMER_NAV_GROUPS = [
  {
    group: 'Overview',
    items: [
      { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ],
  },
  {
    group: 'Farm & Market',
    items: [
      { key: 'crops', label: 'My Crops', icon: Sprout },
      { key: 'prices', label: 'Daily Market Prices', icon: TrendingUp },
      {
        key: 'sell',
        label: 'Sell Products',
        icon: ShoppingBag,
        hasSubmenu: true,
        subItems: [
          { key: 'Middleman', label: 'Middleman', category: 'Middleman', icon: UserCheck },
          { key: 'Vendor', label: 'Vendor', category: 'Vendor', icon: Building2 },
          { key: 'Customer', label: 'Customer', category: 'Customer', icon: Users },
        ],
      },
      { key: 'sales', label: 'My Sales', icon: Receipt },
    ],
  },
  {
    group: 'Security & Alerts',
    items: [
      { key: 'otp', label: 'OTP Confirmations', icon: ShieldCheck, badgeKey: 'pendingOtp' },
      { key: 'notifications', label: 'Notifications', icon: Bell, badgeKey: 'unreadNotifications' },
    ],
  },
  {
    group: 'Account',
    items: [
      { key: 'profile', label: 'My Profile', icon: UserCheck },
    ],
  },
];

export function FarmerSidebar({
  isCollapsed = false,
  onToggleCollapse,
  isMobileOpen = false,
  onCloseMobile,
}) {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const {
    activePage,
    pageParam,
    navigateTo,
    pendingOtpCount,
    unreadNotificationsCount,
  } = useFarmer();

  const [expandedGroups, setExpandedGroups] = useState({
    Overview: true,
    'Farm & Market': true,
    'Security & Alerts': true,
    Account: true,
  });

  const [isSellSubmenuOpen, setIsSellSubmenuOpen] = useState(true);

  // Automatically ensure Sell Products submenu is expanded when user is on Sell Products
  useEffect(() => {
    if (activePage === 'sell') {
      setIsSellSubmenuOpen(true);
    }
  }, [activePage]);

  const toggleGroup = (groupName) => {
    if (isCollapsed) return;
    setExpandedGroups((prev) => ({
      ...prev,
      [groupName]: !prev[groupName],
    }));
  };

  const getBadgeValue = (badgeKey) => {
    if (badgeKey === 'pendingOtp') return pendingOtpCount;
    if (badgeKey === 'unreadNotifications') return unreadNotificationsCount;
    return 0;
  };

  const handleNavClick = (pageKey, mobileView, param = null) => {
    navigateTo(pageKey, param);
    if (mobileView && onCloseMobile) {
      onCloseMobile();
    }
  };

  const handleLogout = () => {
    if (onCloseMobile) onCloseMobile();
    logout();
    navigate('/login');
  };

  const renderSidebarContent = (mobileView = false) => {
    const collapsed = !mobileView && isCollapsed;

    return (
      <div className="flex flex-col justify-between h-full bg-[#0F766E] text-white select-none overflow-hidden">
        {/* Top Branding Section (Matches VendorSidebar and CustomerSidebar) */}
        <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="p-4 border-b border-white/10 flex items-center justify-between gap-2 shrink-0">
            <button
              type="button"
              onClick={() => handleNavClick('dashboard', mobileView)}
              className="flex items-center gap-2.5 overflow-hidden select-none min-w-0 text-left cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-xl bg-[#14B8A6] text-white flex items-center justify-center shrink-0 shadow-md shadow-black/10 group-hover:scale-105 transition-transform">
                <Sprout className="w-6 h-6 text-white shrink-0" />
              </div>
              {!collapsed && (
                <div className="flex flex-col min-w-0">
                  <span
                    className="text-base !font-extrabold text-white tracking-tight leading-none truncate"
                    title="AgriConnect"
                  >
                    AgriConnect
                  </span>
                  <span className="!text-[10px] uppercase !font-bold tracking-wider text-[#CCFBF1] mt-1 truncate">
                    Farmer Portal
                  </span>
                </div>
              )}
            </button>

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

          {/* Navigation Links (Scrollable, Matches VendorSidebar & CustomerSidebar) */}
          <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5 sidebar-scrollbar">
            {FARMER_NAV_GROUPS.map((groupObj) => {
              const isExpanded = expandedGroups[groupObj.group] !== false;

              return (
                <div key={groupObj.group} className="space-y-1 select-none">
                  {!collapsed && (
                    <button
                      type="button"
                      onClick={() => toggleGroup(groupObj.group)}
                      aria-expanded={isExpanded}
                      className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg !text-[11px] !font-bold uppercase tracking-wider text-[#CCFBF1]/80 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                    >
                      <span className="truncate text-left">{groupObj.group}</span>
                      {isExpanded ? (
                        <ChevronDown className="w-3.5 h-3.5 text-[#CCFBF1] shrink-0 transition-transform duration-200" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 text-[#CCFBF1]/80 shrink-0 transition-transform duration-200" />
                      )}
                    </button>
                  )}

                  {(collapsed || isExpanded) && (
                    <div className="space-y-1">
                      {groupObj.items.map((item) => {
                        const IconComponent = item.icon;
                        const badgeCount = item.badgeKey ? getBadgeValue(item.badgeKey) : 0;
                        const isActive = activePage === item.key;
                        const hasSubmenu = Boolean(item.hasSubmenu && item.subItems?.length);

                        if (hasSubmenu && !collapsed) {
                          const isSellItemActive = activePage === 'sell';
                          const isSubmenuVisible = isSellSubmenuOpen;

                          return (
                            <div key={item.key} className="space-y-1">
                              <div
                                className={`w-full relative group flex items-center justify-between px-3 py-2 rounded-xl !text-xs sm:!text-sm !font-medium transition-all duration-150 select-none ${
                                  isSellItemActive
                                    ? 'bg-[#14B8A6]/25 text-white !font-bold'
                                    : 'text-white bg-transparent hover:bg-[#14B8A6]/20 hover:text-white'
                                }`}
                              >
                                <button
                                  type="button"
                                  onClick={() => {
                                    setIsSellSubmenuOpen(true);
                                    handleNavClick('sell', mobileView, pageParam || 'Middleman');
                                  }}
                                  className="flex-1 flex items-center gap-3 text-left cursor-pointer min-w-0"
                                >
                                  <IconComponent
                                    className={`shrink-0 transition-colors w-4 h-4 ${
                                      isSellItemActive ? 'text-white' : 'text-[#CCFBF1] group-hover:text-white'
                                    }`}
                                  />
                                  <span className="truncate leading-snug">{item.label}</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setIsSellSubmenuOpen((prev) => !prev);
                                  }}
                                  title={isSubmenuVisible ? 'Collapse categories' : 'Expand categories'}
                                  aria-label={isSubmenuVisible ? 'Collapse categories' : 'Expand categories'}
                                  className="p-1 rounded-md text-[#CCFBF1] hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0 ml-1"
                                >
                                  {isSubmenuVisible ? (
                                    <ChevronDown className="w-3.5 h-3.5 transition-transform" />
                                  ) : (
                                    <ChevronRight className="w-3.5 h-3.5 transition-transform" />
                                  )}
                                </button>
                              </div>

                              {/* Sub components: Middleman, Vendor, Customer */}
                              {isSubmenuVisible && (
                                <div className="space-y-1 pl-3 pr-1 py-0.5 border-l-2 border-[#14B8A6]/40 ml-4">
                                  {item.subItems.map((sub) => {
                                    const SubIcon = sub.icon;
                                    const isSubActive =
                                      activePage === 'sell' &&
                                      (pageParam || 'Middleman').toLowerCase() === sub.category.toLowerCase();

                                    return (
                                      <button
                                        key={sub.category}
                                        type="button"
                                        onClick={() => handleNavClick('sell', mobileView, sub.category)}
                                        className={`w-full group flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs transition-all duration-150 select-none cursor-pointer text-left ${
                                          isSubActive
                                            ? 'bg-[#CCFBF1] text-[#0F766E] !font-bold shadow-xs border-l-3 border-[#0F766E]'
                                            : 'text-[#CCFBF1] hover:text-white hover:bg-white/10 font-medium'
                                        }`}
                                      >
                                        <SubIcon
                                          className={`w-3.5 h-3.5 shrink-0 transition-colors ${
                                            isSubActive ? 'text-[#0F766E]' : 'text-[#CCFBF1] group-hover:text-white'
                                          }`}
                                        />
                                        <span className="truncate">{sub.label}</span>
                                      </button>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        }

                        return (
                          <button
                            key={item.key}
                            type="button"
                            onClick={() => handleNavClick(item.key, mobileView, item.hasSubmenu ? (pageParam || 'Middleman') : null)}
                            title={
                              collapsed
                                ? `${item.label}${badgeCount ? ` (${badgeCount})` : ''}`
                                : undefined
                            }
                            className={`w-full relative group flex items-center gap-3 px-3 py-2.5 rounded-xl !text-xs sm:!text-sm !font-medium transition-all duration-150 select-none cursor-pointer text-left ${
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
                                {item.label}
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
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        {/* Footer / Logout Button */}
        <div className="p-3 border-t border-white/10 bg-[#0F766E] shrink-0">
          <button
            type="button"
            onClick={handleLogout}
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
            className="fixed inset-0 bg-[#0F172A]/50 backdrop-blur-xs"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <aside className="relative w-64 max-w-[85vw] h-full z-10 bg-[#0F766E] border-r border-[#115E59] shadow-2xl">
            {renderSidebarContent(true)}
          </aside>
        </div>
      )}
    </>
  );
}

export default FarmerSidebar;

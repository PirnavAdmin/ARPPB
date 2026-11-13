import { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Sprout,
  LayoutDashboard,
  ShoppingBag,
  Layers,
  ShoppingCart,
  Truck,
  History,
  ShieldCheck,
  Bell,
  UserCheck,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  X,
} from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { useCustomer } from '../context/useCustomer';

const SIDEBAR_GROUPS = [
  {
    id: 'Overview',
    type: 'standalone',
    items: [
      {
        id: 'dashboard',
        label: 'Dashboard',
        path: '/customer/dashboard',
        icon: LayoutDashboard,
      },
    ],
  },
  {
    id: 'Marketplace',
    type: 'group',
    items: [
      {
        id: 'products',
        label: 'Browse Products',
        path: '/customer/products',
        icon: ShoppingBag,
      },
      {
        id: 'categories',
        label: 'Categories',
        path: '/customer/categories',
        icon: Layers,
      },
      {
        id: 'cart',
        label: 'My Cart',
        path: '/customer/cart',
        icon: ShoppingCart,
        badgeKey: 'cartItemCount',
      },
    ],
  },
  {
    id: 'Orders & Verification',
    type: 'group',
    items: [
      {
        id: 'orders',
        label: 'My Orders',
        path: '/customer/orders',
        icon: Truck,
      },
      {
        id: 'purchase-history',
        label: 'Purchase History',
        path: '/customer/purchase-history',
        icon: History,
      },
      {
        id: 'confirmations',
        label: 'OTP Confirmations',
        path: '/customer/confirmations',
        icon: ShieldCheck,
        badgeKey: 'pendingConfirmations',
      },
    ],
  },
  {
    id: 'Account & Alerts',
    type: 'group',
    items: [
      {
        id: 'notifications',
        label: 'Notifications',
        path: '/customer/notifications',
        icon: Bell,
        badgeKey: 'unreadNotifications',
      },
      {
        id: 'profile',
        label: 'My Profile',
        path: '/customer/profile',
        icon: UserCheck,
      },
    ],
  },
];

export function CustomerSidebar({
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { profile, metrics, cartItemCount } = useCustomer();

  const [expandedGroups, setExpandedGroups] = useState({
    Marketplace: true,
    'Orders & Verification': true,
    'Account & Alerts': true,
  });

  const toggleGroup = (groupId) => {
    if (isCollapsed) return;
    setExpandedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  const getBadgeValue = (badgeKey) => {
    if (badgeKey === 'cartItemCount') return cartItemCount;
    if (badgeKey === 'pendingConfirmations') return metrics.pendingConfirmations;
    if (badgeKey === 'unreadNotifications') return metrics.unreadNotifications;
    return 0;
  };

  const renderSidebarContent = (mobileView = false) => {
    const collapsed = !mobileView && isCollapsed;

    return (
      <div className="flex flex-col justify-between h-full bg-[#0F766E] text-white select-none overflow-hidden">
        {/* Top Branding Section */}
        <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="p-4 border-b border-white/10 flex items-center justify-between gap-2 shrink-0">
            <NavLink
              to="/customer/dashboard"
              onClick={mobileView ? onCloseMobile : undefined}
              className="flex items-center gap-2.5 overflow-hidden select-none min-w-0"
            >
              <div className="w-10 h-10 rounded-xl bg-[#14B8A6] text-white flex items-center justify-center shrink-0 shadow-md shadow-black/10 overflow-hidden">
                {profile?.profilePhoto ? (
                  <img
                    src={profile.profilePhoto}
                    alt={profile.fullName}
                    className="w-full h-full object-cover rounded-xl"
                  />
                ) : (
                  <Sprout className="w-6 h-6 text-white shrink-0" />
                )}
              </div>
              {!collapsed && (
                <div className="flex flex-col min-w-0">
                  <span className="text-base font-extrabold text-white tracking-tight leading-none truncate">
                    AgriConnect
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[#CCFBF1] mt-1 truncate">
                    Customer Portal
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

          {/* Navigation Links */}
          <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5">
            {SIDEBAR_GROUPS.map((group) => {
              const isExpanded =
                group.type === 'standalone' || expandedGroups[group.id] !== false;

              return (
                <div key={group.id} className="space-y-1 select-none">
                  {group.type === 'group' && !collapsed && (
                    <button
                      type="button"
                      onClick={() => toggleGroup(group.id)}
                      aria-expanded={isExpanded}
                      className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider text-[#CCFBF1]/80 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                    >
                      <span className="truncate text-left">{group.id}</span>
                      {isExpanded ? (
                        <ChevronDown className="w-3.5 h-3.5 text-[#CCFBF1] shrink-0 transition-transform duration-200" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 text-[#CCFBF1]/80 shrink-0 transition-transform duration-200" />
                      )}
                    </button>
                  )}

                  {(collapsed || isExpanded) && (
                    <div className="space-y-1">
                      {group.items.map((nav) => {
                        const IconComponent = nav.icon;
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
                            className={`relative group flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all duration-150 select-none ${
                              isActive
                                ? 'bg-[#CCFBF1] text-[#0F766E] font-bold shadow-sm border-l-4 border-[#14B8A6]'
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
                                className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full shadow-xs shrink-0 ${
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
            className={`w-full group flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium text-[#CCFBF1] hover:bg-[#14B8A6]/20 hover:text-white transition-all duration-150 cursor-pointer ${
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
          />
          <aside className="relative w-64 max-w-[85vw] h-full z-10 bg-[#0F766E] border-r border-[#115E59] shadow-2xl">
            {renderSidebarContent(true)}
          </aside>
        </div>
      )}
    </>
  );
}

export default CustomerSidebar;


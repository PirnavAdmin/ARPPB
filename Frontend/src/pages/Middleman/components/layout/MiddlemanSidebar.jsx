import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
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
  ChevronDown,
  FileSpreadsheet,
} from 'lucide-react';
import { useMiddleman } from '../../../../context/middleman';

/**
 * Category-Based Navigation Structure for Middleman Portal
 * Preserves all 14 original navigation items and route paths.
 */
const SIDEBAR_NAVIGATION = [
  {
    id: 'dashboard',
    type: 'item',
    path: '/middleman/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
  },
  {
    id: 'farmer-management',
    type: 'group',
    label: 'Farmer Management',
    icon: Users,
    children: [
      {
        path: '/middleman/farmers',
        label: 'Farmers',
        icon: Users,
      },
      {
        path: '/middleman/purchases',
        label: 'Purchase from Farmers',
        icon: ShoppingCart,
      },
    ],
  },
  {
    id: 'vendor-management',
    type: 'group',
    label: 'Vendor Management',
    icon: Building2,
    children: [
      {
        path: '/middleman/vendors',
        label: 'Vendors',
        icon: Building2,
      },
      {
        path: '/middleman/sales/vendors',
        label: 'Sales to Vendors',
        icon: ArrowUpRight,
      },
    ],
  },
  {
    id: 'customer-management',
    type: 'group',
    label: 'Customer Management',
    icon: ShoppingBag,
    children: [
      {
        path: '/middleman/customers',
        label: 'Customers',
        icon: ShoppingBag,
      },
      {
        path: '/middleman/sales/customers',
        label: 'Sales to Customers',
        icon: Store,
      },
    ],
  },
  {
    id: 'inventory-management',
    type: 'item',
    path: '/middleman/inventory',
    label: 'My Inventory',
    icon: Boxes,
  },
  {
    id: 'transaction-history',
    type: 'group',
    label: 'Transaction History',
    icon: FileSpreadsheet,
    children: [
      {
        path: '/middleman/purchase-history',
        label: 'Purchase History',
        icon: History,
      },
      {
        path: '/middleman/sales-history',
        label: 'Sales History',
        icon: BadgePercent,
      },
    ],
  },
  {
    id: 'otp-confirmations',
    type: 'item',
    path: '/middleman/confirmations',
    label: 'OTP Confirmations',
    icon: ShieldCheck,
    hasBadge: 'confirmations',
  },
  {
    id: 'my-ledger',
    type: 'item',
    path: '/middleman/ledger',
    label: 'My Ledger',
    icon: BookOpen,
  },
  {
    id: 'notifications',
    type: 'item',
    path: '/middleman/notifications',
    label: 'Notifications',
    icon: Bell,
    hasBadge: 'notifications',
  },
  {
    id: 'my-profile',
    type: 'item',
    path: '/middleman/profile',
    label: 'My Profile',
    icon: UserCheck,
  },
];

const getGroupIdForPath = (pathname) => {
  const matchedGroup = SIDEBAR_NAVIGATION.find(
    (entry) =>
      entry.type === 'group' &&
      entry.children.some(
        (child) => pathname === child.path || pathname.startsWith(`${child.path}/`)
      )
  );
  return matchedGroup ? matchedGroup.id : null;
};

export const MiddlemanSidebar = ({
  isCollapsed = false,
  onToggleCollapse,
  className = '',
  onItemClick,
}) => {
  const location = useLocation();
  const { confirmations, notifications } = useMiddleman();

  const activeGroupFromRoute = getGroupIdForPath(location.pathname);

  // Track opened accordion group and automatically sync when route changes to a group's child
  const [openGroupId, setOpenGroupId] = useState(() => activeGroupFromRoute);
  const [trackedPath, setTrackedPath] = useState(location.pathname);

  if (trackedPath !== location.pathname) {
    setTrackedPath(location.pathname);
    const nextRouteGroup = getGroupIdForPath(location.pathname);
    if (nextRouteGroup) {
      setOpenGroupId(nextRouteGroup);
    }
  }

  const pendingConfirmationsCount = confirmations.filter((c) => c.otpStatus === 'Pending').length;
  const unreadNotificationsCount = notifications.filter((n) => !n.isRead).length;

  const getBadgeCount = (badgeType) => {
    if (badgeType === 'confirmations' && pendingConfirmationsCount > 0) {
      return pendingConfirmationsCount;
    }
    if (badgeType === 'notifications' && unreadNotificationsCount > 0) {
      return unreadNotificationsCount;
    }
    return null;
  };

  const handleGroupToggle = (groupId) => {
    if (isCollapsed && onToggleCollapse) {
      onToggleCollapse();
      setOpenGroupId(groupId);
      return;
    }
    // Accordion behavior: opening one category closes any previously opened category
    setOpenGroupId((prev) => (prev === groupId ? null : groupId));
  };

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
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1.5 sidebar-scrollbar">
          {SIDEBAR_NAVIGATION.map((entry) => {
            const Icon = entry.icon;

            // Standalone Menu Item
            if (entry.type === 'item') {
              const badgeCount = getBadgeCount(entry.hasBadge);

              return (
                <NavLink
                  key={entry.id}
                  to={entry.path}
                  end
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
                  title={isCollapsed ? entry.label : undefined}
                >
                  {({ isActive }) => (
                    <>
                      <Icon
                        className={`flex-shrink-0 transition-colors ${
                          isCollapsed ? 'w-5 h-5' : 'w-4 h-4'
                        } ${isActive ? 'text-[#0F766E]' : 'text-[#CCFBF1] group-hover:text-white'}`}
                      />
                      {!isCollapsed && (
                        <span className="flex-1 truncate">{entry.label}</span>
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
            }

            // Expandable Category Menu Group
            const isExpanded = !isCollapsed && openGroupId === entry.id;
            const hasActiveChild = entry.children.some(
              (child) =>
                location.pathname === child.path ||
                location.pathname.startsWith(`${child.path}/`)
            );

            return (
              <div key={entry.id} className="select-none">
                <button
                  type="button"
                  onClick={() => handleGroupToggle(entry.id)}
                  aria-expanded={isExpanded}
                  title={isCollapsed ? entry.label : undefined}
                  className={`
                    w-full relative group flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all duration-150 cursor-pointer
                    ${
                      hasActiveChild
                        ? 'bg-[#14B8A6]/25 text-white font-bold border-l-4 border-[#CCFBF1] shadow-2xs'
                        : isExpanded
                        ? 'bg-white/10 text-white font-semibold'
                        : 'text-white bg-transparent hover:bg-[#14B8A6]/20 hover:text-white'
                    }
                    ${isCollapsed ? 'justify-center px-2' : ''}
                  `}
                >
                  <Icon
                    className={`flex-shrink-0 transition-colors ${
                      isCollapsed ? 'w-5 h-5' : 'w-4 h-4'
                    } ${
                      hasActiveChild || isExpanded
                        ? 'text-[#CCFBF1]'
                        : 'text-[#CCFBF1] group-hover:text-white'
                    }`}
                  />

                  {!isCollapsed && (
                    <>
                      <span className="flex-1 text-left truncate">{entry.label}</span>
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-[#CCFBF1] flex-shrink-0 transition-transform duration-200" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-[#CCFBF1]/80 group-hover:text-white flex-shrink-0 transition-transform duration-200" />
                      )}
                    </>
                  )}
                </button>

                {/* Smooth Expand/Collapse Submenu Container */}
                {!isCollapsed && (
                  <div
                    className={`grid transition-all duration-200 ease-in-out ${
                      isExpanded
                        ? 'grid-rows-[1fr] opacity-100 mt-1'
                        : 'grid-rows-[0fr] opacity-0'
                    }`}
                  >
                    <div className="overflow-hidden">
                      <div className="ml-4 pl-3 border-l border-white/20 space-y-1 py-0.5">
                        {entry.children.map((child) => {
                          const ChildIcon = child.icon;
                          return (
                            <NavLink
                              key={child.path}
                              to={child.path}
                              end
                              onClick={onItemClick}
                              className={({ isActive }) => `
                                group flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150
                                ${
                                  isActive
                                    ? 'bg-[#CCFBF1] text-[#0F766E] font-bold shadow-sm'
                                    : 'text-[#CCFBF1]/90 hover:bg-[#14B8A6]/20 hover:text-white'
                                }
                              `}
                            >
                              {({ isActive }) => (
                                <>
                                  <ChildIcon
                                    className={`w-3.5 h-3.5 flex-shrink-0 transition-colors ${
                                      isActive
                                        ? 'text-[#0F766E]'
                                        : 'text-[#CCFBF1]/80 group-hover:text-white'
                                    }`}
                                  />
                                  <span className="truncate">{child.label}</span>
                                </>
                              )}
                            </NavLink>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
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


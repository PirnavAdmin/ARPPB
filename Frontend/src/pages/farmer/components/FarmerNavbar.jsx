import { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Menu,
  Search,
  Bell,
  User,
  LogOut,
  ChevronDown,
  ShieldCheck,
  CheckCheck,
  Home,
  ChevronRight,
  Sprout,
  TrendingUp,
  ShoppingBag,
  Receipt,
  UserCheck,
} from 'lucide-react';
import { useFarmer } from '../context/FarmerContext';
import { useAuth } from '../../../hooks/useAuth';

const PAGE_NAMES = {
  dashboard: 'Farmer Dashboard',
  crops: 'My Crops & Yield',
  prices: 'Daily Mandi Prices',
  sell: 'Sell Products',
  sales: 'My Sales History',
  otp: 'OTP Confirmations',
  notifications: 'Notifications & Alerts',
  profile: 'My Profile & Settings',
};

const MODULE_SEARCH_ITEMS = [
  { id: 'dashboard', title: 'Farmer Dashboard', subtitle: 'Overview & Analytics', page: 'dashboard', icon: Home },
  { id: 'crops', title: 'My Crops', subtitle: 'Harvest inventory & stock', page: 'crops', icon: Sprout },
  { id: 'prices', title: 'Daily Market Prices', subtitle: 'AP & Telangana mandi rates', page: 'prices', icon: TrendingUp },
  { id: 'sell', title: 'Sell Products', subtitle: 'Create sale orders to buyers', page: 'sell', icon: ShoppingBag },
  { id: 'sales', title: 'My Sales', subtitle: 'Transaction records & settlements', page: 'sales', icon: Receipt },
  { id: 'otp', title: 'OTP Confirmations', subtitle: 'Verify buyer dispatches', page: 'otp', icon: ShieldCheck },
  { id: 'notifications', title: 'Notifications', subtitle: 'System operational alerts', page: 'notifications', icon: Bell },
  { id: 'profile', title: 'My Profile', subtitle: 'Farmer registry & bank account', page: 'profile', icon: UserCheck },
];

export function FarmerNavbar({ onOpenMobileSidebar, onToggleDesktopSidebar }) {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const {
    activePage,
    pageParam,
    navigateTo,
    profile,
    notifications,
    unreadNotificationsCount,
    pendingOtpCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    crops,
    sales,
  } = useFarmer();

  const [globalQuery, setGlobalQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const searchRef = useRef(null);
  const notifRef = useRef(null);
  const profileRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setIsSearchOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setIsNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchResults = useMemo(() => {
    const q = globalQuery.trim().toLowerCase();
    if (!q) return [];
    const results = [];

    MODULE_SEARCH_ITEMS.forEach((m) => {
      if (m.title.toLowerCase().includes(q) || m.subtitle.toLowerCase().includes(q)) {
        results.push({
          id: `mod-${m.id}`,
          category: 'Module',
          title: m.title,
          subtitle: m.subtitle,
          page: m.page,
        });
      }
    });

    (crops || []).forEach((c) => {
      if (
        (c.name || '').toLowerCase().includes(q) ||
        (c.category || '').toLowerCase().includes(q)
      ) {
        results.push({
          id: `crop-${c.id || c.name}`,
          category: 'Crop',
          title: `${c.name} (${c.availableQuantity || 0} ${c.unit || 'qtl'} stock)`,
          subtitle: `Category: ${c.category || 'Commodity'}`,
          page: 'crops',
        });
      }
    });

    (sales || []).forEach((s) => {
      if (
        (s.id || '').toLowerCase().includes(q) ||
        (s.buyerName || '').toLowerCase().includes(q) ||
        (s.cropName || '').toLowerCase().includes(q)
      ) {
        results.push({
          id: `sale-${s.id}`,
          category: 'Sale Transaction',
          title: `${s.id} – ${s.cropName}`,
          subtitle: `Buyer: ${s.buyerName} (${s.transactionStatus})`,
          page: 'sales',
        });
      }
    });

    return results.slice(0, 7);
  }, [globalQuery, crops, sales]);

  const initials = (profile?.farmerName || 'Farmer')
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const handleLogout = () => {
    setIsProfileOpen(false);
    logout();
    navigate('/login');
  };

  const recentNotifications = (notifications || []).slice(0, 4);

  return (
    <header className="sticky top-0 z-20 h-16 bg-white border-b border-[#E2E8F0] px-4 sm:px-6 flex items-center justify-between gap-4 shadow-2xs">
      {/* Left: Mobile & Desktop Sidebar Toggles + Breadcrumb */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileSidebar}
          aria-label="Open navigation menu"
          className="lg:hidden p-2 rounded-lg text-[#0F766E] bg-[#CCFBF1]/60 hover:bg-[#CCFBF1] transition-colors cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={onToggleDesktopSidebar}
          aria-label="Toggle desktop sidebar"
          className="hidden lg:inline-flex p-2 rounded-lg text-[#0F766E] bg-[#CCFBF1]/50 hover:bg-[#CCFBF1] transition-colors cursor-pointer"
        >
          <Menu className="w-4 h-4" />
        </button>

        <nav className="flex items-center gap-1.5 text-xs text-[#64748B] overflow-hidden whitespace-nowrap">
          <button
            type="button"
            onClick={() => navigateTo('dashboard')}
            className="hover:text-[#0F766E] transition-colors flex items-center gap-1 font-medium cursor-pointer"
          >
            <Home className="w-3.5 h-3.5 shrink-0" />
            <span>AgriConnect</span>
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-[#94A3B8] shrink-0" />
          <span className="font-semibold text-[#0F172A] truncate">
            {activePage === 'sell' && pageParam ? `Sell Products > ${pageParam}` : (PAGE_NAMES[activePage] || 'Farmer Portal')}
          </span>
        </nav>
      </div>

      {/* Center: Global Search */}
      <div ref={searchRef} className="relative flex-1 max-w-md hidden sm:block">
        <div className="relative">
          <Search className="w-4 h-4 text-[#64748B] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={globalQuery}
            onFocus={() => setIsSearchOpen(true)}
            onChange={(e) => {
              setGlobalQuery(e.target.value);
              setIsSearchOpen(true);
            }}
            placeholder="Search crops, prices, sales, buyer parties..."
            aria-label="Global farmer portal search"
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[#0F172A] placeholder:text-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/30 focus:border-[#0F766E] focus:bg-white transition-all"
          />
        </div>

        {isSearchOpen && globalQuery.trim() && (
          <div className="absolute left-0 right-0 mt-2 bg-white rounded-xl border border-[#E2E8F0] shadow-xl overflow-hidden z-50">
            {searchResults.length === 0 ? (
              <div className="p-4 text-xs text-[#64748B] text-center">
                No matching crops, sales, or modules for &quot;{globalQuery}&quot;
              </div>
            ) : (
              <div className="divide-y divide-[#E2E8F0] max-h-80 overflow-y-auto">
                {searchResults.map((res) => (
                  <button
                    key={res.id}
                    type="button"
                    onClick={() => {
                      navigateTo(res.page);
                      setIsSearchOpen(false);
                      setGlobalQuery('');
                    }}
                    className="w-full px-4 py-2.5 text-left hover:bg-[#CCFBF1]/40 flex items-center justify-between gap-3 transition-colors cursor-pointer"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[#0F172A] truncate">
                        {res.title}
                      </p>
                      <p className="text-[11px] text-[#64748B] truncate">{res.subtitle}</p>
                    </div>
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-[#CCFBF1] text-[#0F766E] shrink-0">
                      {res.category}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right: OTP Queue Shortcut, Notifications Popover, User Dropdown */}
      <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
        {/* OTP Queue Shortcut */}
        <button
          type="button"
          onClick={() => navigateTo('otp')}
          title="Pending Buyer OTP Confirmations"
          aria-label="Open OTP Confirmations"
          className="relative inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-[#CCFBF1]/70 text-[#0F766E] hover:bg-[#14B8A6] hover:text-white text-xs font-semibold transition-colors cursor-pointer"
        >
          <ShieldCheck className="w-4 h-4 shrink-0" />
          <span className="hidden md:inline">OTP Queue</span>
          {pendingOtpCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-[#0F766E] text-white text-[10px] font-bold">
              {pendingOtpCount}
            </span>
          )}
        </button>

        {/* Notifications Popover */}
        <div ref={notifRef} className="relative">
          <button
            type="button"
            onClick={() => setIsNotifOpen((prev) => !prev)}
            aria-label="View notifications"
            className="relative p-2 rounded-xl text-[#64748B] hover:text-[#0F766E] hover:bg-[#F8FAFC] transition-colors cursor-pointer"
          >
            <Bell className="w-5 h-5" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#EF4444] ring-2 ring-white" />
            )}
          </button>

          {isNotifOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-[#E2E8F0] py-3 z-50">
              <div className="flex items-center justify-between px-4 pb-2 border-b border-[#E2E8F0]">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-[#0F172A]">Notifications</span>
                  {unreadNotificationsCount > 0 && (
                    <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-[#CCFBF1] text-[#0F766E]">
                      {unreadNotificationsCount} new
                    </span>
                  )}
                </div>
                {unreadNotificationsCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllNotificationsAsRead}
                    className="text-xs text-[#0F766E] font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    Mark all read
                  </button>
                )}
              </div>

              <div className="divide-y divide-[#E2E8F0] max-h-80 overflow-y-auto">
                {recentNotifications.length === 0 ? (
                  <div className="p-4 text-xs text-[#64748B] text-center">
                    No notifications right now.
                  </div>
                ) : (
                  recentNotifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => {
                        markNotificationAsRead(notif.id);
                        if (notif.targetPage) navigateTo(notif.targetPage);
                        setIsNotifOpen(false);
                      }}
                      className={`p-3 px-4 hover:bg-[#F8FAFC] transition-colors cursor-pointer ${
                        !notif.read ? 'bg-[#CCFBF1]/20' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-bold text-[#0F172A] line-clamp-1">
                          {notif.title}
                        </span>
                        <span className="text-[10px] text-[#64748B] shrink-0">
                          {notif.time || 'Today'}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#64748B] mt-0.5 line-clamp-2">
                        {notif.detail}
                      </p>
                    </div>
                  ))
                )}
              </div>

              <div className="pt-2 px-4 border-t border-[#E2E8F0] flex justify-center">
                <button
                  type="button"
                  onClick={() => {
                    setIsNotifOpen(false);
                    navigateTo('notifications');
                  }}
                  className="text-xs font-semibold text-[#0F766E] hover:underline cursor-pointer"
                >
                  View All Notifications
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Profile Dropdown */}
        <div ref={profileRef} className="relative">
          <button
            type="button"
            onClick={() => setIsProfileOpen((prev) => !prev)}
            aria-label="User profile options"
            className="flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded-xl border border-[#E2E8F0] hover:bg-[#F8FAFC] transition-colors cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-[#0F766E] text-white flex items-center justify-center font-bold text-xs shrink-0">
              {initials}
            </div>
            <div className="hidden xl:flex flex-col text-left min-w-0">
              <span className="text-xs font-bold text-[#0F172A] truncate max-w-[120px]">
                {profile?.farmerName || 'Farmer'}
              </span>
              <span className="text-[10px] text-[#0F766E] font-medium truncate max-w-[120px]">
                {profile?.farmName || 'Kisan Enterprise'}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-[#64748B] shrink-0" />
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-[#E2E8F0] py-2 z-50">
              <div className="px-4 py-3 border-b border-[#E2E8F0]">
                <p className="text-xs font-bold text-[#0F172A] truncate">
                  {profile?.farmerName || 'Farmer'}
                </p>
                <p className="text-[11px] text-[#64748B] truncate mt-0.5">
                  ID: {profile?.farmerId || 'AG-FARM-01'}
                </p>
                <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#CCFBF1] text-[#0F766E] text-[10px] font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0F766E]" />
                  Verified Agricultural Producer
                </div>
              </div>

              <div className="py-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsProfileOpen(false);
                    navigateTo('profile');
                  }}
                  className="w-full px-4 py-2 text-left text-xs text-[#0F172A] hover:bg-[#CCFBF1]/40 flex items-center gap-2.5 font-medium transition-colors cursor-pointer"
                >
                  <User className="w-4 h-4 text-[#0F766E]" />
                  <span>View My Profile</span>
                </button>
              </div>

              <div className="pt-1 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full px-4 py-2 text-left text-xs text-red-600 hover:bg-red-50 flex items-center gap-2.5 font-medium transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4 text-red-600" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default FarmerNavbar;

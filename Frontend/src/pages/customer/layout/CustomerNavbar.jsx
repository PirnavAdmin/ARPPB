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
  ShoppingCart,
  RotateCcw,
  CheckCheck,
  ArrowRight,
  LayoutGrid,
} from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { useCustomer } from '../context/useCustomer';
import CustomerBreadcrumb from './CustomerBreadcrumb';

const QUICK_SCREENS = [
  { id: 'dashboard', label: 'Dashboard', group: 'Overview', path: '/customer/dashboard' },
  { id: 'products', label: 'Browse Products', group: 'Marketplace', path: '/customer/products' },
  { id: 'categories', label: 'Categories', group: 'Marketplace', path: '/customer/categories' },
  { id: 'cart', label: 'My Cart', group: 'Marketplace', path: '/customer/cart' },
  { id: 'orders', label: 'My Orders', group: 'Orders & Verification', path: '/customer/orders' },
  { id: 'history', label: 'Purchase History', group: 'Orders & Verification', path: '/customer/purchase-history' },
  { id: 'otp', label: 'OTP Confirmations', group: 'Orders & Verification', path: '/customer/confirmations' },
  { id: 'notifications', label: 'Notifications', group: 'Account & Alerts', path: '/customer/notifications' },
  { id: 'profile', label: 'My Profile', group: 'Account & Alerts', path: '/customer/profile' },
];

export function CustomerNavbar({ onOpenMobileSidebar, onToggleDesktopSidebar }) {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const {
    profile,
    products,
    categories,
    orders,
    purchaseHistory,
    notifications,
    metrics,
    cartItemCount,
    markNotificationRead,
    markAllNotificationsRead,
    resetCustomerDemoData,
  } = useCustomer();

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

    QUICK_SCREENS.forEach((screen) => {
      if (screen.label.toLowerCase().includes(q) || screen.group.toLowerCase().includes(q)) {
        results.push({
          id: `screen-${screen.id}`,
          category: 'Screen',
          title: screen.label,
          subtitle: screen.group,
          path: screen.path,
        });
      }
    });

    products.forEach((p) => {
      if (
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.location.toLowerCase().includes(q)
      ) {
        results.push({
          id: p.id,
          category: 'Product',
          title: p.name,
          subtitle: `${p.category} • ${p.location}`,
          path: '/customer/products',
          state: { initialSearch: p.name },
        });
      }
    });

    categories.forEach((cat) => {
      if (cat.name.toLowerCase().includes(q)) {
        results.push({
          id: `cat-${cat.id}`,
          category: 'Category',
          title: cat.name,
          subtitle: cat.description,
          path: '/customer/categories',
          state: { selectedCategory: cat.name },
        });
      }
    });

    orders.forEach((ord) => {
      if (
        ord.id.toLowerCase().includes(q) ||
        ord.product.toLowerCase().includes(q)
      ) {
        results.push({
          id: ord.id,
          category: 'Order',
          title: `${ord.id} – ${ord.product}`,
          subtitle: `${ord.quantity} ${ord.unit} • Status: ${ord.orderStatus}`,
          path: '/customer/orders',
        });
      }
    });

    purchaseHistory.forEach((txn) => {
      if (
        txn.transactionId.toLowerCase().includes(q) ||
        txn.productName.toLowerCase().includes(q)
      ) {
        results.push({
          id: txn.transactionId,
          category: 'Purchase',
          title: `${txn.transactionId} – ${txn.productName}`,
          subtitle: `${txn.quantity} • ${txn.status}`,
          path: '/customer/purchase-history',
        });
      }
    });

    return results.slice(0, 8);
  }, [globalQuery, products, categories, orders, purchaseHistory]);

  const initials = (profile?.fullName || 'RK')
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="sticky top-0 z-20 h-16 bg-white border-b border-[#E2E8F0] px-4 sm:px-6 flex items-center justify-between gap-4 shadow-2xs">
      {/* Left: Sidebar Toggles & Breadcrumb */}
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

        <CustomerBreadcrumb />
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
            placeholder="Search raw products, categories, orders..."
            aria-label="Search customer portal"
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[#0F172A] placeholder:text-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/30 focus:border-[#0F766E] focus:bg-white transition-all"
          />
        </div>

        {isSearchOpen && globalQuery.trim() && (
          <div className="absolute left-0 right-0 mt-2 bg-white rounded-xl border border-[#E2E8F0] shadow-xl overflow-hidden z-50">
            {searchResults.length === 0 ? (
              <div className="p-4 text-xs text-[#64748B] text-center">
                No matching products, orders, or modules for "{globalQuery}"
              </div>
            ) : (
              <div className="divide-y divide-[#E2E8F0] max-h-80 overflow-y-auto">
                {searchResults.map((res) => (
                  <button
                    key={`${res.category}-${res.id}`}
                    type="button"
                    onClick={() => {
                      navigate(res.path, res.state ? { state: res.state } : undefined);
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

      {/* Right: Cart Shortcut, OTP Queue Shortcut, Notifications Dropdown, Profile Dropdown */}
      <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
        {/* Cart Shortcut */}
        <button
          type="button"
          onClick={() => navigate('/customer/cart')}
          title="My Cart"
          aria-label="Open My Cart"
          className="relative inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-[#CCFBF1]/70 text-[#0F766E] hover:bg-[#14B8A6] hover:text-white text-xs font-semibold transition-colors cursor-pointer"
        >
          <ShoppingCart className="w-4 h-4 shrink-0" />
          <span className="hidden md:inline">Cart</span>
          {cartItemCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-[#0F766E] text-white text-[10px] font-bold">
              {cartItemCount}
            </span>
          )}
        </button>

        {/* OTP Queue Shortcut */}
        <button
          type="button"
          onClick={() => navigate('/customer/confirmations')}
          title="Pending OTP Confirmations"
          className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#CCFBF1]/70 text-[#0F766E] hover:bg-[#14B8A6] hover:text-white text-xs font-semibold transition-colors cursor-pointer"
        >
          <ShieldCheck className="w-4 h-4" />
          <span>OTP Queue</span>
          {metrics.pendingConfirmations > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-[#0F766E] text-white text-[10px] font-bold">
              {metrics.pendingConfirmations}
            </span>
          )}
        </button>

        {/* Notifications Dropdown */}
        <div ref={notifRef} className="relative">
          <button
            type="button"
            onClick={() => setIsNotifOpen((prev) => !prev)}
            aria-label="Open notifications"
            className="relative p-2 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-[#0F766E] hover:bg-[#CCFBF1] transition-colors cursor-pointer"
          >
            <Bell className="w-4 h-4" />
            {metrics.unreadNotifications > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#0F766E] text-white text-[10px] font-bold flex items-center justify-center">
                {metrics.unreadNotifications}
              </span>
            )}
          </button>

          {isNotifOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl border border-[#E2E8F0] shadow-xl overflow-hidden z-50">
              <div className="px-4 py-3 bg-[#CCFBF1]/40 border-b border-[#E2E8F0] flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-[#0F766E] uppercase tracking-wider">
                    Notifications
                  </h3>
                  <p className="text-[11px] text-[#64748B]">
                    {metrics.unreadNotifications} unread alert(s)
                  </p>
                </div>
                {metrics.unreadNotifications > 0 && (
                  <button
                    type="button"
                    onClick={markAllNotificationsRead}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0F766E] hover:underline cursor-pointer"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    Mark all read
                  </button>
                )}
              </div>

              <div className="divide-y divide-[#E2E8F0] max-h-80 overflow-y-auto">
                {notifications.slice(0, 5).map((n) => (
                  <div
                    key={n.id}
                    onClick={() => {
                      markNotificationRead(n.id);
                      setIsNotifOpen(false);
                      if (n.targetPath) navigate(n.targetPath);
                    }}
                    className={`p-3.5 hover:bg-[#CCFBF1]/30 transition-colors cursor-pointer ${
                      !n.isRead ? 'bg-[#CCFBF1]/15' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-semibold text-[#0F172A] line-clamp-1">
                        {n.title}
                      </span>
                      {!n.isRead && (
                        <span className="w-2 h-2 rounded-full bg-[#14B8A6] shrink-0 mt-1" />
                      )}
                    </div>
                    <p className="text-[11px] text-[#64748B] mt-0.5 line-clamp-2">
                      {n.description}
                    </p>
                    <div className="flex items-center justify-between mt-1.5 text-[10px] text-[#64748B]">
                      <span className="font-medium text-[#0F766E]">{n.type}</span>
                      <span>{n.timestamp}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-2.5 bg-[#F8FAFC] border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => {
                    setIsNotifOpen(false);
                    navigate('/customer/notifications');
                  }}
                  className="w-full py-1.5 rounded-lg text-xs font-semibold text-[#0F766E] hover:bg-[#CCFBF1] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span>View All Notifications</span>
                  <ArrowRight className="w-3.5 h-3.5" />
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
            className="flex items-center gap-2.5 pl-1.5 pr-2.5 py-1 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] hover:bg-[#CCFBF1]/40 transition-colors cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-[#0F766E] text-white text-xs font-bold flex items-center justify-center overflow-hidden shrink-0">
              {profile?.profilePhoto ? (
                <img
                  src={profile.profilePhoto}
                  alt={profile.fullName}
                  className="w-full h-full object-cover"
                />
              ) : (
                initials
              )}
            </div>
            <div className="hidden xl:block text-left max-w-[150px]">
              <p className="text-xs font-bold text-[#0F172A] truncate">
                {profile?.fullName}
              </p>
              <p className="text-[10px] text-[#64748B] truncate">
                {profile?.customerId}
              </p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-[#64748B]" />
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl border border-[#E2E8F0] shadow-xl overflow-hidden z-50">
              <div className="p-4 bg-[#CCFBF1]/40 border-b border-[#E2E8F0]">
                <p className="text-xs font-bold text-[#0F766E] truncate">
                  {profile?.fullName}
                </p>
                <p className="text-[11px] text-[#64748B] truncate mt-0.5">
                  {profile?.email ? `${profile.email} • ${profile.customerId}` : profile?.customerId}
                </p>
              </div>

              <div className="p-1.5 space-y-0.5">
                <button
                  type="button"
                  onClick={() => {
                    setIsProfileOpen(false);
                    navigate('/customer/profile');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-[#0F172A] hover:bg-[#CCFBF1] hover:text-[#0F766E] transition-colors cursor-pointer"
                >
                  <User className="w-4 h-4 text-[#0F766E]" />
                  <span>My Profile & Addresses</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsProfileOpen(false);
                    navigate('/dashboard');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-[#0F766E] hover:bg-[#CCFBF1] transition-colors cursor-pointer"
                >
                  <LayoutGrid className="w-4 h-4 text-[#0F766E]" />
                  <span>Workspace Portal Hub</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsProfileOpen(false);
                    resetCustomerDemoData();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-[#0F172A] hover:bg-[#CCFBF1] hover:text-[#0F766E] transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4 text-[#0F766E]" />
                  <span>Reset Customer Demo Data</span>
                </button>

                <div className="border-t border-[#E2E8F0] my-1" />

                <button
                  type="button"
                  onClick={() => {
                    setIsProfileOpen(false);
                    logout();
                    navigate('/login');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-[#DC2626] hover:bg-[#FEE2E2] transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
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

export default CustomerNavbar;


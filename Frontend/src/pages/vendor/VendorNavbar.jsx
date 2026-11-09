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
  RotateCcw,
  CheckCheck,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useVendor } from '../../hooks/useVendor';
import VendorBreadcrumb from './VendorBreadcrumb';
import { VENDOR_NAVIGATION } from '../../config/navigation';

export function VendorNavbar({ onOpenMobileSidebar, onToggleDesktopSidebar }) {
  const navigate = useNavigate();
  const { vendorUser, logout } = useAuth();
  const {
    notifications,
    unreadNotificationsCount,
    pendingConfirmationsCount,
    markNotificationRead,
    markAllNotificationsRead,
    farmers,
    middlemen,
    customers,
    purchases,
    inventory,
    products,
    orders,
    resetDemoData,
  } = useVendor();

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

    VENDOR_NAVIGATION.forEach((nav) => {
      if (nav.label.toLowerCase().includes(q) || nav.description.toLowerCase().includes(q)) {
        results.push({
          id: `nav-${nav.id}`,
          category: 'Screen',
          title: nav.label,
          subtitle: nav.group,
          path: nav.path,
        });
      }
    });

    farmers.forEach((f) => {
      if (
        f.id.toLowerCase().includes(q) ||
        f.farmerName.toLowerCase().includes(q) ||
        f.mobileNumber.includes(q)
      ) {
        results.push({
          id: f.id,
          category: 'Farmer',
          title: `${f.farmerName} (${f.id})`,
          subtitle: `${f.village}, ${f.district}`,
          path: '/vendor/farmers',
        });
      }
    });

    middlemen.forEach((m) => {
      if (
        m.id.toLowerCase().includes(q) ||
        m.businessName.toLowerCase().includes(q) ||
        m.ownerName.toLowerCase().includes(q)
      ) {
        results.push({
          id: m.id,
          category: 'Middleman',
          title: `${m.businessName} (${m.id})`,
          subtitle: `${m.ownerName} • ${m.district}`,
          path: '/vendor/middlemen',
        });
      }
    });

    customers.forEach((c) => {
      if (
        c.id.toLowerCase().includes(q) ||
        c.customerName.toLowerCase().includes(q) ||
        (c.businessName || '').toLowerCase().includes(q)
      ) {
        results.push({
          id: c.id,
          category: 'Customer',
          title: `${c.customerName} (${c.id})`,
          subtitle: c.businessName || c.district,
          path: '/vendor/customers',
        });
      }
    });

    purchases.forEach((p) => {
      if (
        p.id.toLowerCase().includes(q) ||
        p.supplierName.toLowerCase().includes(q) ||
        p.crop.toLowerCase().includes(q)
      ) {
        results.push({
          id: p.id,
          category: 'Purchase',
          title: `${p.id} – ${p.crop}`,
          subtitle: `${p.supplierName} (${p.status})`,
          path: '/vendor/purchases/history',
        });
      }
    });

    inventory.forEach((inv) => {
      if (
        inv.id.toLowerCase().includes(q) ||
        inv.batchNumber.toLowerCase().includes(q) ||
        inv.cropName.toLowerCase().includes(q)
      ) {
        results.push({
          id: inv.id,
          category: 'Inventory Batch',
          title: `${inv.batchNumber} (${inv.id})`,
          subtitle: `${inv.cropName} • ${inv.availableQuantity} ${inv.unit} avail`,
          path: '/vendor/inventory',
        });
      }
    });

    products.forEach((prod) => {
      if (prod.id.toLowerCase().includes(q) || prod.productName.toLowerCase().includes(q)) {
        results.push({
          id: prod.id,
          category: 'Finished Product',
          title: `${prod.productName} (${prod.id})`,
          subtitle: `${prod.availableQuantity} ${prod.unit} available`,
          path: '/vendor/finished-products',
        });
      }
    });

    orders.forEach((ord) => {
      if (ord.id.toLowerCase().includes(q) || ord.customerName.toLowerCase().includes(q)) {
        results.push({
          id: ord.id,
          category: 'Customer Order',
          title: `${ord.id} – ${ord.product}`,
          subtitle: `${ord.customerName} (${ord.orderStatus})`,
          path: '/vendor/orders',
        });
      }
    });

    return results.slice(0, 8);
  }, [globalQuery, farmers, middlemen, customers, purchases, inventory, products, orders]);

  const initials = (vendorUser?.ownerName || 'VR')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="sticky top-0 z-20 h-16 bg-brand-surface border-b border-brand-border px-4 sm:px-6 flex items-center justify-between gap-4 shadow-2xs">
      {/* Left: Sidebar Toggles & Breadcrumb */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileSidebar}
          aria-label="Open navigation menu"
          className="lg:hidden p-2 rounded-lg text-brand-primary bg-brand-light/60 hover:bg-brand-light transition-colors cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={onToggleDesktopSidebar}
          aria-label="Toggle desktop sidebar"
          className="hidden lg:inline-flex p-2 rounded-lg text-brand-primary bg-brand-light/50 hover:bg-brand-light transition-colors cursor-pointer"
        >
          <Menu className="w-4 h-4" />
        </button>

        <VendorBreadcrumb />
      </div>

      {/* Center: Global Search */}
      <div ref={searchRef} className="relative flex-1 max-w-md hidden sm:block">
        <div className="relative">
          <Search className="w-4 h-4 text-brand-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={globalQuery}
            onFocus={() => setIsSearchOpen(true)}
            onChange={(e) => {
              setGlobalQuery(e.target.value);
              setIsSearchOpen(true);
            }}
            placeholder="Global ERP search (ID, farmer, batch, order, screen)..."
            aria-label="Global ERP search"
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-brand-background border border-brand-border rounded-xl text-brand-text placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary focus:bg-brand-surface transition-all"
          />
        </div>

        {isSearchOpen && globalQuery.trim() && (
          <div className="absolute left-0 right-0 mt-2 bg-brand-surface rounded-xl border border-brand-border shadow-xl overflow-hidden z-50">
            {searchResults.length === 0 ? (
              <div className="p-4 text-xs text-brand-muted text-center">
                No matching records or modules for "{globalQuery}"
              </div>
            ) : (
              <div className="divide-y divide-brand-border max-h-80 overflow-y-auto">
                {searchResults.map((res) => (
                  <button
                    key={`${res.category}-${res.id}`}
                    type="button"
                    onClick={() => {
                      navigate(res.path);
                      setIsSearchOpen(false);
                      setGlobalQuery('');
                    }}
                    className="w-full px-4 py-2.5 text-left hover:bg-brand-light/40 flex items-center justify-between gap-3 transition-colors cursor-pointer"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-brand-text truncate">{res.title}</p>
                      <p className="text-[11px] text-brand-muted truncate">{res.subtitle}</p>
                    </div>
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-brand-light text-brand-primary shrink-0">
                      {res.category}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right: Pending OTP Shortcut, Notifications Dropdown, Vendor Profile Dropdown */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* Pending OTP Badge Shortcut */}
        <button
          type="button"
          onClick={() => navigate('/vendor/confirmations')}
          title="Pending OTP Confirmations"
          className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-light/70 text-brand-primary hover:bg-brand-secondary hover:text-white text-xs font-semibold transition-colors cursor-pointer"
        >
          <ShieldCheck className="w-4 h-4" />
          <span>OTP Queue</span>
          {pendingConfirmationsCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-brand-primary text-white text-[10px] font-bold">
              {pendingConfirmationsCount}
            </span>
          )}
        </button>

        {/* Notifications Dropdown */}
        <div ref={notifRef} className="relative">
          <button
            type="button"
            onClick={() => setIsNotifOpen((prev) => !prev)}
            aria-label="Open notifications"
            className="relative p-2 rounded-xl bg-brand-background border border-brand-border text-brand-primary hover:bg-brand-light transition-colors cursor-pointer"
          >
            <Bell className="w-4 h-4" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-brand-primary text-white text-[10px] font-bold flex items-center justify-center">
                {unreadNotificationsCount}
              </span>
            )}
          </button>

          {isNotifOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-brand-surface rounded-2xl border border-brand-border shadow-xl overflow-hidden z-50">
              <div className="px-4 py-3 bg-brand-light/40 border-b border-brand-border flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-brand-primary uppercase tracking-wider">
                    Notifications
                  </h3>
                  <p className="text-[11px] text-brand-muted">
                    {unreadNotificationsCount} unread alert(s)
                  </p>
                </div>
                {unreadNotificationsCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllNotificationsRead}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-primary hover:underline cursor-pointer"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    Mark all read
                  </button>
                )}
              </div>

              <div className="divide-y divide-brand-border max-h-80 overflow-y-auto">
                {notifications.slice(0, 6).map((n) => (
                  <div
                    key={n.id}
                    onClick={() => {
                      markNotificationRead(n.id);
                      setIsNotifOpen(false);
                      if (n.targetPath) navigate(n.targetPath);
                    }}
                    className={`p-3.5 hover:bg-brand-light/30 transition-colors cursor-pointer ${
                      !n.isRead ? 'bg-brand-light/15' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-semibold text-brand-text line-clamp-1">
                        {n.title}
                      </span>
                      {!n.isRead && (
                        <span className="w-2 h-2 rounded-full bg-brand-secondary shrink-0 mt-1" />
                      )}
                    </div>
                    <p className="text-[11px] text-brand-muted mt-0.5 line-clamp-2">
                      {n.description}
                    </p>
                    <div className="flex items-center justify-between mt-1.5 text-[10px] text-brand-muted">
                      <span className="font-medium text-brand-primary">{n.category}</span>
                      <span>{n.date}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-2.5 bg-brand-background border-t border-brand-border">
                <button
                  type="button"
                  onClick={() => {
                    setIsNotifOpen(false);
                    navigate('/vendor/notifications');
                  }}
                  className="w-full py-1.5 rounded-lg text-xs font-semibold text-brand-primary hover:bg-brand-light flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
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
            className="flex items-center gap-2.5 pl-1.5 pr-2.5 py-1 rounded-xl border border-brand-border bg-brand-background hover:bg-brand-light/40 transition-colors cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-brand-primary text-white text-xs font-bold flex items-center justify-center overflow-hidden shrink-0">
              {vendorUser?.logoUrl ? (
                <img
                  src={vendorUser.logoUrl}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                initials
              )}
            </div>
            <div className="hidden xl:block text-left max-w-[160px]">
              <p className="text-xs font-bold text-brand-text truncate">
                {vendorUser?.businessName}
              </p>
              <p className="text-[10px] text-brand-muted truncate">{vendorUser?.ownerName}</p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-brand-muted" />
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-brand-surface rounded-2xl border border-brand-border shadow-xl overflow-hidden z-50">
              <div className="p-4 bg-brand-light/40 border-b border-brand-border">
                <p className="text-xs font-bold text-brand-primary truncate">
                  {vendorUser?.businessName}
                </p>
                <p className="text-[11px] text-brand-muted truncate mt-0.5">
                  {vendorUser?.ownerName} • {vendorUser?.vendorId}
                </p>
              </div>

              <div className="p-1.5 space-y-0.5">
                <button
                  type="button"
                  onClick={() => {
                    setIsProfileOpen(false);
                    navigate('/vendor/profile');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-brand-text hover:bg-brand-light hover:text-brand-primary transition-colors cursor-pointer"
                >
                  <User className="w-4 h-4 text-brand-primary" />
                  <span>My Profile & Bank Details</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsProfileOpen(false);
                    navigate('/dashboard');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-brand-primary hover:bg-brand-light transition-colors cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4 text-brand-primary" />
                  <span>Workspace Portal Hub</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsProfileOpen(false);
                    resetDemoData();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-brand-text hover:bg-brand-light hover:text-brand-primary transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4 text-brand-primary" />
                  <span>Reset Demo ERP Dataset</span>
                </button>

                <div className="border-t border-brand-border my-1" />

                <button
                  type="button"
                  onClick={() => {
                    setIsProfileOpen(false);
                    logout();
                    navigate('/login');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-brand-error hover:bg-brand-error-light transition-colors cursor-pointer"
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

export default VendorNavbar;


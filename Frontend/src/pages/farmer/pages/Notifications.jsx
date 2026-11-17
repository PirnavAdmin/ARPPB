import { useState, useMemo } from 'react';
import {
  Bell,
  BellRing,
  ShieldCheck,
  ShoppingCart,
  CreditCard,
  Package,
  Clock,
  Check,
  CheckCheck,
  Search,
  ExternalLink,
  AlertTriangle,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useFarmer } from '../context/FarmerContext';
import FarmerPageHeader from '../components/FarmerPageHeader';
import FarmerStatCard from '../components/FarmerStatCard';

const CATEGORY_MAP = {
  otp: { label: 'OTP & Security', icon: ShieldCheck },
  sales: { label: 'Sales & Orders', icon: ShoppingCart },
  payments: { label: 'Payments', icon: CreditCard },
  stock: { label: 'Stock & Yield', icon: Package },
};

const CATEGORIES = [
  { id: 'All', label: 'All Alerts' },
  { id: 'Unread', label: 'Unread Only' },
  { id: 'otp', label: 'OTP & Security' },
  { id: 'sales', label: 'Sales & Orders' },
  { id: 'payments', label: 'Payments' },
  { id: 'stock', label: 'Stock & Yield' },
];

export default function Notifications() {
  const {
    notifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    searchQuery,
    navigateTo,
    setSelectedTransaction,
    sales,
  } = useFarmer();

  const [activeCategory, setActiveCategory] = useState('All');
  const [internalSearch, setInternalSearch] = useState('');
  const [dismissedIds, setDismissedIds] = useState([]);

  const effectiveSearch = (searchQuery || internalSearch).trim().toLowerCase();

  // Filter out locally dismissed notifications
  const activeNotifications = useMemo(() => {
    return (notifications || []).filter((n) => !dismissedIds.includes(n.id));
  }, [notifications, dismissedIds]);

  // Metrics
  const totalCount = activeNotifications.length;
  const unreadCount = activeNotifications.filter((n) => !n.read).length;
  const otpAlertsCount = activeNotifications.filter((n) => n.category === 'otp').length;
  const actionRequiredCount = activeNotifications.filter(
    (n) => !n.read && (n.type === 'warning' || n.category === 'otp')
  ).length;

  const filteredNotifications = useMemo(() => {
    return activeNotifications.filter((item) => {
      const matchSearch =
        !effectiveSearch ||
        item.title.toLowerCase().includes(effectiveSearch) ||
        item.detail.toLowerCase().includes(effectiveSearch);

      const matchCategory =
        activeCategory === 'All'
          ? true
          : activeCategory === 'Unread'
          ? !item.read
          : item.category === activeCategory;

      return matchSearch && matchCategory;
    });
  }, [activeNotifications, effectiveSearch, activeCategory]);

  const handleNotificationClick = (item) => {
    markNotificationAsRead(item.id);

    if (item.targetId && item.targetId.startsWith('TXN-')) {
      const match = sales.find((s) => s.id === item.targetId);
      if (match) {
        setSelectedTransaction(match);
      }
    }

    if (item.targetPage) {
      navigateTo(item.targetPage);
    }
  };

  const handleDeleteNotification = (id, e) => {
    e.stopPropagation();
    setDismissedIds((prev) => [...prev, id]);
    toast.success('Notification dismissed.');
  };

  const handleMarkRead = (id, e) => {
    e.stopPropagation();
    markNotificationAsRead(id);
    toast.success('Notification marked as read.');
  };

  const handleResetFilters = () => {
    setActiveCategory('All');
    setInternalSearch('');
  };

  return (
    <div className="space-y-6">
      {/* Page Header (Matches VendorPageHeader & CustomerPageHeader) */}
      <FarmerPageHeader
        title="Farmer Notifications & Operational Alerts"
        subtitle="Real-time alerts for incoming buyer purchase requests, OTP confirmations, price trends, stock levels, and bank settlements."
        icon={Bell}
        badge="Live System Alerts"
        actions={
          unreadCount > 0 ? (
            <button
              type="button"
              onClick={markAllNotificationsAsRead}
              className="inline-flex items-center gap-1.5 px-4 h-9 rounded-xl text-xs font-semibold bg-[#0F766E] text-white hover:bg-[#115E59] transition-all duration-200 cursor-pointer shadow-xs"
            >
              <CheckCheck className="w-3.5 h-3.5 stroke-[2] shrink-0" />
              <span>Mark All as Read</span>
            </button>
          ) : null
        }
      />

      {/* 4 Standard Summary KPI Cards (Using FarmerStatCard) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <FarmerStatCard
          title="Total Notifications"
          value={totalCount}
          subtitle="All recorded operational alerts"
          icon={Bell}
          onClick={() => setActiveCategory('All')}
        />
        <FarmerStatCard
          title="Unread Alerts"
          value={unreadCount}
          subtitle="Requiring your review"
          icon={BellRing}
          trend={unreadCount > 0 ? { value: `${unreadCount} new`, direction: 'up' } : null}
          onClick={() => setActiveCategory('Unread')}
        />
        <FarmerStatCard
          title="OTP & Security Alerts"
          value={otpAlertsCount}
          subtitle="Buyer verification notices"
          icon={ShieldCheck}
          onClick={() => setActiveCategory('otp')}
        />
        <FarmerStatCard
          title="Action Required"
          value={actionRequiredCount}
          subtitle="Pending dispatches & payments"
          icon={AlertTriangle}
          trend={actionRequiredCount > 0 ? { value: 'Urgent', direction: 'down' } : null}
          onClick={() => setActiveCategory('Unread')}
        />
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#0F766E] text-white shadow-xs'
                    : 'bg-[#F8FAFC] border border-[#E2E8F0] text-[#64748B] hover:text-[#0F172A] hover:bg-slate-100'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-[#64748B] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={internalSearch}
            onChange={(e) => setInternalSearch(e.target.value)}
            placeholder="Search alerts by title or detail..."
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[#0F172A] placeholder:text-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/30 focus:border-[#0F766E] focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* Notifications List Container */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 sm:p-5 shadow-xs space-y-3">
        {filteredNotifications.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-2xl bg-[#CCFBF1] text-[#0F766E] flex items-center justify-center mb-3">
              <Bell className="w-6 h-6 stroke-[2]" />
            </div>
            <h4 className="text-sm font-bold text-[#0F172A]">No Notifications Found</h4>
            <p className="text-xs text-[#64748B] mt-1 max-w-sm">
              No notifications match your current category or search filters.
            </p>
            <button
              type="button"
              onClick={handleResetFilters}
              className="mt-4 px-3.5 py-1.5 rounded-xl bg-[#0F766E] text-white text-xs font-semibold hover:bg-[#115E59] transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map((item) => {
              const catConfig = CATEGORY_MAP[item.category] || {
                label: 'General',
                icon: Bell,
              };
              const Icon = catConfig.icon;
              const isUnread = !item.read;

              return (
                <div
                  key={item.id}
                  onClick={() => handleNotificationClick(item)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    isUnread
                      ? 'bg-[#CCFBF1]/35 border-[#0F766E]/40 shadow-xs'
                      : 'bg-white border-[#E2E8F0] hover:bg-[#F8FAFC]'
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    <div
                      className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${
                        isUnread
                          ? 'bg-[#0F766E] text-white shadow-xs'
                          : 'bg-[#CCFBF1] text-[#0F766E]'
                      }`}
                    >
                      <Icon className="w-5 h-5 stroke-[2]" />
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {isUnread && (
                          <span className="w-2 h-2 rounded-full bg-[#0F766E] shrink-0" />
                        )}
                        <h4
                          className={`text-sm ${
                            isUnread
                              ? 'font-extrabold text-[#0F172A]'
                              : 'font-semibold text-[#0F172A]'
                          }`}
                        >
                          {item.title}
                        </h4>
                        <span className="px-2 py-0.5 rounded-md bg-[#F8FAFC] border border-[#E2E8F0] text-[11px] font-semibold text-[#0F766E]">
                          {catConfig.label}
                        </span>
                        {item.type === 'warning' && (
                          <span className="px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-[11px] font-semibold text-amber-700">
                            Attention
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-[#64748B] leading-relaxed">
                        {item.detail}
                      </p>

                      <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-[#64748B]">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3 h-3 text-[#64748B]" />
                          {item.time || 'Today'}
                        </span>
                        {item.targetId && (
                          <span className="font-mono font-bold text-[#0F766E]">
                            Ref: {item.targetId}
                          </span>
                        )}
                        {item.targetPage && (
                          <span className="inline-flex items-center gap-1 text-[#0F766E] font-semibold hover:underline">
                            Open Module
                            <ExternalLink className="w-3 h-3" />
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div
                    className="flex items-center gap-2 shrink-0 self-end sm:self-center"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {isUnread && (
                      <button
                        type="button"
                        onClick={(e) => handleMarkRead(item.id, e)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold rounded-lg bg-[#0F766E] text-white hover:bg-[#115E59] transition-colors cursor-pointer"
                        title="Mark as Read"
                      >
                        <Check className="w-3.5 h-3.5 stroke-[2]" />
                        <span>Mark Read</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={(e) => handleDeleteNotification(item.id, e)}
                      className="p-1.5 rounded-lg border border-[#E2E8F0] text-[#64748B] hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                      title="Dismiss Notification"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

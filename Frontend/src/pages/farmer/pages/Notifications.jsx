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
} from 'lucide-react';
import { useFarmer } from '../context/FarmerContext';

const CATEGORY_CONFIG = {
  otp: { label: 'OTP & Security', icon: ShieldCheck, color: '#D97706', bg: '#FEF3C7', border: '#FDE68A' },
  sales: { label: 'Sales & Orders', icon: ShoppingCart, color: '#0F766E', bg: '#CCFBF1', border: '#99F6E4' },
  payments: { label: 'Payments', icon: CreditCard, color: '#2563EB', bg: '#DBEAFE', border: '#BFDBFE' },
  stock: { label: 'Stock & Yield', icon: Package, color: '#059669', bg: '#D1FAE5', border: '#A7F3D0' },
};

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

  const effectiveSearch = (searchQuery || internalSearch).trim().toLowerCase();

  // Metrics
  const totalCount = notifications.length;
  const unreadCount = notifications.filter((n) => !n.read).length;
  const otpAlertsCount = notifications.filter((n) => n.category === 'otp').length;
  const actionRequiredCount = notifications.filter((n) => !n.read && (n.type === 'warning' || n.category === 'otp')).length;

  const filteredNotifications = useMemo(() => {
    return notifications.filter((item) => {
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
  }, [notifications, effectiveSearch, activeCategory]);

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

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#CCFBF1] text-[#0F766E] border border-[#0F766E]/20">
            <Bell className="w-3.5 h-3.5 text-[#0F766E]" />
            Live System Notifications
          </div>
          <h1 className="text-xl md:text-2xl font-extrabold text-slate-900">
            Notifications &amp; Operational Alerts
          </h1>
          <p className="text-xs md:text-sm text-slate-500 max-w-2xl">
            Real-time alerts for incoming purchase requests, buyer OTP confirmations, mandi price shifts, harvest stock levels, and automated bank settlements.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllNotificationsAsRead}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs md:text-sm font-semibold rounded-lg bg-[#0F766E] hover:bg-[#115E59] text-white shadow-xs transition-colors cursor-pointer"
            >
              <CheckCheck className="w-4 h-4" />
              Mark All Read ({unreadCount})
            </button>
          )}
        </div>
      </div>

      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => setActiveCategory('All')}
          className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-[#CCFBF1] text-[#0F766E] flex items-center justify-center font-bold">
              <Bell className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-50 text-slate-600 border border-slate-200">
              Total Feed
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-900">{totalCount}</div>
            <div className="text-xs font-semibold text-slate-500">All Notifications</div>
            <div className="text-[11px] text-slate-400 mt-0.5">System and trade events</div>
          </div>
        </div>

        <div
          onClick={() => setActiveCategory('Unread')}
          className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center font-bold">
              <BellRing className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              {unreadCount > 0 ? 'New' : 'All Clear'}
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-900">{unreadCount}</div>
            <div className="text-xs font-semibold text-slate-500">Unread Alerts</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Awaiting farmer review</div>
          </div>
        </div>

        <div
          onClick={() => setActiveCategory('otp')}
          className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
              Security
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-900">{otpAlertsCount}</div>
            <div className="text-xs font-semibold text-slate-500">OTP Confirmations</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Buyer trade verification</div>
          </div>
        </div>

        <div
          onClick={() => setActiveCategory('Unread')}
          className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 border border-red-200 flex items-center justify-center font-bold">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">
              High Priority
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-900">{actionRequiredCount}</div>
            <div className="text-xs font-semibold text-slate-500">Action Required</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Pending trade dispatch</div>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Controls */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {[
            { key: 'All', label: 'All Alerts', count: totalCount },
            { key: 'Unread', label: 'Unread', count: unreadCount },
            { key: 'otp', label: 'OTP & Security', count: otpAlertsCount },
            { key: 'sales', label: 'Sales & Orders' },
            { key: 'payments', label: 'Payments' },
            { key: 'stock', label: 'Stock & Yield' },
          ].map((tab) => {
            const isActive = activeCategory === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveCategory(tab.key)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-[#0F766E] text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Local Search Input */}
        <div className="relative w-full md:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search alerts..."
            value={internalSearch}
            onChange={(e) => setInternalSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]"
          />
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-xs">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <Bell className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800">No Notifications Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              There are currently no alerts matching your selected category &quot;{activeCategory}&quot; or search query.
            </p>
          </div>
        ) : (
          filteredNotifications.map((item) => {
            const config = CATEGORY_CONFIG[item.category] || CATEGORY_CONFIG.sales;
            const Icon = config.icon;
            const isUnread = !item.read;

            return (
              <div
                key={item.id}
                onClick={() => handleNotificationClick(item)}
                className={`rounded-xl border p-4 shadow-xs transition-all flex flex-col sm:flex-row sm:items-start justify-between gap-4 cursor-pointer ${
                  isUnread
                    ? 'bg-emerald-50/20 border-emerald-200 hover:border-emerald-300'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border"
                    style={{
                      backgroundColor: config.bg,
                      color: config.color,
                      borderColor: config.border,
                    }}
                  >
                    <Icon className="w-5 h-5" />
                  </div>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {isUnread && (
                        <span className="w-2 h-2 rounded-full bg-[#0F766E] shrink-0" title="Unread" />
                      )}
                      <h3 className="text-sm font-bold text-slate-900">{item.title}</h3>

                      <span
                        className="px-2 py-0.5 rounded-md text-[10px] font-bold"
                        style={{
                          backgroundColor: config.bg,
                          color: config.color,
                        }}
                      >
                        {config.label}
                      </span>

                      {item.type === 'warning' && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          Action Required
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
                      {item.detail}
                    </p>

                    <div className="flex items-center gap-3 pt-1 text-[11px] text-slate-400">
                      <span className="flex items-center gap-1 font-medium">
                        <Clock className="w-3 h-3" />
                        {item.time || 'Recently'}
                      </span>
                      {item.targetId && (
                        <span className="font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                          {item.targetId}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  {isUnread ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        markNotificationAsRead(item.id);
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5 text-[#0F766E]" />
                      Mark Read
                    </button>
                  ) : null}

                  {item.targetPage && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleNotificationClick(item);
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#0F766E] hover:bg-[#115E59] text-white transition-colors cursor-pointer shadow-xs"
                    >
                      <span>View</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

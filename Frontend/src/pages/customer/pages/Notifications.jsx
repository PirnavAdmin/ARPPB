import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  BellRing,
  AlertTriangle,
  CheckCircle2,
  CheckCheck,
  Clock,
  Check,
  Trash2,
  ExternalLink,
  ShoppingCart,
  ShieldCheck,
  Package,
  Truck,
  CreditCard,
} from 'lucide-react';
import { useCustomer } from '../context/useCustomer';
import { CUSTOMER_NOTIFICATION_TYPES } from '../data/customerData';
import { useDebounce } from '../../../hooks/useDebounce';
import { usePagination } from '../../../hooks/usePagination';
import { formatDateTime } from '../../../utils/formatDate';
import CustomerPageHeader from '../components/CustomerPageHeader';
import CustomerStatCard from '../components/CustomerStatCard';
import CustomerSearch from '../components/CustomerSearch';
import CustomerFilters from '../components/CustomerFilters';
import CustomerPagination from '../components/CustomerPagination';
import CustomerEmptyState from '../components/CustomerEmptyState';
import CustomerStatusBadge from '../components/CustomerStatusBadge';

const TYPE_ICON_MAP = {
  'Order Created': ShoppingCart,
  'Order Confirmed': CheckCircle2,
  'OTP Verification Required': ShieldCheck,
  'Purchase Confirmed': CheckCircle2,
  'Order Processing': Package,
  'Product Packed': Package,
  'Order Shipped': Truck,
  'Order Delivered': Truck,
  'Expected Payment': CreditCard,
  'Payment Due': CreditCard,
  'Payment Delayed': AlertTriangle,
};

export function Notifications() {
  const navigate = useNavigate();
  const {
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
    deleteNotification,
  } = useCustomer();

  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 200);
  const [typeFilter, setTypeFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [readFilter, setReadFilter] = useState('All');

  const stats = useMemo(() => {
    const total = notifications.length;
    const unread = notifications.filter((n) => !n.isRead).length;
    const highPriority = notifications.filter(
      (n) => n.priority === 'High' && !n.isRead
    ).length;
    const read = notifications.filter((n) => n.isRead).length;
    return { total, unread, highPriority, read };
  }, [notifications]);

  const filteredNotifications = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    return notifications.filter((n) => {
      if (typeFilter !== 'All' && n.type !== typeFilter) return false;
      if (priorityFilter !== 'All' && n.priority !== priorityFilter) return false;
      if (readFilter === 'Unread' && n.isRead) return false;
      if (readFilter === 'Read' && !n.isRead) return false;
      if (q) {
        const hit = [n.title, n.description, n.type, n.relatedId]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(q));
        if (!hit) return false;
      }
      return true;
    });
  }, [notifications, debouncedSearch, typeFilter, priorityFilter, readFilter]);

  const pagination = usePagination(filteredNotifications, 8);

  const handleResetFilters = () => {
    setSearchQuery('');
    setTypeFilter('All');
    setPriorityFilter('All');
    setReadFilter('All');
    pagination.goToPage(1);
  };

  const filterConfig = [
    {
      key: 'type',
      label: 'Notification Type',
      value: typeFilter,
      onChange: (val) => {
        setTypeFilter(val);
        pagination.goToPage(1);
      },
      options: [
        { label: `All Types (${CUSTOMER_NOTIFICATION_TYPES.length})`, value: 'All' },
        ...CUSTOMER_NOTIFICATION_TYPES.map((t) => ({ label: t, value: t })),
      ],
    },
    {
      key: 'priority',
      label: 'Priority',
      value: priorityFilter,
      onChange: (val) => {
        setPriorityFilter(val);
        pagination.goToPage(1);
      },
      options: [
        { label: 'All Priorities', value: 'All' },
        { label: 'High', value: 'High' },
        { label: 'Medium', value: 'Medium' },
        { label: 'Low', value: 'Low' },
      ],
    },
    {
      key: 'readStatus',
      label: 'Read Status',
      value: readFilter,
      onChange: (val) => {
        setReadFilter(val);
        pagination.goToPage(1);
      },
      options: [
        { label: 'All Alerts', value: 'All' },
        { label: 'Unread Only', value: 'Unread' },
        { label: 'Read Only', value: 'Read' },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <CustomerPageHeader
        title="Notifications Center"
        subtitle="Real-time alerts for orders, OTP verification requests, dispatch milestones, and payment reminders."
        icon={Bell}
        badge={`${stats.unread} Unread`}
        actions={
          stats.unread > 0 && (
            <button
              type="button"
              onClick={markAllNotificationsRead}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-[#0F766E] text-white hover:bg-[#115E59] transition-colors cursor-pointer shadow-xs"
            >
              <CheckCheck className="w-4 h-4" />
              <span>Mark All as Read ({stats.unread})</span>
            </button>
          )
        }
      />

      {/* 4 Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <CustomerStatCard
          title="Total Notifications"
          value={stats.total}
          description={`Across ${CUSTOMER_NOTIFICATION_TYPES.length} supported types`}
          icon={Bell}
        />
        <CustomerStatCard
          title="Unread Alerts"
          value={stats.unread}
          description="Requiring review"
          icon={BellRing}
        />
        <CustomerStatCard
          title="High Priority Unread"
          value={stats.highPriority}
          description="OTP & payment action items"
          icon={AlertTriangle}
        />
        <CustomerStatCard
          title="Acknowledged / Read"
          value={stats.read}
          description="Reviewed notifications"
          icon={CheckCircle2}
        />
      </div>

      {/* Search & Filters */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 space-y-4 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="w-full md:w-96">
            <CustomerSearch
              value={searchQuery}
              onChange={(val) => {
                setSearchQuery(val);
                pagination.goToPage(1);
              }}
              placeholder="Search notifications by title, type, order, or TXN ID..."
            />
          </div>
          <div className="text-xs text-[#64748B]">
            Showing <strong>{filteredNotifications.length}</strong> notifications
          </div>
        </div>

        <CustomerFilters
          filters={filterConfig}
          hasExtraActive={Boolean(searchQuery.trim())}
          onReset={handleResetFilters}
        />
      </div>

      {/* Notifications List */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 space-y-3 shadow-xs">
        {pagination.paginatedData.length > 0 ? (
          <>
            <div className="space-y-3">
              {pagination.paginatedData.map((notif) => {
                const Icon = TYPE_ICON_MAP[notif.type] || Bell;
                const isUnread = !notif.isRead;

                return (
                  <div
                    key={notif.id}
                    onClick={() => {
                      if (isUnread) markNotificationRead(notif.id);
                      if (notif.targetPath) navigate(notif.targetPath);
                    }}
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
                            ? 'bg-[#0F766E] text-white'
                            : 'bg-[#CCFBF1] text-[#0F766E]'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>

                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          {isUnread && (
                            <span
                              aria-label="Unread notification"
                              className="w-2 h-2 rounded-full bg-[#0F766E] shrink-0"
                            />
                          )}
                          <h4
                            className={`text-sm ${
                              isUnread
                                ? 'font-extrabold text-[#0F172A]'
                                : 'font-semibold text-[#0F172A]'
                            }`}
                          >
                            {notif.title}
                          </h4>
                          <span className="px-2 py-0.5 rounded-md bg-[#F8FAFC] border border-[#E2E8F0] text-[11px] font-semibold text-[#0F766E]">
                            {notif.type}
                          </span>
                          <CustomerStatusBadge status={notif.priority} size="xs" />
                        </div>

                        <p className="text-xs text-[#64748B] leading-relaxed">
                          {notif.description}
                        </p>

                        <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-[#64748B]">
                          <span className="inline-flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDateTime(notif.timestamp)}
                          </span>

                          {notif.relatedId && (
                            <span className="font-mono font-bold text-[#0F766E]">
                              Ref: {notif.relatedId}
                            </span>
                          )}

                          {notif.targetPath && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (isUnread) markNotificationRead(notif.id);
                                navigate(notif.targetPath);
                              }}
                              className="inline-flex items-center gap-1 text-[#0F766E] font-semibold hover:underline cursor-pointer"
                            >
                              <span>Open Screen</span>
                              <ExternalLink className="w-3 h-3" />
                            </button>
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
                          onClick={() => markNotificationRead(notif.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold rounded-lg bg-[#0F766E] text-white hover:bg-[#115E59] transition-colors cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Mark as Read</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => deleteNotification(notif.id)}
                        title="Dismiss notification"
                        aria-label="Delete notification"
                        className="p-1.5 rounded-lg border border-[#E2E8F0] text-[#64748B] hover:text-[#DC2626] hover:bg-[#FEE2E2] transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <CustomerPagination {...pagination} pageSizeOptions={[5, 8, 15, 25]} />
          </>
        ) : (
          <CustomerEmptyState
            icon={Bell}
            title="No Matching Notifications"
            description="Try clearing your notification type, priority, or read-status filters."
            actionLabel="Reset Filters"
            onAction={handleResetFilters}
          />
        )}
      </div>
    </div>
  );
}

export default Notifications;


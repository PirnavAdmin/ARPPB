import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bell,
  BellRing,
  CheckCheck,
  AlertTriangle,
  CheckCircle2,
  ShoppingCart,
  ShieldCheck,
  Factory,
  Package,
  ClipboardList,
  CreditCard,
  Clock,
  Check,
  Trash2,
  ExternalLink,
  Home,
  ChevronRight,
  UserCheck,
} from 'lucide-react';
import { useDebounce } from '../../../hooks/useDebounce';
import { usePagination } from '../../../hooks/usePagination';
import { isDateInRange } from '../../../utils/formatDate';
import VendorStatCard from '../../../pages/vendor/VendorStatCard';
import VendorSearch from '../../../pages/vendor/VendorSearch';
import VendorFilters from '../../../pages/vendor/VendorFilters';
import VendorPagination from '../../../pages/vendor/VendorPagination';
import VendorEmptyState from '../../../pages/vendor/VendorEmptyState';
import VendorStatusBadge from '../../../pages/vendor/VendorStatusBadge';

const CATEGORY_ICON_MAP = {
  'New Purchase Recorded': ShoppingCart,
  'New Farmer Purchase': ShoppingCart,
  'New Middleman Purchase': ShoppingCart,
  'Purchase Confirmed': ShoppingCart,
  'Farmer Purchase Confirmation': ShieldCheck,
  'Vendor Purchase Confirmation': ShieldCheck,
  'Customer Purchase Confirmation': ShieldCheck,
  'OTP Confirmation Pending': ShieldCheck,
  'OTP Verification': ShieldCheck,
  'OTP Expired': ShieldCheck,
  'OTP Failed': ShieldCheck,
  'Low Raw Material Stock': AlertTriangle,
  'Low Finished Product Stock': AlertTriangle,
  'Low Stock': AlertTriangle,
  'Inventory Updated': Package,
  'Processing Completed': Factory,
  'Customer Order Received': ClipboardList,
  'Customer Order Confirmed': ClipboardList,
  'Transaction Completed': CheckCircle2,
  'Product Sold': Package,
  'Expected Payment': CreditCard,
  'Payment Due': CreditCard,
  'Payment Overdue': CreditCard,
  'Payment Delayed': CreditCard,
};

function normalizePriority(priority) {
  if (!priority) return 'Medium';
  const lower = String(priority).toLowerCase();
  if (lower === 'high') return 'High';
  if (lower === 'low') return 'Low';
  return 'Medium';
}

/**
 * Shared, standardized Notifications screen component used by both
 * Vendor Portal and Middleman Portal while keeping portal data isolated.
 */
export default function Notifications({
  portal = 'vendor',
  title = 'System Notifications & Operational Alerts',
  subtitle = 'Real-time alerts for purchases, OTP confirmations, low stock thresholds, orders, and payment settlements',
  notifications = [],
  categories = [],
  onMarkRead,
  onMarkAllRead,
  onDelete,
}) {
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 200);
  const [dismissedIds, setDismissedIds] = useState([]);

  const [filters, setFilters] = useState({
    category: 'All',
    priority: 'All',
    readStatus: 'All',
    datePreset: 'All Time',
  });

  // Normalize notification items without mutating source objects
  const normalizedNotifications = useMemo(() => {
    return (notifications || [])
      .filter((n) => !dismissedIds.includes(n.id))
      .map((n) => ({
        raw: n,
        id: n.id,
        title: n.title || 'System Notification',
        description: n.description || '',
        category: n.category || 'Operational Alert',
        transactionId: n.transactionId || n.relatedId || '',
        partyName: n.partyName || '',
        date: n.date || n.timestamp || '',
        isRead: Boolean(n.isRead),
        priority: normalizePriority(n.priority),
        targetPath: n.targetPath || n.actionUrl || '',
      }));
  }, [notifications, dismissedIds]);

  const availableCategories = useMemo(() => {
    if (categories && categories.length > 0) return categories;
    return Array.from(
      new Set(normalizedNotifications.map((n) => n.category).filter(Boolean))
    );
  }, [categories, normalizedNotifications]);

  const stats = useMemo(() => {
    const unread = normalizedNotifications.filter((n) => !n.isRead).length;
    const highPriority = normalizedNotifications.filter(
      (n) => n.priority === 'High' && !n.isRead
    ).length;
    const readCount = normalizedNotifications.filter((n) => n.isRead).length;

    return {
      total: normalizedNotifications.length,
      unread,
      highPriority,
      readCount,
    };
  }, [normalizedNotifications]);

  const filteredNotifications = useMemo(() => {
    return normalizedNotifications.filter((n) => {
      if (debouncedSearch) {
        const q = debouncedSearch.toLowerCase();
        const match = [
          n.title,
          n.description,
          n.category,
          n.transactionId,
          n.partyName,
        ]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(q));
        if (!match) return false;
      }

      if (filters.category !== 'All' && n.category !== filters.category) {
        return false;
      }

      if (filters.priority !== 'All' && n.priority !== filters.priority) {
        return false;
      }

      if (filters.readStatus === 'Unread' && n.isRead) {
        return false;
      }
      if (filters.readStatus === 'Read' && !n.isRead) {
        return false;
      }

      if (filters.datePreset !== 'All Time') {
        const dateOnly = String(n.date || '').slice(0, 10);
        if (
          dateOnly &&
          !isDateInRange(dateOnly, filters.datePreset, '', '', '2026-11-05')
        ) {
          return false;
        }
      }

      return true;
    });
  }, [normalizedNotifications, debouncedSearch, filters]);

  const pagination = usePagination(filteredNotifications, 8);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    pagination.goToPage(1);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setFilters({
      category: 'All',
      priority: 'All',
      readStatus: 'All',
      datePreset: 'All Time',
    });
    pagination.goToPage(1);
  };

  const handleDeleteItem = (id) => {
    if (onDelete) {
      onDelete(id);
    } else {
      setDismissedIds((prev) => [...prev, id]);
    }
  };

  const filterConfig = [
    {
      key: 'category',
      label: `Notification Category (${availableCategories.length} Types)`,
      value: filters.category,
      options: [
        { label: 'All Categories', value: 'All' },
        ...availableCategories.map((c) => ({ label: c, value: c })),
      ],
    },
    {
      key: 'priority',
      label: 'Priority Level',
      value: filters.priority,
      options: [
        { label: 'All Priorities', value: 'All' },
        { label: 'High Priority', value: 'High' },
        { label: 'Medium Priority', value: 'Medium' },
        { label: 'Low Priority', value: 'Low' },
      ],
    },
    {
      key: 'readStatus',
      label: 'Read / Unread Status',
      value: filters.readStatus,
      options: [
        { label: 'All Notifications', value: 'All' },
        { label: 'Unread Only', value: 'Unread' },
        { label: 'Read Only', value: 'Read' },
      ],
    },
    {
      key: 'datePreset',
      label: 'Date Range',
      value: filters.datePreset,
      options: [
        { label: 'All Time', value: 'All Time' },
        { label: 'Today', value: 'Today' },
        { label: 'Yesterday', value: 'Yesterday' },
        { label: 'Last 7 Days', value: 'Last 7 Days' },
        { label: 'This Month', value: 'This Month' },
      ],
    },
  ];

  const dashboardPath =
    portal === 'middleman' ? '/middleman/dashboard' : '/vendor/dashboard';
  const portalLabel =
    portal === 'middleman' ? 'Middleman Portal' : 'Vendor Portal';

  return (
    <div className="space-y-6">
      {/* Unified Portal-Aware Header */}
      <div>
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-1.5 text-xs text-brand-muted mb-2"
        >
          <Link
            to={dashboardPath}
            className="inline-flex items-center gap-1 text-brand-muted hover:text-brand-primary transition-colors font-medium"
          >
            <Home className="w-3.5 h-3.5 text-brand-primary" />
            <span className="hidden sm:inline">{portalLabel}</span>
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-brand-border shrink-0" />
          <span className="font-semibold text-brand-primary truncate">
            Notifications
          </span>
        </nav>

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-brand-surface p-5 rounded-2xl border border-brand-border shadow-2xs">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-brand-light text-brand-primary flex items-center justify-center shrink-0 border border-brand-secondary/30">
              <Bell className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-bold text-brand-primary tracking-tight">
                  {title}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-light text-brand-primary border border-brand-secondary/30">
                  {stats.unread} Unread
                </span>
              </div>
              {subtitle && (
                <p className="text-xs sm:text-sm text-brand-muted mt-1">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {stats.unread > 0 && onMarkAllRead && (
            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={onMarkAllRead}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg bg-brand-primary text-white hover:bg-brand-secondary transition-colors cursor-pointer"
              >
                <CheckCheck className="w-4 h-4" />
                Mark All as Read ({stats.unread})
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 4 Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <VendorStatCard
          title="Total Notifications"
          value={stats.total}
          subtitle={`Across all ${availableCategories.length} alert categories`}
          icon={Bell}
        />
        <VendorStatCard
          title="Unread Notifications"
          value={stats.unread}
          subtitle="Awaiting user review"
          icon={BellRing}
        />
        <VendorStatCard
          title="High Priority Unread"
          value={stats.highPriority}
          subtitle="Low stock, OTP & overdue alerts"
          icon={AlertTriangle}
        />
        <VendorStatCard
          title="Acknowledged / Read"
          value={stats.readCount}
          subtitle="Reviewed operational alerts"
          icon={CheckCircle2}
        />
      </div>

      {/* Search & Filters */}
      <div className="bg-brand-surface border border-brand-border rounded-xl p-4 space-y-4 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="w-full md:w-96">
            <VendorSearch
              value={searchQuery}
              onChange={(val) => {
                setSearchQuery(val);
                pagination.goToPage(1);
              }}
              placeholder="Search notifications by title, description, party, or reference ID..."
            />
          </div>
          <div className="text-xs text-brand-muted">
            Showing <strong>{filteredNotifications.length}</strong>{' '}
            notifications
          </div>
        </div>

        <VendorFilters
          filters={filterConfig}
          onFilterChange={handleFilterChange}
          onReset={handleResetFilters}
        />
      </div>

      {/* Notification Cards List */}
      <div className="bg-brand-surface border border-brand-border rounded-xl p-4 space-y-3 shadow-xs">
        {pagination.paginatedData.length > 0 ? (
          <>
            <div className="space-y-3">
              {pagination.paginatedData.map((notif) => {
                const Icon = CATEGORY_ICON_MAP[notif.category] || Bell;
                const isUnread = !notif.isRead;

                return (
                  <div
                    key={notif.id}
                    onClick={() => {
                      if (isUnread && onMarkRead) onMarkRead(notif.id);
                      if (notif.targetPath) navigate(notif.targetPath);
                    }}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                      isUnread
                        ? 'bg-brand-light/35 border-brand-primary/40 shadow-xs'
                        : 'bg-brand-surface border-brand-border hover:bg-brand-background/60'
                    }`}
                  >
                    <div className="flex items-start gap-3.5">
                      <div
                        className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${
                          isUnread
                            ? 'bg-brand-primary text-white'
                            : 'bg-brand-light text-brand-primary'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>

                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          {isUnread && (
                            <span className="w-2 h-2 rounded-full bg-brand-primary shrink-0" />
                          )}
                          <h4
                            className={`text-sm ${
                              isUnread
                                ? 'font-extrabold text-brand-text'
                                : 'font-semibold text-brand-text'
                            }`}
                          >
                            {notif.title}
                          </h4>
                          <span className="px-2 py-0.5 rounded-md bg-brand-background border border-brand-border text-[11px] font-semibold text-brand-primary">
                            {notif.category}
                          </span>
                          <VendorStatusBadge status={notif.priority} />
                        </div>

                        <p className="text-xs text-brand-muted leading-relaxed">
                          {notif.description}
                        </p>

                        <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-brand-muted">
                          <span className="inline-flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {notif.date}
                          </span>
                          {notif.partyName && (
                            <span className="inline-flex items-center gap-1 font-medium text-brand-text">
                              <UserCheck className="w-3 h-3 text-brand-primary" />
                              {notif.partyName}
                            </span>
                          )}
                          {notif.transactionId && (
                            <span className="font-mono font-bold text-brand-primary">
                              Ref: {notif.transactionId}
                            </span>
                          )}
                          {notif.targetPath && (
                            <span className="inline-flex items-center gap-1 text-brand-primary font-semibold hover:underline">
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
                      {isUnread && onMarkRead && (
                        <button
                          type="button"
                          onClick={() => onMarkRead(notif.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold rounded-lg bg-brand-primary text-white hover:bg-brand-secondary transition-colors cursor-pointer"
                          title="Mark as Read"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Mark Read
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDeleteItem(notif.id)}
                        className="p-1.5 rounded-lg border border-brand-border text-brand-muted hover:text-brand-error hover:bg-red-50 transition-colors cursor-pointer"
                        title="Delete Notification"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            <VendorPagination {...pagination} />
          </>
        ) : (
          <VendorEmptyState
            icon={Bell}
            title="No Notifications Match Your Filters"
            description="Try clearing your search query or selecting 'All Categories' to view all operational notifications."
            actionLabel="Reset Filters"
            onAction={handleResetFilters}
          />
        )}
      </div>
    </div>
  );
}


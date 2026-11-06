import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  BellRing,
  CheckCheck,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { useVendor } from '../../../hooks/useVendor';
import { useDebounce } from '../../../hooks/useDebounce';
import { usePagination } from '../../../hooks/usePagination';
import { isDateInRange } from '../../../utils/formatDate';
import { NOTIFICATION_CATEGORIES } from '../../../utils/constants';
import VendorPageHeader from '../VendorPageHeader';
import VendorStatCard from '../VendorStatCard';
import VendorSearch from '../VendorSearch';
import VendorFilters from '../VendorFilters';
import VendorPagination from '../VendorPagination';
import VendorEmptyState from '../VendorEmptyState';
import NotificationItem from './NotificationItem';

export default function Notifications() {
  const navigate = useNavigate();
  const {
    notifications,
    unreadNotificationsCount,
    markNotificationRead,
    markAllNotificationsRead,
    deleteNotification,
  } = useVendor();

  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 200);

  const [filters, setFilters] = useState({
    category: 'All',
    priority: 'All',
    readStatus: 'All',
    datePreset: 'All Time',
  });

  const stats = useMemo(() => {
    const highPriority = notifications.filter(
      (n) => n.priority === 'High' && !n.isRead
    ).length;
    const readCount = notifications.filter((n) => n.isRead).length;
    return {
      total: notifications.length,
      unread: unreadNotificationsCount,
      highPriority,
      readCount,
    };
  }, [notifications, unreadNotificationsCount]);

  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      if (debouncedSearch) {
        const q = debouncedSearch.toLowerCase();
        const match = [n.title, n.description, n.category, n.transactionId]
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
  }, [notifications, debouncedSearch, filters]);

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

  const filterConfig = [
    {
      key: 'category',
      label: 'Notification Category (13 Types)',
      value: filters.category,
      options: [
        { label: 'All 13 Categories', value: 'All' },
        ...NOTIFICATION_CATEGORIES.map((c) => ({ label: c, value: c })),
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

  return (
    <div className="space-y-6">
      <VendorPageHeader
        title="System Notifications & Operational Alerts"
        subtitle="Real-time alerts for raw material purchases, OTP confirmations, low stock thresholds, processing batches, orders, and overdue payments"
        badge={`${unreadNotificationsCount} Unread`}
        actions={
          unreadNotificationsCount > 0 && (
            <button
              type="button"
              onClick={markAllNotificationsRead}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg bg-brand-primary text-white hover:bg-brand-secondary transition-colors cursor-pointer"
            >
              <CheckCheck className="w-4 h-4" />
              Mark All as Read ({unreadNotificationsCount})
            </button>
          )
        }
      />

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <VendorStatCard
          title="Total Notifications"
          value={stats.total}
          subtitle="Across all 13 ERP categories"
          icon={Bell}
        />
        <VendorStatCard
          title="Unread Notifications"
          value={stats.unread}
          subtitle="Awaiting vendor attention"
          icon={BellRing}
          highlight
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
              onChange={setSearchQuery}
              placeholder="Search notifications by title, description, or reference ID..."
            />
          </div>
          <div className="text-xs text-brand-muted">
            Showing <strong>{filteredNotifications.length}</strong> notifications
          </div>
        </div>

        <VendorFilters
          filters={filterConfig}
          onFilterChange={handleFilterChange}
          onReset={handleResetFilters}
        />
      </div>

      {/* Notification List */}
      <div className="bg-brand-surface border border-brand-border rounded-xl p-4 space-y-3 shadow-xs">
        {pagination.paginatedData.length > 0 ? (
          <>
            <div className="space-y-3">
              {pagination.paginatedData.map((notif) => (
                <NotificationItem
                  key={notif.id}
                  notification={notif}
                  onMarkRead={markNotificationRead}
                  onDelete={deleteNotification}
                  onNavigate={(path) => navigate(path)}
                />
              ))}
            </div>
            <VendorPagination {...pagination} />
          </>
        ) : (
          <VendorEmptyState
            icon={Bell}
            title="No Notifications Match Your Filters"
            description="Try clearing your search query or selecting 'All 13 Categories' to view all operational notifications."
            actionLabel="Reset Filters"
            onAction={handleResetFilters}
          />
        )}
      </div>
    </div>
  );
}


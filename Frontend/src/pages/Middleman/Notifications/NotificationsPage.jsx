import React, { useState, useMemo } from 'react';
import { Bell } from 'lucide-react';
import { useMiddleman } from '../../../context/middleman';
import { MiddlemanPageHeader } from '../components/layout/MiddlemanPageHeader';
import { NotificationItem } from '../components/notifications/NotificationItem';
import { NotificationFilters } from '../components/notifications/NotificationFilters';
import { EmptyState } from '../components/common/EmptyState';
import { SectionCard } from '../components/common/SectionCard';

export const NotificationsPage = () => {
  const { notifications, markNotificationAsRead, markAllNotificationsAsRead } = useMiddleman();

  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL', 'UNREAD', 'READ'
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      const matchStatus =
        statusFilter === 'ALL'
          ? true
          : statusFilter === 'UNREAD'
          ? !n.isRead
          : n.isRead;

      const matchCategory =
        categoryFilter === 'ALL' || n.category === categoryFilter;

      return matchStatus && matchCategory;
    });
  }, [notifications, statusFilter, categoryFilter]);

  return (
    <div className="space-y-6">
      <MiddlemanPageHeader
        title="Notification Center"
        subtitle={`Stay informed with ${notifications.length} transactional, inventory, and payment alerts.`}
      />

      <NotificationFilters
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        categoryFilter={categoryFilter}
        onCategoryChange={setCategoryFilter}
        onMarkAllRead={markAllNotificationsAsRead}
        unreadCount={unreadCount}
      />

      <SectionCard bodyClassName="p-4 sm:p-5 space-y-3">
        {filteredNotifications.length === 0 ? (
          <EmptyState
            icon={Bell}
            title="No notifications in this view"
            description="You are caught up with all trading alerts and transactional notices."
          />
        ) : (
          filteredNotifications.map((n) => (
            <NotificationItem
              key={n.id}
              notification={n}
              onMarkRead={markNotificationAsRead}
            />
          ))
        )}
      </SectionCard>
    </div>
  );
};

export default NotificationsPage;

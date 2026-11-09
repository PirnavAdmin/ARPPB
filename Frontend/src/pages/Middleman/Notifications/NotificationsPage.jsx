import React from 'react';
import { useMiddleman } from '../../../context/middleman';
import { NOTIFICATION_CATEGORIES as MIDDLEMAN_NOTIFICATION_CATEGORIES } from '../../../data/mock/middleman/notificationData';
import SharedNotifications from '../../../components/shared/notifications/Notifications';

export const NotificationsPage = () => {
  const {
    notifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
  } = useMiddleman();

  return (
    <SharedNotifications
      portal="middleman"
      title="System Notifications & Operational Alerts"
      subtitle="Real-time alerts for farmer purchases, vendor & customer sales, OTP confirmations, inventory thresholds, and payment settlements"
      notifications={notifications}
      categories={MIDDLEMAN_NOTIFICATION_CATEGORIES}
      onMarkRead={markNotificationAsRead}
      onMarkAllRead={markAllNotificationsAsRead}
    />
  );
};

export default NotificationsPage;

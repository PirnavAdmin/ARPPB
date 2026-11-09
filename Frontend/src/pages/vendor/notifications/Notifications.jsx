import { useVendor } from '../../../hooks/useVendor';
import { NOTIFICATION_CATEGORIES } from '../../../utils/constants';
import SharedNotifications from '../../../components/shared/notifications/Notifications';

export default function Notifications() {
  const {
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
    deleteNotification,
  } = useVendor();

  return (
    <SharedNotifications
      portal="vendor"
      title="System Notifications & Operational Alerts"
      subtitle="Real-time alerts for raw material purchases, OTP confirmations, low stock thresholds, processing batches, orders, and overdue payments"
      notifications={notifications}
      categories={NOTIFICATION_CATEGORIES}
      onMarkRead={markNotificationRead}
      onMarkAllRead={markAllNotificationsRead}
      onDelete={deleteNotification}
    />
  );
}

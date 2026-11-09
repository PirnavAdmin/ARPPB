import { useState, useMemo } from 'react';
import { useFarmer } from '../context/FarmerContext';
import NotificationPanel from '../components/NotificationPanel';

function Notifications() {
  const {
    notifications,
    markAllNotificationsAsRead,
    unreadNotificationsCount,
    searchQuery,
  } = useFarmer();

  const [filterCategory, setFilterCategory] = useState('All'); // 'All' | 'Unread' | 'otp' | 'sales' | 'stock' | 'ledger'

  const filteredNotifications = useMemo(() => {
    return notifications.filter((item) => {
      const matchSearch =
        !searchQuery ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.detail.toLowerCase().includes(searchQuery.toLowerCase());

      const matchCategory =
        filterCategory === 'All'
          ? true
          : filterCategory === 'Unread'
          ? !item.read
          : item.category === filterCategory;

      return matchSearch && matchCategory;
    });
  }, [notifications, searchQuery, filterCategory]);

  return (
    <div>
      <div className="farmer-page-header">
        <div className="farmer-header-titles">
          <h2>Notifications & System Alerts</h2>
          <p>
            Real-time notifications regarding OTP requests, transaction confirmations, stock threshold alerts, and payment timelines
          </p>
        </div>

        <div className="farmer-header-actions">
          {unreadNotificationsCount > 0 && (
            <button
              type="button"
              className="farmer-btn farmer-btn-outline"
              onClick={markAllNotificationsAsRead}
            >
              ✓ Mark All as Read ({unreadNotificationsCount})
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="farmer-tabs">
        {[
          { key: 'All', label: 'All Alerts' },
          { key: 'Unread', label: `Unread (${unreadNotificationsCount})` },
          { key: 'otp', label: 'OTP & Requests' },
          { key: 'sales', label: 'Sales & Orders' },
          { key: 'ledger', label: 'Payments & Ledger' },
          { key: 'stock', label: 'Stock & Yield' },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={`farmer-tab-btn ${filterCategory === tab.key ? 'active' : ''}`}
            onClick={() => setFilterCategory(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <NotificationPanel items={filteredNotifications} showHeader={false} />
    </div>
  );
}

export default Notifications;

/**
 * Customer Notifications API Service
 * Endpoint paths:
 * - GET    /api/v1/customer/notifications
 * - GET    /api/v1/customer/notifications/summary
 * - PATCH  /api/v1/customer/notifications/{id}/read
 * - PATCH  /api/v1/customer/notifications/read-all
 * - DELETE /api/v1/customer/notifications/{id}
 */

import api from '../../API/Config';
import Endpoints from '../../API/Endpoints';
import { parseCustomerApiError } from './customerMarketplaceService';

export async function fetchCustomerNotifications(params = {}) {
  try {
    const query = {
      page: Math.max(1, Number(params.page) || 1),
      pageSize: Math.min(50, Math.max(1, Number(params.pageSize) || 50)),
      ...(params.search ? { search: params.search } : {}),
      ...(params.type && params.type !== 'All' ? { type: params.type } : {}),
      ...(params.priority && params.priority !== 'All' ? { priority: params.priority } : {}),
      ...(params.isRead !== undefined && params.isRead !== 'All'
        ? { isRead: params.isRead === true || params.isRead === 'Read' }
        : {}),
      ...(params.sortBy ? { sortBy: params.sortBy } : {}),
      ...(params.sortOrder ? { sortOrder: params.sortOrder } : {}),
    };

    const response = await api.get(Endpoints.CUSTOMER_NOTIFICATIONS.BASE, { params: query });
    const body = response.data;
    if (body && body.success === false) {
      throw new Error(body.message || 'Failed to fetch notifications.');
    }
    return body?.data || { items: [], totalCount: 0 };
  } catch (err) {
    throw parseCustomerApiError(err, 'Failed to fetch notifications.');
  }
}

export async function fetchCustomerNotificationSummary() {
  try {
    const response = await api.get(Endpoints.CUSTOMER_NOTIFICATIONS.SUMMARY);
    const body = response.data;
    if (body && body.success === false) {
      throw new Error(body.message || 'Failed to fetch notification summary.');
    }
    return body?.data || { totalNotifications: 0, unreadCount: 0, readCount: 0, highPriorityUnreadCount: 0 };
  } catch (err) {
    throw parseCustomerApiError(err, 'Failed to fetch notification summary.');
  }
}

export async function markCustomerNotificationReadApi(id) {
  try {
    const response = await api.patch(Endpoints.CUSTOMER_NOTIFICATIONS.MARK_READ(id));
    const body = response.data;
    if (body && body.success === false) {
      throw new Error(body.message || 'Failed to mark notification as read.');
    }
    return body?.data || body;
  } catch (err) {
    throw parseCustomerApiError(err, 'Failed to mark notification as read.');
  }
}

export async function markAllCustomerNotificationsReadApi() {
  try {
    const response = await api.patch(Endpoints.CUSTOMER_NOTIFICATIONS.READ_ALL);
    const body = response.data;
    if (body && body.success === false) {
      throw new Error(body.message || 'Failed to mark all notifications as read.');
    }
    return body?.data || body;
  } catch (err) {
    throw parseCustomerApiError(err, 'Failed to mark all notifications as read.');
  }
}

export async function deleteCustomerNotificationApi(id) {
  try {
    const response = await api.delete(Endpoints.CUSTOMER_NOTIFICATIONS.DELETE(id));
    const body = response.data;
    if (body && body.success === false) {
      throw new Error(body.message || 'Failed to delete notification.');
    }
    return body?.data || body;
  } catch (err) {
    throw parseCustomerApiError(err, 'Failed to delete notification.');
  }
}


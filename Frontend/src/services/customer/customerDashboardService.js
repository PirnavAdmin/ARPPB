/**
 * Customer Dashboard API Service
 * Endpoint path:
 * - GET /api/v1/customer/dashboard/summary
 */

import api from '../../API/Config';
import Endpoints from '../../API/Endpoints';
import { parseCustomerApiError } from './customerMarketplaceService';

export async function fetchCustomerDashboardSummary() {
  try {
    const response = await api.get(Endpoints.CUSTOMER_DASHBOARD.SUMMARY);
    const body = response.data;
    if (body && body.success === false) {
      throw new Error(body.message || 'Failed to fetch dashboard summary.');
    }
    return body?.data || {
      totalOrders: 0,
      activeOrders: 0,
      completedOrders: 0,
      totalPurchaseValue: 0,
      pendingConfirmations: 0,
      cartItemCount: 0,
      unreadNotifications: 0,
    };
  } catch (err) {
    throw parseCustomerApiError(err, 'Failed to fetch customer dashboard summary.');
  }
}


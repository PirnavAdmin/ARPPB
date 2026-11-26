/**
 * Customer Orders API Service
 * Endpoint paths:
 * - GET /api/v1/customer/orders
 * - GET /api/v1/customer/orders/{id}
 */

import api from '../../API/Config';
import Endpoints from '../../API/Endpoints';
import { parseCustomerApiError } from './customerMarketplaceService';

export async function fetchCustomerOrders(params = {}) {
  try {
    const query = {
      page: Math.max(1, Number(params.page) || 1),
      pageSize: Math.min(50, Math.max(1, Number(params.pageSize) || 50)),
      ...(params.search ? { search: params.search } : {}),
      ...(params.status && params.status !== 'All' && params.status !== 'All Orders'
        ? { status: params.status }
        : {}),
      ...(params.category && params.category !== 'All' ? { category: params.category } : {}),
      ...(params.datePreset && params.datePreset !== 'all' ? { datePreset: params.datePreset } : {}),
      ...(params.fromDate ? { fromDate: params.fromDate } : {}),
      ...(params.toDate ? { toDate: params.toDate } : {}),
      ...(params.sortBy ? { sortBy: params.sortBy } : {}),
      ...(params.sortOrder ? { sortOrder: params.sortOrder } : {}),
    };

    const response = await api.get(Endpoints.CUSTOMER_ORDERS.BASE, { params: query });
    const body = response.data;
    if (body && body.success === false) {
      throw new Error(body.message || 'Failed to fetch customer orders.');
    }
    return body?.data || { items: [], totalCount: 0 };
  } catch (err) {
    throw parseCustomerApiError(err, 'Failed to fetch customer orders.');
  }
}

export async function fetchCustomerOrderById(id) {
  try {
    const response = await api.get(Endpoints.CUSTOMER_ORDERS.BY_ID(id));
    const body = response.data;
    if (body && body.success === false) {
      throw new Error(body.message || 'Failed to fetch order details.');
    }
    return body?.data || null;
  } catch (err) {
    throw parseCustomerApiError(err, 'Failed to fetch order details.');
  }
}


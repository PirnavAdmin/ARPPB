/**
 * Customer Purchase History API Service
 * Endpoint paths:
 * - GET /api/v1/customer/purchases
 * - GET /api/v1/customer/purchases/summary
 * - GET /api/v1/customer/purchases/{id}
 */

import api from '../../API/Config';
import Endpoints from '../../API/Endpoints';
import { parseCustomerApiError } from './customerMarketplaceService';

export async function fetchCustomerPurchases(params = {}) {
  try {
    const query = {
      page: Math.max(1, Number(params.page) || 1),
      pageSize: Math.min(50, Math.max(1, Number(params.pageSize) || 50)),
      ...(params.search ? { search: params.search } : {}),
      ...(params.category && params.category !== 'All' ? { category: params.category } : {}),
      ...(params.status && params.status !== 'All' ? { status: params.status } : {}),
      ...(params.datePreset && params.datePreset !== 'all' ? { datePreset: params.datePreset } : {}),
      ...(params.fromDate ? { fromDate: params.fromDate } : {}),
      ...(params.toDate ? { toDate: params.toDate } : {}),
      ...(params.sortBy ? { sortBy: params.sortBy } : {}),
      ...(params.sortOrder ? { sortOrder: params.sortOrder } : {}),
    };

    const response = await api.get(Endpoints.CUSTOMER_PURCHASES.BASE, { params: query });
    const body = response.data;
    if (body && body.success === false) {
      throw new Error(body.message || 'Failed to fetch purchase history.');
    }
    return body?.data || { items: [], totalCount: 0 };
  } catch (err) {
    throw parseCustomerApiError(err, 'Failed to fetch purchase history.');
  }
}

export async function fetchCustomerPurchaseSummary() {
  try {
    const response = await api.get(Endpoints.CUSTOMER_PURCHASES.SUMMARY);
    const body = response.data;
    if (body && body.success === false) {
      throw new Error(body.message || 'Failed to fetch purchase summary.');
    }
    return body?.data || { confirmedPurchases: 0, completedOrders: 0, inFulfilment: 0, totalPurchaseSpend: 0 };
  } catch (err) {
    throw parseCustomerApiError(err, 'Failed to fetch purchase summary.');
  }
}

export async function fetchCustomerPurchaseById(id) {
  try {
    const response = await api.get(Endpoints.CUSTOMER_PURCHASES.BY_ID(id));
    const body = response.data;
    if (body && body.success === false) {
      throw new Error(body.message || 'Failed to fetch purchase detail.');
    }
    return body?.data || null;
  } catch (err) {
    throw parseCustomerApiError(err, 'Failed to fetch purchase detail.');
  }
}


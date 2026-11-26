import api from '../API/Config';
import Endpoints from '../API/Endpoints';

function normalizeApiError(error, fallback = 'Customer API request failed.') {
  const body = error?.response?.data;
  const errors = body?.errors;
  const detail = Array.isArray(errors)
    ? errors.filter(Boolean).join(' ')
    : errors && typeof errors === 'object'
      ? Object.values(errors).flat().filter(Boolean).join(' ')
      : '';
  const message = detail || body?.message || body?.title || error?.message || fallback;
  const normalized = new Error(message);
  normalized.status = error?.response?.status || null;
  normalized.data = body || null;
  return normalized;
}

async function request(method, url, options = {}) {
  try {
    const response = await api.request({
      method,
      url,
      params: options.params,
      data: options.data,
      signal: options.signal,
    });
    const body = response.data;
    if (body && typeof body === 'object' && body.success === false) {
      throw Object.assign(new Error(body.message || 'The customer request was not successful.'), {
        response: { status: response.status, data: body },
      });
    }
    return {
      data: body && typeof body === 'object' && 'data' in body ? body.data : body,
      message: body?.message,
      devOtp: body?.devOtp,
    };
  } catch (error) {
    throw normalizeApiError(error);
  }
}

async function fetchAllPages(url, params = {}) {
  const first = await request('get', url, { params: { ...params, Page: 1 } });
  const page = first.data;
  if (!page || !Array.isArray(page.items)) return Array.isArray(page) ? page : [];
  const rows = [...page.items];
  const pageSize = page.pageSize;
  for (let current = 2; current <= Number(page.totalPages || 1); current += 1) {
    const next = await request('get', url, {
      params: { ...params, Page: current, ...(pageSize ? { PageSize: pageSize } : {}) },
    });
    if (Array.isArray(next.data?.items)) rows.push(...next.data.items);
  }
  return rows;
}

export const customerApi = {
  dashboardSummary: async () => (await request('get', Endpoints.CUSTOMER.DASHBOARD_SUMMARY)).data,
  categories: async () => (await request('get', Endpoints.CUSTOMER.MARKETPLACE_CATEGORIES)).data,
  products: (params) => request('get', Endpoints.CUSTOMER.MARKETPLACE_PRODUCTS, { params }),
  allProducts: (params) => fetchAllPages(Endpoints.CUSTOMER.MARKETPLACE_PRODUCTS, params),
  product: async (id) => (await request('get', Endpoints.CUSTOMER.MARKETPLACE_PRODUCT_BY_ID(id))).data,
  cart: async () => (await request('get', Endpoints.CUSTOMER.CART)).data,
  addCartItem: async (payload) => (await request('post', Endpoints.CUSTOMER.CART_ITEMS, { data: payload })).data,
  updateCartItem: async (id, payload) =>
    (await request('put', Endpoints.CUSTOMER.CART_ITEM_BY_ID(id), { data: payload })).data,
  removeCartItem: async (id) =>
    (await request('delete', Endpoints.CUSTOMER.CART_ITEM_BY_ID(id))).data,
  clearCart: async () => (await request('delete', Endpoints.CUSTOMER.CART)).data,
  checkout: async (payload) => (await request('post', Endpoints.CUSTOMER.CHECKOUT, { data: payload })).data,
  orders: (params) => request('get', Endpoints.CUSTOMER.ORDERS, { params }),
  allOrders: (params) => fetchAllPages(Endpoints.CUSTOMER.ORDERS, params),
  order: async (id) => (await request('get', Endpoints.CUSTOMER.ORDER_BY_ID(id))).data,
  purchases: (params) => request('get', Endpoints.CUSTOMER.PURCHASES, { params }),
  allPurchases: (params) => fetchAllPages(Endpoints.CUSTOMER.PURCHASES, params),
  purchaseSummary: async () => (await request('get', Endpoints.CUSTOMER.PURCHASE_SUMMARY)).data,
  purchase: async (id) => (await request('get', Endpoints.CUSTOMER.PURCHASE_BY_ID(id))).data,
  confirmations: (params) => request('get', Endpoints.CUSTOMER.CONFIRMATIONS, { params }),
  allConfirmations: (params) => fetchAllPages(Endpoints.CUSTOMER.CONFIRMATIONS, params),
  confirmation: async (id) => (await request('get', Endpoints.CUSTOMER.CONFIRMATION_BY_ID(id))).data,
  verifyConfirmation: async (id, otpCode) => request('post', Endpoints.CUSTOMER.VERIFY_CONFIRMATION(id), { data: { otpCode } }),
  resendConfirmation: async (id) => request('post', Endpoints.CUSTOMER.RESEND_CONFIRMATION(id)),
  rejectConfirmation: async (id, rejectionReason) =>
    request('post', Endpoints.CUSTOMER.REJECT_CONFIRMATION(id), { data: { rejectionReason } }),
  notifications: (params) => request('get', Endpoints.CUSTOMER.NOTIFICATIONS, { params }),
  allNotifications: (params) => fetchAllPages(Endpoints.CUSTOMER.NOTIFICATIONS, params),
  notificationSummary: async () => (await request('get', Endpoints.CUSTOMER.NOTIFICATION_SUMMARY)).data,
  markNotificationRead: async (id) =>
    (await request('patch', Endpoints.CUSTOMER.MARK_NOTIFICATION_READ(id))).data,
  markAllNotificationsRead: async () =>
    (await request('patch', Endpoints.CUSTOMER.MARK_ALL_NOTIFICATIONS_READ)).data,
  deleteNotification: async (id) =>
    (await request('delete', Endpoints.CUSTOMER.NOTIFICATION_BY_ID(id))).data,
};

export { normalizeApiError };
export default customerApi;

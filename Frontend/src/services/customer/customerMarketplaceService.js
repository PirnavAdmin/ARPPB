/**
 * Customer Marketplace API Service
 * Endpoint paths:
 * - GET /api/v1/customer/marketplace/categories
 * - GET /api/v1/customer/marketplace/products
 * - GET /api/v1/customer/marketplace/products/{id}
 */

import api from '../../API/Config';
import Endpoints from '../../API/Endpoints';

export function parseCustomerApiError(error, fallback = 'Marketplace request failed.') {
  const resp = error?.response;
  const data = resp?.data || error?.data;
  let msg = fallback;

  if (data && typeof data === 'object') {
    if (Array.isArray(data.errors) && data.errors.length > 0) {
      msg = String(data.errors[0] || data.message || fallback);
    } else if (data.errors && typeof data.errors === 'object') {
      const firstKey = Object.keys(data.errors)[0];
      const val = data.errors[firstKey];
      const firstMsg = Array.isArray(val) ? val[0] : val;
      if (firstMsg) msg = String(firstMsg);
    } else if (data.message || data.title) {
      msg = String(data.message || data.title);
    }
  } else if (typeof data === 'string' && data.trim() && !data.trim().startsWith('<')) {
    msg = data.trim();
  } else if (error?.message) {
    msg = error.message;
  }

  const err = new Error(msg);
  err.status = resp?.status || error?.status;
  err.data = data;
  return err;
}

export async function fetchMarketplaceCategories() {
  try {
    const response = await api.get(Endpoints.CUSTOMER_MARKETPLACE.CATEGORIES);
    const body = response.data;
    if (body && body.success === false) {
      throw new Error(body.message || 'Failed to fetch categories.');
    }
    return body?.data || [];
  } catch (err) {
    throw parseCustomerApiError(err, 'Failed to fetch marketplace categories.');
  }
}

export async function fetchMarketplaceProducts(params = {}) {
  try {
    const query = {
      page: Math.max(1, Number(params.page) || 1),
      pageSize: Math.min(50, Math.max(1, Number(params.pageSize) || 50)),
      ...(params.category && params.category !== 'All' ? { category: params.category } : {}),
      ...(params.search ? { search: params.search } : {}),
      ...(params.location && params.location !== 'All' ? { location: params.location } : {}),
      ...(params.minPrice !== undefined && params.minPrice !== '' ? { minPrice: params.minPrice } : {}),
      ...(params.maxPrice !== undefined && params.maxPrice !== '' ? { maxPrice: params.maxPrice } : {}),
      ...(params.stockStatus && params.stockStatus !== 'All' ? { stockStatus: params.stockStatus } : {}),
      ...(params.sortBy ? { sortBy: params.sortBy } : {}),
    };

    const response = await api.get(Endpoints.CUSTOMER_MARKETPLACE.PRODUCTS, { params: query });
    const body = response.data;
    if (body && body.success === false) {
      throw new Error(body.message || 'Failed to fetch products.');
    }
    return body?.data || { items: [], totalCount: 0 };
  } catch (err) {
    throw parseCustomerApiError(err, 'Failed to fetch marketplace products.');
  }
}

export async function fetchMarketplaceProductById(id) {
  try {
    const response = await api.get(Endpoints.CUSTOMER_MARKETPLACE.PRODUCT_BY_ID(id));
    const body = response.data;
    if (body && body.success === false) {
      throw new Error(body.message || 'Failed to fetch product details.');
    }
    return body?.data || null;
  } catch (err) {
    throw parseCustomerApiError(err, 'Failed to fetch product details.');
  }
}


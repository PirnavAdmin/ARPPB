/**
 * Customer Cart & Checkout API Service
 * Endpoint paths:
 * - GET    /api/v1/customer/cart
 * - POST   /api/v1/customer/cart/items
 * - PUT    /api/v1/customer/cart/items/{id}
 * - DELETE /api/v1/customer/cart/items/{id}
 * - DELETE /api/v1/customer/cart
 * - POST   /api/v1/customer/cart/checkout
 */

import api from '../../API/Config';
import Endpoints from '../../API/Endpoints';
import { parseCustomerApiError } from './customerMarketplaceService';

export async function fetchCustomerCart() {
  try {
    const response = await api.get(Endpoints.CUSTOMER_CART.BASE);
    const body = response.data;
    if (body && body.success === false) {
      throw new Error(body.message || 'Failed to fetch cart.');
    }
    return body?.data || { items: [], totalItems: 0, itemsSubtotal: 0, cartTotal: 0 };
  } catch (err) {
    throw parseCustomerApiError(err, 'Failed to fetch shopping cart.');
  }
}

export async function addToCustomerCartApi(productId, quantity = 1) {
  try {
    const payload = {
      productId: Number(productId),
      quantity: Number(quantity) || 1,
    };
    const response = await api.post(Endpoints.CUSTOMER_CART.ITEMS, payload);
    const body = response.data;
    if (body && body.success === false) {
      throw new Error(body.message || 'Failed to add item to cart.');
    }
    return body?.data || null;
  } catch (err) {
    throw parseCustomerApiError(err, 'Failed to add product to cart.');
  }
}

export async function updateCustomerCartItemApi(cartItemId, quantity) {
  try {
    const payload = {
      quantity: Math.max(0.01, Number(quantity) || 1),
    };
    const response = await api.put(Endpoints.CUSTOMER_CART.ITEM_BY_ID(cartItemId), payload);
    const body = response.data;
    if (body && body.success === false) {
      throw new Error(body.message || 'Failed to update cart item.');
    }
    return body?.data || null;
  } catch (err) {
    throw parseCustomerApiError(err, 'Failed to update cart item quantity.');
  }
}

export async function removeCustomerCartItemApi(cartItemId) {
  try {
    const response = await api.delete(Endpoints.CUSTOMER_CART.ITEM_BY_ID(cartItemId));
    const body = response.data;
    if (body && body.success === false) {
      throw new Error(body.message || 'Failed to remove item from cart.');
    }
    return body?.data || null;
  } catch (err) {
    throw parseCustomerApiError(err, 'Failed to remove item from cart.');
  }
}

export async function clearCustomerCartApi() {
  try {
    const response = await api.delete(Endpoints.CUSTOMER_CART.BASE);
    const body = response.data;
    if (body && body.success === false) {
      throw new Error(body.message || 'Failed to clear cart.');
    }
    return body?.data || null;
  } catch (err) {
    throw parseCustomerApiError(err, 'Failed to clear shopping cart.');
  }
}

export async function checkoutCustomerCartApi({
  deliveryAddressId = null,
  deliveryAddress = '',
  paymentTerms = 'Credit - 3 Working Days',
  idempotencyKey = null,
} = {}) {
  try {
    const payload = {
      deliveryAddressId: deliveryAddressId ? Number(deliveryAddressId) : null,
      deliveryAddress: deliveryAddress ? String(deliveryAddress).trim() : null,
      paymentTerms: String(paymentTerms || 'Credit - 3 Working Days'),
      idempotencyKey: idempotencyKey || `IDEM-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    };
    const response = await api.post(Endpoints.CUSTOMER_CART.CHECKOUT, payload);
    const body = response.data;
    if (body && body.success === false) {
      throw new Error(body.message || 'Checkout failed.');
    }
    return body?.data || null;
  } catch (err) {
    throw parseCustomerApiError(err, 'Failed to submit order checkout.');
  }
}


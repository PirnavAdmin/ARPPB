/**
 * Customer OTP Confirmations API Service
 * Endpoint paths:
 * - GET  /api/v1/customer/confirmations
 * - GET  /api/v1/customer/confirmations/{id}
 * - POST /api/v1/customer/confirmations/{id}/verify
 * - POST /api/v1/customer/confirmations/{id}/resend
 * - POST /api/v1/customer/confirmations/{id}/reject
 */

import api from '../../API/Config';
import Endpoints from '../../API/Endpoints';
import { parseCustomerApiError } from './customerMarketplaceService';

export async function fetchCustomerConfirmations(params = {}) {
  try {
    const query = {
      page: Math.max(1, Number(params.page) || 1),
      pageSize: Math.min(50, Math.max(1, Number(params.pageSize) || 50)),
      ...(params.search ? { search: params.search } : {}),
      ...(params.status && params.status !== 'All' ? { status: params.status } : {}),
      ...(params.datePreset && params.datePreset !== 'all' ? { datePreset: params.datePreset } : {}),
      ...(params.fromDate ? { fromDate: params.fromDate } : {}),
      ...(params.toDate ? { toDate: params.toDate } : {}),
      ...(params.sortBy ? { sortBy: params.sortBy } : {}),
      ...(params.sortOrder ? { sortOrder: params.sortOrder } : {}),
    };

    const response = await api.get(Endpoints.CUSTOMER_CONFIRMATIONS.BASE, { params: query });
    const body = response.data;
    if (body && body.success === false) {
      throw new Error(body.message || 'Failed to fetch confirmations.');
    }
    return body?.data || { items: [], totalCount: 0 };
  } catch (err) {
    throw parseCustomerApiError(err, 'Failed to fetch OTP confirmations.');
  }
}

export async function fetchCustomerConfirmationById(id) {
  try {
    const response = await api.get(Endpoints.CUSTOMER_CONFIRMATIONS.BY_ID(id));
    const body = response.data;
    if (body && body.success === false) {
      throw new Error(body.message || 'Failed to fetch confirmation details.');
    }
    return body?.data || null;
  } catch (err) {
    throw parseCustomerApiError(err, 'Failed to fetch confirmation details.');
  }
}

export async function verifyCustomerOtpApi(id, otpCode) {
  try {
    const payload = {
      otpCode: String(otpCode || '').trim(),
    };
    const response = await api.post(Endpoints.CUSTOMER_CONFIRMATIONS.VERIFY(id), payload);
    const body = response.data;
    if (body && body.success === false) {
      throw new Error(body.message || 'OTP verification failed.');
    }
    return body?.data || body;
  } catch (err) {
    throw parseCustomerApiError(err, 'Invalid or expired OTP code.');
  }
}

export async function resendCustomerOtpApi(id) {
  try {
    const response = await api.post(Endpoints.CUSTOMER_CONFIRMATIONS.RESEND(id));
    const body = response.data;
    if (body && body.success === false) {
      throw new Error(body.message || 'Failed to resend OTP.');
    }
    const devOtp = body?.devOtp || body?.data?.devOtp || body?.data?.demoOtpCode || null;
    if (body?.data && typeof body.data === 'object') {
      return {
        ...body.data,
        devOtp,
        demoOtpCode: devOtp || body.data.demoOtpCode,
        message: body.message || 'Fresh OTP issued successfully.',
      };
    }
    return {
      ...(body || {}),
      devOtp,
      demoOtpCode: devOtp,
      message: body?.message || 'Fresh OTP issued successfully.',
    };
  } catch (err) {
    throw parseCustomerApiError(err, 'Failed to resend OTP.');
  }
}

export async function rejectCustomerOtpApi(id, reason = 'Declined by customer') {
  try {
    const payload = {
      rejectionReason: String(reason || 'Declined by customer').trim(),
    };
    const response = await api.post(Endpoints.CUSTOMER_CONFIRMATIONS.REJECT(id), payload);
    const body = response.data;
    if (body && body.success === false) {
      throw new Error(body.message || 'Failed to reject confirmation.');
    }
    return body?.data || body;
  } catch (err) {
    throw parseCustomerApiError(err, 'Failed to reject confirmation.');
  }
}


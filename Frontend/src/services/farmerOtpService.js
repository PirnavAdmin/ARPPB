/**
 * AgriConnect Farmer Portal - OTP Confirmations API Service
 * Integrates directly with FarmerOtpConfirmations endpoints:
 *
 * - GET  /api/v1/farmer/otp-confirmations/summary
 * - GET  /api/v1/farmer/otp-confirmations/channels
 * - GET  /api/v1/farmer/otp-confirmations
 * - GET  /api/v1/farmer/otp-confirmations/{id}
 * - POST /api/v1/farmer/otp-confirmations/{id}/verify (or /verify-otp)
 * - POST /api/v1/farmer/otp-confirmations/{id}/resend (or /resend-otp)
 * - POST /api/v1/farmer/otp-confirmations/{id}/reject (or /decline)
 */

import api from '../API/Config';
import Endpoints from '../API/Endpoints';

/**
 * Normalizes error responses from ASP.NET Core / ApiResponse / ValidationProblemDetails
 */
export function parseOtpApiError(error, fallbackMessage = 'OTP confirmation request failed.') {
  const response = error?.response;
  const status = response?.status || error?.status;
  const data = response?.data || error?.data;

  let message = fallbackMessage;
  const rawErrors = [];

  if (data && typeof data === 'object') {
    if (Array.isArray(data.errors) && data.errors.length > 0) {
      rawErrors.push(...data.errors.map((e) => String(e || '')));
      message = String(data.errors[0] || data.message || fallbackMessage);
    } else if (data.errors && typeof data.errors === 'object') {
      const firstKey = Object.keys(data.errors)[0];
      const val = data.errors[firstKey];
      const firstMsg = Array.isArray(val) ? val[0] : val;
      if (firstMsg) {
        rawErrors.push(String(firstMsg));
        message = String(firstMsg);
      }
    } else if (data.message || data.title || data.error) {
      message = String(data.message || data.title || data.error);
    }
  } else if (typeof data === 'string' && data.trim() && !data.trim().startsWith('<')) {
    message = data.trim();
  } else if (!response && error?.request) {
    message = 'Unable to connect to the OTP Authorization server. Please check your network connection.';
  } else if (error?.message) {
    message = error.message;
  }

  const normalized = new Error(message);
  normalized.status = status;
  normalized.data = data;
  normalized.rawErrors = rawErrors;
  return normalized;
}

/**
 * Maps backend OTP Confirmation DTO to frontend OTP record format
 */
export function mapOtpDtoToRequest(dto = {}, existing = {}) {
  if (!dto || typeof dto !== 'object') return existing;

  const id = dto.id ?? dto.otpId ?? dto.confirmationId ?? existing.id ?? null;
  const otpId = id ? (String(id).startsWith('OTP') ? String(id) : `OTP-${String(id).padStart(4, '0')}`) : existing.id;
  const transactionId =
    dto.transactionId ||
    dto.saleId ||
    dto.saleCode ||
    existing.transactionId ||
    (id ? `TXN-2026-${String(id).slice(-3)}` : '');

  const buyerName = dto.buyerName || dto.customerName || dto.partnerName || existing.buyerName || '';
  const buyerCategory = dto.buyerCategory || dto.partnerType || dto.channel || existing.buyerCategory || 'Middleman';
  const buyerMobile = dto.buyerMobile || dto.buyerPhone || dto.phone || existing.buyerMobile || '';
  const crop = dto.cropName || dto.crop || existing.crop || '';
  const cropId = dto.cropId ?? existing.cropId ?? null;
  const quantity = Number(dto.quantity ?? existing.quantity ?? 0);
  const unit = dto.unit || existing.unit || 'Quintals';
  const rate = Number(dto.rate ?? dto.pricePerUnit ?? existing.rate ?? 0);
  const totalAmount = Number(dto.totalAmount ?? (quantity * rate) ?? existing.totalAmount ?? 0);

  const rawStatus = String(dto.status || dto.otpStatus || existing.otpStatus || 'Pending');
  const lowerStatus = rawStatus.toLowerCase();
  const normalizedStatus =
    lowerStatus.includes('confirm') || lowerStatus.includes('verif')
      ? 'Confirmed'
      : lowerStatus.includes('reject') || lowerStatus.includes('declin')
      ? 'Rejected'
      : lowerStatus.includes('expire')
      ? 'Expired'
      : 'Pending';

  const requestDate =
    dto.requestDate ||
    dto.createdAt ||
    existing.requestDate ||
    `${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} Today`;

  const expiresInMinutes = Number(dto.expiresInMinutes || existing.expiresInMinutes || 10);
  const expiresAt = dto.expiresAt ? new Date(dto.expiresAt).getTime() : existing.expiresAt || (Date.now() + expiresInMinutes * 60 * 1000);

  return {
    ...existing,
    id: otpId,
    backendId: id,
    otpId,
    transactionId,
    buyerName,
    buyerCategory,
    buyerMobile,
    crop,
    cropId,
    quantity,
    unit,
    rate,
    totalAmount,
    requestDate,
    otpStatus: normalizedStatus,
    status: normalizedStatus,
    otpCode: dto.otpCode || dto.devOtp || existing.otpCode || null,
    expiresAt,
    expiresInMinutes,
    attemptsLeft: Number(dto.attemptsLeft ?? existing.attemptsLeft ?? 3),
    direction: dto.direction || existing.direction || 'buyer_initiated',
    channel: buyerCategory,
    reason: dto.reason || dto.rejectReason || existing.reason || null,
  };
}

/* ==========================================================================
   OTP CONFIRMATIONS API METHODS
   ========================================================================== */

/**
 * GET /api/v1/farmer/otp-confirmations/summary
 */
export async function fetchOtpConfirmationsSummaryApi(userId) {
  const params = userId ? { userId } : {};

  try {
    const res = await api.get(Endpoints.FARMER_OTP_CONFIRMATIONS.SUMMARY, { params });
    const body = res?.data;
    return body?.data || body;
  } catch (err) {
    if (err?.response?.status !== 404) {
      console.warn('fetchOtpConfirmationsSummaryApi failed:', err?.message);
    }
    return null;
  }
}

/**
 * GET /api/v1/farmer/otp-confirmations/channels
 */
export async function fetchOtpChannelsApi(userId) {
  const params = userId ? { userId } : {};

  try {
    const res = await api.get(Endpoints.FARMER_OTP_CONFIRMATIONS.CHANNELS, { params });
    const body = res?.data;
    const data = body?.data || body;
    return Array.isArray(data) ? data : ['Middleman', 'Vendor', 'Customer'];
  } catch (err) {
    return ['Middleman', 'Vendor', 'Customer'];
  }
}

/**
 * GET /api/v1/farmer/otp-confirmations
 */
export async function fetchOtpConfirmationsApi({ status, buyerCategory, search, userId } = {}) {
  const params = {};
  if (status && status !== 'All') params.status = status;
  if (buyerCategory && buyerCategory !== 'All') params.buyerCategory = buyerCategory;
  if (search && String(search).trim()) params.search = String(search).trim();
  if (userId) params.userId = userId;

  try {
    const res = await api.get(Endpoints.FARMER_OTP_CONFIRMATIONS.BASE, { params });
    const body = res?.data;
    const list = Array.isArray(body?.data?.items)
      ? body.data.items
      : Array.isArray(body?.data)
      ? body.data
      : Array.isArray(body)
      ? body
      : [];
    return list.map((item) => mapOtpDtoToRequest(item));
  } catch (err) {
    throw parseOtpApiError(err, 'Failed to fetch OTP confirmations list.');
  }
}

/**
 * GET /api/v1/farmer/otp-confirmations/{id}
 */
export async function fetchOtpConfirmationByIdApi(id, userId) {
  if (!id) throw new Error('Confirmation ID is required.');
  const params = userId ? { userId } : {};

  try {
    const res = await api.get(Endpoints.FARMER_OTP_CONFIRMATIONS.BY_ID(id), { params });
    const body = res?.data;
    return mapOtpDtoToRequest(body?.data || body);
  } catch (err) {
    throw parseOtpApiError(err, `Failed to fetch OTP confirmation #${id}.`);
  }
}

/**
 * POST /api/v1/farmer/otp-confirmations/{id}/verify (fallback: /verify-otp)
 */
export async function verifyOtpConfirmationApi(id, otpCode, userId) {
  if (!id) throw new Error('Confirmation ID is required.');
  const cleanOtp = String(otpCode || '').trim();
  if (!cleanOtp) throw new Error('Verification OTP code is required.');

  const payload = { otp: cleanOtp, otpCode: cleanOtp };
  const params = userId ? { userId } : {};

  try {
    const res = await api.post(Endpoints.FARMER_OTP_CONFIRMATIONS.VERIFY(id), payload, { params });
    const body = res?.data;
    return {
      success: true,
      data: mapOtpDtoToRequest(body?.data || body),
      message: body?.message || 'OTP confirmed successfully.',
      raw: body,
    };
  } catch (err1) {
    if (err1?.response?.status === 404) {
      try {
        const res2 = await api.post(Endpoints.FARMER_OTP_CONFIRMATIONS.VERIFY_ALT(id), payload, { params });
        const body2 = res2?.data;
        return {
          success: true,
          data: mapOtpDtoToRequest(body2?.data || body2),
          message: body2?.message || 'OTP confirmed successfully.',
          raw: body2,
        };
      } catch {
        // Fall back
      }
    }
    throw parseOtpApiError(err1, 'Invalid or expired OTP. Please check and try again.');
  }
}

/**
 * POST /api/v1/farmer/otp-confirmations/{id}/resend (fallback: /resend-otp)
 */
export async function resendOtpConfirmationApi(id, userId) {
  if (!id) throw new Error('Confirmation ID is required.');
  const params = userId ? { userId } : {};

  try {
    const res = await api.post(Endpoints.FARMER_OTP_CONFIRMATIONS.RESEND(id), {}, { params });
    const body = res?.data;
    const data = body?.data || body;
    return {
      success: true,
      devOtp: data?.devOtp || data?.otpCode || null,
      message: body?.message || 'A fresh OTP code was sent.',
      raw: body,
    };
  } catch (err1) {
    if (err1?.response?.status === 404) {
      try {
        const res2 = await api.post(Endpoints.FARMER_OTP_CONFIRMATIONS.RESEND_ALT(id), {}, { params });
        const body2 = res2?.data;
        const data2 = body2?.data || body2;
        return {
          success: true,
          devOtp: data2?.devOtp || data2?.otpCode || null,
          message: body2?.message || 'A fresh OTP code was sent.',
          raw: body2,
        };
      } catch {
        // Fall back
      }
    }
    throw parseOtpApiError(err1, 'Failed to resend confirmation OTP.');
  }
}

/**
 * POST /api/v1/farmer/otp-confirmations/{id}/reject (fallback: /decline)
 */
export async function rejectOtpConfirmationApi(id, reason, userId) {
  if (!id) throw new Error('Confirmation ID is required.');
  const payload = { reason: reason || 'Transaction declined by farmer.' };
  const params = userId ? { userId } : {};

  try {
    const res = await api.post(Endpoints.FARMER_OTP_CONFIRMATIONS.REJECT(id), payload, { params });
    const body = res?.data;
    return {
      success: true,
      message: body?.message || 'Transaction rejected successfully.',
      raw: body,
    };
  } catch (err1) {
    if (err1?.response?.status === 404) {
      try {
        const res2 = await api.post(Endpoints.FARMER_OTP_CONFIRMATIONS.REJECT_ALT(id), payload, { params });
        const body2 = res2?.data;
        return {
          success: true,
          message: body2?.message || 'Transaction rejected successfully.',
          raw: body2,
        };
      } catch {
        // Fall back
      }
    }
    throw parseOtpApiError(err1, 'Failed to reject transaction.');
  }
}

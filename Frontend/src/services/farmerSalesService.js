/**
 * AgriConnect Farmer Portal - Sales API Service
 * Integrates directly with Farmer Sales endpoints:
 * - GET  /api/v1/farmer/sales/options (Fetch dropdown/form options)
 * - POST /api/v1/farmer/sales (Create sale, returns sale `id` and triggers OTP)
 * - POST /api/v1/farmer/sales/{id}/verify-otp (Verify OTP for sale `{id}`)
 * - POST /api/v1/farmer/sales/{id}/resend-otp (Resend OTP for sale `{id}`)
 * - GET  /api/v1/farmer/sales (Fetch all farmer sales list)
 * - GET  /api/v1/farmer/sales/{id} (Fetch single sale details)
 */

import api from '../API/Config';
import Endpoints from '../API/Endpoints';

/**
 * Normalizes error responses from ASP.NET Core / ApiResponse / ValidationProblemDetails
 */
export function parseSalesApiError(error, fallbackMessage = 'Sales request failed.') {
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
    message = 'Unable to connect to the Sales server. Please check your network connection.';
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
 * Default fallback options in case options API is unreachable
 */
export const DEFAULT_SALES_OPTIONS = {
  buyerCategories: [
    { code: 'Middleman', label: 'Middleman / Trader' },
    { code: 'Vendor', label: 'Processing Vendor / Factory' },
    { code: 'Customer', label: 'Direct Consumer / Retail Buyer' },
  ],
  qualityGrades: [
    { code: 'Grade A', label: 'Grade A (Premium Export Quality)' },
    { code: 'Grade B', label: 'Grade B (Standard Commercial)' },
    { code: 'Grade C', label: 'Grade C (Processing Grade)' },
  ],
  units: [
    { code: 'Quintals', label: 'Quintals (qtl)' },
    { code: 'Kilograms', label: 'Kilograms (kg)' },
    { code: 'Bags', label: 'Bags (50kg)' },
    { code: 'Tonnes', label: 'Tonnes' },
  ],
  paymentMethods: [
    { code: 'Bank Transfer', label: 'Bank Transfer (NEFT/RTGS)' },
    { code: 'UPI', label: 'Instant UPI Payment' },
    { code: 'Cash', label: 'Cash on Pickup' },
  ],
};

/**
 * Maps backend Sale DTO to Frontend Sales record
 */
export function mapSaleDtoToSale(dto = {}, existing = {}) {
  if (!dto || typeof dto !== 'object') return existing;

  const id = dto.id ?? dto.saleId ?? existing.id ?? null;
  const transactionId =
    dto.transactionId ||
    dto.saleCode ||
    (id ? (String(id).startsWith('TXN') ? String(id) : `TXN-2026-${String(id).padStart(3, '0')}`) : existing.transactionId || existing.id);

  const cropId = dto.cropId ?? existing.cropId ?? null;
  const cropName = dto.cropName || dto.crop || existing.cropName || existing.crop || '';
  const buyerName = dto.buyerName || dto.customerName || existing.buyerName || '';
  const buyerCategory = dto.buyerCategory || dto.buyerType || existing.buyerCategory || 'Middleman';
  const buyerMobile = dto.buyerMobile || dto.buyerPhone || dto.phone || existing.buyerMobile || '';
  const quantity = Number(dto.quantity ?? dto.sellingQuantity ?? existing.quantity ?? 0);
  const unit = dto.unit || existing.unit || 'Quintals';
  const rate = Number(dto.rate ?? dto.pricePerUnit ?? existing.rate ?? 0);
  const totalAmount = Number(dto.totalAmount ?? (quantity * rate) ?? existing.totalAmount ?? 0);

  const rawStatus = String(dto.transactionStatus || dto.status || existing.transactionStatus || 'Pending Confirmation');
  const lowerStatus = rawStatus.toLowerCase();
  const normalizedStatus =
    lowerStatus.includes('confirm') || lowerStatus === 'completed'
      ? 'Confirmed'
      : lowerStatus.includes('reject') || lowerStatus === 'cancelled'
      ? 'Rejected'
      : 'Pending Confirmation';

  const rawOtpStatus = String(dto.otpStatus || (normalizedStatus === 'Confirmed' ? 'Verified' : 'Pending'));
  const lowerOtp = rawOtpStatus.toLowerCase();
  const normalizedOtpStatus =
    lowerOtp.includes('verif') || lowerOtp.includes('confirm')
      ? 'Verified'
      : lowerOtp.includes('reject')
      ? 'Rejected'
      : lowerOtp.includes('expire')
      ? 'Expired'
      : 'Pending';

  let date = existing.date || new Date().toISOString().split('T')[0];
  if (dto.date || dto.createdAt || dto.saleDate) {
    date = String(dto.date || dto.createdAt || dto.saleDate).split('T')[0];
  }

  let expectedPaymentDate = existing.expectedPaymentDate || '';
  if (dto.expectedPaymentDate) {
    expectedPaymentDate = String(dto.expectedPaymentDate).split('T')[0];
  }

  return {
    ...existing,
    id: id || transactionId,
    saleId: id,
    transactionId,
    date,
    saleDate: date,
    cropId,
    cropName,
    crop: cropName,
    buyerName,
    buyerCategory,
    buyerMobile,
    quantity,
    unit,
    rate,
    totalAmount,
    transactionStatus: normalizedStatus,
    status: normalizedStatus,
    otpStatus: normalizedOtpStatus,
    expectedPaymentDate,
    paymentStatus: dto.paymentStatus || (normalizedStatus === 'Confirmed' ? 'Payment Expected' : 'Payment Expected'),
    pickupLocation: dto.pickupLocation || dto.location || existing.pickupLocation || '',
    qualityGrade: dto.qualityGrade || dto.quality || existing.qualityGrade || 'Grade A',
    notes: dto.notes || existing.notes || '',
    createdAt: dto.createdAt || existing.createdAt || null,
    updatedAt: dto.updatedAt || existing.updatedAt || null,
  };
}

/**
 * Maps Frontend SalesForm state to Backend Create Sale DTO
 */
export function mapSaleFormToCreateDto(form = {}, profile = {}) {
  const quantity = Number(form.sellingQuantity ?? form.quantity ?? 0);
  const rate = Number(form.rate ?? 0);
  const totalAmount = Number(form.totalAmount || (quantity * rate));

  const cleanMobile = String(form.buyerMobile || '').trim().replace(/\D/g, '').slice(-10);

  return {
    cropId: form.cropId || null,
    cropName: form.cropName || '',
    buyerName: String(form.buyerName || '').trim(),
    buyerCategory: form.buyerCategory || 'Middleman',
    buyerMobile: cleanMobile,
    quantity,
    unit: form.unit || 'Quintals',
    rate,
    totalAmount,
    qualityGrade: form.qualityGrade || 'Grade A',
    pickupLocation:
      form.pickupLocation ||
      [profile?.farmName, profile?.village, profile?.district].filter(Boolean).join(', ') ||
      'Farm Warehouse',
    expectedPickupDate: form.expectedPickupDate
      ? new Date(form.expectedPickupDate).toISOString()
      : new Date().toISOString(),
    notes: form.notes || null,
  };
}

/* ==========================================================================
   FARMER SALES API CALLS
   ========================================================================== */

/**
 * GET /api/v1/farmer/sales/options
 * Fetches dropdown and form options: buyer categories, grades, units, payment methods
 */
export async function fetchSalesOptionsApi() {
  try {
    const response = await api.get(Endpoints?.FARMER_SALES?.OPTIONS || '/api/v1/farmer/sales/options');
    const body = response?.data;
    const data = body?.data || body;
    if (data && (data.buyerCategories || data.categories || data.qualityGrades)) {
      return {
        buyerCategories: data.buyerCategories || data.categories || DEFAULT_SALES_OPTIONS.buyerCategories,
        qualityGrades: data.qualityGrades || DEFAULT_SALES_OPTIONS.qualityGrades,
        units: data.units || DEFAULT_SALES_OPTIONS.units,
        paymentMethods: data.paymentMethods || DEFAULT_SALES_OPTIONS.paymentMethods,
      };
    }
    return DEFAULT_SALES_OPTIONS;
  } catch (error) {
    console.warn('Failed to fetch sales options from backend, using defaults:', error?.message);
    return DEFAULT_SALES_OPTIONS;
  }
}

/**
 * GET /api/v1/farmer/sales
 * Fetches all sales for the farmer, with optional filtering
 */
export async function fetchFarmerSalesApi({ category, cropId, status, search, userId } = {}) {
  const params = {};
  if (category && category !== 'All') params.category = category;
  if (cropId && cropId !== 'All') params.cropId = cropId;
  if (status && status !== 'All') params.status = status;
  if (search && String(search).trim()) params.search = String(search).trim();
  if (userId) params.userId = userId;

  try {
    const response = await api.get(Endpoints?.FARMER_SALES?.BASE || '/api/v1/farmer/sales', { params });
    const body = response?.data;
    const list = Array.isArray(body?.data?.items)
      ? body.data.items
      : Array.isArray(body?.data)
      ? body.data
      : Array.isArray(body)
      ? body
      : [];
    return list.map((item) => mapSaleDtoToSale(item));
  } catch (error) {
    console.warn('fetchFarmerSalesApi failed:', error?.message);
    throw parseSalesApiError(error, 'Failed to fetch sales transactions.');
  }
}

/**
 * GET /api/v1/farmer/sales/{id}
 * Fetches single sale details by ID
 */
export async function fetchFarmerSaleByIdApi(id, userId) {
  if (!id) throw new Error('Sale ID is required.');
  const params = userId ? { userId } : {};

  try {
    const response = await api.get(
      Endpoints?.FARMER_SALES?.BY_ID ? Endpoints.FARMER_SALES.BY_ID(id) : `/api/v1/farmer/sales/${id}`,
      { params }
    );
    const body = response?.data;
    const data = body?.data || body;
    return mapSaleDtoToSale(data);
  } catch (error) {
    throw parseSalesApiError(error, `Failed to fetch sale details for #${id}.`);
  }
}

/**
 * POST /api/v1/farmer/sales
 * Creates a new sale, returns sale `id` and triggers OTP
 */
export async function createFarmerSaleApi(saleFormData, userId, profile) {
  const payload = mapSaleFormToCreateDto(saleFormData, profile);
  const params = userId ? { userId } : {};

  try {
    const response = await api.post(Endpoints?.FARMER_SALES?.BASE || '/api/v1/farmer/sales', payload, { params });
    const body = response?.data;
    const data = body?.data || body;

    const createdId = data?.id ?? data?.saleId ?? data;
    const mappedTransaction = mapSaleDtoToSale(data, {
      ...payload,
      id: createdId,
    });

    return {
      success: true,
      id: createdId,
      saleId: createdId,
      transaction: mappedTransaction,
      devOtp: data?.devOtp || data?.otpCode || data?.otp || null,
      message: body?.message || 'Sale created and OTP sent successfully.',
      raw: body,
    };
  } catch (error) {
    throw parseSalesApiError(error, 'Failed to create sale order.');
  }
}

/**
 * POST /api/v1/farmer/sales/{id}/verify-otp
 * Verifies OTP for sale `{id}`
 */
export async function verifyFarmerSaleOtpApi(saleId, otpCode, userId) {
  if (!saleId) throw new Error('Sale ID is required for OTP verification.');
  const cleanOtp = String(otpCode || '').trim();
  if (!cleanOtp) throw new Error('Verification OTP code is required.');

  const payload = {
    otp: cleanOtp,
    otpCode: cleanOtp,
  };
  const params = userId ? { userId } : {};

  try {
    const response = await api.post(
      Endpoints?.FARMER_SALES?.VERIFY_OTP ? Endpoints.FARMER_SALES.VERIFY_OTP(saleId) : `/api/v1/farmer/sales/${saleId}/verify-otp`,
      payload,
      { params }
    );
    const body = response?.data;
    const data = body?.data || body;

    return {
      success: true,
      data: mapSaleDtoToSale(data),
      message: body?.message || 'OTP verified and sale confirmed successfully.',
      raw: body,
    };
  } catch (error) {
    throw parseSalesApiError(error, 'Invalid or expired OTP. Please check and try again.');
  }
}

/**
 * POST /api/v1/farmer/sales/{id}/resend-otp
 * Resends OTP for sale `{id}`
 */
export async function resendFarmerSaleOtpApi(saleId, userId) {
  if (!saleId) throw new Error('Sale ID is required to resend OTP.');
  const params = userId ? { userId } : {};

  try {
    const response = await api.post(
      Endpoints?.FARMER_SALES?.RESEND_OTP ? Endpoints.FARMER_SALES.RESEND_OTP(saleId) : `/api/v1/farmer/sales/${saleId}/resend-otp`,
      {},
      { params }
    );
    const body = response?.data;
    const data = body?.data || body;

    return {
      success: true,
      devOtp: data?.devOtp || data?.otpCode || null,
      message: body?.message || 'New OTP has been sent successfully.',
      raw: body,
    };
  } catch (error) {
    throw parseSalesApiError(error, 'Failed to resend verification OTP.');
  }
}

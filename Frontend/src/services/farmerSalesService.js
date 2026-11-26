/**
 * AgriConnect Farmer Portal - Sales API Service
 * Integrates directly with FarmerMySales & FarmerSellProducts endpoints:
 *
 * FarmerMySales:
 * - GET  /api/v1/farmer/my-sales/summary  (or /api/v1/farmer/sales/summary)
 * - GET  /api/v1/farmer/sales             (or /api/v1/farmer/my-sales)
 * - GET  /api/v1/farmer/my-sales/{id}     (or /api/v1/farmer/sales/{id})
 *
 * FarmerSellProducts:
 * - GET  /api/v1/farmer/sell-products/options (or /api/v1/farmer/sales/options)
 * - POST /api/v1/farmer/sales                 (or /api/v1/farmer/sell-products)
 * - POST /api/v1/farmer/sell-products/{id}/verify-otp (or /verify or /sales/{id}/verify-otp)
 * - POST /api/v1/farmer/sell-products/{id}/resend-otp (or /resend or /sales/{id}/resend-otp)
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
    { code: 'Middleman', label: 'Middleman / Mandi Trader' },
    { code: 'Vendor', label: 'Processing Vendor / Mill' },
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
 * Normalizes backend Sale DTO to frontend sales transaction format
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

  const rawDate = dto.date || dto.createdAt || dto.saleDate || existing.date || new Date().toISOString().split('T')[0];
  const date = String(rawDate).split('T')[0];

  const rawExpDate = dto.expectedPaymentDate || existing.expectedPaymentDate;
  const expectedPaymentDate = rawExpDate
    ? String(rawExpDate).split('T')[0]
    : new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  return {
    ...existing,
    id: transactionId || id,
    backendId: id,
    transactionId: transactionId || id,
    saleId: id,
    date,
    cropId,
    cropName,
    buyerName,
    buyerCategory,
    buyerMobile,
    quantity,
    unit,
    rate,
    totalAmount,
    transactionStatus: normalizedStatus,
    otpStatus: normalizedOtpStatus,
    expectedPaymentDate,
    paymentStatus: dto.paymentStatus || (normalizedStatus === 'Confirmed' ? 'Payment Expected' : 'Awaiting Confirmation'),
    pickupLocation: dto.pickupLocation || existing.pickupLocation || '',
    qualityGrade: dto.qualityGrade || existing.qualityGrade || 'Grade A',
    notes: dto.notes || existing.notes || '',
    createdAt: dto.createdAt || existing.createdAt || null,
    updatedAt: dto.updatedAt || existing.updatedAt || null,
  };
}

/**
 * Maps frontend sales form to backend CreateSale DTO
 */
export function mapSaleFormToCreateDto(form = {}, profile = {}) {
  const quantity = Number(form.sellingQuantity ?? form.quantity ?? 0);
  const rate = Number(form.rate ?? 0);
  const totalAmount = Number(form.totalAmount ?? (quantity * rate));

  return {
    cropId: form.cropId || null,
    cropName: String(form.cropName || '').trim(),
    buyerCategory: form.buyerCategory || 'Middleman',
    buyerName: String(form.buyerName || '').trim(),
    buyerMobile: String(form.buyerMobile || '').replace(/\D/g, '').slice(-10),
    quantity,
    sellingQuantity: quantity,
    unit: form.unit || 'Quintals',
    rate,
    totalAmount,
    qualityGrade: form.qualityGrade || 'Grade A',
    pickupLocation: form.pickupLocation || `${profile?.farmName || ''}, ${profile?.village || ''}`.trim(),
    expectedPickupDate: form.expectedPickupDate ? new Date(form.expectedPickupDate).toISOString() : new Date().toISOString(),
    notes: form.notes || '',
  };
}

/* ==========================================================================
   API METHODS WITH AUTOMATIC ALIAS FALLBACKS
   ========================================================================== */

/**
 * GET /api/v1/farmer/my-sales/summary (fallback: /api/v1/farmer/sales/summary)
 */
export async function fetchSalesSummaryApi(userId) {
  const params = userId ? { userId } : {};

  // Try primary endpoint
  try {
    const res = await api.get(Endpoints.FARMER_MY_SALES.SUMMARY, { params });
    const body = res?.data;
    return body?.data || body;
  } catch (err1) {
    if (err1?.response?.status === 404) {
      try {
        const res2 = await api.get(Endpoints.FARMER_MY_SALES.SUMMARY_ALT, { params });
        const body2 = res2?.data;
        return body2?.data || body2;
      } catch {
        // Suppress and return null
      }
    }
    return null;
  }
}

/**
 * GET /api/v1/farmer/sales (fallback: /api/v1/farmer/my-sales)
 * Fetches all farmer sales
 */
export async function fetchFarmerSalesApi({ category, cropId, status, search, userId } = {}) {
  const params = {};
  if (category && category !== 'All') params.category = category;
  if (cropId && cropId !== 'All') params.cropId = cropId;
  if (status && status !== 'All') params.status = status;
  if (search && String(search).trim()) params.search = String(search).trim();
  if (userId) params.userId = userId;

  try {
    const res = await api.get(Endpoints.FARMER_MY_SALES.BASE, { params });
    const body = res?.data;
    const list = Array.isArray(body?.data?.items)
      ? body.data.items
      : Array.isArray(body?.data)
      ? body.data
      : Array.isArray(body)
      ? body
      : [];
    return list.map((item) => mapSaleDtoToSale(item));
  } catch (err1) {
    if (err1?.response?.status === 404) {
      try {
        const res2 = await api.get(Endpoints.FARMER_MY_SALES.BASE_ALT, { params });
        const body2 = res2?.data;
        const list2 = Array.isArray(body2?.data?.items)
          ? body2.data.items
          : Array.isArray(body2?.data)
          ? body2.data
          : Array.isArray(body2)
          ? body2
          : [];
        return list2.map((item) => mapSaleDtoToSale(item));
      } catch {
        // Fall back
      }
    }
    throw parseSalesApiError(err1, 'Failed to fetch sales transactions.');
  }
}

/**
 * GET /api/v1/farmer/my-sales/{id} (fallback: /api/v1/farmer/sales/{id})
 */
export async function fetchFarmerSaleByIdApi(id, userId) {
  if (!id) throw new Error('Sale ID is required.');
  const params = userId ? { userId } : {};

  try {
    const res = await api.get(Endpoints.FARMER_MY_SALES.BY_ID(id), { params });
    const body = res?.data;
    return mapSaleDtoToSale(body?.data || body);
  } catch (err1) {
    if (err1?.response?.status === 404) {
      try {
        const res2 = await api.get(Endpoints.FARMER_MY_SALES.BY_ID_ALT(id), { params });
        const body2 = res2?.data;
        return mapSaleDtoToSale(body2?.data || body2);
      } catch {
        // Fall back
      }
    }
    throw parseSalesApiError(err1, `Failed to fetch sale details for #${id}.`);
  }
}

/**
 * GET /api/v1/farmer/sell-products/options (fallback: /api/v1/farmer/sales/options)
 */
export async function fetchSellProductsOptionsApi() {
  try {
    const res = await api.get(Endpoints.FARMER_SELL_PRODUCTS.OPTIONS);
    const body = res?.data;
    const data = body?.data || body;
    if (data && (data.buyerCategories || data.qualityGrades)) {
      return {
        buyerCategories: data.buyerCategories || DEFAULT_SALES_OPTIONS.buyerCategories,
        qualityGrades: data.qualityGrades || DEFAULT_SALES_OPTIONS.qualityGrades,
        units: data.units || DEFAULT_SALES_OPTIONS.units,
        paymentMethods: data.paymentMethods || DEFAULT_SALES_OPTIONS.paymentMethods,
      };
    }
    return DEFAULT_SALES_OPTIONS;
  } catch (err1) {
    if (err1?.response?.status === 404) {
      try {
        const res2 = await api.get(Endpoints.FARMER_SELL_PRODUCTS.OPTIONS_ALT);
        const body2 = res2?.data;
        const data2 = body2?.data || body2;
        if (data2 && (data2.buyerCategories || data2.qualityGrades)) {
          return {
            buyerCategories: data2.buyerCategories || DEFAULT_SALES_OPTIONS.buyerCategories,
            qualityGrades: data2.qualityGrades || DEFAULT_SALES_OPTIONS.qualityGrades,
            units: data2.units || DEFAULT_SALES_OPTIONS.units,
            paymentMethods: data2.paymentMethods || DEFAULT_SALES_OPTIONS.paymentMethods,
          };
        }
      } catch {
        // Ignore fallback error
      }
    }
    return DEFAULT_SALES_OPTIONS;
  }
}

/**
 * POST /api/v1/farmer/sales (fallback: /api/v1/farmer/sell-products)
 * Registers a new sale order and initiates OTP handshake
 */
export async function createFarmerSaleApi(saleFormData, userId, profile) {
  const payload = mapSaleFormToCreateDto(saleFormData, profile);
  const params = userId ? { userId } : {};

  try {
    const res = await api.post(Endpoints.FARMER_SELL_PRODUCTS.BASE, payload, { params });
    const body = res?.data;
    const data = body?.data || body;
    const createdId = data?.id ?? data?.saleId ?? data?.transactionId;
    const mapped = mapSaleDtoToSale(data, { ...payload, id: createdId });

    return {
      success: true,
      id: createdId,
      saleId: createdId,
      transaction: mapped,
      devOtp: data?.devOtp || data?.otpCode || data?.otp || null,
      message: body?.message || 'Sale created successfully. Awaiting OTP confirmation.',
      raw: body,
    };
  } catch (err1) {
    if (err1?.response?.status === 404) {
      try {
        const res2 = await api.post(Endpoints.FARMER_SELL_PRODUCTS.BASE_ALT, payload, { params });
        const body2 = res2?.data;
        const data2 = body2?.data || body2;
        const createdId2 = data2?.id ?? data2?.saleId ?? data2?.transactionId;
        const mapped2 = mapSaleDtoToSale(data2, { ...payload, id: createdId2 });

        return {
          success: true,
          id: createdId2,
          saleId: createdId2,
          transaction: mapped2,
          devOtp: data2?.devOtp || data2?.otpCode || data2?.otp || null,
          message: body2?.message || 'Sale created successfully.',
          raw: body2,
        };
      } catch {
        // Fall back
      }
    }
    throw parseSalesApiError(err1, 'Failed to create sale order.');
  }
}

/**
 * POST /api/v1/farmer/sell-products/{id}/verify-otp
 * Verifies OTP code for sale `{id}`
 */
export async function verifyFarmerSaleOtpApi(saleId, otpCode, userId) {
  if (!saleId) throw new Error('Sale ID is required.');
  const cleanOtp = String(otpCode || '').trim();
  if (!cleanOtp) throw new Error('Verification OTP code is required.');

  const payload = { otp: cleanOtp, otpCode: cleanOtp };
  const params = userId ? { userId } : {};

  const endpointsToTry = [
    Endpoints.FARMER_SELL_PRODUCTS.VERIFY_OTP(saleId),
    Endpoints.FARMER_SELL_PRODUCTS.VERIFY_OTP_ALT1(saleId),
    Endpoints.FARMER_SELL_PRODUCTS.VERIFY_OTP_ALT2(saleId),
    Endpoints.FARMER_SELL_PRODUCTS.VERIFY_OTP_ALT3(saleId),
  ];

  let lastError = null;
  for (const ep of endpointsToTry) {
    try {
      const res = await api.post(ep, payload, { params });
      const body = res?.data;
      const data = body?.data || body;
      return {
        success: true,
        data: mapSaleDtoToSale(data),
        message: body?.message || 'OTP verified and sale confirmed successfully.',
        raw: body,
      };
    } catch (err) {
      lastError = err;
      if (err?.response?.status !== 404) {
        throw parseSalesApiError(err, 'Invalid or expired OTP. Please check and try again.');
      }
    }
  }

  throw parseSalesApiError(lastError, 'Invalid or expired OTP. Please check and try again.');
}

/**
 * POST /api/v1/farmer/sell-products/{id}/resend-otp
 * Resends OTP code for sale `{id}`
 */
export async function resendFarmerSaleOtpApi(saleId, userId) {
  if (!saleId) throw new Error('Sale ID is required.');
  const params = userId ? { userId } : {};

  const endpointsToTry = [
    Endpoints.FARMER_SELL_PRODUCTS.RESEND_OTP(saleId),
    Endpoints.FARMER_SELL_PRODUCTS.RESEND_OTP_ALT1(saleId),
    Endpoints.FARMER_SELL_PRODUCTS.RESEND_OTP_ALT2(saleId),
    Endpoints.FARMER_SELL_PRODUCTS.RESEND_OTP_ALT3(saleId),
  ];

  let lastError = null;
  for (const ep of endpointsToTry) {
    try {
      const res = await api.post(ep, {}, { params });
      const body = res?.data;
      const data = body?.data || body;
      return {
        success: true,
        devOtp: data?.devOtp || data?.otpCode || null,
        message: body?.message || 'A fresh OTP has been sent.',
        raw: body,
      };
    } catch (err) {
      lastError = err;
      if (err?.response?.status !== 404) {
        throw parseSalesApiError(err, 'Failed to resend verification OTP.');
      }
    }
  }

  throw parseSalesApiError(lastError, 'Failed to resend verification OTP.');
}

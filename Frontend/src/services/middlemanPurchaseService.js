import api from '../API/Config';
import Endpoints from '../API/Endpoints';

/**
 * Middleman Purchase API Service
 * Handles live synchronization between React frontend and Middleman Purchase endpoints:
 * - GET  /api/v1/middleman/purchases
 * - POST /api/v1/middleman/purchases
 * - GET  /api/v1/middleman/purchases/{id}
 */

export function mapMiddlemanPurchaseDto(dto = {}, existing = {}) {
  if (!dto || typeof dto !== 'object') return existing;
  const rawId = dto.id ?? dto.purchaseId ?? existing.id ?? null;
  const purchaseId =
    dto.purchaseCode ||
    (typeof dto.purchaseId === 'string' && dto.purchaseId.startsWith('PUR')
      ? dto.purchaseId
      : rawId
      ? `PUR-${String(rawId).padStart(4, '0')}`
      : existing.purchaseId || 'PUR-0001');

  const quantity = Number(dto.quantity ?? existing.quantity ?? 0);
  const rate = Number(dto.rate ?? dto.pricePerQuintal ?? dto.pricePerUnit ?? existing.rate ?? 0);
  const subtotal = Number(dto.subtotal ?? quantity * rate);
  const transportation = Number(
    dto.transportation ?? dto.transportationCharges ?? existing.transportation ?? 0
  );
  const loading = Number(dto.loading ?? dto.loadingCharges ?? existing.loading ?? 0);
  const otherCharges = Number(dto.otherCharges ?? existing.otherCharges ?? 0);
  const totalAmount = Number(
    dto.totalAmount ?? subtotal + transportation + loading + otherCharges
  );

  return {
    ...existing,
    id: rawId,
    purchaseId,
    farmerId:
      dto.farmerCode ||
      dto.farmerId ||
      existing.farmerId ||
      'FAR-0001',
    farmerName: dto.farmerName || existing.farmerName || '',
    farmerMobile: dto.farmerMobile || dto.mobile || existing.farmerMobile || '',
    farmerLocation: dto.farmerLocation || dto.pickupLocation || existing.farmerLocation || '',
    cropName: dto.cropName || dto.crop || existing.cropName || '',
    variety: dto.variety || dto.cropVariety || existing.variety || 'Standard',
    quantity,
    unit: dto.unit || existing.unit || 'Quintal',
    rate,
    subtotal,
    transportation,
    loading,
    otherCharges,
    totalAmount,
    averageCostPerUnit:
      quantity > 0 ? Number((totalAmount / quantity).toFixed(2)) : rate,
    quality: dto.quality || dto.qualityGrade || existing.quality || 'Grade A',
    purchaseDate: dto.purchaseDate
      ? String(dto.purchaseDate).slice(0, 10)
      : existing.purchaseDate || new Date().toISOString().slice(0, 10),
    expectedPaymentDate: dto.expectedPaymentDate
      ? String(dto.expectedPaymentDate).slice(0, 10)
      : existing.expectedPaymentDate || '',
    pickupLocation: dto.pickupLocation || existing.pickupLocation || '',
    deliveryDate: dto.deliveryDate
      ? String(dto.deliveryDate).slice(0, 10)
      : existing.deliveryDate || '',
    otpStatus: dto.otpStatus || existing.otpStatus || 'Pending',
    confirmationDate: dto.confirmationDate || existing.confirmationDate || null,
    status: dto.status || existing.status || 'Pending Confirmation',
    notes: dto.notes ?? existing.notes ?? '',
  };
}

export async function fetchMiddlemanPurchasesApi(params = {}) {
  try {
    const res = await api.get(Endpoints.MiddlemanPurchases.getAll, { params });
    const data = res.data?.data ?? res.data;
    const list = Array.isArray(data?.items)
      ? data.items
      : Array.isArray(data?.purchases)
      ? data.purchases
      : Array.isArray(data)
      ? data
      : [];
    return list.map((item) => mapMiddlemanPurchaseDto(item));
  } catch (err) {
    console.warn('fetchMiddlemanPurchasesApi fallback to local:', err?.message || err);
    return null;
  }
}

export async function fetchMiddlemanPurchaseByIdApi(id) {
  if (!id) return null;
  try {
    const res = await api.get(Endpoints.MiddlemanPurchases.getById(id));
    const dto = res.data?.data ?? res.data;
    return dto ? mapMiddlemanPurchaseDto(dto) : null;
  } catch (err) {
    console.warn('fetchMiddlemanPurchaseByIdApi fallback:', err?.message || err);
    return null;
  }
}

export async function createMiddlemanPurchaseApi(purchaseData = {}) {
  try {
    const res = await api.post(Endpoints.MiddlemanPurchases.create, {
      farmerId: purchaseData.farmerId,
      farmerName: purchaseData.farmerName,
      farmerMobile: purchaseData.farmerMobile,
      farmerLocation: purchaseData.farmerLocation || purchaseData.pickupLocation,
      cropName: purchaseData.cropName,
      variety: purchaseData.variety || 'Standard',
      quality: purchaseData.quality || 'Grade A',
      qualityGrade: purchaseData.quality || 'Grade A',
      quantity: Number(purchaseData.quantity) || 0,
      unit: purchaseData.unit || 'Quintal',
      rate: Number(purchaseData.rate) || 0,
      pricePerQuintal: Number(purchaseData.rate) || 0,
      transportation: Number(purchaseData.transportation) || 0,
      transportationCharges: Number(purchaseData.transportation) || 0,
      loading: Number(purchaseData.loading) || 0,
      loadingCharges: Number(purchaseData.loading) || 0,
      otherCharges: Number(purchaseData.otherCharges) || 0,
      totalAmount: Number(purchaseData.totalAmount) || 0,
      purchaseDate: purchaseData.purchaseDate || new Date().toISOString().slice(0, 10),
      expectedPaymentDate: purchaseData.expectedPaymentDate || null,
      pickupLocation: purchaseData.pickupLocation || null,
      deliveryDate: purchaseData.deliveryDate || null,
      notes: purchaseData.notes || null,
      isDraft: Boolean(purchaseData.isDraft),
    });
    const dto = res.data?.data ?? res.data;
    return dto ? mapMiddlemanPurchaseDto(dto, purchaseData) : null;
  } catch (err) {
    console.error('createMiddlemanPurchaseApi error:', err);
    throw err;
  }
}

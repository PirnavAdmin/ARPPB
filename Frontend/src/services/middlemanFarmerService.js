import api from '../API/Config';
import Endpoints from '../API/Endpoints';

/**
 * Middleman Farmer API Service
 * Handles live synchronization between React frontend and Middleman Farmer endpoints:
 * - GET  /api/v1/middleman/farmers
 * - POST /api/v1/middleman/farmers
 * - GET  /api/v1/middleman/farmers/{id}
 * - PUT  /api/v1/middleman/farmers/{id}
 * - GET  /api/v1/middleman/farmers/{id}/history
 */

export function mapMiddlemanFarmerDto(dto = {}, existing = {}) {
  if (!dto || typeof dto !== 'object') return existing;
  const rawId = dto.id ?? dto.farmerId ?? existing.id ?? null;
  const farmerId =
    dto.farmerCode ||
    (typeof dto.farmerId === 'string' && dto.farmerId.startsWith('FAR')
      ? dto.farmerId
      : rawId
      ? `FAR-${String(rawId).padStart(4, '0')}`
      : existing.farmerId || 'FAR-0001');

  const rawCrops = dto.crops ?? dto.cultivatedCrops ?? dto.primaryCrops ?? existing.crops ?? [];
  const crops = Array.isArray(rawCrops)
    ? rawCrops
    : typeof rawCrops === 'string'
    ? rawCrops
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean)
    : [];

  return {
    ...existing,
    id: rawId,
    farmerId,
    name: dto.name || dto.farmerName || dto.fullName || existing.name || '',
    mobile: dto.mobile || dto.mobileNumber || dto.phone || existing.mobile || '',
    email: dto.email ?? existing.email ?? '',
    village: dto.village || dto.villageArea || existing.village || '',
    mandal: dto.mandal ?? existing.mandal ?? '',
    district: dto.district || existing.district || '',
    state: dto.state || existing.state || 'Andhra Pradesh',
    pinCode: dto.pinCode ?? existing.pinCode ?? '',
    completeAddress: dto.completeAddress || dto.address || existing.completeAddress || '',
    crops,
    totalPurchases: Number(dto.totalPurchases ?? existing.totalPurchases ?? 0),
    totalQuantityPurchased: Number(
      dto.totalQuantityPurchased ?? dto.totalQuantity ?? existing.totalQuantityPurchased ?? 0
    ),
    totalPurchaseValue: Number(
      dto.totalPurchaseValue ?? dto.purchaseValue ?? existing.totalPurchaseValue ?? 0
    ),
    outstandingPayables: Number(
      dto.outstandingPayables ?? dto.pendingPayables ?? existing.outstandingPayables ?? 0
    ),
    pendingConfirmations: Number(dto.pendingConfirmations ?? existing.pendingConfirmations ?? 0),
    status: dto.status || (dto.isActive === false ? 'Inactive' : existing.status || 'Active'),
    notes: dto.notes ?? existing.notes ?? '',
  };
}

export async function fetchMiddlemanFarmersApi(params = {}) {
  try {
    const effectiveParams = { pageSize: 1000, page: 1, ...params };
    const res = await api.get(Endpoints.MiddlemanFarmers.getAll, { params: effectiveParams });
    const data = res.data?.data ?? res.data;
    const list = Array.isArray(data?.items)
      ? data.items
      : Array.isArray(data?.farmers)
      ? data.farmers
      : Array.isArray(data)
      ? data
      : [];
    return list.map((item) => mapMiddlemanFarmerDto(item));
  } catch (err) {
    console.warn('fetchMiddlemanFarmersApi fallback to local:', err?.message || err);
    return null;
  }
}

export async function fetchMiddlemanFarmerByIdApi(id) {
  if (!id) return null;
  try {
    const res = await api.get(Endpoints.MiddlemanFarmers.getById(id));
    const dto = res.data?.data ?? res.data;
    return dto ? mapMiddlemanFarmerDto(dto) : null;
  } catch (err) {
    console.warn('fetchMiddlemanFarmerByIdApi fallback:', err?.message || err);
    return null;
  }
}

export async function registerMiddlemanFarmerApi(farmerData = {}) {
  try {
    const cropsList = Array.isArray(farmerData.crops) ? farmerData.crops : [];
    const cleanMobile = String(farmerData.mobile || '').replace(/\D/g, '').slice(-10);
    const res = await api.post(Endpoints.MiddlemanFarmers.create, {
      name: farmerData.name,
      mobile: cleanMobile,
      email: farmerData.email || null,
      village: farmerData.village,
      mandal: farmerData.mandal || null,
      district: farmerData.district,
      state: farmerData.state || 'Andhra Pradesh',
      pinCode: farmerData.pinCode || null,
      completeAddress: farmerData.completeAddress || null,
      crops: cropsList,
      availableCrops: cropsList,
      notes: farmerData.notes || null,
    });
    const dto = res.data?.data ?? res.data;
    return dto ? mapMiddlemanFarmerDto(dto, farmerData) : null;
  } catch (err) {
    console.error('registerMiddlemanFarmerApi error:', err);
    throw err;
  }
}

export async function updateMiddlemanFarmerApi(id, farmerData = {}) {
  if (!id) return null;
  try {
    const targetId = farmerData.farmerId || id;
    const cropsList = Array.isArray(farmerData.crops) ? farmerData.crops : [];
    const cleanMobile = String(farmerData.mobile || '').replace(/\D/g, '').slice(-10);
    const res = await api.put(Endpoints.MiddlemanFarmers.update(targetId), {
      name: farmerData.name,
      mobile: cleanMobile,
      email: farmerData.email || null,
      village: farmerData.village,
      mandal: farmerData.mandal || null,
      district: farmerData.district,
      state: farmerData.state || 'Andhra Pradesh',
      pinCode: farmerData.pinCode || null,
      completeAddress: farmerData.completeAddress || null,
      crops: cropsList,
      availableCrops: cropsList,
      notes: farmerData.notes || null,
      status: farmerData.status || 'Active',
    });
    const dto = res.data?.data ?? res.data;
    return dto ? mapMiddlemanFarmerDto(dto, farmerData) : null;
  } catch (err) {
    console.error('updateMiddlemanFarmerApi error:', err);
    throw err;
  }
}

export async function fetchMiddlemanFarmerHistoryApi(id) {
  if (!id) return null;
  try {
    const res = await api.get(Endpoints.MiddlemanFarmers.history(id));
    return res.data?.data ?? res.data ?? null;
  } catch (err) {
    console.warn('fetchMiddlemanFarmerHistoryApi error:', err?.message || err);
    return null;
  }
}

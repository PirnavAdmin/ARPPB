/**
 * AgriConnect Farmer Portal - Crops API Service
 * Integrates directly with Farmer Crops endpoints:
 * - GET    /api/v1/farmer/crops
 * - POST   /api/v1/farmer/crops
 * - GET    /api/v1/farmer/crops/options
 * - GET    /api/v1/farmer/crops/{id}
 * - PUT    /api/v1/farmer/crops/{id}
 * - DELETE /api/v1/farmer/crops/{id}
 * - PATCH  /api/v1/farmer/crops/{id}/add-stock
 *
 * Base URL: https://pogo-musty-monument.ngrok-free.dev
 */

import api from '../API/Config';
import Endpoints from '../API/Endpoints';

/**
 * Normalizes error responses from ASP.NET Core / ApiResponse / ValidationProblemDetails
 */
export function parseCropApiError(error, fallbackMessage = 'Crop request failed.') {
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
    message = 'Unable to connect to the Crop server. Please check your network connection.';
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
 * Normalizes category value to backend-supported category strings:
 * 'Cereals', 'Spices', 'Oilseeds', 'Commercial', 'Pulses', 'Horticulture'
 */
export function normalizeCategoryForBackend(category) {
  if (!category) return 'Cereals';
  const c = String(category).trim().toLowerCase();
  if (c.includes('cereal')) return 'Cereals';
  if (c.includes('spice')) return 'Spices';
  if (c.includes('oilseed')) return 'Oilseeds';
  if (c.includes('commercial') || c.includes('cash')) return 'Commercial';
  if (c.includes('pulse')) return 'Pulses';
  if (c.includes('horticulture') || c.includes('fruit') || c.includes('veg')) return 'Horticulture';
  return category;
}

/**
 * Normalizes unit to backend-supported unit strings:
 * 'Quintals', 'Kilograms', 'Bags', 'Tonnes'
 */
export function normalizeUnitForBackend(unit) {
  if (!unit) return 'Quintals';
  const u = String(unit).trim().toLowerCase();
  if (u === 'qtl' || u.includes('quintal')) return 'Quintals';
  if (u === 'kg' || u.includes('kilo')) return 'Kilograms';
  if (u.includes('bag')) return 'Bags';
  if (u.includes('tonne') || u.includes('ton')) return 'Tonnes';
  return unit;
}

/**
 * Ensures a valid ISO 8601 date-time string
 */
function toIsoDateString(dateVal) {
  if (!dateVal) return new Date().toISOString();
  try {
    const d = new Date(dateVal);
    if (!isNaN(d.getTime())) {
      return d.toISOString();
    }
  } catch {
    // fallback
  }
  return new Date().toISOString();
}

/**
 * Maps Backend CropResponseDto to Frontend Crop Record
 */
export function mapCropDtoToCrop(dto = {}, existing = {}) {
  if (!dto || typeof dto !== 'object') return existing;

  const rawStorage = dto.storageLocation || existing.storageLocation || '';
  const storageParts = rawStorage.split(',').map((s) => s.trim());
  const village = storageParts[0] || existing.village || 'Farm Warehouse';
  const district = storageParts[1] || existing.district || '';
  const state = storageParts[2] || existing.state || '';

  const id = dto.id ?? existing.id ?? null;
  const cropCode = dto.cropCode || existing.cropCode || (id ? `CRP-${String(id).padStart(3, '0')}` : '');
  const cropName = dto.cropName || dto.name || existing.cropName || existing.name || '';
  const category = dto.cropCategory || dto.category || existing.cropCategory || existing.category || 'Cereals';
  const variety = dto.cropVariety || dto.variety || existing.cropVariety || existing.variety || '';
  const cultivationArea = Number(dto.cultivationAreaAcres ?? dto.cultivationArea ?? existing.cultivationArea ?? 1);
  const harvestedQuantity = Number(dto.harvestedQuantity ?? existing.harvestedQuantity ?? 0);
  const availableQuantity = Number(dto.availableQuantity ?? existing.availableQuantity ?? harvestedQuantity);
  const soldQuantity = Number(dto.soldQuantity ?? existing.soldQuantity ?? 0);
  const reservedQuantity = Number(dto.reservedQuantity ?? existing.reservedQuantity ?? 0);
  const expectedSellingPrice = Number(dto.expectedSellingPrice ?? existing.expectedSellingPrice ?? 0);
  const unit = dto.unit || existing.unit || 'Quintals';
  const qualityGrade = dto.qualityGrade || existing.qualityGrade || 'Grade A';
  const description = dto.cropDescription ?? dto.description ?? existing.cropDescription ?? existing.description ?? '';
  const status = dto.status || existing.status || (availableQuantity < 50 ? 'Low Stock' : 'Ready to Sell');

  let harvestDate = existing.harvestDate || '';
  if (dto.harvestDate) {
    harvestDate = String(dto.harvestDate).split('T')[0];
  }

  return {
    ...existing,
    id,
    cropCode,
    farmerId: dto.farmerId ?? existing.farmerId ?? null,
    name: cropName,
    cropName,
    category,
    cropCategory: category,
    variety,
    cropVariety: variety,
    season: dto.season || existing.season || 'Kharif',
    cultivationArea,
    cultivationAreaAcres: cultivationArea,
    harvestDate,
    harvestedQuantity,
    availableQuantity,
    soldQuantity,
    reservedQuantity,
    unit,
    expectedSellingPrice,
    qualityGrade,
    storageLocation: rawStorage,
    village,
    district,
    state,
    description,
    cropDescription: description,
    status,
    color: existing.color || '#237A45',
    createdAt: dto.createdAt || existing.createdAt || null,
    updatedAt: dto.updatedAt || existing.updatedAt || null,
  };
}

/**
 * Maps Frontend Form Data to Backend CreateCropRequestDto
 */
export function mapCropFormToCreateDto(form = {}, profile = {}) {
  const cropName = String(form.name || form.cropName || '').trim();
  const cropCategory = normalizeCategoryForBackend(form.category || form.cropCategory || 'Cereals');
  const cropVariety = String(form.variety || form.cropVariety || '').trim();
  const season = String(form.season || 'Kharif').trim();
  const cultivationAreaAcres = Number(form.cultivationArea || form.cultivationAreaAcres || 1);
  const harvestDate = toIsoDateString(form.harvestDate);
  const harvestedQuantity = Number(form.harvestedQuantity || form.availableQuantity || 1);
  const unit = normalizeUnitForBackend(form.unit || 'Quintals');
  const expectedSellingPrice = Number(form.expectedSellingPrice || 0);
  const qualityGrade = String(form.qualityGrade || 'Grade A').trim();

  let storageLocation = String(form.storageLocation || '').trim();
  if (!storageLocation) {
    const locParts = [
      form.village || profile?.village,
      form.district || profile?.district,
      form.state || profile?.state,
    ].filter(Boolean);
    storageLocation = locParts.length > 0 ? locParts.join(', ') : 'Farm Warehouse';
  }

  const cropDescription = form.description || form.cropDescription || null;

  return {
    cropName,
    cropCategory,
    cropVariety,
    season,
    cultivationAreaAcres: cultivationAreaAcres > 0 ? cultivationAreaAcres : 1,
    harvestDate,
    harvestedQuantity: harvestedQuantity > 0 ? harvestedQuantity : 1,
    unit,
    expectedSellingPrice: expectedSellingPrice > 0 ? expectedSellingPrice : 1,
    qualityGrade,
    storageLocation,
    cropDescription,
  };
}

/**
 * Maps Frontend Form Data to Backend UpdateCropRequestDto (omits harvestedQuantity)
 */
export function mapCropFormToUpdateDto(form = {}, profile = {}) {
  const createDto = mapCropFormToCreateDto(form, profile);
  const { harvestedQuantity, ...updateDto } = createDto;
  return updateDto;
}

/**
 * Default fallback options in case options API call fails
 */
export const DEFAULT_CROP_OPTIONS = {
  categories: [
    { code: 'Cereals', label: 'Cereals (Paddy, Wheat, Maize)' },
    { code: 'Spices', label: 'Spices (Turmeric, Chilli)' },
    { code: 'Oilseeds', label: 'Oilseeds (Groundnut, Mustard)' },
    { code: 'Commercial', label: 'Commercial or Cash Crops (Cotton, Sugarcane)' },
    { code: 'Pulses', label: 'Pulses (Red Gram, Bengal Gram)' },
    { code: 'Horticulture', label: 'Horticulture (Fruits, Vegetables)' },
  ],
  seasons: [
    { code: 'Kharif', label: 'Kharif (Monsoon)' },
    { code: 'Rabi', label: 'Rabi (Winter)' },
    { code: 'Zaid', label: 'Zaid (Summer)' },
    { code: 'Annual', label: 'Annual' },
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
};

/* ==========================================================================
   FARMER CROPS API CALLS
   ========================================================================== */

/**
 * GET /api/v1/farmer/crops/options
 * Fetches dropdown options: categories, seasons, qualityGrades, units
 */
export async function fetchCropOptionsApi() {
  try {
    const response = await api.get(Endpoints.FarmerCrops.getOptions);
    const body = response?.data;
    const optionsData = body?.data || body;
    if (optionsData && (optionsData.categories || optionsData.seasons)) {
      return {
        categories: optionsData.categories || DEFAULT_CROP_OPTIONS.categories,
        seasons: optionsData.seasons || DEFAULT_CROP_OPTIONS.seasons,
        qualityGrades: optionsData.qualityGrades || DEFAULT_CROP_OPTIONS.qualityGrades,
        units: optionsData.units || DEFAULT_CROP_OPTIONS.units,
      };
    }
    return DEFAULT_CROP_OPTIONS;
  } catch (error) {
    console.warn('Failed to fetch crop options from backend, using defaults:', error?.message);
    return DEFAULT_CROP_OPTIONS;
  }
}

/**
 * GET /api/v1/farmer/crops
 * Fetches list of crops with optional filter query parameters
 */
export async function fetchCropsApi({ category, season, search, userId } = {}) {
  const params = {};
  if (category && category !== 'All') {
    params.category = normalizeCategoryForBackend(category);
  }
  if (season && season !== 'All') {
    params.season = season;
  }
  if (search && String(search).trim()) {
    params.search = String(search).trim();
  }
  if (userId) {
    params.userId = userId;
  }

  try {
    const response = await api.get(Endpoints.FarmerCrops.getAll, { params });
    const body = response?.data;
    const list = Array.isArray(body?.data) ? body.data : Array.isArray(body) ? body : [];
    return list.map((item) => mapCropDtoToCrop(item));
  } catch (error) {
    throw parseCropApiError(error, 'Failed to fetch crops inventory.');
  }
}

/**
 * GET /api/v1/farmer/crops/{id}
 * Fetches a single crop by ID
 */
export async function fetchCropByIdApi(id, userId) {
  if (!id) throw new Error('Crop ID is required.');
  const params = userId ? { userId } : {};

  try {
    const response = await api.get(Endpoints.FarmerCrops.getById(id), { params });
    const body = response?.data;
    const data = body?.data || body;
    return mapCropDtoToCrop(data);
  } catch (error) {
    throw parseCropApiError(error, `Failed to fetch crop #${id}.`);
  }
}

/**
 * POST /api/v1/farmer/crops
 * Registers a new crop
 */
export async function createCropApi(cropFormData, userId, profile) {
  const payload = mapCropFormToCreateDto(cropFormData, profile);
  const params = userId ? { userId } : {};

  try {
    const response = await api.post(Endpoints.FarmerCrops.create, payload, { params });
    const body = response?.data;
    const data = body?.data || body;
    return mapCropDtoToCrop(data);
  } catch (error) {
    throw parseCropApiError(error, 'Failed to register new crop.');
  }
}

/**
 * PUT /api/v1/farmer/crops/{id}
 * Updates an existing crop
 */
export async function updateCropApi(id, cropFormData, userId, profile) {
  if (!id) throw new Error('Crop ID is required.');
  const payload = mapCropFormToUpdateDto(cropFormData, profile);
  const params = userId ? { userId } : {};

  try {
    const response = await api.put(Endpoints.FarmerCrops.update(id), payload, { params });
    const body = response?.data;
    const data = body?.data || body;
    return mapCropDtoToCrop(data);
  } catch (error) {
    throw parseCropApiError(error, `Failed to update crop #${id}.`);
  }
}

/**
 * DELETE /api/v1/farmer/crops/{id}
 * Deletes a crop by ID
 */
export async function deleteCropApi(id, userId) {
  if (!id) throw new Error('Crop ID is required.');
  const params = userId ? { userId } : {};

  try {
    const response = await api.delete(Endpoints.FarmerCrops.delete(id), { params });
    return response?.data || { success: true };
  } catch (error) {
    throw parseCropApiError(error, `Failed to delete crop #${id}.`);
  }
}

/**
 * PATCH /api/v1/farmer/crops/{id}/add-stock
 * Adds harvested yield quantity to an existing crop
 */
export async function addCropYieldApi(id, additionalQuantity, userId) {
  if (!id) throw new Error('Crop ID is required.');
  const qty = Number(additionalQuantity);
  if (isNaN(qty) || qty <= 0) {
    throw new Error('Additional quantity must be a positive number.');
  }

  const payload = { additionalQuantity: qty };
  const params = userId ? { userId } : {};

  try {
    const response = await api.patch(Endpoints.FarmerCrops.addStock(id), payload, { params });
    const body = response?.data;
    const data = body?.data || body;
    return mapCropDtoToCrop(data);
  } catch (error) {
    throw parseCropApiError(error, `Failed to add harvest stock for crop #${id}.`);
  }
}

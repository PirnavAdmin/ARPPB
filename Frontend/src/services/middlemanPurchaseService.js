import api from '../API/Config';
import Endpoints from '../API/Endpoints';

/**
 * Middleman Purchase API Service
 * Handles live synchronization between React frontend and Middleman Purchase endpoints.
 */

export async function fetchMiddlemanPurchasesApi(params = {}) {
  try {
    const res = await api.get(Endpoints.MIDDLEMAN_PURCHASES.BASE, { params });
    const data = res.data?.data;
    if (data && Array.isArray(data.items)) {
      return data.items;
    }
    if (Array.isArray(data)) {
      return data;
    }
    return [];
  } catch (err) {
    console.warn('fetchMiddlemanPurchasesApi fallback to local:', err?.message || err);
    return null;
  }
}

export async function fetchMiddlemanPurchaseByIdApi(id) {
  try {
    const res = await api.get(Endpoints.MIDDLEMAN_PURCHASES.BY_ID(id));
    return res.data?.data || null;
  } catch (err) {
    console.warn('fetchMiddlemanPurchaseByIdApi fallback:', err?.message || err);
    return null;
  }
}

export async function createMiddlemanPurchaseApi(purchaseData) {
  try {
    const res = await api.post(Endpoints.MIDDLEMAN_PURCHASES.BASE, {
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
      purchaseDate: purchaseData.purchaseDate || new Date().toISOString().slice(0, 10),
      expectedPaymentDate: purchaseData.expectedPaymentDate || null,
      pickupLocation: purchaseData.pickupLocation || null,
      deliveryDate: purchaseData.deliveryDate || null,
      notes: purchaseData.notes || null,
      isDraft: Boolean(purchaseData.isDraft),
    });
    return res.data?.data || null;
  } catch (err) {
    console.error('createMiddlemanPurchaseApi error:', err);
    throw err;
  }
}

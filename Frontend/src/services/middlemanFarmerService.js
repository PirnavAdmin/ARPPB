import api from '../API/Config';
import Endpoints from '../API/Endpoints';

/**
 * Middleman Farmer API Service
 * Handles live synchronization between React frontend and Middleman Farmer endpoints.
 */

export async function fetchMiddlemanFarmersApi(params = {}) {
  try {
    const res = await api.get(Endpoints.MIDDLEMAN_FARMERS.BASE, { params });
    const data = res.data?.data;
    if (data && Array.isArray(data.items)) {
      return data.items;
    }
    if (Array.isArray(data)) {
      return data;
    }
    return [];
  } catch (err) {
    console.warn('fetchMiddlemanFarmersApi fallback to local:', err?.message || err);
    return null;
  }
}

export async function fetchMiddlemanFarmerByIdApi(id) {
  try {
    const res = await api.get(Endpoints.MIDDLEMAN_FARMERS.BY_ID(id));
    return res.data?.data || null;
  } catch (err) {
    console.warn('fetchMiddlemanFarmerByIdApi fallback:', err?.message || err);
    return null;
  }
}

export async function registerMiddlemanFarmerApi(farmerData) {
  try {
    const res = await api.post(Endpoints.MIDDLEMAN_FARMERS.BASE, {
      name: farmerData.name,
      mobile: farmerData.mobile,
      email: farmerData.email || null,
      village: farmerData.village,
      mandal: farmerData.mandal || null,
      district: farmerData.district,
      state: farmerData.state || 'Andhra Pradesh',
      pinCode: farmerData.pinCode || null,
      completeAddress: farmerData.completeAddress || null,
      crops: farmerData.crops || [],
      notes: farmerData.notes || null,
    });
    return res.data?.data || null;
  } catch (err) {
    console.error('registerMiddlemanFarmerApi error:', err);
    throw err;
  }
}

export async function updateMiddlemanFarmerApi(id, farmerData) {
  try {
    const res = await api.put(Endpoints.MIDDLEMAN_FARMERS.BY_ID(id), {
      name: farmerData.name,
      mobile: farmerData.mobile,
      email: farmerData.email,
      village: farmerData.village,
      mandal: farmerData.mandal,
      district: farmerData.district,
      state: farmerData.state,
      pinCode: farmerData.pinCode,
      completeAddress: farmerData.completeAddress,
      crops: farmerData.crops,
      notes: farmerData.notes,
      status: farmerData.status,
    });
    return res.data?.data || null;
  } catch (err) {
    console.error('updateMiddlemanFarmerApi error:', err);
    throw err;
  }
}

export async function fetchMiddlemanFarmerHistoryApi(id) {
  try {
    const res = await api.get(Endpoints.MIDDLEMAN_FARMERS.HISTORY(id));
    return res.data?.data || null;
  } catch (err) {
    console.warn('fetchMiddlemanFarmerHistoryApi error:', err?.message || err);
    return null;
  }
}

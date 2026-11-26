import api from '../API/Config';
import Endpoints from '../API/Endpoints';

/**
 * Middleman Vendor API Service
 * Handles live synchronization between React frontend and Middleman Vendor & Vendor Sales endpoints.
 */

export async function fetchMiddlemanVendorsApi(params = {}) {
  try {
    const effectiveParams = { pageSize: 1000, page: 1, ...params };
    const res = await api.get(Endpoints.MIDDLEMAN_VENDORS.BASE, { params: effectiveParams });
    const data = res.data?.data;
    if (data && Array.isArray(data.items)) {
      return data.items;
    }
    if (Array.isArray(data)) {
      return data;
    }
    return [];
  } catch (err) {
    console.warn('fetchMiddlemanVendorsApi fallback to local:', err?.message || err);
    return null;
  }
}

export async function fetchMiddlemanVendorByIdApi(id) {
  try {
    const res = await api.get(Endpoints.MIDDLEMAN_VENDORS.BY_ID(id));
    return res.data?.data || null;
  } catch (err) {
    console.warn('fetchMiddlemanVendorByIdApi fallback:', err?.message || err);
    return null;
  }
}

export async function registerMiddlemanVendorApi(vendorData) {
  try {
    const res = await api.post(Endpoints.MIDDLEMAN_VENDORS.BASE, {
      businessName: vendorData.businessName,
      ownerName: vendorData.ownerName,
      mobile: vendorData.mobile,
      businessType: vendorData.businessType || 'Wholesaler',
      gstNumber: vendorData.gstNumber || vendorData.gstin || null,
      email: vendorData.email || null,
      address: vendorData.address || null,
      district: vendorData.district,
      state: vendorData.state || 'Andhra Pradesh',
      pinCode: vendorData.pinCode || null,
      notes: vendorData.notes || null,
    });
    return res.data?.data || null;
  } catch (err) {
    console.error('registerMiddlemanVendorApi error:', err);
    throw err;
  }
}

export async function updateMiddlemanVendorApi(id, vendorData) {
  try {
    const res = await api.put(Endpoints.MIDDLEMAN_VENDORS.BY_ID(id), {
      businessName: vendorData.businessName,
      ownerName: vendorData.ownerName,
      mobile: vendorData.mobile,
      businessType: vendorData.businessType,
      gstNumber: vendorData.gstNumber || vendorData.gstin,
      email: vendorData.email,
      address: vendorData.address,
      district: vendorData.district,
      state: vendorData.state,
      pinCode: vendorData.pinCode,
      status: vendorData.status,
      notes: vendorData.notes,
    });
    return res.data?.data || null;
  } catch (err) {
    console.error('updateMiddlemanVendorApi error:', err);
    throw err;
  }
}

export async function fetchMiddlemanVendorSalesApi(params = {}) {
  try {
    const effectiveParams = { pageSize: 1000, page: 1, ...params };
    const res = await api.get(Endpoints.MIDDLEMAN_VENDOR_SALES.BASE, { params: effectiveParams });
    const data = res.data?.data;
    if (data && Array.isArray(data.items)) {
      return data.items;
    }
    if (Array.isArray(data)) {
      return data;
    }
    return [];
  } catch (err) {
    console.warn('fetchMiddlemanVendorSalesApi fallback to local:', err?.message || err);
    return null;
  }
}

export async function fetchMiddlemanVendorSaleByIdApi(id) {
  try {
    const res = await api.get(Endpoints.MIDDLEMAN_VENDOR_SALES.BY_ID(id));
    return res.data?.data || null;
  } catch (err) {
    console.warn('fetchMiddlemanVendorSaleByIdApi fallback:', err?.message || err);
    return null;
  }
}

export async function createMiddlemanVendorSaleApi(saleData) {
  try {
    const res = await api.post(Endpoints.MIDDLEMAN_VENDOR_SALES.BASE, {
      vendorId: saleData.vendorId,
      vendorName: saleData.vendorName || saleData.businessName,
      businessName: saleData.businessName,
      cropName: saleData.cropName,
      variety: saleData.variety || 'Standard',
      quality: saleData.quality || 'Grade A',
      qualityGrade: saleData.quality || 'Grade A',
      quantity: Number(saleData.quantity) || 0,
      unit: saleData.unit || 'Quintal',
      rate: Number(saleData.rate) || 0,
      pricePerQuintal: Number(saleData.rate) || 0,
      transportation: Number(saleData.transportation) || 0,
      transportationCharges: Number(saleData.transportation) || 0,
      otherCharges: Number(saleData.otherCharges) || 0,
      salesDate: saleData.salesDate || new Date().toISOString().slice(0, 10),
      expectedDeliveryDate: saleData.expectedDeliveryDate || null,
      expectedPaymentDate: saleData.expectedPaymentDate || null,
      deliveryLocation: saleData.deliveryLocation || null,
      notes: saleData.notes || null,
      isDraft: Boolean(saleData.isDraft),
    });
    return res.data?.data || null;
  } catch (err) {
    console.error('createMiddlemanVendorSaleApi error:', err);
    throw err;
  }
}

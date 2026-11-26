import api from '../API/Config';
import Endpoints from '../API/Endpoints';

/**
 * Middleman Vendor API Service
 * Handles live synchronization between React frontend and Middleman Vendor & Vendor Sales endpoints:
 * - GET  /api/v1/middleman/vendors
 * - POST /api/v1/middleman/vendors
 * - GET  /api/v1/middleman/vendors/{id}
 * - PUT  /api/v1/middleman/vendors/{id}
 * - GET  /api/v1/middleman/vendor-sales
 * - POST /api/v1/middleman/vendor-sales
 * - GET  /api/v1/middleman/vendor-sales/{id}
 */

export function mapMiddlemanVendorDto(dto = {}, existing = {}) {
  if (!dto || typeof dto !== 'object') return existing;
  return {
    ...existing,
    id: dto.id ?? existing.id ?? null,
    vendorId: dto.vendorId || dto.vendorCode || existing.vendorId || (dto.id ? `VEN-${String(dto.id).padStart(4, '0')}` : ''),
    businessName: dto.businessName || existing.businessName || '',
    ownerName: dto.ownerName || existing.ownerName || '',
    mobile: dto.mobile || existing.mobile || '',
    email: dto.email ?? existing.email ?? '',
    businessType: dto.businessType || existing.businessType || 'Wholesaler',
    gstNumber: dto.gstNumber || dto.gstin || existing.gstNumber || '',
    address: dto.address ?? existing.address ?? '',
    district: dto.district || existing.district || '',
    state: dto.state || existing.state || 'Andhra Pradesh',
    pinCode: dto.pinCode ?? existing.pinCode ?? '',
    totalPurchases: Number(dto.totalPurchases ?? dto.orders ?? existing.totalPurchases ?? 0),
    totalPurchaseValue: Number(dto.totalPurchaseValue ?? dto.totalValue ?? existing.totalPurchaseValue ?? 0),
    outstandingReceivables: Number(dto.outstandingReceivables ?? existing.outstandingReceivables ?? 0),
    status: dto.status || existing.status || 'Active',
    notes: dto.notes ?? existing.notes ?? '',
  };
}

export function mapMiddlemanVendorSaleRecordDto(dto = {}, existing = {}) {
  if (!dto || typeof dto !== 'object') return existing;
  const quantity = Number(dto.quantity ?? existing.quantity ?? 0);
  const rate = Number(dto.rate ?? dto.pricePerQuintal ?? existing.rate ?? 0);
  const subtotal = Number(dto.subtotal ?? quantity * rate);
  const transportation = Number(dto.transportation ?? dto.transportationCharges ?? existing.transportation ?? 0);
  const otherCharges = Number(dto.otherCharges ?? existing.otherCharges ?? 0);
  const totalAmount = Number(dto.totalAmount ?? subtotal + transportation + otherCharges);
  return {
    ...existing,
    id: dto.id ?? existing.id ?? null,
    saleId: dto.saleId || dto.saleCode || existing.saleId || (dto.id ? `SAL-${String(dto.id).padStart(4, '0')}` : ''),
    vendorId: dto.vendorId || existing.vendorId || '',
    vendorName: dto.vendorName || dto.businessName || existing.vendorName || '',
    businessName: dto.businessName || dto.vendorName || existing.businessName || '',
    ownerName: dto.ownerName ?? existing.ownerName ?? '',
    mobile: dto.mobile ?? existing.mobile ?? '',
    cropName: dto.cropName || existing.cropName || '',
    variety: dto.variety || existing.variety || 'Standard',
    quality: dto.quality || dto.qualityGrade || existing.quality || 'Grade A',
    qualityGrade: dto.qualityGrade || dto.quality || existing.qualityGrade || 'Grade A',
    quantity,
    unit: dto.unit || existing.unit || 'Quintal',
    rate,
    subtotal,
    transportation,
    otherCharges,
    totalAmount,
    salesDate: dto.salesDate ? String(dto.salesDate).slice(0, 10) : existing.salesDate || new Date().toISOString().slice(0, 10),
    expectedDeliveryDate: dto.expectedDeliveryDate ? String(dto.expectedDeliveryDate).slice(0, 10) : existing.expectedDeliveryDate || '',
    expectedPaymentDate: dto.expectedPaymentDate ? String(dto.expectedPaymentDate).slice(0, 10) : existing.expectedPaymentDate || '',
    deliveryLocation: dto.deliveryLocation ?? existing.deliveryLocation ?? '',
    otpStatus: dto.otpStatus || existing.otpStatus || 'Pending',
    confirmationDate: dto.confirmationDate ?? existing.confirmationDate ?? null,
    status: dto.status || existing.status || 'Pending Confirmation',
    cogs: Number(dto.cogs ?? existing.cogs ?? 0),
    notes: dto.notes ?? existing.notes ?? '',
  };
}

export async function fetchMiddlemanVendorsApi(params = {}) {
  try {
    const effectiveParams = { pageSize: 1000, page: 1, ...params };
    const res = await api.get(Endpoints.MiddlemanVendors.getAll, { params: effectiveParams });
    const data = res.data?.data ?? res.data;
    const list = Array.isArray(data?.items)
      ? data.items
      : Array.isArray(data)
        ? data
        : [];
    return list.map((item) => mapMiddlemanVendorDto(item));
  } catch (err) {
    console.warn('fetchMiddlemanVendorsApi fallback to local:', err?.message || err);
    return null;
  }
}

export async function fetchMiddlemanVendorByIdApi(id) {
  if (!id) return null;
  try {
    const res = await api.get(Endpoints.MiddlemanVendors.getById(id));
    const dto = res.data?.data ?? res.data;
    return dto ? mapMiddlemanVendorDto(dto) : null;
  } catch (err) {
    console.warn('fetchMiddlemanVendorByIdApi fallback:', err?.message || err);
    return null;
  }
}

export async function registerMiddlemanVendorApi(vendorData) {
  try {
      const res = await api.post(Endpoints.MiddlemanVendors.create, {
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
      const dto = res.data?.data ?? res.data;
      return dto ? mapMiddlemanVendorDto(dto, vendorData) : null;
    } catch (err) {
      console.error('registerMiddlemanVendorApi error:', err);
      throw err;
    }
  }

export async function updateMiddlemanVendorApi(id, vendorData) {
    if (!id) return null;
    try {
        const res = await api.put(Endpoints.MiddlemanVendors.update(id), {
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
        const dto = res.data?.data ?? res.data;
        return dto ? mapMiddlemanVendorDto(dto, vendorData) : null;
      } catch (err) {
        console.error('updateMiddlemanVendorApi error:', err);
        throw err;
      }
    }

export async function fetchMiddlemanVendorSalesApi(params = {}) {
      try {
        const effectiveParams = { pageSize: 1000, page: 1, ...params };
        const res = await api.get(Endpoints.MiddlemanVendorSales.getAll, { params: effectiveParams });
        const data = res.data?.data ?? res.data;
        const list = Array.isArray(data?.items)
          ? data.items
          : Array.isArray(data)
            ? data
            : [];
        return list.map((item) => mapMiddlemanVendorSaleRecordDto(item));
      } catch (err) {
        console.warn('fetchMiddlemanVendorSalesApi fallback to local:', err?.message || err);
        return null;
      }
    }

    export async function fetchMiddlemanVendorSaleByIdApi(id) {
      if (!id) return null;
      try {
        const res = await api.get(Endpoints.MiddlemanVendorSales.getById(id));
        const dto = res.data?.data ?? res.data;
        return dto ? mapMiddlemanVendorSaleRecordDto(dto) : null;
      } catch (err) {
        console.warn('fetchMiddlemanVendorSaleByIdApi fallback:', err?.message || err);
        return null;
      }
    }

    export async function createMiddlemanVendorSaleApi(saleData) {
      try {
          const res = await api.post(Endpoints.MiddlemanVendorSales.create, {
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
          const dto = res.data?.data ?? res.data;
          return dto ? mapMiddlemanVendorSaleRecordDto(dto, saleData) : null;
        } catch (err) {
          console.error('createMiddlemanVendorSaleApi error:', err);
          throw err;
        }
      }

import api from '../API/Config';
import Endpoints from '../API/Endpoints';

/**
 * Middleman Customer API Service
 * Handles live synchronization between React frontend and Middleman Customer & Customer Sales endpoints.
 */

export function mapMiddlemanCustomerDto(dto) {
  if (!dto) return null;
  return {
    id: dto.id || dto.customerId,
    customerId: dto.customerId || `CUST-${dto.id}`,
    name: dto.name || '',
    mobile: dto.mobile || '',
    email: dto.email || '',
    address: dto.address || '',
    district: dto.district || '',
    state: dto.state || 'Andhra Pradesh',
    pinCode: dto.pinCode || '',
    totalPurchases: dto.totalPurchases || 0,
    totalPurchaseValue: dto.totalPurchaseValue || 0,
    outstandingReceivables: dto.outstandingReceivables || 0,
    status: dto.status || 'Active',
    notes: dto.notes || '',
    createdAt: dto.createdAt || new Date().toISOString(),
  };
}

export function mapMiddlemanCustomerSaleDto(dto) {
  if (!dto) return null;
  return {
    id: dto.id || dto.saleId,
    saleId: dto.saleId || `CUS-SAL-${dto.id}`,
    customerId: dto.customerId || '',
    customerName: dto.customerName || 'Direct Customer',
    mobile: dto.mobile || '',
    cropName: dto.cropName || '',
    variety: dto.variety || 'Standard',
    quantity: Number(dto.quantity) || 0,
    unit: dto.unit || 'Quintal',
    price: Number(dto.rate) || 0,
    rate: Number(dto.rate) || 0,
    subtotal: Number(dto.subtotal) || 0,
    deliveryCharges: Number(dto.deliveryCharges) || 0,
    finalAmount: Number(dto.finalAmount) || 0,
    salesDate: dto.salesDate ? dto.salesDate.slice(0, 10) : new Date().toISOString().slice(0, 10),
    expectedPaymentDate: dto.expectedPaymentDate ? dto.expectedPaymentDate.slice(0, 10) : null,
    status: dto.status || (dto.otpStatus === 'Draft' ? 'Draft' : 'Pending Confirmation'),
    otpStatus: dto.otpStatus || 'Pending',
    confirmationDate: dto.confirmationDate || null,
    notes: dto.notes || '',
  };
}

export async function fetchMiddlemanCustomersApi(params = {}) {
  try {
    const res = await api.get(Endpoints.MiddlemanCustomers.getAll, { params });
    const data = res.data?.data;
    if (data && Array.isArray(data.items)) {
      return data.items.map(mapMiddlemanCustomerDto);
    }
    if (Array.isArray(data)) {
      return data.map(mapMiddlemanCustomerDto);
    }
    return [];
  } catch (err) {
    console.warn('fetchMiddlemanCustomersApi fallback to local:', err?.message || err);
    return null;
  }
}

export async function fetchMiddlemanCustomerByIdApi(id) {
  try {
    const res = await api.get(Endpoints.MiddlemanCustomers.getById(id));
    const data = res.data?.data;
    return data ? mapMiddlemanCustomerDto(data) : null;
  } catch (err) {
    console.warn('fetchMiddlemanCustomerByIdApi fallback:', err?.message || err);
    return null;
  }
}

export async function registerMiddlemanCustomerApi(customerData) {
  try {
    const res = await api.post(Endpoints.MiddlemanCustomers.create, {
      name: customerData.name,
      mobile: customerData.mobile,
      email: customerData.email || null,
      address: customerData.address || null,
      district: customerData.district,
      state: customerData.state || 'Andhra Pradesh',
      pinCode: customerData.pinCode || null,
      notes: customerData.notes || null,
    });
    const data = res.data?.data;
    return data ? mapMiddlemanCustomerDto(data) : null;
  } catch (err) {
    console.error('registerMiddlemanCustomerApi error:', err);
    throw err;
  }
}

export async function updateMiddlemanCustomerApi(id, customerData) {
  try {
    const res = await api.put(Endpoints.MiddlemanCustomers.update(id), {
      name: customerData.name,
      mobile: customerData.mobile,
      email: customerData.email || null,
      address: customerData.address || null,
      district: customerData.district,
      state: customerData.state || 'Andhra Pradesh',
      pinCode: customerData.pinCode || null,
      status: customerData.status || 'Active',
      notes: customerData.notes || null,
    });
    const data = res.data?.data;
    return data ? mapMiddlemanCustomerDto(data) : null;
  } catch (err) {
    console.error('updateMiddlemanCustomerApi error:', err);
    throw err;
  }
}

export async function fetchMiddlemanCustomerSalesApi(params = {}) {
  try {
    const res = await api.get(Endpoints.MiddlemanCustomerSales.getAll, { params });
    const data = res.data?.data;
    if (data && Array.isArray(data.items)) {
      return data.items.map(mapMiddlemanCustomerSaleDto);
    }
    if (Array.isArray(data)) {
      return data.map(mapMiddlemanCustomerSaleDto);
    }
    return [];
  } catch (err) {
    console.warn('fetchMiddlemanCustomerSalesApi fallback:', err?.message || err);
    return null;
  }
}

export async function createMiddlemanCustomerSaleApi(saleData, isDraft = false) {
  try {
    const res = await api.post(Endpoints.MiddlemanCustomerSales.create, {
      customerId: saleData.customerId || null,
      customerName: saleData.customerName || 'Direct Customer',
      mobile: saleData.mobile || null,
      cropName: saleData.cropName || '',
      variety: saleData.variety || 'Standard',
      quantity: Number(saleData.quantity) || 0,
      unit: saleData.unit || 'Quintal',
      rate: Number(saleData.rate || saleData.price) || 0,
      subtotal: Number(saleData.subtotal) || 0,
      deliveryCharges: Number(saleData.deliveryCharges) || 0,
      finalAmount: Number(saleData.finalAmount) || 0,
      salesDate: saleData.salesDate ? new Date(saleData.salesDate).toISOString() : new Date().toISOString(),
      expectedPaymentDate: saleData.expectedPaymentDate ? new Date(saleData.expectedPaymentDate).toISOString() : null,
      isDraft: Boolean(isDraft),
      notes: saleData.notes || null,
    });
    const data = res.data?.data;
    return data ? mapMiddlemanCustomerSaleDto(data) : null;
  } catch (err) {
    console.error('createMiddlemanCustomerSaleApi error:', err);
    throw err;
  }
}

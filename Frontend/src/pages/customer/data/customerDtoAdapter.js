/**
 * DTO Adapter for ARPPB Customer Portal
 * Maps live backend API DTOs to UI component expectations.
 */

import { createAgriArtwork } from './productArtwork';
import { CATEGORY_CATALOG } from './customerData';

export function resolveProductArtwork(name = '', category = '') {
  const normName = String(name || '').toLowerCase();
  const normCat = String(category || '').toLowerCase();

  let palette = 'foodGrains';
  let motif = 'grains';
  let tag = 'RAW GRAIN';

  if (normCat.includes('pulse') || normName.includes('gram') || normName.includes('moong')) {
    palette = 'pulses';
    motif = 'pulses';
    tag = 'PULSE';
  } else if (normCat.includes('oil') || normName.includes('seed') || normName.includes('groundnut') || normName.includes('mustard')) {
    palette = 'oilSeeds';
    motif = 'oilSeeds';
    tag = 'OIL SEED';
  } else if (normCat.includes('spice') || normName.includes('chilli') || normName.includes('turmeric') || normName.includes('coriander')) {
    palette = 'spices';
    motif = 'spices';
    tag = 'RAW SPICE';
  } else if (normCat.includes('commercial') || normName.includes('cotton') || normName.includes('sugarcane')) {
    palette = 'commercial';
    motif = 'commercial';
    tag = 'COMMERCIAL';
  }

  return createAgriArtwork({
    palette,
    motif,
    label: name || 'Agri Commodity',
    tag,
  });
}

export function normalizeSellerType(rawType, fallbackCategory = '') {
  const val = String(rawType || fallbackCategory || '').trim().toLowerCase();
  if (val.includes('farmer')) return 'Farmer';
  if (val.includes('middleman')) return 'Middleman';
  return 'Vendor';
}

export function mapBackendProductToUiProduct(dto = {}) {
  if (!dto || typeof dto !== 'object') return null;

  const id = dto.id;
  const sellerType = normalizeSellerType(dto.sellerType, dto.sellerCategory);
  const sellerProductId = dto.sellerProductId ?? id;
  const productKey = `${sellerType}:${sellerProductId}`;
  const name = dto.name || 'Agri Produce';
  const category = dto.category || 'Food Grains & Cereals';
  const price = Number(dto.price) || 0;
  const unit = dto.unit || 'Kg';
  const availableQuantity = Number(dto.availableQuantity) || 0;
  const stockStatus =
    dto.stockStatus ||
    (availableQuantity > 20 ? 'In Stock' : availableQuantity > 0 ? 'Low Stock' : 'Out of Stock');
  const qualityGrade = dto.qualityGrade || 'Grade A';
  const district = dto.district || 'Guntur';
  const state = dto.state || 'Andhra Pradesh';
  const location = dto.location || `${district}, ${state}`;
  const sellerName = dto.sellerName || dto.vendorBusinessName || `Verified ${sellerType}`;
  const sellerCategory = dto.sellerCategory || sellerType;
  const batchCode = dto.batchCode || `BATCH-${id}`;
  const addedDate = dto.createdAt ? String(dto.createdAt).slice(0, 10) : '2026-11-20';
  const image = dto.image || resolveProductArtwork(name, category);

  return {
    id,
    sellerProductId,
    sellerType,
    productKey,
    name,
    category,
    price,
    unit,
    availableQuantity,
    stockStatus,
    qualityGrade,
    location,
    district,
    state,
    sellerName,
    sellerCategory,
    vendorId: dto.vendorId || null,
    sellerId: dto.sellerId || dto.vendorId || null,
    batchCode,
    addedDate,
    isPopular: Boolean(dto.isPopular ?? true),
    isBestPrice: Boolean(dto.isBestPrice ?? (price <= 2500)),
    image,
    minOrderQty: dto.minOrderQty || 1,
  };
}

export function mapBackendCategoryToUiCategory(catDto = {}) {
  const catName = typeof catDto === 'string' ? catDto : catDto.category || catDto.name;
  if (!catName) return null;

  const matched = CATEGORY_CATALOG.find(
    (c) => c.name.toLowerCase() === catName.toLowerCase()
  );

  if (matched) {
    return {
      ...matched,
      productCount: catDto.productCount ?? matched.productCount ?? 0,
    };
  }

  const slug = catName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  return {
    id: slug,
    name: catName,
    productCount: catDto.productCount ?? 0,
    description: `Freshly harvested ${catName} directly from verified agricultural producers and processors.`,
    image: resolveProductArtwork(catName, catName),
    badge: 'Verified Produce',
  };
}

export function mapBackendOrderToUiOrder(dto = {}) {
  if (!dto || typeof dto !== 'object') return null;

  const id = dto.orderId || (typeof dto.id === 'number' ? `ORD-2026-${String(dto.id).padStart(4, '0')}` : String(dto.id));
  const orderId = dto.orderId || id;
  const transactionId = dto.transactionId || `TXN-${dto.id || 101}`;
  const orderDate = dto.orderDate ? (dto.orderDate.includes('T') ? dto.orderDate.split('T')[0] : dto.orderDate) : '2026-11-23';
  const product = dto.product || dto.productName || 'Agri Commodity';
  const category = dto.category || 'Food Grains & Cereals';
  const quantity = Number(dto.quantity) || 1;
  const unit = dto.unit || 'Kg';
  const totalAmount = Number(dto.totalAmount) || 0;
  const unitPrice = dto.unitPrice ? Number(dto.unitPrice) : quantity > 0 ? Number((totalAmount / quantity).toFixed(2)) : 0;
  const orderStatus = dto.orderStatus || 'New';
  const expectedDeliveryDate = dto.expectedDeliveryDate ? (dto.expectedDeliveryDate.includes('T') ? dto.expectedDeliveryDate.split('T')[0] : dto.expectedDeliveryDate) : '';
  const expectedPaymentDate = dto.expectedPaymentDate ? (dto.expectedPaymentDate.includes('T') ? dto.expectedPaymentDate.split('T')[0] : dto.expectedPaymentDate) : '';
  const batchReference = dto.batchReference || `BATCH-${dto.id || 1}`;
  const deliveryAddress = dto.deliveryAddress || '';
  const sellerName = dto.sellerName || 'Verified Vendor';
  const sellerCategory = dto.sellerCategory || 'Wholesale Vendor';
  const sellerType = normalizeSellerType(dto.sellerType, sellerCategory);
  const otpStatus = dto.otpStatus || '';
  const items = Array.isArray(dto.items)
    ? dto.items.map((it) => ({
        id: it.id,
        productName: it.productName || it.name || 'Agri Commodity',
        category: it.category || category,
        sellerType: normalizeSellerType(it.sellerType, it.sellerCategory || sellerType),
        sellerName: it.sellerName || sellerName,
        quantity: Number(it.quantity) || 1,
        unit: it.unit || unit,
        pricePerUnit: Number(it.pricePerUnit ?? it.unitPrice) || 0,
        lineTotal: Number(it.lineTotal) || 0,
        itemStatus: it.itemStatus || orderStatus,
      }))
    : [];

  const timeline = Array.isArray(dto.timeline) && dto.timeline.length > 0
    ? dto.timeline
    : [
        {
          status: orderStatus,
          timestamp: orderDate,
          note: `Order recorded in status ${orderStatus}.`,
        },
      ];

  return {
    id,
    orderId,
    transactionId,
    orderDate,
    productId: dto.productId || null,
    product,
    category,
    sellerName,
    sellerCategory,
    sellerType,
    otpStatus,
    items,
    quantity,
    unit,
    unitPrice,
    totalAmount,
    orderStatus,
    expectedDeliveryDate,
    expectedPaymentDate,
    otpId: dto.otpId || `OTP-${id}`,
    deliveryAddress,
    batchReference,
    timeline,
  };
}

export function mapBackendPurchaseToUiPurchase(dto = {}) {
  if (!dto || typeof dto !== 'object') return null;

  const id = dto.id;
  const transactionId = dto.transactionId || `TXN-${id}`;
  const orderId = dto.orderId || `ORD-${id}`;
  const purchaseDate = dto.purchaseDate ? (dto.purchaseDate.includes('T') ? dto.purchaseDate.split('T')[0] : dto.purchaseDate) : '2026-11-23';
  const productName = dto.productName || dto.product || 'Agri Commodity';
  const category = dto.category || 'Agri Purchase';
  const sellerName = dto.sellerName || 'Verified Vendor';
  const sellerCategory = dto.sellerCategory || 'Wholesale Vendor';
  const quantity = typeof dto.quantity === 'string' ? dto.quantity : `${dto.quantity || 1} ${dto.unit || 'Kg'}`;
  const unitPrice = Number(dto.unitPrice) || 0;
  const totalAmount = Number(dto.totalAmount) || 0;
  const expectedPaymentDate = dto.expectedPaymentDate ? (dto.expectedPaymentDate.includes('T') ? dto.expectedPaymentDate.split('T')[0] : dto.expectedPaymentDate) : '';
  const status = dto.status || 'Confirmed';
  const location = dto.location || 'Local Mandi';
  const batchReference = dto.batchReference || 'OTP-VERIFIED';

  return {
    id,
    saleId: dto.saleId,
    transactionId,
    orderId,
    purchaseDate,
    productName,
    category,
    sellerName,
    sellerCategory,
    quantity,
    unitPrice,
    totalAmount,
    expectedPaymentDate,
    status,
    location,
    batchReference,
  };
}

export function mapBackendConfirmationToUiConfirmation(dto = {}, customerId = '') {
  if (!dto || typeof dto !== 'object') return null;

  const rawId = dto.id;
  const id = dto.confirmationCode || (typeof rawId === 'number' ? `OTP-${String(rawId).padStart(4, '0')}` : String(rawId));
  const transactionId = dto.transactionId || `TXN-${rawId}`;
  const orderId = dto.orderId || `ORD-${rawId}`;
  const product = dto.product || 'Agri Commodity';
  const unit = dto.unit || 'Kg';
  const quantity = typeof dto.quantity === 'string' ? dto.quantity : `${dto.quantity || 1} ${unit}`;
  const unitPrice = Number(dto.unitPrice) || 0;
  const totalAmount = Number(dto.totalAmount) || 0;
  const requestDate = dto.requestDate ? dto.requestDate.replace('T', ' ').slice(0, 19) : '';
  const otpStatus = dto.otpStatus === 'Verified' ? 'Confirmed' : dto.otpStatus || 'Pending';
  const isActiveStatus = otpStatus === 'Pending' || otpStatus === 'Sent';
  const sellerName = dto.sellerName || 'Verified Vendor';
  const sellerCategory = dto.sellerCategory || 'Wholesale Vendor';
  const sellerSummary = dto.sellerSummary || sellerName;
  const otpScope = dto.otpScope || 'Master';

  let expirySecondsRemaining = 0;
  if (dto.expiresAt) {
    const diffSec = Math.floor((new Date(dto.expiresAt).getTime() - Date.now()) / 1000);
    expirySecondsRemaining = Number.isFinite(diffSec) ? Math.max(0, diffSec) : 0;
  }

  const isUnexpired = !dto.expiresAt || expirySecondsRemaining > 0;
  const activeOtpCode =
    isActiveStatus && isUnexpired
      ? dto.activeOtpCode || dto.demoOtpCode || dto.devOtp || ''
      : '';

  const auditHistory = Array.isArray(dto.auditHistory) && dto.auditHistory.length > 0
    ? dto.auditHistory
    : [
        {
          timestamp: requestDate || '2026-11-23 00:00:00',
          status: otpStatus,
          note: `Confirmation request in status ${otpStatus}.`,
        },
      ];

  return {
    id,
    rawId,
    confirmationCode: dto.confirmationCode || id,
    transactionId,
    orderId,
    otpScope,
    sellerName,
    sellerSummary,
    sellerCategory,
    receivingPartyId: customerId || 'CUS-1001',
    receivingPartyRole: 'Customer',
    product,
    quantity,
    unitPrice,
    totalAmount,
    requestDate,
    otpStatus,
    activeOtpCode,
    demoOtpCode: activeOtpCode,
    expiresAt: dto.expiresAt,
    expirySecondsRemaining,
    attemptsUsed: Number(dto.attemptsUsed) || 0,
    maxAttempts: Number(dto.maxAttempts) || 3,
    confirmedAt: dto.confirmedAt || '',
    rejectionReason: dto.rejectionReason || '',
    confirmationMessage: otpStatus === 'Confirmed' ? 'Transaction Confirmed Successfully!' : '',
    attemptHistory: auditHistory,
  };
}

export function mapBackendNotificationToUiNotification(dto = {}) {
  if (!dto || typeof dto !== 'object') return null;

  const id = dto.id;
  const title = dto.title || 'Notification';
  const description = dto.description || '';
  const type = dto.type || 'Order Update';
  const priority = dto.priority || 'Medium';
  const isRead = Boolean(dto.isRead);
  const timestamp = dto.createdAt ? dto.createdAt.replace('T', ' ').slice(0, 16) : '';
  const relatedId = dto.relatedId || dto.orderCode || dto.transactionCode || '';

  let targetPath = '/customer/orders';
  if (type.includes('OTP') || title.includes('OTP')) {
    targetPath = '/customer/confirmations';
  } else if (type.includes('Purchase') || title.includes('Purchase')) {
    targetPath = '/customer/purchase-history';
  }

  return {
    id,
    title,
    description,
    type,
    priority,
    isRead,
    timestamp,
    relatedId,
    targetPath,
  };
}


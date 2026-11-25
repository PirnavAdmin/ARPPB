/**
 * Vendor Portal Comprehensive API Service Layer
 * Integrates all Vendor Portal modules with backend endpoints via src/API/Config.js and src/API/Endpoints.js:
 * - VendorDashboard
 * - VendorFarmers
 * - VendorMiddlemen
 * - VendorCustomers
 * - VendorRawMaterialInventory
 * - VendorProcessing
 * - VendorFinishedProducts
 * - VendorSales
 * - VendorOrders
 * - VendorConfirmations
 * - VendorLedger
 * - VendorNotifications
 */

import api from '../API/Config';
import Endpoints from '../API/Endpoints';

/* ==========================================================================
   HELPER: EXTRACT ARRAY LIST FROM API RESPONSE
   ========================================================================== */
function extractList(res, keys = ['items', 'records', 'batches', 'list', 'data']) {
  const data = res?.data?.data ?? res?.data;
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object') {
    for (const k of keys) {
      if (Array.isArray(data[k])) return data[k];
    }
  }
  return null;
}

/* ==========================================================================
   DTO MAPPERS FOR VENDOR PORTAL
   ========================================================================== */

export function mapVendorFarmerDto(dto = {}, existing = {}) {
  if (!dto || typeof dto !== 'object') return existing;
  const rawId = dto.id ?? dto.farmerId ?? existing.rawId ?? null;
  const id =
    dto.farmerCode ||
    (typeof dto.id === 'string' && dto.id.startsWith('FARM-')
      ? dto.id
      : rawId
      ? `FARM-${String(rawId).padStart(4, '0')}`
      : existing.id || 'FARM-0001');

  const rawCrops =
    dto.availableCrops ??
    dto.registeredCrops ??
    dto.crops ??
    dto.primaryCrops ??
    existing.availableCrops ??
    [];
  const availableCrops = Array.isArray(rawCrops)
    ? rawCrops
    : typeof rawCrops === 'string'
    ? rawCrops
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean)
    : [];

  return {
    ...existing,
    rawId,
    id,
    farmerCode: dto.farmerCode || id,
    farmerName: dto.farmerName || dto.fullName || dto.name || existing.farmerName || '',
    fatherName: dto.fatherName ?? dto.fatherOrSpouseName ?? existing.fatherName ?? '',
    mobileNumber: dto.mobileNumber || dto.mobile || dto.phone || existing.mobileNumber || '',
    email: dto.email ?? existing.email ?? '',
    village: dto.village || existing.village || '',
    mandal: dto.mandal ?? existing.mandal ?? '',
    district: dto.district || existing.district || '',
    state: dto.state || existing.state || 'Andhra Pradesh',
    pinCode: dto.pinCode ?? existing.pinCode ?? '',
    landAcres: Number(dto.landAcres ?? existing.landAcres ?? 0),
    availableCrops,
    address: dto.address || dto.completeAddress || existing.address || '',
    aadhaarId: dto.aadhaarId || dto.aadhaarNumber || existing.aadhaarId || '',
    bankName: dto.bankName || dto.bankDetails?.bankName || existing.bankName || '',
    accountNumber:
      dto.accountNumber ||
      dto.bankAccountNumber ||
      dto.bankDetails?.accountNumber ||
      existing.accountNumber ||
      '',
    ifscCode: dto.ifscCode || dto.bankDetails?.ifscCode || existing.ifscCode || '',
    totalPurchases: Number(dto.totalPurchases ?? existing.totalPurchases ?? 0),
    totalQuantity: Number(
      dto.totalPurchaseQuantity ?? dto.totalQuantity ?? existing.totalQuantity ?? 0
    ),
    totalPurchaseValue: Number(
      dto.totalPurchaseAmount ?? dto.totalPurchaseValue ?? existing.totalPurchaseValue ?? 0
    ),
    pendingPayables: Number(dto.dueAmount ?? dto.pendingPayables ?? existing.pendingPayables ?? 0),
    status: dto.status || (dto.isActive === false ? 'Inactive' : existing.status || 'Active'),
    createdAt:
      dto.createdAt || dto.registeredAt
        ? String(dto.createdAt || dto.registeredAt).slice(0, 10)
        : existing.createdAt || new Date().toISOString().slice(0, 10),
  };
}

export function mapVendorMiddlemanDto(dto = {}, existing = {}) {
  if (!dto || typeof dto !== 'object') return existing;
  const rawId = dto.id ?? dto.middlemanId ?? existing.rawId ?? null;
  const id =
    dto.middlemanCode ||
    (typeof dto.id === 'string' && dto.id.startsWith('MID-')
      ? dto.id
      : rawId
      ? `MID-${String(rawId).padStart(4, '0')}`
      : existing.id || 'MID-0001');

  return {
    ...existing,
    rawId,
    id,
    middlemanCode: dto.middlemanCode || id,
    businessName: dto.businessName || dto.registeredBusinessName || existing.businessName || '',
    ownerName:
      dto.ownerName ||
      dto.fullName ||
      dto.middlemanName ||
      dto.contactPerson ||
      existing.ownerName ||
      '',
    mobileNumber: dto.mobileNumber || dto.mobile || existing.mobileNumber || '',
    email: dto.email ?? existing.email ?? '',
    gstNumber: dto.gstNumber || dto.gstin || existing.gstNumber || '',
    pan: dto.pan || dto.panNumber || existing.pan || '',
    address:
      dto.address ||
      dto.marketYardLocation ||
      dto.businessAddress ||
      existing.address ||
      '',
    village:
      dto.village ||
      dto.marketYardLocation ||
      dto.city ||
      existing.village ||
      '',
    district: dto.district || existing.district || '',
    state: dto.state || existing.state || 'Andhra Pradesh',
    pinCode: dto.pinCode ?? existing.pinCode ?? '',
    bankName: dto.bankName || dto.bankDetails?.bankName || existing.bankName || '',
    accountNumber:
      dto.accountNumber ||
      dto.bankAccountNumber ||
      dto.bankDetails?.accountNumber ||
      existing.accountNumber ||
      '',
    ifscCode: dto.ifscCode || dto.bankDetails?.ifscCode || existing.ifscCode || '',
    openingBalance: Number(dto.openingBalance ?? existing.openingBalance ?? 0),
    totalTransactions: Number(
      dto.totalTransactions ?? dto.totalTransactionsCount ?? existing.totalTransactions ?? 0
    ),
    totalPurchases: Number(
      dto.totalTransactions ?? dto.totalTransactionsCount ?? dto.totalPurchases ?? existing.totalPurchases ?? 0
    ),
    totalQuantity: Number(
      dto.totalTransactionQuantity ?? dto.totalTransactionsQuantity ?? dto.totalQuantity ?? existing.totalQuantity ?? 0
    ),
    purchaseValue: Number(
      dto.totalTransactionAmount ?? dto.purchaseValue ?? existing.purchaseValue ?? 0
    ),
    totalPurchaseValue: Number(
      dto.totalTransactionAmount ?? dto.totalPurchaseValue ?? existing.totalPurchaseValue ?? 0
    ),
    outstandingPayables: Number(
      dto.dueAmount ?? dto.outstandingPayables ?? existing.outstandingPayables ?? 0
    ),
    pendingPayables: Number(
      dto.dueAmount ?? dto.pendingPayables ?? existing.pendingPayables ?? 0
    ),
    status: dto.status || (dto.isActive === false ? 'Inactive' : existing.status || 'Active'),
    createdAt:
      dto.createdAt || dto.registeredAt
        ? String(dto.createdAt || dto.registeredAt).slice(0, 10)
        : existing.createdAt || new Date().toISOString().slice(0, 10),
  };
}

export function mapVendorCustomerDto(dto = {}, existing = {}) {
  if (!dto || typeof dto !== 'object') return existing;
  const rawId = dto.id ?? dto.customerId ?? existing.rawId ?? null;
  const customerUserId = dto.customerUserId ?? dto.customer_user_id ?? dto.userId ?? (existing.customerUserId || rawId);
  const id =
    dto.customerCode ||
    (typeof dto.id === 'string' && dto.id.startsWith('CUST-')
      ? dto.id
      : rawId
      ? `CUST-${String(rawId).padStart(4, '0')}`
      : existing.id || 'CUST-0001');

  return {
    ...existing,
    rawId,
    customerUserId,
    customerCode: dto.customerCode || id,
    id,
    customerName: dto.customerName || dto.fullName || dto.name || existing.customerName || '',
    businessName: dto.businessName || dto.companyName || existing.businessName || '',
    customerType: dto.customerType || existing.customerType || 'Wholesaler',
    mobileNumber: dto.mobileNumber || dto.mobile || existing.mobileNumber || '',
    email: dto.email ?? existing.email ?? '',
    gstNumber: dto.gstNumber || dto.gstin || existing.gstNumber || '',
    pan: dto.pan || dto.panNumber || existing.pan || '',
    address: dto.address || dto.deliveryAddress || existing.address || '',
    district: dto.district || existing.district || '',
    state: dto.state || existing.state || 'Andhra Pradesh',
    pinCode: dto.pinCode ?? existing.pinCode ?? '',
    creditLimit: Number(dto.creditLimit ?? existing.creditLimit ?? 0),
    openingBalance: Number(dto.openingBalance ?? existing.openingBalance ?? 0),
    bankName: dto.bankName || dto.bankDetails?.bankName || existing.bankName || '',
    accountNumber:
      dto.accountNumber ||
      dto.bankAccountNumber ||
      dto.bankDetails?.accountNumber ||
      existing.accountNumber ||
      '',
    ifscCode: dto.ifscCode || dto.bankDetails?.ifscCode || existing.ifscCode || '',
    totalOrders: Number(dto.totalOrders ?? existing.totalOrders ?? 0),
    totalPurchasedQty: Number(
      dto.totalPurchaseQuantity ?? dto.totalPurchasedQty ?? existing.totalPurchasedQty ?? 0
    ),
    totalPurchaseQuantity: Number(
      dto.totalPurchaseQuantity ?? dto.totalPurchaseQuantity ?? existing.totalPurchaseQuantity ?? 0
    ),
    totalPurchaseValue: Number(
      dto.totalSalesAmount ?? dto.totalPurchaseValue ?? existing.totalPurchaseValue ?? 0
    ),
    totalSalesAmount: Number(
      dto.totalSalesAmount ?? dto.totalSalesAmount ?? existing.totalSalesAmount ?? 0
    ),
    outstandingReceivables: Number(
      dto.dueAmount ?? dto.receivableAmount ?? dto.outstandingReceivables ?? existing.outstandingReceivables ?? 0
    ),
    receivableAmount: Number(
      dto.dueAmount ?? dto.receivableAmount ?? dto.receivableAmount ?? existing.receivableAmount ?? 0
    ),
    status: dto.status || (dto.isActive === false ? 'Inactive' : existing.status || 'Active'),
    createdAt: dto.createdAt
      ? String(dto.createdAt).slice(0, 10)
      : existing.createdAt || new Date().toISOString().slice(0, 10),
  };
}

export function mapVendorRawMaterialDto(dto = {}, existing = {}) {
  if (!dto || typeof dto !== 'object') return existing;
  const rawId = dto.id ?? dto.stockId ?? existing.rawId ?? null;
  const id =
    dto.stockCode ||
    (typeof dto.id === 'string' && dto.id.startsWith('STK-')
      ? dto.id
      : rawId
      ? `STK-${String(rawId).padStart(4, '0')}`
      : existing.id || 'STK-0001');

  const purchasedQuantity = Number(
    dto.purchasedQuantity ?? dto.initialQuantity ?? existing.purchasedQuantity ?? 0
  );
  const processedQuantity = Number(dto.processedQuantity ?? existing.processedQuantity ?? 0);
  const availableQuantity = Number(
    dto.availableQuantity ?? Math.max(0, purchasedQuantity - processedQuantity)
  );
  const minimumThreshold = Number(dto.minimumThreshold ?? existing.minimumThreshold ?? 15);

  return {
    ...existing,
    rawId,
    id,
    cropName: dto.cropName || dto.rawMaterial || existing.cropName || 'Paddy',
    cropVariety: dto.cropVariety || dto.variety || existing.cropVariety || 'Standard',
    supplierId: dto.supplierId || dto.supplierCode || existing.supplierId || '',
    supplierName: dto.supplierName || existing.supplierName || '',
    supplierCategory: dto.supplierCategory || existing.supplierCategory || 'Farmer',
    purchaseId: dto.purchaseId || dto.purchaseCode || existing.purchaseId || '',
    batchNumber: dto.batchNumber || dto.batchCode || existing.batchNumber || id,
    purchaseDate: dto.purchaseDate
      ? String(dto.purchaseDate).slice(0, 10)
      : existing.purchaseDate || new Date().toISOString().slice(0, 10),
    purchasedQuantity,
    processedQuantity,
    availableQuantity,
    minimumThreshold,
    unit: dto.unit || existing.unit || 'Quintal',
    averageCost: Number(dto.averageCost ?? dto.unitCost ?? existing.averageCost ?? 0),
    totalPurchaseCost: Number(
      dto.totalPurchaseCost ?? dto.totalCost ?? existing.totalPurchaseCost ?? 0
    ),
    qualityGrade: dto.qualityGrade || existing.qualityGrade || 'Grade A (Standard FAQ)',
    storageLocation:
      dto.storageLocation || existing.storageLocation || 'Kurnool Main Godown - Bay A1',
    status:
      dto.status ||
      (availableQuantity <= 0
        ? 'Exhausted'
        : availableQuantity <= minimumThreshold
        ? 'Low Stock'
        : 'In Stock'),
    relatedProcessingIds: Array.isArray(dto.relatedProcessingIds)
      ? dto.relatedProcessingIds
      : existing.relatedProcessingIds || [],
    relatedFinishedBatchIds: Array.isArray(dto.relatedFinishedBatchIds)
      ? dto.relatedFinishedBatchIds
      : existing.relatedFinishedBatchIds || [],
  };
}

export function mapVendorProcessingDto(dto = {}, existing = {}) {
  if (!dto || typeof dto !== 'object') return existing;
  const rawId = dto.id ?? dto.processingId ?? existing.rawId ?? null;
  const id =
    dto.processingCode ||
    (typeof dto.processingId === 'string' && dto.processingId.startsWith('PROC-')
      ? dto.processingId
      : typeof dto.id === 'string' && dto.id.startsWith('PROC-')
      ? dto.id
      : rawId
      ? `PROC-${String(rawId).padStart(4, '0')}`
      : existing.id || 'PROC-0001');

  const rawOutputs = Array.isArray(dto.outputs) ? dto.outputs : existing.outputs || [];
  const outputs = rawOutputs.map((o) => ({
    ...o,
    productName: o.productName || o.outputProductName || 'Processed Output',
    outputProductName: o.outputProductName || o.productName || 'Processed Output',
    outputQuantity: Number(o.outputQuantity ?? 0),
    outputUnit: o.outputUnit || o.unit || dto.inputUnit || 'Quintal',
    outputType: o.outputType || 'Main Product',
  }));

  return {
    ...existing,
    rawId,
    id,
    processingDate: dto.processingDate
      ? String(dto.processingDate).slice(0, 10)
      : existing.processingDate || new Date().toISOString().slice(0, 10),
    rawMaterial:
      dto.rawMaterial || dto.rawMaterialName || dto.cropName || existing.rawMaterial || 'Paddy',
    rawMaterialVariety:
      dto.rawMaterialVariety || dto.cropVariety || existing.rawMaterialVariety || 'Standard',
    stockId: dto.stockId || dto.sourceStockId || dto.rawMaterialStockId || existing.stockId || '',
    rawMaterialBatchNumber:
      dto.rawMaterialBatchNumber || dto.sourceStockId || existing.rawMaterialBatchNumber || '',
    supplierReference: dto.supplierReference || existing.supplierReference || '',
    originalPurchaseId: dto.originalPurchaseId || existing.originalPurchaseId || '',
    inputQuantity: Number(dto.inputQuantity ?? existing.inputQuantity ?? 0),
    inputUnit: dto.inputUnit || dto.unit || existing.inputUnit || 'Quintal',
    batchUnitCost: Number(dto.batchUnitCost ?? dto.unitCost ?? existing.batchUnitCost ?? 0),
    outputs,
    actualOutputQuantity: Number(
      dto.actualOutputQuantity ??
        (outputs.reduce((s, o) => s + Number(o.outputQuantity || 0), 0) ||
          existing.actualOutputQuantity ||
          0)
    ),
    outputUnit: dto.outputUnit || outputs[0]?.outputUnit || existing.outputUnit || 'Quintal',
    wastageQuantity: Number(dto.wastageQuantity ?? existing.wastageQuantity ?? 0),
    wastagePercentage: Number(dto.wastagePercentage ?? existing.wastagePercentage ?? 0),
    expenses: dto.expenses || existing.expenses || {},
    totalProcessingExpenses: Number(
      dto.totalProcessingExpenses ??
        dto.processingExpenses ??
        existing.totalProcessingExpenses ??
        0
    ),
    allocatedRawMaterialCost: Number(
      dto.allocatedRawMaterialCost ?? existing.allocatedRawMaterialCost ?? 0
    ),
    totalBatchCost: Number(dto.totalBatchCost ?? existing.totalBatchCost ?? 0),
    costPerUnit: Number(dto.costPerUnit ?? dto.unitCost ?? existing.costPerUnit ?? 0),
    processingLocation:
      dto.processingLocation ||
      existing.processingLocation ||
      'Kurnool Modern Processing Hub - Unit 1',
    batchNumber: dto.batchNumber || existing.batchNumber || id,
    operatorName: dto.operatorName || existing.operatorName || 'M. Veerabhadraiah',
    notes: dto.notes ?? existing.notes ?? '',
    status: dto.status || existing.status || 'Completed',
  };
}

export function mapVendorFinishedProductDto(dto = {}, existing = {}) {
  if (!dto || typeof dto !== 'object') return existing;
  const rawId = dto.id ?? existing.rawId ?? null;
  const id =
    dto.productCode ||
    (typeof dto.productId === 'string' && dto.productId.startsWith('PROD-')
      ? dto.productId
      : typeof dto.id === 'string' && dto.id.startsWith('PROD-')
      ? dto.id
      : rawId
      ? `PROD-${String(rawId).padStart(4, '0')}`
      : existing.id || 'PROD-0001');

  const sellingPrice = Number(dto.sellingPrice ?? dto.price ?? existing.sellingPrice ?? 0);
  const productionCost = Number(
    dto.productionCost ?? existing.productionCost ?? sellingPrice * 0.78
  );
  const profitMargin =
    dto.profitMargin !== undefined
      ? Number(dto.profitMargin)
      : dto.profitMarginPercentage !== undefined
      ? Number(dto.profitMarginPercentage)
      : sellingPrice > 0
      ? Number((((sellingPrice - productionCost) / sellingPrice) * 100).toFixed(2))
      : 0;

  return {
    ...existing,
    rawId,
    id,
    productName: dto.productName || dto.name || existing.productName || '',
    category: dto.category || existing.category || 'Food Grains & Cereals',
    sourceRawMaterial: dto.sourceRawMaterial || existing.sourceRawMaterial || 'Paddy',
    description: dto.description ?? existing.description ?? '',
    brandName: dto.brandName || existing.brandName || 'Rayalaseema Gold',
    imageUrl: dto.imageUrl ?? existing.imageUrl ?? '',
    packagingType:
      dto.packagingType || dto.packaging || existing.packagingType || 'PP Woven Bag',
    packageSize: dto.packageSize || dto.packaging || existing.packageSize || '50 Kg Bag',
    unit: dto.unit || existing.unit || 'Quintal',
    availableQuantity: Number(dto.availableQuantity ?? existing.availableQuantity ?? 0),
    reservedQuantity: Number(dto.reservedQuantity ?? existing.reservedQuantity ?? 0),
    soldQuantity: Number(dto.soldQuantity ?? existing.soldQuantity ?? 0),
    minimumStockLevel: Number(
      dto.minimumStockLevel ?? dto.minThresholdQuantity ?? existing.minimumStockLevel ?? 15
    ),
    manufacturingDate:
      dto.manufacturingDate || dto.mfgDate
        ? String(dto.manufacturingDate || dto.mfgDate).slice(0, 10)
        : existing.manufacturingDate || new Date().toISOString().slice(0, 10),
    expiryDate: dto.expiryDate
      ? String(dto.expiryDate).slice(0, 10)
      : existing.expiryDate || '',
    productionCost,
    sellingPrice,
    profitMargin,
    status: dto.status || (dto.isActive === false ? 'Inactive' : existing.status || 'Active'),
  };
}

export function mapVendorSaleDto(dto = {}, existing = {}) {
  if (!dto || typeof dto !== 'object') return existing;
  const rawId = dto.id ?? dto.saleId ?? existing.rawId ?? null;
  const id =
    dto.saleCode ||
    (typeof dto.id === 'string' && dto.id.startsWith('SALE-')
      ? dto.id
      : rawId
      ? `SALE-${String(rawId).padStart(4, '0')}`
      : existing.id || 'SALE-0001');

  return {
    ...existing,
    rawId,
    id,
    orderId: dto.orderCode || dto.orderId || existing.orderId || `ORD-${String(rawId || 1).padStart(4, '0')}`,
    customerId: dto.customerCode || dto.customerId || existing.customerId || 'CUST-0001',
    customerName: dto.customerName || existing.customerName || '',
    businessName: dto.businessName || existing.businessName || '',
    mobileNumber: dto.mobileNumber || dto.mobile || existing.mobileNumber || '',
    email: dto.email ?? existing.email ?? '',
    deliveryAddress: dto.deliveryAddress || existing.deliveryAddress || '',
    district: dto.district || existing.district || '',
    state: dto.state || existing.state || 'Andhra Pradesh',
    product: dto.product || dto.productName || existing.product || '',
    productId: dto.productCode || dto.productId || existing.productId || '',
    batchId: dto.batchId || existing.batchId || null,
    batchNumber: dto.batchNumber || existing.batchNumber || 'Standard Batch',
    quantity: Number(dto.quantity ?? existing.quantity ?? 0),
    unit: dto.unit || existing.unit || 'Quintal',
    unitPrice: Number(dto.unitPrice ?? dto.pricePerUnit ?? existing.unitPrice ?? 0),
    items: Array.isArray(dto.items) ? dto.items : existing.items || [],
    subtotal: Number(dto.subtotal ?? existing.subtotal ?? 0),
    discount: Number(dto.discount ?? existing.discount ?? 0),
    tax: Number(dto.tax ?? existing.tax ?? 0),
    deliveryCharges: Number(dto.deliveryCharges ?? existing.deliveryCharges ?? 0),
    otherCharges: Number(dto.otherCharges ?? existing.otherCharges ?? 0),
    totalAmount: Number(dto.totalAmount ?? dto.finalAmount ?? existing.totalAmount ?? 0),
    receivedAmount: Number(dto.receivedAmount ?? existing.receivedAmount ?? 0),
    salesDate: dto.salesDate
      ? String(dto.salesDate).slice(0, 10)
      : existing.salesDate || new Date().toISOString().slice(0, 10),
    expectedDeliveryDate: dto.expectedDeliveryDate
      ? String(dto.expectedDeliveryDate).slice(0, 10)
      : existing.expectedDeliveryDate || '',
    expectedPaymentDate: dto.expectedPaymentDate
      ? String(dto.expectedPaymentDate).slice(0, 10)
      : existing.expectedPaymentDate || '',
    paymentTerms: dto.paymentTerms || existing.paymentTerms || 'Net 15 Days',
    otpId: dto.otpId || existing.otpId || null,
    confirmationStatus: dto.confirmationStatus || dto.otpStatus || existing.confirmationStatus || 'Pending',
    paymentStatus: dto.paymentStatus || existing.paymentStatus || 'Pending',
    salesStatus: dto.salesStatus || dto.status || existing.salesStatus || 'New',
    stockAllocationStage: dto.stockAllocationStage || existing.stockAllocationStage || 'Reserved',
    notes: dto.notes ?? existing.notes ?? '',
  };
}

export function mapVendorOrderDto(dto = {}, existing = {}) {
  if (!dto || typeof dto !== 'object') return existing;
  const rawId = dto.id ?? dto.orderId ?? existing.rawId ?? null;
  const id =
    dto.orderCode ||
    (typeof dto.id === 'string' && dto.id.startsWith('ORD-')
      ? dto.id
      : rawId
      ? `ORD-${String(rawId).padStart(4, '0')}`
      : existing.id || 'ORD-0001');

  return {
    ...existing,
    rawId,
    id,
    salesId: dto.salesCode || dto.salesId || existing.salesId || '',
    customerId: dto.customerCode || dto.customerId || existing.customerId || '',
    customerName: dto.customerName || existing.customerName || '',
    businessName: dto.businessName || existing.businessName || '',
    mobileNumber: dto.mobileNumber || dto.mobile || existing.mobileNumber || '',
    deliveryAddress: dto.deliveryAddress || existing.deliveryAddress || '',
    product: dto.product || dto.productName || existing.product || '',
    productId: dto.productCode || dto.productId || existing.productId || '',
    batchReferences: Array.isArray(dto.batchReferences)
      ? dto.batchReferences
      : existing.batchReferences || [],
    quantity: Number(dto.quantity ?? existing.quantity ?? 0),
    unit: dto.unit || existing.unit || 'Quintal',
    price: Number(dto.price ?? dto.unitPrice ?? existing.price ?? 0),
    subtotal: Number(dto.subtotal ?? existing.subtotal ?? 0),
    discount: Number(dto.discount ?? existing.discount ?? 0),
    tax: Number(dto.tax ?? existing.tax ?? 0),
    deliveryCharges: Number(dto.deliveryCharges ?? existing.deliveryCharges ?? 0),
    totalAmount: Number(dto.totalAmount ?? existing.totalAmount ?? 0),
    orderDate: dto.orderDate
      ? String(dto.orderDate).slice(0, 10)
      : existing.orderDate || new Date().toISOString().slice(0, 10),
    expectedDeliveryDate: dto.expectedDeliveryDate
      ? String(dto.expectedDeliveryDate).slice(0, 10)
      : existing.expectedDeliveryDate || '',
    otpId: dto.otpId || existing.otpId || null,
    otpStatus: dto.otpStatus || existing.otpStatus || 'Pending',
    paymentStatus: dto.paymentStatus || existing.paymentStatus || 'Pending',
    orderStatus: dto.orderStatus || dto.status || existing.orderStatus || 'New',
    stockAllocationStage:
      dto.stockAllocationStage || existing.stockAllocationStage || 'Reserved',
    timeline: Array.isArray(dto.timeline) ? dto.timeline : existing.timeline || [],
  };
}

export function mapVendorConfirmationDto(dto = {}, existing = {}, topLevelDevOtp = null) {
  if (!dto || typeof dto !== 'object') return existing;
  const rawId = dto.id ?? dto.confirmationId ?? existing.rawId ?? null;
  const id =
    dto.confirmationCode ||
    (typeof dto.id === 'string' && dto.id.startsWith('OTP-')
      ? dto.id
      : rawId
      ? `OTP-${String(rawId).padStart(4, '0')}`
      : existing.id || 'OTP-0001');

  const rawOtp = topLevelDevOtp || dto.demoOtpCode || dto.devOtp || dto.sandboxOtp || '';
  const demoOtpCode = rawOtp
    ? String(rawOtp).replace(/^DEV-/i, '')
    : existing.demoOtpCode || '';

  return {
    ...existing,
    rawId,
    id,
    transactionId:
      dto.transactionId || dto.transactionCode || dto.referenceId || existing.transactionId || '',
    partyId: dto.partyId || dto.partyCode || dto.partnerCode || existing.partyId || '',
    partyName: dto.partyName || dto.partnerName || existing.partyName || '',
    partyCategory: dto.partyCategory || dto.partnerType || existing.partyCategory || 'Farmer',
    mobileNumber: dto.mobileNumber || dto.mobile || existing.mobileNumber || '',
    transactionType:
      dto.transactionType || dto.purpose || existing.transactionType || 'Farmer Purchase',
    product: dto.product || dto.productName || dto.actionDetails || existing.product || '',
    quantity:
      dto.quantity !== undefined && dto.quantity !== null
        ? dto.unit && !String(dto.quantity).includes(dto.unit)
          ? `${dto.quantity} ${dto.unit}`
          : String(dto.quantity)
        : existing.quantity || '',
    amount: Number(dto.amount ?? dto.totalAmount ?? existing.amount ?? 0),
    otpStatus: dto.otpStatus || dto.status || existing.otpStatus || 'Pending',
    demoOtpCode,
    initiatedDate:
      dto.initiatedDate || dto.sentAt || dto.createdAt || existing.initiatedDate || '',
    confirmationDate:
      dto.confirmationDate || dto.confirmedAt || dto.verifiedAt || existing.confirmationDate || null,
    expiryTime: dto.expiryTime || dto.expiresAt || existing.expiryTime || '',
    attempts: Number(dto.attempts ?? existing.attempts ?? 0),
    maxAttempts: Number(dto.maxAttempts ?? existing.maxAttempts ?? 3),
    attemptHistory: Array.isArray(dto.attemptHistory)
      ? dto.attemptHistory
      : existing.attemptHistory || [],
  };
}

export function mapVendorLedgerDto(dto = {}, existing = {}) {
  if (!dto || typeof dto !== 'object') return existing;
  const rawId = dto.id ?? dto.ledgerId ?? existing.rawId ?? null;
  const id =
    dto.ledgerCode ||
    (typeof dto.id === 'string' && dto.id.startsWith('LDG-')
      ? dto.id
      : rawId
      ? `LDG-${String(rawId).padStart(4, '0')}`
      : existing.id || 'LDG-0001');

  return {
    ...existing,
    rawId,
    id,
    date: dto.date
      ? String(dto.date).slice(0, 10)
      : existing.date || new Date().toISOString().slice(0, 10),
    transactionId: dto.transactionId || dto.referenceId || existing.transactionId || '',
    category: dto.category || existing.category || 'Farmer Purchase',
    description: dto.description || dto.narration || existing.description || '',
    partyId: dto.partyId || existing.partyId || '',
    partyName: dto.partyName || existing.partyName || '',
    partyCategory: dto.partyCategory || existing.partyCategory || 'Farmer',
    debit: Number(dto.debit ?? existing.debit ?? 0),
    credit: Number(dto.credit ?? existing.credit ?? 0),
    processingExpenses: Number(
      dto.processingExpenses ?? existing.processingExpenses ?? 0
    ),
    expectedPaymentDate: dto.expectedPaymentDate
      ? String(dto.expectedPaymentDate).slice(0, 10)
      : existing.expectedPaymentDate || '',
    status: dto.status || existing.status || 'Unpaid',
  };
}

export function mapVendorNotificationDto(dto = {}, existing = {}) {
  if (!dto || typeof dto !== 'object') return existing;
  const rawId = dto.id ?? dto.notificationId ?? existing.rawId ?? null;
  const id =
    dto.notificationCode ||
    (typeof dto.id === 'string' && dto.id.startsWith('NTF-')
      ? dto.id
      : rawId
      ? `NTF-${String(rawId).padStart(4, '0')}`
      : existing.id || 'NTF-0001');

  return {
    ...existing,
    rawId,
    id,
    category: dto.category || existing.category || 'Purchase Confirmed',
    title: dto.title || existing.title || 'System Alert',
    description: dto.description || dto.message || existing.description || '',
    transactionId: dto.transactionId || dto.referenceId || existing.transactionId || '',
    date:
      dto.date ||
      (dto.createdAt
        ? String(dto.createdAt).replace('T', ' ').slice(0, 16)
        : existing.date || ''),
    isRead: Boolean(dto.isRead ?? dto.read ?? existing.isRead ?? false),
    priority: dto.priority || existing.priority || 'Medium',
    targetPath: dto.targetPath || dto.actionUrl || existing.targetPath || '/vendor/dashboard',
  };
}

/* ==========================================================================
   1. VENDOR DASHBOARD APIs
   ========================================================================== */

export async function fetchVendorDashboardApi(params = {}) {
  try {
    const res = await api.get(Endpoints.VendorDashboard.get, { params });
    return res.data?.data ?? res.data ?? null;
  } catch {
    return null;
  }
}

export async function fetchVendorDashboardTransactionsApi(params = {}) {
  try {
    const res = await api.get(Endpoints.VendorDashboard.transactions, { params });
    return extractList(res) || res.data?.data || null;
  } catch {
    return null;
  }
}

export async function searchVendorDashboardApi(query = '') {
  try {
    const res = await api.get(Endpoints.VendorDashboard.search, {
      params: { q: query, search: query },
    });
    return res.data?.data ?? res.data ?? null;
  } catch {
    return null;
  }
}

export async function fetchVendorDashboardOtpConfirmationsApi() {
  try {
    const res = await api.get(Endpoints.VendorDashboard.otpConfirmations);
    const list = extractList(res);
    return list ? list.map((item) => mapVendorConfirmationDto(item)) : null;
  } catch {
    return null;
  }
}

export async function verifyVendorDashboardOtpApi(partnerType, confirmationId, otp) {
  try {
    const cleanId = String(confirmationId).replace(/^OTP-0*/i, '') || confirmationId;
    const res = await api.post(
      Endpoints.VendorDashboard.verifyOtp(partnerType, cleanId),
      { otp: String(otp || '').trim() }
    );
    return res.data?.data ?? res.data ?? null;
  } catch {
    return null;
  }
}

export async function exportVendorDashboardTransactionsApi(params = {}) {
  try {
    const res = await api.get(Endpoints.VendorDashboard.exportTransactions, { params });
    return res.data ?? null;
  } catch {
    return null;
  }
}

/* ==========================================================================
   2. VENDOR FARMERS APIs
   ========================================================================== */

function buildVendorFarmerRequestDto(payload = {}) {
  const cropsArr = Array.isArray(payload.availableCrops)
    ? payload.availableCrops
    : Array.isArray(payload.registeredCrops)
    ? payload.registeredCrops
    : typeof payload.registeredCrops === 'string'
    ? payload.registeredCrops.split(',').map((c) => c.trim()).filter(Boolean)
    : [];
  const registeredCrops =
    cropsArr.length > 0
      ? cropsArr.join(', ')
      : String(payload.registeredCrops || payload.crop || 'Paddy').trim();

  return {
    fullName: String(payload.farmerName || payload.fullName || 'Farmer').trim(),
    fatherOrSpouseName: String(payload.fatherName || payload.fatherOrSpouseName || '').trim() || null,
    mobileNumber:
      String(payload.mobileNumber || payload.mobile || '').replace(/\D/g, '').slice(-10) ||
      '9876543210',
    email: String(payload.email || '').trim() || null,
    village: String(payload.village || payload.mandal || 'Village').trim(),
    district: String(payload.district || 'Kurnool').trim(),
    state: String(payload.state || 'Andhra Pradesh').trim(),
    pinCode: String(payload.pinCode || '').trim() || null,
    landAcres: Number(payload.landAcres ?? payload.totalLandArea ?? 5),
    registeredCrops,
    bankAccountNumber: String(payload.accountNumber || payload.bankAccountNumber || '').trim() || null,
    ifscCode: String(payload.ifscCode || '').trim().toUpperCase() || null,
    bankName: String(payload.bankName || '').trim() || null,
    aadhaarNumber: String(payload.aadhaarId || payload.aadhaarNumber || '').trim() || null,
    status: payload.status || 'Active',
  };
}

export async function fetchVendorFarmersOverviewApi() {
  try {
    const res = await api.get(Endpoints.VendorFarmers.overview);
    return res.data?.data ?? res.data ?? null;
  } catch {
    return null;
  }
}

export async function fetchVendorFarmersApi(params = {}) {
  try {
    const res = await api.get(Endpoints.VendorFarmers.getAll, { params });
    const list = extractList(res, ['items', 'farmers', 'data']);
    return list ? list.map((item) => mapVendorFarmerDto(item)) : null;
  } catch {
    return null;
  }
}

export async function createVendorFarmerApi(payload = {}) {
  try {
    const reqBody = buildVendorFarmerRequestDto(payload);
    const res = await api.post(Endpoints.VendorFarmers.create, reqBody);
    const dto = res.data?.data ?? res.data;
    return dto ? mapVendorFarmerDto(dto, payload) : null;
  } catch {
    return null;
  }
}

export async function fetchVendorFarmerByIdApi(id) {
  if (!id) return null;
  try {
    const res = await api.get(Endpoints.VendorFarmers.getById(id));
    const dto = res.data?.data ?? res.data;
    return dto ? mapVendorFarmerDto(dto) : null;
  } catch {
    return null;
  }
}

export async function updateVendorFarmerApi(id, payload = {}) {
  if (!id) return null;
  try {
    const targetId = payload.rawId || id;
    const reqBody = buildVendorFarmerRequestDto(payload);
    const res = await api.put(Endpoints.VendorFarmers.update(targetId), reqBody);
    const dto = res.data?.data ?? res.data;
    return dto ? mapVendorFarmerDto(dto, payload) : null;
  } catch {
    return null;
  }
}

export async function updateVendorFarmerStatusApi(id, status) {
  if (!id) return null;
  try {
    const res = await api.patch(Endpoints.VendorFarmers.updateStatus(id), {
      status,
      isActive: status === 'Active',
    });
    return res.data?.data ?? res.data ?? null;
  } catch {
    return null;
  }
}

export async function fetchVendorFarmerTransactionsApi(id) {
  if (!id) return null;
  try {
    const res = await api.get(Endpoints.VendorFarmers.transactions(id));
    return extractList(res) || res.data?.data || null;
  } catch {
    return null;
  }
}

export async function fetchVendorFarmerPaymentsApi(id) {
  if (!id) return null;
  try {
    const res = await api.get(Endpoints.VendorFarmers.payments(id));
    return extractList(res) || res.data?.data || null;
  } catch {
    return null;
  }
}

export async function fetchVendorFarmerOtpConfirmationsApi(id) {
  if (!id) return null;
  try {
    const res = await api.get(Endpoints.VendorFarmers.otpConfirmations(id));
    return extractList(res) || res.data?.data || null;
  } catch {
    return null;
  }
}

export async function exportVendorFarmersApi(params = {}) {
  try {
    const res = await api.get(Endpoints.VendorFarmers.export, { params });
    return res.data ?? null;
  } catch {
    return null;
  }
}

/* ==========================================================================
   3. VENDOR MIDDLEMEN APIs
   ========================================================================== */

function buildVendorMiddlemanRequestDto(payload = {}) {
  return {
    fullName: String(
      payload.ownerName || payload.fullName || payload.businessName || 'Middleman'
    ).trim(),
    email: String(payload.email || '').trim() || null,
    mobileNumber:
      String(payload.mobileNumber || payload.mobile || '').replace(/\D/g, '').slice(-10) ||
      '9876543210',
    businessName: String(
      payload.businessName || payload.ownerName || 'Agri Commission Agency'
    ).trim(),
    gstin: String(payload.gstNumber || payload.gstin || '').trim().toUpperCase() || null,
    pan: String(payload.pan || '').trim().toUpperCase() || null,
    marketYardLocation: String(
      payload.village || payload.marketYardLocation || payload.address || payload.district || 'Market Yard'
    ).trim(),
    district: String(payload.district || 'Kurnool').trim(),
    state: String(payload.state || 'Andhra Pradesh').trim(),
    pinCode: String(payload.pinCode || '').trim() || null,
    openingBalance: Number(payload.openingBalance) || 0,
    status: payload.status || 'Active',
  };
}

export async function fetchVendorMiddlemenOverviewApi() {
  try {
    const res = await api.get(Endpoints.VendorMiddlemen.overview);
    return res.data?.data ?? res.data ?? null;
  } catch {
    return null;
  }
}

export async function fetchVendorMiddlemenApi(params = {}) {
  try {
    const res = await api.get(Endpoints.VendorMiddlemen.getAll, { params });
    const list = extractList(res, ['items', 'middlemen', 'data']);
    return list ? list.map((item) => mapVendorMiddlemanDto(item)) : null;
  } catch {
    return null;
  }
}

export async function createVendorMiddlemanApi(payload = {}) {
  try {
    const reqBody = buildVendorMiddlemanRequestDto(payload);
    const res = await api.post(Endpoints.VendorMiddlemen.create, reqBody);
    const dto = res.data?.data ?? res.data;
    return dto ? mapVendorMiddlemanDto(dto, payload) : null;
  } catch {
    return null;
  }
}

export async function fetchVendorMiddlemanByIdApi(id) {
  if (!id) return null;
  try {
    const res = await api.get(Endpoints.VendorMiddlemen.getById(id));
    const dto = res.data?.data ?? res.data;
    return dto ? mapVendorMiddlemanDto(dto) : null;
  } catch {
    return null;
  }
}

export async function updateVendorMiddlemanApi(id, payload = {}) {
  if (!id) return null;
  try {
    const targetId = payload.rawId || id;
    const reqBody = buildVendorMiddlemanRequestDto(payload);
    const res = await api.put(Endpoints.VendorMiddlemen.update(targetId), reqBody);
    const dto = res.data?.data ?? res.data;
    return dto ? mapVendorMiddlemanDto(dto, payload) : null;
  } catch {
    return null;
  }
}

export async function updateVendorMiddlemanStatusApi(id, status) {
  if (!id) return null;
  try {
    const res = await api.patch(Endpoints.VendorMiddlemen.updateStatus(id), {
      status,
      isActive: status === 'Active',
    });
    return res.data?.data ?? res.data ?? null;
  } catch {
    return null;
  }
}

export async function fetchVendorMiddlemanTransactionsApi(id) {
  if (!id) return null;
  try {
    const res = await api.get(Endpoints.VendorMiddlemen.transactions(id));
    return extractList(res) || res.data?.data || null;
  } catch {
    return null;
  }
}

export async function fetchVendorMiddlemanPaymentsApi(id) {
  if (!id) return null;
  try {
    const res = await api.get(Endpoints.VendorMiddlemen.payments(id));
    return extractList(res) || res.data?.data || null;
  } catch {
    return null;
  }
}

export async function fetchVendorMiddlemanOtpConfirmationsApi(id) {
  if (!id) return null;
  try {
    const res = await api.get(Endpoints.VendorMiddlemen.otpConfirmations(id));
    return extractList(res) || res.data?.data || null;
  } catch {
    return null;
  }
}

export async function exportVendorMiddlemenApi(params = {}) {
  try {
    const res = await api.get(Endpoints.VendorMiddlemen.export, { params });
    return res.data ?? null;
  } catch {
    return null;
  }
}

/* ==========================================================================
   4. VENDOR CUSTOMERS APIs
   ========================================================================== */

function buildVendorCustomerRequestDto(payload = {}) {
  const customerName = String(
    payload.customerName || payload.fullName || payload.businessName || 'Customer'
  ).trim();
  const businessName = String(payload.businessName || customerName).trim();

  return {
    customerName,
    businessName,
    customerType: payload.customerType || 'Wholesaler',
    mobileNumber:
      String(payload.mobileNumber || payload.mobile || '').replace(/\D/g, '').slice(-10) ||
      '9876543210',
    email: String(payload.email || '').trim() || null,
    address: String(payload.address || payload.district || 'Main Road').trim(),
    district: String(payload.district || 'Kurnool').trim(),
    state: String(payload.state || 'Andhra Pradesh').trim(),
    pinCode: String(payload.pinCode || '').trim() || null,
    gstin: String(payload.gstNumber || payload.gstin || '').trim().toUpperCase() || null,
    creditLimit: Number(payload.creditLimit) || 0,
    status: payload.status || 'Active',
  };
}

export async function fetchVendorCustomersOverviewApi() {
  try {
    const res = await api.get(Endpoints.VendorCustomers.overview);
    return res.data?.data ?? res.data ?? null;
  } catch {
    return null;
  }
}

export async function fetchVendorCustomersApi(params = {}) {
  try {
    const res = await api.get(Endpoints.VendorCustomers.getAll, { params });
    const list = extractList(res, ['items', 'customers', 'data']);
    return list ? list.map((item) => mapVendorCustomerDto(item)) : null;
  } catch {
    return null;
  }
}

export async function createVendorCustomerApi(payload = {}) {
  try {
    const reqBody = buildVendorCustomerRequestDto(payload);
    const res = await api.post(Endpoints.VendorCustomers.create, reqBody);
    const dto = res.data?.data ?? res.data;
    return dto ? mapVendorCustomerDto(dto, payload) : null;
  } catch {
    return null;
  }
}

export async function fetchVendorCustomerByIdApi(id) {
  if (!id) return null;
  try {
    const res = await api.get(Endpoints.VendorCustomers.getById(id));
    const dto = res.data?.data ?? res.data;
    return dto ? mapVendorCustomerDto(dto) : null;
  } catch {
    return null;
  }
}

export async function updateVendorCustomerApi(id, payload = {}) {
  if (!id) return null;
  try {
    const targetId = payload.rawId || id;
    const reqBody = buildVendorCustomerRequestDto(payload);
    const res = await api.put(Endpoints.VendorCustomers.update(targetId), reqBody);
    const dto = res.data?.data ?? res.data;
    return dto ? mapVendorCustomerDto(dto, payload) : null;
  } catch {
    return null;
  }
}

export async function updateVendorCustomerStatusApi(id, status) {
  if (!id) return null;
  try {
    const res = await api.patch(Endpoints.VendorCustomers.updateStatus(id), {
      status,
      isActive: status === 'Active',
    });
    return res.data?.data ?? res.data ?? null;
  } catch {
    return null;
  }
}

export async function exportVendorCustomersApi(params = {}) {
  try {
    const res = await api.get(Endpoints.VendorCustomers.export, { params });
    return res.data ?? null;
  } catch {
    return null;
  }
}

/* ==========================================================================
   5. VENDOR RAW MATERIAL INVENTORY APIs
   ========================================================================== */

export async function fetchVendorRawMaterialOverviewApi() {
  try {
    const res = await api.get(Endpoints.VendorRawMaterialInventory.overview);
    return res.data?.data ?? res.data ?? null;
  } catch {
    return null;
  }
}

export async function fetchVendorRawMaterialsApi(params = {}) {
  try {
    const res = await api.get(Endpoints.VendorRawMaterialInventory.getAll, { params });
    const list = extractList(res, ['items', 'batches', 'rawMaterials', 'data']);
    return list ? list.map((item) => mapVendorRawMaterialDto(item)) : null;
  } catch {
    return null;
  }
}

export async function fetchVendorRawMaterialByIdApi(id) {
  if (!id) return null;
  try {
    const res = await api.get(Endpoints.VendorRawMaterialInventory.getById(id));
    const dto = res.data?.data ?? res.data;
    return dto ? mapVendorRawMaterialDto(dto) : null;
  } catch {
    return null;
  }
}

export async function fetchVendorRawMaterialMovementsApi(params = {}) {
  try {
    const res = await api.get(Endpoints.VendorRawMaterialInventory.movements, { params });
    return extractList(res, ['items', 'movements', 'data']);
  } catch {
    return null;
  }
}

export async function exportVendorRawMaterialsApi(params = {}) {
  try {
    const res = await api.get(Endpoints.VendorRawMaterialInventory.export, { params });
    return res.data ?? null;
  } catch {
    return null;
  }
}

export async function createVendorRawMaterialApi(payload = {}) {
  try {
    const reqBody = {
      cropName: String(payload.cropName || payload.crop || '').trim(),
      cropVariety: payload.cropVariety || payload.variety || 'Standard',
      supplierName: payload.supplierName || 'Verified Supplier',
      supplierCategory: payload.supplierCategory || 'Farmer',
      purchaseId: payload.purchaseId || payload.purchaseCode || null,
      batchNumber: payload.batchNumber || null,
      purchaseDate: payload.purchaseDate ? new Date(payload.purchaseDate).toISOString() : new Date().toISOString(),
      purchasedQuantity: Number(payload.purchasedQuantity ?? payload.quantity ?? 0),
      unit: payload.unit || 'Quintal',
      averageCost: Number(payload.averageCost ?? payload.rate ?? 0),
      qualityGrade: payload.qualityGrade || payload.quality || 'Grade A (Standard FAQ)',
      minThresholdQuantity: Number(payload.minThresholdQuantity ?? payload.minimumThreshold ?? 15),
    };
    const res = await api.post(Endpoints.VendorRawMaterialInventory.create, reqBody);
    const dto = res.data?.data ?? res.data;
    return dto ? mapVendorRawMaterialDto(dto, payload) : null;
  } catch (err) {
    console.warn('[createVendorRawMaterialApi] warning:', err?.response?.data || err?.message);
    return null;
  }
}

/* ==========================================================================
   6. VENDOR PROCESSING APIs
   ========================================================================== */

export async function fetchVendorProcessingOverviewApi() {
  try {
    const res = await api.get(Endpoints.VendorProcessing.overview);
    return res.data?.data ?? res.data ?? null;
  } catch {
    return null;
  }
}

export async function fetchVendorProcessingBatchesApi(params = {}) {
  try {
    const res = await api.get(Endpoints.VendorProcessing.getAll, { params });
    const list = extractList(res, ['items', 'batches', 'records', 'data']);
    return list ? list.map((item) => mapVendorProcessingDto(item)) : null;
  } catch {
    return null;
  }
}

export async function createVendorProcessingBatchApi(payload = {}) {
  try {
    const reqBody = {
      rawMaterialName: String(
        payload.rawMaterial || payload.rawMaterialName || 'Paddy'
      ).trim(),
      sourceStockId: String(
        payload.stockId || payload.sourceStockId || 'STK-0001'
      ).trim(),
      inputQuantity: Number(payload.inputQuantity) || 0,
      unit: payload.inputUnit || payload.unit || 'Quintal',
      processingExpenses: Number(
        payload.totalProcessingExpenses ?? payload.processingExpenses ?? 0
      ),
      notes: payload.notes || null,
      outputs: (payload.outputs || []).map((o) => ({
        outputProductName: String(
          o.productName || o.outputProductName || 'Processed Product'
        ).trim(),
        outputQuantity: Number(o.outputQuantity) || 0,
        unit: o.outputUnit || o.unit || payload.inputUnit || 'Quintal',
        outputType: o.outputType || 'Main Product',
      })),
    };
    const res = await api.post(Endpoints.VendorProcessing.create, reqBody);
    const dto = res.data?.data ?? res.data;
    return dto ? mapVendorProcessingDto(dto, payload) : null;
  } catch {
    return null;
  }
}

export async function fetchVendorProcessingBatchByIdApi(id) {
  if (!id) return null;
  try {
    const res = await api.get(Endpoints.VendorProcessing.getById(id));
    const dto = res.data?.data ?? res.data;
    return dto ? mapVendorProcessingDto(dto) : null;
  } catch {
    return null;
  }
}

export async function exportVendorProcessingApi(params = {}) {
  try {
    const res = await api.get(Endpoints.VendorProcessing.export, { params });
    return res.data ?? null;
  } catch {
    return null;
  }
}

export const exportVendorProcessingBatchesApi = exportVendorProcessingApi;

/* ==========================================================================
   7. VENDOR FINISHED PRODUCTS APIs
   ========================================================================== */

function buildVendorFinishedProductRequestDto(payload = {}) {
  const packaging =
    payload.packaging ||
    [payload.packageSize, payload.packagingType].filter(Boolean).join(' ').trim() ||
    '50 Kg PP Woven Bag';

  const mfg =
    payload.manufacturingDate || payload.mfgDate
      ? new Date(payload.manufacturingDate || payload.mfgDate)
      : new Date();
  const exp = payload.expiryDate
    ? new Date(payload.expiryDate)
    : new Date(mfg.getTime() + 270 * 24 * 3600 * 1000);

  return {
    productName: String(payload.productName || 'Finished Product').trim(),
    category: String(payload.category || 'Food Grains & Cereals').trim(),
    sourceRawMaterial: String(payload.sourceRawMaterial || 'Paddy').trim(),
    brandName: String(payload.brandName || 'Rayalaseema Gold').trim(),
    packaging,
    initialQuantity: Number(payload.availableQuantity ?? payload.initialQuantity ?? 0),
    unit: payload.unit || 'Quintal',
    mfgDate: mfg.toISOString(),
    expiryDate: exp.toISOString(),
    productionCost: Number(payload.productionCost) || 0,
    sellingPrice: Number(payload.sellingPrice) || 0,
    minThresholdQuantity: Number(
      payload.minimumStockLevel ?? payload.minThresholdQuantity ?? 15
    ),
    status: payload.status || 'Active',
    imageUrl: payload.imageUrl || null,
  };
}

export async function fetchVendorFinishedProductsOverviewApi() {
  try {
    const res = await api.get(Endpoints.VendorFinishedProducts.overview);
    return res.data?.data ?? res.data ?? null;
  } catch (err) {
    console.warn('[fetchVendorFinishedProductsOverviewApi] error:', err?.response?.data || err?.message || err);
    return null;
  }
}

export async function fetchVendorFinishedProductsApi(params = {}) {
  try {
    const res = await api.get(Endpoints.VendorFinishedProducts.getAll, { params });
    const list = extractList(res, ['items', 'products', 'data']);
    return list ? list.map((item) => mapVendorFinishedProductDto(item)) : null;
  } catch (err) {
    console.warn('[fetchVendorFinishedProductsApi] error:', err?.response?.data || err?.message || err);
    return null;
  }
}

export async function createVendorFinishedProductApi(payload = {}) {
  try {
    const reqBody = buildVendorFinishedProductRequestDto(payload);
    const res = await api.post(Endpoints.VendorFinishedProducts.create, reqBody);
    const dto = res.data?.data ?? res.data;
    return dto ? mapVendorFinishedProductDto(dto, payload) : null;
  } catch (err) {
    console.warn('[createVendorFinishedProductApi] error:', err?.response?.data || err?.message || err);
    return null;
  }
}

export async function fetchVendorFinishedProductByIdApi(id) {
  if (!id) return null;
  try {
    const res = await api.get(Endpoints.VendorFinishedProducts.getById(id));
    const dto = res.data?.data ?? res.data;
    return dto ? mapVendorFinishedProductDto(dto) : null;
  } catch (err) {
    console.warn('[fetchVendorFinishedProductByIdApi] error:', err?.response?.data || err?.message || err);
    return null;
  }
}

export async function updateVendorFinishedProductApi(id, payload = {}) {
  if (!id) return null;
  try {
    const targetId = payload.rawId || id;
    const reqBody = buildVendorFinishedProductRequestDto(payload);
    const res = await api.put(Endpoints.VendorFinishedProducts.update(targetId), reqBody);
    const dto = res.data?.data ?? res.data;
    return dto ? mapVendorFinishedProductDto(dto, payload) : null;
  } catch (err) {
    console.warn('[updateVendorFinishedProductApi] error:', err?.response?.data || err?.message || err);
    return null;
  }
}

export async function adjustVendorFinishedProductStockApi(id, payload = {}) {
  if (!id) return null;
  const qty = Number(payload.quantity ?? payload.quantityAdjustment ?? 0);
  const signedAdjustment =
    payload.quantityAdjustment !== undefined
      ? Number(payload.quantityAdjustment)
      : payload.adjustmentType === 'Deduct'
      ? -Math.abs(qty)
      : Math.abs(qty);
  const reqBody = {
    quantityAdjustment: signedAdjustment,
    reason: String(payload.reason || 'Manual stock adjustment').trim(),
    referenceId: payload.batchId || payload.referenceId || null,
  };
  try {
    const res = await api.post(Endpoints.VendorFinishedProducts.adjustStock(id), reqBody);
    const dto = res.data?.data ?? res.data;
    return dto && typeof dto === 'object' ? mapVendorFinishedProductDto(dto) : { success: true };
  } catch {
    return null;
  }
}

export async function fetchVendorFinishedProductMovementsApi(id) {
  if (!id) return null;
  try {
    const res = await api.get(Endpoints.VendorFinishedProducts.movements(id));
    return extractList(res) || res.data?.data || null;
  } catch {
    return null;
  }
}

export async function updateVendorFinishedProductStatusApi(id, status) {
  if (!id) return null;
  try {
    const res = await api.patch(Endpoints.VendorFinishedProducts.updateStatus(id), {
      status,
      isActive: status === 'Active',
    });
    return res.data?.data ?? res.data ?? null;
  } catch {
    return null;
  }
}

export async function exportVendorFinishedProductsApi(params = {}) {
  try {
    const res = await api.get(Endpoints.VendorFinishedProducts.export, { params });
    return res.data ?? null;
  } catch {
    return null;
  }
}

/* ==========================================================================
   8. VENDOR SALES APIs
   ========================================================================== */

function buildVendorSaleRequestDto(payload = {}, isDraft = false) {
  const customerUserId =
    Number(payload.customerUserId || payload.rawCustomerId) ||
    Number(String(payload.customerId || '1').replace(/\D/g, '')) ||
    1;
  const items = (payload.items || []).map((i) => ({
    finishedBatchId:
      Number(i.finishedBatchId || i.batchRawId || i.rawId) ||
      Number(String(i.batchId || i.productId || '1').replace(/\D/g, '')) ||
      1,
    quantity: Number(i.sellingQuantity ?? i.quantity ?? 1),
    pricePerUnit: Number(i.pricePerUnit ?? i.unitPrice ?? 0),
  }));

  const expDelivery = payload.expectedDeliveryDate
    ? new Date(payload.expectedDeliveryDate).toISOString()
    : null;
  const expPayment = payload.expectedPaymentDate
    ? new Date(payload.expectedPaymentDate).toISOString()
    : null;

  return {
    customerUserId,
    deliveryAddress: payload.deliveryAddress || null,
    discountAmount: Number(payload.discount ?? payload.discountAmount ?? 0),
    taxAmount: Number(payload.tax ?? payload.taxAmount ?? 0),
    deliveryCharges: Number(payload.deliveryCharges ?? 0),
    otherCharges: Number(payload.otherCharges ?? 0),
    expectedDeliveryDate: expDelivery,
    expectedPaymentDate: expPayment,
    paymentTerms: payload.paymentTerms || 'Net 15 Days',
    notes: payload.notes || null,
    items,
    submit: !isDraft,
  };
}

export async function fetchVendorSalesCatalogSummaryApi() {
  try {
    const res = await api.get(Endpoints.VendorSales.catalogSummary);
    return res.data?.data ?? res.data ?? null;
  } catch {
    return null;
  }
}

export async function fetchVendorSalesCustomersApi() {
  try {
    const res = await api.get(Endpoints.VendorSales.customers);
    const list = extractList(res, ['items', 'customers', 'data']);
    return list ? list.map((item) => mapVendorCustomerDto(item)) : null;
  } catch {
    return null;
  }
}

export async function fetchVendorSalesCustomerByIdApi(id) {
  if (!id) return null;
  try {
    const cleanId = String(id).replace(/^CUST-0*/i, '') || id;
    const res = await api.get(Endpoints.VendorSales.customerById(cleanId));
    const dto = res.data?.data ?? res.data;
    return dto ? mapVendorCustomerDto(dto) : null;
  } catch {
    return null;
  }
}

export async function fetchVendorSalesBatchesApi(params = {}) {
  try {
    const res = await api.get(Endpoints.VendorSales.batches, { params });
    return extractList(res, ['items', 'batches', 'data']);
  } catch {
    return null;
  }
}

export async function fetchVendorSalesBatchByIdApi(id) {
  if (!id) return null;
  try {
    const cleanId = String(id).replace(/^PBAT-0*/i, '') || id;
    const res = await api.get(Endpoints.VendorSales.batchById(cleanId));
    return res.data?.data ?? res.data ?? null;
  } catch {
    return null;
  }
}

export async function fetchVendorSalesSummaryApi() {
  try {
    const res = await api.get(Endpoints.VendorSales.summary);
    return res.data?.data ?? res.data ?? null;
  } catch {
    return null;
  }
}

export async function fetchVendorSalesApi(params = {}) {
  try {
    const res = await api.get(Endpoints.VendorSales.getAll, { params });
    const list = extractList(res, ['items', 'sales', 'data']);
    return list ? list.map((item) => mapVendorSaleDto(item)) : null;
  } catch {
    return null;
  }
}

export async function createVendorSaleApi(payload = {}, isDraft = false) {
  try {
    const reqBody = buildVendorSaleRequestDto(payload, isDraft);
    const res = await api.post(Endpoints.VendorSales.create, reqBody);
    const dataObj = res.data?.data ?? res.data;
    const saleDto = dataObj?.sale || dataObj;
    const mapped = saleDto ? mapVendorSaleDto(saleDto, payload) : null;
    if (mapped) {
      if (dataObj?.saleId) mapped.rawId = dataObj.saleId;
      if (dataObj?.confirmationId) mapped.confirmationId = dataObj.confirmationId;
      if (res.data?.devOtp) mapped.devOtp = res.data.devOtp;
    }
    return mapped;
  } catch (err) {
    console.warn('[createVendorSaleApi] error:', err?.response?.data || err?.message || err);
    return null;
  }
}

export async function fetchVendorSalesDraftsApi() {
  try {
    const res = await api.get(Endpoints.VendorSales.drafts);
    const list = extractList(res, ['items', 'drafts', 'sales', 'data']);
    return list ? list.map((item) => mapVendorSaleDto(item)) : null;
  } catch {
    return null;
  }
}

export async function fetchVendorSaleByIdApi(id) {
  if (!id) return null;
  try {
    const cleanId = String(id).replace(/^SALE-0*/i, '') || id;
    const res = await api.get(Endpoints.VendorSales.getById(cleanId));
    const dto = res.data?.data ?? res.data;
    return dto ? mapVendorSaleDto(dto) : null;
  } catch {
    return null;
  }
}

export async function updateVendorSaleApi(id, payload = {}) {
  if (!id) return null;
  try {
    const cleanId = payload.rawId || String(id).replace(/^SALE-0*/i, '') || id;
    const reqBody = buildVendorSaleRequestDto(payload, false);
    const res = await api.put(Endpoints.VendorSales.update(cleanId), reqBody);
    const dto = res.data?.data ?? res.data;
    return dto ? mapVendorSaleDto(dto, payload) : null;
  } catch {
    return null;
  }
}

export async function deleteVendorSaleApi(id) {
  if (!id) return null;
  try {
    const cleanId = String(id).replace(/^SALE-0*/i, '') || id;
    const res = await api.delete(Endpoints.VendorSales.delete(cleanId));
    return res.data ?? { success: true };
  } catch {
    return null;
  }
}

export async function submitVendorSaleApi(id, payload = {}) {
  if (!id) return null;
  try {
    const cleanId = payload?.rawId || String(id).replace(/^SALE-0*/i, '') || id;
    const res = await api.post(Endpoints.VendorSales.submit(cleanId));
    const dto = res.data?.data ?? res.data;
    return dto ? mapVendorSaleDto(dto) : null;
  } catch {
    return null;
  }
}

/* ==========================================================================
   9. VENDOR ORDERS APIs
   ========================================================================== */

export async function fetchVendorOrdersSummaryApi() {
  try {
    const res = await api.get(Endpoints.VendorOrders.summary);
    return res.data?.data ?? res.data ?? null;
  } catch {
    return null;
  }
}

export async function fetchVendorOrdersApi(params = {}) {
  try {
    const res = await api.get(Endpoints.VendorOrders.getAll, { params });
    const list = extractList(res, ['items', 'orders', 'data']);
    return list ? list.map((item) => mapVendorOrderDto(item)) : null;
  } catch {
    return null;
  }
}

export async function fetchVendorOrderByIdApi(id) {
  if (!id) return null;
  try {
    const cleanId = String(id).replace(/^ORD-0*/i, '') || id;
    const res = await api.get(Endpoints.VendorOrders.getById(cleanId));
    const dto = res.data?.data ?? res.data;
    return dto ? mapVendorOrderDto(dto) : null;
  } catch {
    return null;
  }
}

export async function updateVendorOrderStatusApi(id, nextStatus, reason = '') {
  if (!id) return null;
  const cleanId = String(id).replace(/^ORD-0*/i, '') || id;
  try {
    if (nextStatus === 'Cancelled') {
      const res = await api.post(Endpoints.VendorOrders.cancel(cleanId), {
        reason,
      });
      return res.data?.data ?? res.data ?? null;
    }
    const res = await api.put(Endpoints.VendorOrders.updateStatus(cleanId), {
      status: nextStatus,
    });
    return res.data?.data ?? res.data ?? null;
  } catch {
    return null;
  }
}

export async function cancelVendorOrderApi(id, reason = '') {
  if (!id) return null;
  const cleanId = String(id).replace(/^ORD-0*/i, '') || id;
  try {
    const res = await api.post(Endpoints.VendorOrders.cancel(cleanId), {
      reason,
    });
    return res.data?.data ?? res.data ?? null;
  } catch {
    return null;
  }
}

/* ==========================================================================
   10. VENDOR CONFIRMATIONS APIs
   ========================================================================== */

export async function fetchVendorConfirmationsSummaryApi() {
  try {
    const res = await api.get(Endpoints.VendorConfirmations.summary);
    return res.data?.data ?? res.data ?? null;
  } catch {
    return null;
  }
}

export async function fetchVendorConfirmationsApi(params = {}) {
  try {
    const res = await api.get(Endpoints.VendorConfirmations.getAll, { params });
    const list = extractList(res, ['items', 'confirmations', 'data']);
    return list ? list.map((item) => mapVendorConfirmationDto(item)) : null;
  } catch {
    return null;
  }
}

export async function createVendorConfirmationApi(payload = {}) {
  try {
    const rawQtyStr = String(payload.quantity || '0');
    const numericQty =
      typeof payload.quantity === 'number'
        ? payload.quantity
        : parseFloat(rawQtyStr.replace(/[^\d.]/g, '')) || 0;
    const parsedUnit =
      payload.unit ||
      rawQtyStr.replace(/[\d.\s]+/g, '').trim() ||
      'Quintal';

    const reqBody = {
      transactionCode: String(
        payload.transactionId || payload.transactionCode || 'TXN-0001'
      ).trim(),
      partyCategory: String(payload.partyCategory || 'Farmer').trim(),
      partyName: String(payload.partyName || 'Supplier').trim(),
      partyCode: String(payload.partyId || payload.partyCode || '').trim() || null,
      mobile:
        String(payload.mobileNumber || payload.mobile || '')
          .replace(/\D/g, '')
          .slice(-10) || null,
      transactionType: String(payload.transactionType || 'Farmer Purchase').trim(),
      product: String(payload.product || 'Agricultural Commodity').trim(),
      quantity: numericQty,
      unit: parsedUnit,
      amount: Number(payload.amount) || 0,
    };
    const res = await api.post(Endpoints.VendorConfirmations.create, reqBody);
    const dto = res.data?.data ?? res.data;
    const topDevOtp = res.data?.devOtp || null;
    return dto ? mapVendorConfirmationDto(dto, payload, topDevOtp) : null;
  } catch {
    return null;
  }
}

export async function fetchVendorConfirmationByIdApi(id) {
  if (!id) return null;
  try {
    const cleanId = String(id).replace(/^OTP-0*/i, '') || id;
    const res = await api.get(Endpoints.VendorConfirmations.getById(cleanId));
    const dto = res.data?.data ?? res.data;
    return dto ? mapVendorConfirmationDto(dto) : null;
  } catch {
    return null;
  }
}

export async function verifyVendorConfirmationOtpApi(id, otp) {
  if (!id) return null;
  const cleanId = String(id).replace(/^OTP-0*/i, '') || id;
  try {
    const res = await api.post(Endpoints.VendorConfirmations.verify(cleanId), {
      otp: String(otp || '').trim(),
    });
    return res.data?.data ?? res.data ?? null;
  } catch {
    return null;
  }
}

export async function resendVendorConfirmationOtpApi(id) {
  if (!id) return null;
  const cleanId = String(id).replace(/^OTP-0*/i, '') || id;
  try {
    const res = await api.post(Endpoints.VendorConfirmations.resend(cleanId));
    return res.data?.data ?? res.data ?? null;
  } catch {
    return null;
  }
}

/* ==========================================================================
   11. VENDOR LEDGER APIs
   ========================================================================== */

export async function fetchVendorLedgerSummaryApi() {
  try {
    const res = await api.get(Endpoints.VendorLedger.summary);
    return res.data?.data ?? res.data ?? null;
  } catch {
    return null;
  }
}

export async function fetchVendorLedgerDayTotalsApi(params = {}) {
  try {
    const res = await api.get(Endpoints.VendorLedger.dayTotals, { params });
    return res.data?.data ?? res.data ?? null;
  } catch {
    return null;
  }
}

export async function fetchVendorLedgerApi(params = {}) {
  try {
    const res = await api.get(Endpoints.VendorLedger.getAll, { params });
    const list = extractList(res, ['items', 'entries', 'ledger', 'data']);
    return list ? list.map((item) => mapVendorLedgerDto(item)) : null;
  } catch {
    return null;
  }
}

export async function fetchVendorLedgerByIdApi(id) {
  if (!id) return null;
  try {
    const cleanId = String(id).replace(/^LDG-0*/i, '') || id;
    const res = await api.get(Endpoints.VendorLedger.getById(cleanId));
    const dto = res.data?.data ?? res.data;
    return dto ? mapVendorLedgerDto(dto) : null;
  } catch {
    return null;
  }
}

export async function payVendorSupplierApi(payload = {}) {
  try {
    const rawEntryId = payload.ledgerEntryId && !isNaN(Number(payload.ledgerEntryId))
      ? Number(payload.ledgerEntryId)
      : null;
    const refCode = payload.ledgerEntryCode || payload.referenceTransactionId || payload.id || null;
    const reqBody = {
      ledgerEntryId: rawEntryId,
      ledgerEntryCode: refCode ? String(refCode).trim() : null,
      partyName: String(payload.partyName || '').trim() || null,
      amount: Number(payload.amount) || 0,
      paymentMode: payload.paymentMode || 'NEFT / RTGS',
      referenceNo: String(payload.referenceTransactionId || payload.referenceNo || '').trim() || null,
    };
    const res = await api.post(Endpoints.VendorLedger.paySupplier, reqBody);
    const dto = res.data?.data ?? res.data;
    return dto ? mapVendorLedgerDto(dto) : null;
  } catch (err) {
    console.warn('[payVendorSupplierApi] error:', err?.response?.data || err?.message || err);
    return null;
  }
}

export async function recordVendorCustomerReceiptApi(payload = {}) {
  try {
    const rawSaleId = payload.saleId && !isNaN(Number(payload.saleId)) ? Number(payload.saleId) : null;
    const rawCustomerUserId = payload.customerUserId && !isNaN(Number(payload.customerUserId))
      ? Number(payload.customerUserId)
      : null;
    const refCode = payload.saleCode || payload.referenceTransactionId || payload.id || null;
    const reqBody = {
      saleId: rawSaleId,
      saleCode: refCode ? String(refCode).trim() : null,
      customerUserId: rawCustomerUserId,
      amount: Number(payload.amount) || 0,
      paymentMode: payload.paymentMode || 'NEFT / RTGS',
      referenceNo: String(payload.referenceTransactionId || payload.referenceNo || '').trim() || null,
    };
    const res = await api.post(Endpoints.VendorLedger.receipts, reqBody);
    const dto = res.data?.data ?? res.data;
    return dto ? mapVendorLedgerDto(dto) : null;
  } catch (err) {
    console.warn('[recordVendorCustomerReceiptApi] error:', err?.response?.data || err?.message || err);
    return null;
  }
}

export async function settleVendorLedgerEntryApi(id, payload = {}) {
  if (!id) return null;
  const cleanId = String(id).replace(/^LDG-0*/i, '') || id;
  try {
    const reqBody = {
      amount: Number(payload.amount) || 0,
      paymentMode: payload.paymentMode || 'NEFT / RTGS',
      referenceNo: String(payload.referenceTransactionId || payload.referenceNo || '').trim(),
    };
    const res = await api.post(Endpoints.VendorLedger.settle(cleanId), reqBody);
    const dto = res.data?.data ?? res.data;
    return dto ? mapVendorLedgerDto(dto) : null;
  } catch {
    return null;
  }
}

/* ==========================================================================
   12. VENDOR NOTIFICATIONS APIs
   ========================================================================== */

export async function fetchVendorNotificationsSummaryApi() {
  try {
    const res = await api.get(Endpoints.VendorNotifications.summary);
    return res.data?.data ?? res.data ?? null;
  } catch {
    return null;
  }
}

export async function fetchVendorNotificationsApi(params = {}) {
  try {
    const res = await api.get(Endpoints.VendorNotifications.getAll, { params });
    const list = extractList(res, ['items', 'notifications', 'data']);
    return list ? list.map((item) => mapVendorNotificationDto(item)) : null;
  } catch {
    return null;
  }
}

export async function markVendorNotificationReadApi(id) {
  if (!id) return null;
  const cleanId = String(id).replace(/^NTF-0*/i, '') || id;
  try {
    const res = await api.put(Endpoints.VendorNotifications.markRead(cleanId));
    return res.data ?? { success: true };
  } catch {
    return null;
  }
}

export async function markAllVendorNotificationsReadApi() {
  try {
    const res = await api.put(Endpoints.VendorNotifications.markAllRead);
    return res.data ?? { success: true };
  } catch {
    return null;
  }
}

export async function deleteVendorNotificationApi(id) {
  if (!id) return null;
  const cleanId = String(id).replace(/^NTF-0*/i, '') || id;
  try {
    const res = await api.delete(Endpoints.VendorNotifications.delete(cleanId));
    return res.data ?? { success: true };
  } catch {
    return null;
  }
}

/* ==========================================================================
   13. VENDOR PURCHASES APIs
   ========================================================================== */

export function mapVendorPurchaseDto(dto = {}, existing = {}) {
  if (!dto || typeof dto !== 'object') return existing;
  const rawId = dto.id ?? existing.rawId ?? null;
  const id =
    dto.purchaseCode ||
    (typeof dto.id === 'string' && dto.id.startsWith('PUR-')
      ? dto.id
      : rawId
      ? `PUR-${dto.supplierCategory === 'Middleman' ? 'M' : 'F'}-${String(rawId).padStart(4, '0')}`
      : existing.id || 'PUR-F-0001');

  const supplierId =
    dto.supplierCode ||
    (dto.supplierId
      ? `${dto.supplierCategory === 'Middleman' ? 'MID' : 'FARM'}-${String(dto.supplierId).padStart(4, '0')}`
      : existing.supplierId || '');

  return {
    ...existing,
    rawId,
    id,
    purchaseCode: dto.purchaseCode || id,
    billNumber: dto.billNumber || existing.billNumber || '',
    supplierCategory: dto.supplierCategory || existing.supplierCategory || 'Farmer',
    supplierId,
    supplierRawId: dto.supplierId ?? existing.supplierRawId ?? null,
    supplierName: dto.supplierName || dto.supplierBusinessName || existing.supplierName || '',
    ownerName: dto.supplierName || existing.ownerName || '',
    mobileNumber: dto.mobileNumber || existing.mobileNumber || '',
    email: dto.email || existing.email || '',
    gstNumber: dto.gstin || existing.gstNumber || '',
    village: dto.villageOrMarket || existing.village || '',
    district: dto.district || existing.district || '',
    state: dto.state || existing.state || 'Andhra Pradesh',
    crop: dto.cropName || existing.crop || 'Paddy',
    variety: dto.cropVariety || existing.variety || 'Standard',
    quantity: Number(dto.quantity ?? existing.quantity ?? 0),
    unit: dto.unit || existing.unit || 'Quintal',
    rate: Number(dto.ratePerUnit ?? existing.rate ?? 0),
    totalAmount: Number(dto.totalAmount ?? existing.totalAmount ?? 0),
    dueAmount: Number(dto.dueAmount ?? existing.dueAmount ?? 0),
    paidAmount: Number(dto.paidAmount ?? existing.paidAmount ?? 0),
    paymentStatus: dto.paymentStatus || existing.paymentStatus || 'Pending',
    status: dto.paymentStatus === 'Paid' ? 'Confirmed' : existing.status || 'Pending OTP Confirmation',
    purchaseDate: dto.purchaseDate
      ? String(dto.purchaseDate).slice(0, 10)
      : existing.purchaseDate || new Date().toISOString().slice(0, 10),
  };
}

export async function fetchVendorPurchasesSummaryApi() {
  try {
    const res = await api.get('/api/v1/vendor/purchases/summary');
    return res.data?.data ?? res.data ?? null;
  } catch {
    return null;
  }
}

export async function fetchVendorPurchasesApi(params = {}) {
  try {
    const res = await api.get(Endpoints.VendorPurchases.getAll, { params });
    const list = extractList(res, ['items', 'purchases', 'data']);
    return list ? list.map((item) => mapVendorPurchaseDto(item)) : null;
  } catch {
    return null;
  }
}

export async function fetchVendorPurchaseByIdApi(id, supplierCategory = 'Farmer') {
  if (!id) return null;
  const cleanId = String(id).replace(/^PUR-[FM]-0*/i, '') || id;
  try {
    const res = await api.get(Endpoints.VendorPurchases.getById(cleanId), {
      params: { supplierCategory },
    });
    const dto = res.data?.data ?? res.data;
    return dto ? mapVendorPurchaseDto(dto) : null;
  } catch {
    return null;
  }
}

export async function createVendorPurchaseApi(payload = {}) {
  try {
    const isMiddleman =
      String(payload.supplierCategory || '').toLowerCase() === 'middleman';
    const supplierCategory = isMiddleman ? 'Middleman' : 'Farmer';

    const supplierNumericId =
      payload.supplierRawId ||
      payload.supplierIdNum ||
      Number(String(payload.supplierId || '').replace(/\D/g, '')) ||
      1;

    const quantity = Number(payload.quantity || 1);
    const ratePerUnit = Number(payload.rate || payload.ratePerUnit || 1);
    const totalAmount = Number(payload.totalAmount || quantity * ratePerUnit);
    const dueAmount = Number(payload.dueAmount ?? totalAmount);

    const reqBody = {
      supplierCategory,
      supplierId: supplierNumericId,
      purchaseCode: payload.purchaseCode || payload.id || null,
      billNumber: payload.billNumber || null,
      cropName: String(payload.cropName || payload.crop || 'Paddy').trim(),
      cropVariety: String(payload.cropVariety || payload.variety || 'Standard').trim(),
      quantity,
      unit: payload.unit || 'Quintal',
      ratePerUnit,
      totalAmount,
      dueAmount,
      paymentStatus: payload.paymentStatus || 'Pending',
      purchaseDate: payload.purchaseDate
        ? new Date(payload.purchaseDate).toISOString()
        : new Date().toISOString(),
    };

    const res = await api.post(Endpoints.VendorPurchases.create, reqBody);
    const dto = res.data?.data ?? res.data;
    return dto ? mapVendorPurchaseDto(dto) : { success: true };
  } catch (err) {
    console.warn('createVendorPurchaseApi warning:', err?.response?.data || err?.message);
    return null;
  }
}

export async function updateVendorPurchaseStatusApi(id, supplierCategory, statusPayload = {}) {
  if (!id) return null;
  const cleanId = String(id).replace(/^PUR-[FM]-0*/i, '') || id;
  try {
    const res = await api.patch(
      Endpoints.VendorPurchases.updateStatus(cleanId),
      statusPayload,
      { params: { supplierCategory: supplierCategory || 'Farmer' } }
    );
    const dto = res.data?.data ?? res.data;
    return dto ? mapVendorPurchaseDto(dto) : { success: true };
  } catch {
    return null;
  }
}

export async function exportVendorPurchasesApi(params = {}) {
  try {
    const res = await api.get(Endpoints.VendorPurchases.export, { params });
    return res.data ?? null;
  } catch {
    return null;
  }
}

/* ==========================================================================
   14. VENDOR PROFILE & BANK DETAILS APIs
   ========================================================================== */

export async function fetchVendorProfileApi() {
  try {
    const res = await api.get(Endpoints.VendorProfile.get);
    return res.data?.data ?? res.data ?? null;
  } catch {
    return null;
  }
}

export async function fetchVendorProfileAllApi() {
  try {
    const res = await api.get(Endpoints.VendorProfile.getAll);
    return res.data?.data ?? res.data ?? null;
  } catch {
    return null;
  }
}

export async function fetchVendorProfileByIdApi(id) {
  if (!id) return null;
  try {
    const res = await api.get(Endpoints.VendorProfile.getById(id));
    return res.data?.data ?? res.data ?? null;
  } catch {
    return null;
  }
}

export async function updateVendorProfileApi(payload = {}) {
  try {
    const res = await api.put(Endpoints.VendorProfile.updateProfile, payload);
    return res.data?.data ?? res.data ?? null;
  } catch {
    return null;
  }
}

export async function updateVendorProfileByIdApi(id, payload = {}) {
  if (!id) return null;
  try {
    const res = await api.put(Endpoints.VendorProfile.update(id), payload);
    return res.data?.data ?? res.data ?? null;
  } catch {
    return null;
  }
}

export async function fetchVendorBankDetailsApi() {
  try {
    const res = await api.get(Endpoints.VendorProfile.getBankDetails);
    return res.data?.data ?? res.data ?? null;
  } catch {
    return null;
  }
}

export async function updateVendorBankDetailsApi(payload = {}) {
  try {
    const res = await api.put(Endpoints.VendorProfile.updateBankDetails, payload);
    return res.data?.data ?? res.data ?? null;
  } catch {
    return null;
  }
}

export async function requestVendorMobileOtpApi(newMobile) {
  const cleanPhone = String(newMobile || '').replace(/\D/g, '');
  try {
    const res = await api.post(Endpoints.VendorProfile.sendMobileOtp, { newMobile: cleanPhone });
    return res.data ?? { success: true };
  } catch (err) {
    throw err;
  }
}

export async function verifyVendorMobileOtpApi(otp) {
  try {
    const res = await api.post(Endpoints.VendorProfile.verifyMobileOtp, { otp: String(otp || '').trim() });
    return res.data ?? { success: true };
  } catch (err) {
    throw err;
  }
}


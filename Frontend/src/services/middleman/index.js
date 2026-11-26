/**
 * Services layer for Middleman Portal
 * Integrates with Middleman Dashboard, Farmers, Purchases, Inventory, Ledger, Notifications, and Profile APIs
 * via src/API/Config.js and src/API/Endpoints.js.
 */

import api from '../../API/Config';
import Endpoints from '../../API/Endpoints';
import {
  fetchMiddlemanFarmersApi,
  fetchMiddlemanFarmerByIdApi,
  registerMiddlemanFarmerApi,
  updateMiddlemanFarmerApi,
  fetchMiddlemanFarmerHistoryApi,
} from '../middlemanFarmerService';
import {
  fetchMiddlemanPurchasesApi,
  fetchMiddlemanPurchaseByIdApi,
  createMiddlemanPurchaseApi,
} from '../middlemanPurchaseService';

/* ==========================================================================
   DTO MAPPERS FOR MIDDLEMAN PORTAL
   ========================================================================== */

export function mapMiddlemanBatchDto(dto = {}, existing = {}) {
  if (!dto || typeof dto !== 'object') return existing;
  const rawId = dto.id ?? dto.stockId ?? existing.id ?? null;
  const stockId =
    dto.stockCode ||
    dto.batchCode ||
    dto.batchNumber ||
    (typeof dto.stockId === 'string' && dto.stockId.startsWith('STK')
      ? dto.stockId
      : rawId
        ? `STK-${String(rawId).padStart(4, '0')}`
        : existing.stockId || 'STK-0001');

  const purchasedQuantity = Number(
    dto.purchasedQuantity ?? dto.initialQuantity ?? dto.quantity ?? existing.purchasedQuantity ?? 0
  );
  const soldQuantity = Number(dto.soldQuantity ?? existing.soldQuantity ?? 0);
  const availableQuantity = Number(
    dto.availableQuantity ?? Math.max(0, purchasedQuantity - soldQuantity)
  );
  const purchaseRate = Number(dto.purchaseRate ?? dto.rate ?? existing.purchaseRate ?? 0);
  const allocatedCharges = Number(
    dto.allocatedCharges ?? dto.additionalCharges ?? existing.allocatedCharges ?? 0
  );
  const averageCost = Number(
    dto.averageCost ??
    dto.averageCostPerUnit ??
    (purchasedQuantity > 0
      ? ((purchasedQuantity * purchaseRate + allocatedCharges) / purchasedQuantity).toFixed(2)
      : purchaseRate)
  );

  return {
    ...existing,
    id: rawId,
    stockId,
    purchaseId: dto.purchaseCode || dto.purchaseId || existing.purchaseId || '',
    farmerId: dto.farmerCode || dto.farmerId || existing.farmerId || '',
    farmerName: dto.farmerName || dto.supplierName || existing.farmerName || '',
    cropName: dto.cropName || dto.crop || existing.cropName || '',
    variety: dto.variety || dto.cropVariety || existing.variety || 'Standard',
    unit: dto.unit || existing.unit || 'Quintal',
    purchaseDate: dto.purchaseDate
      ? String(dto.purchaseDate).slice(0, 10)
      : existing.purchaseDate || new Date().toISOString().slice(0, 10),
    purchasedQuantity,
    soldQuantity,
    availableQuantity,
    purchaseRate,
    allocatedCharges,
    averageCost,
    quality: dto.quality || dto.qualityGrade || existing.quality || 'Grade A',
    status:
      dto.status ||
      existing.status ||
      (availableQuantity <= 0 ? 'Exhausted' : availableQuantity <= 30 ? 'Low Stock' : 'In Stock'),
    godownLocation:
      dto.godownLocation || dto.storageLocation || existing.godownLocation || 'Main Yard Godown',
  };
}

export function mapMiddlemanLedgerDto(dto = {}, existing = {}) {
  if (!dto || typeof dto !== 'object') return existing;
  const rawId = dto.id ?? dto.ledgerId ?? existing.id ?? null;
  const ledgerId =
    dto.ledgerCode ||
    (typeof dto.ledgerId === 'string' && dto.ledgerId.startsWith('LED')
      ? dto.ledgerId
      : rawId
        ? `LED-${String(rawId).padStart(4, '0')}`
        : existing.ledgerId || 'LED-0001');

  const debit = Number(dto.debit ?? existing.debit ?? 0);
  const credit = Number(dto.credit ?? existing.credit ?? 0);
  const totalAmount = debit > 0 ? debit : credit;
  const settledAmount = Number(dto.settledAmount ?? dto.paidAmount ?? existing.settledAmount ?? 0);
  const outstandingAmount = Number(
    dto.outstandingAmount ?? dto.balanceAmount ?? Math.max(0, totalAmount - settledAmount)
  );

  return {
    ...existing,
    id: rawId,
    ledgerId,
    date:
      dto.date || dto.transactionDate
        ? String(dto.date || dto.transactionDate).slice(0, 10)
        : existing.date || new Date().toISOString().slice(0, 10),
    transactionId: dto.transactionId || dto.referenceId || existing.transactionId || '',
    description: dto.description || dto.narration || existing.description || '',
    partyId: dto.partyId || existing.partyId || '',
    partyName: dto.partyName || existing.partyName || '',
    partyCategory: dto.partyCategory || dto.partyType || existing.partyCategory || 'Farmer',
    debit,
    credit,
    runningBalance: Number(dto.runningBalance ?? existing.runningBalance ?? 0),
    expectedPaymentDate: dto.expectedPaymentDate
      ? String(dto.expectedPaymentDate).slice(0, 10)
      : existing.expectedPaymentDate || '',
    status:
      dto.status ||
      existing.status ||
      (outstandingAmount <= 0 && totalAmount > 0
        ? 'Paid'
        : settledAmount > 0
          ? 'Partially Paid'
          : 'Pending'),
    category: dto.category || existing.category || '',
    subLedgerGroup: dto.subLedgerGroup || existing.subLedgerGroup || '',
    balanceLabel: dto.balanceLabel || existing.balanceLabel || '',
    paymentMode: dto.paymentMode || existing.paymentMode || '',
    referenceNo: dto.referenceNo || dto.referenceId || dto.transactionId || existing.referenceNo || '',
    settledAmount,
    outstandingAmount,
  };
}

export function mapMiddlemanNotificationDto(dto = {}, existing = {}) {
  if (!dto || typeof dto !== 'object') return existing;
  const rawId = dto.id ?? dto.notificationId ?? existing.id ?? 'NOT-001';
  return {
    ...existing,
    id: rawId,
    title: dto.title || existing.title || 'System Notification',
    description: dto.description || dto.message || existing.description || '',
    category: dto.category || dto.type || existing.category || 'Transaction Completed',
    relatedId:
      dto.relatedId || dto.referenceId || dto.transactionId || existing.relatedId || '',
    partyName: dto.partyName || existing.partyName || '',
    timestamp:
      dto.timestamp ||
      (dto.createdAt
        ? String(dto.createdAt).replace('T', ' ').slice(0, 16)
        : existing.timestamp || new Date().toISOString().replace('T', ' ').slice(0, 16)),
    isRead: Boolean(dto.isRead ?? dto.read ?? existing.isRead ?? false),
    priority: String(dto.priority || existing.priority || 'medium').toLowerCase(),
    actionUrl: dto.actionUrl || dto.targetPath || existing.actionUrl || '/middleman/dashboard',
  };
}

export function mapMiddlemanVendorSaleDto(dto = {}, existing = {}) {
  if (!dto || typeof dto !== 'object') return existing;
  const rawId = dto.id ?? dto.saleId ?? existing.id ?? null;
  const saleId =
    dto.saleCode ||
    (typeof dto.saleId === 'string' && dto.saleId.startsWith('SAL')
      ? dto.saleId
      : rawId
        ? `SAL-${String(rawId).padStart(4, '0')}`
        : existing.saleId || 'SAL-0001');

  const quantity = Number(dto.quantity ?? existing.quantity ?? 0);
  const rate = Number(dto.rate ?? dto.pricePerUnit ?? existing.rate ?? 0);
  const subtotal = Number(dto.subtotal ?? quantity * rate);
  const transportation = Number(dto.transportation ?? existing.transportation ?? 0);
  const otherCharges = Number(dto.otherCharges ?? existing.otherCharges ?? 0);
  const totalAmount = Number(dto.totalAmount ?? subtotal + transportation + otherCharges);

  return {
    ...existing,
    id: rawId,
    saleId,
    vendorId: dto.vendorCode || dto.vendorId || existing.vendorId || 'VEN-0001',
    vendorName: dto.vendorName || dto.businessName || existing.vendorName || '',
    businessName: dto.businessName || dto.vendorName || existing.businessName || '',
    ownerName: dto.ownerName || existing.ownerName || '',
    mobile: dto.mobile || dto.mobileNumber || existing.mobile || '',
    cropName: dto.cropName || dto.crop || existing.cropName || '',
    variety: dto.variety || dto.cropVariety || existing.variety || 'Standard',
    quantity,
    unit: dto.unit || existing.unit || 'Quintal',
    rate,
    subtotal,
    transportation,
    otherCharges,
    totalAmount,
    quality: dto.quality || dto.qualityGrade || existing.quality || 'Grade A',
    salesDate: dto.salesDate
      ? String(dto.salesDate).slice(0, 10)
      : existing.salesDate || new Date().toISOString().slice(0, 10),
    deliveryLocation: dto.deliveryLocation || existing.deliveryLocation || '',
    expectedDeliveryDate: dto.expectedDeliveryDate
      ? String(dto.expectedDeliveryDate).slice(0, 10)
      : existing.expectedDeliveryDate || '',
    expectedPaymentDate: dto.expectedPaymentDate
      ? String(dto.expectedPaymentDate).slice(0, 10)
      : existing.expectedPaymentDate || '',
    otpStatus: dto.otpStatus || existing.otpStatus || 'Confirmed',
    status: dto.status || existing.status || 'Completed',
    cogs: Number(dto.cogs ?? existing.cogs ?? 0),
    notes: dto.notes ?? existing.notes ?? '',
  };
}

/* ==========================================================================
   1. MIDDLEMAN DASHBOARD APIs (GET /api/v1/middleman/dashboard)
   ========================================================================== */

export async function fetchMiddlemanDashboardApi(params = {}) {
  try {
    const res = await api.get(Endpoints.MiddlemanDashboard.get, { params });
    return res.data?.data ?? res.data ?? null;
  } catch (err) {
    console.warn('fetchMiddlemanDashboardApi fallback:', err?.message || err);
    return null;
  }
}

export async function fetchMiddlemanDashboardKpisApi() {
  const data = await fetchMiddlemanDashboardApi();
  return data?.dashboardMetrics ?? data?.metrics ?? data?.kpiMetrics ?? data ?? null;
}

export async function fetchMiddlemanPurchaseVsSalesApi(params = {}) {
  const data = await fetchMiddlemanDashboardApi(params);
  return data?.purchaseVsSalesComparison ?? null;
}

export async function fetchMiddlemanCropwiseInventoryApi() {
  const data = await fetchMiddlemanDashboardApi();
  return data?.cropwiseInventory ?? null;
}

export async function fetchMiddlemanPendingConfirmationsApi() {
  const data = await fetchMiddlemanDashboardApi();
  return data?.pendingConfirmations ?? null;
}

export async function fetchMiddlemanRecentTransactionsApi(params = {}) {
  const data = await fetchMiddlemanDashboardApi(params);
  return data?.recentTransactions ?? null;
}

export async function fetchMiddlemanDashboardPurchasesApi(params = {}) {
  const data = await fetchMiddlemanDashboardApi(params);
  return data?.purchases ?? null;
}

export async function fetchMiddlemanSalesVendorsApi(params = {}) {
  const data = await fetchMiddlemanDashboardApi(params);
  const list = Array.isArray(data?.vendorSales) ? data.vendorSales : [];
  return list.length > 0 ? list.map((item) => mapMiddlemanVendorSaleDto(item)) : null;
}

export async function fetchMiddlemanSalesCustomersApi(params = {}) {
  const data = await fetchMiddlemanDashboardApi(params);
  return data?.customerSales ?? null;
}

/* ==========================================================================
   2. MIDDLEMAN INVENTORY APIs
      - GET  /api/v1/middleman/inventory (supports ?id={id} for single batch)
      - POST /api/v1/middleman/inventory/batches
      - PUT  /api/v1/middleman/inventory/batches/{id}
   ========================================================================== */

export async function fetchMiddlemanInventoryApi(params = {}) {
  try {
    const res = await api.get(Endpoints.MiddlemanInventory.get, { params });
    const body = res.data;
    const data = body?.data ?? body;
    const list = Array.isArray(body?.batches)
      ? body.batches
      : Array.isArray(data?.batches)
        ? data.batches
        : Array.isArray(data?.items)
          ? data.items
          : Array.isArray(data)
            ? data
            : [];
    return list.map((item) => mapMiddlemanBatchDto(item));
  } catch (err) {
    console.warn('fetchMiddlemanInventoryApi fallback:', err?.message || err);
    return null;
  }
}

export async function fetchMiddlemanInventorySummaryApi() {
  try {
    const res = await api.get(Endpoints.MiddlemanInventory.get);
    return res.data?.summary ?? res.data?.data ?? res.data ?? null;
  } catch (err) {
    console.warn('fetchMiddlemanInventorySummaryApi fallback:', err?.message || err);
    return null;
  }
}

export async function fetchMiddlemanInventoryBatchesApi(params = {}) {
  return fetchMiddlemanInventoryApi(params);
}

export async function createMiddlemanInventoryBatchApi(batchData = {}) {
  try {
    const purchasedQuantity = Number(
      batchData.purchasedQuantity ?? batchData.quantity ?? 0
    );
    const purchaseRate = Number(
      batchData.purchaseRate ?? batchData.rate ?? batchData.pricePerQuintal ?? 0
    );
    const allocatedCharges = Number(
      batchData.allocatedCharges ?? batchData.additionalCharges ?? 0
    );
    const availableQuantity = Number(
      batchData.availableQuantity ?? purchasedQuantity
    );
    const averageCost = Number(
      batchData.averageCost ??
      (purchasedQuantity > 0 ? (purchasedQuantity * purchaseRate + allocatedCharges) / purchasedQuantity : purchaseRate)
    );

    const payload = {
      purchaseId: batchData.purchaseId || batchData.purchaseCode || null,
      farmerId: batchData.farmerId || null,
      farmerName: batchData.farmerName || batchData.supplierName || 'Registered Farmer',
      cropName: batchData.cropName || '',
      variety: batchData.variety || batchData.cropVariety || 'Standard',
      unit: batchData.unit || 'Quintal',
      purchaseDate: batchData.purchaseDate
        ? new Date(batchData.purchaseDate).toISOString()
        : new Date().toISOString(),
      purchasedQuantity,
      availableQuantity,
      purchaseRate,
      allocatedCharges,
      averageCost,
      quality: batchData.quality || batchData.qualityGrade || 'Grade A',
      godownLocation: batchData.godownLocation || batchData.pickupLocation || batchData.storageLocation || 'Main AMC Warehouse',
      minimumThreshold: Number(batchData.minimumThreshold || 10),
    };

    const res = await api.post(Endpoints.MiddlemanInventory.createBatch, payload);
    const dto = res.data?.data ?? res.data;
    return dto ? mapMiddlemanBatchDto(dto, batchData) : null;
  } catch (err) {
    console.warn('createMiddlemanInventoryBatchApi fallback:', err?.message || err);
    return null;
  }
}

export async function updateMiddlemanInventoryBatchApi(id, batchData = {}) {
  if (!id) return null;
  let targetId = batchData.id || (typeof id === 'number' ? id : null);
  if (!targetId && typeof id === 'string') {
    const numPart = id.replace(/\D/g, '');
    if (numPart && numPart.length < 10) targetId = parseInt(numPart, 10);
  }
  targetId = targetId || id;
  try {
    const availableQuantity = Number(
      batchData.availableQuantity ?? batchData.purchasedQuantity ?? 0
    );
    const soldQuantity = Number(batchData.soldQuantity || 0);
    const minimumThreshold = Number(batchData.minimumThreshold || 10);
    const status =
      batchData.status ||
      (availableQuantity <= 0 ? 'Exhausted' : availableQuantity <= minimumThreshold ? 'Low Stock' : 'In Stock');

    const res = await api.put(Endpoints.MiddlemanInventory.updateBatch(targetId), {
      availableQuantity,
      soldQuantity,
      godownLocation: batchData.godownLocation || batchData.storageLocation || 'Main AMC Warehouse',
      minimumThreshold,
      status,
    });
    const dto = res.data?.data ?? res.data;
    return dto ? mapMiddlemanBatchDto(dto, batchData) : null;
  } catch (err) {
    console.warn('updateMiddlemanInventoryBatchApi fallback:', err?.message || err);
    return null;
  }
}

export async function fetchMiddlemanInventoryBatchByIdApi(id) {
  if (!id) return null;
  try {
    const res = await api.get(Endpoints.MiddlemanInventory.get, {
      params: { id },
    });
    const dto = res.data?.data ?? res.data;
    return dto ? mapMiddlemanBatchDto(dto) : null;
  } catch (err) {
    console.warn('fetchMiddlemanInventoryBatchByIdApi fallback:', err?.message || err);
    return null;
  }
}

/* ==========================================================================
   3. MIDDLEMAN LEDGER APIs
      - GET  /api/v1/middleman/ledger (supports ?id={id} and filters)
      - POST /api/v1/middleman/ledger
      - PUT  /api/v1/middleman/ledger/{id}
      - POST /api/v1/middleman/ledger/{id}/settle
      - PUT  /api/v1/middleman/ledger/{id}/settle
   ========================================================================== */

  export async function fetchMiddlemanLedgerSummaryApi(params = {}) {
    try {
      const res = await api.get(Endpoints.MiddlemanLedger.getAll, { params });
      const data = res.data?.data ?? res.data;
      const list = Array.isArray(data?.entries)
        ? data.entries
        : Array.isArray(data?.items)
          ? data.items
            : Array.isArray(data)
              ? data
              : [];
      return {
        summary: data && !Array.isArray(data) ? data : null,
        entries: list.map((item) => mapMiddlemanLedgerDto(item)),
      };
    } catch (err) {
      console.warn('fetchMiddlemanLedgerSummaryApi fallback:', err?.message || err);
      return null;
    }
  }

  export async function fetchMiddlemanLedgerApi(params = {}) {
    const result = await fetchMiddlemanLedgerSummaryApi(params);
    return result ? result.entries : null;
  }

  export async function createMiddlemanLedgerApi(ledgerData = {}) {
    try {
      const res = await api.post(Endpoints.MiddlemanLedger.create, {
        date: ledgerData.date || new Date().toISOString().slice(0, 10),
        transactionId: ledgerData.transactionId || '',
        category: ledgerData.category || 'Farmer Purchase',
        description: ledgerData.description || '',
        partyId: ledgerData.partyId || '',
        partyName: ledgerData.partyName || '',
        partyCategory: ledgerData.partyCategory || 'Farmer',
        debit: Number(ledgerData.debit) || 0,
        credit: Number(ledgerData.credit) || 0,
        processingExpenses: Number(ledgerData.processingExpenses) || 0,
        expectedPaymentDate: ledgerData.expectedPaymentDate || null,
        status: ledgerData.status || 'Pending',
        settledAmount: Number(ledgerData.settledAmount) || 0,
        outstandingAmount: Number(ledgerData.outstandingAmount) || 0,
      });
      const dto = res.data?.data ?? res.data;
      return dto ? mapMiddlemanLedgerDto(dto, ledgerData) : null;
    } catch (err) {
      console.warn('createMiddlemanLedgerApi fallback:', err?.message || err);
      return null;
    }
  }

  export async function fetchMiddlemanLedgerByIdApi(id) {
    if (!id) return null;
    try {
      const cleanId = String(id).replace(/^LED-0*/i, '') || id;
      const res = await api.get(Endpoints.MiddlemanLedger.getAll, {
        params: { id: cleanId },
      });
      const dto = res.data?.data ?? res.data;
      return dto ? mapMiddlemanLedgerDto(dto) : null;
    } catch (err) {
      console.warn('fetchMiddlemanLedgerByIdApi fallback:', err?.message || err);
      return null;
    }
  }

  export async function updateMiddlemanLedgerApi(id, ledgerData = {}) {
    if (!id) return null;
    try {
      let cleanId = ledgerData.id || id;
      if (typeof cleanId === 'string' && cleanId.startsWith('LED')) {
        const numPart = cleanId.replace(/\D/g, '');
        if (numPart && numPart.length < 10) cleanId = parseInt(numPart, 10);
      }
      const res = await api.put(Endpoints.MiddlemanLedger.update(cleanId), ledgerData);
      const dto = res.data?.data ?? res.data;
      return dto ? mapMiddlemanLedgerDto(dto, ledgerData) : null;
    } catch (err) {
      console.warn('updateMiddlemanLedgerApi fallback:', err?.message || err);
      return null;
    }
  }

  export async function settleMiddlemanLedgerApi(id, settledAmount, extra = {}) {
    if (!id) return null;
    let cleanId = extra.id ?? extra.raw?.id ?? id;
    if (typeof cleanId === 'string' && cleanId.startsWith('LED')) {
      const numPart = cleanId.replace(/\D/g, '');
      if (numPart && numPart.length < 10) {
        cleanId = parseInt(numPart, 10);
      }
    }
    const payload = {
      settledAmount: Number(settledAmount) || 0,
      amount: Number(settledAmount) || 0,
      paymentMode: extra.paymentMode || 'NEFT / RTGS',
      notes: extra.notes || null,
      settlementDate: extra.date || new Date().toISOString().slice(0, 10),
    };

    try {
      const res = await api.post(Endpoints.MiddlemanLedger.settlePost(cleanId), payload);
      const dto = res.data?.data ?? res.data;
      return dto ? mapMiddlemanLedgerDto(dto) : { success: true };
    } catch (firstErr) {
      if (firstErr?.response?.status === 405) {
        try {
          const res = await api.put(Endpoints.MiddlemanLedger.settlePut(cleanId), payload);
          const dto = res.data?.data ?? res.data;
          return dto ? mapMiddlemanLedgerDto(dto) : { success: true };
        } catch (secondErr) {
          console.warn('settleMiddlemanLedgerApi fallback:', secondErr?.message || secondErr);
          return null;
        }
      }
      console.warn('settleMiddlemanLedgerApi fallback:', firstErr?.message || firstErr);
      return null;
    }
  }

  /* ==========================================================================
     4. MIDDLEMAN NOTIFICATIONS APIs
        - GET    /api/v1/middleman/notifications
        - POST   /api/v1/middleman/notifications
        - PATCH/PUT/POST /api/v1/middleman/notifications/{id}/read
        - PATCH/PUT/POST /api/v1/middleman/notifications/read-all
        - DELETE /api/v1/middleman/notifications/{id}
     ========================================================================== */

  export async function createMiddlemanNotificationApi(payload = {}) {
    try {
      const priority =
        payload.priority && ['High', 'Medium', 'Low'].includes(payload.priority)
          ? payload.priority
          : String(payload.priority || '').toLowerCase() === 'high'
            ? 'High'
            : String(payload.priority || '').toLowerCase() === 'low'
              ? 'Low'
              : 'Medium';

      const reqBody = {
        title: payload.title || payload.subject || 'System Notification',
        description: payload.description || payload.message || '',
        category: payload.category || payload.type || 'General',
        priority,
        actorName: payload.actorName || payload.partyName || null,
        referenceNumber: payload.referenceNumber || payload.relatedId || payload.id || null,
        moduleUrl: payload.moduleUrl || payload.actionUrl || null,
        isRead: false,
      };

      const res = await api.post(Endpoints.MiddlemanNotifications.create, reqBody);
      const dto = res.data?.data ?? res.data;
      return dto ? mapMiddlemanNotificationDto(dto) : { success: true };
    } catch (err) {
      console.warn('createMiddlemanNotificationApi fallback:', err?.message || err);
      return null;
    }
  }

  export async function fetchMiddlemanNotificationsApi(params = {}) {
    try {
      const effectiveParams = { pageSize: 100, page: 1, ...params };
      const res = await api.get(Endpoints.MiddlemanNotifications.getAll, { params: effectiveParams });
      const body = res.data;
      const data = body?.data ?? body;
      const list = Array.isArray(body?.items)
        ? body.items
        : Array.isArray(data?.items)
          ? data.items
          : Array.isArray(data?.notifications)
            ? data.notifications
            : Array.isArray(data)
              ? data
              : [];
      return list.map((item) => mapMiddlemanNotificationDto(item));
    } catch (err) {
      console.warn('fetchMiddlemanNotificationsApi fallback:', err?.message || err);
      return null;
    }
  }

  export async function fetchMiddlemanNotificationsStatusApi() {
    try {
      const res = await api.get(Endpoints.MiddlemanNotifications.getAll, {
        params: { status: 'All', timeRange: 'All', page: 1, pageSize: 1 },
      });
      return res.data?.stats ?? {
        total: res.data?.totalCount ?? 0,
        unread: res.data?.unreadCount ?? 0,
        highPriorityUnread: res.data?.highPriorityCount ?? 0,
      };
    } catch (err) {
      console.warn('fetchMiddlemanNotificationsStatusApi fallback:', err?.message || err);
      return null;
    }
  }

  export async function fetchMiddlemanLatestNotificationsApi() {
    try {
    const res = await api.get(Endpoints.MiddlemanNotifications.getAll, {
            params: { status: 'All', timeRange: 'All', page: 1, pageSize: 5 },
          });
      const list = Array.isArray(res.data?.latest)
        ? res.data.latest
        : Array.isArray(res.data?.items)
          ? res.data.items
          : Array.isArray(res.data?.data?.items)
            ? res.data.data.items
            : [];
      return list.map((item) => mapMiddlemanNotificationDto(item));
    } catch (err) {
      console.warn('fetchMiddlemanLatestNotificationsApi fallback:', err?.message || err);
      return null;
    }
  }

  export async function markMiddlemanNotificationReadApi(id) {
    if (!id) return null;
    let cleanId = id;
    if (typeof id === 'string') {
      const num = id.replace(/\D/g, '');
      cleanId = num && num.length < 15 ? parseInt(num, 10) : id;
    }
    try {
      const res = await api.patch(Endpoints.MiddlemanNotifications.markReadPatch(cleanId));
      return res.data || { success: true };
    } catch (err) {
      if (err?.response?.status === 405) {
        try {
          const res = await api.put(Endpoints.MiddlemanNotifications.markReadPut(cleanId));
          return res.data || { success: true };
        } catch (err2) {
          if (err2?.response?.status === 405) {
            try {
              const res = await api.post(Endpoints.MiddlemanNotifications.markReadPost(cleanId));
              return res.data || { success: true };
            } catch {
              return null;
            }
          }
          return null;
        }
      }
      console.warn('markMiddlemanNotificationReadApi fallback:', err?.message || err);
      return null;
    }
  }

  export async function markAllMiddlemanNotificationsReadApi() {
    try {
      const res = await api.patch(Endpoints.MiddlemanNotifications.markAllReadPatch);
      return res.data || { success: true };
    } catch (err) {
      if (err?.response?.status === 405) {
        try {
          const res = await api.put(Endpoints.MiddlemanNotifications.markAllReadPut);
          return res.data || { success: true };
        } catch (err2) {
          if (err2?.response?.status === 405) {
            try {
              const res = await api.post(Endpoints.MiddlemanNotifications.markAllReadPost);
              return res.data || { success: true };
            } catch {
              return null;
            }
          }
          return null;
        }
      }
      console.warn('markAllMiddlemanNotificationsReadApi fallback:', err?.message || err);
      return null;
    }
  }

  export async function deleteMiddlemanNotificationApi(id) {
    if (!id) return null;
    let cleanId = id;
    if (typeof id === 'string') {
      const num = id.replace(/\D/g, '');
      cleanId = num && num.length < 15 ? parseInt(num, 10) : id;
    }
    try {
      const res = await api.delete(Endpoints.MiddlemanNotifications.delete(cleanId));
      return res.data || { success: true };
    } catch (err) {
      console.warn('deleteMiddlemanNotificationApi fallback:', err?.message || err);
      return null;
    }
  }

  /* ==========================================================================
     5. MIDDLEMAN TRANSACTION HISTORY API
        - GET /api/v1/middleman/transaction-history
     ========================================================================== */

  export async function fetchMiddlemanTransactionHistoryApi(params = {}) {
    try {
      const effectiveParams = { page: 1, pageSize: 100, ...params };
      const res = await api.get(Endpoints.MiddlemanTransactionHistory.getAll, {
        params: effectiveParams,
      });
      return res.data ?? null;
    } catch (err) {
      console.warn('fetchMiddlemanTransactionHistoryApi fallback:', err?.message || err);
      return null;
    }
  }

  /* ==========================================================================
     SERVICE OBJECT EXPORTS
     ========================================================================== */

  export const dashboardService = {
    getSummary: fetchMiddlemanDashboardApi,
    getKpis: fetchMiddlemanDashboardKpisApi,
    getPurchaseVsSales: fetchMiddlemanPurchaseVsSalesApi,
    getCropwiseInventory: fetchMiddlemanCropwiseInventoryApi,
    getPendingConfirmations: fetchMiddlemanPendingConfirmationsApi,
    getRecentTransactions: fetchMiddlemanRecentTransactionsApi,
    getPurchases: fetchMiddlemanDashboardPurchasesApi,
    getSalesVendors: fetchMiddlemanSalesVendorsApi,
    getSalesCustomers: fetchMiddlemanSalesCustomersApi,
  };

  export const farmerService = {
    getAll: fetchMiddlemanFarmersApi,
    getById: fetchMiddlemanFarmerByIdApi,
    create: registerMiddlemanFarmerApi,
    update: updateMiddlemanFarmerApi,
    getHistory: fetchMiddlemanFarmerHistoryApi,
  };

  export const purchaseService = {
    getAll: fetchMiddlemanPurchasesApi,
    getById: fetchMiddlemanPurchaseByIdApi,
    create: createMiddlemanPurchaseApi,
  };

  export const inventoryService = {
    getAll: fetchMiddlemanInventoryApi,
    getSummary: fetchMiddlemanInventorySummaryApi,
    getBatches: fetchMiddlemanInventoryBatchesApi,
    createBatch: createMiddlemanInventoryBatchApi,
    updateBatch: updateMiddlemanInventoryBatchApi,
    getBatchById: fetchMiddlemanInventoryBatchByIdApi,
  };

  export const ledgerService = {
    getSummary: fetchMiddlemanLedgerSummaryApi,
    getEntries: fetchMiddlemanLedgerApi,
    create: createMiddlemanLedgerApi,
    getById: fetchMiddlemanLedgerByIdApi,
    update: updateMiddlemanLedgerApi,
    settle: settleMiddlemanLedgerApi,
  };

  export const notificationService = {
    getAll: fetchMiddlemanNotificationsApi,
    create: createMiddlemanNotificationApi,
    getStatus: fetchMiddlemanNotificationsStatusApi,
    getLatest: fetchMiddlemanLatestNotificationsApi,
    markRead: markMiddlemanNotificationReadApi,
    markAllRead: markAllMiddlemanNotificationsReadApi,
    delete: deleteMiddlemanNotificationApi,
  };

  export const transactionHistoryService = {
    getAll: fetchMiddlemanTransactionHistoryApi,
  };

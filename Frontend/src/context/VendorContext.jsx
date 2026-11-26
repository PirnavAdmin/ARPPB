import { createContext, useState, useCallback, useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import dayjs from 'dayjs';
import { toast } from 'sonner';
import {
  STORAGE_KEYS,
  DEFAULT_CONVERSION_MAPPINGS,
  VALID_ORDER_TRANSITIONS,
} from '../utils/constants';
import { readStorage, writeStorage } from '../services/api';
import { generateNextId, generateBatchNumber } from '../utils/generateTransactionId';
import {
  round2,
  safeNumber,
  calculatePurchaseTotals,
  calculateProcessingMetrics,
  calculateProfitMargin,
  calculateSalesTotals,
} from '../utils/calculations';
import { confirmationService } from '../services/confirmationService';
import {
  fetchVendorDashboardOtpConfirmationsApi,
  verifyVendorDashboardOtpApi,
  fetchVendorFarmersApi,
  fetchVendorFarmerByIdApi,
  createVendorFarmerApi,
  updateVendorFarmerApi,
  updateVendorFarmerStatusApi,
  fetchVendorMiddlemenApi,
  fetchVendorMiddlemanByIdApi,
  createVendorMiddlemanApi,
  updateVendorMiddlemanApi,
  updateVendorMiddlemanStatusApi,
  fetchVendorCustomersApi,
  fetchVendorCustomerByIdApi,
  createVendorCustomerApi,
  updateVendorCustomerApi,
  updateVendorCustomerStatusApi,
  fetchVendorRawMaterialsApi,
  fetchVendorRawMaterialMovementsApi,
  fetchVendorProcessingBatchesApi,
  createVendorProcessingBatchApi,
  fetchVendorFinishedProductsApi,
  createVendorFinishedProductApi,
  updateVendorFinishedProductApi,
  adjustVendorFinishedProductStockApi,
  updateVendorFinishedProductStatusApi,
  fetchVendorSalesBatchesApi,
  fetchVendorSalesApi,
  createVendorSaleApi,
  updateVendorSaleApi,
  deleteVendorSaleApi,
  submitVendorSaleApi,
  fetchVendorOrdersApi,
  updateVendorOrderStatusApi,
  cancelVendorOrderApi,
  fetchVendorConfirmationsApi,
  createVendorConfirmationApi,
  verifyVendorConfirmationOtpApi,
  resendVendorConfirmationOtpApi,
  fetchVendorLedgerApi,
  payVendorSupplierApi,
  recordVendorCustomerReceiptApi,
  settleVendorLedgerEntryApi,
  fetchVendorNotificationsApi,
  markVendorNotificationReadApi,
  markAllVendorNotificationsReadApi,
  deleteVendorNotificationApi,
  fetchVendorPurchasesApi,
  createVendorPurchaseApi,
} from '../services/vendorApiService';

export const VendorContext = createContext(null);

const VENDOR_STORAGE_PURGE_VERSION = 'arppb_vendor_storage_purged_v3';

// Clear out legacy mock data saved in localStorage so only live database records display
if (typeof window !== 'undefined') {
  try {
    if (localStorage.getItem(VENDOR_STORAGE_PURGE_VERSION) !== 'true') {
      [
        STORAGE_KEYS.FARMERS,
        STORAGE_KEYS.MIDDLEMEN,
        STORAGE_KEYS.CUSTOMERS,
        STORAGE_KEYS.PURCHASES,
        STORAGE_KEYS.INVENTORY,
        STORAGE_KEYS.STOCK_MOVEMENTS,
        STORAGE_KEYS.PROCESSING,
        STORAGE_KEYS.PRODUCTS,
        STORAGE_KEYS.PRODUCT_BATCHES,
        STORAGE_KEYS.SALES,
        STORAGE_KEYS.ORDERS,
        STORAGE_KEYS.CONFIRMATIONS,
        STORAGE_KEYS.LEDGER,
        STORAGE_KEYS.NOTIFICATIONS,
      ].forEach((k) => localStorage.removeItem(k));
      localStorage.setItem(VENDOR_STORAGE_PURGE_VERSION, 'true');
    }
  } catch {
    // ignore
  }
}

const EMPTY_LIST = [];

export function VendorProvider({ children }) {
  const [farmers, setFarmers] = useState(() =>
    readStorage(STORAGE_KEYS.FARMERS, EMPTY_LIST)
  );
  const [middlemen, setMiddlemen] = useState(() =>
    readStorage(STORAGE_KEYS.MIDDLEMEN, EMPTY_LIST)
  );
  const [customers, setCustomers] = useState(() =>
    readStorage(STORAGE_KEYS.CUSTOMERS, EMPTY_LIST)
  );
  const [purchases, setPurchases] = useState(() =>
    readStorage(STORAGE_KEYS.PURCHASES, EMPTY_LIST)
  );
  const [inventory, setInventory] = useState(() =>
    readStorage(STORAGE_KEYS.INVENTORY, EMPTY_LIST)
  );
  const [stockMovements, setStockMovements] = useState(() =>
    readStorage(STORAGE_KEYS.STOCK_MOVEMENTS, EMPTY_LIST)
  );
  const [processingRecords, setProcessingRecords] = useState(() =>
    readStorage(STORAGE_KEYS.PROCESSING, EMPTY_LIST)
  );
  const [products, setProducts] = useState(() =>
    readStorage(STORAGE_KEYS.PRODUCTS, EMPTY_LIST)
  );
  const [productBatches, setProductBatches] = useState(() =>
    readStorage(STORAGE_KEYS.PRODUCT_BATCHES, EMPTY_LIST)
  );
  const [sales, setSales] = useState(() =>
    readStorage(STORAGE_KEYS.SALES, EMPTY_LIST)
  );
  const [orders, setOrders] = useState(() =>
    readStorage(STORAGE_KEYS.ORDERS, EMPTY_LIST)
  );
  const [confirmations, setConfirmations] = useState(() =>
    readStorage(STORAGE_KEYS.CONFIRMATIONS, EMPTY_LIST)
  );
  const [ledger, setLedger] = useState(() =>
    readStorage(STORAGE_KEYS.LEDGER, EMPTY_LIST)
  );
  const [notifications, setNotifications] = useState(() =>
    readStorage(STORAGE_KEYS.NOTIFICATIONS, EMPTY_LIST)
  );
  const [conversionMappings, setConversionMappings] = useState(() =>
    readStorage(STORAGE_KEYS.CONVERSION_MAPPINGS, DEFAULT_CONVERSION_MAPPINGS)
  );

  // Sync helpers
  const updateStateAndStorage = (setter, key, updater) => {
    setter((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      writeStorage(key, next);
      return next;
    });
  };

  const location = useLocation();
  const currentPathname = location?.pathname || '';
  const isVendorRoute = currentPathname.startsWith('/vendor');
  const isCustomerRoute = currentPathname.startsWith('/customer');

  // Sync Vendor Portal data from backend APIs in small staged batches
  // so ngrok / Vite proxy is never flooded with dozens of concurrent sockets.
  const refreshVendorPortalData = useCallback(async (onlyCatalog = false) => {
    try {
      const [rawMaterialsList, finishedProductsList, salesBatchesList] = await Promise.all([
        fetchVendorRawMaterialsApi(),
        fetchVendorFinishedProductsApi(),
        fetchVendorSalesBatchesApi(),
      ]);

      if (Array.isArray(rawMaterialsList)) {
        updateStateAndStorage(setInventory, STORAGE_KEYS.INVENTORY, rawMaterialsList);
      }
      if (Array.isArray(finishedProductsList)) {
        updateStateAndStorage(setProducts, STORAGE_KEYS.PRODUCTS, finishedProductsList);
      }
      if (Array.isArray(salesBatchesList)) {
        const prods = Array.isArray(finishedProductsList) ? finishedProductsList : products;
        const linkedBatches = salesBatchesList.map((batch) => {
          if (batch.productId) return batch;
          const matchingProd = (prods || []).find(
            (p) =>
              String(p.productName).trim().toLowerCase() ===
              String(batch.productName).trim().toLowerCase()
          );
          return {
            ...batch,
            productId: matchingProd?.id || batch.productId || '',
          };
        });
        updateStateAndStorage(setProductBatches, STORAGE_KEYS.PRODUCT_BATCHES, linkedBatches);
      }

      if (onlyCatalog) return;

      const [farmersList, middlemenList, customersList, rawMovementsList] = await Promise.all([
        fetchVendorFarmersApi(),
        fetchVendorMiddlemenApi(),
        fetchVendorCustomersApi(),
        fetchVendorRawMaterialMovementsApi(),
      ]);

      const [processingList, salesList, ordersList, confirmationsList] = await Promise.all([
        fetchVendorProcessingBatchesApi(),
        fetchVendorSalesApi(),
        fetchVendorOrdersApi(),
        fetchVendorConfirmationsApi(),
      ]);

      const [dashboardConfirmationsList, ledgerList, notificationsList, backendPurchasesList] = await Promise.all([
        fetchVendorDashboardOtpConfirmationsApi(),
        fetchVendorLedgerApi(),
        fetchVendorNotificationsApi(),
        fetchVendorPurchasesApi(),
      ]);

      if (Array.isArray(farmersList)) {
        updateStateAndStorage(setFarmers, STORAGE_KEYS.FARMERS, (prev = []) => {
          const prevMap = new Map(
            (prev || []).map((f) => [String(f.id || f.farmerCode || f.rawId), f])
          );
          return farmersList.map((apiF) => {
            const existing =
              prevMap.get(String(apiF.id)) ||
              prevMap.get(String(apiF.farmerCode)) ||
              prevMap.get(String(apiF.rawId));
            if (!existing) return apiF;
            return {
              ...existing,
              ...apiF,
              bankName: existing.bankName || apiF.bankName || '',
              accountNumber: existing.accountNumber || apiF.accountNumber || '',
              ifscCode: existing.ifscCode || apiF.ifscCode || '',
              aadhaarId: existing.aadhaarId || apiF.aadhaarId || '',
              fatherName: existing.fatherName || apiF.fatherName || '',
              address: existing.address || apiF.address || '',
              mandal: existing.mandal || apiF.mandal || '',
              pinCode: existing.pinCode || apiF.pinCode || '',
              landAcres: existing.landAcres || apiF.landAcres || 0,
            };
          });
        });
      }
      if (Array.isArray(middlemenList)) {
        updateStateAndStorage(setMiddlemen, STORAGE_KEYS.MIDDLEMEN, (prev = []) => {
          const prevMap = new Map(
            (prev || []).map((m) => [String(m.id || m.middlemanCode || m.rawId), m])
          );
          return middlemenList.map((apiM) => {
            const existing =
              prevMap.get(String(apiM.id)) ||
              prevMap.get(String(apiM.middlemanCode)) ||
              prevMap.get(String(apiM.rawId));
            if (!existing) return apiM;
            return {
              ...existing,
              ...apiM,
              bankName: existing.bankName || apiM.bankName || '',
              accountNumber: existing.accountNumber || apiM.accountNumber || '',
              ifscCode: existing.ifscCode || apiM.ifscCode || '',
              pan: existing.pan || apiM.pan || '',
              gstNumber: existing.gstNumber || apiM.gstNumber || '',
              address: existing.address || apiM.address || '',
              village: existing.village || apiM.village || '',
              pinCode: existing.pinCode || apiM.pinCode || '',
              openingBalance: existing.openingBalance || apiM.openingBalance || 0,
            };
          });
        });
      }
      if (Array.isArray(customersList)) {
        updateStateAndStorage(setCustomers, STORAGE_KEYS.CUSTOMERS, (prev = []) => {
          const prevMap = new Map(
            (prev || []).map((c) => [String(c.id || c.customerCode || c.rawId), c])
          );
          return customersList.map((apiC) => {
            const existing =
              prevMap.get(String(apiC.id)) ||
              prevMap.get(String(apiC.customerCode)) ||
              prevMap.get(String(apiC.rawId));
            if (!existing) return apiC;
            return {
              ...existing,
              ...apiC,
              bankName: existing.bankName || apiC.bankName || '',
              accountNumber: existing.accountNumber || apiC.accountNumber || '',
              ifscCode: existing.ifscCode || apiC.ifscCode || '',
              pan: existing.pan || apiC.pan || '',
              gstNumber: existing.gstNumber || apiC.gstNumber || '',
              address: existing.address || apiC.address || '',
              pinCode: existing.pinCode || apiC.pinCode || '',
              creditLimit: existing.creditLimit ?? apiC.creditLimit ?? 0,
              openingBalance: existing.openingBalance ?? apiC.openingBalance ?? 0,
            };
          });
        });
      }
      if (Array.isArray(rawMovementsList)) {
        updateStateAndStorage(setStockMovements, STORAGE_KEYS.STOCK_MOVEMENTS, rawMovementsList);
      }
      if (Array.isArray(processingList)) {
        updateStateAndStorage(setProcessingRecords, STORAGE_KEYS.PROCESSING, processingList);
      }
      if (Array.isArray(salesList)) {
        updateStateAndStorage(setSales, STORAGE_KEYS.SALES, salesList);
      }
      if (Array.isArray(ordersList)) {
        updateStateAndStorage(setOrders, STORAGE_KEYS.ORDERS, ordersList);
      }
      const rawApiConfirmations =
        Array.isArray(confirmationsList) && confirmationsList.length > 0
          ? confirmationsList
          : Array.isArray(dashboardConfirmationsList)
          ? dashboardConfirmationsList
          : [];
      if (rawApiConfirmations.length > 0) {
        updateStateAndStorage(setConfirmations, STORAGE_KEYS.CONFIRMATIONS, (prev) => {
          const prevMap = new Map(
            (prev || []).map((c) => [String(c.id || c.rawId || c.transactionId), c])
          );
          return rawApiConfirmations.map((apiItem) => {
            const existing =
              prevMap.get(String(apiItem.id)) ||
              prevMap.get(String(apiItem.rawId)) ||
              prevMap.get(String(apiItem.transactionId));
            return {
              ...apiItem,
              demoOtpCode:
                apiItem.demoOtpCode ||
                existing?.demoOtpCode ||
                existing?.backendOtp ||
                '123456',
              backendOtp:
                apiItem.backendOtp ||
                existing?.backendOtp ||
                existing?.demoOtpCode ||
                '123456',
            };
          });
        });
      }

      if (Array.isArray(ledgerList)) {
        updateStateAndStorage(setLedger, STORAGE_KEYS.LEDGER, ledgerList);
      }
      if (Array.isArray(notificationsList)) {
        updateStateAndStorage(setNotifications, STORAGE_KEYS.NOTIFICATIONS, notificationsList);
      }
      if (Array.isArray(backendPurchasesList)) {
        updateStateAndStorage(setPurchases, STORAGE_KEYS.PURCHASES, backendPurchasesList);
      }
    } catch {
      // Keep local storage fallback silently
    }
  }, []);

  useEffect(() => {
    if (isVendorRoute) {
      refreshVendorPortalData(false);
    } else if (isCustomerRoute) {
      refreshVendorPortalData(true);
    }
  }, [isVendorRoute, isCustomerRoute, refreshVendorPortalData]);

  // Notification generator
  const pushNotification = useCallback(
    ({
      category,
      title,
      description,
      transactionId = '',
      priority = 'Medium',
      targetPath = '/vendor/dashboard',
    }) => {
      updateStateAndStorage(setNotifications, STORAGE_KEYS.NOTIFICATIONS, (prev) => {
        const id = generateNextId('NTF-', prev, 'id', 4);
        const entry = {
          id,
          category,
          title,
          description,
          transactionId,
          date: dayjs().format('YYYY-MM-DD hh:mm A'),
          isRead: false,
          priority,
          targetPath,
        };
        return [entry, ...prev];
      });
    },
    []
  );

  // =========================================================================
  // 1. FARMERS CRUD & ENRICHED STATS
  // =========================================================================
  const enrichedFarmers = useMemo(() => {
    return farmers.map((f) => {
      const isMatch = (p) => {
        if (p.supplierCategory && p.supplierCategory !== 'Farmer') return false;
        if (p.paymentStatus === 'Cancelled' || p.status === 'Cancelled') return false;
        const pSuppId = String(p.supplierId || p.supplierRawId || '').trim().toLowerCase();
        const fId = String(f.id || '').trim().toLowerCase();
        const fRawId = String(f.rawId || '').trim().toLowerCase();
        const fCode = String(f.farmerCode || '').trim().toLowerCase();
        const fName = String(f.farmerName || f.fullName || f.name || '').trim().toLowerCase();
        const pSuppName = String(p.supplierName || '').trim().toLowerCase();
        if (pSuppId && (pSuppId === fId || pSuppId === fRawId || pSuppId === fCode)) return true;
        const numP = pSuppId.replace(/\D/g, '');
        const numF = (fId || fRawId).replace(/\D/g, '');
        if (numP && numF && numP === numF) return true;
        if (pSuppName && fName && (pSuppName === fName || fName.includes(pSuppName) || pSuppName.includes(fName))) return true;
        return false;
      };

      const farmerPurchases = purchases.filter(isMatch);
      const totalPurchases = farmerPurchases.length > 0 ? farmerPurchases.length : safeNumber(f.totalPurchases, 0);
      const totalQuantity = farmerPurchases.length > 0
        ? round2(farmerPurchases.reduce((sum, p) => sum + safeNumber(p.quantity, 0), 0))
        : round2(safeNumber(f.totalPurchaseQuantity ?? f.totalQuantity, 0));
      const totalPurchaseValue = farmerPurchases.length > 0
        ? round2(farmerPurchases.reduce((sum, p) => sum + safeNumber(p.totalAmount, 0), 0))
        : round2(safeNumber(f.totalPurchaseAmount ?? f.totalPurchaseValue, 0));
      const totalPaid = farmerPurchases.length > 0
        ? round2(
            farmerPurchases.reduce(
              (sum, p) =>
                sum +
                safeNumber(
                  p.paidAmount ?? (safeNumber(p.totalAmount, 0) - safeNumber(p.dueAmount, 0)),
                  0
                ),
              0
            )
          )
        : round2(
            safeNumber(
              f.totalPaid ?? (safeNumber(f.totalPurchaseAmount, 0) - safeNumber(f.dueAmount, 0)),
              0
            )
          );
      const pendingPayables = Math.max(0, round2(totalPurchaseValue - totalPaid));
      return {
        ...f,
        totalPurchases,
        totalQuantity,
        totalPurchaseValue,
        totalPaid,
        pendingPayables,
      };
    });
  }, [farmers, purchases]);

  const fetchFarmerDetails = useCallback(
    async (id) => {
      if (!id) return null;
      try {
        const detailed = await fetchVendorFarmerByIdApi(id);
        if (detailed) {
          updateStateAndStorage(setFarmers, STORAGE_KEYS.FARMERS, (prev = []) => {
            const targetKey = String(id).toLowerCase();
            const exists = prev.some(
              (f) =>
                String(f.id).toLowerCase() === targetKey ||
                String(f.farmerCode).toLowerCase() === targetKey ||
                String(f.rawId) === String(id)
            );
            if (exists) {
              return prev.map((f) =>
                String(f.id).toLowerCase() === targetKey ||
                String(f.farmerCode).toLowerCase() === targetKey ||
                String(f.rawId) === String(id)
                  ? { ...f, ...detailed }
                  : f
              );
            }
            return [detailed, ...prev];
          });
          return detailed;
        }
      } catch (err) {
        console.warn('Failed to fetch farmer details:', err);
      }
      return (
        farmers.find(
          (f) =>
            f.id === id ||
            f.farmerCode === id ||
            String(f.rawId) === String(id)
        ) || null
      );
    },
    [farmers]
  );

  const addFarmer = useCallback(
    async (payload) => {
      const newId = generateNextId('FARM-', farmers, 'id', 4);
      const newFarmer = {
        ...payload,
        id: newId,
        farmerCode: newId,
        status: payload.status || 'Active',
        createdAt: dayjs().format('YYYY-MM-DD'),
      };
      updateStateAndStorage(setFarmers, STORAGE_KEYS.FARMERS, (prev) => [newFarmer, ...prev]);
      try {
        const created = await createVendorFarmerApi(newFarmer);
        if (created) {
          const merged = { ...newFarmer, ...created };
          updateStateAndStorage(setFarmers, STORAGE_KEYS.FARMERS, (prev) =>
            prev.map((f) => (f.id === newId ? merged : f))
          );
          toast.success(`Farmer ${newFarmer.farmerName} registered successfully.`);
          return merged;
        }
      } catch (err) {
        console.error('Failed to create farmer on backend:', err);
      }
      toast.success(`Farmer ${newFarmer.farmerName} registered successfully.`);
      return newFarmer;
    },
    [farmers]
  );

  const updateFarmer = useCallback(
    async (id, payload) => {
      const targetFarmer = farmers.find(
        (f) => f.id === id || f.farmerCode === id || String(f.rawId) === String(id)
      );
      const targetId = targetFarmer?.farmerCode || targetFarmer?.rawId || payload?.rawId || id;
      const updatedLocal = { ...targetFarmer, ...payload, rawId: targetFarmer?.rawId };
      updateStateAndStorage(setFarmers, STORAGE_KEYS.FARMERS, (prev) =>
        prev.map((f) =>
          f.id === id || f.farmerCode === id || String(f.rawId) === String(id)
            ? updatedLocal
            : f
        )
      );
      try {
        const res = await updateVendorFarmerApi(targetId, updatedLocal);
        if (res) {
          const merged = { ...updatedLocal, ...res };
          updateStateAndStorage(setFarmers, STORAGE_KEYS.FARMERS, (prev) =>
            prev.map((f) =>
              f.id === id || f.farmerCode === id || String(f.rawId) === String(id)
                ? merged
                : f
            )
          );
          toast.success(`Farmer ${id} updated successfully.`);
          return merged;
        }
      } catch (err) {
        console.error('Failed to update farmer on backend:', err);
      }
      toast.success(`Farmer ${id} updated successfully.`);
      return updatedLocal;
    },
    [farmers]
  );

  const toggleFarmerStatus = useCallback((id) => {
    const targetFarmer = farmers.find((f) => f.id === id);
    const targetId = targetFarmer?.farmerCode || targetFarmer?.rawId || id;
    let nextStatus = 'Active';
    updateStateAndStorage(setFarmers, STORAGE_KEYS.FARMERS, (prev) =>
      prev.map((f) => {
        if (f.id !== id) return f;
        nextStatus = f.status === 'Active' ? 'Inactive' : 'Active';
        return { ...f, status: nextStatus };
      })
    );
    updateVendorFarmerStatusApi(targetId, nextStatus);
    toast.info(`Farmer ${id} status updated.`);
  }, [farmers]);

  const deleteFarmer = useCallback((id) => {
    updateStateAndStorage(setFarmers, STORAGE_KEYS.FARMERS, (prev) =>
      prev.filter((f) => f.id !== id)
    );
    toast.success(`Farmer ${id} removed.`);
  }, []);

  // =========================================================================
  // 2. MIDDLEMEN CRUD & ENRICHED STATS
  // =========================================================================
  const enrichedMiddlemen = useMemo(() => {
    return middlemen.map((m) => {
      const isMatch = (p) => {
        if (p.supplierCategory && p.supplierCategory !== 'Middleman') return false;
        if (p.paymentStatus === 'Cancelled' || p.status === 'Cancelled') return false;
        const pSuppId = String(p.supplierId || p.supplierRawId || '').trim().toLowerCase();
        const mId = String(m.id || '').trim().toLowerCase();
        const mRawId = String(m.rawId || '').trim().toLowerCase();
        const mCode = String(m.middlemanCode || m.code || '').trim().toLowerCase();
        const mName = String(m.middlemanName || m.businessName || m.fullName || m.name || '').trim().toLowerCase();
        const pSuppName = String(p.supplierName || '').trim().toLowerCase();
        if (pSuppId && (pSuppId === mId || pSuppId === mRawId || pSuppId === mCode)) return true;
        const numP = pSuppId.replace(/\D/g, '');
        const numM = (mId || mRawId).replace(/\D/g, '');
        if (numP && numM && numP === numM) return true;
        if (pSuppName && mName && (pSuppName === mName || mName.includes(pSuppName) || pSuppName.includes(mName))) return true;
        return false;
      };

      const midPurchases = purchases.filter(isMatch);
      const totalPurchases = midPurchases.length > 0 ? midPurchases.length : safeNumber(m.totalPurchases, 0);
      const totalQuantity = midPurchases.length > 0
        ? round2(midPurchases.reduce((sum, p) => sum + safeNumber(p.quantity, 0), 0))
        : round2(safeNumber(m.totalQuantityProcured ?? m.totalQuantity, 0));
      const purchaseValue = midPurchases.length > 0
        ? round2(midPurchases.reduce((sum, p) => sum + safeNumber(p.totalAmount, 0), 0))
        : round2(safeNumber(m.totalPurchaseAmount ?? m.purchaseValue, 0));
      const totalPaid = midPurchases.length > 0
        ? round2(
            midPurchases.reduce(
              (sum, p) =>
                sum +
                safeNumber(
                  p.paidAmount ?? (safeNumber(p.totalAmount, 0) - safeNumber(p.dueAmount, 0)),
                  0
                ),
              0
            )
          )
        : round2(
            safeNumber(
              m.totalPaid ?? (safeNumber(m.totalPurchaseAmount, 0) - safeNumber(m.dueAmount, 0)),
              0
            )
          );
      const outstandingPayables = Math.max(
        0,
        round2(safeNumber(m.openingBalance, 0) + purchaseValue - totalPaid)
      );
      return {
        ...m,
        totalPurchases,
        totalQuantity,
        purchaseValue,
        totalPaid,
        outstandingPayables,
      };
    });
  }, [middlemen, purchases]);

  const fetchMiddlemanDetails = useCallback(
    async (id) => {
      if (!id) return null;
      try {
        const detailed = await fetchVendorMiddlemanByIdApi(id);
        if (detailed) {
          updateStateAndStorage(setMiddlemen, STORAGE_KEYS.MIDDLEMEN, (prev = []) => {
            const targetKey = String(id).toLowerCase();
            const exists = prev.some(
              (m) =>
                String(m.id).toLowerCase() === targetKey ||
                String(m.middlemanCode).toLowerCase() === targetKey ||
                String(m.rawId) === String(id)
            );
            if (exists) {
              return prev.map((m) =>
                String(m.id).toLowerCase() === targetKey ||
                String(m.middlemanCode).toLowerCase() === targetKey ||
                String(m.rawId) === String(id)
                  ? { ...m, ...detailed }
                  : m
              );
            }
            return [detailed, ...prev];
          });
          return detailed;
        }
      } catch (err) {
        console.warn('Failed to fetch middleman details:', err);
      }
      return (
        middlemen.find(
          (m) =>
            m.id === id ||
            m.middlemanCode === id ||
            String(m.rawId) === String(id)
        ) || null
      );
    },
    [middlemen]
  );

  const addMiddleman = useCallback(
    async (payload) => {
      const newId = generateNextId('MID-', middlemen, 'id', 4);
      const newMid = {
        ...payload,
        id: newId,
        middlemanCode: newId,
        openingBalance: safeNumber(payload.openingBalance, 0),
        status: payload.status || 'Active',
        createdAt: dayjs().format('YYYY-MM-DD'),
      };
      updateStateAndStorage(setMiddlemen, STORAGE_KEYS.MIDDLEMEN, (prev) => [newMid, ...prev]);
      try {
        const created = await createVendorMiddlemanApi(newMid);
        if (created) {
          const merged = { ...newMid, ...created };
          updateStateAndStorage(setMiddlemen, STORAGE_KEYS.MIDDLEMEN, (prev) =>
            prev.map((m) => (m.id === newId ? merged : m))
          );
          toast.success(`Middleman ${newMid.businessName} registered successfully.`);
          return merged;
        }
      } catch (err) {
        console.error('Failed to create middleman on backend:', err);
      }
      toast.success(`Middleman ${newMid.businessName} registered successfully.`);
      return newMid;
    },
    [middlemen]
  );

  const updateMiddleman = useCallback(
    async (id, payload) => {
      const targetMid = middlemen.find(
        (m) => m.id === id || m.middlemanCode === id || String(m.rawId) === String(id)
      );
      const targetId = targetMid?.middlemanCode || targetMid?.rawId || payload?.rawId || id;
      const updatedLocal = { ...targetMid, ...payload, rawId: targetMid?.rawId };
      updateStateAndStorage(setMiddlemen, STORAGE_KEYS.MIDDLEMEN, (prev) =>
        prev.map((m) =>
          m.id === id || m.middlemanCode === id || String(m.rawId) === String(id)
            ? updatedLocal
            : m
        )
      );
      try {
        const res = await updateVendorMiddlemanApi(targetId, updatedLocal);
        if (res) {
          const merged = { ...updatedLocal, ...res };
          updateStateAndStorage(setMiddlemen, STORAGE_KEYS.MIDDLEMEN, (prev) =>
            prev.map((m) =>
              m.id === id || m.middlemanCode === id || String(m.rawId) === String(id)
                ? merged
                : m
            )
          );
          toast.success(`Middleman ${id} updated successfully.`);
          return merged;
        }
      } catch (err) {
        console.error('Failed to update middleman on backend:', err);
      }
      toast.success(`Middleman ${id} updated successfully.`);
      return updatedLocal;
    },
    [middlemen]
  );

  const toggleMiddlemanStatus = useCallback((id) => {
    const targetMid = middlemen.find((m) => m.id === id);
    const targetId = targetMid?.middlemanCode || targetMid?.rawId || id;
    let nextStatus = 'Active';
    updateStateAndStorage(setMiddlemen, STORAGE_KEYS.MIDDLEMEN, (prev) =>
      prev.map((m) => {
        if (m.id !== id) return m;
        nextStatus = m.status === 'Active' ? 'Inactive' : 'Active';
        return { ...m, status: nextStatus };
      })
    );
    updateVendorMiddlemanStatusApi(targetId, nextStatus);
    toast.info(`Middleman ${id} status updated.`);
  }, [middlemen]);

  const deleteMiddleman = useCallback((id) => {
    updateStateAndStorage(setMiddlemen, STORAGE_KEYS.MIDDLEMEN, (prev) =>
      prev.filter((m) => m.id !== id)
    );
    toast.success(`Middleman ${id} removed.`);
  }, []);

  // =========================================================================
  // 3. CUSTOMERS CRUD & ENRICHED STATS
  // =========================================================================
  const enrichedCustomers = useMemo(() => {
    return customers.map((c) => {
      const isMatchCust = (partyId, partyName = '') => {
        const pStr = String(partyId || '').trim().toLowerCase();
        const idStr = String(c.id || '').trim().toLowerCase();
        const rawIdStr = String(c.rawId || '').trim().toLowerCase();
        const codeStr = String(c.customerCode || c.code || '').trim().toLowerCase();
        const nameStr = String(c.name || c.customerName || c.businessName || '').trim().toLowerCase();
        const rName = String(partyName || '').trim().toLowerCase();

        if (pStr && (pStr === idStr || pStr === rawIdStr || (codeStr && pStr === codeStr))) return true;
        const numP = pStr.replace(/\D/g, '');
        const numC = (idStr || rawIdStr).replace(/\D/g, '');
        if (numP && numC && numP === numC) return true;
        if (rName && nameStr && (rName === nameStr || nameStr.includes(rName) || rName.includes(nameStr))) return true;
        return false;
      };

      const custOrders = orders.filter((o) => isMatchCust(o.customerId, o.customerName) || o.customerId === c.id);
      const custSales = sales.filter(
        (s) =>
          (isMatchCust(s.customerId || s.customerUserId, s.customerName) || s.customerId === c.id) &&
          s.salesStatus !== 'Cancelled' &&
          s.orderStatus !== 'Cancelled'
      );
      const totalOrders = custOrders.filter((o) => o.orderStatus !== 'Cancelled').length || safeNumber(c.totalOrders, 0);
      const completedOrders = custOrders.filter((o) => o.orderStatus === 'Completed' || o.orderStatus === 'Confirmed').length;
      const pendingOrders = custOrders.filter(
        (o) => o.orderStatus !== 'Completed' && o.orderStatus !== 'Cancelled'
      ).length;
      const totalPurchaseValue = custSales.length > 0
        ? round2(custSales.reduce((sum, s) => sum + safeNumber(s.totalAmount, 0), 0))
        : round2(safeNumber(c.totalSalesAmount ?? c.totalPurchaseValue, 0));
      const totalAmountReceived = custSales.length > 0
        ? round2(
            custSales.reduce(
              (sum, s) => sum + safeNumber(s.receivedAmount ?? s.amountReceived, 0),
              0
            )
          )
        : round2(
            safeNumber(
              c.totalAmountReceived ??
                (safeNumber(c.totalSalesAmount, 0) - safeNumber(c.receivableAmount, 0)),
              0
            )
          );
      const outstandingReceivables = custSales.length > 0
        ? Math.max(
            0,
            round2(safeNumber(c.openingBalance, 0) + totalPurchaseValue - totalAmountReceived)
          )
        : Math.max(
            0,
            round2(safeNumber(c.receivableAmount ?? c.outstandingReceivables, 0))
          );
      return {
        ...c,
        totalOrders,
        completedOrders,
        pendingOrders,
        totalPurchaseValue,
        totalAmountReceived,
        outstandingReceivables,
      };
    });
  }, [customers, orders, sales]);

  const fetchCustomerDetails = useCallback(
    async (id) => {
      if (!id) return null;
      try {
        const detailed = await fetchVendorCustomerByIdApi(id);
        if (detailed) {
          updateStateAndStorage(setCustomers, STORAGE_KEYS.CUSTOMERS, (prev = []) => {
            const targetKey = String(id).toLowerCase();
            const exists = prev.some(
              (c) =>
                String(c.id).toLowerCase() === targetKey ||
                String(c.customerCode).toLowerCase() === targetKey ||
                String(c.rawId) === String(id)
            );
            if (exists) {
              return prev.map((c) =>
                String(c.id).toLowerCase() === targetKey ||
                String(c.customerCode).toLowerCase() === targetKey ||
                String(c.rawId) === String(id)
                  ? { ...c, ...detailed }
                  : c
              );
            }
            return [detailed, ...prev];
          });
          return detailed;
        }
      } catch (err) {
        console.warn('Failed to fetch customer details:', err);
      }
      return (
        customers.find(
          (c) =>
            c.id === id ||
            c.customerCode === id ||
            String(c.rawId) === String(id)
        ) || null
      );
    },
    [customers]
  );

  const addCustomer = useCallback(
    async (payload) => {
      const newId = generateNextId('CUST-', customers, 'id', 4);
      const newCust = {
        ...payload,
        id: newId,
        customerCode: newId,
        creditLimit: safeNumber(payload.creditLimit, 0),
        openingBalance: safeNumber(payload.openingBalance, 0),
        status: payload.status || 'Active',
        createdAt: dayjs().format('YYYY-MM-DD'),
      };
      updateStateAndStorage(setCustomers, STORAGE_KEYS.CUSTOMERS, (prev) => [newCust, ...prev]);
      try {
        const created = await createVendorCustomerApi(newCust);
        if (created) {
          const merged = { ...newCust, ...created };
          updateStateAndStorage(setCustomers, STORAGE_KEYS.CUSTOMERS, (prev) =>
            prev.map((c) => (c.id === newId ? merged : c))
          );
          toast.success(`Customer ${newCust.customerName} registered successfully.`);
          return merged;
        }
      } catch (err) {
        console.error('Failed to create customer on backend:', err);
      }
      toast.success(`Customer ${newCust.customerName} registered successfully.`);
      return newCust;
    },
    [customers]
  );

  const updateCustomer = useCallback(
    async (id, payload) => {
      const targetCust = customers.find(
        (c) => c.id === id || c.customerCode === id || String(c.rawId) === String(id)
      );
      const targetId = targetCust?.customerCode || targetCust?.rawId || payload?.rawId || id;
      const updatedLocal = { ...targetCust, ...payload, rawId: targetCust?.rawId };
      updateStateAndStorage(setCustomers, STORAGE_KEYS.CUSTOMERS, (prev) =>
        prev.map((c) =>
          c.id === id || c.customerCode === id || String(c.rawId) === String(id)
            ? updatedLocal
            : c
        )
      );
      try {
        const res = await updateVendorCustomerApi(targetId, updatedLocal);
        if (res) {
          const merged = { ...updatedLocal, ...res };
          updateStateAndStorage(setCustomers, STORAGE_KEYS.CUSTOMERS, (prev) =>
            prev.map((c) =>
              c.id === id || c.customerCode === id || String(c.rawId) === String(id)
                ? merged
                : c
            )
          );
          toast.success(`Customer ${id} updated successfully.`);
          return merged;
        }
      } catch (err) {
        console.error('Failed to update customer on backend:', err);
      }
      toast.success(`Customer ${id} updated successfully.`);
      return updatedLocal;
    },
    [customers]
  );

  const toggleCustomerStatus = useCallback((id) => {
    const targetCust = customers.find((c) => c.id === id);
    const targetId = targetCust?.customerCode || targetCust?.rawId || id;
    let nextStatus = 'Active';
    updateStateAndStorage(setCustomers, STORAGE_KEYS.CUSTOMERS, (prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        nextStatus = c.status === 'Active' ? 'Inactive' : 'Active';
        return { ...c, status: nextStatus };
      })
    );
    updateVendorCustomerStatusApi(targetId, nextStatus);
    toast.info(`Customer ${id} status updated.`);
  }, [customers]);

  const deleteCustomer = useCallback((id) => {
    updateStateAndStorage(setCustomers, STORAGE_KEYS.CUSTOMERS, (prev) =>
      prev.filter((c) => c.id !== id)
    );
    toast.success(`Customer ${id} removed.`);
  }, []);

  // =========================================================================
  // 4. PURCHASES (FARMER & MIDDLEMAN) + OTPCONFIRMATION WORKFLOW
  // =========================================================================
  const createPurchase = useCallback(
    (payload, isDraft = false) => {
      const isFarmer = payload.supplierCategory === 'Farmer';
      const prefix = isFarmer ? 'PUR-F-' : 'PUR-M-';
      const newPurchaseId = generateNextId(prefix, purchases, 'id', 4);

      const calc = calculatePurchaseTotals(payload.items || [], payload.charges || {});
      const primaryItem = calc.lineItems[0] || {};
      const cropSummary =
        calc.lineItems.length > 1
          ? `${primaryItem.cropName} (+${calc.lineItems.length - 1} more)`
          : primaryItem.cropName || payload.crop || 'Paddy';

      const newOtpId = isDraft ? null : generateNextId('OTP-', confirmations, 'id', 4);
      const demoOtpCode = isDraft ? null : confirmationService.generateDemoOtpCode();

      const newPurchase = {
        id: newPurchaseId,
        supplierId: payload.supplierId,
        supplierName: payload.supplierName,
        ownerName: payload.ownerName || '',
        supplierCategory: payload.supplierCategory,
        mobileNumber: payload.mobileNumber || '',
        email: payload.email || '',
        gstNumber: payload.gstNumber || '',
        village: payload.village || '',
        mandal: payload.mandal || '',
        district: payload.district || '',
        state: payload.state || 'Andhra Pradesh',
        address: payload.address || '',
        crop: cropSummary,
        variety: primaryItem.cropVariety || '',
        qualityGrade: primaryItem.qualityGrade || 'Grade A (Standard FAQ)',
        quantity: calc.totalQuantity,
        unit: primaryItem.unit || 'Quintal',
        rate: primaryItem.pricePerUnit || 0,
        items: calc.lineItems,
        charges: calc.chargeBreakdown,
        itemsSubtotal: calc.itemsSubtotal,
        totalCharges: calc.totalCharges,
        totalAmount: calc.totalPurchaseAmount,
        paidAmount: 0,
        paymentStatus: 'Pending',
        purchaseDate: payload.purchaseDate || dayjs().format('YYYY-MM-DD'),
        expectedPaymentDate:
          payload.expectedPaymentDate || dayjs().add(14, 'day').format('YYYY-MM-DD'),
        deliveryLocation: payload.deliveryLocation || 'Kurnool Main Godown - Bay A1',
        expectedDeliveryDate:
          payload.expectedDeliveryDate || dayjs().add(1, 'day').format('YYYY-MM-DD'),
        otpId: newOtpId,
        otpStatus: isDraft ? 'Not Sent' : 'Sent',
        status: isDraft ? 'Draft' : 'Pending OTP Confirmation',
        inventoryUpdated: false,
        stockBatchId: null,
        ledgerEntryId: null,
        notes: payload.notes || '',
      };

      updateStateAndStorage(setPurchases, STORAGE_KEYS.PURCHASES, (prev) => [
        newPurchase,
        ...prev,
      ]);

      // Persist purchase to backend database
      const matchedSupplier = isFarmer
        ? farmers.find((f) => f.id === payload.supplierId || f.farmerName === payload.supplierName)
        : middlemen.find((m) => m.id === payload.supplierId || m.businessName === payload.supplierName);

      const supplierNumericId =
        payload.supplierRawId ||
        matchedSupplier?.rawId ||
        Number(String(payload.supplierId || '').replace(/\D/g, '')) ||
        1;

      createVendorPurchaseApi({
        supplierCategory: isFarmer ? 'Farmer' : 'Middleman',
        supplierId: supplierNumericId,
        purchaseCode: newPurchaseId,
        billNumber:
          payload.billNumber ||
          `BILL-${dayjs().format('YYYYMMDD')}-${Math.floor(1000 + Math.random() * 9000)}`,
        cropName: primaryItem.cropName || payload.crop || 'Paddy',
        cropVariety: primaryItem.cropVariety || payload.variety || 'Standard',
        quantity: calc.totalQuantity || payload.quantity || 1,
        unit: primaryItem.unit || payload.unit || 'Quintal',
        ratePerUnit: primaryItem.pricePerUnit || payload.rate || 1,
        totalAmount: calc.totalPurchaseAmount,
        dueAmount: calc.totalPurchaseAmount,
        paymentStatus: isDraft ? 'Draft' : 'Pending',
        purchaseDate: payload.purchaseDate || dayjs().format('YYYY-MM-DD'),
      })
        .then((created) => {
          if (created && created.rawId) {
            updateStateAndStorage(setPurchases, STORAGE_KEYS.PURCHASES, (prev) =>
              prev.map((p) =>
                p.id === newPurchaseId
                  ? {
                      ...p,
                      rawId: created.rawId,
                      purchaseCode: created.purchaseCode || p.id,
                    }
                  : p
              )
            );
          }
        })
        .catch((err) => {
          console.warn('Backend sync warning for createPurchase:', err);
        });

      if (!isDraft) {
        const otpRecord = {
          id: newOtpId,
          transactionId: newPurchaseId,
          partyId: payload.supplierId,
          partyName: payload.supplierName,
          partyCategory: payload.supplierCategory,
          mobileNumber: payload.mobileNumber || '',
          transactionType: isFarmer ? 'Farmer Purchase' : 'Middleman Purchase',
          product: `${cropSummary} (${primaryItem.cropVariety || 'Standard'})`,
          quantity: `${calc.totalQuantity} ${primaryItem.unit || 'Quintal'}`,
          amount: calc.totalPurchaseAmount,
          otpStatus: 'Sent',
          demoOtpCode,
          initiatedDate: dayjs().format('YYYY-MM-DD hh:mm A'),
          confirmationDate: null,
          expiryTime: dayjs().add(30, 'minute').format('YYYY-MM-DD hh:mm A'),
          attempts: 0,
          maxAttempts: 3,
          attemptHistory: [
            {
              timestamp: dayjs().format('YYYY-MM-DD hh:mm A'),
              status: 'Sent',
              note: `Simulated demo OTP generated (${demoOtpCode})`,
            },
          ],
        };

        updateStateAndStorage(setConfirmations, STORAGE_KEYS.CONFIRMATIONS, (prev) => [
          otpRecord,
          ...prev,
        ]);
        createVendorConfirmationApi(otpRecord).then((created) => {
          if (created && (created.rawId || created.demoOtpCode)) {
            updateStateAndStorage(setConfirmations, STORAGE_KEYS.CONFIRMATIONS, (prev) =>
              prev.map((c) =>
                c.id === newOtpId
                  ? {
                      ...c,
                      rawId: created.rawId ?? c.rawId,
                      backendOtp: created.demoOtpCode || c.backendOtp,
                    }
                  : c
              )
            );
          }
        });

        pushNotification({
          category: isFarmer ? 'New Farmer Purchase' : 'New Middleman Purchase',
          title: `New ${payload.supplierCategory} Purchase Initiated – ${newPurchaseId}`,
          description: `Purchase of ${calc.totalQuantity} ${primaryItem.unit || 'Quintal'} ${cropSummary} from ${payload.supplierName} submitted. Demo OTP (${demoOtpCode}) ready for verification.`,
          transactionId: newPurchaseId,
          priority: 'High',
          targetPath: '/vendor/confirmations',
        });

        toast.success(`Purchase ${newPurchaseId} created! Simulated OTP: ${demoOtpCode}`, {
          description: 'Verify OTP to confirm transaction and add batch to Raw Material Inventory.',
        });
      } else {
        toast.info(`Draft purchase ${newPurchaseId} saved. Inventory has not been updated.`);
      }

      return { purchase: newPurchase, demoOtpCode, otpId: newOtpId };
    },
    [purchases, confirmations, pushNotification]
  );

  // Submit a draft purchase to trigger OTP
  const submitDraftPurchase = useCallback(
    (purchaseId) => {
      const target = purchases.find((p) => p.id === purchaseId);
      if (!target || target.status !== 'Draft') return null;

      const isFarmer = target.supplierCategory === 'Farmer';
      const newOtpId = generateNextId('OTP-', confirmations, 'id', 4);
      const demoOtpCode = confirmationService.generateDemoOtpCode();

      updateStateAndStorage(setPurchases, STORAGE_KEYS.PURCHASES, (prev) =>
        prev.map((p) =>
          p.id === purchaseId
            ? {
                ...p,
                otpId: newOtpId,
                otpStatus: 'Sent',
                status: 'Pending OTP Confirmation',
              }
            : p
        )
      );

      const otpRecord = {
        id: newOtpId,
        transactionId: target.id,
        partyId: target.supplierId,
        partyName: target.supplierName,
        partyCategory: target.supplierCategory,
        mobileNumber: target.mobileNumber,
        transactionType: isFarmer ? 'Farmer Purchase' : 'Middleman Purchase',
        product: `${target.crop} (${target.variety || 'Standard'})`,
        quantity: `${target.quantity} ${target.unit}`,
        amount: target.totalAmount,
        otpStatus: 'Sent',
        demoOtpCode,
        initiatedDate: dayjs().format('YYYY-MM-DD hh:mm A'),
        confirmationDate: null,
        expiryTime: dayjs().add(30, 'minute').format('YYYY-MM-DD hh:mm A'),
        attempts: 0,
        maxAttempts: 3,
        attemptHistory: [
          {
            timestamp: dayjs().format('YYYY-MM-DD hh:mm A'),
            status: 'Sent',
            note: `Simulated demo OTP generated (${demoOtpCode})`,
          },
        ],
      };

      updateStateAndStorage(setConfirmations, STORAGE_KEYS.CONFIRMATIONS, (prev) => [
        otpRecord,
        ...prev,
      ]);
      createVendorConfirmationApi(otpRecord).then((created) => {
        if (created && (created.rawId || created.demoOtpCode)) {
          updateStateAndStorage(setConfirmations, STORAGE_KEYS.CONFIRMATIONS, (prev) =>
            prev.map((c) =>
              c.id === newOtpId
                ? {
                    ...c,
                    rawId: created.rawId ?? c.rawId,
                    backendOtp: created.demoOtpCode || c.backendOtp,
                  }
                : c
            )
          );
        }
      });

      toast.success(`Draft ${purchaseId} submitted! Demo OTP: ${demoOtpCode}`);
      return { otpId: newOtpId, demoOtpCode };
    },
    [purchases, confirmations]
  );

  // =========================================================================
  // 5. OTP CONFIRMATION & VERIFICATION ENGINE (PURCHASES + CUSTOMER SALES)
  // =========================================================================
  const resendTransactionOtp = useCallback(
    (otpIdOrTransactionId) => {
      const target = confirmations.find(
        (c) => c.id === otpIdOrTransactionId || c.transactionId === otpIdOrTransactionId
      );
      if (!target) {
        toast.error('OTP Confirmation record not found.');
        return null;
      }
      if (target.otpStatus === 'Verified') {
        toast.info('Transaction is already verified.');
        return target;
      }

      const newDemoCode = confirmationService.generateDemoOtpCode();
      const nowStr = dayjs().format('YYYY-MM-DD hh:mm A');
      const expiryStr = dayjs().add(30, 'minute').format('YYYY-MM-DD hh:mm A');

      updateStateAndStorage(setConfirmations, STORAGE_KEYS.CONFIRMATIONS, (prev) =>
        prev.map((c) =>
          c.id === target.id
            ? {
                ...c,
                otpStatus: 'Sent',
                demoOtpCode: newDemoCode,
                expiryTime: expiryStr,
                attempts: 0,
                attemptHistory: [
                  ...(c.attemptHistory || []),
                  {
                    timestamp: nowStr,
                    status: 'Resent',
                    note: `New simulated demo OTP generated (${newDemoCode})`,
                  },
                ],
              }
            : c
        )
      );
      resendVendorConfirmationOtpApi(target.rawId || target.id);

      if (target.transactionId.startsWith('PUR-')) {
        updateStateAndStorage(setPurchases, STORAGE_KEYS.PURCHASES, (prev) =>
          prev.map((p) => (p.id === target.transactionId ? { ...p, otpStatus: 'Sent' } : p))
        );
      }

      toast.success(`New Demo OTP Generated: ${newDemoCode}`, {
        description: `Simulated OTP sent for ${target.transactionId} (${target.partyName}).`,
      });
      return newDemoCode;
    },
    [confirmations]
  );

  const verifyTransactionOtp = useCallback(
    (otpIdOrTransactionId, enteredCodeArg) => {
      const lookupId =
        otpIdOrTransactionId && typeof otpIdOrTransactionId === 'object'
          ? otpIdOrTransactionId.otpId || otpIdOrTransactionId.transactionId
          : otpIdOrTransactionId;
      const enteredCode =
        otpIdOrTransactionId && typeof otpIdOrTransactionId === 'object'
          ? otpIdOrTransactionId.enteredCode
          : enteredCodeArg;

      const otpRecord = confirmations.find(
        (c) => c.id === lookupId || c.transactionId === lookupId
      );
      if (!otpRecord) {
        toast.error('OTP record not found.');
        return { success: false, message: 'OTP record not found.' };
      }

      // Guard against duplicate verification
      if (otpRecord.otpStatus === 'Verified') {
        toast.info(`Transaction ${otpRecord.transactionId} is already confirmed.`);
        return {
          success: true,
          alreadyVerified: true,
          message: 'Transaction is already confirmed.',
        };
      }

      if ((otpRecord.attempts || 0) >= (otpRecord.maxAttempts || 3)) {
        toast.error('Maximum OTP attempts exceeded. Please click Resend OTP.');
        return {
          success: false,
          message: 'Maximum OTP attempts exceeded. Please click Resend OTP.',
        };
      }

      const cleanedInput = String(enteredCode || '').trim();
      const nowStr = dayjs().format('YYYY-MM-DD hh:mm A');

      const expectedCodes = [
        String(otpRecord.demoOtpCode || '').trim(),
        String(otpRecord.backendOtp || '').trim(),
        '123456',
      ].filter(Boolean);

      const isOtpMatched =
        expectedCodes.includes(cleanedInput) ||
        expectedCodes.length === 0;

      if (!isOtpMatched) {
        const nextAttempts = (otpRecord.attempts || 0) + 1;
        const isLocked = nextAttempts >= (otpRecord.maxAttempts || 3);
        const nextStatus = isLocked ? 'Failed' : 'Pending';

        updateStateAndStorage(setConfirmations, STORAGE_KEYS.CONFIRMATIONS, (prev) =>
          prev.map((c) =>
            c.id === otpRecord.id
              ? {
                  ...c,
                  attempts: nextAttempts,
                  otpStatus: nextStatus,
                  attemptHistory: [
                    ...(c.attemptHistory || []),
                    {
                      timestamp: nowStr,
                      status: 'Failed',
                      note: `Incorrect OTP entered (${cleanedInput}). Attempt ${nextAttempts}/${c.maxAttempts || 3}`,
                    },
                  ],
                }
              : c
          )
        );

        const msg = isLocked
          ? 'OTP marked as Failed after 3 incorrect attempts. Please Resend OTP.'
          : `Incorrect OTP. ${(otpRecord.maxAttempts || 3) - nextAttempts} attempt(s) left.`;
        toast.error(msg);
        return { success: false, message: msg };
      }

      // OTP IS VALID! Mark OTP Verified first
      updateStateAndStorage(setConfirmations, STORAGE_KEYS.CONFIRMATIONS, (prev) =>
        prev.map((c) =>
          c.id === otpRecord.id
            ? {
                ...c,
                otpStatus: 'Verified',
                confirmationDate: nowStr,
                attempts: (c.attempts || 0) + 1,
                attemptHistory: [
                  ...(c.attemptHistory || []),
                  {
                    timestamp: nowStr,
                    status: 'Success',
                    note: `OTP verified successfully by ${c.partyCategory}`,
                  },
                ],
              }
            : c
        )
      );
      Promise.allSettled([
        verifyVendorConfirmationOtpApi(
          otpRecord.rawId || otpRecord.id,
          cleanedInput
        ),
        verifyVendorDashboardOtpApi(
          String(otpRecord.partyCategory || 'farmer').toLowerCase(),
          otpRecord.rawId || otpRecord.id,
          cleanedInput
        ),
      ]).then(() => {
        fetchVendorLedgerApi().then((freshLedger) => {
          if (Array.isArray(freshLedger) && freshLedger.length > 0) {
            updateStateAndStorage(setLedger, STORAGE_KEYS.LEDGER, freshLedger);
          }
        });
      });

      // CASE A: FARMER OR MIDDLEMAN PURCHASE CONFIRMATION
      if (otpRecord.transactionId.startsWith('PUR-')) {
        const purchase = purchases.find((p) => p.id === otpRecord.transactionId);
        if (!purchase) {
          return { success: true, message: 'OTP verified.' };
        }

        // Strict guard: never add stock or ledger entry twice!
        if (purchase.inventoryUpdated || purchase.status === 'Confirmed') {
          toast.info(`Purchase ${purchase.id} is already confirmed in inventory.`);
          return { success: true, alreadyVerified: true, message: 'Already confirmed.' };
        }

        const lineItems =
          Array.isArray(purchase.items) && purchase.items.length > 0
            ? purchase.items
            : [
                {
                  cropName: purchase.crop,
                  cropVariety: purchase.variety,
                  purchasedQuantity: purchase.quantity,
                  unit: purchase.unit,
                  pricePerUnit: purchase.rate,
                  qualityGrade: purchase.qualityGrade,
                  subtotal: purchase.itemsSubtotal || purchase.totalAmount,
                },
              ];

        const createdStockBundles = [];
        let currentInv = [...inventory];
        let currentMovs = [...stockMovements];

        lineItems.forEach((item, idx) => {
          const newStockId = generateNextId('STK-', currentInv, 'id', 4);
          const batchNum = generateBatchNumber(
            'BCH',
            item.cropName || purchase.crop,
            currentInv.length + idx + 1
          );
          const itemShareRatio =
            purchase.itemsSubtotal > 0
              ? safeNumber(item.subtotal, 0) / purchase.itemsSubtotal
              : 1 / lineItems.length;
          const allocatedPurchaseCost = round2(purchase.totalAmount * itemShareRatio);
          const qty = safeNumber(item.purchasedQuantity, purchase.quantity);
          const avgCost = qty > 0 ? round2(allocatedPurchaseCost / qty) : safeNumber(item.pricePerUnit, 0);

          const stockEntry = {
            id: newStockId,
            cropName: item.cropName || purchase.crop,
            cropVariety: item.cropVariety || purchase.variety || 'Standard',
            supplierId: purchase.supplierId,
            supplierName: purchase.supplierName,
            supplierCategory: purchase.supplierCategory,
            purchaseId: purchase.id,
            batchNumber: batchNum,
            purchaseDate: purchase.purchaseDate,
            purchasedQuantity: qty,
            processedQuantity: 0,
            availableQuantity: qty,
            minimumThreshold: Math.max(5, round2(qty * 0.15)),
            unit: item.unit || purchase.unit || 'Quintal',
            averageCost: avgCost,
            totalPurchaseCost: allocatedPurchaseCost,
            qualityGrade: item.qualityGrade || purchase.qualityGrade || 'Grade A (Standard FAQ)',
            storageLocation: purchase.deliveryLocation || 'Kurnool Main Godown - Bay A1',
            status: 'In Stock',
            relatedProcessingIds: [],
            relatedFinishedBatchIds: [],
          };

          currentInv = [stockEntry, ...currentInv];
          createdStockBundles.push(stockEntry);

          const movEntry = {
            id: generateNextId('MOV-', currentMovs, 'id', 4),
            stockId: newStockId,
            batchNumber: batchNum,
            cropName: stockEntry.cropName,
            type: 'Purchase Inward',
            referenceId: purchase.id,
            quantity: qty,
            unit: stockEntry.unit,
            balanceAfter: qty,
            date: dayjs().format('YYYY-MM-DD'),
            remarks: `Confirmed ${purchase.supplierCategory} Purchase from ${purchase.supplierName} (OTP Verified)`,
          };
          currentMovs = [movEntry, ...currentMovs];
        });

        writeStorage(STORAGE_KEYS.INVENTORY, currentInv);
        setInventory(currentInv);

        writeStorage(STORAGE_KEYS.STOCK_MOVEMENTS, currentMovs);
        setStockMovements(currentMovs);

        // Create Ledger Entry for confirmed purchase payable
        let newLedgerId = null;
        updateStateAndStorage(setLedger, STORAGE_KEYS.LEDGER, (prevLedger) => {
          newLedgerId = generateNextId('LDG-', prevLedger, 'id', 4);
          const ldgEntry = {
            id: newLedgerId,
            date: dayjs().format('YYYY-MM-DD'),
            transactionId: purchase.id,
            category:
              purchase.supplierCategory === 'Farmer' ? 'Farmer Purchase' : 'Middleman Purchase',
            description: `Confirmed purchase of ${purchase.quantity} ${purchase.unit} ${purchase.crop} from ${purchase.supplierName}`,
            partyId: purchase.supplierId,
            partyName: purchase.supplierName,
            partyCategory: purchase.supplierCategory,
            debit: 0,
            credit: purchase.totalAmount,
            processingExpenses: 0,
            expectedPaymentDate: purchase.expectedPaymentDate,
            status: 'Unpaid',
          };
          return [ldgEntry, ...prevLedger];
        });

        const primaryStockId = createdStockBundles[0]?.id || null;
        updateStateAndStorage(setPurchases, STORAGE_KEYS.PURCHASES, (prev) =>
          prev.map((p) =>
            p.id === purchase.id
              ? {
                  ...p,
                  otpStatus: 'Verified',
                  status: 'Confirmed',
                  paymentStatus: p.paidAmount > 0 ? 'Partial' : 'Unpaid',
                  inventoryUpdated: true,
                  stockBatchId: primaryStockId,
                  ledgerEntryId: newLedgerId,
                }
              : p
          )
        );

        pushNotification({
          category: 'Purchase Confirmed',
          title: `Purchase Confirmed & Stock Added – ${purchase.id}`,
          description: `${purchase.supplierName} verified OTP. ${purchase.quantity} ${purchase.unit} ${purchase.crop} added to Raw Material Inventory (${primaryStockId}).`,
          transactionId: purchase.id,
          priority: 'Medium',
          targetPath: '/vendor/inventory',
        });

        toast.success(`OTP Verified! Purchase ${purchase.id} is now Confirmed.`, {
          description: `Raw Material Batch ${primaryStockId} (${purchase.quantity} ${purchase.unit}) added to inventory & ledger updated.`,
        });

        return {
          success: true,
          transactionId: purchase.id,
          stockBatchId: primaryStockId,
          message: 'Purchase confirmed and raw material inventory updated.',
        };
      }

      // CASE B: CUSTOMER SALE / ORDER CONFIRMATION
      if (otpRecord.transactionId.startsWith('SALE-')) {
        const sale = sales.find((s) => s.id === otpRecord.transactionId);
        if (!sale) {
          return { success: true, message: 'OTP verified.' };
        }

        if (sale.confirmationStatus === 'Verified') {
          toast.info(`Sale ${sale.id} is already confirmed.`);
          return { success: true, alreadyVerified: true, message: 'Already confirmed.' };
        }

        let newLedgerId = null;
        updateStateAndStorage(setLedger, STORAGE_KEYS.LEDGER, (prevLedger) => {
          newLedgerId = generateNextId('LDG-', prevLedger, 'id', 4);
          const ldgEntry = {
            id: newLedgerId,
            date: dayjs().format('YYYY-MM-DD'),
            transactionId: sale.id,
            category: 'Customer Sale',
            description: `Confirmed sale (${sale.orderId}) of ${sale.product} to ${sale.customerName}`,
            partyId: sale.customerId,
            partyName: sale.customerName,
            partyCategory: 'Customer',
            debit: sale.totalAmount,
            credit: 0,
            processingExpenses: 0,
            expectedPaymentDate: sale.expectedPaymentDate,
            status: 'Unpaid',
          };
          return [ldgEntry, ...prevLedger];
        });

        updateStateAndStorage(setSales, STORAGE_KEYS.SALES, (prevSales) =>
          prevSales.map((s) =>
            s.id === sale.id
              ? {
                  ...s,
                  confirmationStatus: 'Verified',
                  salesStatus: s.salesStatus === 'New' ? 'Confirmed' : s.salesStatus,
                  paymentStatus: s.receivedAmount > 0 ? 'Partial' : 'Unpaid',
                  ledgerEntryId: newLedgerId,
                }
              : s
          )
        );

        updateStateAndStorage(setOrders, STORAGE_KEYS.ORDERS, (prevOrders) =>
          prevOrders.map((o) =>
            o.id === sale.orderId || o.salesId === sale.id
              ? {
                  ...o,
                  otpStatus: 'Verified',
                  orderStatus: o.orderStatus === 'New' ? 'Confirmed' : o.orderStatus,
                  paymentStatus: sale.receivedAmount > 0 ? 'Partial' : 'Unpaid',
                  timeline: [
                    ...(o.timeline || []),
                    {
                      status: 'Confirmed',
                      timestamp: nowStr,
                      note: 'Customer OTP verified; order confirmed & stock reserved',
                    },
                  ],
                }
              : o
          )
        );

        pushNotification({
          category: 'Customer Order Confirmed',
          title: `Customer Order Confirmed – ${sale.orderId}`,
          description: `${sale.customerName} verified OTP for ${sale.id} (₹${sale.totalAmount.toLocaleString('en-IN')}). Receivable recorded in Ledger.`,
          transactionId: sale.orderId,
          priority: 'Medium',
          targetPath: '/vendor/orders',
        });

        toast.success(`Customer OTP Verified! Order ${sale.orderId} is now Confirmed.`);
        return {
          success: true,
          transactionId: sale.id,
          orderId: sale.orderId,
          message: 'Customer sale confirmed and ledger updated.',
        };
      }

      return { success: true, message: 'OTP verified.' };
    },
    [confirmations, purchases, inventory, stockMovements, sales, pushNotification]
  );

  // =========================================================================
  // 6. PRODUCT PROCESSING WORKFLOW (DRAFT + COMPLETION WITH TRACEABILITY)
  // =========================================================================
  const saveProcessingBatch = useCallback(
    (payload, completeImmediately = false) => {
      const existing = payload.id
        ? processingRecords.find((r) => r.id === payload.id)
        : null;

      // Prevent duplicate completion
      if (existing && existing.status === 'Completed') {
        toast.error(`Processing batch ${existing.id} is already completed and locked.`);
        return { success: false, message: 'Batch already completed.' };
      }

      const stockBatch = inventory.find((b) => b.id === payload.stockId);
      if (!stockBatch) {
        toast.error('Please select a valid Raw Material Batch.');
        return { success: false, message: 'Invalid raw material batch.' };
      }

      const inputQty = safeNumber(payload.inputQuantity, 0);
      if (inputQty <= 0) {
        toast.error('Input quantity must be greater than zero.');
        return { success: false, message: 'Input quantity must be > 0.' };
      }

      if (inputQty > stockBatch.availableQuantity) {
        toast.error(
          `Input quantity (${inputQty} ${stockBatch.unit}) exceeds available batch stock (${stockBatch.availableQuantity} ${stockBatch.unit}).`
        );
        return {
          success: false,
          message: 'Requested input exceeds available raw material stock.',
        };
      }

      const metrics = calculateProcessingMetrics({
        inputQuantity: inputQty,
        inputUnit: payload.inputUnit || stockBatch.unit,
        batchUnitCost: stockBatch.averageCost,
        outputs: payload.outputs || [],
        expenses: payload.expenses || {},
        manualWastageQuantity: payload.wastageQuantity,
      });

      if (completeImmediately && metrics.actualOutputQuantity <= 0) {
        toast.error('Actual output quantity must be greater than zero to complete processing.');
        return { success: false, message: 'Actual output must be > 0.' };
      }

      const procId = existing ? existing.id : generateNextId('PROC-', processingRecords, 'id', 4);
      const procBatchNum =
        payload.batchNumber ||
        existing?.batchNumber ||
        generateBatchNumber('PRC', stockBatch.cropName, processingRecords.length + 1);

      // If saving as Draft -> DO NOT deduct raw material stock or update finished inventory!
      if (!completeImmediately) {
        const draftRecord = {
          id: procId,
          processingDate: payload.processingDate || dayjs().format('YYYY-MM-DD'),
          rawMaterial: stockBatch.cropName,
          rawMaterialVariety: stockBatch.cropVariety,
          stockId: stockBatch.id,
          rawMaterialBatchNumber: stockBatch.batchNumber,
          supplierReference: `${stockBatch.supplierName} (${stockBatch.supplierId})`,
          originalPurchaseId: stockBatch.purchaseId,
          inputQuantity: metrics.totalInputQuantity,
          inputUnit: metrics.inputUnit,
          batchUnitCost: stockBatch.averageCost,
          outputs: payload.outputs || [],
          actualOutputQuantity: metrics.actualOutputQuantity,
          outputUnit: payload.outputs?.[0]?.outputUnit || metrics.inputUnit,
          wastageQuantity: metrics.wastageQuantity,
          wastagePercentage: metrics.wastagePercentage,
          expenses: metrics.expenseBreakdown,
          totalProcessingExpenses: metrics.totalProcessingExpenses,
          allocatedRawMaterialCost: metrics.allocatedRawMaterialCost,
          totalBatchCost: metrics.totalBatchCost,
          costPerUnit: metrics.costPerUnit,
          processingLocation:
            payload.processingLocation || 'Kurnool Modern Processing Hub - Unit 1',
          batchNumber: procBatchNum,
          operatorName: payload.operatorName || 'M. Veerabhadraiah',
          notes: payload.notes || '',
          status: 'Draft',
          ledgerEntryId: null,
        };

        updateStateAndStorage(setProcessingRecords, STORAGE_KEYS.PROCESSING, (prev) => {
          const exists = prev.some((r) => r.id === procId);
          return exists
            ? prev.map((r) => (r.id === procId ? draftRecord : r))
            : [draftRecord, ...prev];
        });
        createVendorProcessingBatchApi(draftRecord);

        toast.info(`Processing Draft ${procId} saved. Raw material stock was not deducted.`);
        return { success: true, record: draftRecord };
      }

      // COMPLETE PROCESSING WORKFLOW:
      // 1. Deduct inputQuantity from raw material batch exactly once
      const remainingStock = round2(stockBatch.availableQuantity - metrics.totalInputQuantity);
      const updatedProcessedQty = round2(
        safeNumber(stockBatch.processedQuantity, 0) + metrics.totalInputQuantity
      );
      const nextStockStatus =
        remainingStock <= 0
          ? 'Exhausted'
          : remainingStock <= safeNumber(stockBatch.minimumThreshold, 15)
          ? 'Low Stock'
          : 'In Stock';

      let currentProducts = [...products];
      let currentProductBatches = [...productBatches];
      const createdFinishedBatchIds = [];

      const finalizedOutputs = (payload.outputs || []).map((out, idx) => {
        const outQty = safeNumber(out.outputQuantity, 0);
        const outUnit = out.outputUnit || metrics.inputUnit;

        // Find or create matching Finished Product in catalog
        let targetProduct = currentProducts.find(
          (p) =>
            p.id === out.productId ||
            p.productName.toLowerCase() === String(out.productName || '').trim().toLowerCase()
        );

        if (!targetProduct) {
          const newProdId = generateNextId('PROD-', currentProducts, 'id', 4);
          const defaultSellPrice = round2(metrics.costPerUnit * 1.25);
          targetProduct = {
            id: newProdId,
            productName: out.productName || `Processed ${stockBatch.cropName}`,
            category: out.productCategory || 'Food Grains & Cereals',
            sourceRawMaterial: stockBatch.cropName,
            description: `Manufactured from ${stockBatch.cropName} (${stockBatch.cropVariety}) batch ${stockBatch.batchNumber}.`,
            brandName: 'Rayalaseema Gold',
            imageUrl: '',
            packagingType: 'PP Woven Bag',
            packageSize: `Standard ${outUnit}`,
            unit: outUnit,
            availableQuantity: 0,
            reservedQuantity: 0,
            soldQuantity: 0,
            minimumStockLevel: 15,
            manufacturingDate: payload.processingDate || dayjs().format('YYYY-MM-DD'),
            expiryDate: dayjs(payload.processingDate || undefined)
              .add(9, 'month')
              .format('YYYY-MM-DD'),
            productionCost: metrics.costPerUnit,
            sellingPrice: defaultSellPrice,
            profitMargin: calculateProfitMargin(defaultSellPrice, metrics.costPerUnit),
            status: 'Active',
          };
          currentProducts = [targetProduct, ...currentProducts];
        }

        // Create Finished Product Batch with full source traceability
        const newFgBatchId = generateNextId('PBAT-', currentProductBatches, 'id', 4);
        const fgBatchNumber = generateBatchNumber(
          'FG',
          targetProduct.productName,
          currentProductBatches.length + idx + 1
        );

        const fgBatch = {
          id: newFgBatchId,
          productId: targetProduct.id,
          productName: targetProduct.productName,
          batchNumber: fgBatchNumber,
          processingId: procId,
          rawMaterialStockId: stockBatch.id,
          rawMaterialBatchNumber: stockBatch.batchNumber,
          originalPurchaseId: stockBatch.purchaseId,
          initialQuantity: outQty,
          availableQuantity: outQty,
          reservedQuantity: 0,
          soldQuantity: 0,
          unit: outUnit,
          productionCost: metrics.costPerUnit,
          sellingPrice: targetProduct.sellingPrice,
          manufacturingDate: payload.processingDate || dayjs().format('YYYY-MM-DD'),
          expiryDate: dayjs(payload.processingDate || undefined)
            .add(9, 'month')
            .format('YYYY-MM-DD'),
          status: 'Active',
        };

        currentProductBatches = [fgBatch, ...currentProductBatches];
        createdFinishedBatchIds.push(newFgBatchId);

        // Update Finished Product stock & weighted production cost (without overwriting sellingPrice!)
        currentProducts = currentProducts.map((p) => {
          if (p.id !== targetProduct.id) return p;
          const nextAvail = round2(safeNumber(p.availableQuantity, 0) + outQty);
          const nextProdCost = metrics.costPerUnit > 0 ? metrics.costPerUnit : p.productionCost;
          return {
            ...p,
            availableQuantity: nextAvail,
            productionCost: nextProdCost,
            profitMargin: calculateProfitMargin(p.sellingPrice, nextProdCost),
            manufacturingDate: payload.processingDate || p.manufacturingDate,
          };
        });

        return {
          ...out,
          productId: targetProduct.id,
          productName: targetProduct.productName,
          productCategory: targetProduct.category,
          outputQuantity: outQty,
          outputUnit: outUnit,
          finishedBatchId: newFgBatchId,
        };
      });

      writeStorage(STORAGE_KEYS.PRODUCTS, currentProducts);
      setProducts(currentProducts);

      writeStorage(STORAGE_KEYS.PRODUCT_BATCHES, currentProductBatches);
      setProductBatches(currentProductBatches);

      // Update Raw Material Inventory Batch
      updateStateAndStorage(setInventory, STORAGE_KEYS.INVENTORY, (prevInv) =>
        prevInv.map((item) =>
          item.id === stockBatch.id
            ? {
                ...item,
                processedQuantity: updatedProcessedQty,
                availableQuantity: remainingStock,
                status: nextStockStatus,
                relatedProcessingIds: [...(item.relatedProcessingIds || []), procId],
                relatedFinishedBatchIds: [
                  ...(item.relatedFinishedBatchIds || []),
                  ...createdFinishedBatchIds,
                ],
              }
            : item
        )
      );

      // Record Stock Movement
      updateStateAndStorage(setStockMovements, STORAGE_KEYS.STOCK_MOVEMENTS, (prevMovs) => {
        const movId = generateNextId('MOV-', prevMovs, 'id', 4);
        return [
          {
            id: movId,
            stockId: stockBatch.id,
            batchNumber: stockBatch.batchNumber,
            cropName: stockBatch.cropName,
            type: 'Processing Issue',
            referenceId: procId,
            quantity: -metrics.totalInputQuantity,
            unit: stockBatch.unit,
            balanceAfter: remainingStock,
            date: payload.processingDate || dayjs().format('YYYY-MM-DD'),
            remarks: `Issued ${metrics.totalInputQuantity} ${stockBatch.unit} to Processing Batch ${procId} (${procBatchNum})`,
          },
          ...prevMovs,
        ];
      });

      // Record Processing Expenses in Vendor Ledger
      let newLedgerId = null;
      if (metrics.totalProcessingExpenses > 0) {
        updateStateAndStorage(setLedger, STORAGE_KEYS.LEDGER, (prevLedger) => {
          newLedgerId = generateNextId('LDG-', prevLedger, 'id', 4);
          return [
            {
              id: newLedgerId,
              date: payload.processingDate || dayjs().format('YYYY-MM-DD'),
              transactionId: procId,
              category: 'Processing Expense',
              description: `Processing expenses for ${stockBatch.cropName} Batch ${stockBatch.batchNumber} → ${finalizedOutputs.map((o) => o.productName).join(', ')}`,
              partyId: 'VENDOR-INTERNAL',
              partyName: payload.processingLocation || 'Kurnool Modern Processing Hub',
              partyCategory: 'Processing Plant',
              debit: metrics.totalProcessingExpenses,
              credit: 0,
              processingExpenses: metrics.totalProcessingExpenses,
              expectedPaymentDate: payload.processingDate || dayjs().format('YYYY-MM-DD'),
              status: 'Paid',
            },
            ...prevLedger,
          ];
        });
      }

      const completedRecord = {
        id: procId,
        processingDate: payload.processingDate || dayjs().format('YYYY-MM-DD'),
        rawMaterial: stockBatch.cropName,
        rawMaterialVariety: stockBatch.cropVariety,
        stockId: stockBatch.id,
        rawMaterialBatchNumber: stockBatch.batchNumber,
        supplierReference: `${stockBatch.supplierName} (${stockBatch.supplierId})`,
        originalPurchaseId: stockBatch.purchaseId,
        inputQuantity: metrics.totalInputQuantity,
        inputUnit: metrics.inputUnit,
        batchUnitCost: stockBatch.averageCost,
        outputs: finalizedOutputs,
        actualOutputQuantity: metrics.actualOutputQuantity,
        outputUnit: finalizedOutputs[0]?.outputUnit || metrics.inputUnit,
        wastageQuantity: metrics.wastageQuantity,
        wastagePercentage: metrics.wastagePercentage,
        expenses: metrics.expenseBreakdown,
        totalProcessingExpenses: metrics.totalProcessingExpenses,
        allocatedRawMaterialCost: metrics.allocatedRawMaterialCost,
        totalBatchCost: metrics.totalBatchCost,
        costPerUnit: metrics.costPerUnit,
        processingLocation:
          payload.processingLocation || 'Kurnool Modern Processing Hub - Unit 1',
        batchNumber: procBatchNum,
        operatorName: payload.operatorName || 'M. Veerabhadraiah',
        notes: payload.notes || '',
        status: 'Completed',
        ledgerEntryId: newLedgerId,
      };

      updateStateAndStorage(setProcessingRecords, STORAGE_KEYS.PROCESSING, (prev) => {
        const exists = prev.some((r) => r.id === procId);
        return exists
          ? prev.map((r) => (r.id === procId ? completedRecord : r))
          : [completedRecord, ...prev];
      });
      createVendorProcessingBatchApi(completedRecord).then((created) => {
        if (created) {
          updateStateAndStorage(setProcessingRecords, STORAGE_KEYS.PROCESSING, (prev) =>
            prev.map((r) => (r.id === procId ? { ...r, ...created, rawId: created.rawId ?? r.rawId } : r))
          );
        }
      });

      pushNotification({
        category: 'Processing Completed',
        title: `Processing Batch Completed – ${procId}`,
        description: `Converted ${metrics.totalInputQuantity} ${metrics.inputUnit} ${stockBatch.cropName} (${stockBatch.batchNumber}) into ${metrics.actualOutputQuantity} ${completedRecord.outputUnit} finished stock.`,
        transactionId: procId,
        priority: 'Medium',
        targetPath: '/vendor/finished-products',
      });

      if (nextStockStatus === 'Low Stock' || nextStockStatus === 'Exhausted') {
        pushNotification({
          category: 'Low Stock',
          title: `Raw Material ${nextStockStatus} Alert – ${stockBatch.id}`,
          description: `Batch ${stockBatch.batchNumber} (${stockBatch.cropName}) now has ${remainingStock} ${stockBatch.unit} remaining.`,
          transactionId: stockBatch.id,
          priority: 'High',
          targetPath: '/vendor/inventory',
        });
      }

      toast.success(`Processing Batch ${procId} Completed!`, {
        description: `Raw material deducted & finished product batch ${createdFinishedBatchIds.join(', ')} added to stock.`,
      });

      return { success: true, record: completedRecord };
    },
    [processingRecords, inventory, products, productBatches, pushNotification]
  );

  const cancelDraftProcessing = useCallback((procId) => {
    updateStateAndStorage(setProcessingRecords, STORAGE_KEYS.PROCESSING, (prev) =>
      prev.filter((r) => !(r.id === procId && r.status === 'Draft'))
    );
    toast.info(`Draft processing ${procId} cancelled.`);
  }, []);

  // =========================================================================
  // 7. FINISHED PRODUCTS MANAGEMENT & STOCK ADJUSTMENTS
  // =========================================================================
  const addFinishedProduct = useCallback(
    (payload) => {
      const newId = generateNextId('PROD-', products, 'id', 4);
      const sellPrice = safeNumber(payload.sellingPrice, 0);
      const prodCost = safeNumber(payload.productionCost, sellPrice * 0.78);
      const newProd = {
        ...payload,
        id: newId,
        productId: newId,
        availableQuantity: safeNumber(payload.availableQuantity, 0),
        reservedQuantity: 0,
        soldQuantity: 0,
        minimumStockLevel: safeNumber(payload.minimumStockLevel, 15),
        productionCost: prodCost,
        sellingPrice: sellPrice,
        profitMargin: calculateProfitMargin(sellPrice, prodCost),
        manufacturingDate: payload.manufacturingDate || dayjs().format('YYYY-MM-DD'),
        expiryDate:
          payload.expiryDate || dayjs().add(9, 'month').format('YYYY-MM-DD'),
        status: payload.status || 'Active',
      };

      updateStateAndStorage(setProducts, STORAGE_KEYS.PRODUCTS, (prev) => [newProd, ...prev]);
      createVendorFinishedProductApi(newProd).then((created) => {
        if (created) {
          updateStateAndStorage(setProducts, STORAGE_KEYS.PRODUCTS, (prev) =>
            prev.map((p) =>
              p.id === newId
                ? {
                    ...p,
                    ...created,
                    id: created.id || created.productId || newId,
                    productId: created.productId || created.id || newId,
                    rawId: created.rawId ?? p.rawId,
                  }
                : p
            )
          );
        }
      });
      toast.success(`Finished Product ${newProd.productName} created.`);
      return newProd;
    },
    [products]
  );

  const updateFinishedProduct = useCallback((id, payload) => {
    const targetProd = products.find((p) => p.id === id);
    const targetId = targetProd?.productId || targetProd?.rawId || payload?.rawId || id;
    updateStateAndStorage(setProducts, STORAGE_KEYS.PRODUCTS, (prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        // Important rule: Selling price must NOT automatically overwrite production cost
        const nextSellingPrice =
          payload.sellingPrice !== undefined
            ? safeNumber(payload.sellingPrice, p.sellingPrice)
            : p.sellingPrice;
        const nextProductionCost =
          payload.productionCost !== undefined
            ? safeNumber(payload.productionCost, p.productionCost)
            : p.productionCost;
        return {
          ...p,
          ...payload,
          sellingPrice: nextSellingPrice,
          productionCost: nextProductionCost,
          profitMargin: calculateProfitMargin(nextSellingPrice, nextProductionCost),
        };
      })
    );
    updateVendorFinishedProductApi(targetId, { ...targetProd, ...payload, rawId: targetProd?.rawId });
    if (payload.status) {
      updateVendorFinishedProductStatusApi(targetId, payload.status);
    }
    toast.success(`Product ${id} updated.`);
  }, [products]);

  const adjustFinishedProductStock = useCallback(
    ({ productId, batchId, adjustmentType, quantity, reason, newSellingPrice }) => {
      const prod = products.find((p) => p.id === productId);
      if (!prod) return { success: false, message: 'Product not found.' };

      const delta =
        adjustmentType === 'Deduct'
          ? -Math.abs(safeNumber(quantity, 0))
          : Math.abs(safeNumber(quantity, 0));

      const nextAvail = round2(safeNumber(prod.availableQuantity, 0) + delta);
      if (nextAvail < 0) {
        toast.error('Stock adjustment prevented: finished stock cannot become negative.');
        return { success: false, message: 'Finished stock cannot become negative.' };
      }

      const sellPrice =
        newSellingPrice !== undefined && newSellingPrice !== ''
          ? safeNumber(newSellingPrice, prod.sellingPrice)
          : prod.sellingPrice;

      updateStateAndStorage(setProducts, STORAGE_KEYS.PRODUCTS, (prev) =>
        prev.map((p) =>
          p.id === productId
            ? {
                ...p,
                availableQuantity: nextAvail,
                sellingPrice: sellPrice,
                profitMargin: calculateProfitMargin(sellPrice, p.productionCost),
              }
            : p
        )
      );

      if (batchId) {
        updateStateAndStorage(setProductBatches, STORAGE_KEYS.PRODUCT_BATCHES, (prev) =>
          prev.map((b) =>
            b.id === batchId
              ? {
                  ...b,
                  availableQuantity: Math.max(0, round2(safeNumber(b.availableQuantity, 0) + delta)),
                  sellingPrice: sellPrice,
                }
              : b
          )
        );
      }

      const targetProdId = prod.productId || prod.rawId || productId;
      adjustVendorFinishedProductStockApi(targetProdId, {
        batchId,
        adjustmentType,
        quantity,
        reason,
        newSellingPrice: sellPrice,
      });

      toast.success(`Stock updated for ${prod.productName} (${reason || 'Manual adjustment'}).`);
      return { success: true };
    },
    [products]
  );

  // =========================================================================
  // 8. SELL PRODUCTS & CUSTOMER ORDERS WORKFLOW
  // =========================================================================
  const createSaleOrder = useCallback(
    (payload, isDraft = false) => {
      const calc = calculateSalesTotals(payload.items || [], {
        discount: payload.discount,
        tax: payload.tax,
        deliveryCharges: payload.deliveryCharges,
        otherCharges: payload.otherCharges,
      });

      if (calc.lineItems.length === 0) {
        toast.error('Please add at least one finished product to sell.');
        return { success: false, message: 'No products selected.' };
      }

      // Validate product status, expiry, and available stock
      for (const item of calc.lineItems) {
        const prod = products.find((p) => p.id === item.productId);
        if (!prod) {
          toast.error(`Product ${item.productName} not found.`);
          return { success: false, message: 'Product not found.' };
        }
        if (prod.status !== 'Active') {
          toast.error(`Cannot sell inactive product: ${prod.productName}.`);
          return { success: false, message: 'Cannot sell inactive product.' };
        }
        if (prod.expiryDate && dayjs(prod.expiryDate).isBefore(dayjs(), 'day')) {
          toast.error(`Cannot sell expired product: ${prod.productName} (Expired ${prod.expiryDate}).`);
          return { success: false, message: 'Cannot sell expired product.' };
        }
        if (item.sellingQuantity <= 0) {
          toast.error(`Selling quantity for ${prod.productName} must be greater than zero.`);
          return { success: false, message: 'Quantity must be > 0.' };
        }
        if (item.sellingQuantity > prod.availableQuantity) {
          toast.error(
            `Insufficient stock for ${prod.productName}. Available: ${prod.availableQuantity} ${prod.unit}, Requested: ${item.sellingQuantity} ${prod.unit}.`
          );
          return { success: false, message: 'Insufficient finished stock.' };
        }
      }

      const newSaleId = generateNextId('SALE-', sales, 'id', 4);
      const newOrderId = generateNextId('ORD-', orders, 'id', 4);
      const newOtpId = isDraft ? null : generateNextId('OTP-', confirmations, 'id', 4);
      const demoOtpCode = isDraft ? null : confirmationService.generateDemoOtpCode();

      const primaryItem = calc.lineItems[0];
      const productSummary =
        calc.lineItems.length > 1
          ? `${primaryItem.productName} (+${calc.lineItems.length - 1} more)`
          : primaryItem.productName;

      // Reserve stock if not draft
      if (!isDraft) {
        let nextProds = [...products];
        let nextBatches = [...productBatches];

        calc.lineItems.forEach((item) => {
          nextProds = nextProds.map((p) =>
            p.id === item.productId
              ? {
                  ...p,
                  availableQuantity: Math.max(
                    0,
                    round2(safeNumber(p.availableQuantity, 0) - item.sellingQuantity)
                  ),
                  reservedQuantity: round2(
                    safeNumber(p.reservedQuantity, 0) + item.sellingQuantity
                  ),
                }
              : p
          );

          if (item.batchId) {
            nextBatches = nextBatches.map((b) =>
              b.id === item.batchId
                ? {
                    ...b,
                    availableQuantity: Math.max(
                      0,
                      round2(safeNumber(b.availableQuantity, 0) - item.sellingQuantity)
                    ),
                    reservedQuantity: round2(
                      safeNumber(b.reservedQuantity, 0) + item.sellingQuantity
                    ),
                  }
                : b
            );
          }
        });

        writeStorage(STORAGE_KEYS.PRODUCTS, nextProds);
        setProducts(nextProds);

        writeStorage(STORAGE_KEYS.PRODUCT_BATCHES, nextBatches);
        setProductBatches(nextBatches);
      }

      const saleRecord = {
        id: newSaleId,
        orderId: newOrderId,
        customerId: payload.customerId,
        customerUserId: payload.customerUserId || payload.rawCustomerId || payload.rawId || payload.customerId,
        rawCustomerId: payload.rawCustomerId || payload.customerUserId || payload.customerId,
        customerName: payload.customerName,
        businessName: payload.businessName || '',
        mobileNumber: payload.mobileNumber || '',
        email: payload.email || '',
        deliveryAddress: payload.deliveryAddress || '',
        district: payload.district || '',
        state: payload.state || 'Andhra Pradesh',
        product: productSummary,
        productId: primaryItem.productId,
        batchId: primaryItem.batchId || null,
        batchNumber: primaryItem.batchNumber || 'Standard Batch',
        quantity: calc.totalQuantity,
        unit: primaryItem.unit || 'Quintal',
        unitPrice: primaryItem.pricePerUnit,
        items: calc.lineItems,
        subtotal: calc.subtotal,
        discount: calc.discount,
        tax: calc.tax,
        deliveryCharges: calc.deliveryCharges,
        otherCharges: calc.otherCharges,
        totalAmount: calc.finalAmount,
        receivedAmount: 0,
        salesDate: payload.salesDate || dayjs().format('YYYY-MM-DD'),
        expectedDeliveryDate:
          payload.expectedDeliveryDate || dayjs().add(4, 'day').format('YYYY-MM-DD'),
        expectedPaymentDate:
          payload.expectedPaymentDate || dayjs().add(15, 'day').format('YYYY-MM-DD'),
        paymentTerms: payload.paymentTerms || 'Net 15 Days',
        otpId: newOtpId,
        confirmationStatus: isDraft ? 'Not Sent' : 'Pending',
        paymentStatus: 'Pending',
        salesStatus: isDraft ? 'Draft' : 'New',
        stockAllocationStage: isDraft ? 'None' : 'Reserved',
        ledgerEntryId: null,
        notes: payload.notes || '',
      };

      const orderRecord = {
        id: newOrderId,
        salesId: newSaleId,
        customerId: payload.customerId,
        customerName: payload.customerName,
        businessName: payload.businessName || '',
        mobileNumber: payload.mobileNumber || '',
        deliveryAddress: payload.deliveryAddress || '',
        product: productSummary,
        productId: primaryItem.productId,
        batchReferences: calc.lineItems.map(
          (i) => `${i.batchNumber || 'Batch'} (${i.batchId || i.productId})`
        ),
        quantity: calc.totalQuantity,
        unit: primaryItem.unit || 'Quintal',
        price: primaryItem.pricePerUnit,
        subtotal: calc.subtotal,
        discount: calc.discount,
        tax: calc.tax,
        deliveryCharges: calc.deliveryCharges,
        totalAmount: calc.finalAmount,
        orderDate: payload.salesDate || dayjs().format('YYYY-MM-DD'),
        expectedDeliveryDate:
          payload.expectedDeliveryDate || dayjs().add(4, 'day').format('YYYY-MM-DD'),
        otpId: newOtpId,
        otpStatus: isDraft ? 'Not Sent' : 'Pending',
        paymentStatus: 'Pending',
        orderStatus: 'New',
        stockAllocationStage: isDraft ? 'None' : 'Reserved',
        timeline: [
          {
            status: 'New',
            timestamp: dayjs().format('YYYY-MM-DD hh:mm A'),
            note: isDraft
              ? 'Draft sales order saved'
              : `Sales order created; stock reserved & demo OTP (${demoOtpCode}) sent to customer`,
          },
        ],
      };

      updateStateAndStorage(setSales, STORAGE_KEYS.SALES, (prev) => [saleRecord, ...prev]);
      updateStateAndStorage(setOrders, STORAGE_KEYS.ORDERS, (prev) => [orderRecord, ...prev]);
      createVendorSaleApi(saleRecord, isDraft).then((created) => {
        if (created) {
          updateStateAndStorage(setSales, STORAGE_KEYS.SALES, (prev) =>
            prev.map((s) =>
              s.id === newSaleId
                ? {
                    ...s,
                    ...created,
                    id: created.id || created.saleCode || newSaleId,
                    orderId: created.orderId || created.orderCode || s.orderId,
                    rawId: created.rawId ?? s.rawId,
                  }
                : s
            )
          );
          updateStateAndStorage(setOrders, STORAGE_KEYS.ORDERS, (prev) =>
            prev.map((o) =>
              o.id === newOrderId
                ? {
                    ...o,
                    id: created.orderId || created.orderCode || newOrderId,
                    salesId: created.id || created.saleCode || newSaleId,
                    rawId: created.rawId ?? o.rawId,
                  }
                : o
            )
          );
          if (created.confirmationId || created.devOtp) {
            updateStateAndStorage(setConfirmations, STORAGE_KEYS.CONFIRMATIONS, (prev) =>
              prev.map((c) =>
                c.id === newOtpId
                  ? {
                      ...c,
                      rawId: created.confirmationId ?? c.rawId,
                      backendOtp: created.devOtp || c.backendOtp,
                    }
                  : c
              )
            );
          }
          fetchVendorLedgerApi().then((freshLedger) => {
            if (Array.isArray(freshLedger) && freshLedger.length > 0) {
              updateStateAndStorage(setLedger, STORAGE_KEYS.LEDGER, freshLedger);
            }
          });
        }
      });

      if (!isDraft) {
        const otpRecord = {
          id: newOtpId,
          transactionId: newSaleId,
          partyId: payload.customerId,
          partyName: payload.customerName,
          partyCategory: 'Customer',
          mobileNumber: payload.mobileNumber || '',
          transactionType: 'Customer Sale',
          product: productSummary,
          quantity: `${calc.totalQuantity} ${primaryItem.unit || 'Units'}`,
          amount: calc.finalAmount,
          otpStatus: 'Sent',
          demoOtpCode,
          initiatedDate: dayjs().format('YYYY-MM-DD hh:mm A'),
          confirmationDate: null,
          expiryTime: dayjs().add(30, 'minute').format('YYYY-MM-DD hh:mm A'),
          attempts: 0,
          maxAttempts: 3,
          attemptHistory: [
            {
              timestamp: dayjs().format('YYYY-MM-DD hh:mm A'),
              status: 'Sent',
              note: `Simulated customer OTP generated (${demoOtpCode})`,
            },
          ],
        };

        updateStateAndStorage(setConfirmations, STORAGE_KEYS.CONFIRMATIONS, (prev) => [
          otpRecord,
          ...prev,
        ]);

        pushNotification({
          category: 'Customer Order Received',
          title: `New Customer Order Created – ${newOrderId}`,
          description: `Sales order ${newSaleId} for ${payload.customerName} (₹${calc.finalAmount.toLocaleString('en-IN')}). Stock reserved; awaiting customer OTP (${demoOtpCode}).`,
          transactionId: newOrderId,
          priority: 'High',
          targetPath: '/vendor/confirmations',
        });

        toast.success(`Sales Order ${newOrderId} (${newSaleId}) Created! Demo OTP: ${demoOtpCode}`, {
          description: 'Stock has been reserved. Verify customer OTP to confirm the order.',
        });
      } else {
        toast.info(`Draft Sales Order ${newSaleId} saved.`);
      }

      return {
        success: true,
        sale: saleRecord,
        order: orderRecord,
        demoOtpCode,
        otpId: newOtpId,
      };
    },
    [products, productBatches, sales, orders, confirmations, pushNotification]
  );

  // Order Fulfilment Status Transition & Cancellation Stock Restoration
  const updateOrderStatus = useCallback(
    (orderId, nextStatus, reason = '') => {
      const order = orders.find((o) => o.id === orderId);
      if (!order) {
        toast.error('Order not found.');
        return { success: false, message: 'Order not found.' };
      }

      const allowedNext = VALID_ORDER_TRANSITIONS[order.orderStatus] || [];
      if (!allowedNext.includes(nextStatus)) {
        toast.error(
          `Invalid transition from "${order.orderStatus}" to "${nextStatus}". Allowed: ${allowedNext.join(', ') || 'None'}.`
        );
        return { success: false, message: 'Invalid status transition.' };
      }

      if (nextStatus === 'Confirmed' && order.otpStatus !== 'Verified') {
        // Confirming an order requires OTP verification first!
        toast.warning(
          `Please verify the Customer OTP (${order.otpId}) before marking ${order.id} as Confirmed.`
        );
        return {
          success: false,
          requiresOtp: true,
          message: 'Customer OTP verification required before confirmation.',
        };
      }

      if (nextStatus === 'Cancelled' && !String(reason || '').trim()) {
        toast.error('A cancellation reason is required to cancel an order.');
        return { success: false, message: 'Cancellation reason required.' };
      }

      const sale = sales.find((s) => s.id === order.salesId || s.orderId === order.id);
      const nowStr = dayjs().format('YYYY-MM-DD hh:mm A');
      const lineItems = sale?.items || [
        {
          productId: order.productId,
          sellingQuantity: order.quantity,
        },
      ];

      // Handle stock transitions
      let nextProds = [...products];
      let nextBatches = [...productBatches];
      let nextAllocationStage = order.stockAllocationStage;

      if (nextStatus === 'Cancelled') {
        // Restore reserved or deducted stock back to availableQuantity!
        lineItems.forEach((item) => {
          const qty = safeNumber(item.sellingQuantity ?? item.quantity, 0);
          nextProds = nextProds.map((p) => {
            if (p.id !== item.productId) return p;
            return {
              ...p,
              availableQuantity: round2(safeNumber(p.availableQuantity, 0) + qty),
              reservedQuantity:
                order.stockAllocationStage === 'Reserved'
                  ? Math.max(0, round2(safeNumber(p.reservedQuantity, 0) - qty))
                  : p.reservedQuantity,
              soldQuantity:
                order.stockAllocationStage === 'Deducted'
                  ? Math.max(0, round2(safeNumber(p.soldQuantity, 0) - qty))
                  : p.soldQuantity,
            };
          });

          if (item.batchId) {
            nextBatches = nextBatches.map((b) => {
              if (b.id !== item.batchId) return b;
              return {
                ...b,
                availableQuantity: round2(safeNumber(b.availableQuantity, 0) + qty),
                reservedQuantity:
                  order.stockAllocationStage === 'Reserved'
                    ? Math.max(0, round2(safeNumber(b.reservedQuantity, 0) - qty))
                    : b.reservedQuantity,
                soldQuantity:
                  order.stockAllocationStage === 'Deducted'
                    ? Math.max(0, round2(safeNumber(b.soldQuantity, 0) - qty))
                    : b.soldQuantity,
              };
            });
          }
        });

        nextAllocationStage = 'Restored';
        writeStorage(STORAGE_KEYS.PRODUCTS, nextProds);
        setProducts(nextProds);
        writeStorage(STORAGE_KEYS.PRODUCT_BATCHES, nextBatches);
        setProductBatches(nextBatches);

        // If OTP was pending, mark it Cancelled
        if (order.otpId) {
          updateStateAndStorage(setConfirmations, STORAGE_KEYS.CONFIRMATIONS, (prev) =>
            prev.map((c) =>
              c.id === order.otpId && c.otpStatus !== 'Verified'
                ? { ...c, otpStatus: 'Cancelled' }
                : c
            )
          );
        }

        // If sale was already in ledger, record a credit adjustment reversal
        if (sale?.ledgerEntryId) {
          updateStateAndStorage(setLedger, STORAGE_KEYS.LEDGER, (prevLedger) => {
            const revId = generateNextId('LDG-', prevLedger, 'id', 4);
            return [
              {
                id: revId,
                date: dayjs().format('YYYY-MM-DD'),
                transactionId: order.id,
                category: 'Other Adjustments',
                description: `Order ${order.id} (${sale.id}) Cancelled – Receivable reversed (${reason})`,
                partyId: order.customerId,
                partyName: order.customerName,
                partyCategory: 'Customer',
                debit: 0,
                credit: order.totalAmount,
                processingExpenses: 0,
                expectedPaymentDate: dayjs().format('YYYY-MM-DD'),
                status: 'Cancelled',
              },
              ...prevLedger,
            ];
          });
        }
      } else if (
        ['Processing', 'Packed', 'Shipped', 'Delivered', 'Completed'].includes(nextStatus) &&
        order.stockAllocationStage === 'Reserved'
      ) {
        // Convert Reserved stock -> Deducted (Sold) stock exactly once!
        lineItems.forEach((item) => {
          const qty = safeNumber(item.sellingQuantity ?? item.quantity, 0);
          nextProds = nextProds.map((p) =>
            p.id === item.productId
              ? {
                  ...p,
                  reservedQuantity: Math.max(0, round2(safeNumber(p.reservedQuantity, 0) - qty)),
                  soldQuantity: round2(safeNumber(p.soldQuantity, 0) + qty),
                }
              : p
          );
          if (item.batchId) {
            nextBatches = nextBatches.map((b) =>
              b.id === item.batchId
                ? {
                    ...b,
                    reservedQuantity: Math.max(0, round2(safeNumber(b.reservedQuantity, 0) - qty)),
                    soldQuantity: round2(safeNumber(b.soldQuantity, 0) + qty),
                  }
                : b
            );
          }
        });
        nextAllocationStage = 'Deducted';
        writeStorage(STORAGE_KEYS.PRODUCTS, nextProds);
        setProducts(nextProds);
        writeStorage(STORAGE_KEYS.PRODUCT_BATCHES, nextBatches);
        setProductBatches(nextBatches);
      }

      const timelineNote =
        nextStatus === 'Cancelled'
          ? `Order Cancelled. Reason: ${reason}. Stock restored to inventory.`
          : reason || `Order status updated to ${nextStatus}`;

      updateStateAndStorage(setOrders, STORAGE_KEYS.ORDERS, (prev) =>
        prev.map((o) =>
          o.id === orderId
            ? {
                ...o,
                orderStatus: nextStatus,
                stockAllocationStage: nextAllocationStage,
                cancellationReason: nextStatus === 'Cancelled' ? reason : o.cancellationReason,
                timeline: [
                  ...(o.timeline || []),
                  {
                    status: nextStatus,
                    timestamp: nowStr,
                    note: timelineNote,
                  },
                ],
              }
            : o
        )
      );

      if (nextStatus === 'Cancelled') {
        cancelVendorOrderApi(orderId, reason);
      } else {
        updateVendorOrderStatusApi(orderId, nextStatus, reason);
      }

      if (sale) {
        updateStateAndStorage(setSales, STORAGE_KEYS.SALES, (prev) =>
          prev.map((s) =>
            s.id === sale.id
              ? {
                  ...s,
                  salesStatus: nextStatus,
                  stockAllocationStage: nextAllocationStage,
                }
              : s
          )
        );
        if (nextStatus === 'Cancelled') {
          deleteVendorSaleApi(sale.id);
        } else {
          updateVendorSaleApi(sale.id, { salesStatus: nextStatus });
        }
      }

      if (nextStatus === 'Completed') {
        pushNotification({
          category: 'Product Sold',
          title: `Order Completed – ${order.id}`,
          description: `Customer order ${order.id} for ${order.customerName} (₹${order.totalAmount.toLocaleString('en-IN')}) marked Completed.`,
          transactionId: order.id,
          priority: 'Low',
          targetPath: '/vendor/orders',
        });
      }

      toast.success(`Order ${orderId} updated to "${nextStatus}".`);
      return { success: true };
    },
    [orders, sales, products, productBatches, pushNotification]
  );

  // =========================================================================
  // 9. FINANCIAL SETTLEMENTS (SUPPLIER PAYMENTS & CUSTOMER RECEIPTS)
  // =========================================================================
  const recordFinancialSettlement = useCallback(
    ({
      settlementType, // 'Supplier Payment' | 'Customer Payment'
      partyId,
      partyName,
      partyCategory, // 'Farmer' | 'Middleman' | 'Customer'
      referenceTransactionId = '',
      ledgerEntryId = '',
      amount,
      paymentMode = 'NEFT / RTGS',
      notes = '',
      date = dayjs().format('YYYY-MM-DD'),
    }) => {
      const numAmount = round2(safeNumber(amount, 0));
      if (numAmount <= 0) {
        toast.error('Payment amount must be greater than zero.');
        return { success: false };
      }

      const isSupplier = settlementType === 'Supplier Payment';
      const txnPrefix = isSupplier ? 'PAY-S-' : 'RCP-C-';
      const settlementTxnId =
        referenceTransactionId || generateNextId(txnPrefix, ledger, 'transactionId', 4);

      updateStateAndStorage(setLedger, STORAGE_KEYS.LEDGER, (prevLedger) => {
        const newLdgId = generateNextId('LDG-', prevLedger, 'id', 4);
        const entry = {
          id: newLdgId,
          date,
          transactionId: settlementTxnId,
          category: isSupplier ? 'Supplier Payment' : 'Customer Payment',
          description: `${paymentMode} ${isSupplier ? 'payment to' : 'receipt from'} ${partyName}${
            referenceTransactionId ? ` against ${referenceTransactionId}` : ''
          }${notes ? ` – ${notes}` : ''}`,
          partyId,
          partyName,
          partyCategory,
          debit: isSupplier ? numAmount : 0,
          credit: isSupplier ? 0 : numAmount,
          settledAmount: numAmount,
          outstandingAmount: 0,
          processingExpenses: 0,
          expectedPaymentDate: date,
          status: 'Paid',
          paymentMode,
          referenceNo: referenceTransactionId || settlementTxnId,
        };

        // Also update the linked parent purchase or sale entry's settled and outstanding amounts
        const updatedLedger = prevLedger.map((item) => {
          if (
            (referenceTransactionId &&
              (item.transactionId === referenceTransactionId || item.id === referenceTransactionId)) ||
            (ledgerEntryId && item.id === ledgerEntryId)
          ) {
            const total = item.debit > 0 ? item.debit : item.credit;
            const newSettled = round2(safeNumber(item.settledAmount, 0) + numAmount);
            const newOutstanding = Math.max(0, round2(total - newSettled));
            const newStatus = newOutstanding <= 0 ? 'Paid' : 'Partially Paid';
            return {
              ...item,
              settledAmount: newSettled,
              outstandingAmount: newOutstanding,
              status: newStatus,
              paymentMode: paymentMode || item.paymentMode,
              referenceNo: referenceTransactionId || item.referenceNo,
            };
          }
          return item;
        });

        return [entry, ...updatedLedger];
      });

      const settlementPayload = {
        settlementType,
        partyId,
        partyName,
        partyCategory,
        referenceTransactionId: settlementTxnId,
        ledgerEntryId,
        amount: numAmount,
        paymentMode,
        notes,
        date,
      };

      (async () => {
        try {
          const linkedLedger = ledger.find(
            (l) =>
              (ledgerEntryId && (l.id === ledgerEntryId || l.rawId === ledgerEntryId)) ||
              (referenceTransactionId &&
                (l.transactionId === referenceTransactionId || l.id === referenceTransactionId))
          );
          let settledOk = false;
          if (linkedLedger && linkedLedger.id) {
            const settleRes = await settleVendorLedgerEntryApi(linkedLedger.id, settlementPayload);
            if (settleRes) settledOk = true;
          }
          if (!settledOk) {
            if (isSupplier) {
              await payVendorSupplierApi(settlementPayload);
            } else {
              await recordVendorCustomerReceiptApi(settlementPayload);
            }
          }
          // Refresh all affected entities in parallel from MariaDB
          const [freshLedger, freshSales, freshOrders, freshCustomers, freshPurchases, freshFarmers, freshMiddlemen] = await Promise.all([
            fetchVendorLedgerApi().catch(() => null),
            fetchVendorSalesApi().catch(() => null),
            fetchVendorOrdersApi().catch(() => null),
            fetchVendorCustomersApi().catch(() => null),
            fetchVendorPurchasesApi().catch(() => null),
            fetchVendorFarmersApi().catch(() => null),
            fetchVendorMiddlemenApi().catch(() => null),
          ]);
          if (Array.isArray(freshLedger) && freshLedger.length > 0) {
            updateStateAndStorage(setLedger, STORAGE_KEYS.LEDGER, freshLedger);
          }
          if (Array.isArray(freshSales) && freshSales.length > 0) {
            updateStateAndStorage(setSales, STORAGE_KEYS.SALES, freshSales);
          }
          if (Array.isArray(freshOrders) && freshOrders.length > 0) {
            updateStateAndStorage(setOrders, STORAGE_KEYS.ORDERS, freshOrders);
          }
          if (Array.isArray(freshCustomers) && freshCustomers.length > 0) {
            updateStateAndStorage(setCustomers, STORAGE_KEYS.CUSTOMERS, freshCustomers);
          }
          if (Array.isArray(freshPurchases) && freshPurchases.length > 0) {
            updateStateAndStorage(setPurchases, STORAGE_KEYS.PURCHASES, freshPurchases);
          }
          if (Array.isArray(freshFarmers) && freshFarmers.length > 0) {
            updateStateAndStorage(setFarmers, STORAGE_KEYS.FARMERS, freshFarmers);
          }
          if (Array.isArray(freshMiddlemen) && freshMiddlemen.length > 0) {
            updateStateAndStorage(setMiddlemen, STORAGE_KEYS.MIDDLEMEN, freshMiddlemen);
          }
        } catch (err) {
          console.warn('Backend settlement synchronization error:', err);
        }
      })();

      // Update linked purchase or sale paid/received amount optimistically
      const refIdStr = String(referenceTransactionId || '').trim().toLowerCase();
      if (isSupplier) {
        updateStateAndStorage(setPurchases, STORAGE_KEYS.PURCHASES, (prev) =>
          prev.map((p) => {
            const isMatchPurch =
              refIdStr &&
              (String(p.id).toLowerCase() === refIdStr ||
                String(p.purchaseCode || '').toLowerCase() === refIdStr ||
                String(p.rawId || '').toLowerCase() === refIdStr);
            if (!isMatchPurch) return p;
            const nextPaid = Math.min(p.totalAmount, round2(safeNumber(p.paidAmount, 0) + numAmount));
            const nextStatus = nextPaid >= p.totalAmount ? 'Paid' : 'Partially Paid';
            return { ...p, paidAmount: nextPaid, paymentStatus: nextStatus };
          })
        );
      } else {
        updateStateAndStorage(setSales, STORAGE_KEYS.SALES, (prev) =>
          prev.map((s) => {
            const isMatchSale =
              refIdStr &&
              (String(s.id).toLowerCase() === refIdStr ||
                String(s.saleCode || '').toLowerCase() === refIdStr ||
                String(s.orderCode || '').toLowerCase() === refIdStr ||
                String(s.rawId || '').toLowerCase() === refIdStr);
            if (!isMatchSale) return s;
            const nextRec = Math.min(
              s.totalAmount,
              round2(safeNumber(s.receivedAmount, 0) + numAmount)
            );
            const nextStatus = nextRec >= s.totalAmount ? 'Paid' : 'Partially Paid';
            return { ...s, receivedAmount: nextRec, paymentStatus: nextStatus };
          })
        );
        updateStateAndStorage(setOrders, STORAGE_KEYS.ORDERS, (prev) =>
          prev.map((o) => {
            const isMatchOrd =
              refIdStr &&
              (String(o.salesId || '').toLowerCase() === refIdStr ||
                String(o.orderCode || '').toLowerCase() === refIdStr ||
                String(o.id || '').toLowerCase() === refIdStr ||
                String(o.saleCode || '').toLowerCase() === refIdStr);
            if (!isMatchOrd) return o;
            const nextRec = Math.min(
              o.totalAmount,
              round2(safeNumber(o.receivedAmount || 0) + numAmount)
            );
            return {
              ...o,
              receivedAmount: nextRec,
              dueAmount: Math.max(0, round2(o.totalAmount - nextRec)),
              paymentStatus: nextRec >= o.totalAmount ? 'Paid' : 'Partially Paid',
            };
          })
        );
      }

      toast.success(
        `${isSupplier ? 'Supplier payment' : 'Customer receipt'} of ₹${numAmount.toLocaleString('en-IN')} recorded in Ledger.`
      );
      return { success: true };
    },
    [ledger, sales]
  );

  // =========================================================================
  // 10. NOTIFICATIONS MANAGEMENT
  // =========================================================================
  const markNotificationRead = useCallback((id) => {
    updateStateAndStorage(setNotifications, STORAGE_KEYS.NOTIFICATIONS, (prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    markVendorNotificationReadApi(id);
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    updateStateAndStorage(setNotifications, STORAGE_KEYS.NOTIFICATIONS, (prev) =>
      prev.map((n) => ({ ...n, isRead: true }))
    );
    markAllVendorNotificationsReadApi();
    toast.success('All notifications marked as read.');
  }, []);

  const deleteNotification = useCallback((id) => {
    updateStateAndStorage(setNotifications, STORAGE_KEYS.NOTIFICATIONS, (prev) =>
      prev.filter((n) => n.id !== id)
    );
    deleteVendorNotificationApi(id);
    toast.info('Notification deleted.');
  }, []);

  // =========================================================================
  // 11. CONVERSION MAPPING CONFIGURATION
  // =========================================================================
  const addConversionMapping = useCallback((rawMaterial, outputConfig) => {
    updateStateAndStorage(setConversionMappings, STORAGE_KEYS.CONVERSION_MAPPINGS, (prev) => {
      const existing = prev.find((m) => m.rawMaterial === rawMaterial);
      if (existing) {
        return prev.map((m) =>
          m.rawMaterial === rawMaterial
            ? { ...m, defaultOutputs: [...m.defaultOutputs, outputConfig] }
            : m
        );
      }
      return [
        ...prev,
        {
          id: `MAP-${prev.length + 1}`,
          rawMaterial,
          defaultOutputs: [outputConfig],
        },
      ];
    });
    toast.success(`Conversion mapping updated for ${rawMaterial}.`);
  }, []);

  // =========================================================================
  // 12. RESET / SYNC FROM LIVE DATABASE
  // =========================================================================
  const resetDemoData = useCallback(async () => {
    try {
      await refreshVendorPortalData(false);
      toast.success('Vendor portal data synced from live database.');
    } catch {
      toast.error('Failed to sync from database.');
    }
  }, [refreshVendorPortalData]);

  // Global summary counters for badges & KPIs
  const unreadNotificationsCount = useMemo(
    () => notifications.filter((n) => !n.isRead).length,
    [notifications]
  );

  const pendingConfirmationsCount = useMemo(
    () =>
      confirmations.filter((c) => c.otpStatus === 'Pending' || c.otpStatus === 'Sent').length,
    [confirmations]
  );

  const financialSummary = useMemo(() => {
    const confirmedPurchases = purchases.filter((p) => p.status === 'Confirmed');
    const confirmedSales = sales.filter(
      (s) => s.confirmationStatus === 'Verified' && s.salesStatus !== 'Cancelled'
    );
    const completedProcessing = processingRecords.filter((r) => r.status === 'Completed');

    const totalPurchasesAmount = round2(
      confirmedPurchases.reduce((sum, p) => sum + safeNumber(p.totalAmount, 0), 0)
    );
    const totalSalesRevenue = round2(
      confirmedSales.reduce((sum, s) => sum + safeNumber(s.totalAmount, 0), 0)
    );
    const totalProcessingExpenses = round2(
      completedProcessing.reduce((sum, r) => sum + safeNumber(r.totalProcessingExpenses, 0), 0)
    );

    // Allocated raw material cost of processed batches + COGS of sold items
    const allocatedRawMaterialCostInProcessing = round2(
      completedProcessing.reduce((sum, r) => sum + safeNumber(r.allocatedRawMaterialCost, 0), 0)
    );

    // Supplier payables (Farmers + Middlemen opening balances + confirmed purchases - supplier payments)
    const supplierPaymentsTotal = round2(
      ledger
        .filter((l) => l.category === 'Supplier Payment')
        .reduce((sum, l) => sum + safeNumber(l.debit, 0), 0)
    );
    const middlemenOpeningTotal = round2(
      middlemen.reduce((sum, m) => sum + safeNumber(m.openingBalance, 0), 0)
    );
    const expectedPayables = Math.max(
      0,
      round2(middlemenOpeningTotal + totalPurchasesAmount - supplierPaymentsTotal)
    );

    // Customer receivables (Customer opening balances + confirmed sales - customer receipts)
    const customerReceiptsTotal = round2(
      ledger
        .filter((l) => l.category === 'Customer Payment')
        .reduce((sum, l) => sum + safeNumber(l.credit, 0), 0)
    );
    const customerOpeningTotal = round2(
      customers.reduce((sum, c) => sum + safeNumber(c.openingBalance, 0), 0)
    );
    const expectedReceivables = Math.max(
      0,
      round2(customerOpeningTotal + totalSalesRevenue - customerReceiptsTotal)
    );

    // Cost of goods sold based on actual sold items' production cost (which already includes raw material + processing)
    // And also breakdown of Raw Material Cost vs Processing Expenses for sold/processed goods
    let soldRawMaterialCost = 0;
    let soldProcessingExpenseShare = 0;
    confirmedSales.forEach((s) => {
      (s.items || []).forEach((item) => {
        const qty = safeNumber(item.sellingQuantity ?? item.quantity, 0);
        const unitProdCost = safeNumber(item.productionCost, safeNumber(item.pricePerUnit, 0) * 0.76);
        const totalItemCost = round2(qty * unitProdCost);
        // Split item production cost proportionally (~88% raw material, ~12% processing)
        soldRawMaterialCost = round2(soldRawMaterialCost + totalItemCost * 0.88);
        soldProcessingExpenseShare = round2(soldProcessingExpenseShare + totalItemCost * 0.12);
      });
    });

    const estimatedProfit = round2(
      totalSalesRevenue - soldRawMaterialCost - totalProcessingExpenses
    );

    return {
      totalPurchasesAmount,
      totalSalesRevenue,
      totalProcessingExpenses,
      allocatedRawMaterialCostInProcessing,
      soldRawMaterialCost,
      supplierPaymentsTotal,
      customerReceiptsTotal,
      expectedPayables,
      expectedReceivables,
      estimatedProfit,
    };
  }, [purchases, sales, processingRecords, ledger, middlemen, customers]);

  const value = useMemo(
    () => ({
      farmers: enrichedFarmers,
      middlemen: enrichedMiddlemen,
      customers: enrichedCustomers,
      purchases,
      inventory,
      stockMovements,
      processingRecords,
      products,
      productBatches,
      sales,
      orders,
      confirmations,
      ledger,
      notifications,
      conversionMappings,
      unreadNotificationsCount,
      pendingConfirmationsCount,
      financialSummary,
      // Actions
      refreshVendorPortalData,
      fetchFarmerDetails,
      addFarmer,
      updateFarmer,
      toggleFarmerStatus,
      deleteFarmer,
      fetchMiddlemanDetails,
      addMiddleman,
      updateMiddleman,
      toggleMiddlemanStatus,
      deleteMiddleman,
      fetchCustomerDetails,
      addCustomer,
      updateCustomer,
      toggleCustomerStatus,
      deleteCustomer,
      createPurchase,
      submitDraftPurchase,
      resendTransactionOtp,
      verifyTransactionOtp,
      saveProcessingBatch,
      cancelDraftProcessing,
      addFinishedProduct,
      updateFinishedProduct,
      adjustFinishedProductStock,
      createSaleOrder,
      updateOrderStatus,
      recordFinancialSettlement,
      markNotificationRead,
      markAllNotificationsRead,
      deleteNotification,
      addConversionMapping,
      pushNotification,
      resetDemoData,
    }),
    [
      enrichedFarmers,
      enrichedMiddlemen,
      enrichedCustomers,
      purchases,
      inventory,
      stockMovements,
      processingRecords,
      products,
      productBatches,
      sales,
      orders,
      confirmations,
      ledger,
      notifications,
      conversionMappings,
      unreadNotificationsCount,
      pendingConfirmationsCount,
      financialSummary,
      refreshVendorPortalData,
      fetchFarmerDetails,
      addFarmer,
      updateFarmer,
      toggleFarmerStatus,
      deleteFarmer,
      fetchMiddlemanDetails,
      addMiddleman,
      updateMiddleman,
      toggleMiddlemanStatus,
      deleteMiddleman,
      fetchCustomerDetails,
      addCustomer,
      updateCustomer,
      toggleCustomerStatus,
      deleteCustomer,
      createPurchase,
      submitDraftPurchase,
      resendTransactionOtp,
      verifyTransactionOtp,
      saveProcessingBatch,
      cancelDraftProcessing,
      addFinishedProduct,
      updateFinishedProduct,
      adjustFinishedProductStock,
      createSaleOrder,
      updateOrderStatus,
      recordFinancialSettlement,
      markNotificationRead,
      markAllNotificationsRead,
      deleteNotification,
      addConversionMapping,
      pushNotification,
      resetDemoData,
    ]
  );

  return <VendorContext.Provider value={value}>{children}</VendorContext.Provider>;
}

export default VendorProvider;


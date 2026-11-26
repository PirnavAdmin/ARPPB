import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { MiddlemanContext } from './context';
import { INITIAL_PROFILE } from '../../data/mock/middleman/profileData';
import { INITIAL_FARMERS } from '../../data/mock/middleman/farmerData';
import { INITIAL_VENDORS } from '../../data/mock/middleman/vendorData';
import { INITIAL_CUSTOMERS } from '../../data/mock/middleman/customerData';
import { INITIAL_PURCHASES } from '../../data/mock/middleman/purchaseData';
import { INITIAL_INVENTORY_BATCHES } from '../../data/mock/middleman/inventoryData';
import { INITIAL_VENDOR_SALES, INITIAL_CUSTOMER_SALES } from '../../data/mock/middleman/salesData';
import { INITIAL_CONFIRMATIONS } from '../../data/mock/middleman/confirmationData';
import { INITIAL_LEDGER_ENTRIES } from '../../data/mock/middleman/ledgerData';
import { INITIAL_NOTIFICATIONS } from '../../data/mock/middleman/notificationData';
import { generateId } from '../../utils/middleman/transactionHelpers';
import { allocateInventoryFIFO, calculateGrossProfit, calculateOutstandingPosition } from '../../utils/middleman/calculations';
import { useAuth } from '../../hooks/useAuth';
import {
  fetchMiddlemanProfile,
  fetchMiddlemanProfileById,
  updateMiddlemanProfile,
  mapMiddlemanDtoToProfile,
} from '../../services/profileService';
import {
  fetchMiddlemanFarmersApi,
  registerMiddlemanFarmerApi,
  updateMiddlemanFarmerApi,
} from '../../services/middlemanFarmerService';
import {
  fetchMiddlemanPurchasesApi,
  createMiddlemanPurchaseApi,
} from '../../services/middlemanPurchaseService';
import {
  fetchMiddlemanInventoryBatchesApi,
  fetchMiddlemanInventoryApi,
  createMiddlemanInventoryBatchApi,
  updateMiddlemanInventoryBatchApi,
  fetchMiddlemanLedgerApi,
  createMiddlemanLedgerApi,
  settleMiddlemanLedgerApi,
  fetchMiddlemanNotificationsApi,
  createMiddlemanNotificationApi,
  markMiddlemanNotificationReadApi,
  markAllMiddlemanNotificationsReadApi,
  deleteMiddlemanNotificationApi,
  fetchMiddlemanSalesVendorsApi,
} from '../../services/middleman';
import {
  fetchMiddlemanVendorsApi,
  registerMiddlemanVendorApi,
  updateMiddlemanVendorApi,
  fetchMiddlemanVendorSalesApi,
  createMiddlemanVendorSaleApi,
} from '../../services/middlemanVendorService';
import {
  fetchMiddlemanConfirmationsApi,
  verifyMiddlemanOtpApi,
  rejectMiddlemanOtpApi,
  resendMiddlemanOtpApi,
} from '../../services/middlemanConfirmationsService';
import {
  fetchMiddlemanCustomersApi,
  registerMiddlemanCustomerApi,
  updateMiddlemanCustomerApi,
  fetchMiddlemanCustomerSalesApi,
  createMiddlemanCustomerSaleApi,
} from '../../services/middlemanCustomerService';

const STORAGE_KEY = 'agriconnect_middleman_state_v1';

export const MiddlemanProvider = ({ children }) => {
  const { user, token, updateUserMobile } = useAuth();
  const authKey = String(user?.userId || user?.fullName || '');

  // Load state from localStorage or initialize from mock data
  const [profile, setProfile] = useState(() => {
    const authMobile = user?.mobile || user?.contactNumber || '';
    const authName = user?.fullName || '';
    const authEmail = user?.email || '';
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_profile`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && (!authKey || parsed.authKey === authKey)) {
          if (
            parsed.businessName === 'Sri Lakshmi Venkateswara Agro Traders' ||
            parsed.registrationNumber === 'AP/GNT/REG/2021/7892'
          ) {
            return {
              ...INITIAL_PROFILE,
              authKey,
              ownerName: authName || '',
              mobile: authMobile || '',
              email: authEmail || '',
            };
          }
          return {
            ...parsed,
            mobile: parsed.mobile || authMobile || '',
            ownerName: parsed.ownerName || authName || '',
            email: parsed.email || authEmail || '',
          };
        }
      }
    } catch {
      // ignore storage errors
    }
    return {
      ...INITIAL_PROFILE,
      authKey,
      ownerName: authName || '',
      mobile: authMobile || '',
      email: authEmail || '',
    };
  });

  const [trackedAuthKey, setTrackedAuthKey] = useState(authKey);
  if (authKey && authKey !== trackedAuthKey) {
    setTrackedAuthKey(authKey);
    const authMobile = user?.mobile || user?.contactNumber || '';
    const authName = user?.fullName || '';
    const authEmail = user?.email || '';
    setProfile((prev) => ({
      ...prev,
      authKey,
      ownerName: authName || prev.ownerName,
      mobile: authMobile || prev.mobile,
      email: authEmail || prev.email,
    }));
  }

  const [farmers, setFarmers] = useState(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_farmers`);
      return saved ? JSON.parse(saved) : INITIAL_FARMERS;
    } catch {
      return INITIAL_FARMERS;
    }
  });

  const [vendors, setVendors] = useState(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_vendors`);
      return saved ? JSON.parse(saved) : INITIAL_VENDORS;
    } catch {
      return INITIAL_VENDORS;
    }
  });

  const [customers, setCustomers] = useState(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_customers`);
      return saved ? JSON.parse(saved) : INITIAL_CUSTOMERS;
    } catch {
      return INITIAL_CUSTOMERS;
    }
  });

  const [purchases, setPurchases] = useState(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_purchases`);
      return saved ? JSON.parse(saved) : INITIAL_PURCHASES;
    } catch {
      return INITIAL_PURCHASES;
    }
  });

  const [inventory, setInventory] = useState(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_inventory`);
      return saved ? JSON.parse(saved) : INITIAL_INVENTORY_BATCHES;
    } catch {
      return INITIAL_INVENTORY_BATCHES;
    }
  });

  const [vendorSales, setVendorSales] = useState(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_vendor_sales`);
      return saved ? JSON.parse(saved) : INITIAL_VENDOR_SALES;
    } catch {
      return INITIAL_VENDOR_SALES;
    }
  });

  const [customerSales, setCustomerSales] = useState(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_customer_sales`);
      return saved ? JSON.parse(saved) : INITIAL_CUSTOMER_SALES;
    } catch {
      return INITIAL_CUSTOMER_SALES;
    }
  });

  const [confirmations, setConfirmations] = useState(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_confirmations`);
      return saved ? JSON.parse(saved) : INITIAL_CONFIRMATIONS;
    } catch {
      return INITIAL_CONFIRMATIONS;
    }
  });

  const [ledger, setLedger] = useState(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_ledger`);
      return saved ? JSON.parse(saved) : INITIAL_LEDGER_ENTRIES;
    } catch {
      return INITIAL_LEDGER_ENTRIES;
    }
  });

  const [notifications, setNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_notifications`);
      return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
    } catch {
      return INITIAL_NOTIFICATIONS;
    }
  });

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY}_profile`, JSON.stringify(profile));
      localStorage.setItem(`${STORAGE_KEY}_farmers`, JSON.stringify(farmers));
      localStorage.setItem(`${STORAGE_KEY}_vendors`, JSON.stringify(vendors));
      localStorage.setItem(`${STORAGE_KEY}_customers`, JSON.stringify(customers));
      localStorage.setItem(`${STORAGE_KEY}_purchases`, JSON.stringify(purchases));
      localStorage.setItem(`${STORAGE_KEY}_inventory`, JSON.stringify(inventory));
      localStorage.setItem(`${STORAGE_KEY}_vendor_sales`, JSON.stringify(vendorSales));
      localStorage.setItem(`${STORAGE_KEY}_customer_sales`, JSON.stringify(customerSales));
      localStorage.setItem(`${STORAGE_KEY}_confirmations`, JSON.stringify(confirmations));
      localStorage.setItem(`${STORAGE_KEY}_ledger`, JSON.stringify(ledger));
      localStorage.setItem(`${STORAGE_KEY}_notifications`, JSON.stringify(notifications));
    } catch {
      // ignore quota errors
    }
  }, [profile, farmers, vendors, customers, purchases, inventory, vendorSales, customerSales, confirmations, ledger, notifications]);

  // Notifications helper
  const addNotification = useCallback((notif) => {
    const newNotif = {
      id: generateId('NOT'),
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
      isRead: false,
      priority: notif.priority || 'medium',
      ...notif,
    };
    setNotifications((prev) => [newNotif, ...prev]);

    // Persist to backend database MiddlemanNotifications table
    createMiddlemanNotificationApi({
      title: notif.title,
      description: notif.description,
      category: notif.category,
      priority: notif.priority,
      actorName: notif.actorName || notif.partyName,
      referenceNumber: notif.referenceNumber || notif.relatedId || notif.id,
      moduleUrl: notif.moduleUrl || notif.actionUrl,
    })
      .then((created) => {
        if (created && (created.id || created.rawId)) {
          setNotifications((prev) =>
            prev.map((n) =>
              n.id === newNotif.id
                ? { ...n, rawId: created.id || created.rawId }
                : n
            )
          );
        }
      })
      .catch((err) => {
        console.warn('Persisting middleman notification warning:', err);
      });
  }, []);

  const markNotificationAsRead = useCallback((id) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    markMiddlemanNotificationReadApi(id).catch(() => {});
  }, []);

  const markAllNotificationsAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    markAllMiddlemanNotificationsReadApi().catch(() => {});
  }, []);

  const deleteNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    deleteMiddlemanNotificationApi(id).catch(() => {});
  }, []);

  // Fetch Middleman profile from backend API (GET /api/v1/middleman-profile and GET /api/v1/middleman-profile/{id})
  const refreshProfile = useCallback(async (explicitId = null) => {
    try {
      const dto = explicitId
        ? await fetchMiddlemanProfileById(explicitId)
        : await fetchMiddlemanProfile();
      if (dto && typeof dto === 'object') {
        const detailedDto =
          !explicitId && dto.id
            ? await fetchMiddlemanProfileById(dto.id).catch(() => dto)
            : dto;
        setProfile((prev) => mapMiddlemanDtoToProfile(detailedDto || dto, prev));
        if ((detailedDto || dto).mobile) {
          updateUserMobile((detailedDto || dto).mobile);
        }
        return detailedDto || dto;
      }
      return null;
    } catch {
      return null;
    }
  }, [updateUserMobile]);

  // Fetch Middleman Farmers from backend API (GET /api/v1/middleman/farmers)
  const refreshFarmers = useCallback(async () => {
    try {
      const apiFarmers = await fetchMiddlemanFarmersApi();
      if (apiFarmers && Array.isArray(apiFarmers) && apiFarmers.length > 0) {
        setFarmers(apiFarmers);
      }
    } catch {
      // fallback smoothly to existing state
    }
  }, []);

  // Fetch Middleman Purchases from backend API (GET /api/v1/middleman/purchases)
  const refreshPurchases = useCallback(async () => {
    try {
      const apiPurchases = await fetchMiddlemanPurchasesApi();
      if (apiPurchases && Array.isArray(apiPurchases) && apiPurchases.length > 0) {
        setPurchases(apiPurchases);
      }
    } catch {
      // fallback smoothly to existing state
    }
  }, []);

  // Fetch Middleman Inventory from backend API (GET /api/v1/middleman/inventory & /batches)
  const refreshInventory = useCallback(async () => {
    try {
      const apiBatches =
        (await fetchMiddlemanInventoryBatchesApi()) ||
        (await fetchMiddlemanInventoryApi());
      if (apiBatches && Array.isArray(apiBatches) && apiBatches.length > 0) {
        setInventory(apiBatches);
      }
    } catch {
      // fallback smoothly to existing state
    }
  }, []);

  // Fetch Middleman Ledger from backend API (GET /api/v1/middleman/ledger)
  const refreshLedger = useCallback(async () => {
    try {
      const apiLedger = await fetchMiddlemanLedgerApi();
      if (apiLedger && Array.isArray(apiLedger) && apiLedger.length > 0) {
        setLedger(apiLedger);
      }
    } catch {
      // fallback smoothly to existing state
    }
  }, []);

  // Fetch Middleman Notifications from backend API (GET /api/v1/notifications)
  const refreshNotifications = useCallback(async () => {
    try {
      const apiNotifs = await fetchMiddlemanNotificationsApi({ status: 'All', timeRange: 'All' });
      if (apiNotifs && Array.isArray(apiNotifs) && apiNotifs.length > 0) {
        setNotifications(apiNotifs);
      }
    } catch {
      // fallback smoothly to existing state
    }
  }, []);

  // Fetch Middleman Vendors from backend API (GET /api/v1/middleman/vendors)
  const refreshVendors = useCallback(async () => {
    try {
      const apiVendors = await fetchMiddlemanVendorsApi();
      if (apiVendors && Array.isArray(apiVendors) && apiVendors.length > 0) {
        setVendors(apiVendors);
      }
    } catch {
      // fallback smoothly to existing state
    }
  }, []);

  // Fetch Middleman Vendor Sales from backend API (GET /api/v1/middleman/vendor-sales)
  const refreshVendorSales = useCallback(async () => {
    try {
      const apiSales =
        (await fetchMiddlemanVendorSalesApi()) ||
        (await fetchMiddlemanSalesVendorsApi());
      if (apiSales && Array.isArray(apiSales) && apiSales.length > 0) {
        setVendorSales(apiSales);
        setVendors((prev) => {
          const existingIds = new Set(prev.map((v) => v.vendorId || v.businessName));
          const newVendors = [];
          apiSales.forEach((s) => {
            const vKey = s.vendorId || s.businessName;
            if (vKey && !existingIds.has(vKey)) {
              existingIds.add(vKey);
              newVendors.push({
                vendorId: s.vendorId || `VEN-${String(s.id || 1).padStart(4, '0')}`,
                businessName: s.businessName || s.vendorName || 'Agro Vendor',
                ownerName: s.ownerName || '',
                mobile: s.mobile || '',
                businessType: 'Grain Wholesaler / Trader',
                district: s.district || 'Guntur',
                state: 'Andhra Pradesh',
                gstNumber: s.gstNumber || '',
                totalPurchases: 1,
                totalPurchaseValue: s.totalAmount || 0,
                outstandingReceivables: s.totalAmount || 0,
                status: 'Active',
              });
            }
          });
          return newVendors.length > 0 ? [...prev, ...newVendors] : prev;
        });
      }
    } catch {
      // fallback smoothly to existing state
    }
  }, []);

  
  // Fetch Middleman Confirmations from backend API (GET /api/v1/middleman/confirmations)
  const refreshCustomers = useCallback(async () => {
    try {
      const apiCusts = await fetchMiddlemanCustomersApi();
      if (apiCusts && Array.isArray(apiCusts) && apiCusts.length > 0) {
        setCustomers(apiCusts);
      }
    } catch {
      // fallback smoothly
    }
  }, []);

  const refreshCustomerSales = useCallback(async () => {
    try {
      const apiCustSales = await fetchMiddlemanCustomerSalesApi();
      if (apiCustSales && Array.isArray(apiCustSales) && apiCustSales.length > 0) {
        setCustomerSales(apiCustSales);
      }
    } catch {
      // fallback smoothly
    }
  }, []);

  const refreshConfirmations = useCallback(async () => {
    try {
      const apiConfirmations = await fetchMiddlemanConfirmationsApi();
      if (apiConfirmations && Array.isArray(apiConfirmations) && apiConfirmations.length > 0) {
        setConfirmations(apiConfirmations);
      }
    } catch {
      // fallback smoothly to existing state
    }
  }, []);

  useEffect(() => {
    Promise.resolve().then(() => {
      refreshProfile();
      refreshFarmers();
      refreshPurchases();
      refreshVendors();
      refreshInventory();
      refreshLedger();
      refreshNotifications();
      refreshVendorSales();
      refreshConfirmations();
      refreshCustomers();
      refreshCustomerSales();
    });
  }, [
    token,
    user?.role,
    authKey,
    refreshProfile,
    refreshFarmers,
    refreshPurchases,
    refreshVendors,
    refreshInventory,
    refreshLedger,
    refreshNotifications,
    refreshVendorSales,
    refreshConfirmations,
    refreshCustomers,
    refreshCustomerSales,
  ]);

  // Profile actions (PUT /api/v1/middleman-profile/{id})
  const updateProfile = useCallback(async (data) => {
    const currentId = data?.id ?? profile?.id;
    setProfile((prev) => ({ ...prev, ...data }));

    if (data?.mobile) {
      updateUserMobile(data.mobile);
    }

    try {
      const savedDto = await updateMiddlemanProfile(currentId, {
        ...profile,
        ...data,
      });
      if (savedDto && typeof savedDto === 'object') {
        setProfile((prev) => ({
          ...mapMiddlemanDtoToProfile(savedDto, prev),
          logo: data?.logo ?? prev.logo ?? savedDto.businessLogoUrl ?? '',
        }));
        if (savedDto.mobile) {
          updateUserMobile(savedDto.mobile);
        }
      }
    } catch (err) {
      console.warn('Updating profile API issue:', err);
    }

    addNotification({
      title: 'Business Profile Updated',
      description: 'Your Middleman business details were saved successfully.',
      category: 'Transaction Completed',
      actionUrl: '/middleman/profile',
    });
  }, [addNotification, profile, updateUserMobile]);

  // Farmer actions
  const addFarmer = useCallback(async (data) => {
    const tempId = generateId('FAR');
    const newFarmer = {
      farmerId: tempId,
      totalPurchases: 0,
      totalQuantityPurchased: 0,
      totalPurchaseValue: 0,
      outstandingPayables: 0,
      pendingConfirmations: 0,
      status: 'Active',
      ...data,
    };
    setFarmers((prev) => [newFarmer, ...prev]);

    let savedFarmer = newFarmer;
    try {
      const saved = await registerMiddlemanFarmerApi(data);
      if (saved && (saved.farmerId || saved.id)) {
        savedFarmer = { ...newFarmer, ...saved };
        setFarmers((prev) =>
          prev.map((f) => (f.farmerId === tempId ? savedFarmer : f))
        );
      }
    } catch (err) {
      console.warn('Syncing farmer to backend API had non-blocking issue:', err);
    }

    addNotification({
      title: 'Farmer Registered',
      description: `Farmer ${savedFarmer.name} from ${savedFarmer.village} was added.`,
      category: 'Transaction Completed',
      relatedId: savedFarmer.farmerId,
      partyName: savedFarmer.name,
      actionUrl: '/middleman/farmers',
    });
    return savedFarmer;
  }, [addNotification]);

  const updateFarmer = useCallback(async (id, data) => {
    setFarmers((prev) => prev.map((f) => (f.farmerId === id ? { ...f, ...data } : f)));
    try {
      const saved = await updateMiddlemanFarmerApi(id, data);
      if (saved && (saved.farmerId || saved.id)) {
        setFarmers((prev) =>
          prev.map((f) => (f.farmerId === id ? { ...f, ...saved } : f))
        );
      }
    } catch (err) {
      console.warn('Updating farmer in backend API had non-blocking issue:', err);
    }
  }, []);

  // Vendor actions
  const addVendor = useCallback(async (data) => {
    const tempId = generateId('VEN');
    let newVendor = {
      vendorId: tempId,
      totalPurchases: 0,
      totalPurchaseValue: 0,
      outstandingReceivables: 0,
      status: 'Active',
      ...data,
    };
    setVendors((prev) => [newVendor, ...prev]);

    try {
      const saved = await registerMiddlemanVendorApi(data);
      if (saved && (saved.vendorId || saved.id)) {
        newVendor = { ...newVendor, ...saved };
        setVendors((prev) =>
          prev.map((v) => (v.vendorId === tempId ? newVendor : v))
        );
      }
    } catch (err) {
      console.warn('Syncing vendor to backend API had non-blocking issue:', err);
    }

    // Persist vendor transaction record in ledger if initial amounts present
    if (data.initialBalance || data.outstandingReceivables) {
      createMiddlemanLedgerApi({
        date: new Date().toISOString().slice(0, 10),
        transactionId: `VEN-INIT-${Date.now().toString().slice(-4)}`,
        category: 'Vendor Opening Balance',
        description: `Opening balance for ${newVendor.businessName}`,
        partyId: newVendor.vendorId,
        partyName: newVendor.businessName,
        partyCategory: 'Vendor',
        debit: Number(data.initialBalance || data.outstandingReceivables || 0),
        credit: 0,
        outstandingAmount: Number(data.initialBalance || data.outstandingReceivables || 0),
        status: 'Pending',
      }).catch(() => {});
    }

    addNotification({
      title: 'Vendor Registered',
      description: `Vendor ${newVendor.businessName} was added.`,
      category: 'Transaction Completed',
      relatedId: newVendor.vendorId,
      partyName: newVendor.businessName,
      actionUrl: '/middleman/vendors',
    });
    return newVendor;
  }, [addNotification]);

  const updateVendor = useCallback(async (id, data) => {
    setVendors((prev) => prev.map((v) => (v.vendorId === id ? { ...v, ...data } : v)));
    try {
      const saved = await updateMiddlemanVendorApi(id, data);
      if (saved && (saved.vendorId || saved.id)) {
        setVendors((prev) =>
          prev.map((v) => (v.vendorId === id ? { ...v, ...saved } : v))
        );
      }
    } catch (err) {
      console.warn('Updating vendor in backend API had non-blocking issue:', err);
    }
  }, []);

  // Customer actions
  const addCustomer = useCallback(async (data) => {
    const tempId = generateId('CUS');
    let newCustomer = {
      customerId: tempId,
      totalPurchases: 0,
      totalPurchaseValue: 0,
      outstandingReceivables: 0,
      status: 'Active',
      ...data,
    };
    setCustomers((prev) => [newCustomer, ...prev]);

    try {
      const saved = await registerMiddlemanCustomerApi(data);
      if (saved && (saved.customerId || saved.id)) {
        newCustomer = { ...newCustomer, ...saved };
        setCustomers((prev) => prev.map((c) => (c.customerId === tempId ? newCustomer : c)));
      }
    } catch (err) {
      console.warn('registerMiddlemanCustomerApi fallback:', err?.message || err);
    }
    addNotification({
      title: 'Customer Registered',
      description: `Customer ${newCustomer.name} was added.`,
      category: 'Transaction Completed',
      relatedId: newCustomer.customerId,
      partyName: newCustomer.name,
      actionUrl: '/middleman/customers',
    });
    return newCustomer;
  }, [addNotification]);

  const updateCustomer = useCallback(async (id, data) => {
    setCustomers((prev) => prev.map((c) => (c.customerId === id ? { ...c, ...data } : c)));
    try {
      await updateMiddlemanCustomerApi(id, data);
    } catch (err) {
      console.warn('updateMiddlemanCustomerApi fallback:', err?.message || err);
    }
  }, []);

  // Purchase Actions
  const createPurchase = useCallback(async (data, isDraft = false) => {
    const tempId = generateId('PUR');
    let purchaseRecord = {
      purchaseId: tempId,
      ...data,
      otpStatus: isDraft ? 'Draft' : 'Pending',
      status: isDraft ? 'Draft' : 'Pending Confirmation',
      confirmationDate: null,
    };

    setPurchases((prev) => [purchaseRecord, ...prev]);

    try {
      const saved = await createMiddlemanPurchaseApi({ ...data, isDraft });
      if (saved && (saved.purchaseId || saved.purchaseCode)) {
        purchaseRecord = { ...purchaseRecord, ...saved };
        setPurchases((prev) =>
          prev.map((p) => (p.purchaseId === tempId ? purchaseRecord : p))
        );
      }
    } catch (err) {
      console.warn('Syncing purchase to backend API had non-blocking issue:', err);
    }

    // Persist stock batch directly to Middleman Inventory in backend DB
    if (!isDraft && data.cropName && Number(data.quantity) > 0) {
      const stockId = generateId('STK');
      const batchPayload = {
        stockId,
        purchaseId: purchaseRecord.purchaseId || tempId,
        farmerId: data.farmerId || null,
        farmerName: data.farmerName || '',
        cropName: data.cropName,
        variety: data.variety || 'Standard',
        unit: data.unit || 'Quintal',
        purchaseDate: data.purchaseDate || new Date().toISOString().slice(0, 10),
        purchasedQuantity: Number(data.quantity),
        availableQuantity: Number(data.quantity),
        soldQuantity: 0,
        purchaseRate: Number(data.rate || 0),
        allocatedCharges: Number(data.additionalCharges || 0),
        averageCost: Number(data.averageCostPerUnit || data.rate || 0),
        quality: data.quality || 'Grade A',
        godownLocation: data.pickupLocation || 'Main AMC Warehouse',
        minimumThreshold: 10,
        status: 'In Stock',
      };
      setInventory((prev) => [batchPayload, ...prev]);
      createMiddlemanInventoryBatchApi(batchPayload)
        .then((savedBatch) => {
          if (savedBatch && (savedBatch.stockId || savedBatch.id)) {
            setInventory((prev) =>
              prev.map((b) => (b.stockId === stockId ? { ...b, ...savedBatch } : b))
            );
          }
        })
        .catch((err) => console.warn('Saving inventory batch on purchase issue:', err));
    }

    if (!isDraft) {
      // Create pending confirmation record
      const confId = generateId('CONF-F');
      const confirmationItem = {
        confirmationId: confId,
        transactionId: purchaseRecord.purchaseId,
        transactionType: 'Farmer Purchase',
        partyType: 'Farmer',
        partyId: data.farmerId,
        partyName: data.farmerName,
        partyMobile: data.farmerMobile,
        crop: data.cropName,
        variety: data.variety || 'Standard',
        quantity: data.quantity,
        unit: data.unit || 'Quintal',
        pricePerUnit: data.rate,
        additionalCharges: data.additionalCharges || 0,
        transactionAmount: data.totalAmount,
        otpStatus: 'Pending',
        requestDate: new Date().toISOString().replace('T', ' ').slice(0, 16),
        expiryDate: new Date(Date.now() + 48 * 3600 * 1000).toISOString().replace('T', ' ').slice(0, 16),
        confirmationDate: null,
        expectedPaymentDate: data.expectedPaymentDate,
        notes: data.notes || '',
      };
      setConfirmations((prev) => [confirmationItem, ...prev]);

      addNotification({
        title: 'Farmer Purchase OTP Sent',
        description: `Pending OTP confirmation from ${data.farmerName} for ${data.quantity} ${data.unit || 'Quintal'} ${data.cropName}.`,
        category: 'Farmer Purchase Confirmation',
        relatedId: purchaseRecord.purchaseId,
        partyName: data.farmerName,
        actionUrl: '/middleman/confirmations',
      });
    }

    return purchaseRecord;
  }, [addNotification]);

  // Vendor Sale Actions
  const createVendorSale = useCallback(async (data, isDraft = false) => {
    const saleId = generateId('SAL');
    const newSale = {
      saleId,
      ...data,
      otpStatus: isDraft ? 'Draft' : 'Pending',
      status: isDraft ? 'Draft' : 'Pending Confirmation',
      confirmationDate: null,
      cogs: 0,
    };

    setVendorSales((prev) => [newSale, ...prev]);

    try {
      const saved = await createMiddlemanVendorSaleApi({ ...data, isDraft });
      if (saved && (saved.saleId || saved.saleCode || saved.id)) {
        setVendorSales((prev) =>
          prev.map((s) => (s.saleId === saleId ? { ...s, ...saved } : s))
        );
      }
    } catch (err) {
      console.warn('Syncing vendor sale to backend API had non-blocking issue:', err);
    }

    // Persist Vendor Sale transaction in the financial ledger
    const ledgerPayload = {
      date: data.salesDate || new Date().toISOString().slice(0, 10),
      transactionId: saleId,
      category: 'Vendor Sale',
      description: `Sale of ${data.quantity} ${data.unit || 'Quintal'} ${data.cropName} to ${data.businessName}`,
      partyId: data.vendorId || 'VEN-0001',
      partyName: data.businessName,
      partyCategory: 'Vendor',
      debit: Number(data.totalAmount) || 0,
      credit: 0,
      processingExpenses: 0,
      settledAmount: 0,
      outstandingAmount: Number(data.totalAmount) || 0,
      expectedPaymentDate: data.expectedPaymentDate || null,
      status: isDraft ? 'Draft' : 'Pending',
    };
    createMiddlemanLedgerApi(ledgerPayload)
      .then((savedLedger) => {
        if (savedLedger) {
          setLedger((prev) => [savedLedger, ...prev]);
        }
      })
      .catch((err) => console.warn('Saving vendor sale to ledger issue:', err));

    if (!isDraft) {
      const confId = generateId('CONF-V');
      const confirmationItem = {
        confirmationId: confId,
        transactionId: saleId,
        transactionType: 'Vendor Sale',
        partyType: 'Vendor',
        partyId: data.vendorId,
        partyName: data.businessName,
        partyMobile: data.mobile,
        crop: data.cropName,
        variety: data.variety || 'Standard',
        quantity: data.quantity,
        unit: data.unit || 'Quintal',
        pricePerUnit: data.rate,
        additionalCharges: data.additionalCharges || 0,
        transactionAmount: data.totalAmount,
        otpStatus: 'Pending',
        requestDate: new Date().toISOString().replace('T', ' ').slice(0, 16),
        expiryDate: new Date(Date.now() + 48 * 3600 * 1000).toISOString().replace('T', ' ').slice(0, 16),
        confirmationDate: null,
        expectedPaymentDate: data.expectedPaymentDate,
        notes: data.notes || '',
      };
      setConfirmations((prev) => [confirmationItem, ...prev]);

      addNotification({
        title: 'Vendor Sale OTP Sent',
        description: `Pending OTP confirmation from ${data.businessName} for ${data.quantity} ${data.unit || 'Quintal'} ${data.cropName}.`,
        category: 'Vendor Purchase Confirmation',
        relatedId: saleId,
        partyName: data.businessName,
        actionUrl: '/middleman/confirmations',
      });
    }

    return newSale;
  }, [addNotification]);

  // Customer Sale Actions
  const createCustomerSale = useCallback((data, isDraft = false) => {
    const saleId = generateId('CUS-SAL');
    const newSale = {
      saleId,
      ...data,
      otpStatus: isDraft ? 'Draft' : 'Pending',
      status: isDraft ? 'Draft' : 'Pending Confirmation',
      confirmationDate: null,
      cogs: 0,
    };

    setCustomerSales((prev) => [newSale, ...prev]);

    createMiddlemanCustomerSaleApi(data, isDraft)
      .then((saved) => {
        if (saved && saved.saleId) {
          setCustomerSales((prev) => prev.map((s) => (s.saleId === saleId ? saved : s)));
        }
      })
      .catch((err) => {
        console.warn('createMiddlemanCustomerSaleApi fallback:', err?.message || err);
      });

    if (!isDraft) {
      const confId = generateId('CONF-C');
      const confirmationItem = {
        confirmationId: confId,
        transactionId: saleId,
        transactionType: 'Customer Sale',
        partyType: 'Customer',
        partyId: data.customerId,
        partyName: data.customerName,
        partyMobile: data.mobile,
        crop: data.cropName,
        variety: data.variety || 'Standard',
        quantity: data.quantity,
        unit: data.unit || 'Quintal',
        pricePerUnit: data.price,
        additionalCharges: data.deliveryCharges || 0,
        transactionAmount: data.finalAmount,
        otpStatus: 'Pending',
        requestDate: new Date().toISOString().replace('T', ' ').slice(0, 16),
        expiryDate: new Date(Date.now() + 48 * 3600 * 1000).toISOString().replace('T', ' ').slice(0, 16),
        confirmationDate: null,
        expectedPaymentDate: data.expectedPaymentDate,
        notes: data.notes || '',
      };
      setConfirmations((prev) => [confirmationItem, ...prev]);

      addNotification({
        title: 'Customer Sale OTP Sent',
        description: `Pending OTP confirmation from ${data.customerName} for ${data.quantity} ${data.unit || 'Quintal'} ${data.cropName}.`,
        category: 'Customer Purchase Confirmation',
        relatedId: saleId,
        partyName: data.customerName,
        actionUrl: '/middleman/confirmations',
      });
    }

    return newSale;
  }, [addNotification]);

  // Centralized OTP Confirmation Action (Simulated Verified Interaction)
  const confirmTransaction = useCallback((confirmationId, otpCode) => {
    const confItem = confirmations.find((c) => c.confirmationId === confirmationId || c.id === confirmationId);
    if (!confItem || confItem.otpStatus === 'Confirmed') return;

    const targetId = confItem.confirmationId || confItem.id || confirmationId;
    const codeToVerify = otpCode || confItem.demoOtpCode || '488031';
    verifyMiddlemanOtpApi(targetId, codeToVerify).catch(() => null);

    const now = new Date().toISOString().replace('T', ' ').slice(0, 16);

    // 1. Update confirmation status
    setConfirmations((prev) =>
      prev.map((c) =>
        (c.confirmationId === confItem.confirmationId || (confItem.id && c.id === confItem.id))
          ? { ...c, otpStatus: 'Confirmed', confirmationDate: now }
          : c
      )
    );

    // 2. Handle Farmer Purchase Confirmation -> Adds stock to Inventory & records in Ledger
    if (confItem.transactionType === 'Farmer Purchase') {
      const purchase = purchases.find((p) => p.purchaseId === confItem.transactionId);
      if (purchase) {
        // Update purchase record
        setPurchases((prev) =>
          prev.map((p) =>
            p.purchaseId === purchase.purchaseId
              ? { ...p, otpStatus: 'Confirmed', status: 'Completed', confirmationDate: now }
              : p
          )
        );

        // Create new Inventory Batch if not already created during purchase
        const existingBatch = inventory.find((b) => b.purchaseId === purchase.purchaseId);
        if (!existingBatch) {
          const stockId = generateId('STK');
          const newBatch = {
            stockId,
            purchaseId: purchase.purchaseId,
            farmerId: purchase.farmerId,
            farmerName: purchase.farmerName,
            cropName: purchase.cropName,
            variety: purchase.variety || 'Standard',
            unit: purchase.unit || 'Quintal',
            purchaseDate: purchase.purchaseDate || now.slice(0, 10),
            purchasedQuantity: Number(purchase.quantity),
            soldQuantity: 0,
            availableQuantity: Number(purchase.quantity),
            purchaseRate: Number(purchase.rate),
            allocatedCharges: Number(purchase.additionalCharges || 0),
            averageCost: Number(purchase.averageCostPerUnit || purchase.rate),
            quality: purchase.quality || 'Grade A',
            status: 'In Stock',
            godownLocation: purchase.pickupLocation || 'Main AMC Warehouse',
          };
          setInventory((prev) => [newBatch, ...prev]);
          createMiddlemanInventoryBatchApi(newBatch)
            .then((savedBatch) => {
              if (savedBatch && (savedBatch.stockId || savedBatch.id)) {
                setInventory((prev) =>
                  prev.map((b) => (b.stockId === stockId ? { ...b, ...savedBatch } : b))
                );
              }
            })
            .catch(() => {});
        }

        // Update Farmer stats
        setFarmers((prev) =>
          prev.map((f) =>
            f.farmerId === purchase.farmerId
              ? {
                  ...f,
                  totalPurchases: (f.totalPurchases || 0) + 1,
                  totalQuantityPurchased: (f.totalQuantityPurchased || 0) + Number(purchase.quantity),
                  totalPurchaseValue: (f.totalPurchaseValue || 0) + Number(purchase.totalAmount),
                  outstandingPayables: (f.outstandingPayables || 0) + Number(purchase.totalAmount),
                }
              : f
          )
        );

        // Add Ledger entry (Payable to Farmer)
        const newLedger = {
          ledgerId: generateId('LED'),
          date: purchase.purchaseDate || now.slice(0, 10),
          transactionId: purchase.purchaseId,
          description: `Purchase of ${purchase.quantity} ${purchase.unit || 'Qtl'} ${purchase.cropName} from ${purchase.farmerName}`,
          partyId: purchase.farmerId,
          partyName: purchase.farmerName,
          partyCategory: 'Farmer',
          debit: 0,
          credit: Number(purchase.totalAmount),
          runningBalance: 0,
          expectedPaymentDate: purchase.expectedPaymentDate,
          status: 'Pending',
          settledAmount: 0,
          outstandingAmount: Number(purchase.totalAmount),
        };
        setLedger((prev) => [newLedger, ...prev]);
        createMiddlemanLedgerApi(newLedger)
          .then((savedLedger) => {
            if (savedLedger && (savedLedger.ledgerId || savedLedger.id)) {
              setLedger((prev) =>
                prev.map((l) => (l.ledgerId === newLedger.ledgerId ? { ...l, ...savedLedger } : l))
              );
            }
          })
          .catch(() => {});

        addNotification({
          title: 'Purchase Confirmed & Stock Added',
          description: `Batch ${stockId} added to inventory: ${purchase.quantity} ${purchase.unit || 'Qtl'} ${purchase.cropName}.`,
          category: 'Inventory Updated',
          relatedId: stockId,
          partyName: purchase.farmerName,
          actionUrl: '/middleman/inventory',
        });
      }
    }

    // 3. Handle Vendor Sale Confirmation -> Deducts stock via FIFO & records in Ledger
    if (confItem.transactionType === 'Vendor Sale') {
      const sale = vendorSales.find((s) => s.saleId === confItem.transactionId);
      if (sale) {
        // Allocate stock from inventory batches via FIFO
        const cropBatches = inventory.filter((b) => b.cropName === sale.cropName);
        const { allocatedBatches, cogs } = allocateInventoryFIFO(cropBatches, sale.quantity);

        // Deduct from batches
        setInventory((prev) =>
          prev.map((batch) => {
            const allocation = allocatedBatches.find((a) => a.stockId === batch.stockId);
            if (allocation) {
              const newSold = (batch.soldQuantity || 0) + allocation.allocatedQuantity;
              const newAvail = Math.max(0, (batch.purchasedQuantity || 0) - newSold);
              const updatedStatus = newAvail <= 0 ? 'Exhausted' : newAvail <= 30 ? 'Low Stock' : 'In Stock';
              updateMiddlemanInventoryBatchApi(batch.stockId, {
                availableQuantity: newAvail,
                soldQuantity: newSold,
                status: updatedStatus,
                godownLocation: batch.godownLocation,
              }).catch(() => {});
              return {
                ...batch,
                soldQuantity: newSold,
                availableQuantity: newAvail,
                status: updatedStatus,
              };
            }
            return batch;
          })
        );

        // Update sale record with confirmed status & calculated COGS
        setVendorSales((prev) =>
          prev.map((s) =>
            s.saleId === sale.saleId
              ? {
                  ...s,
                  otpStatus: 'Confirmed',
                  status: 'Completed',
                  confirmationDate: now,
                  cogs,
                }
              : s
          )
        );

        // Update Vendor stats
        setVendors((prev) =>
          prev.map((v) =>
            v.vendorId === sale.vendorId
              ? {
                  ...v,
                  totalPurchases: (v.totalPurchases || 0) + 1,
                  totalPurchaseValue: (v.totalPurchaseValue || 0) + Number(sale.totalAmount),
                  outstandingReceivables: (v.outstandingReceivables || 0) + Number(sale.totalAmount),
                }
              : v
          )
        );

        // Add Ledger entry (Receivable from Vendor)
        const newLedger = {
          ledgerId: generateId('LED'),
          date: sale.salesDate || now.slice(0, 10),
          transactionId: sale.saleId,
          description: `Sale of ${sale.quantity} ${sale.unit || 'Qtl'} ${sale.cropName} to ${sale.businessName}`,
          partyId: sale.vendorId,
          partyName: sale.businessName,
          partyCategory: 'Vendor',
          debit: Number(sale.totalAmount),
          credit: 0,
          runningBalance: 0,
          expectedPaymentDate: sale.expectedPaymentDate,
          status: 'Pending',
          settledAmount: 0,
          outstandingAmount: Number(sale.totalAmount),
        };
        setLedger((prev) => [newLedger, ...prev]);
        createMiddlemanLedgerApi(newLedger)
          .then((savedLedger) => {
            if (savedLedger && (savedLedger.ledgerId || savedLedger.id)) {
              setLedger((prev) =>
                prev.map((l) => (l.ledgerId === newLedger.ledgerId ? { ...l, ...savedLedger } : l))
              );
            }
          })
          .catch(() => {});

        addNotification({
          title: 'Vendor Sale Confirmed',
          description: `${sale.quantity} ${sale.unit || 'Qtl'} ${sale.cropName} confirmed by ${sale.businessName}. Stock updated.`,
          category: 'Transaction Completed',
          relatedId: sale.saleId,
          partyName: sale.businessName,
          actionUrl: '/middleman/sales-history',
        });
      }
    }

    // 4. Handle Customer Sale Confirmation -> Deducts stock & records in Ledger
    if (confItem.transactionType === 'Customer Sale') {
      const sale = customerSales.find((s) => s.saleId === confItem.transactionId);
      if (sale) {
        const cropBatches = inventory.filter((b) => b.cropName === sale.cropName);
        const { allocatedBatches, cogs } = allocateInventoryFIFO(cropBatches, sale.quantity);

        setInventory((prev) =>
          prev.map((batch) => {
            const allocation = allocatedBatches.find((a) => a.stockId === batch.stockId);
            if (allocation) {
              const newSold = (batch.soldQuantity || 0) + allocation.allocatedQuantity;
              const newAvail = Math.max(0, (batch.purchasedQuantity || 0) - newSold);
              const updatedStatus = newAvail <= 0 ? 'Exhausted' : newAvail <= 30 ? 'Low Stock' : 'In Stock';
              updateMiddlemanInventoryBatchApi(batch.stockId, {
                availableQuantity: newAvail,
                soldQuantity: newSold,
                status: updatedStatus,
                godownLocation: batch.godownLocation,
              }).catch(() => {});
              return {
                ...batch,
                soldQuantity: newSold,
                availableQuantity: newAvail,
                status: updatedStatus,
              };
            }
            return batch;
          })
        );

        setCustomerSales((prev) =>
          prev.map((s) =>
            s.saleId === sale.saleId
              ? {
                  ...s,
                  otpStatus: 'Confirmed',
                  status: 'Completed',
                  confirmationDate: now,
                  cogs,
                }
              : s
          )
        );

        setCustomers((prev) =>
          prev.map((c) =>
            c.customerId === sale.customerId
              ? {
                  ...c,
                  totalPurchases: (c.totalPurchases || 0) + 1,
                  totalPurchaseValue: (c.totalPurchaseValue || 0) + Number(sale.finalAmount),
                  outstandingReceivables: (c.outstandingReceivables || 0) + Number(sale.finalAmount),
                }
              : c
          )
        );

        const newLedger = {
          ledgerId: generateId('LED'),
          date: sale.salesDate || now.slice(0, 10),
          transactionId: sale.saleId,
          description: `Sale of ${sale.quantity} ${sale.unit || 'Qtl'} ${sale.cropName} to ${sale.customerName}`,
          partyId: sale.customerId,
          partyName: sale.customerName,
          partyCategory: 'Customer',
          debit: Number(sale.finalAmount),
          credit: 0,
          runningBalance: 0,
          expectedPaymentDate: sale.expectedPaymentDate,
          status: 'Pending',
          settledAmount: 0,
          outstandingAmount: Number(sale.finalAmount),
        };
        setLedger((prev) => [newLedger, ...prev]);
        createMiddlemanLedgerApi(newLedger)
          .then((savedLedger) => {
            if (savedLedger && (savedLedger.ledgerId || savedLedger.id)) {
              setLedger((prev) =>
                prev.map((l) => (l.ledgerId === newLedger.ledgerId ? { ...l, ...savedLedger } : l))
              );
            }
          })
          .catch(() => {});

        addNotification({
          title: 'Customer Sale Confirmed',
          description: `${sale.quantity} ${sale.unit || 'Qtl'} ${sale.cropName} delivery confirmed by ${sale.customerName}.`,
          category: 'Customer Purchase Confirmation',
          relatedId: sale.saleId,
          partyName: sale.customerName,
          actionUrl: '/middleman/sales-history',
        });
      }
    }
  }, [confirmations, purchases, vendorSales, customerSales, inventory, addNotification]);

  // Reject Transaction Action
  const rejectTransaction = useCallback((confirmationId, reason = 'Verification rejected by party.') => {
    const confItem = confirmations.find((c) => c.confirmationId === confirmationId || c.id === confirmationId);
    if (!confItem) return;

    const targetId = confItem.confirmationId || confItem.id || confirmationId;
    rejectMiddlemanOtpApi(targetId, reason).catch(() => null);

    setConfirmations((prev) =>
      prev.map((c) =>
        (c.confirmationId === confItem.confirmationId || (confItem.id && c.id === confItem.id))
          ? { ...c, otpStatus: 'Rejected', notes: `${c.notes} [Rejected: ${reason}]` }
          : c
      )
    );

    if (confItem.transactionType === 'Farmer Purchase') {
      setPurchases((prev) =>
        prev.map((p) =>
          p.purchaseId === confItem.transactionId
            ? { ...p, otpStatus: 'Rejected', status: 'Cancelled' }
            : p
        )
      );
    } else if (confItem.transactionType === 'Vendor Sale') {
      setVendorSales((prev) =>
        prev.map((s) =>
          s.saleId === confItem.transactionId
            ? { ...s, otpStatus: 'Rejected', status: 'Cancelled' }
            : s
        )
      );
    } else if (confItem.transactionType === 'Customer Sale') {
      setCustomerSales((prev) =>
        prev.map((s) =>
          s.saleId === confItem.transactionId
            ? { ...s, otpStatus: 'Rejected', status: 'Cancelled' }
            : s
        )
      );
    }

    addNotification({
      title: 'Transaction Verification Rejected',
      description: `${confItem.transactionType} ${confItem.transactionId} rejected: ${reason}`,
      category: 'Transaction Completed',
      relatedId: confItem.transactionId,
      partyName: confItem.partyName,
      priority: 'high',
      actionUrl: '/middleman/confirmations',
    });
  }, [confirmations, addNotification]);

  // Inventory Batch Actions
  const addInventoryBatch = useCallback(async (data) => {
    const stockId = generateId('STK');
    const purchasedQty = Number(data.purchasedQuantity ?? data.quantity ?? 0);
    const rate = Number(data.purchaseRate ?? data.rate ?? 0);
    const charges = Number(data.allocatedCharges ?? data.additionalCharges ?? 0);
    const newBatch = {
      stockId,
      cropName: data.cropName || '',
      variety: data.variety || 'Standard',
      farmerId: data.farmerId || 'FAR-0001',
      farmerName: data.farmerName || 'Registered Farmer',
      purchaseId: data.purchaseId || generateId('PUR'),
      purchaseDate: data.purchaseDate || new Date().toISOString().slice(0, 10),
      purchasedQuantity: purchasedQty,
      availableQuantity: Number(data.availableQuantity ?? purchasedQty),
      soldQuantity: Number(data.soldQuantity || 0),
      purchaseRate: rate,
      allocatedCharges: charges,
      averageCost: Number(data.averageCost || (purchasedQty > 0 ? (purchasedQty * rate + charges) / purchasedQty : rate)),
      quality: data.quality || 'Grade A',
      status: 'In Stock',
      godownLocation: data.godownLocation || 'Main AMC Warehouse',
      unit: data.unit || 'Quintal',
      minimumThreshold: Number(data.minimumThreshold || 10),
      ...data,
    };
    setInventory((prev) => [newBatch, ...prev]);
    try {
      const saved = await createMiddlemanInventoryBatchApi(newBatch);
      if (saved && (saved.stockId || saved.id)) {
        setInventory((prev) =>
          prev.map((b) => (b.stockId === stockId ? { ...b, ...saved } : b))
        );
        return saved;
      }
    } catch (err) {
      console.warn('Syncing inventory batch issue:', err);
    }
    return newBatch;
  }, []);

  const updateInventoryBatch = useCallback(async (id, data) => {
    setInventory((prev) =>
      prev.map((b) => (b.stockId === id || b.id === id ? { ...b, ...data } : b))
    );
    try {
      const saved = await updateMiddlemanInventoryBatchApi(id, data);
      if (saved) {
        setInventory((prev) =>
          prev.map((b) => (b.stockId === id || b.id === id ? { ...b, ...saved } : b))
        );
      }
    } catch (err) {
      console.warn('Updating inventory batch issue:', err);
    }
  }, []);

  // Ledger Actions
  const addLedgerEntry = useCallback(async (data) => {
    const ledgerId = generateId('LED');
    const newEntry = {
      ledgerId,
      date: data.date || new Date().toISOString().slice(0, 10),
      debit: Number(data.debit || 0),
      credit: Number(data.credit || 0),
      status: data.status || 'Pending',
      settledAmount: Number(data.settledAmount || 0),
      outstandingAmount: Number(data.outstandingAmount || (data.debit > 0 ? data.debit : data.credit) || 0),
      ...data,
    };
    setLedger((prev) => [newEntry, ...prev]);
    try {
      const saved = await createMiddlemanLedgerApi(newEntry);
      if (saved && (saved.ledgerId || saved.id)) {
        setLedger((prev) =>
          prev.map((l) => (l.ledgerId === ledgerId ? { ...l, ...saved } : l))
        );
        return saved;
      }
    } catch (err) {
      console.warn('Creating ledger entry issue:', err);
    }
    return newEntry;
  }, []);

  // Settle Ledger Entry (persisted directly to database)
  const settleLedgerEntry = useCallback((ledgerId, settledAmount, extra = {}) => {
    let numericId = extra?.id ?? extra?.raw?.id ?? (typeof ledgerId === 'number' ? ledgerId : null);
    if (!numericId) {
      const match = ledger.find((l) => l.ledgerId === ledgerId || l.id === ledgerId);
      if (match?.id) numericId = match.id;
    }

    setLedger((prev) =>
      prev.map((item) => {
        if (
          item.ledgerId === ledgerId ||
          item.id === ledgerId ||
          (numericId && item.id === numericId)
        ) {
          const total = item.debit > 0 ? item.debit : item.credit;
          const newSettled = (item.settledAmount || 0) + Number(settledAmount);
          const newOutstanding = Math.max(0, total - newSettled);
          const newStatus = newOutstanding <= 0 ? 'Paid' : 'Partially Paid';
          return {
            ...item,
            settledAmount: newSettled,
            outstandingAmount: newOutstanding,
            status: newStatus,
            paymentMode: extra.paymentMode || item.paymentMode || 'NEFT / RTGS',
            referenceNo: extra.referenceNo || extra.transactionId || item.referenceNo,
            description: extra.notes
              ? `${item.description || ''} | ${extra.paymentMode || 'Settlement'}: ${extra.notes}`
              : item.description,
          };
        }
        return item;
      })
    );

    settleMiddlemanLedgerApi(numericId || ledgerId, settledAmount, {
      ...extra,
      id: numericId,
    })
      .then((saved) => {
        if (saved && (saved.ledgerId || saved.id)) {
          setLedger((prev) =>
            prev.map((item) =>
              item.ledgerId === saved.ledgerId || (numericId && item.id === numericId)
                ? { ...item, ...saved }
                : item
            )
          );
        }
        if (typeof refreshLedger === 'function') {
          refreshLedger();
        }
      })
      .catch((err) => console.warn('settleMiddlemanLedgerApi error:', err));
  }, [ledger, refreshLedger]);

  // Compute Live Dashboard Metrics
  const dashboardMetrics = useMemo(() => {
    const totalFarmers = farmers.length;
    const totalVendors = vendors.length;
    const totalCustomers = customers.length;

    const confirmedPurchases = purchases.filter((p) => p.otpStatus === 'Confirmed');
    const totalPurchasesCount = confirmedPurchases.length;
    const totalPurchaseValue = confirmedPurchases.reduce((acc, p) => acc + (Number(p.totalAmount) || 0), 0);

    const confirmedVendorSales = vendorSales.filter((s) => s.otpStatus === 'Confirmed');
    const confirmedCustomerSales = customerSales.filter((s) => s.otpStatus === 'Confirmed');
    const totalSalesCount = confirmedVendorSales.length + confirmedCustomerSales.length;

    const vendorSalesVal = confirmedVendorSales.reduce((acc, s) => acc + (Number(s.totalAmount) || 0), 0);
    const customerSalesVal = confirmedCustomerSales.reduce((acc, s) => acc + (Number(s.finalAmount) || 0), 0);
    const totalSalesValue = vendorSalesVal + customerSalesVal;

    const availableInventory = inventory.reduce((acc, b) => acc + (Number(b.availableQuantity) || 0), 0);

    // Receivables & Payables
    const totalReceivables = ledger
      .filter((l) => (l.partyCategory === 'Vendor' || l.partyCategory === 'Customer') && l.status !== 'Paid')
      .reduce((acc, l) => acc + (Number(l.outstandingAmount) || 0), 0);

    const totalPayables = ledger
      .filter((l) => l.partyCategory === 'Farmer' && l.status !== 'Paid')
      .reduce((acc, l) => acc + (Number(l.outstandingAmount) || 0), 0);

    const amountReceived = ledger
      .filter((l) => l.partyCategory === 'Vendor' || l.partyCategory === 'Customer')
      .reduce((acc, l) => acc + (Number(l.settledAmount) || 0), 0);

    // Cost of Goods Sold from confirmed sales
    const totalCogs =
      confirmedVendorSales.reduce((acc, s) => acc + (Number(s.cogs) || 0), 0) +
      confirmedCustomerSales.reduce((acc, s) => acc + (Number(s.cogs) || 0), 0);

    const otherExpenses = 35000; // standard operating demo expenses (godown rent, handling)
    const { grossProfit, marginPercentage } = calculateGrossProfit(totalSalesValue, totalCogs, otherExpenses);
    const { netOutstanding } = calculateOutstandingPosition(totalReceivables, totalPayables);

    return {
      totalFarmers,
      totalVendors,
      totalCustomers,
      totalPurchasesCount,
      totalSalesCount,
      availableInventory,
      totalPurchaseValue,
      totalSalesValue,
      expectedReceivables: totalReceivables,
      expectedPayables: totalPayables,
      amountReceived,
      grossProfit,
      marginPercentage,
      netOutstanding,
      totalCogs,
    };
  }, [farmers, vendors, customers, purchases, vendorSales, customerSales, inventory, ledger]);

  // Reset to initial demo dataset
  const resetToDemoData = useCallback(() => {
    localStorage.removeItem(`${STORAGE_KEY}_profile`);
    localStorage.removeItem(`${STORAGE_KEY}_farmers`);
    localStorage.removeItem(`${STORAGE_KEY}_vendors`);
    localStorage.removeItem(`${STORAGE_KEY}_customers`);
    localStorage.removeItem(`${STORAGE_KEY}_purchases`);
    localStorage.removeItem(`${STORAGE_KEY}_inventory`);
    localStorage.removeItem(`${STORAGE_KEY}_vendor_sales`);
    localStorage.removeItem(`${STORAGE_KEY}_customer_sales`);
    localStorage.removeItem(`${STORAGE_KEY}_confirmations`);
    localStorage.removeItem(`${STORAGE_KEY}_ledger`);
    localStorage.removeItem(`${STORAGE_KEY}_notifications`);

    setProfile(INITIAL_PROFILE);
    setFarmers(INITIAL_FARMERS);
    setVendors(INITIAL_VENDORS);
    setCustomers(INITIAL_CUSTOMERS);
    setPurchases(INITIAL_PURCHASES);
    setInventory(INITIAL_INVENTORY_BATCHES);
    setVendorSales(INITIAL_VENDOR_SALES);
    setCustomerSales(INITIAL_CUSTOMER_SALES);
    setConfirmations(INITIAL_CONFIRMATIONS);
    setLedger(INITIAL_LEDGER_ENTRIES);
    setNotifications(INITIAL_NOTIFICATIONS);
  }, []);

  const value = {
    profile,
    updateProfile,
    refreshProfile,
    farmers,
    refreshFarmers,
    addFarmer,
    updateFarmer,
    vendors,
    refreshVendors,
    addVendor,
    updateVendor,
    customers,
    refreshCustomers,
    addCustomer,
    updateCustomer,
    purchases,
    refreshPurchases,
    createPurchase,
    vendorSales,
    refreshVendorSales,
    createVendorSale,
    customerSales,
    refreshCustomerSales,
    createCustomerSale,
    inventory,
    addInventoryBatch,
    updateInventoryBatch,
    refreshInventory,
    confirmations,
    confirmTransaction,
    rejectTransaction,
    refreshConfirmations,
    refreshCustomers,
    refreshCustomerSales,
    ledger,
    addLedgerEntry,
    settleLedgerEntry,
    refreshLedger,
    notifications,
    addNotification,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
    refreshNotifications,
    dashboardMetrics,
    resetToDemoData,
  };

  return <MiddlemanContext.Provider value={value}>{children}</MiddlemanContext.Provider>;
};

export default MiddlemanProvider;

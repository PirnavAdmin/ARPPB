import { createContext, useContext, useMemo, useState, useCallback, useEffect } from 'react';
import {
  initialProfile,
  initialCrops,
  initialMarketPrices,
  initialSales,
  initialPurchases,
  initialStockRecords,
  initialOTPRequests,
  initialNotifications,
} from '../data/farmerData';
import {
  generateTransactionId,
  generateOTP,
  calculateExpectedPaymentDate,
  formatCurrency,
} from '../utils/farmerHelpers';
import { useAuth } from '../../../hooks/useAuth';
import {
  fetchCropsApi,
  fetchCropOptionsApi,
  createCropApi,
  updateCropApi,
  deleteCropApi,
  addCropYieldApi,
  DEFAULT_CROP_OPTIONS,
} from '../../../services/farmerCropService';
import {
  fetchFarmerNotifications,
  fetchFarmerNotificationStats,
  markFarmerNotificationRead as markFarmerNotificationReadApi,
  markAllFarmerNotificationsRead as markAllFarmerNotificationsReadApi,
  deleteFarmerNotification as deleteFarmerNotificationApi,
} from '../../../services/farmerNotificationService';

const FarmerContext = createContext(null);
const STORAGE_KEY = 'agri-farmer-portal-state-v1';

const unwrapList = (value) => {
  if (Array.isArray(value)) return value;
  return value?.items || value?.notifications || value?.data || [];
};

const normalizeFarmerNotification = (item) => {
  const timestamp = item.timestamp || item.createdAt || item.createdDate || item.createdOn;
  return {
    ...item,
    id: item.id ?? item.notificationId,
    title: item.title || item.subject || 'Notification',
    detail: item.detail || item.message || item.description || '',
    time: item.time || item.relativeTime || (timestamp ? new Date(timestamp).toLocaleString() : 'Today'),
    timestamp,
    type: String(item.type || item.priority || 'info').toLowerCase(),
    category: String(item.category || item.type || 'general').toLowerCase(),
    read: Boolean(item.read ?? item.isRead ?? item.is_read),
    targetPage: item.targetPage || item.actionUrl || item.page,
    targetId: item.targetId || item.referenceId || item.entityId,
  };
};

const loadPersistedFarmerState = () => {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const matchesCropRecord = (record, cropId, cropName) => {
  const normalizedCropName = String(cropName || '').trim().toLowerCase();
  const recordName = String(record?.name || record?.cropName || '').trim().toLowerCase();
  const recordCropId = record?.cropId || record?.id;

  if (cropId) {
    if (recordCropId === cropId) return true;
    if (record?.id === cropId || record?.cropId === cropId) return true;
  }

  return Boolean(recordName && normalizedCropName && recordName === normalizedCropName);
};

const getInitialFarmerProfile = (persistedState, authUser) => {
  let base = persistedState?.profile ?? initialProfile;
  if (base.farmerName === 'Venkata Reddy' || base.farmName === 'Reddy Agro Farms & Greenfields') {
    base = { ...initialProfile };
  }
  if (authUser) {
    const authMobile = authUser.mobile || authUser.contactNumber || '';
    base = {
      ...base,
      farmerName: authUser.fullName || base.farmerName || '',
      mobileNumber: authMobile
        ? (authMobile.startsWith('+91') ? authMobile : `+91 ${authMobile}`)
        : (base.mobileNumber || ''),
      email: authUser.email || base.email || '',
      farmerId:
        authUser.entityCode ||
        (authUser.userId ? `AG-FARM-${authUser.userId}` : base.farmerId || ''),
    };
  }
  if (typeof window !== 'undefined') {
    try {
      const authRaw = window.localStorage.getItem('agri_farmer_auth_v1');
      if (authRaw) {
        const parsed = JSON.parse(authRaw);
        if (parsed?.mobile) {
          const clean = String(parsed.mobile).replace(/\D/g, '').slice(-10);
          base = {
            ...base,
            mobileNumber: `+91 ${clean}`,
            farmerName: parsed.fullName || base.farmerName,
            farmerId: parsed.farmerId || base.farmerId,
            password: parsed.password || base.password,
          };
        }
      }
    } catch {
      // Ignore parse errors
    }
  }
  return base;
};

export const farmerNavItems = [
  { key: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
  { key: 'crops', label: 'My Crops', icon: 'crops' },
  { key: 'prices', label: 'Daily Market Prices', icon: 'prices' },
  { key: 'sell', label: 'Sell Products', icon: 'sell' },
  { key: 'sales', label: 'My Sales', icon: 'sales' },
  { key: 'otp', label: 'OTP Confirmations', icon: 'otp', hasBadge: true },
  { key: 'notifications', label: 'Notifications', icon: 'bell', hasBadge: true },
  { key: 'profile', label: 'My Profile', icon: 'profile' },
];

export function FarmerProvider({ children }) {
  const { user } = useAuth();
  const authKey = String(user?.userId || user?.fullName || '');

  const getInitialPage = () => {
    if (typeof window === 'undefined') return 'dashboard';
    const hash = window.location.hash.replace(/^#\/?/, '').trim();
    return hash || 'dashboard';
  };

  const [activePage, setActivePage] = useState(getInitialPage);
  const [pageParam, setPageParam] = useState(null); // optional parameter for navigation
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  const persistedState = loadPersistedFarmerState();

  // Core Data States
  const [profile, setProfile] = useState(() => getInitialFarmerProfile(persistedState, user));
  const [trackedAuthKey, setTrackedAuthKey] = useState(authKey);
  if (authKey && authKey !== trackedAuthKey) {
    setTrackedAuthKey(authKey);
    const authMobile = user?.mobile || user?.contactNumber || '';
    setProfile((prev) => ({
      ...prev,
      farmerName: user?.fullName || prev.farmerName || '',
      mobileNumber: authMobile
        ? (authMobile.startsWith('+91') ? authMobile : `+91 ${authMobile}`)
        : (prev.mobileNumber || ''),
      email: user?.email || prev.email || '',
      farmerId:
        user?.entityCode ||
        (user?.userId ? `AG-FARM-${user.userId}` : prev.farmerId || ''),
    }));
  }
  const [crops, setCrops] = useState(() => persistedState?.crops ?? initialCrops);
  const [cropOptions, setCropOptions] = useState(DEFAULT_CROP_OPTIONS);
  const [isCropsLoading, setIsCropsLoading] = useState(false);
  const [cropsError, setCropsError] = useState(null);
  const [marketPrices, setMarketPrices] = useState(() => persistedState?.marketPrices ?? initialMarketPrices);
  const [sales, setSales] = useState(() => persistedState?.sales ?? initialSales);
  const [purchases, setPurchases] = useState(() => persistedState?.purchases ?? initialPurchases);
  const [stockRecords, setStockRecords] = useState(() => persistedState?.stockRecords ?? initialStockRecords);
  const [otpRequests, setOtpRequests] = useState(() => persistedState?.otpRequests ?? initialOTPRequests);
  const [notifications, setNotifications] = useState(() => persistedState?.notifications ?? initialNotifications);
  const [notificationStats, setNotificationStats] = useState(null);

  useEffect(() => {
    let active = true;
    Promise.allSettled([fetchFarmerNotifications(), fetchFarmerNotificationStats()]).then(([listResult, statsResult]) => {
      if (!active) return;
      if (listResult.status === 'fulfilled') {
        setNotifications(unwrapList(listResult.value).map(normalizeFarmerNotification));
      }
      if (statsResult.status === 'fulfilled') {
        const data = statsResult.value?.stats || statsResult.value;
        if (data && typeof data === 'object') setNotificationStats(data);
      }
    });
    return () => { active = false; };
  }, [authKey]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        profile,
        crops,
        marketPrices,
        sales,
        purchases,
        stockRecords,
        otpRequests,
        notifications,
      })
    );
  }, [profile, crops, marketPrices, sales, purchases, stockRecords, otpRequests, notifications]);

  // Global Modals
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [activeOtpRequest, setActiveOtpRequest] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'success', duration = 5000) => {
    const id = Date.now();
    setToast({ id, message, type });
    setTimeout(() => {
      setToast((curr) => (curr && curr.id === id ? null : curr));
    }, duration);
  }, []);

  const hideToast = useCallback(() => {
    setToast(null);
  }, []);

  // Unread counts
  const unreadNotificationsCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const pendingOtpCount = useMemo(
    () => otpRequests.filter((o) => o.otpStatus === 'Pending' && o.direction !== 'farmer_initiated').length,
    [otpRequests]
  );

  // Page navigation helper
  const navigateTo = useCallback((pageKey, param = null) => {
    const nextKey = pageKey || 'dashboard';
    setActivePage(nextKey);
    setPageParam(param);
    setIsMobileDrawerOpen(false);
    if (typeof window !== 'undefined') {
      window.history.pushState(null, '', `#${nextKey}`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const syncFromHash = () => {
      const nextPage = window.location.hash.replace(/^#\/?/, '').trim() || 'dashboard';
      setActivePage((current) => (current === nextPage ? current : nextPage));
    };

    syncFromHash();
    window.addEventListener('hashchange', syncFromHash);
    return () => window.removeEventListener('hashchange', syncFromHash);
  }, []);

  // Notifications Actions
  const markNotificationAsRead = useCallback((id) => {
    const wasUnread = notifications.some((item) => item.id === id && !item.read);
    setNotifications((prev) =>
      prev.map((item) => (item.id === id ? { ...item, read: true } : item))
    );
    if (wasUnread) setNotificationStats((prev) => prev ? {
      ...prev,
      unreadCount: Math.max(0, Number(prev.unreadCount ?? prev.unread ?? 0) - 1),
      unread: Math.max(0, Number(prev.unread ?? prev.unreadCount ?? 0) - 1),
    } : prev);
    markFarmerNotificationReadApi(id).catch(() => showToast('Could not update notification status.', 'error'));
  }, [notifications, showToast]);

  const markAllNotificationsAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
    setNotificationStats((prev) => prev ? { ...prev, unreadCount: 0, unread: 0 } : prev);
    markAllFarmerNotificationsReadApi().catch(() => showToast('Could not mark notifications as read.', 'error'));
    showToast('All notifications marked as read', 'info', 3000);
  }, [showToast]);

  const deleteNotification = useCallback(async (id) => {
    const removed = notifications.find((item) => item.id === id);
    setNotifications((prev) => prev.filter((item) => item.id !== id));
    setNotificationStats((prev) => prev ? {
      ...prev,
      totalCount: Math.max(0, Number(prev.totalCount ?? prev.total ?? 0) - 1),
      total: Math.max(0, Number(prev.total ?? prev.totalCount ?? 0) - 1),
      ...(removed && !removed.read ? {
        unreadCount: Math.max(0, Number(prev.unreadCount ?? prev.unread ?? 0) - 1),
        unread: Math.max(0, Number(prev.unread ?? prev.unreadCount ?? 0) - 1),
      } : {}),
    } : prev);
    try {
      await deleteFarmerNotificationApi(id);
    } catch {
      if (removed) setNotifications((prev) => prev.some((item) => item.id === id) ? prev : [removed, ...prev]);
      setNotificationStats((prev) => prev ? {
        ...prev,
        totalCount: Number(prev.totalCount ?? prev.total ?? 0) + 1,
        total: Number(prev.total ?? prev.totalCount ?? 0) + 1,
        ...(removed && !removed.read ? {
          unreadCount: Number(prev.unreadCount ?? prev.unread ?? 0) + 1,
          unread: Number(prev.unread ?? prev.unreadCount ?? 0) + 1,
        } : {}),
      } : prev);
      showToast('Could not delete notification. Refresh to try again.', 'error');
    }
  }, [notifications, showToast]);

  // Profile Action
  const updateProfile = useCallback((updated, options = {}) => {
    setProfile((prev) => {
      const next = { ...prev, ...updated };
      if (typeof window !== 'undefined') {
        try {
          const raw = window.localStorage.getItem('agri_farmer_auth_v1');
          const existing = raw ? JSON.parse(raw) : {};
          const cleanMobile = next.mobileNumber
            ? String(next.mobileNumber).replace(/\D/g, '').slice(-10)
            : existing.mobile || '';
          const syncedAuth = {
            ...existing,
            mobile: cleanMobile,
            password: next.password || existing.password || '',
            fullName: next.farmerName || existing.fullName || '',
            farmerId: next.farmerId || existing.farmerId || '',
            updatedAt: new Date().toISOString(),
          };
          window.localStorage.setItem('agri_farmer_auth_v1', JSON.stringify(syncedAuth));
        } catch {
          // Ignore parse errors
        }
      }
      return next;
    });
    if (!options?.silent) {
      showToast('Profile updated successfully!', 'success');
    }
  }, [showToast]);

  // Crops API Integration
  const loadCropsFromApi = useCallback(async (filters = {}) => {
    setIsCropsLoading(true);
    setCropsError(null);
    try {
      const apiCrops = await fetchCropsApi({
        category: filters.category,
        season: filters.season,
        search: filters.search,
        userId: user?.userId,
      });
      if (Array.isArray(apiCrops)) {
        setCrops(apiCrops);
      }
      return apiCrops;
    } catch (error) {
      console.warn('Farmer crops API fetch error:', error?.message);
      setCropsError(error?.message || 'Failed to sync crops with server.');
      return null;
    } finally {
      setIsCropsLoading(false);
    }
  }, [user?.userId]);

  const loadCropOptionsFromApi = useCallback(async () => {
    try {
      const opts = await fetchCropOptionsApi();
      if (opts) {
        setCropOptions(opts);
      }
    } catch (error) {
      console.warn('Crop options fetch error:', error?.message);
    }
  }, []);

  useEffect(() => {
    loadCropOptionsFromApi();
    loadCropsFromApi();
  }, [loadCropOptionsFromApi, loadCropsFromApi]);

  // Crop CRUD Actions
  const addCrop = useCallback(async (newCropData) => {
    let createdCrop = null;
    try {
      createdCrop = await createCropApi(newCropData, user?.userId, profile);
    } catch (apiError) {
      console.warn('Backend create crop failed:', apiError);
      showToast(apiError?.message || 'Failed to register crop on server.', 'error', 6000);
      throw apiError;
    }

    if (createdCrop) {
      setCrops((prev) => [createdCrop, ...prev.filter((c) => c.id !== createdCrop.id)]);

      setStockRecords((prev) => [
        {
          id: `STK-${String(createdCrop.id).slice(-3)}`,
          cropId: createdCrop.id,
          cropName: createdCrop.name,
          variety: createdCrop.variety || 'Standard',
          openingStock: createdCrop.availableQuantity,
          harvestedQuantity: createdCrop.availableQuantity,
          soldQuantity: 0,
          reservedQuantity: 0,
          availableQuantity: createdCrop.availableQuantity,
          unit: createdCrop.unit || 'Quintals',
          lastUpdated: new Date().toISOString().split('T')[0],
          status: createdCrop.availableQuantity > 50 ? 'Normal' : 'Low Stock',
          storageLocation: createdCrop.storageLocation || `Reddy Farm Warehouse Bay-${(prev.length % 3) + 1}`,
        },
        ...prev,
      ]);

      showToast(`Crop "${createdCrop.name}" registered successfully!`, 'success');
      return createdCrop;
    }
  }, [profile, user?.userId, showToast]);

  const updateCrop = useCallback(async (id, updatedFields) => {
    let updatedCrop = null;
    const isBackendId = typeof id === 'number' || (!isNaN(Number(id)) && !String(id).includes('CROP-'));

    if (isBackendId) {
      try {
        updatedCrop = await updateCropApi(Number(id), updatedFields, user?.userId, profile);
      } catch (apiError) {
        console.warn('Backend update crop failed:', apiError);
        showToast(apiError?.message || 'Failed to update crop on server.', 'error', 6000);
        throw apiError;
      }
    }

    setCrops((prev) =>
      prev.map((c) => {
        if (c.id === id || (updatedCrop && c.id === updatedCrop.id)) {
          return updatedCrop ? { ...c, ...updatedCrop } : { ...c, ...updatedFields };
        }
        return c;
      })
    );

    showToast('Crop information updated successfully.', 'success');
    return updatedCrop;
  }, [profile, user?.userId, showToast]);

  const deleteCrop = useCallback(async (id) => {
    const crop = crops.find((c) => c.id === id);
    if (!crop) return;

    const hasActiveSales = sales.some(
      (s) => (s.cropId === id || s.cropName.toLowerCase() === crop.name.toLowerCase()) && s.transactionStatus === 'Pending Confirmation'
    );
    if (hasActiveSales) {
      showToast('Cannot delete crop with pending transactions.', 'error');
      return;
    }

    const isBackendId = typeof id === 'number' || (!isNaN(Number(id)) && !String(id).includes('CROP-'));
    if (isBackendId) {
      try {
        await deleteCropApi(Number(id), user?.userId);
      } catch (apiError) {
        console.warn('Backend delete crop failed:', apiError);
        showToast(apiError?.message || 'Failed to delete crop from server.', 'error', 6000);
        return;
      }
    }

    setCrops((prev) => prev.filter((c) => c.id !== id));
    setStockRecords((prev) => prev.filter((s) => !matchesCropRecord(s, id, crop.name)));
    showToast(`Crop "${crop.name}" removed from inventory.`, 'info');
  }, [crops, sales, user?.userId, showToast]);

  // Adjust Stock / Harvest
  const addHarvestStock = useCallback(async (cropIdentifier, additionalQty, unit = 'Quintals') => {
    const qty = Number(additionalQty);
    if (isNaN(qty) || qty <= 0) return;

    const cropTarget = crops.find(
      (c) => c.id === cropIdentifier || c.name.toLowerCase() === String(cropIdentifier || '').trim().toLowerCase()
    );
    const cropId = cropTarget?.id || cropIdentifier;
    const cropName = cropTarget?.name || String(cropIdentifier || '').trim();

    let updatedCropFromApi = null;
    const isBackendId = typeof cropId === 'number' || (!isNaN(Number(cropId)) && !String(cropId).includes('CROP-'));

    if (isBackendId) {
      try {
        updatedCropFromApi = await addCropYieldApi(Number(cropId), qty, user?.userId);
      } catch (apiError) {
        console.warn('Backend add yield stock failed:', apiError);
        showToast(apiError?.message || 'Failed to add harvest yield to server.', 'error', 6000);
        return;
      }
    }

    setCrops((prev) =>
      prev.map((c) => {
        if (matchesCropRecord(c, cropId, cropName)) {
          if (updatedCropFromApi) {
            return { ...c, ...updatedCropFromApi };
          }
          const newHarvested = (Number(c.harvestedQuantity) || 0) + qty;
          const newAvailable = (Number(c.availableQuantity) || 0) + qty;
          return {
            ...c,
            harvestedQuantity: newHarvested,
            availableQuantity: newAvailable,
            status: newAvailable < 50 ? 'Low Stock' : 'Ready to Sell',
          };
        }
        return c;
      })
    );

    setStockRecords((prev) =>
      prev.map((s) => {
        if (s.cropId === cropId || matchesCropRecord(s, cropId, cropName) || s.id === `STK-${String(cropId || '').slice(-3)}`) {
          const newHarvested = (Number(s.harvestedQuantity) || 0) + qty;
          const newAvailable = (Number(s.availableQuantity) || 0) + qty;
          return {
            ...s,
            harvestedQuantity: newHarvested,
            availableQuantity: newAvailable,
            lastUpdated: new Date().toISOString().split('T')[0],
            status: newAvailable < 50 ? 'Low Stock' : 'Normal',
          };
        }
        return s;
      })
    );

    setNotifications((prev) => [
      {
        id: `NOTIF-${Date.now()}`,
        title: 'Stock Updated',
        detail: `Added ${qty} ${unit} harvested yield to ${cropName} stock. Available balance updated.`,
        time: 'Just now',
        timestamp: new Date().toISOString(),
        type: 'info',
        category: 'stock',
        read: false,
        targetPage: 'stock',
      },
      ...prev,
    ]);

    showToast(`Harvest of ${qty} ${unit} added to ${cropName} successfully!`, 'success');
  }, [crops, user?.userId, showToast]);

  // Sell Products: Create Sale Transaction
  const createSale = useCallback((saleForm) => {
    const cropId = saleForm.cropId || crops.find((c) => c.name.toLowerCase() === (saleForm.cropName || '').toLowerCase())?.id;
    const crop = crops.find((c) => matchesCropRecord(c, cropId, saleForm.cropName));
    const qty = Number(saleForm.sellingQuantity);
    const rate = Number(saleForm.rate);
    const total = qty * rate;

    if (!crop) {
      showToast('Selected crop not found.', 'error');
      return null;
    }

    if (qty <= 0) {
      showToast('Selling quantity must be greater than zero.', 'error');
      return null;
    }

    if (qty > crop.availableQuantity) {
      showToast(`Selling quantity exceeds available stock (${crop.availableQuantity} ${crop.unit})`, 'error');
      return null;
    }

    const txId = generateTransactionId();
    const otpCode = generateOTP();
    const today = new Date().toISOString().split('T')[0];
    const expectedPayDate = calculateExpectedPaymentDate(new Date(), 3);
    const expiresAt = Date.now() + 10 * 60 * 1000;

    // 1. Create Transaction (Pending Confirmation)
    const newTransaction = {
      id: txId,
      date: today,
      cropId: crop.id,
      cropName: crop.name,
      buyerName: saleForm.buyerName.trim(),
      buyerCategory: saleForm.buyerCategory,
      buyerMobile: saleForm.buyerMobile.trim(),
      quantity: qty,
      unit: crop.unit,
      rate: rate,
      totalAmount: total,
      transactionStatus: 'Pending Confirmation',
      otpStatus: 'Pending',
      expectedPaymentDate: expectedPayDate,
      paymentStatus: 'Payment Expected',
      pickupLocation: saleForm.pickupLocation || `${profile.farmName}, ${profile.village}`,
      notes: saleForm.notes || 'Sale initiated by farmer. Pending OTP confirmation from receiving party.',
      qualityGrade: saleForm.qualityGrade || crop.qualityGrade,
    };

    setSales((prev) => [newTransaction, ...prev]);

    // 2. Mark stock as reserved until OTP confirmed
    setCrops((prev) =>
      prev.map((c) => {
        if (matchesCropRecord(c, crop.id, crop.name)) {
          return {
            ...c,
            reservedQuantity: (c.reservedQuantity || 0) + qty,
            availableQuantity: c.availableQuantity - qty,
          };
        }
        return c;
      })
    );

    setStockRecords((prev) =>
      prev.map((s) => {
        if (s.id === `STK-${crop.id.slice(-3)}` || matchesCropRecord(s, crop.id, crop.name)) {
          return {
            ...s,
            reservedQuantity: (s.reservedQuantity || 0) + qty,
            availableQuantity: s.availableQuantity - qty,
            lastUpdated: today,
          };
        }
        return s;
      })
    );

    // 3. Create OTP Confirmation Request
    const newOtpRequest = {
      id: `OTP-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      transactionId: txId,
      buyerName: newTransaction.buyerName,
      buyerCategory: newTransaction.buyerCategory,
      buyerMobile: newTransaction.buyerMobile,
      crop: crop.name,
      cropId: crop.id,
      quantity: qty,
      unit: crop.unit,
      rate: rate,
      totalAmount: total,
      requestDate: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' Today',
      otpStatus: 'Pending',
      otpCode: otpCode,
      expiresAt,
      expiresInMinutes: 10,
      attemptsLeft: 3,
      direction: 'farmer_initiated',
    };

    setOtpRequests((prev) => [newOtpRequest, ...prev]);

    setNotifications((prev) => [
      {
        id: `NOTIF-${Date.now()}`,
        title: 'New Sale Initiated',
        detail: `Sale of ${qty} ${crop.unit} ${crop.name} to ${newTransaction.buyerName} (${formatCurrency(total)}) created. OTP sent to buyer mobile. Stock reserved.`,
        time: 'Just now',
        timestamp: new Date().toISOString(),
        type: 'warning',
        category: 'otp',
        read: false,
        targetPage: 'otp',
        targetId: txId,
      },
      ...prev,
    ]);

    showToast(
      `Sale ${txId} created! Buyer confirmation is required before stock is finalized.`,
      'info',
      8000
    );

    return { transaction: newTransaction, otpRequest: newOtpRequest };
  }, [crops, profile, showToast]);

  // Verify OTP Confirmation Action
  const verifyOTP = useCallback((otpId, enteredCode) => {
    const otpReq = otpRequests.find((o) => o.id === otpId);
    if (!otpReq) {
      showToast('OTP request not found.', 'error');
      return false;
    }

    if (otpReq.direction === 'farmer_initiated') {
      showToast('This OTP was generated for buyer confirmation and cannot be verified by the farmer.', 'warning');
      return false;
    }

    if (otpReq.otpStatus !== 'Pending') {
      showToast(`This OTP request is already ${otpReq.otpStatus.toLowerCase()}.`, 'warning');
      return false;
    }

    const expiresAt = Number(otpReq.expiresAt || (Date.now() + (Number(otpReq.expiresInMinutes || 10) * 60 * 1000)));
    if (Date.now() > expiresAt) {
      setOtpRequests((prev) =>
        prev.map((o) => (o.id === otpId ? { ...o, otpStatus: 'Expired', attemptsLeft: 0 } : o))
      );
      showToast('This OTP has expired. Please request a fresh verification code.', 'error');
      return false;
    }

    if (enteredCode !== otpReq.otpCode) {
      const nextAttemptsLeft = Math.max(0, Number(otpReq.attemptsLeft || 0) - 1);
      const nextStatus = nextAttemptsLeft <= 0 ? 'Expired' : otpReq.otpStatus;
      setOtpRequests((prev) =>
        prev.map((o) =>
          o.id === otpId ? { ...o, otpStatus: nextStatus, attemptsLeft: nextAttemptsLeft } : o
        )
      );

      if (nextAttemptsLeft <= 0) {
        showToast('Maximum verification attempts exceeded. OTP expired.', 'error');
        return false;
      }

      showToast(`Invalid OTP. ${nextAttemptsLeft} attempt(s) remaining.`, 'error');
      return false;
    }

    // OTP IS VALID!
    setOtpRequests((prev) =>
      prev.map((o) => (o.id === otpId ? { ...o, otpStatus: 'Confirmed', expiresAt: Date.now(), attemptsLeft: 0 } : o))
    );

    const today = new Date().toISOString().split('T')[0];
    const expectedPayDate = calculateExpectedPaymentDate(new Date(), 3);

    setSales((prev) =>
      prev.map((s) => {
        if (s.id === otpReq.transactionId) {
          return {
            ...s,
            transactionStatus: 'Confirmed',
            otpStatus: 'Verified',
            expectedPaymentDate: expectedPayDate,
            paymentStatus: 'Payment Expected',
          };
        }
        return s;
      })
    );

    setCrops((prev) =>
      prev.map((c) => {
        if (matchesCropRecord(c, otpReq.cropId, otpReq.crop)) {
          const wasReserved = otpReq.direction === 'farmer_initiated';
          return {
            ...c,
            soldQuantity: c.soldQuantity + otpReq.quantity,
            reservedQuantity: wasReserved ? Math.max(0, (c.reservedQuantity || 0) - otpReq.quantity) : c.reservedQuantity,
            availableQuantity: wasReserved ? c.availableQuantity : Math.max(0, c.availableQuantity - otpReq.quantity),
          };
        }
        return c;
      })
    );

    setStockRecords((prev) =>
      prev.map((s) => {
        if (matchesCropRecord(s, otpReq.cropId, otpReq.crop)) {
          const wasReserved = otpReq.direction === 'farmer_initiated';
          return {
            ...s,
            soldQuantity: s.soldQuantity + otpReq.quantity,
            reservedQuantity: wasReserved ? Math.max(0, (s.reservedQuantity || 0) - otpReq.quantity) : s.reservedQuantity,
            availableQuantity: wasReserved ? s.availableQuantity : Math.max(0, s.availableQuantity - otpReq.quantity),
            lastUpdated: today,
          };
        }
        return s;
      })
    );

    setNotifications((prev) => [
      {
        id: `NOTIF-${Date.now()}`,
        title: 'Transaction Confirmed Successfully!',
        detail: `Your sale of ${otpReq.quantity} ${otpReq.unit} ${otpReq.crop} for ${formatCurrency(otpReq.totalAmount)} has been confirmed. Your payment is expected within 3 working days (${expectedPayDate}).`,
        time: 'Just now',
        timestamp: new Date().toISOString(),
        type: 'success',
        category: 'sales',
        read: false,
        targetPage: 'sales',
        targetId: otpReq.transactionId,
      },
      ...prev,
    ]);

    showToast(
      `Transaction Confirmed Successfully! Your payment is expected within 3 working days.`,
      'success',
      7000
    );

    setActiveOtpRequest(null);
    return true;
  }, [otpRequests, showToast]);

  // Reject OTP Transaction Action
  const rejectOTP = useCallback((otpId, reason = 'Transaction rejected by user') => {
    const otpReq = otpRequests.find((o) => o.id === otpId);
    if (!otpReq) return;

    if (otpReq.direction === 'farmer_initiated') {
      showToast('Buyer confirmation requests cannot be rejected by the farmer.', 'warning');
      return;
    }

    setOtpRequests((prev) =>
      prev.map((o) => (o.id === otpId ? { ...o, otpStatus: 'Rejected' } : o))
    );

    // 2. Mark Transaction as Rejected
    setSales((prev) =>
      prev.map((s) => {
        if (s.id === otpReq.transactionId) {
          return {
            ...s,
            transactionStatus: 'Rejected',
            otpStatus: 'Rejected',
            notes: `${s.notes} [Rejected: ${reason}]`,
          };
        }
        return s;
      })
    );

    // 3. Release reserved stock back to available
    if (otpReq.direction === 'farmer_initiated') {
      setCrops((prev) =>
        prev.map((c) => {
          if (c.name.toLowerCase() === otpReq.crop.toLowerCase()) {
            return {
              ...c,
              reservedQuantity: Math.max(0, (c.reservedQuantity || 0) - otpReq.quantity),
              availableQuantity: c.availableQuantity + otpReq.quantity,
            };
          }
          return c;
        })
      );

      setStockRecords((prev) =>
        prev.map((s) => {
          if (s.cropName.toLowerCase() === otpReq.crop.toLowerCase()) {
            return {
              ...s,
              reservedQuantity: Math.max(0, (s.reservedQuantity || 0) - otpReq.quantity),
              availableQuantity: s.availableQuantity + otpReq.quantity,
            };
          }
          return s;
        })
      );
    }

    // 4. Notification
    setNotifications((prev) => [
      {
        id: `NOTIF-${Date.now()}`,
        title: 'Transaction Rejected',
        detail: `Transaction ${otpReq.transactionId} for ${otpReq.crop} was rejected. Reserved stock restored to inventory.`,
        time: 'Just now',
        timestamp: new Date().toISOString(),
        type: 'danger',
        category: 'otp',
        read: false,
        targetPage: 'otp',
      },
      ...prev,
    ]);

    showToast(`Transaction ${otpReq.transactionId} rejected. Reserved stock has been released.`, 'info');
    setActiveOtpRequest(null);
  }, [otpRequests, showToast]);

  // Resend OTP Action
  const resendOTP = useCallback((otpId) => {
    const newCode = generateOTP();
    const newExpiresAt = Date.now() + 10 * 60 * 1000;
    setOtpRequests((prev) =>
      prev.map((o) =>
        o.id === otpId
          ? {
            ...o,
            otpCode: newCode,
            expiresAt: newExpiresAt,
            expiresInMinutes: 10,
            attemptsLeft: 3,
            otpStatus: 'Pending',
          }
          : o
      )
    );
    showToast('A fresh OTP was sent to the receiving party.', 'info', 6000);
  }, [showToast]);

  // Add Purchase Action
  const addPurchase = useCallback((purchaseData) => {
    const newId = `PUR-AGRI-2026-0${Date.now().toString().slice(-3)}`;
    const total = Number(purchaseData.quantity) * Number(purchaseData.price);
    const purchase = {
      id: newId,
      date: new Date().toISOString().split('T')[0],
      totalAmount: total,
      paymentStatus: 'Payment Expected',
      status: 'Recorded',
      ...purchaseData,
    };

    setPurchases((prev) => [purchase, ...prev]);

    showToast(`Purchase ${newId} recorded. Payment remains pending until manually authorized.`, 'success');
  }, [showToast]);

  const value = useMemo(
    () => ({
      activePage,
      setActivePage,
      pageParam,
      setPageParam,
      navigateTo,
      searchQuery,
      setSearchQuery,
      isSidebarCollapsed,
      setIsSidebarCollapsed,
      isMobileDrawerOpen,
      setIsMobileDrawerOpen,

      // Profile
      profile,
      updateProfile,

      // Crops
      crops,
      cropOptions,
      isCropsLoading,
      cropsError,
      refreshCrops: loadCropsFromApi,
      addCrop,
      updateCrop,
      deleteCrop,
      addHarvestStock,

      // Market Prices
      marketPrices,
      setMarketPrices,

      // Sales
      sales,
      createSale,

      // Purchases
      purchases,
      addPurchase,

      // Stock
      stockRecords,

      // OTP Confirmations
      otpRequests,
      verifyOTP,
      rejectOTP,
      resendOTP,
      pendingOtpCount,

      // Notifications
      notifications,
      notificationStats,
      unreadNotificationsCount,
      markNotificationAsRead,
      markAllNotificationsAsRead,
      deleteNotification,

      // Modals & UI State
      selectedTransaction,
      setSelectedTransaction,
      activeOtpRequest,
      setActiveOtpRequest,
      toast,
      showToast,
      hideToast,
    }),
    [
      activePage,
      pageParam,
      navigateTo,
      searchQuery,
      isSidebarCollapsed,
      isMobileDrawerOpen,
      profile,
      updateProfile,
      crops,
      cropOptions,
      isCropsLoading,
      cropsError,
      loadCropsFromApi,
      addCrop,
      updateCrop,
      deleteCrop,
      addHarvestStock,
      marketPrices,
      sales,
      createSale,
      purchases,
      addPurchase,
      stockRecords,
      otpRequests,
      verifyOTP,
      rejectOTP,
      resendOTP,
      pendingOtpCount,
      notifications,
      notificationStats,
      unreadNotificationsCount,
      markNotificationAsRead,
      markAllNotificationsAsRead,
      deleteNotification,
      selectedTransaction,
      activeOtpRequest,
      toast,
      showToast,
      hideToast,
    ]
  );

  return <FarmerContext.Provider value={value}>{children}</FarmerContext.Provider>;
}

export function useFarmer() {
  const context = useContext(FarmerContext);
  if (!context) {
    throw new Error('useFarmer must be used inside FarmerProvider');
  }
  return context;
}

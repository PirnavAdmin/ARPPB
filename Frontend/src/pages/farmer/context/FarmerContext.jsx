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

const FarmerContext = createContext(null);
const STORAGE_KEY = 'agri-farmer-portal-state-v1';

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

const getInitialFarmerProfile = (persistedState) => {
  let base = persistedState?.profile ?? initialProfile;
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
  const { user, updateUserMobile } = useAuth();
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
  const [profile, setProfile] = useState(() => getInitialFarmerProfile(persistedState));
  const [crops, setCrops] = useState(() => persistedState?.crops ?? initialCrops);
  const [marketPrices, setMarketPrices] = useState(() => persistedState?.marketPrices ?? initialMarketPrices);
  const [sales, setSales] = useState(() => persistedState?.sales ?? initialSales);
  const [purchases, setPurchases] = useState(() => persistedState?.purchases ?? initialPurchases);
  const [stockRecords, setStockRecords] = useState(() => persistedState?.stockRecords ?? initialStockRecords);
  const [otpRequests, setOtpRequests] = useState(() => persistedState?.otpRequests ?? initialOTPRequests);
  const [notifications, setNotifications] = useState(() => persistedState?.notifications ?? initialNotifications);

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
    setNotifications((prev) =>
      prev.map((item) => (item.id === id ? { ...item, read: true } : item))
    );
  }, []);

  const markAllNotificationsAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
    showToast('All notifications marked as read', 'info', 3000);
  }, [showToast]);

  // Profile Action
  const updateProfile = useCallback((updated) => {
    setProfile((prev) => {
      const next = { ...prev, ...updated };
      if (typeof window !== 'undefined') {
        try {
          const raw = window.localStorage.getItem('agri_farmer_auth_v1');
          const existing = raw ? JSON.parse(raw) : {};
          const cleanMobile = next.mobileNumber
            ? String(next.mobileNumber).replace(/\D/g, '').slice(-10)
            : existing.mobile || '9876543210';
          const syncedAuth = {
            ...existing,
            mobile: cleanMobile,
            password: next.password || existing.password || 'farmer@123',
            fullName: next.farmerName || existing.fullName || 'Venkata Reddy',
            farmerId: next.farmerId || existing.farmerId || 'AG-FARM-5021',
            updatedAt: new Date().toISOString(),
          };
          window.localStorage.setItem('agri_farmer_auth_v1', JSON.stringify(syncedAuth));
        } catch {
          // Ignore parse errors
        }
      }
      return next;
    });
    showToast('Profile updated successfully!', 'success');
  }, [showToast, updateUserMobile]);

  // Crop CRUD Actions
  const addCrop = useCallback((newCropData) => {
    const newId = `CROP-00${Date.now().toString().slice(-4)}`;
    const crop = {
      id: newId,
      availableQuantity: Number(newCropData.harvestedQuantity || newCropData.availableQuantity || 0),
      soldQuantity: 0,
      reservedQuantity: 0,
      harvestedQuantity: Number(newCropData.harvestedQuantity || newCropData.availableQuantity || 0),
      status: 'Ready to Sell',
      color: '#237A45',
      ...newCropData,
    };

    setCrops((prev) => [crop, ...prev]);

    setStockRecords((prev) => [
      {
        id: `STK-${newId.slice(-3)}`,
        cropId: newId,
        cropName: crop.name,
        variety: crop.variety || 'Standard',
        openingStock: crop.availableQuantity,
        harvestedQuantity: crop.availableQuantity,
        soldQuantity: 0,
        reservedQuantity: 0,
        availableQuantity: crop.availableQuantity,
        unit: crop.unit || 'qtl',
        lastUpdated: new Date().toISOString().split('T')[0],
        status: crop.availableQuantity > 50 ? 'Normal' : 'Low Stock',
        storageLocation: `Reddy Farm Warehouse Bay-${(prev.length % 3) + 1}`,
      },
      ...prev,
    ]);

    showToast(`Crop "${crop.name}" registered successfully!`, 'success');
  }, [showToast]);

  const updateCrop = useCallback((id, updatedFields) => {
    setCrops((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updatedFields } : c))
    );
    showToast('Crop information updated.', 'success');
  }, [showToast]);

  const deleteCrop = useCallback((id) => {
    const crop = crops.find((c) => c.id === id);
    if (!crop) return;

    const hasActiveSales = sales.some(
      (s) => (s.cropId === id || s.cropName.toLowerCase() === crop.name.toLowerCase()) && s.transactionStatus === 'Pending Confirmation'
    );
    if (hasActiveSales) {
      showToast('Cannot delete crop with pending transactions.', 'error');
      return;
    }
    setCrops((prev) => prev.filter((c) => c.id !== id));
    setStockRecords((prev) => prev.filter((s) => !matchesCropRecord(s, id, crop.name)));
    showToast(`Crop "${crop.name}" removed from inventory.`, 'info');
  }, [crops, sales, showToast]);

  // Adjust Stock / Harvest
  const addHarvestStock = useCallback((cropIdentifier, additionalQty, unit = 'qtl') => {
    const qty = Number(additionalQty);
    if (isNaN(qty) || qty <= 0) return;

    const cropTarget = crops.find(
      (c) => c.id === cropIdentifier || c.name.toLowerCase() === String(cropIdentifier || '').trim().toLowerCase()
    );
    const cropId = cropTarget?.id || cropIdentifier;
    const cropName = cropTarget?.name || String(cropIdentifier || '').trim();

    setCrops((prev) =>
      prev.map((c) => {
        if (matchesCropRecord(c, cropId, cropName)) {
          const newHarvested = c.harvestedQuantity + qty;
          const newAvailable = c.availableQuantity + qty;
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
  }, [crops, showToast]);

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
      unreadNotificationsCount,
      markNotificationAsRead,
      markAllNotificationsAsRead,

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
      unreadNotificationsCount,
      markNotificationAsRead,
      markAllNotificationsAsRead,
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

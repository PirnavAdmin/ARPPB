import { useState, useEffect, useMemo, useCallback } from 'react';
import dayjs from 'dayjs';
import { toast } from 'sonner';
import { CustomerContext } from './context';
import {
  CUSTOMER_STORAGE_KEYS,
  CATEGORY_CATALOG,
  INITIAL_CUSTOMER_PROFILE,
  INITIAL_CART,
  INITIAL_ORDERS,
  INITIAL_PURCHASE_HISTORY,
  INITIAL_OTP_CONFIRMATIONS,
  INITIAL_NOTIFICATIONS,
} from '../data/customerData';
import { STORAGE_KEYS } from '../../../utils/constants';
import { readStorage } from '../../../services/api';
import { INITIAL_INVENTORY as VENDOR_INITIAL_INVENTORY } from '../../../data/mockInventory';
import { INITIAL_PRODUCTS as VENDOR_INITIAL_PRODUCTS } from '../../../data/mockProducts';
import { getCombinedCustomerProducts } from '../data/vendorProductAdapter';
import { useAuth } from '../../../hooks/useAuth';
import {
  fetchCustomerProfile,
  updateCustomerProfileApi,
  createCustomerAddressApi,
  updateCustomerAddressApi,
  setDefaultCustomerAddressApi,
  deleteCustomerAddressApi,
  mapCustomerDtoToProfile,
} from '../../../services/profileService';

function readStoredJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function writeStoredJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Demo persistence is optional when browser storage is unavailable.
  }
}

function clearLegacyStoredDemoOtpCodes() {
  try {
    const key = CUSTOMER_STORAGE_KEYS.CONFIRMATIONS;
    const raw = localStorage.getItem(key);
    if (!raw) return;
    const stored = JSON.parse(raw);
    if (!Array.isArray(stored)) return;
    writeStoredJson(
      key,
      stored.map(({ demoOtpCode, ...confirmation }) => confirmation)
    );
  } catch {
    // Leave malformed or unavailable legacy data untouched.
  }
}

function generateSixDigitCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function addWorkingDaysISO(startDate, workingDays = 3) {
  let cursor = dayjs(startDate || undefined);
  let remaining = workingDays;
  while (remaining > 0) {
    cursor = cursor.add(1, 'day');
    const day = cursor.day();
    if (day !== 0 && day !== 6) {
      remaining -= 1;
    }
  }
  return cursor.format('YYYY-MM-DD');
}

export function CustomerProvider({ children }) {
  const { user, token, updateUserMobile } = useAuth();
  const authKey = String(
    user?.userId || user?.entityCode || user?.fullName || user?.mobile || user?.contactNumber || ''
  );
  return (
    <CustomerProviderState
      key={authKey || 'anonymous-customer'}
      authKey={authKey}
      token={token}
      user={user}
      updateUserMobile={updateUserMobile}
    >
      {children}
    </CustomerProviderState>
  );
}

function CustomerProviderState({ children, authKey, token, user, updateUserMobile }) {
  const storageKey = (key) => (authKey ? `${key}_${encodeURIComponent(authKey)}` : key);

  useEffect(() => {
    clearLegacyStoredDemoOtpCodes();
  }, []);

  const [profile, setProfile] = useState(() => {
    const authName = user?.fullName || user?.name || '';
    const authMobile = user?.mobile || user?.contactNumber || '';
    const authEmail = user?.email || '';
    const authCustomerId = user?.entityCode || (user?.userId ? `CUS-${user.userId}` : INITIAL_CUSTOMER_PROFILE.customerId);
    const saved = readStoredJson(storageKey(CUSTOMER_STORAGE_KEYS.PROFILE), null);

    const SAMPLE_LABELS = ['Primary Warehouse', 'Godown Branch (Brodipet)'];
    const SAMPLE_DEFAULTS = {
      mobileNumber: '9876543210',
      address: 'Plot 14, Market Yard Road, Autonagar',
      district: 'Guntur',
      state: 'Andhra Pradesh',
      pinCode: '522001',
    };

    if (saved && saved.authKey === authKey && saved.fullName) {
      const savedAddresses = Array.isArray(saved.deliveryAddresses) ? saved.deliveryAddresses : [];
      const filteredAddresses = savedAddresses.filter((a) => !SAMPLE_LABELS.includes(a.label));
      const cleaned = { ...saved, deliveryAddresses: filteredAddresses };
      Object.entries(SAMPLE_DEFAULTS).forEach(([key, sampleValue]) => {
        if (cleaned[key] === sampleValue) {
          cleaned[key] = '';
        }
      });
      return cleaned;
    }

    return {
      ...INITIAL_CUSTOMER_PROFILE,
      authKey,
      customerId: authCustomerId || '',
      fullName: authName || '',
      email: authEmail || '',
      mobileNumber: authMobile || '',
    };
  });

  const customerName = user?.fullName || user?.name || profile?.fullName || 'Customer';

  const [vendorProductsRaw, setVendorProductsRaw] = useState(() =>
    readStorage(STORAGE_KEYS.PRODUCTS, VENDOR_INITIAL_PRODUCTS)
  );
  const [vendorInventoryRaw, setVendorInventoryRaw] = useState(() =>
    readStorage(STORAGE_KEYS.INVENTORY, VENDOR_INITIAL_INVENTORY)
  );

  useEffect(() => {
    const handleSync = () => {
      const latestProducts = readStorage(STORAGE_KEYS.PRODUCTS, VENDOR_INITIAL_PRODUCTS);
      setVendorProductsRaw((prev) => {
        if (JSON.stringify(prev) !== JSON.stringify(latestProducts)) {
          return latestProducts;
        }
        return prev;
      });

      const latestInventory = readStorage(STORAGE_KEYS.INVENTORY, VENDOR_INITIAL_INVENTORY);
      setVendorInventoryRaw((prev) => {
        if (JSON.stringify(prev) !== JSON.stringify(latestInventory)) {
          return latestInventory;
        }
        return prev;
      });
    };

    window.addEventListener('storage', handleSync);
    window.addEventListener('focus', handleSync);
    window.addEventListener('arppb_products_updated', handleSync);
    window.addEventListener('arppb_inventory_updated', handleSync);
    document.addEventListener('visibilitychange', handleSync);

    const interval = setInterval(handleSync, 3000);

    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('focus', handleSync);
      window.removeEventListener('arppb_products_updated', handleSync);
      window.removeEventListener('arppb_inventory_updated', handleSync);
      document.removeEventListener('visibilitychange', handleSync);
      clearInterval(interval);
    };
  }, []);

  const products = useMemo(() => {
    return getCombinedCustomerProducts(vendorProductsRaw, vendorInventoryRaw);
  }, [vendorProductsRaw, vendorInventoryRaw]);
  const [cart, setCart] = useState(() => readStoredJson(storageKey(CUSTOMER_STORAGE_KEYS.CART), INITIAL_CART));
  const [orders, setOrders] = useState(() => readStoredJson(storageKey(CUSTOMER_STORAGE_KEYS.ORDERS), INITIAL_ORDERS));
  const [purchaseHistory, setPurchaseHistory] = useState(() =>
    readStoredJson(storageKey(CUSTOMER_STORAGE_KEYS.PURCHASE_HISTORY), INITIAL_PURCHASE_HISTORY)
  );
  const [confirmations, setConfirmations] = useState(() =>
    readStoredJson(storageKey(CUSTOMER_STORAGE_KEYS.CONFIRMATIONS), INITIAL_OTP_CONFIRMATIONS)
  );
  const [notifications, setNotifications] = useState(() =>
    readStoredJson(storageKey(CUSTOMER_STORAGE_KEYS.NOTIFICATIONS), INITIAL_NOTIFICATIONS)
  );

  // Persist Customer-isolated state to localStorage
  useEffect(() => {
    writeStoredJson(storageKey(CUSTOMER_STORAGE_KEYS.PROFILE), profile);
  }, [profile, authKey]);

  useEffect(() => {
    writeStoredJson(storageKey(CUSTOMER_STORAGE_KEYS.CART), cart);
  }, [cart, authKey]);

  useEffect(() => {
    writeStoredJson(storageKey(CUSTOMER_STORAGE_KEYS.ORDERS), orders);
  }, [orders, authKey]);

  useEffect(() => {
    writeStoredJson(storageKey(CUSTOMER_STORAGE_KEYS.PURCHASE_HISTORY), purchaseHistory);
  }, [purchaseHistory, authKey]);

  useEffect(() => {
    // Demo OTP values stay in memory only; persisting them in localStorage would expose them at rest.
    writeStoredJson(
      storageKey(CUSTOMER_STORAGE_KEYS.CONFIRMATIONS),
      confirmations.map(({ demoOtpCode, ...confirmation }) => confirmation)
    );
  }, [confirmations, authKey]);

  useEffect(() => {
    writeStoredJson(storageKey(CUSTOMER_STORAGE_KEYS.NOTIFICATIONS), notifications);
  }, [notifications, authKey]);

  // Cart enriched with product records
  const cartItems = useMemo(() => {
    return cart
      .map((entry) => {
        const product = products.find((p) => p.id === entry.productId);
        if (!product) return null;
        const safeQty = Math.max(1, Math.min(Number(entry.quantity) || 1, Math.max(1, product.availableQuantity)));
        return {
          productId: product.id,
          quantity: safeQty,
          product,
          lineTotal: safeQty * product.price,
        };
      })
      .filter(Boolean);
  }, [cart, products]);

  const cartItemCount = cartItems.length;
  const cartTotalUnits = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.quantity, 0),
    [cartItems]
  );
  const cartSubtotal = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.lineTotal, 0),
    [cartItems]
  );

  // Derived Customer KPI Metrics
  const metrics = useMemo(() => {
    const totalOrders = orders.length;
    const activeOrders = orders.filter(
      (o) => o.orderStatus !== 'Completed' && o.orderStatus !== 'Cancelled'
    ).length;
    const completedOrders = orders.filter((o) => o.orderStatus === 'Completed').length;
    const totalPurchaseValue = purchaseHistory.reduce(
      (sum, row) => sum + (Number(row.totalAmount) || 0),
      0
    );
    const pendingConfirmations = confirmations.filter(
      (c) => c.otpStatus === 'Pending' || c.otpStatus === 'Sent'
    ).length;
    const unreadNotifications = notifications.filter((n) => !n.isRead).length;

    return {
      totalOrders,
      activeOrders,
      completedOrders,
      totalPurchaseValue,
      pendingConfirmations,
      unreadNotifications,
    };
  }, [orders, purchaseHistory, confirmations, notifications]);

  // Cart operations
  const addToCart = useCallback(
    (productId, requestedQty = 1) => {
      const product = products.find((p) => p.id === productId);
      if (!product || product.availableQuantity <= 0) {
        toast.error('This product is currently out of stock.');
        return false;
      }

      const qtyToAdd = Math.max(1, Number(requestedQty) || 1);
      setCart((prev) => {
        const existing = prev.find((item) => item.productId === productId);
        if (existing) {
          const nextQty = Math.min(existing.quantity + qtyToAdd, product.availableQuantity);
          return prev.map((item) =>
            item.productId === productId ? { ...item, quantity: nextQty } : item
          );
        }
        return [
          ...prev,
          { productId, quantity: Math.min(qtyToAdd, product.availableQuantity) },
        ];
      });

      toast.success(`Added ${qtyToAdd} ${product.unit} of ${product.name} to My Cart.`);
      return true;
    },
    [products]
  );

  const updateCartQuantity = useCallback(
    (productId, nextQty) => {
      const product = products.find((p) => p.id === productId);
      if (!product) return;
      const clamped = Math.max(1, Math.min(Number(nextQty) || 1, product.availableQuantity));
      setCart((prev) =>
        prev.map((item) =>
          item.productId === productId ? { ...item, quantity: clamped } : item
        )
      );
    },
    [products]
  );

  const removeFromCart = useCallback((productId) => {
    setCart((prev) => prev.filter((item) => item.productId !== productId));
    toast.info('Removed item from My Cart.');
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  // Place frontend review order from My Cart (no online payment gateway)
  const placeOrdersFromCart = useCallback(
    (deliveryAddressObj) => {
      if (cartItems.length === 0) return { success: false, orders: [] };

      const now = dayjs();
      const todayISO = now.format('YYYY-MM-DD');
      const nowDisplay = now.format('DD MMM YYYY, hh:mm A');
      const expectedDeliveryISO = now.add(4, 'day').format('YYYY-MM-DD');
      const expectedPaymentISO = addWorkingDaysISO(todayISO, 3);

      const formattedAddress = deliveryAddressObj
        ? `${deliveryAddressObj.addressLine}, ${deliveryAddressObj.district}, ${deliveryAddressObj.state} - ${deliveryAddressObj.pinCode}`
        : `${profile.address}, ${profile.district}, ${profile.state} - ${profile.pinCode}`;

      const baseSeq = 110 + orders.length + 1;
      const createdOrders = [];
      const createdOtps = [];
      const createdNotifications = [];

      cartItems.forEach((item, idx) => {
        const seq = baseSeq + idx;
        const orderId = `ORD-2026-${seq}`;
        const txnId = `TXN-2026-${910 + seq}`;
        const otpId = `OTP-CUS-${910 + seq}`;
        const otpCode = generateSixDigitCode();

        createdOrders.push({
          id: orderId,
          orderDate: todayISO,
          productId: item.product.id,
          product: item.product.name,
          category: item.product.category,
          sellerName: item.product.sellerName,
          sellerCategory: item.product.sellerCategory,
          quantity: item.quantity,
          unit: item.product.unit,
          unitPrice: item.product.price,
          totalAmount: item.lineTotal,
          orderStatus: 'New',
          expectedDeliveryDate: expectedDeliveryISO,
          expectedPaymentDate: expectedPaymentISO,
          otpId,
          transactionId: txnId,
          deliveryAddress: formattedAddress,
          batchReference: item.product.batchCode,
          timeline: [
            {
              status: 'New',
              timestamp: nowDisplay,
              note: 'Order placed via Customer Cart review. Awaiting customer OTP confirmation.',
            },
          ],
        });

        createdOtps.push({
          id: otpId,
          transactionId: txnId,
          orderId,
          sellerName: item.product.sellerName,
          sellerCategory: item.product.sellerCategory,
          receivingPartyId: profile.customerId,
          receivingPartyRole: 'Customer',
          product: item.product.name,
          quantity: `${item.quantity} ${item.product.unit}`,
          unitPrice: item.product.price,
          totalAmount: item.lineTotal,
          requestDate: now.format('YYYY-MM-DD hh:mm A'),
          otpStatus: 'Pending',
          demoOtpCode: otpCode,
          expirySecondsRemaining: 300,
          attemptsUsed: 0,
          maxAttempts: 3,
          confirmationMessage: '',
          attemptHistory: [
            {
              timestamp: nowDisplay,
              status: 'Sent',
              note: `Frontend mock 6-digit OTP issued for receiving customer ${profile.customerId}.`,
            },
          ],
        });

        createdNotifications.push(
          {
            id: `CNTF-${Date.now()}-${idx}-O`,
            type: 'Order Created',
            title: `Order ${orderId} Placed`,
            description: `Order for ${item.quantity} ${item.product.unit} ${item.product.name} created successfully.`,
            timestamp: now.format('YYYY-MM-DD hh:mm A'),
            isRead: false,
            priority: 'Medium',
            relatedId: orderId,
            targetPath: '/customer/orders',
          },
          {
            id: `CNTF-${Date.now()}-${idx}-OTP`,
            type: 'OTP Verification Required',
            title: `Confirm Purchase OTP for ${txnId}`,
            description: `Enter your 6-digit OTP in OTP Confirmations to authorize ${item.product.name}.`,
            timestamp: now.format('YYYY-MM-DD hh:mm A'),
            isRead: false,
            priority: 'High',
            relatedId: txnId,
            targetPath: '/customer/confirmations',
          }
        );
      });

      setOrders((prev) => [...createdOrders, ...prev]);
      setConfirmations((prev) => [...createdOtps, ...prev]);
      setNotifications((prev) => [...createdNotifications, ...prev]);
      setCart([]);

      toast.success(
        `${createdOrders.length} order${createdOrders.length > 1 ? 's' : ''} created! Please confirm via OTP Confirmations.`
      );

      return { success: true, orders: createdOrders, otps: createdOtps };
    },
    [cartItems, orders.length, profile]
  );

  // OTP Verification (receiving party enforced)
  const verifyOtpConfirmation = useCallback(
    (otpId, enteredOtp) => {
      const target = confirmations.find((c) => c.id === otpId);
      if (!target) {
        return { success: false, message: 'Confirmation record not found.' };
      }

      if (
        target.receivingPartyRole !== 'Customer' ||
        target.receivingPartyId !== profile.customerId
      ) {
        return {
          success: false,
          message: 'Authorization denied: Only the receiving customer may confirm this transaction.',
        };
      }

      if (target.otpStatus === 'Confirmed') {
        return { success: true, message: 'Transaction Confirmed Successfully!' };
      }

      if (target.otpStatus === 'Expired') {
        return {
          success: false,
          message: 'This OTP has expired. Please click Resend OTP to generate a new 6-digit code.',
        };
      }

      if (target.otpStatus === 'Rejected') {
        return {
          success: false,
          message: 'This transaction was rejected and can no longer be verified.',
        };
      }

      if ((target.attemptsUsed || 0) >= (target.maxAttempts || 3) || target.otpStatus === 'Failed') {
        return {
          success: false,
          message: 'Maximum verification attempts exceeded. Please resend OTP to reset verification.',
        };
      }

      const cleaned = String(enteredOtp || '').trim();
      if (!/^\d{6}$/.test(cleaned)) {
        return {
          success: false,
          message: 'Please enter a valid 6-digit numeric OTP.',
        };
      }

      const now = dayjs();
      const nowDisplay = now.format('DD MMM YYYY, hh:mm A');

      if (cleaned !== target.demoOtpCode) {
        const nextAttempts = (target.attemptsUsed || 0) + 1;
        const maxAtt = target.maxAttempts || 3;
        const exceeded = nextAttempts >= maxAtt;

        setConfirmations((prev) =>
          prev.map((c) =>
            c.id === otpId
              ? {
                  ...c,
                  attemptsUsed: nextAttempts,
                  otpStatus: exceeded ? 'Failed' : c.otpStatus,
                  attemptHistory: [
                    ...(c.attemptHistory || []),
                    {
                      timestamp: nowDisplay,
                      status: exceeded ? 'Failed' : 'Failed Attempt',
                      note: exceeded
                        ? `Incorrect OTP (${nextAttempts}/${maxAtt}). Verification locked until Resend OTP.`
                        : `Invalid 6-digit code entered (${nextAttempts}/${maxAtt} attempts used).`,
                    },
                  ],
                }
              : c
          )
        );

        return {
          success: false,
          message: exceeded
            ? `Incorrect OTP. Maximum ${maxAtt} attempts reached — click Resend OTP for a fresh code.`
            : `Incorrect OTP. ${maxAtt - nextAttempts} attempt${maxAtt - nextAttempts === 1 ? '' : 's'} remaining.`,
        };
      }

      // Valid OTP confirmation!
      const expectedPayISO = addWorkingDaysISO(now.format('YYYY-MM-DD'), 3);

      setConfirmations((prev) =>
        prev.map((c) =>
          c.id === otpId
            ? {
                ...c,
                otpStatus: 'Confirmed',
                attemptsUsed: (c.attemptsUsed || 0) + 1,
                confirmedAt: now.format('YYYY-MM-DD hh:mm A'),
                confirmationMessage: 'Transaction Confirmed Successfully!',
                attemptHistory: [
                  ...(c.attemptHistory || []),
                  {
                    timestamp: nowDisplay,
                    status: 'Confirmed',
                    note: `Confirmed via 6-digit OTP by receiving customer ${profile.fullName} (${profile.customerId}).`,
                  },
                ],
              }
            : c
        )
      );

      setOrders((prev) =>
        prev.map((ord) =>
          ord.id === target.orderId || ord.otpId === otpId
            ? {
                ...ord,
                orderStatus: ord.orderStatus === 'New' ? 'Confirmed' : ord.orderStatus,
                expectedPaymentDate: expectedPayISO,
                timeline: [
                  ...(ord.timeline || []),
                  {
                    status: 'Confirmed',
                    timestamp: nowDisplay,
                    note: 'Customer verified OTP. Payment expected within 3 working days.',
                  },
                ],
              }
            : ord
        )
      );

      setPurchaseHistory((prev) => {
        if (prev.some((p) => p.transactionId === target.transactionId)) {
          return prev;
        }
        return [
          {
            transactionId: target.transactionId,
            orderId: target.orderId || 'ORD-CUSTOM',
            purchaseDate: now.format('YYYY-MM-DD'),
            productName: target.product,
            category: 'Agri Purchase',
            sellerName: target.sellerName,
            sellerCategory: target.sellerCategory,
            quantity: target.quantity,
            unitPrice: target.unitPrice,
            totalAmount: target.totalAmount,
            expectedPaymentDate: expectedPayISO,
            status: 'Confirmed',
            location: `${profile.district}, ${profile.state}`,
            batchReference: 'OTP-VERIFIED',
          },
          ...prev,
        ];
      });

      setNotifications((prev) => [
        {
          id: `CNTF-${Date.now()}-CONF`,
          type: 'Purchase Confirmed',
          title: `Purchase Confirmed: ${target.transactionId}`,
          description: `Transaction Confirmed Successfully! Your payment is expected to be credited within 3 working days.`,
          timestamp: now.format('YYYY-MM-DD hh:mm A'),
          isRead: false,
          priority: 'Medium',
          relatedId: target.transactionId,
          targetPath: '/customer/purchase-history',
        },
        {
          id: `CNTF-${Date.now()}-ORDCONF`,
          type: 'Order Confirmed',
          title: `Order ${target.orderId || target.transactionId} Confirmed`,
          description: `Order ${target.orderId || target.transactionId} has been confirmed for packing & dispatch.`,
          timestamp: now.format('YYYY-MM-DD hh:mm A'),
          isRead: false,
          priority: 'Medium',
          relatedId: target.orderId,
          targetPath: '/customer/orders',
        },
        ...prev,
      ]);

      return {
        success: true,
        message: 'Transaction Confirmed Successfully!',
        subMessage: 'Your payment is expected to be credited within 3 working days.',
      };
    },
    [confirmations, profile]
  );

  const expireOtpConfirmation = useCallback((otpId) => {
    const nowDisplay = dayjs().format('DD MMM YYYY, hh:mm A');
    setConfirmations((prev) =>
      prev.map((c) => {
        if (c.id !== otpId || c.otpStatus === 'Confirmed' || c.otpStatus === 'Rejected' || c.otpStatus === 'Expired') {
          return c;
        }
        return {
          ...c,
          otpStatus: 'Expired',
          expirySecondsRemaining: 0,
          attemptHistory: [
            ...(c.attemptHistory || []),
            {
              timestamp: nowDisplay,
              status: 'Expired',
              note: 'OTP timer elapsed before verification. Use Resend OTP to generate a fresh code.',
            },
          ],
        };
      })
    );
  }, []);

  const resendOtpConfirmation = useCallback((otpId) => {
    const newCode = generateSixDigitCode();
    const now = dayjs();
    const nowDisplay = now.format('DD MMM YYYY, hh:mm A');

    setConfirmations((prev) =>
      prev.map((c) =>
        c.id === otpId
          ? {
              ...c,
              otpStatus: 'Pending',
              demoOtpCode: newCode,
              attemptsUsed: 0,
              expirySecondsRemaining: 300,
              requestDate: now.format('YYYY-MM-DD hh:mm A'),
              attemptHistory: [
                ...(c.attemptHistory || []),
                {
                  timestamp: nowDisplay,
                  status: 'Sent',
                  note: 'Fresh 6-digit frontend demo OTP generated & timer reset (5:00).',
                },
              ],
            }
          : c
      )
    );

    toast.success(`New demo OTP generated (${newCode}).`);
    return newCode;
  }, []);

  const rejectOtpConfirmation = useCallback(
    (otpId, reason = 'Declined by customer') => {
      const target = confirmations.find((c) => c.id === otpId);
      if (!target) return { success: false, message: 'Confirmation record not found.' };

      if (
        target.receivingPartyRole !== 'Customer' ||
        target.receivingPartyId !== profile.customerId
      ) {
        return {
          success: false,
          message: 'Authorization denied: Only the receiving customer may reject this transaction.',
        };
      }

      const nowDisplay = dayjs().format('DD MMM YYYY, hh:mm A');
      setConfirmations((prev) =>
        prev.map((c) =>
          c.id === otpId
            ? {
                ...c,
                otpStatus: 'Rejected',
                rejectionReason: reason,
                attemptHistory: [
                  ...(c.attemptHistory || []),
                  {
                    timestamp: nowDisplay,
                    status: 'Rejected',
                    note: `Purchase rejected by receiving customer: ${reason}`,
                  },
                ],
              }
            : c
        )
      );

      setOrders((prev) =>
        prev.map((ord) =>
          ord.id === target.orderId || ord.otpId === otpId
            ? {
                ...ord,
                orderStatus: 'Cancelled',
                cancellationReason: reason,
                timeline: [
                  ...(ord.timeline || []),
                  {
                    status: 'Cancelled',
                    timestamp: nowDisplay,
                    note: `Order cancelled on customer OTP rejection: ${reason}`,
                  },
                ],
              }
            : ord
        )
      );

      toast.info(`Transaction ${target.transactionId} rejected.`);
      return { success: true };
    },
    [confirmations, profile.customerId]
  );

  // Notifications
  const markNotificationRead = useCallback((id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    toast.success('All notifications marked as read.');
  }, []);

  const deleteNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  // Profile & Multiple Delivery Addresses (connected to /api/customer/profile*)
  const refreshProfile = useCallback(async () => {
    if (!token || (user?.role && user.role !== 'customer')) return null;
    try {
      const dto = await fetchCustomerProfile();
      if (dto && typeof dto === 'object') {
        setProfile((prev) => mapCustomerDtoToProfile(dto, prev, user));
        if (dto.mobileNumber) {
          updateUserMobile(dto.mobileNumber);
        }
        return dto;
      }
      return null;
    } catch {
      return null;
    }
  }, [token, user, updateUserMobile]);

  useEffect(() => {
    if (!token || user?.role !== 'customer') return;
    Promise.resolve().then(() => {
      refreshProfile();
    });
  }, [token, user?.role, authKey, refreshProfile]);

  const updateProfile = useCallback(async (updates) => {
    const mergedProfile = {
      ...profile,
      ...updates,
      customerId: profile.customerId,
    };

    setProfile(mergedProfile);
    if (updates?.mobileNumber) {
      updateUserMobile(updates.mobileNumber);
    }

    const isFullProfileSave =
      updates &&
      ('fullName' in updates ||
        'address' in updates ||
        'district' in updates ||
        'state' in updates ||
        'pinCode' in updates);

    if (token && isFullProfileSave) {
      try {
        const savedDto = await updateCustomerProfileApi(mergedProfile);
        if (savedDto && typeof savedDto === 'object') {
          setProfile((prev) => mapCustomerDtoToProfile(savedDto, prev, user));
          if (savedDto.mobileNumber) {
            updateUserMobile(savedDto.mobileNumber);
          }
        }
      } catch (err) {
        toast.error(err?.message || 'Failed to update customer profile.');
        throw err;
      }
    }

    toast.success('Customer profile updated successfully.');
  }, [profile, token, user, updateUserMobile]);

  const addDeliveryAddress = useCallback(async (newAddr) => {
    if (token) {
      try {
        const createdDto = await createCustomerAddressApi(newAddr);
        setProfile((prev) => {
          const existing = prev.deliveryAddresses || [];
          const shouldBeDefault = Boolean(createdDto?.isDefault ?? newAddr.isDefault) || existing.length === 0;
          const nextList = shouldBeDefault
            ? existing.map((a) => ({ ...a, isDefault: false }))
            : [...existing];
          const addedItem = createdDto && typeof createdDto === 'object' && createdDto.id
            ? { ...createdDto, isDefault: Boolean(createdDto.isDefault ?? shouldBeDefault) }
            : { ...newAddr, id: `ADDR-${Date.now()}`, isDefault: shouldBeDefault };
          return {
            ...prev,
            deliveryAddresses: [...nextList, addedItem],
            addresses: [...nextList, addedItem],
          };
        });
        toast.success('New delivery address added.');
        return createdDto;
      } catch (err) {
        toast.error(err?.message || 'Failed to add delivery address.');
        throw err;
      }
    }

    setProfile((prev) => {
      const existing = prev.deliveryAddresses || [];
      const addrId = `ADDR-${String(existing.length + 1).padStart(2, '0')}-${Date.now().toString().slice(-3)}`;
      const shouldBeDefault = Boolean(newAddr.isDefault) || existing.length === 0;
      const nextList = shouldBeDefault
        ? existing.map((a) => ({ ...a, isDefault: false }))
        : [...existing];
      return {
        ...prev,
        deliveryAddresses: [...nextList, { ...newAddr, id: addrId, isDefault: shouldBeDefault }],
      };
    });
    toast.success('New delivery address added.');
  }, [token]);

  const updateDeliveryAddress = useCallback(async (addrId, updates) => {
    if (token && addrId !== undefined && addrId !== null && !String(addrId).startsWith('ADDR-')) {
      try {
        const updatedDto = await updateCustomerAddressApi(addrId, updates);
        setProfile((prev) => {
          const existing = prev.deliveryAddresses || [];
          const makeDefault = Boolean(updatedDto?.isDefault ?? updates.isDefault);
          const nextList = existing.map((a) => {
            if (String(a.id) === String(addrId)) {
              return { ...a, ...updates, ...(updatedDto || {}) };
            }
            return makeDefault ? { ...a, isDefault: false } : a;
          });
          return { ...prev, deliveryAddresses: nextList, addresses: nextList };
        });
        toast.success('Delivery address updated.');
        return updatedDto;
      } catch (err) {
        toast.error(err?.message || 'Failed to update delivery address.');
        throw err;
      }
    }

    setProfile((prev) => {
      const existing = prev.deliveryAddresses || [];
      const makeDefault = Boolean(updates.isDefault);
      const nextList = existing.map((a) => {
        if (a.id === addrId) {
          return { ...a, ...updates };
        }
        return makeDefault ? { ...a, isDefault: false } : a;
      });
      return { ...prev, deliveryAddresses: nextList };
    });
    toast.success('Delivery address updated.');
  }, [token]);

  const deleteDeliveryAddress = useCallback(async (addrId) => {
    const existing = profile.deliveryAddresses || [];
    if (existing.length <= 1) {
      toast.error('At least one delivery address must be maintained.');
      return;
    }

    if (token && addrId !== undefined && addrId !== null && !String(addrId).startsWith('ADDR-')) {
      try {
        await deleteCustomerAddressApi(addrId);
      } catch (err) {
        toast.error(err?.message || 'Failed to delete delivery address.');
        return;
      }
    }

    setProfile((prev) => {
      const currentList = prev.deliveryAddresses || [];
      const remaining = currentList.filter((a) => String(a.id) !== String(addrId));
      const hasDefault = remaining.some((a) => a.isDefault);
      const normalized = hasDefault
        ? remaining
        : remaining.map((a, idx) => ({ ...a, isDefault: idx === 0 }));
      toast.info('Delivery address removed.');
      return { ...prev, deliveryAddresses: normalized, addresses: normalized };
    });
  }, [profile.deliveryAddresses, token]);

  const setDefaultDeliveryAddress = useCallback(async (addrId) => {
    if (token && addrId !== undefined && addrId !== null && !String(addrId).startsWith('ADDR-')) {
      try {
        await setDefaultCustomerAddressApi(addrId);
      } catch (err) {
        toast.error(err?.message || 'Failed to set default delivery address.');
        return;
      }
    }

    setProfile((prev) => {
      const nextList = (prev.deliveryAddresses || []).map((a) => ({
        ...a,
        isDefault: String(a.id) === String(addrId),
      }));
      return {
        ...prev,
        deliveryAddresses: nextList,
        addresses: nextList,
      };
    });
    toast.success('Default delivery address updated.');
  }, [token]);

  const resetCustomerDemoData = useCallback(() => {
    try {
      Object.values(CUSTOMER_STORAGE_KEYS).forEach((key) => {
        localStorage.removeItem(storageKey(key));
      });
    } catch {
      // Reset can still restore in-memory demo state when storage is unavailable.
    }
    setProfile({
      ...INITIAL_CUSTOMER_PROFILE,
      authKey,
      customerId: user?.entityCode || (user?.userId ? `CUS-${user.userId}` : INITIAL_CUSTOMER_PROFILE.customerId),
      fullName: user?.fullName || user?.name || 'Customer',
      email: user?.email || '',
      mobileNumber: user?.mobile || user?.contactNumber || INITIAL_CUSTOMER_PROFILE.mobileNumber,
    });
    setCart(INITIAL_CART);
    setOrders(INITIAL_ORDERS);
    setPurchaseHistory(INITIAL_PURCHASE_HISTORY);
    setConfirmations(INITIAL_OTP_CONFIRMATIONS);
    setNotifications(INITIAL_NOTIFICATIONS);
    toast.success('Customer Portal demo data restored to defaults.');
  }, [authKey, user]);

  const value = {
    profile,
    customerName,
    categories: CATEGORY_CATALOG,
    products,
    cart,
    cartItems,
    cartItemCount,
    cartTotalUnits,
    cartSubtotal,
    orders,
    purchaseHistory,
    confirmations,
    notifications,
    metrics,
    addToCart,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    placeOrdersFromCart,
    verifyOtpConfirmation,
    expireOtpConfirmation,
    resendOtpConfirmation,
    rejectOtpConfirmation,
    markNotificationRead,
    markAllNotificationsRead,
    deleteNotification,
    refreshProfile,
    updateProfile,
    addDeliveryAddress,
    updateDeliveryAddress,
    deleteDeliveryAddress,
    setDefaultDeliveryAddress,
    resetCustomerDemoData,
  };

  return <CustomerContext.Provider value={value}>{children}</CustomerContext.Provider>;
}

export default CustomerProvider;

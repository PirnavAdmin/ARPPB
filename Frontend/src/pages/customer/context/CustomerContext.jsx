import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import dayjs from 'dayjs';
import { toast } from 'sonner';
import { CustomerContext } from './context';
import {
  CUSTOMER_STORAGE_KEYS,
  CATEGORY_CATALOG,
  INITIAL_PRODUCTS,
  INITIAL_CUSTOMER_PROFILE,
  INITIAL_CART,
  INITIAL_ORDERS,
  INITIAL_PURCHASE_HISTORY,
  INITIAL_OTP_CONFIRMATIONS,
  INITIAL_NOTIFICATIONS,
} from '../data/customerData';
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
import {
  fetchMarketplaceCategories,
  fetchMarketplaceProducts,
} from '../../../services/customer/customerMarketplaceService';
import {
  fetchCustomerCart,
  addToCustomerCartApi,
  updateCustomerCartItemApi,
  removeCustomerCartItemApi,
  clearCustomerCartApi,
  checkoutCustomerCartApi,
} from '../../../services/customer/customerCartService';
import {
  fetchCustomerOrders,
} from '../../../services/customer/customerOrderService';
import {
  fetchCustomerPurchases,
} from '../../../services/customer/customerPurchaseService';
import {
  fetchCustomerConfirmations,
  verifyCustomerOtpApi,
  resendCustomerOtpApi,
  rejectCustomerOtpApi,
} from '../../../services/customer/customerConfirmationService';
import {
  fetchCustomerNotifications,
  markCustomerNotificationReadApi,
  markAllCustomerNotificationsReadApi,
  deleteCustomerNotificationApi,
} from '../../../services/customer/customerNotificationService';
import {
  fetchCustomerDashboardSummary,
} from '../../../services/customer/customerDashboardService';
import {
  mapBackendProductToUiProduct,
  mapBackendCategoryToUiCategory,
  mapBackendOrderToUiOrder,
  mapBackendPurchaseToUiPurchase,
  mapBackendConfirmationToUiConfirmation,
  mapBackendNotificationToUiNotification,
  normalizeSellerType,
  resolveProductArtwork,
} from '../data/customerDtoAdapter';

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
    // Optional persistence
  }
}

function stripOtpSecretsFromConfirmation(confirmation = {}) {
  const { activeOtpCode: _activeOtpCode, demoOtpCode: _demoOtpCode, ...safeConfirmation } = confirmation;
  return safeConfirmation;
}

function clearLegacyStoredDemoOtpCodes(userStorageKey = null) {
  const keysToClean = [CUSTOMER_STORAGE_KEYS.CONFIRMATIONS];
  if (userStorageKey && userStorageKey !== CUSTOMER_STORAGE_KEYS.CONFIRMATIONS) {
    keysToClean.push(userStorageKey);
  }

  keysToClean.forEach((key) => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return;
      const stored = JSON.parse(raw);
      if (!Array.isArray(stored)) return;
      writeStoredJson(key, stored.map(stripOtpSecretsFromConfirmation));
    } catch {
      // Leave untouched
    }
  });
}

function buildCompositeProductKey(sellerType, sellerProductId) {
  const normType = normalizeSellerType(sellerType);
  return `${normType}:${sellerProductId}`;
}

function normalizeInitialProducts(list = []) {
  return list.map((p) => {
    const sellerType = normalizeSellerType(p.sellerType, p.sellerCategory);
    const sellerProductId = p.sellerProductId ?? p.id;
    return {
      ...p,
      sellerType,
      sellerProductId,
      productKey: buildCompositeProductKey(sellerType, sellerProductId),
    };
  });
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
    clearLegacyStoredDemoOtpCodes(storageKey(CUSTOMER_STORAGE_KEYS.CONFIRMATIONS));
  }, [authKey]);

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

  // State for Marketplace Catalog
  const [categories, setCategories] = useState(CATEGORY_CATALOG);
  const [products, setProducts] = useState(() => (token ? [] : normalizeInitialProducts(INITIAL_PRODUCTS)));
  const [marketplaceLoading, setMarketplaceLoading] = useState(false);
  const [marketplaceError, setMarketplaceError] = useState('');

  // State for User Domains
  const [cart, setCart] = useState(() => readStoredJson(storageKey(CUSTOMER_STORAGE_KEYS.CART), token ? [] : INITIAL_CART));
  const [cartLoading, setCartLoading] = useState(false);
  const [cartError, setCartError] = useState('');
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');
  const checkoutIdempotencyKeyRef = useRef('');
  const [orders, setOrders] = useState(() => readStoredJson(storageKey(CUSTOMER_STORAGE_KEYS.ORDERS), token ? [] : INITIAL_ORDERS));
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState('');
  const [purchaseHistory, setPurchaseHistory] = useState(() =>
    readStoredJson(storageKey(CUSTOMER_STORAGE_KEYS.PURCHASE_HISTORY), token ? [] : INITIAL_PURCHASE_HISTORY)
  );
  const [confirmations, setConfirmations] = useState(() =>
    readStoredJson(storageKey(CUSTOMER_STORAGE_KEYS.CONFIRMATIONS), token ? [] : INITIAL_OTP_CONFIRMATIONS)
  );
  const [notifications, setNotifications] = useState(() =>
    readStoredJson(storageKey(CUSTOMER_STORAGE_KEYS.NOTIFICATIONS), token ? [] : INITIAL_NOTIFICATIONS)
  );
  const [dashboardMetrics, setDashboardMetrics] = useState(null);

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
    writeStoredJson(
      storageKey(CUSTOMER_STORAGE_KEYS.CONFIRMATIONS),
      confirmations.map(stripOtpSecretsFromConfirmation)
    );
  }, [confirmations, authKey]);

  useEffect(() => {
    writeStoredJson(storageKey(CUSTOMER_STORAGE_KEYS.NOTIFICATIONS), notifications);
  }, [notifications, authKey]);

  // Loaders from Backend API
  const userRef = useRef(user);
  userRef.current = user;
  const profileCustomerIdRef = useRef(profile.customerId);
  profileCustomerIdRef.current = profile.customerId;

  const refreshProfile = useCallback(async () => {
    const currentUser = userRef.current;
    if (!token || (currentUser?.role && currentUser.role !== 'customer')) return null;
    try {
      const dto = await fetchCustomerProfile();
      if (dto && typeof dto === 'object') {
        setProfile((prev) => mapCustomerDtoToProfile(dto, prev, userRef.current));
        if (dto.mobileNumber) {
          updateUserMobile(dto.mobileNumber);
        }
        return dto;
      }
      return null;
    } catch {
      return null;
    }
  }, [token, user?.role, updateUserMobile]);

  const loadMarketplaceData = useCallback(async () => {
    setMarketplaceLoading(true);
    setMarketplaceError('');
    try {
      const [catsRes, prodsRes] = await Promise.allSettled([
        fetchMarketplaceCategories(),
        fetchMarketplaceProducts({ page: 1, pageSize: 50 }),
      ]);

      if (catsRes.status === 'fulfilled' && Array.isArray(catsRes.value) && catsRes.value.length > 0) {
        const mappedCats = catsRes.value.map(mapBackendCategoryToUiCategory).filter(Boolean);
        const mergedCats = [...mappedCats];
        CATEGORY_CATALOG.forEach((cat) => {
          if (!mergedCats.some((c) => c.name.toLowerCase() === cat.name.toLowerCase())) {
            mergedCats.push(cat);
          }
        });
        setCategories(mergedCats);
      }

      if (prodsRes.status === 'fulfilled') {
        const rawItems = prodsRes.value?.items;
        if (Array.isArray(rawItems)) {
          const mappedProds = rawItems.map(mapBackendProductToUiProduct).filter(Boolean);
          setProducts(mappedProds);
        }
      } else if (prodsRes.status === 'rejected') {
        const errMsg = prodsRes.reason?.message || 'Failed to load marketplace products.';
        setMarketplaceError(errMsg);
        if (!token) {
          setProducts(normalizeInitialProducts(INITIAL_PRODUCTS));
        }
      }
    } catch (e) {
      setMarketplaceError(e?.message || 'Failed to load marketplace products.');
      if (!token) {
        setProducts(normalizeInitialProducts(INITIAL_PRODUCTS));
      }
    } finally {
      setMarketplaceLoading(false);
    }
  }, [token]);

  const loadCart = useCallback(async () => {
    if (!token) return;
    setCartLoading(true);
    setCartError('');
    try {
      const res = await fetchCustomerCart();
      const rawItems = Array.isArray(res?.items) ? res.items : [];
      const mappedCart = rawItems.map((item) => {
        const sellerType = normalizeSellerType(item.sellerType, item.sellerCategory);
        const sellerProductId = item.sellerProductId ?? item.productId;
        const cartKey = buildCompositeProductKey(sellerType, sellerProductId);
        return {
          cartItemId: item.cartItemId,
          cartKey,
          sellerType,
          sellerProductId,
          productId: item.productId,
          quantity: item.quantity,
          product: {
            id: item.productId ?? sellerProductId,
            sellerProductId,
            sellerType,
            productKey: cartKey,
            name: item.productName,
            category: item.category,
            price: item.unitPrice,
            unit: item.unit,
            availableQuantity: item.availableStock ?? item.availableQuantity ?? 0,
            stockStatus: item.stockStatus,
            sellerName: item.sellerName || item.vendorBusinessName || `Verified ${sellerType}`,
            vendorId: item.vendorId,
            location: item.location || '',
            image: item.imageUrl || resolveProductArtwork(item.productName, item.category),
          },
        };
      });
      setCart(mappedCart);
    } catch (e) {
      setCartError(e?.message || 'Failed to load shopping cart.');
    } finally {
      setCartLoading(false);
    }
  }, [token]);

  const loadOrders = useCallback(async () => {
    if (!token) return;
    setOrdersLoading(true);
    setOrdersError('');
    try {
      const res = await fetchCustomerOrders({ page: 1, pageSize: 50 });
      if (res?.items && Array.isArray(res.items)) {
        const mapped = res.items.map(mapBackendOrderToUiOrder).filter(Boolean);
        setOrders(mapped);
      }
    } catch (e) {
      setOrdersError(e?.message || 'Failed to load customer orders.');
    } finally {
      setOrdersLoading(false);
    }
  }, [token]);

  const loadPurchases = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetchCustomerPurchases({ page: 1, pageSize: 50 });
      if (res?.items && Array.isArray(res.items)) {
        const mapped = res.items.map(mapBackendPurchaseToUiPurchase).filter(Boolean);
        setPurchaseHistory(mapped);
      }
    } catch (e) {
      console.warn('Purchases fetch notice:', e);
    }
  }, [token]);

  const loadConfirmations = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetchCustomerConfirmations({ page: 1, pageSize: 50 });
      if (res?.items && Array.isArray(res.items)) {
        const mapped = res.items
          .map((item) => mapBackendConfirmationToUiConfirmation(item, profileCustomerIdRef.current))
          .filter(Boolean);
        setConfirmations((prev) => {
          const prevOtpMap = new Map(
            prev
              .filter(
                (c) =>
                  (c.otpStatus === 'Pending' || c.otpStatus === 'Sent') &&
                  (c.activeOtpCode || c.demoOtpCode)
              )
              .map((c) => [c.id, c.activeOtpCode || c.demoOtpCode])
          );
          return mapped.map((item) => {
            const isActiveStatus = item.otpStatus === 'Pending' || item.otpStatus === 'Sent';
            const isUnexpired = !item.expiresAt || item.expirySecondsRemaining > 0;
            if (!isActiveStatus || !isUnexpired) {
              return {
                ...item,
                activeOtpCode: '',
                demoOtpCode: '',
              };
            }
            const resolvedOtp = item.activeOtpCode || item.demoOtpCode || prevOtpMap.get(item.id) || '';
            return {
              ...item,
              activeOtpCode: resolvedOtp,
              demoOtpCode: resolvedOtp,
            };
          });
        });
      }
    } catch (e) {
      console.warn('Confirmations fetch notice:', e);
    }
  }, [token]);

  const loadNotifications = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetchCustomerNotifications({ page: 1, pageSize: 50 });
      if (res?.items && Array.isArray(res.items)) {
        const mapped = res.items.map(mapBackendNotificationToUiNotification).filter(Boolean);
        setNotifications(mapped);
      }
    } catch (e) {
      console.warn('Notifications fetch notice:', e);
    }
  }, [token]);

  const loadDashboard = useCallback(async () => {
    if (!token) return;
    try {
      const data = await fetchCustomerDashboardSummary();
      if (data && typeof data === 'object') {
        setDashboardMetrics(data);
      }
    } catch (e) {
      console.warn('Dashboard summary fetch notice:', e);
    }
  }, [token]);

  // Initial load when authenticated as customer
  useEffect(() => {
    loadMarketplaceData();
    if (!token || user?.role !== 'customer') return;

    refreshProfile();
    loadCart();
    loadOrders();
    loadPurchases();
    loadConfirmations();
    loadNotifications();
    loadDashboard();
  }, [
    token,
    user?.role,
    authKey,
    refreshProfile,
    loadMarketplaceData,
    loadCart,
    loadOrders,
    loadPurchases,
    loadConfirmations,
    loadNotifications,
    loadDashboard,
  ]);

  // Cart enriched with product records using composite (sellerType, sellerProductId) identity
  const cartItems = useMemo(() => {
    return cart
      .map((entry) => {
        const entrySellerType = normalizeSellerType(entry.sellerType, entry.product?.sellerCategory);
        const entryProductId = entry.sellerProductId ?? entry.productId;
        const entryKey = entry.cartKey || buildCompositeProductKey(entrySellerType, entryProductId);
        const product =
          products.find(
            (p) =>
              (p.productKey && p.productKey === entryKey) ||
              (normalizeSellerType(p.sellerType, p.sellerCategory) === entrySellerType &&
                String(p.sellerProductId ?? p.id) === String(entryProductId))
          ) || entry.product;
        if (!product) return null;
        const safeQty = Math.max(1, Math.min(Number(entry.quantity) || 1, Math.max(1, product.availableQuantity || 9999)));
        return {
          cartItemId: entry.cartItemId,
          cartKey: entryKey,
          sellerType: entrySellerType,
          sellerProductId: entryProductId,
          productId: product.id,
          quantity: safeQty,
          product: {
            ...product,
            sellerType: product.sellerType || entrySellerType,
            sellerName: product.sellerName || `Verified ${entrySellerType}`,
          },
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

  // Derived / Live Customer KPI Metrics
  const metrics = useMemo(() => {
    if (dashboardMetrics && typeof dashboardMetrics === 'object') {
      return {
        totalOrders: dashboardMetrics.totalOrders ?? orders.length,
        activeOrders:
          dashboardMetrics.activeOrders ??
          orders.filter((o) => o.orderStatus !== 'Completed' && o.orderStatus !== 'Cancelled').length,
        completedOrders:
          dashboardMetrics.completedOrders ??
          orders.filter((o) => o.orderStatus === 'Completed').length,
        totalPurchaseValue:
          dashboardMetrics.totalPurchaseValue ??
          purchaseHistory.reduce((sum, row) => sum + (Number(row.totalAmount) || 0), 0),
        pendingConfirmations:
          dashboardMetrics.pendingConfirmations ??
          confirmations.filter((c) => c.otpStatus === 'Pending' || c.otpStatus === 'Sent').length,
        unreadNotifications:
          dashboardMetrics.unreadNotifications ??
          notifications.filter((n) => !n.isRead).length,
      };
    }

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
  }, [dashboardMetrics, orders, purchaseHistory, confirmations, notifications]);

  // Cart operations (composite sellerType + sellerProductId identity)
  const addToCart = useCallback(
    async (productOrId, requestedQty = 1, explicitSellerType = null) => {
      const isObj = productOrId && typeof productOrId === 'object';
      const targetId = isObj ? (productOrId.sellerProductId ?? productOrId.id) : productOrId;
      const targetSellerType = isObj
        ? normalizeSellerType(productOrId.sellerType, productOrId.sellerCategory)
        : explicitSellerType
        ? normalizeSellerType(explicitSellerType)
        : null;
      const numericProductId = Number(targetId);

      const product = isObj
        ? productOrId
        : products.find((p) => {
            if (targetSellerType) {
              return (
                normalizeSellerType(p.sellerType, p.sellerCategory) === targetSellerType &&
                (Number(p.sellerProductId ?? p.id) === numericProductId || String(p.id) === String(targetId))
              );
            }
            return Number(p.id) === numericProductId || p.id === targetId;
          });

      if (!product || product.availableQuantity <= 0) {
        toast.error('This product is currently out of stock.');
        return false;
      }

      const resolvedSellerType = normalizeSellerType(product.sellerType, product.sellerCategory);
      const resolvedProductId = product.sellerProductId ?? product.id;
      const resolvedCartKey = buildCompositeProductKey(resolvedSellerType, resolvedProductId);
      const qtyToAdd = Math.max(1, Number(requestedQty) || 1);

      // Reset pending checkout idempotency key when cart mutates
      checkoutIdempotencyKeyRef.current = '';
      setCartError('');

      if (token) {
        if (resolvedSellerType !== 'Vendor') {
          const msg = `${resolvedSellerType} cart integration requires backend Option B cart API support.`;
          setCartError(msg);
          toast.error(msg);
          return false;
        }
        if (!isNaN(Number(resolvedProductId)) && Number(resolvedProductId) > 0) {
          try {
            await addToCustomerCartApi(Number(resolvedProductId), qtyToAdd);
            await loadCart();
            toast.success(`Added ${qtyToAdd} ${product.unit} of ${product.name} to My Cart.`);
            return true;
          } catch (err) {
            const errMsg = err?.message || 'Failed to add product to cart.';
            setCartError(errMsg);
            toast.error(errMsg);
            return false;
          }
        }
      }

      // Unauthenticated preview mode only
      setCart((prev) => {
        const existing = prev.find(
          (item) =>
            (item.cartKey && item.cartKey === resolvedCartKey) ||
            (normalizeSellerType(item.sellerType, item.product?.sellerCategory) === resolvedSellerType &&
              String(item.sellerProductId ?? item.productId) === String(resolvedProductId))
        );
        if (existing) {
          const nextQty = Math.min(existing.quantity + qtyToAdd, product.availableQuantity);
          return prev.map((item) =>
            (item.cartKey && item.cartKey === resolvedCartKey) ||
            (normalizeSellerType(item.sellerType, item.product?.sellerCategory) === resolvedSellerType &&
              String(item.sellerProductId ?? item.productId) === String(resolvedProductId))
              ? { ...item, quantity: nextQty }
              : item
          );
        }
        return [
          ...prev,
          {
            cartKey: resolvedCartKey,
            sellerType: resolvedSellerType,
            sellerProductId: resolvedProductId,
            productId: resolvedProductId,
            quantity: Math.min(qtyToAdd, product.availableQuantity),
            product,
          },
        ];
      });

      toast.success(`Added ${qtyToAdd} ${product.unit} of ${product.name} to My Cart (Preview).`);
      return true;
    },
    [products, token, loadCart]
  );

  const updateCartQuantity = useCallback(
    async (cartKeyOrProductId, nextQty) => {
      const existingCartEntry = cart.find(
        (item) =>
          item.cartKey === cartKeyOrProductId ||
          String(item.cartItemId) === String(cartKeyOrProductId) ||
          String(item.productId) === String(cartKeyOrProductId)
      );
      if (!existingCartEntry) return;

      const entrySellerType = normalizeSellerType(existingCartEntry.sellerType, existingCartEntry.product?.sellerCategory);
      const entryProductId = existingCartEntry.sellerProductId ?? existingCartEntry.productId;
      const product =
        products.find(
          (p) =>
            (p.productKey && p.productKey === existingCartEntry.cartKey) ||
            (normalizeSellerType(p.sellerType, p.sellerCategory) === entrySellerType &&
              String(p.sellerProductId ?? p.id) === String(entryProductId))
        ) || existingCartEntry.product;

      if (!product) return;
      const clamped = Math.max(1, Math.min(Number(nextQty) || 1, product.availableQuantity));

      checkoutIdempotencyKeyRef.current = '';
      setCartError('');

      if (token && existingCartEntry?.cartItemId) {
        try {
          await updateCustomerCartItemApi(existingCartEntry.cartItemId, clamped);
          await loadCart();
          return;
        } catch (err) {
          const errMsg = err?.message || 'Failed to update cart item quantity.';
          setCartError(errMsg);
          toast.error(errMsg);
          return;
        }
      }

      if (token) return;

      setCart((prev) =>
        prev.map((item) =>
          (item.cartKey && item.cartKey === existingCartEntry.cartKey) ||
          String(item.productId) === String(cartKeyOrProductId)
            ? { ...item, quantity: clamped }
            : item
        )
      );
    },
    [products, cart, token, loadCart]
  );

  const removeFromCart = useCallback(
    async (cartKeyOrProductId) => {
      const existingCartEntry = cart.find(
        (item) =>
          item.cartKey === cartKeyOrProductId ||
          String(item.cartItemId) === String(cartKeyOrProductId) ||
          String(item.productId) === String(cartKeyOrProductId)
      );
      if (!existingCartEntry) return;

      checkoutIdempotencyKeyRef.current = '';
      setCartError('');

      if (token && existingCartEntry?.cartItemId) {
        try {
          await removeCustomerCartItemApi(existingCartEntry.cartItemId);
          await loadCart();
          toast.info('Removed item from My Cart.');
          return;
        } catch (err) {
          const errMsg = err?.message || 'Failed to remove item from cart.';
          setCartError(errMsg);
          toast.error(errMsg);
          return;
        }
      }

      if (token) return;

      setCart((prev) =>
        prev.filter(
          (item) =>
            !(
              (item.cartKey && existingCartEntry.cartKey && item.cartKey === existingCartEntry.cartKey) ||
              String(item.productId) === String(cartKeyOrProductId)
            )
        )
      );
      toast.info('Removed item from My Cart.');
    },
    [cart, token, loadCart]
  );

  const clearCart = useCallback(async () => {
    checkoutIdempotencyKeyRef.current = '';
    setCartError('');
    if (token) {
      try {
        await clearCustomerCartApi();
        await loadCart();
        return;
      } catch (err) {
        const errMsg = err?.message || 'Failed to clear cart.';
        setCartError(errMsg);
        toast.error(errMsg);
        return;
      }
    }
    setCart([]);
  }, [token, loadCart]);

  // Place order from My Cart (Real backend checkout only — never fabricate orders or OTPs)
  const placeOrdersFromCart = useCallback(
    async (deliveryAddressObj) => {
      if (cartItems.length === 0) return { success: false, error: 'Your cart is empty.', orders: [] };
      setCheckoutError('');

      if (!token) {
        const msg = 'Please sign in as a Customer to submit an order.';
        setCheckoutError(msg);
        toast.error(msg);
        return { success: false, error: msg, orders: [] };
      }

      const formattedAddress = deliveryAddressObj
        ? `${deliveryAddressObj.addressLine || ''}, ${deliveryAddressObj.district || ''}, ${deliveryAddressObj.state || ''} - ${deliveryAddressObj.pinCode || ''}`.replace(/^[\s,]+|[\s,]+$/g, '')
        : `${profile.address || ''}, ${profile.district || ''}, ${profile.state || ''} - ${profile.pinCode || ''}`.replace(/^[\s,]+|[\s,]+$/g, '');

      if (!checkoutIdempotencyKeyRef.current) {
        checkoutIdempotencyKeyRef.current =
          typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
            ? crypto.randomUUID()
            : `IDEM-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
      }

      setCheckoutLoading(true);
      try {
        const checkoutRes = await checkoutCustomerCartApi({
          deliveryAddressId: typeof deliveryAddressObj?.id === 'number' ? deliveryAddressObj.id : null,
          deliveryAddress: formattedAddress,
          paymentTerms: 'Credit - 3 Working Days',
          idempotencyKey: checkoutIdempotencyKeyRef.current,
        });

        if (checkoutRes && (checkoutRes.orders?.length > 0 || checkoutRes.totalOrdersCreated > 0)) {
          checkoutIdempotencyKeyRef.current = '';
          await Promise.allSettled([
            loadOrders(),
            loadConfirmations(),
            loadPurchases(),
            loadNotifications(),
            loadDashboard(),
            loadCart(),
          ]);

          const createdOrders = (checkoutRes.orders || []).map(mapBackendOrderToUiOrder).filter(Boolean);
          const createdOtps = (checkoutRes.otps || [])
            .map((o) => mapBackendConfirmationToUiConfirmation(o, profile.customerId))
            .filter(Boolean);

          if (createdOtps.length > 0) {
            setConfirmations((prev) => {
              const map = new Map();
              createdOtps.forEach((item) => map.set(item.id, item));
              prev.forEach((item) => {
                if (!map.has(item.id)) map.set(item.id, item);
              });
              return Array.from(map.values());
            });
          }

          toast.success(
            `${createdOrders.length || 1} order${createdOrders.length > 1 ? 's' : ''} created! Please confirm via OTP Confirmations.`
          );

          return { success: true, orders: createdOrders, otps: createdOtps };
        }

        const emptyMsg = 'Checkout did not return any created orders. Your cart has been preserved.';
        setCheckoutError(emptyMsg);
        toast.error(emptyMsg);
        return { success: false, error: emptyMsg, orders: [] };
      } catch (err) {
        const errMsg = err?.message || 'Checkout failed. Your cart has been preserved.';
        setCheckoutError(errMsg);
        toast.error(errMsg);
        return { success: false, error: errMsg, orders: [] };
      } finally {
        setCheckoutLoading(false);
      }
    },
    [cartItems.length, profile, token, loadOrders, loadConfirmations, loadPurchases, loadNotifications, loadDashboard, loadCart]
  );

  // OTP Verification (receiving party enforced + backend integration)
  const verifyOtpConfirmation = useCallback(
    async (otpId, enteredOtp) => {
      const target = confirmations.find(
        (c) => c.id === otpId || c.rawId === otpId || c.confirmationCode === otpId
      );
      if (!target) {
        return { success: false, message: 'Confirmation record not found.' };
      }

      if (
        target.receivingPartyRole !== 'Customer' ||
        (target.receivingPartyId && profile.customerId && target.receivingPartyId !== profile.customerId)
      ) {
        return {
          success: false,
          message: 'Authorization denied: Only the receiving customer may confirm this transaction.',
        };
      }

      if (target.otpStatus === 'Confirmed' || target.otpStatus === 'Verified') {
        return { success: true, message: 'Transaction Confirmed Successfully!' };
      }

      const cleaned = String(enteredOtp || '').trim();
      if (!/^\d{6}$/.test(cleaned)) {
        return {
          success: false,
          message: 'Please enter a valid 6-digit numeric OTP.',
        };
      }

      const confirmationId = target.rawId || (typeof target.id === 'number' ? target.id : parseInt(String(target.id).replace(/\D/g, ''), 10));

      if (token && confirmationId) {
        try {
          const res = await verifyCustomerOtpApi(confirmationId, cleaned);
          await Promise.allSettled([
            loadConfirmations(),
            loadOrders(),
            loadPurchases(),
            loadDashboard(),
          ]);
          toast.success(res?.message || 'Transaction Confirmed Successfully!');
          return {
            success: true,
            message: res?.message || 'Transaction Confirmed Successfully!',
            subMessage: 'Your payment is expected to be credited within 3 working days.',
          };
        } catch (err) {
          await loadConfirmations().catch(() => {});
          return {
            success: false,
            message: err.message || 'OTP verification failed.',
          };
        }
      }

      return {
        success: false,
        message: 'Authentication required to verify OTP.',
      };
    },
    [confirmations, profile.customerId, token, loadConfirmations, loadOrders, loadPurchases, loadDashboard]
  );

  const expireOtpConfirmation = useCallback((otpId) => {
    const nowDisplay = dayjs().format('DD MMM YYYY, hh:mm A');
    setConfirmations((prev) =>
      prev.map((c) => {
        if (
          c.id !== otpId ||
          c.otpStatus === 'Confirmed' ||
          c.otpStatus === 'Verified' ||
          c.otpStatus === 'Rejected' ||
          c.otpStatus === 'Expired'
        ) {
          return c;
        }
        return {
          ...c,
          otpStatus: 'Expired',
          activeOtpCode: '',
          demoOtpCode: '',
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

  const resendOtpConfirmation = useCallback(
    async (otpId) => {
      const target = confirmations.find(
        (c) => c.id === otpId || c.rawId === otpId || c.confirmationCode === otpId
      );
      if (!target) return '';

      const confirmationId = target.rawId || (typeof target.id === 'number' ? target.id : parseInt(String(target.id).replace(/\D/g, ''), 10));

      if (token && confirmationId) {
        try {
          const res = await resendCustomerOtpApi(confirmationId);
          await loadConfirmations();
          const newCode = res?.activeOtpCode || res?.demoOtpCode || res?.devOtp || res?.otp || '';
          if (newCode) {
            setConfirmations((prev) =>
              prev.map((c) =>
                c.id === target.id || c.rawId === confirmationId || c.confirmationCode === target.confirmationCode
                  ? {
                      ...c,
                      activeOtpCode: newCode,
                      demoOtpCode: newCode,
                      otpStatus: 'Pending',
                      expirySecondsRemaining: 600,
                    }
                  : c
              )
            );
          }
          toast.success(res?.message || 'Fresh OTP generated by server.');
          return newCode;
        } catch (err) {
          toast.error(err.message || 'Failed to resend OTP.');
          return '';
        }
      }

      toast.error('Authentication required to resend OTP.');
      return '';
    },
    [confirmations, token, loadConfirmations]
  );

  const rejectOtpConfirmation = useCallback(
    async (otpId, reason = 'Declined by customer') => {
      const target = confirmations.find(
        (c) => c.id === otpId || c.rawId === otpId || c.confirmationCode === otpId
      );
      if (!target) return { success: false, message: 'Confirmation record not found.' };

      if (
        target.receivingPartyRole !== 'Customer' ||
        (target.receivingPartyId && profile.customerId && target.receivingPartyId !== profile.customerId)
      ) {
        return {
          success: false,
          message: 'Authorization denied: Only the receiving customer may reject this transaction.',
        };
      }

      const confirmationId = target.rawId || (typeof target.id === 'number' ? target.id : parseInt(String(target.id).replace(/\D/g, ''), 10));

      if (token && confirmationId) {
        try {
          const res = await rejectCustomerOtpApi(confirmationId, reason);
          await Promise.allSettled([
            loadConfirmations(),
            loadOrders(),
            loadDashboard(),
          ]);
          toast.info(res?.message || `Transaction ${target.transactionId} rejected.`);
          return { success: true };
        } catch (err) {
          toast.error(err.message || 'Failed to reject confirmation.');
          return { success: false, message: err.message };
        }
      }

      return { success: false, message: 'Authentication required to reject confirmation.' };
    },
    [confirmations, profile.customerId, token, loadConfirmations, loadOrders, loadDashboard]
  );

  // Notifications
  const markNotificationRead = useCallback(
    async (id) => {
      if (token && typeof id === 'number') {
        try {
          await markCustomerNotificationReadApi(id);
        } catch (err) {
          console.warn('Backend markRead notice:', err);
        }
      }
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    },
    [token]
  );

  const markAllNotificationsRead = useCallback(async () => {
    if (token) {
      try {
        await markAllCustomerNotificationsReadApi();
      } catch (err) {
        console.warn('Backend readAll notice:', err);
      }
    }
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    toast.success('All notifications marked as read.');
  }, [token]);

  const deleteNotification = useCallback(
    async (id) => {
      if (token && typeof id === 'number') {
        try {
          await deleteCustomerNotificationApi(id);
        } catch (err) {
          console.warn('Backend deleteNotification notice:', err);
        }
      }
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    },
    [token]
  );

  // Profile & Delivery Addresses
  const updateProfile = useCallback(
    async (updates) => {
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
    },
    [profile, token, user, updateUserMobile]
  );

  const addDeliveryAddress = useCallback(
    async (newAddr) => {
      if (token) {
        try {
          const createdDto = await createCustomerAddressApi(newAddr);
          setProfile((prev) => {
            const existing = prev.deliveryAddresses || [];
            const shouldBeDefault = Boolean(createdDto?.isDefault ?? newAddr.isDefault) || existing.length === 0;
            const nextList = shouldBeDefault
              ? existing.map((a) => ({ ...a, isDefault: false }))
              : [...existing];
            const addedItem =
              createdDto && typeof createdDto === 'object' && createdDto.id
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
    },
    [token]
  );

  const updateDeliveryAddress = useCallback(
    async (addrId, updates) => {
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
    },
    [token]
  );

  const deleteDeliveryAddress = useCallback(
    async (addrId) => {
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
    },
    [profile.deliveryAddresses, token]
  );

  const setDefaultDeliveryAddress = useCallback(
    async (addrId) => {
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
    },
    [token]
  );

  const resetCustomerDemoData = useCallback(() => {
    try {
      Object.values(CUSTOMER_STORAGE_KEYS).forEach((key) => {
        localStorage.removeItem(storageKey(key));
      });
    } catch {
      // Ignore storage errors
    }
    setProfile({
      ...INITIAL_CUSTOMER_PROFILE,
      authKey,
      customerId: user?.entityCode || (user?.userId ? `CUS-${user.userId}` : INITIAL_CUSTOMER_PROFILE.customerId),
      fullName: user?.fullName || user?.name || 'Customer',
      email: user?.email || '',
      mobileNumber: user?.mobile || user?.contactNumber || INITIAL_CUSTOMER_PROFILE.mobileNumber,
    });
    setCategories(CATEGORY_CATALOG);
    setProducts(INITIAL_PRODUCTS);
    setCart(INITIAL_CART);
    setOrders(INITIAL_ORDERS);
    setPurchaseHistory(INITIAL_PURCHASE_HISTORY);
    setConfirmations(INITIAL_OTP_CONFIRMATIONS);
    setNotifications(INITIAL_NOTIFICATIONS);
    setDashboardMetrics(null);
    toast.success('Customer Portal demo data restored to defaults.');
  }, [authKey, user]);

  const value = {
    profile,
    customerName,
    categories,
    products,
    marketplaceLoading,
    marketplaceError,
    loadMarketplaceData,
    cart,
    cartItems,
    cartItemCount,
    cartTotalUnits,
    cartSubtotal,
    cartLoading,
    cartError,
    loadCart,
    checkoutLoading,
    checkoutError,
    orders,
    ordersLoading,
    ordersError,
    loadOrders,
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

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { CustomerContext } from './context';
import { useAuth } from '../../../hooks/useAuth';
import { customerApi } from '../../../services/customerApi';
import {
  fetchCustomerProfile,
  updateCustomerProfileApi,
  createCustomerAddressApi,
  updateCustomerAddressApi,
  setDefaultCustomerAddressApi,
  deleteCustomerAddressApi,
  mapCustomerDtoToProfile,
} from '../../../services/profileService';
import { CATEGORY_CATALOG } from '../data/customerData';

const EMPTY_PROFILE = {
  customerId: '',
  fullName: '',
  mobileNumber: '',
  email: '',
  profilePhoto: '',
  alternateMobileNumber: '',
  address: '',
  district: '',
  state: '',
  pinCode: '',
  deliveryAddresses: [],
  addresses: [],
};

const EMPTY_METRICS = {
  totalOrders: 0,
  activeOrders: 0,
  completedOrders: 0,
  totalPurchaseValue: 0,
  pendingConfirmations: 0,
  cartItemCount: 0,
  unreadNotifications: 0,
};

function mapProduct(dto = {}) {
  return {
    ...dto,
    id: dto.id,
    batchCode: dto.batchCode,
    name: dto.name,
    category: dto.category,
    availableQuantity: dto.availableQuantity,
    unit: dto.unit,
    price: dto.price,
    stockStatus: dto.stockStatus,
    image: dto.image,
    vendorId: dto.vendorId,
    sellerName: dto.sellerName,
    district: dto.district,
    state: dto.state,
    location: dto.location,
    addedDate: dto.createdAt,
  };
}

function mapCategory(dto = {}) {
  const visual = CATEGORY_CATALOG.find(
    (item) => item.name.toLowerCase() === String(dto.category || '').toLowerCase()
  );
  return {
    id: visual?.id || dto.category,
    name: dto.category,
    category: dto.category,
    productCount: dto.productCount,
    image: visual?.image,
  };
}

function mapOrder(dto = {}) {
  const orderCode = dto.orderId || dto.id;
  return {
    ...dto,
    id: String(orderCode ?? ''),
    backendId: dto.id,
    orderId: orderCode,
    product: dto.product || dto.items?.map((item) => item.productName).filter(Boolean).join(', ') || '',
    totalAmount: dto.totalAmount ?? dto.itemsSubtotal,
    batchReference: dto.batchReference,
  };
}

function mapPurchase(dto = {}) {
  return { ...dto, id: dto.id, purchaseDate: dto.purchaseDate };
}

function mapNotification(dto = {}) {
  return { ...dto, timestamp: dto.createdAt };
}

function mapConfirmation(dto = {}, profile = {}) {
  const expiresAtMs = dto.expiresAt ? new Date(dto.expiresAt).getTime() : NaN;
  return {
    ...dto,
    id: String(dto.id ?? ''),
    quantity: [dto.quantity, dto.unit].filter((value) => value !== null && value !== undefined && value !== '').join(' '),
    receivingPartyId: profile.customerId,
    receivingPartyRole: 'Customer',
    attemptsRemaining:
      Number.isFinite(dto.maxAttempts) && Number.isFinite(dto.attemptsUsed)
        ? Math.max(0, dto.maxAttempts - dto.attemptsUsed)
        : undefined,
    expirySecondsRemaining: Number.isFinite(expiresAtMs)
      ? Math.max(0, Math.ceil((expiresAtMs - Date.now()) / 1000))
      : 0,
    attemptHistory: Array.isArray(dto.auditHistory) ? dto.auditHistory : [],
  };
}

function mapCart(dto = {}) {
  const items = Array.isArray(dto.items) ? dto.items : [];
  return {
    ...dto,
    items: items.map((item) => ({
      ...item,
      product: {
        id: item.productId,
        name: item.productName,
        category: item.category,
        batchCode: item.productCode,
        unit: item.unit,
        price: item.unitPrice,
        availableQuantity: item.availableStock,
        image: item.imageUrl,
        location: '',
        state: '',
      },
      lineTotal: item.lineTotal,
    })),
  };
}

function formatAddress(address) {
  return [address?.addressLine, address?.district, address?.state, address?.pinCode]
    .filter(Boolean)
    .join(', ');
}

function createIdempotencyKey() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function reportError(error, fallback) {
  toast.error(error?.message || fallback);
}

export function CustomerProvider({ children }) {
  const { user, token, updateUserMobile } = useAuth();
  const authKey = String(user?.userId || user?.entityCode || user?.mobile || user?.contactNumber || '');
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
  const [profile, setProfile] = useState(EMPTY_PROFILE);
  const [dashboardSummary, setDashboardSummary] = useState(EMPTY_METRICS);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState({ items: [] });
  const [orders, setOrders] = useState([]);
  const [purchaseHistory, setPurchaseHistory] = useState([]);
  const [confirmations, setConfirmations] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [purchaseSummary, setPurchaseSummary] = useState(null);
  const [notificationSummary, setNotificationSummary] = useState(null);
  const checkoutInFlight = useRef(false);
  const profileUser = user || null;
  const customerRole = user?.role === 'customer';

  const ensureSession = useCallback(() => {
    if (!token || !customerRole) {
      throw new Error('Sign in with a customer account to load portal data.');
    }
  }, [token, customerRole]);

  const refreshDashboard = useCallback(async () => {
    try {
      ensureSession();
      const summary = await customerApi.dashboardSummary();
      setDashboardSummary(summary || EMPTY_METRICS);
      return summary;
    } catch (error) {
      setDashboardSummary(EMPTY_METRICS);
      reportError(error, 'Unable to load customer dashboard.');
      throw error;
    }
  }, [ensureSession]);

  const refreshCategories = useCallback(async () => {
    try {
      ensureSession();
      const result = await customerApi.categories();
      setCategories((Array.isArray(result) ? result : []).map(mapCategory));
      return result;
    } catch (error) {
      setCategories([]);
      reportError(error, 'Unable to load product categories.');
      throw error;
    }
  }, [ensureSession]);

  const refreshProducts = useCallback(async () => {
    try {
      ensureSession();
      const result = await customerApi.allProducts();
      setProducts(result.map(mapProduct));
      return result;
    } catch (error) {
      setProducts([]);
      reportError(error, 'Unable to load marketplace products.');
      throw error;
    }
  }, [ensureSession]);

  const refreshCart = useCallback(async () => {
    try {
      ensureSession();
      const result = await customerApi.cart();
      const next = mapCart(result || {});
      setCart(next);
      return next;
    } catch (error) {
      setCart({ items: [] });
      reportError(error, 'Unable to load your cart.');
      throw error;
    }
  }, [ensureSession]);

  const refreshOrders = useCallback(async () => {
    try {
      ensureSession();
      const result = await customerApi.allOrders({ SortBy: 'orderDate', SortOrder: 'desc' });
      const rows = result.map(mapOrder);
      setOrders(rows);
      return rows;
    } catch (error) {
      setOrders([]);
      reportError(error, 'Unable to load customer orders.');
      throw error;
    }
  }, [ensureSession]);

  const refreshPurchaseHistory = useCallback(async () => {
    try {
      ensureSession();
      const [rows, summary] = await Promise.all([
        customerApi.allPurchases({ SortBy: 'purchaseDate', SortOrder: 'desc' }),
        customerApi.purchaseSummary(),
      ]);
      setPurchaseHistory(rows.map(mapPurchase));
      setPurchaseSummary(summary || null);
      return rows;
    } catch (error) {
      setPurchaseHistory([]);
      setPurchaseSummary(null);
      reportError(error, 'Unable to load purchase history.');
      throw error;
    }
  }, [ensureSession]);

  const refreshConfirmations = useCallback(async () => {
    try {
      ensureSession();
      const result = await customerApi.allConfirmations({ SortBy: 'requestDate', SortOrder: 'desc' });
      const rows = result.map((item) => mapConfirmation(item, profile));
      setConfirmations(rows);
      return rows;
    } catch (error) {
      setConfirmations([]);
      reportError(error, 'Unable to load OTP confirmations.');
      throw error;
    }
  }, [ensureSession, profile]);

  const refreshNotifications = useCallback(async () => {
    try {
      ensureSession();
      const [rows, summary] = await Promise.all([
        customerApi.allNotifications({ SortBy: 'createdAt', SortOrder: 'desc' }),
        customerApi.notificationSummary(),
      ]);
      setNotifications(rows.map(mapNotification));
      setNotificationSummary(summary || null);
      return rows;
    } catch (error) {
      setNotifications([]);
      setNotificationSummary(null);
      reportError(error, 'Unable to load customer notifications.');
      throw error;
    }
  }, [ensureSession]);

  const refreshProfile = useCallback(async () => {
    try {
      ensureSession();
      const dto = await fetchCustomerProfile();
      setProfile(mapCustomerDtoToProfile(dto, EMPTY_PROFILE, profileUser));
      if (dto?.mobileNumber) updateUserMobile(dto.mobileNumber);
      return dto;
    } catch (error) {
      setProfile(EMPTY_PROFILE);
      reportError(error, 'Unable to load customer profile.');
      throw error;
    }
  }, [ensureSession, profileUser, updateUserMobile]);

  const refreshAll = useCallback(async () => {
    setLoading(true);
    const jobs = [
      refreshDashboard,
      refreshCategories,
      refreshProducts,
      refreshCart,
      refreshOrders,
      refreshPurchaseHistory,
      refreshConfirmations,
      refreshNotifications,
      refreshProfile,
    ];
    await Promise.allSettled(jobs.map((load) => load()));
    setLoading(false);
  }, [refreshDashboard, refreshCategories, refreshProducts, refreshCart, refreshOrders, refreshPurchaseHistory, refreshConfirmations, refreshNotifications, refreshProfile]);

  useEffect(() => {
    let active = true;
    if (!token || !customerRole) {
      setProfile(EMPTY_PROFILE);
      setDashboardSummary(EMPTY_METRICS);
      setCategories([]);
      setProducts([]);
      setCart({ items: [] });
      setOrders([]);
      setPurchaseHistory([]);
      setConfirmations([]);
      setNotifications([]);
      setLoading(false);
      return undefined;
    }
    setLoading(true);
    const jobs = [
      refreshDashboard,
      refreshCategories,
      refreshProducts,
      refreshCart,
      refreshOrders,
      refreshPurchaseHistory,
      refreshConfirmations,
      refreshNotifications,
      refreshProfile,
    ];
    Promise.allSettled(jobs.map((load) => load())).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [token, authKey, customerRole, refreshDashboard, refreshCategories, refreshProducts, refreshCart, refreshOrders, refreshPurchaseHistory, refreshConfirmations, refreshNotifications, refreshProfile]);

  const fetchProductDetails = useCallback(async (id) => {
    try {
      return mapProduct(await customerApi.product(id));
    } catch (error) {
      reportError(error, 'Unable to load product details.');
      return null;
    }
  }, []);

  const fetchOrderDetails = useCallback(async (id) => {
    try {
      return mapOrder(await customerApi.order(id));
    } catch (error) {
      reportError(error, 'Unable to load order details.');
      return null;
    }
  }, []);

  const fetchPurchaseDetails = useCallback(async (id) => {
    try {
      return mapPurchase(await customerApi.purchase(id));
    } catch (error) {
      reportError(error, 'Unable to load purchase details.');
      return null;
    }
  }, []);

  const fetchConfirmationDetails = useCallback(async (id) => {
    try {
      const result = await customerApi.confirmation(id);
      const mapped = mapConfirmation(result, profile);
      setConfirmations((current) => current.map((item) => item.id === mapped.id ? { ...item, ...mapped } : item));
      return mapped;
    } catch (error) {
      reportError(error, 'Unable to load confirmation details.');
      return null;
    }
  }, [profile]);

  const addToCart = useCallback(async (productId, quantity = 1) => {
    try {
      const next = await customerApi.addCartItem({ productId: Number(productId), quantity: Number(quantity) });
      setCart(mapCart(next || {}));
      await refreshDashboard();
      toast.success('Product added to your server cart.');
      return true;
    } catch (error) {
      reportError(error, 'Unable to add this product to your cart.');
      return false;
    }
  }, [refreshDashboard]);

  const updateCartQuantity = useCallback(async (productId, quantity) => {
    const item = cart.items.find((entry) => String(entry.productId) === String(productId));
    if (!item) return false;
    try {
      setCart(mapCart(await customerApi.updateCartItem(item.cartItemId, { quantity: Number(quantity) })));
      await refreshDashboard();
      return true;
    } catch (error) {
      reportError(error, 'Unable to update your cart.');
      return false;
    }
  }, [cart, refreshDashboard]);

  const removeFromCart = useCallback(async (productId) => {
    const item = cart.items.find((entry) => String(entry.productId) === String(productId));
    if (!item) return false;
    try {
      setCart(mapCart(await customerApi.removeCartItem(item.cartItemId)));
      await refreshDashboard();
      toast.info('Item removed from cart.');
      return true;
    } catch (error) {
      reportError(error, 'Unable to remove this item from your cart.');
      return false;
    }
  }, [cart, refreshDashboard]);

  const clearCart = useCallback(async () => {
    try {
      setCart(mapCart(await customerApi.clearCart()));
      await refreshDashboard();
      return true;
    } catch (error) {
      reportError(error, 'Unable to clear your cart.');
      return false;
    }
  }, [refreshDashboard]);

  const placeOrdersFromCart = useCallback(async (address) => {
    if (checkoutInFlight.current) return { success: false, message: 'Checkout is already processing.' };
    if (!address) return { success: false, message: 'Select a saved delivery address before checkout.' };
    checkoutInFlight.current = true;
    try {
      const numericAddressId = Number(address.id);
      const result = await customerApi.checkout({
        deliveryAddressId: Number.isInteger(numericAddressId) ? numericAddressId : null,
        deliveryAddress: formatAddress(address),
        idempotencyKey: createIdempotencyKey(),
      });
      const ordersCreated = Array.isArray(result?.orders) ? result.orders.map(mapOrder) : [];
      const otps = Array.isArray(result?.otps)
        ? result.otps.map((item) => mapConfirmation({
            ...item,
            id: item.confirmationId,
            requestDate: new Date().toISOString(),
            quantity: item.quantity,
            unit: item.unit,
            otpStatus: item.otpStatus,
          }, profile))
        : [];
      await Promise.allSettled([
        refreshCart(), refreshDashboard(), refreshOrders(), refreshConfirmations(), refreshNotifications(), refreshPurchaseHistory(),
      ]);
      toast.success(result?.message || 'Checkout completed.');
      return {
        success: true,
        orders: ordersCreated,
        otps,
        totalAmount: result?.totalAmount,
      };
    } catch (error) {
      reportError(error, 'Checkout failed.');
      return { success: false, message: error.message };
    } finally {
      checkoutInFlight.current = false;
    }
  }, [profile, refreshCart, refreshDashboard, refreshOrders, refreshConfirmations, refreshNotifications, refreshPurchaseHistory]);

  const verifyOtpConfirmation = useCallback(async (id, otpCode) => {
    try {
      const result = await customerApi.verifyConfirmation(id, String(otpCode || '').trim());
      const mapped = mapConfirmation(result.data, profile);
      setConfirmations((current) => current.map((item) => item.id === mapped.id ? { ...item, ...mapped } : item));
      await Promise.allSettled([refreshConfirmations(), refreshOrders(), refreshDashboard(), refreshPurchaseHistory(), refreshNotifications()]);
      return { success: true, message: result.message || 'Confirmation verified successfully.' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }, [profile, refreshConfirmations, refreshOrders, refreshDashboard, refreshPurchaseHistory, refreshNotifications]);

  const expireOtpConfirmation = useCallback(async (id) => {
    await fetchConfirmationDetails(id);
  }, [fetchConfirmationDetails]);

  const resendOtpConfirmation = useCallback(async (id) => {
    try {
      const result = await customerApi.resendConfirmation(id);
      const mapped = mapConfirmation(result.data, profile);
      setConfirmations((current) => current.map((item) => item.id === mapped.id ? { ...item, ...mapped, demoOtpCode: result.devOtp } : item));
      await refreshConfirmations();
      return { success: true, data: { ...mapped, demoOtpCode: result.devOtp }, message: result.message || 'A new OTP confirmation was requested.' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }, [profile, refreshConfirmations]);

  const rejectOtpConfirmation = useCallback(async (id, rejectionReason) => {
    try {
      const result = await customerApi.rejectConfirmation(id, rejectionReason);
      const mapped = mapConfirmation(result.data, profile);
      setConfirmations((current) => current.map((item) => item.id === mapped.id ? { ...item, ...mapped } : item));
      await Promise.allSettled([refreshConfirmations(), refreshOrders(), refreshDashboard(), refreshNotifications()]);
      return { success: true, data: mapped, message: result.message || 'Purchase confirmation rejected.' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }, [profile, refreshConfirmations, refreshOrders, refreshDashboard, refreshNotifications]);

  const markNotificationRead = useCallback(async (id) => {
    try {
      const result = await customerApi.markNotificationRead(id);
      setNotifications((current) => current.map((item) => String(item.id) === String(id) ? mapNotification(result) : item));
      await refreshNotifications();
      await refreshDashboard();
    } catch (error) {
      reportError(error, 'Unable to mark notification as read.');
    }
  }, [refreshNotifications, refreshDashboard]);

  const markAllNotificationsRead = useCallback(async () => {
    try {
      await customerApi.markAllNotificationsRead();
      await refreshNotifications();
      await refreshDashboard();
      toast.success('All notifications marked as read.');
    } catch (error) {
      reportError(error, 'Unable to mark notifications as read.');
    }
  }, [refreshNotifications, refreshDashboard]);

  const deleteNotification = useCallback(async (id) => {
    try {
      await customerApi.deleteNotification(id);
      await refreshNotifications();
      await refreshDashboard();
    } catch (error) {
      reportError(error, 'Unable to delete notification.');
    }
  }, [refreshNotifications, refreshDashboard]);

  const updateProfile = useCallback(async (updates) => {
    try {
      const dto = await updateCustomerProfileApi({ ...profile, ...updates });
      const next = mapCustomerDtoToProfile(dto, profile, profileUser);
      setProfile(next);
      if (updates?.mobileNumber) updateUserMobile(updates.mobileNumber);
      toast.success('Customer profile updated successfully.');
      return dto;
    } catch (error) {
      reportError(error, 'Failed to update customer profile.');
      throw error;
    }
  }, [profile, profileUser, updateUserMobile]);

  const addDeliveryAddress = useCallback(async (address) => {
    try {
      await createCustomerAddressApi(address);
      await refreshProfile();
      toast.success('Delivery address added.');
    } catch (error) {
      reportError(error, 'Failed to add delivery address.');
      throw error;
    }
  }, [refreshProfile]);

  const updateDeliveryAddress = useCallback(async (id, updates) => {
    try {
      await updateCustomerAddressApi(id, updates);
      await refreshProfile();
    } catch (error) {
      reportError(error, 'Failed to update delivery address.');
      throw error;
    }
  }, [refreshProfile]);

  const deleteDeliveryAddress = useCallback(async (id) => {
    try {
      await deleteCustomerAddressApi(id);
      await refreshProfile();
      toast.info('Delivery address removed.');
      return true;
    } catch (error) {
      reportError(error, 'Failed to delete delivery address.');
      return false;
    }
  }, [refreshProfile]);

  const setDefaultDeliveryAddress = useCallback(async (id) => {
    try {
      await setDefaultCustomerAddressApi(id);
      await refreshProfile();
    } catch (error) {
      reportError(error, 'Failed to set default delivery address.');
    }
  }, [refreshProfile]);

  const resetCustomerDemoData = useCallback(() => refreshAll(), [refreshAll]);

  const customerName = profile.fullName || user?.fullName || user?.name || 'Customer';
  const cartItems = cart.items || [];
  const metrics = dashboardSummary || EMPTY_METRICS;
  const value = useMemo(() => ({
    profile,
    customerName,
    categories,
    products,
    cart: cartItems,
    cartItems,
    cartItemCount: cart.totalItems || 0,
    cartTotalUnits: cart.totalQuantity || 0,
    cartSubtotal: cart.itemsSubtotal || 0,
    cartTotal: cart.cartTotal || 0,
    hasUnavailableCartItems: Boolean(cart.hasUnavailableItems),
    orders,
    purchaseHistory,
    purchaseSummary,
    confirmations,
    notifications,
    notificationSummary: notificationSummary || {},
    metrics,
    loading,
    errors: {},
    demoOtpCodes: {},
    fetchProductDetails,
    fetchOrderDetails,
    fetchPurchaseDetails,
    refreshDashboard,
    refreshCategories,
    refreshProducts,
    refreshCart,
    refreshOrders,
    refreshPurchaseHistory,
    refreshConfirmations,
    refreshNotifications,
    refreshAll,
    addToCart,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    placeOrdersFromCart,
    verifyOtpConfirmation,
    fetchConfirmationDetails,
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
  }), [profile, customerName, categories, products, cart, cartItems, orders, purchaseHistory, purchaseSummary, confirmations, notifications, notificationSummary, metrics, loading, fetchProductDetails, fetchOrderDetails, fetchPurchaseDetails, refreshDashboard, refreshCategories, refreshProducts, refreshCart, refreshOrders, refreshPurchaseHistory, refreshConfirmations, refreshNotifications, refreshAll, addToCart, updateCartQuantity, removeFromCart, clearCart, placeOrdersFromCart, verifyOtpConfirmation, fetchConfirmationDetails, expireOtpConfirmation, resendOtpConfirmation, rejectOtpConfirmation, markNotificationRead, markAllNotificationsRead, deleteNotification, refreshProfile, updateProfile, addDeliveryAddress, updateDeliveryAddress, deleteDeliveryAddress, setDefaultDeliveryAddress, resetCustomerDemoData]);

  return <CustomerContext.Provider value={value}>{children}</CustomerContext.Provider>;
}

export default CustomerProvider;

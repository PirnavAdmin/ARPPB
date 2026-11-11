import { createCrudService, readStorage, writeStorage } from './api';
import { STORAGE_KEYS } from '../utils/constants';
import { INITIAL_FARMERS } from '../data/mockFarmers';
import {
  initialProfile,
  initialCrops,
  initialMarketPrices,
  initialSales,
  initialPurchases,
  initialStockRecords,
  initialOTPRequests,
  initialNotifications,
} from '../pages/farmer/data/farmerData';

/**
 * Farmer Module API Service
 * Connects the Farmer Portal frontend components to the backend REST API
 * (ASP.NET Core /api/v1/farmer/*) with intelligent client caching and offline fallback.
 */

export const FARMER_STORAGE_KEY = 'agri-farmer-portal-state-v1';

export const FARMER_API_BASE =
  import.meta.env.VITE_API_BASE_URL || '/api/v1';

export const FARMER_ENDPOINTS = {
  DASHBOARD: `${FARMER_API_BASE}/farmer/dashboard`,
  PROFILE: `${FARMER_API_BASE}/farmer/profile`,
  CROPS: `${FARMER_API_BASE}/farmer/crops`,
  STOCK: `${FARMER_API_BASE}/farmer/stock`,
  MARKET_PRICES: `${FARMER_API_BASE}/farmer/market-prices`,
  SALES: `${FARMER_API_BASE}/farmer/sales`,
  PURCHASES: `${FARMER_API_BASE}/farmer/purchases`,
  OTP_REQUESTS: `${FARMER_API_BASE}/farmer/otp-requests`,
  NOTIFICATIONS: `${FARMER_API_BASE}/farmer/notifications`,
};

// Client-side state loader
function getLocalFarmerState() {
  const fallback = {
    profile: initialProfile,
    crops: initialCrops,
    marketPrices: initialMarketPrices,
    sales: initialSales,
    purchases: initialPurchases,
    stockRecords: initialStockRecords,
    otpRequests: initialOTPRequests,
    notifications: initialNotifications,
  };
  return readStorage(FARMER_STORAGE_KEY, fallback);
}

function saveLocalFarmerState(updater) {
  const current = getLocalFarmerState();
  const next = typeof updater === 'function' ? updater(current) : { ...current, ...updater };
  writeStorage(FARMER_STORAGE_KEY, next);
  return next;
}

/**
 * Generic request helper with automatic fallback to local persistence
 */
async function fetchWithFallback(url, options = {}, fallbackAction) {
  try {
    const res = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (res.ok) {
      const json = await res.json();
      return json?.data !== undefined ? json.data : json;
    }
  } catch {
    // Backend offline or unreachable — seamlessly utilize local simulated storage
  }

  return fallbackAction();
}

export const farmerService = {
  // Backward compatibility with vendor farmer lists
  ...createCrudService(STORAGE_KEYS.FARMERS, INITIAL_FARMERS),

  /**
   * Fetch complete Dashboard data
   */
  async getDashboard() {
    return fetchWithFallback(
      FARMER_ENDPOINTS.DASHBOARD,
      { method: 'GET' },
      () => {
        const state = getLocalFarmerState();
        return {
          profile: state.profile,
          totalCrops: state.crops.length,
          totalHarvested: state.crops.reduce((sum, c) => sum + Number(c.harvestedQuantity || 0), 0),
          totalAvailableStock: state.crops.reduce((sum, c) => sum + Number(c.availableQuantity || 0), 0),
          activeSalesCount: state.sales.filter((s) => s.transactionStatus === 'Pending Confirmation').length,
          totalRevenue: state.sales
            .filter((s) => s.transactionStatus === 'Confirmed')
            .reduce((sum, s) => sum + Number(s.totalAmount || 0), 0),
          pendingOtpCount: state.otpRequests.filter((o) => o.otpStatus === 'Pending').length,
          unreadNotificationsCount: state.notifications.filter((n) => !n.read).length,
          recentSales: state.sales.slice(0, 5),
          recentCrops: state.crops.slice(0, 4),
          marketAlerts: state.marketPrices.slice(0, 3),
        };
      }
    );
  },

  /**
   * Farmer Profile Management
   */
  async getProfile() {
    return fetchWithFallback(
      FARMER_ENDPOINTS.PROFILE,
      { method: 'GET' },
      () => getLocalFarmerState().profile
    );
  },

  async updateProfile(profileData) {
    return fetchWithFallback(
      FARMER_ENDPOINTS.PROFILE,
      {
        method: 'PUT',
        body: JSON.stringify(profileData),
      },
      () => {
        const updated = saveLocalFarmerState((prev) => ({
          ...prev,
          profile: { ...prev.profile, ...profileData },
        }));
        return updated.profile;
      }
    );
  },

  /**
   * Crops Management
   */
  async getCrops() {
    return fetchWithFallback(
      FARMER_ENDPOINTS.CROPS,
      { method: 'GET' },
      () => getLocalFarmerState().crops
    );
  },

  async addCrop(cropData) {
    return fetchWithFallback(
      FARMER_ENDPOINTS.CROPS,
      {
        method: 'POST',
        body: JSON.stringify(cropData),
      },
      () => {
        const newCrop = {
          id: cropData.id || `CROP-00${Date.now().toString().slice(-4)}`,
          availableQuantity: Number(cropData.harvestedQuantity || cropData.availableQuantity || 0),
          soldQuantity: 0,
          reservedQuantity: 0,
          harvestedQuantity: Number(cropData.harvestedQuantity || cropData.availableQuantity || 0),
          status: 'Ready to Sell',
          color: '#237A45',
          ...cropData,
        };
        saveLocalFarmerState((prev) => ({
          ...prev,
          crops: [newCrop, ...prev.crops],
        }));
        return newCrop;
      }
    );
  },

  async updateCrop(id, fields) {
    return fetchWithFallback(
      `${FARMER_ENDPOINTS.CROPS}/${id}`,
      {
        method: 'PUT',
        body: JSON.stringify(fields),
      },
      () => {
        let updatedCrop = null;
        saveLocalFarmerState((prev) => ({
          ...prev,
          crops: prev.crops.map((c) => {
            if (c.id === id) {
              updatedCrop = { ...c, ...fields };
              return updatedCrop;
            }
            return c;
          }),
        }));
        return updatedCrop;
      }
    );
  },

  async deleteCrop(id) {
    return fetchWithFallback(
      `${FARMER_ENDPOINTS.CROPS}/${id}`,
      { method: 'DELETE' },
      () => {
        saveLocalFarmerState((prev) => ({
          ...prev,
          crops: prev.crops.filter((c) => c.id !== id),
        }));
        return true;
      }
    );
  },

  async addHarvest(cropId, quantity, unit = 'qtl') {
    return fetchWithFallback(
      `${FARMER_ENDPOINTS.CROPS}/${cropId}/harvest`,
      {
        method: 'POST',
        body: JSON.stringify({ quantity: Number(quantity), unit }),
      },
      () => {
        let updatedCrop = null;
        saveLocalFarmerState((prev) => ({
          ...prev,
          crops: prev.crops.map((c) => {
            if (c.id === cropId || c.name.toLowerCase() === String(cropId).toLowerCase()) {
              const harvested = Number(c.harvestedQuantity || 0) + Number(quantity);
              const available = Number(c.availableQuantity || 0) + Number(quantity);
              updatedCrop = {
                ...c,
                harvestedQuantity: harvested,
                availableQuantity: available,
                status: available < 50 ? 'Low Stock' : 'Ready to Sell',
              };
              return updatedCrop;
            }
            return c;
          }),
        }));
        return updatedCrop;
      }
    );
  },

  /**
   * Stock Overview
   */
  async getStock() {
    return fetchWithFallback(
      FARMER_ENDPOINTS.STOCK,
      { method: 'GET' },
      () => getLocalFarmerState().stockRecords
    );
  },

  /**
   * Daily Mandi Market Prices
   */
  async getMarketPrices() {
    return fetchWithFallback(
      FARMER_ENDPOINTS.MARKET_PRICES,
      { method: 'GET' },
      () => getLocalFarmerState().marketPrices
    );
  },

  /**
   * Sales Transactions
   */
  async getSales() {
    return fetchWithFallback(
      FARMER_ENDPOINTS.SALES,
      { method: 'GET' },
      () => getLocalFarmerState().sales
    );
  },

  async createSale(saleData) {
    return fetchWithFallback(
      FARMER_ENDPOINTS.SALES,
      {
        method: 'POST',
        body: JSON.stringify(saleData),
      },
      () => {
        saveLocalFarmerState((prev) => ({
          ...prev,
          sales: [saleData, ...prev.sales],
        }));
        return saleData;
      }
    );
  },

  /**
   * Input Purchases
   */
  async getPurchases() {
    return fetchWithFallback(
      FARMER_ENDPOINTS.PURCHASES,
      { method: 'GET' },
      () => getLocalFarmerState().purchases
    );
  },

  async addPurchase(purchaseData) {
    return fetchWithFallback(
      FARMER_ENDPOINTS.PURCHASES,
      {
        method: 'POST',
        body: JSON.stringify(purchaseData),
      },
      () => {
        saveLocalFarmerState((prev) => ({
          ...prev,
          purchases: [purchaseData, ...prev.purchases],
        }));
        return purchaseData;
      }
    );
  },

  /**
   * OTP Requests
   */
  async getOtpRequests() {
    return fetchWithFallback(
      FARMER_ENDPOINTS.OTP_REQUESTS,
      { method: 'GET' },
      () => getLocalFarmerState().otpRequests
    );
  },

  async verifyOtp(otpId, otpCode) {
    return fetchWithFallback(
      `${FARMER_ENDPOINTS.OTP_REQUESTS}/${otpId}/verify`,
      {
        method: 'POST',
        body: JSON.stringify({ otpCode }),
      },
      () => {
        saveLocalFarmerState((prev) => ({
          ...prev,
          otpRequests: prev.otpRequests.map((o) =>
            o.id === otpId ? { ...o, otpStatus: 'Confirmed', attemptsLeft: 0 } : o
          ),
        }));
        return true;
      }
    );
  },

  async rejectOtp(otpId, reason) {
    return fetchWithFallback(
      `${FARMER_ENDPOINTS.OTP_REQUESTS}/${otpId}/reject`,
      {
        method: 'POST',
        body: JSON.stringify({ reason }),
      },
      () => {
        saveLocalFarmerState((prev) => ({
          ...prev,
          otpRequests: prev.otpRequests.map((o) =>
            o.id === otpId ? { ...o, otpStatus: 'Rejected' } : o
          ),
        }));
        return true;
      }
    );
  },

  async resendOtp(otpId) {
    return fetchWithFallback(
      `${FARMER_ENDPOINTS.OTP_REQUESTS}/${otpId}/resend`,
      { method: 'POST' },
      () => true
    );
  },

  /**
   * Notifications
   */
  async getNotifications() {
    return fetchWithFallback(
      FARMER_ENDPOINTS.NOTIFICATIONS,
      { method: 'GET' },
      () => getLocalFarmerState().notifications
    );
  },

  async markNotificationRead(id) {
    return fetchWithFallback(
      `${FARMER_ENDPOINTS.NOTIFICATIONS}/${id}/read`,
      { method: 'PUT' },
      () => {
        saveLocalFarmerState((prev) => ({
          ...prev,
          notifications: prev.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
        }));
        return true;
      }
    );
  },

  async markAllNotificationsRead() {
    return fetchWithFallback(
      `${FARMER_ENDPOINTS.NOTIFICATIONS}/read-all`,
      { method: 'PUT' },
      () => {
        saveLocalFarmerState((prev) => ({
          ...prev,
          notifications: prev.notifications.map((n) => ({ ...n, read: true })),
        }));
        return true;
      }
    );
  },
};

export default farmerService;

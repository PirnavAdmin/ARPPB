import api from '../API/Config';
import Endpoints from '../API/Endpoints';
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
 * (ASP.NET Core /api/v1/Farmer/*) using the centralized Axios client (src/API/Config.js)
 * and Endpoints registry (src/API/Endpoints.js) with client caching and offline fallback.
 */

export const FARMER_STORAGE_KEY = 'agri-farmer-portal-state-v1';

export const FARMER_ENDPOINTS = Endpoints.FARMER || {
  DASHBOARD: '/api/v1/Farmer/dashboard',
  PROFILE: '/api/v1/Farmer/profile',
  CROPS: '/api/v1/Farmer/crops',
  STOCK: '/api/v1/Farmer/stock',
  MARKET_PRICES: '/api/v1/Farmer/market-prices',
  SALES: '/api/v1/Farmer/sales',
  PURCHASES: '/api/v1/Farmer/purchases',
  OTP_REQUESTS: '/api/v1/Farmer/otp-requests',
  NOTIFICATIONS: '/api/v1/Farmer/notifications',
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
async function callApiWithFallback(method, url, data = null, fallbackAction) {
  try {
    const res = await api({
      method,
      url,
      data,
    });

    if (res?.data) {
      // Backend returns ApiResponse<T> where res.data.data contains payload
      const payload = res.data.data !== undefined ? res.data.data : res.data;
      return payload;
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
    return callApiWithFallback(
      'GET',
      FARMER_ENDPOINTS.DASHBOARD,
      null,
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
    return callApiWithFallback(
      'GET',
      FARMER_ENDPOINTS.PROFILE,
      null,
      () => getLocalFarmerState().profile
    );
  },

  async updateProfile(profileData) {
    return callApiWithFallback(
      'PUT',
      FARMER_ENDPOINTS.PROFILE,
      profileData,
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
    return callApiWithFallback(
      'GET',
      FARMER_ENDPOINTS.CROPS,
      null,
      () => getLocalFarmerState().crops
    );
  },

  async addCrop(cropData) {
    return callApiWithFallback(
      'POST',
      FARMER_ENDPOINTS.CROPS,
      cropData,
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
    return callApiWithFallback(
      'PUT',
      `${FARMER_ENDPOINTS.CROPS}/${id}`,
      fields,
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
    return callApiWithFallback(
      'DELETE',
      `${FARMER_ENDPOINTS.CROPS}/${id}`,
      null,
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
    return callApiWithFallback(
      'POST',
      `${FARMER_ENDPOINTS.CROPS}/${cropId}/harvest`,
      { quantity: Number(quantity), unit },
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
    return callApiWithFallback(
      'GET',
      FARMER_ENDPOINTS.STOCK,
      null,
      () => getLocalFarmerState().stockRecords
    );
  },

  /**
   * Daily Mandi Market Prices
   */
  async getMarketPrices() {
    return callApiWithFallback(
      'GET',
      FARMER_ENDPOINTS.MARKET_PRICES,
      null,
      () => getLocalFarmerState().marketPrices
    );
  },

  /**
   * Sales Transactions
   */
  async getSales() {
    return callApiWithFallback(
      'GET',
      FARMER_ENDPOINTS.SALES,
      null,
      () => getLocalFarmerState().sales
    );
  },

  async createSale(saleData) {
    return callApiWithFallback(
      'POST',
      FARMER_ENDPOINTS.SALES,
      saleData,
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
    return callApiWithFallback(
      'GET',
      FARMER_ENDPOINTS.PURCHASES,
      null,
      () => getLocalFarmerState().purchases
    );
  },

  async addPurchase(purchaseData) {
    return callApiWithFallback(
      'POST',
      FARMER_ENDPOINTS.PURCHASES,
      purchaseData,
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
    return callApiWithFallback(
      'GET',
      FARMER_ENDPOINTS.OTP_REQUESTS,
      null,
      () => getLocalFarmerState().otpRequests
    );
  },

  async verifyOtp(otpId, otpCode) {
    return callApiWithFallback(
      'POST',
      `${FARMER_ENDPOINTS.OTP_REQUESTS}/${otpId}/verify`,
      { otpCode },
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
    return callApiWithFallback(
      'POST',
      `${FARMER_ENDPOINTS.OTP_REQUESTS}/${otpId}/reject`,
      { reason },
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
    return callApiWithFallback(
      'POST',
      `${FARMER_ENDPOINTS.OTP_REQUESTS}/${otpId}/resend`,
      null,
      () => true
    );
  },

  /**
   * Notifications
   */
  async getNotifications() {
    return callApiWithFallback(
      'GET',
      FARMER_ENDPOINTS.NOTIFICATIONS,
      null,
      () => getLocalFarmerState().notifications
    );
  },

  async markNotificationRead(id) {
    return callApiWithFallback(
      'PUT',
      `${FARMER_ENDPOINTS.NOTIFICATIONS}/${id}/read`,
      null,
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
    return callApiWithFallback(
      'PUT',
      `${FARMER_ENDPOINTS.NOTIFICATIONS}/read-all`,
      null,
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

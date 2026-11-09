import { createCrudService } from './api';
import { STORAGE_KEYS } from '../utils/constants';
import { INITIAL_CUSTOMERS } from '../data/mockCustomers';
import {
  customerProfile,
  dashboardStats,
  recentOrders,
  recentInvoices,
  paymentSummary,
} from '../data/customerMockData';

const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms));

export const customerService = {
  ...createCrudService(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS),

  async getDashboard() {
    await delay();
    return {
      profile: customerProfile,
      stats: dashboardStats,
      orders: recentOrders,
      invoices: recentInvoices,
      payments: paymentSummary,
    };
  },

  async getOrders() {
    await delay();
    return recentOrders;
  },

  async getProfile() {
    await delay();
    return customerProfile;
  },

  async getInvoices() {
    await delay();
    return recentInvoices;
  },
};

export default customerService;


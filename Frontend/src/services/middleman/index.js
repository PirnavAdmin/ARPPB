/**
 * Services layer for Middleman module
 * Ready for future backend integration with API endpoints.
 */

export const dashboardService = {
  getSummary: async () => ({ success: true }),
};

export const farmerService = {
  getAll: async () => ({ success: true }),
  create: async (data) => ({ success: true, data }),
  update: async (id, data) => ({ success: true, data }),
};

export const vendorService = {
  getAll: async () => ({ success: true }),
  create: async (data) => ({ success: true, data }),
  update: async (id, data) => ({ success: true, data }),
};

export const customerService = {
  getAll: async () => ({ success: true }),
  create: async (data) => ({ success: true, data }),
  update: async (id, data) => ({ success: true, data }),
};

export const purchaseService = {
  getAll: async () => ({ success: true }),
  create: async (data) => ({ success: true, data }),
};

export const salesService = {
  getAllVendorSales: async () => ({ success: true }),
  getAllCustomerSales: async () => ({ success: true }),
  createVendorSale: async (data) => ({ success: true, data }),
  createCustomerSale: async (data) => ({ success: true, data }),
};

export const inventoryService = {
  getBatches: async () => ({ success: true }),
};

export const ledgerService = {
  getEntries: async () => ({ success: true }),
  settle: async (id, amount) => ({ success: true, id, amount }),
};

export const confirmationService = {
  confirmOTP: async (id) => ({ success: true, id }),
  rejectOTP: async (id, reason) => ({ success: true, id, reason }),
};

export const notificationService = {
  getAll: async () => ({ success: true }),
  markRead: async (id) => ({ success: true, id }),
};

export const profileService = {
  getProfile: async () => ({ success: true }),
  updateProfile: async (data) => ({ success: true, data }),
};


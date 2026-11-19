const API_ENDPOINTS = {
  // =========================
  // AUTH
  // =========================
  Auth: {
    login: "/api/v1/Auth/login",
    forgotPassword: "/api/v1/Auth/forgot-password",
    verifyOtp: "/api/v1/Auth/verify-otp",
    resetPassword: "/api/v1/Auth/reset-password",
  },

  // =========================
  // REGISTRATION
  // =========================
  Registration: {
    sendMobileOtp: "/api/v1/Registration/send-mobile-otp",
    verifyMobileOtp: "/api/v1/Registration/verify-mobile-otp",
    register: "/api/v1/Registration",
  },

  // =========================
  // CUSTOMER PROFILE
  // =========================
  CustomerProfile: {
    get: "/api/customer/profile",
    update: "/api/customer/profile",
    sendMobileOtp: "/api/customer/profile/mobile/send-otp",
    verifyMobileOtp: "/api/customer/profile/mobile/verify-otp",
    addresses: "/api/customer/profile/addresses",
    addressById: (id) => `/api/customer/profile/addresses/${id}`,
    setDefaultAddress: (id) =>
      `/api/customer/profile/addresses/${id}/default`,
  },

  // =========================
  // FARMER CROPS
  // =========================
  FarmerCrops: {
    getAll: "/api/v1/farmer/crops",
    create: "/api/v1/farmer/crops",
    getOptions: "/api/v1/farmer/crops/options",
    getById: (id) => `/api/v1/farmer/crops/${id}`,
    update: (id) => `/api/v1/farmer/crops/${id}`,
    delete: (id) => `/api/v1/farmer/crops/${id}`,
    addStock: (id) => `/api/v1/farmer/crops/${id}/add-stock`,
  },

  // =========================
  // FARMER PROFILE
  // =========================
  FarmerProfile: {
    getAll: "/api/v1/farmer/profile/all",
    get: "/api/v1/farmer/profile",
    update: "/api/v1/farmer/profile",
    getBankDetails: "/api/v1/farmer/profile/bank-details",
    updateBankDetails: "/api/v1/farmer/profile/bank-details",
    sendMobileOtp: "/api/v1/farmer/profile/change-mobile/send-otp",
    verifyMobileOtp: "/api/v1/farmer/profile/change-mobile/verify-otp",
    changePassword: "/api/v1/farmer/profile/change-password",
  },

  // =========================
  // MIDDLEMAN DASHBOARD
  // =========================
  MiddlemanDashboard: {
    get: "/api/v1/middleman/dashboard",
    getKpis: "/api/v1/middleman/dashboard/kpis",
    purchaseVsSales: "/api/v1/middleman/dashboard/purchase-vs-sales",
    cropwiseInventory: "/api/v1/middleman/dashboard/cropwise-inventory",
    pendingConfirmations:
      "/api/v1/middleman/dashboard/pending-confirmations",
    recentTransactions:
      "/api/v1/middleman/dashboard/recent-transactions",
    purchases: "/api/v1/middleman/dashboard/purchases",
    salesVendors: "/api/v1/middleman/dashboard/sales/vendors",
    salesCustomers: "/api/v1/middleman/dashboard/sales/customers",
  },

  // =========================
  // MIDDLEMAN FARMERS
  // =========================
  MiddlemanFarmers: {
    getAll: "/api/v1/middleman/farmers",
    create: "/api/v1/middleman/farmers",
    getById: (id) => `/api/v1/middleman/farmers/${id}`,
    update: (id) => `/api/v1/middleman/farmers/${id}`,
    history: (id) => `/api/v1/middleman/farmers/${id}/history`,
  },

  // =========================
  // MIDDLEMAN INVENTORY
  // =========================
  MiddlemanInventory: {
    getAll: "/api/v1/middleman/inventory",
    summary: "/api/v1/middleman/inventory/summary",
    batches: "/api/v1/middleman/inventory/batches",
    createBatch: "/api/v1/middleman/inventory/batches",
    batchById: (id) => `/api/v1/middleman/inventory/batches/${id}`,
    updateBatch: (id) => `/api/v1/middleman/inventory/batches/${id}`,
  },

  // =========================
  // MIDDLEMAN LEDGER
  // =========================
  MiddlemanLedger: {
    getAll: "/api/v1/middleman/ledger",
    create: "/api/v1/middleman/ledger",
    getById: (id) => `/api/v1/middleman/ledger/${id}`,
    update: (id) => `/api/v1/middleman/ledger/${id}`,
    settle: (id) => `/api/v1/middleman/ledger/${id}/settle`,
  },

  // =========================
  // MIDDLEMAN PURCHASES
  // =========================
  MiddlemanPurchases: {
    getAll: "/api/v1/middleman/purchases",
    create: "/api/v1/middleman/purchases",
    getById: (id) => `/api/v1/middleman/purchases/${id}`,
  },

  // =========================
  // MIDDLEMAN NOTIFICATIONS
  // =========================
  MiddlemanNotifications: {
    getAll: "/api/v1/notifications",
    getStatus: "/api/v1/notifications/status",
    getLatest: "/api/v1/notifications/latest",
    markRead: (id) => `/api/v1/notifications/${id}/read`,
    markAllRead: "/api/v1/notifications/read-all",
    delete: (id) => `/api/v1/notifications/${id}`,
  },

  // =========================
  // MIDDLEMAN PROFILE
  // =========================
  MiddlemanProfile: {
    get: "/api/v1/middleman-profile",
    getById: (id) => `/api/v1/middleman-profile/${id}`,
    update: (id) => `/api/v1/middleman-profile/${id}`,
    sendMobileOtp: "/api/v1/middleman-profile/mobile/send-otp",
    verifyMobileOtp: "/api/v1/middleman-profile/mobile/verify-otp",
  },

  // =========================
  // ROLE ACCESS
  // =========================
  RoleAccess: {
    farmer: "/api/v1/role-access/farmer",
    customer: "/api/v1/role-access/customer",
    middleman: "/api/v1/role-access/middleman",
    vendor: "/api/v1/role-access/vendor",
    profile: "/api/v1/role-access/profile",
    businessAccess: "/api/v1/role-access/business-access",
  },

  // =========================
  // VENDOR CONFIRMATIONS
  // =========================
  VendorConfirmations: {
    summary: "/api/v1/vendor/confirmations/summary",
    getAll: "/api/v1/vendor/confirmations",
    create: "/api/v1/vendor/confirmations",
    getById: (id) => `/api/v1/vendor/confirmations/${id}`,
    verify: (id) => `/api/v1/vendor/confirmations/${id}/verify`,
    resend: (id) => `/api/v1/vendor/confirmations/${id}/resend`,
  },

  // =========================
  // VENDOR CUSTOMERS
  // =========================
  VendorCustomers: {
    overview: "/api/v1/vendor/partners/customers/overview",
    getAll: "/api/v1/vendor/partners/customers",
    create: "/api/v1/vendor/partners/customers",
    getById: (id) => `/api/v1/vendor/partners/customers/${id}`,
    update: (id) => `/api/v1/vendor/partners/customers/${id}`,
    updateStatus: (id) =>
      `/api/v1/vendor/partners/customers/${id}/status`,
    export: "/api/v1/vendor/partners/customers/export",
  },

  // =========================
  // VENDOR DASHBOARD
  // =========================
  VendorDashboard: {
    get: "/api/v1/vendor/dashboard",
    transactions: "/api/v1/vendor/dashboard/transactions",
    search: "/api/v1/vendor/dashboard/search",
    otpConfirmations: "/api/v1/vendor/dashboard/otp-confirmations",
    verifyOtp: (partnerType, confirmationId) =>
      `/api/v1/vendor/dashboard/otp-confirmations/${partnerType}/${confirmationId}/verify`,
    exportTransactions: "/api/v1/vendor/dashboard/transactions/export",
  },

  // =========================
  // VENDOR FARMERS
  // =========================
  VendorFarmers: {
    overview: "/api/v1/vendor/partners/farmers/overview",
    getAll: "/api/v1/vendor/partners/farmers",
    create: "/api/v1/vendor/partners/farmers",
    getById: (id) => `/api/v1/vendor/partners/farmers/${id}`,
    update: (id) => `/api/v1/vendor/partners/farmers/${id}`,
    updateStatus: (id) =>
      `/api/v1/vendor/partners/farmers/${id}/status`,
    transactions: (id) =>
      `/api/v1/vendor/partners/farmers/${id}/transactions`,
    payments: (id) =>
      `/api/v1/vendor/partners/farmers/${id}/payments`,
    otpConfirmations: (id) =>
      `/api/v1/vendor/partners/farmers/${id}/otp-confirmations`,
    export: "/api/v1/vendor/partners/farmers/export",
  },

  // =========================
  // VENDOR FINISHED PRODUCTS
  // =========================
  VendorFinishedProducts: {
    overview: "/api/v1/vendor/finished-products/overview",
    getAll: "/api/v1/vendor/finished-products",
    create: "/api/v1/vendor/finished-products",
    getById: (id) => `/api/v1/vendor/finished-products/${id}`,
    update: (id) => `/api/v1/vendor/finished-products/${id}`,
    adjustStock: (id) =>
      `/api/v1/vendor/finished-products/${id}/adjust-stock`,
    movements: (id) =>
      `/api/v1/vendor/finished-products/${id}/movements`,
    updateStatus: (id) =>
      `/api/v1/vendor/finished-products/${id}/status`,
    export: "/api/v1/vendor/finished-products/export",
  },

  // =========================
  // VENDOR LEDGER
  // =========================
  VendorLedger: {
    summary: "/api/v1/vendor/ledger/summary",
    dayTotals: "/api/v1/vendor/ledger/day-totals",
    getAll: "/api/v1/vendor/ledger",
    getById: (id) => `/api/v1/vendor/ledger/${id}`,
    paySupplier: "/api/v1/vendor/ledger/pay-supplier",
    receipts: "/api/v1/vendor/ledger/receipts",
    settle: (id) => `/api/v1/vendor/ledger/${id}/settle`,
  },

  // =========================
  // VENDOR MIDDLEMEN
  // =========================
  VendorMiddlemen: {
    overview: "/api/v1/vendor/partners/middlemen/overview",
    getAll: "/api/v1/vendor/partners/middlemen",
    create: "/api/v1/vendor/partners/middlemen",
    getById: (id) =>
      `/api/v1/vendor/partners/middlemen/${id}`,
    update: (id) =>
      `/api/v1/vendor/partners/middlemen/${id}`,
    updateStatus: (id) =>
      `/api/v1/vendor/partners/middlemen/${id}/status`,
    transactions: (id) =>
      `/api/v1/vendor/partners/middlemen/${id}/transactions`,
    payments: (id) =>
      `/api/v1/vendor/partners/middlemen/${id}/payments`,
    otpConfirmations: (id) =>
      `/api/v1/vendor/partners/middlemen/${id}/otp-confirmations`,
    export: "/api/v1/vendor/partners/middlemen/export",
  },

  // =========================
  // VENDOR NOTIFICATIONS
  // =========================
  VendorNotifications: {
    summary: "/api/v1/vendor/notifications/summary",
    getAll: "/api/v1/vendor/notifications",
    markRead: (id) => `/api/v1/vendor/notifications/${id}/read`,
    markAllRead: "/api/v1/vendor/notifications/read-all",
    delete: (id) => `/api/v1/vendor/notifications/${id}`,
  },

  // =========================
  // VENDOR ORDERS
  // =========================
  VendorOrders: {
    summary: "/api/v1/vendor/orders/summary",
    getAll: "/api/v1/vendor/orders",
    getById: (id) => `/api/v1/vendor/orders/${id}`,
    updateStatus: (id) =>
      `/api/v1/vendor/orders/${id}/status`,
    cancel: (id) => `/api/v1/vendor/orders/${id}/cancel`,
  },

  // =========================
  // VENDOR PROCESSING
  // =========================
  VendorProcessing: {
    overview: "/api/v1/vendor/processing/overview",
    getAll: "/api/v1/vendor/processing/batches",
    create: "/api/v1/vendor/processing/batches",
    getById: (id) =>
      `/api/v1/vendor/processing/batches/${id}`,
    export: "/api/v1/vendor/processing/export",
  },

  // =========================
  // VENDOR PROFILE
  // =========================
  VendorProfile: {
    get: "/api/v1/vendor/profile",
    getById: (id) => `/api/v1/vendor/profile/${id}`,
    update: (id) => `/api/v1/vendor/profile/${id}`,
    getBankDetails: "/api/v1/vendor/profile/bank-details",
    updateBankDetails: "/api/v1/vendor/profile/bank-details",
    sendMobileOtp:
      "/api/v1/vendor/profile/mobile-change/request-otp",
    verifyMobileOtp:
      "/api/v1/vendor/profile/mobile-change/verify-otp",
  },

  // =========================
  // VENDOR RAW MATERIAL INVENTORY
  // =========================
  VendorRawMaterialInventory: {
    overview: "/api/v1/vendor/inventory/raw-materials/overview",
    getAll: "/api/v1/vendor/inventory/raw-materials",
    getById: (id) =>
      `/api/v1/vendor/inventory/raw-materials/${id}`,
    movements: "/api/v1/vendor/inventory/raw-materials/movements",
    export: "/api/v1/vendor/inventory/raw-materials/export",
  },

  // =========================
  // VENDOR SALES
  // =========================
  VendorSales: {
    catalogSummary: "/api/v1/vendor/sales/catalog-summary",
    customers: "/api/v1/vendor/sales/customers",
    customerById: (id) =>
      `/api/v1/vendor/sales/customers/${id}`,
    batches: "/api/v1/vendor/sales/batches",
    batchById: (id) =>
      `/api/v1/vendor/sales/batches/${id}`,
    summary: "/api/v1/vendor/sales/summary",
    getAll: "/api/v1/vendor/sales",
    create: "/api/v1/vendor/sales",
    drafts: "/api/v1/vendor/sales/drafts",
    getById: (id) => `/api/v1/vendor/sales/${id}`,
    update: (id) => `/api/v1/vendor/sales/${id}`,
    delete: (id) => `/api/v1/vendor/sales/${id}`,
    submit: (id) => `/api/v1/vendor/sales/${id}/submit`,
  },
};

export default API_ENDPOINTS;

// Endpoints.js
// ARPPB - Frontend API endpoint configuration

export const API_BASE_URL = "https://zodiac-excursion-rendition.ngrok-free.dev";

// Helper to define an endpoint that works both as an { method, path } descriptor,
// a callable path-param function (e.g. getById(123)), and an Axios-compatible URL string.
export const endpoint = (method, path) => {
  const fn = function (...args) {
    if (args.length === 0) return fn;
    let newPath = path;
    if (args.length === 1 && typeof args[0] !== "object") {
      newPath = newPath.replace(/{[^}]+}/, args[0]);
    } else if (typeof args[0] === "object" && args[0] !== null) {
      for (const [k, v] of Object.entries(args[0])) {
        newPath = newPath.replace(new RegExp(`{${k}}`, "g"), v);
      }
    } else {
      for (const arg of args) {
        newPath = newPath.replace(/{[^}]+}/, arg);
      }
    }
    return endpoint(method, newPath);
  };

  fn.method = method;
  fn.path = path;
  fn.toString = () => path;
  fn.valueOf = () => path;
  fn[Symbol.toPrimitive] = (hint) => (hint === "number" ? NaN : path);

  return fn;
};

// --------------------------------------------------
// AUTHENTICATION
// --------------------------------------------------
export const Auth = {
  login: endpoint("POST", "/api/v1/Auth/login"),
  forgotPassword: endpoint("POST", "/api/v1/Auth/forgot-password"),
  verifyOtp: endpoint("POST", "/api/v1/Auth/verify-otp"),
  resetPassword: endpoint("POST", "/api/v1/Auth/reset-password"),
};

// --------------------------------------------------
// REGISTRATION
// --------------------------------------------------
export const Registration = {
  sendMobileOtp: endpoint("POST", "/api/v1/Registration/send-mobile-otp"),
  verifyMobileOtp: endpoint("POST", "/api/v1/Registration/verify-mobile-otp"),
  register: endpoint("POST", "/api/v1/Registration"),
};

// --------------------------------------------------
// ROLE ACCESS
// --------------------------------------------------
export const RoleAccess = {
  farmer: endpoint("GET", "/api/v1/role-access/farmer"),
  customer: endpoint("GET", "/api/v1/role-access/customer"),
  middleman: endpoint("GET", "/api/v1/role-access/middleman"),
  vendor: endpoint("GET", "/api/v1/role-access/vendor"),
  profile: endpoint("GET", "/api/v1/role-access/profile"),
  businessAccess: endpoint("GET", "/api/v1/role-access/business-access"),
};

// --------------------------------------------------
// MIDDLEMAN - DASHBOARD
// --------------------------------------------------
export const MiddlemanDashboard = {
  get: endpoint("GET", "/api/v1/middleman/dashboard"),
  getKpis: endpoint("GET", "/api/v1/middleman/dashboard"),
  purchaseVsSales: endpoint("GET", "/api/v1/middleman/dashboard"),
  cropwiseInventory: endpoint("GET", "/api/v1/middleman/dashboard"),
  pendingConfirmations: endpoint("GET", "/api/v1/middleman/dashboard"),
  recentTransactions: endpoint("GET", "/api/v1/middleman/dashboard"),
  purchases: endpoint("GET", "/api/v1/middleman/dashboard"),
  salesVendors: endpoint("GET", "/api/v1/middleman/dashboard"),
  salesCustomers: endpoint("GET", "/api/v1/middleman/dashboard"),
};

// --------------------------------------------------
// MIDDLEMAN - FARMERS
// --------------------------------------------------
export const MiddlemanFarmers = {
  getAll: endpoint("GET", "/api/v1/middleman/farmers"),
  create: endpoint("POST", "/api/v1/middleman/farmers"),
  getById: endpoint("GET", "/api/v1/middleman/farmers/{id}"),
  update: endpoint("PUT", "/api/v1/middleman/farmers/{id}"),
  history: endpoint("GET", "/api/v1/middleman/farmers/{id}/history"),
};

// --------------------------------------------------
// MIDDLEMAN - CUSTOMERS
// --------------------------------------------------
export const MiddlemanCustomers = {
  getAll: endpoint("GET", "/api/v1/middleman/customers"),
  create: endpoint("POST", "/api/v1/middleman/customers"),
  getById: endpoint("GET", "/api/v1/middleman/customers/{id}"),
  update: endpoint("PUT", "/api/v1/middleman/customers/{id}"),
};

// --------------------------------------------------
// MIDDLEMAN - CUSTOMER SALES
// --------------------------------------------------
export const MiddlemanCustomerSales = {
  getAll: endpoint("GET", "/api/v1/middleman/customer-sales"),
  create: endpoint("POST", "/api/v1/middleman/customer-sales"),
  getById: endpoint("GET", "/api/v1/middleman/customer-sales/{id}"),
};

// --------------------------------------------------
// MIDDLEMAN - INVENTORY
// --------------------------------------------------
export const MiddlemanInventory = {
  get: endpoint("GET", "/api/v1/middleman/inventory"),
  getAll: endpoint("GET", "/api/v1/middleman/inventory"),
  summary: endpoint("GET", "/api/v1/middleman/inventory/summary"),
  batches: endpoint("GET", "/api/v1/middleman/inventory/batches"),
  createBatch: endpoint("POST", "/api/v1/middleman/inventory/batches"),
  batchById: endpoint("GET", "/api/v1/middleman/inventory/batches/{id}"),
  updateBatch: endpoint("PUT", "/api/v1/middleman/inventory/batches/{id}"),
};

// --------------------------------------------------
// MIDDLEMAN - LEDGER
// --------------------------------------------------
export const MiddlemanLedger = {
  getAll: endpoint("GET", "/api/v1/middleman/ledger"),
  getById: endpoint("GET", "/api/v1/middleman/ledger/{id}"),
  create: endpoint("POST", "/api/v1/middleman/ledger"),
  update: endpoint("PUT", "/api/v1/middleman/ledger/{id}"),
  settle: endpoint("POST", "/api/v1/middleman/ledger/{id}/settle"),
  settlePost: endpoint("POST", "/api/v1/middleman/ledger/{id}/settle"),
  settlePut: endpoint("PUT", "/api/v1/middleman/ledger/{id}/settle"),
};

// --------------------------------------------------
// MIDDLEMAN - NOTIFICATIONS
// --------------------------------------------------
export const MiddlemanNotifications = {
  getAll: endpoint("GET", "/api/v1/middleman/notifications"),
  create: endpoint("POST", "/api/v1/middleman/notifications"),
  getStatus: endpoint("GET", "/api/v1/notifications/status"),
  getLatest: endpoint("GET", "/api/v1/notifications/latest"),
  markRead: endpoint("PATCH", "/api/v1/middleman/notifications/{id}/read"),
  markReadPatch: endpoint("PATCH", "/api/v1/middleman/notifications/{id}/read"),
  markReadPut: endpoint("PUT", "/api/v1/middleman/notifications/{id}/read"),
  markReadPost: endpoint("POST", "/api/v1/middleman/notifications/{id}/read"),
  markAllRead: endpoint("PATCH", "/api/v1/middleman/notifications/read-all"),
  markAllReadPatch: endpoint("PATCH", "/api/v1/middleman/notifications/read-all"),
  markAllReadPut: endpoint("PUT", "/api/v1/middleman/notifications/read-all"),
  markAllReadPost: endpoint("POST", "/api/v1/middleman/notifications/read-all"),
  delete: endpoint("DELETE", "/api/v1/middleman/notifications/{id}"),
};

// --------------------------------------------------
// MIDDLEMAN - OTP CONFIRMATIONS
// --------------------------------------------------
export const MiddlemanOtpConfirmations = {
  summary: endpoint("GET", "/api/v1/middleman/confirmations/summary"),
  getAll: endpoint("GET", "/api/v1/middleman/confirmations"),
  getById: endpoint("GET", "/api/v1/middleman/confirmations/{id}"),
  verify: endpoint("POST", "/api/v1/middleman/confirmations/{id}/verify"),
  resend: endpoint("POST", "/api/v1/middleman/confirmations/{id}/resend"),
  reject: endpoint("POST", "/api/v1/middleman/confirmations/{id}/reject"),
};
export const MiddlemanConfirmations = MiddlemanOtpConfirmations;

// --------------------------------------------------
// MIDDLEMAN - PROFILE
// --------------------------------------------------
export const MiddlemanProfile = {
  get: endpoint("GET", "/api/v1/middleman/profile"),
  getById: endpoint("GET", "/api/v1/middleman/profile/{id}"),
  update: endpoint("PUT", "/api/v1/middleman/profile/{id}"),
  sendMobileOtp: endpoint("POST", "/api/v1/middleman/profile/mobile/send-otp"),
  verifyMobileOtp: endpoint("POST", "/api/v1/middleman/profile/mobile/verify-otp"),
};

// --------------------------------------------------
// MIDDLEMAN - PURCHASES
// --------------------------------------------------
export const MiddlemanPurchases = {
  getAll: endpoint("GET", "/api/v1/middleman/purchases"),
  create: endpoint("POST", "/api/v1/middleman/purchases"),
  getById: endpoint("GET", "/api/v1/middleman/purchases/{id}"),
};

// --------------------------------------------------
// MIDDLEMAN - TRANSACTION HISTORY
// --------------------------------------------------
export const MiddlemanTransactionHistory = {
  getAll: endpoint("GET", "/api/v1/middleman/transaction-history"),
};

// --------------------------------------------------
// MIDDLEMAN - VENDOR SALES
// --------------------------------------------------
export const MiddlemanVendorSales = {
  getAll: endpoint("GET", "/api/v1/middleman/vendor-sales"),
  create: endpoint("POST", "/api/v1/middleman/vendor-sales"),
  getById: endpoint("GET", "/api/v1/middleman/vendor-sales/{id}"),
};

// --------------------------------------------------
// MIDDLEMAN - VENDORS
// --------------------------------------------------
export const MiddlemanVendors = {
  getAll: endpoint("GET", "/api/v1/middleman/vendors"),
  create: endpoint("POST", "/api/v1/middleman/vendors"),
  getById: endpoint("GET", "/api/v1/middleman/vendors/{id}"),
  update: endpoint("PUT", "/api/v1/middleman/vendors/{id}"),
};

// --------------------------------------------------
// VENDOR - DASHBOARD
// --------------------------------------------------
export const VendorDashboard = {
  get: endpoint("GET", "/api/v1/vendor/dashboard"),
  transactions: endpoint("GET", "/api/v1/vendor/dashboard/transactions"),
  search: endpoint("GET", "/api/v1/vendor/dashboard/search"),
  otpConfirmations: endpoint("GET", "/api/v1/vendor/dashboard/otp-confirmations"),
  verifyOtp: (partnerType, confirmationId) =>
    `/api/v1/vendor/dashboard/otp-confirmations/${partnerType}/${confirmationId}/verify`,
  exportTransactions: endpoint("GET", "/api/v1/vendor/dashboard/transactions/export"),
};

// --------------------------------------------------
// VENDOR - CUSTOMERS
// --------------------------------------------------
export const VendorCustomers = {
  overview: endpoint("GET", "/api/v1/vendor/partners/customers/overview"),
  getAll: endpoint("GET", "/api/v1/vendor/partners/customers"),
  create: endpoint("POST", "/api/v1/vendor/partners/customers"),
  getById: endpoint("GET", "/api/v1/vendor/partners/customers/{id}"),
  update: endpoint("PUT", "/api/v1/vendor/partners/customers/{id}"),
  updateStatus: endpoint("PATCH", "/api/v1/vendor/partners/customers/{id}/status"),
  export: endpoint("GET", "/api/v1/vendor/partners/customers/export"),
};

// --------------------------------------------------
// VENDOR - FARMERS
// --------------------------------------------------
export const VendorFarmers = {
  overview: endpoint("GET", "/api/v1/vendor/partners/farmers/overview"),
  getAll: endpoint("GET", "/api/v1/vendor/partners/farmers"),
  create: endpoint("POST", "/api/v1/vendor/partners/farmers"),
  getById: endpoint("GET", "/api/v1/vendor/partners/farmers/{id}"),
  update: endpoint("PUT", "/api/v1/vendor/partners/farmers/{id}"),
  updateStatus: endpoint("PATCH", "/api/v1/vendor/partners/farmers/{id}/status"),
  transactions: endpoint("GET", "/api/v1/vendor/partners/farmers/{id}/transactions"),
  payments: endpoint("GET", "/api/v1/vendor/partners/farmers/{id}/payments"),
  otpConfirmations: endpoint("GET", "/api/v1/vendor/partners/farmers/{id}/otp-confirmations"),
  export: endpoint("GET", "/api/v1/vendor/partners/farmers/export"),
};

// --------------------------------------------------
// VENDOR - FINISHED PRODUCTS
// --------------------------------------------------
export const VendorFinishedProducts = {
  overview: endpoint("GET", "/api/v1/vendor/finished-products/overview"),
  getAll: endpoint("GET", "/api/v1/vendor/finished-products"),
  create: endpoint("POST", "/api/v1/vendor/finished-products"),
  getById: endpoint("GET", "/api/v1/vendor/finished-products/{id}"),
  update: endpoint("PUT", "/api/v1/vendor/finished-products/{id}"),
  adjustStock: endpoint("POST", "/api/v1/vendor/finished-products/{id}/adjust-stock"),
  movements: endpoint("GET", "/api/v1/vendor/finished-products/{id}/movements"),
  updateStatus: endpoint("PATCH", "/api/v1/vendor/finished-products/{id}/status"),
  export: endpoint("GET", "/api/v1/vendor/finished-products/export"),
};

// --------------------------------------------------
// VENDOR - MIDDLEMEN
// --------------------------------------------------
export const VendorMiddlemen = {
  overview: endpoint("GET", "/api/v1/vendor/partners/middlemen/overview"),
  getAll: endpoint("GET", "/api/v1/vendor/partners/middlemen"),
  create: endpoint("POST", "/api/v1/vendor/partners/middlemen"),
  getById: endpoint("GET", "/api/v1/vendor/partners/middlemen/{id}"),
  update: endpoint("PUT", "/api/v1/vendor/partners/middlemen/{id}"),
  updateStatus: endpoint("PATCH", "/api/v1/vendor/partners/middlemen/{id}/status"),
  transactions: endpoint("GET", "/api/v1/vendor/partners/middlemen/{id}/transactions"),
  payments: endpoint("GET", "/api/v1/vendor/partners/middlemen/{id}/payments"),
  otpConfirmations: endpoint("GET", "/api/v1/vendor/partners/middlemen/{id}/otp-confirmations"),
  export: endpoint("GET", "/api/v1/vendor/partners/middlemen/export"),
};

// --------------------------------------------------
// VENDOR - PROCESSING
// --------------------------------------------------
export const VendorProcessing = {
  overview: endpoint("GET", "/api/v1/vendor/processing/overview"),
  getAll: endpoint("GET", "/api/v1/vendor/processing/batches"),
  create: endpoint("POST", "/api/v1/vendor/processing/batches"),
  getById: endpoint("GET", "/api/v1/vendor/processing/batches/{id}"),
  export: endpoint("GET", "/api/v1/vendor/processing/export"),
};

// --------------------------------------------------
// VENDOR - PURCHASES
// --------------------------------------------------
export const VendorPurchases = {
  getAll: endpoint("GET", "/api/v1/vendor/purchases"),
  create: endpoint("POST", "/api/v1/vendor/purchases"),
  getById: endpoint("GET", "/api/v1/vendor/purchases/{id}"),
};

// --------------------------------------------------
// VENDOR - RAW MATERIAL INVENTORY
// --------------------------------------------------
export const VendorRawMaterialInventory = {
  overview: endpoint("GET", "/api/v1/vendor/inventory/raw-materials/overview"),
  getAll: endpoint("GET", "/api/v1/vendor/inventory/raw-materials"),
  getById: endpoint("GET", "/api/v1/vendor/inventory/raw-materials/{id}"),
  movements: endpoint("GET", "/api/v1/vendor/inventory/raw-materials/movements"),
  export: endpoint("GET", "/api/v1/vendor/inventory/raw-materials/export"),
};

// --------------------------------------------------
// UNTOUCHED EXISTING PORTAL ENDPOINTS PRESERVED
// --------------------------------------------------
export const CustomerProfile = {
  get: "/api/customer/profile",
  update: "/api/customer/profile",
  sendMobileOtp: "/api/customer/profile/mobile/send-otp",
  verifyMobileOtp: "/api/customer/profile/mobile/verify-otp",
  addresses: "/api/customer/profile/addresses",
  addressById: (id) => `/api/customer/profile/addresses/${id}`,
  setDefaultAddress: (id) => `/api/customer/profile/addresses/${id}/default`,
};

export const FarmerCrops = {
  getAll: "/api/v1/farmer/crops",
  create: "/api/v1/farmer/crops",
  getOptions: "/api/v1/farmer/crops/options",
  getById: (id) => `/api/v1/farmer/crops/${id}`,
  update: (id) => `/api/v1/farmer/crops/${id}`,
  delete: (id) => `/api/v1/farmer/crops/${id}`,
  addStock: (id) => `/api/v1/farmer/crops/${id}/add-stock`,
};

export const FarmerSales = {
  getAll: "/api/v1/farmer/sales",
  create: "/api/v1/farmer/sales",
  getOptions: "/api/v1/farmer/sales/options",
  getById: (id) => `/api/v1/farmer/sales/${id}`,
  verifyOtp: (id) => `/api/v1/farmer/sales/${id}/verify-otp`,
  resendOtp: (id) => `/api/v1/farmer/sales/${id}/resend-otp`,
};

// --------------------------------------------------
// FARMER - NOTIFICATIONS
// --------------------------------------------------
export const FarmerNotifications = {
  stats: endpoint("GET", "/api/v1/farmer/notifications/stats"),
  getAll: endpoint("GET", "/api/v1/farmer/notifications"),
  create: endpoint("POST", "/api/v1/farmer/notifications"),
  markRead: endpoint("PATCH", "/api/v1/farmer/notifications/{id}/read"),
  markAllRead: endpoint("PATCH", "/api/v1/farmer/notifications/read-all"),
  delete: endpoint("DELETE", "/api/v1/farmer/notifications/{id}"),
};

export const FARMER_SALES = {
  BASE: "/api/v1/farmer/sales",
  OPTIONS: "/api/v1/farmer/sales/options",
  BY_ID: (id) => `/api/v1/farmer/sales/${id}`,
  VERIFY_OTP: (id) => `/api/v1/farmer/sales/${id}/verify-otp`,
  RESEND_OTP: (id) => `/api/v1/farmer/sales/${id}/resend-otp`,
};

export const FarmerProfile = {
  getAll: "/api/v1/farmer/profile/all",
  get: "/api/v1/farmer/profile",
  update: "/api/v1/farmer/profile",
  getBankDetails: "/api/v1/farmer/profile/bank-details",
  updateBankDetails: "/api/v1/farmer/profile/bank-details",
  sendMobileOtp: "/api/v1/farmer/profile/change-mobile/send-otp",
  verifyMobileOtp: "/api/v1/farmer/profile/change-mobile/verify-otp",
  changePassword: "/api/v1/farmer/profile/change-password",
};

export const VendorConfirmations = {
  summary: "/api/v1/vendor/confirmations/summary",
  getAll: "/api/v1/vendor/confirmations",
  create: "/api/v1/vendor/confirmations",
  getById: (id) => `/api/v1/vendor/confirmations/${id}`,
  verify: (id) => `/api/v1/vendor/confirmations/${id}/verify`,
  resend: (id) => `/api/v1/vendor/confirmations/${id}/resend`,
};

export const VendorLedger = {
  summary: "/api/v1/vendor/ledger/summary",
  dayTotals: "/api/v1/vendor/ledger/day-totals",
  getAll: "/api/v1/vendor/ledger",
  getById: (id) => `/api/v1/vendor/ledger/${id}`,
  paySupplier: "/api/v1/vendor/ledger/pay-supplier",
  receipts: "/api/v1/vendor/ledger/receipts",
  settle: (id) => `/api/v1/vendor/ledger/${id}/settle`,
};

export const VendorNotifications = {
  summary: "/api/v1/vendor/notifications/summary",
  getAll: "/api/v1/vendor/notifications",
  markRead: (id) => `/api/v1/vendor/notifications/${id}/read`,
  markAllRead: "/api/v1/vendor/notifications/read-all",
  delete: (id) => `/api/v1/vendor/notifications/${id}`,
};

export const VendorOrders = {
  summary: "/api/v1/vendor/orders/summary",
  getAll: "/api/v1/vendor/orders",
  getById: (id) => `/api/v1/vendor/orders/${id}`,
  updateStatus: (id) => `/api/v1/vendor/orders/${id}/status`,
  cancel: (id) => `/api/v1/vendor/orders/${id}/cancel`,
};

export const VendorProfile = {
  get: "/api/v1/vendor/profile",
  getById: (id) => `/api/v1/vendor/profile/${id}`,
  update: (id) => `/api/v1/vendor/profile/${id}`,
  getBankDetails: "/api/v1/vendor/profile/bank-details",
  updateBankDetails: "/api/v1/vendor/profile/bank-details",
  sendMobileOtp: "/api/v1/vendor/profile/mobile-change/request-otp",
  verifyMobileOtp: "/api/v1/vendor/profile/mobile-change/verify-otp",
};

export const VendorSales = {
  catalogSummary: "/api/v1/vendor/sales/catalog-summary",
  customers: "/api/v1/vendor/sales/customers",
  customerById: (id) => `/api/v1/vendor/sales/customers/${id}`,
  batches: "/api/v1/vendor/sales/batches",
  batchById: (id) => `/api/v1/vendor/sales/batches/${id}`,
  summary: "/api/v1/vendor/sales/summary",
  getAll: "/api/v1/vendor/sales",
  create: "/api/v1/vendor/sales",
  drafts: "/api/v1/vendor/sales/drafts",
  getById: (id) => `/api/v1/vendor/sales/${id}`,
  update: (id) => `/api/v1/vendor/sales/${id}`,
  delete: (id) => `/api/v1/vendor/sales/${id}`,
  submit: (id) => `/api/v1/vendor/sales/${id}/submit`,
};

// Aliases for backward compatibility
export const MIDDLEMAN_FARMERS = {
  BASE: "/api/v1/middleman/farmers",
  BY_ID: (id) => `/api/v1/middleman/farmers/${id}`,
  HISTORY: (id) => `/api/v1/middleman/farmers/${id}/history`,
};

export const MIDDLEMAN_PURCHASES = {
  BASE: "/api/v1/middleman/purchases",
  BY_ID: (id) => `/api/v1/middleman/purchases/${id}`,
};

export const MIDDLEMAN_VENDORS = {
  BASE: "/api/v1/middleman/vendors",
  BY_ID: (id) => `/api/v1/middleman/vendors/${id}`,
};

export const MIDDLEMAN_VENDOR_SALES = {
  BASE: "/api/v1/middleman/vendor-sales",
  BY_ID: (id) => `/api/v1/middleman/vendor-sales/${id}`,
};

export const AUTH = {
  LOGIN: "/api/v1/Auth/login",
  FORGOT_PASSWORD: "/api/v1/Auth/forgot-password",
  VERIFY_OTP: "/api/v1/Auth/verify-otp",
  RESET_PASSWORD: "/api/v1/Auth/reset-password",
};

export const REGISTRATION = {
  SEND_MOBILE_OTP: "/api/v1/Registration/send-mobile-otp",
  VERIFY_MOBILE_OTP: "/api/v1/Registration/verify-mobile-otp",
  REGISTER: "/api/v1/Registration",
};

export const ROLE_ACCESS = {
  FARMER: "/api/v1/role-access/farmer",
  CUSTOMER: "/api/v1/role-access/customer",
  MIDDLEMAN: "/api/v1/role-access/middleman",
  VENDOR: "/api/v1/role-access/vendor",
  PROFILE: "/api/v1/role-access/profile",
  BUSINESS_ACCESS: "/api/v1/role-access/business-access",
};

export const MIDDLEMAN_PROFILE = {
  PROFILE: "/api/v1/middleman/profile",
  BY_ID: (id) => `/api/v1/middleman/profile/${id}`,
  SEND_MOBILE_OTP: "/api/v1/middleman/profile/mobile/send-otp",
  VERIFY_MOBILE_OTP: "/api/v1/middleman/profile/mobile/verify-otp",
};

export const VENDOR_PROFILE = {
  PROFILE: "/api/v1/vendor/profile",
  BY_ID: (vendorId) => `/api/v1/vendor/profile/${vendorId}`,
  BANK_DETAILS: "/api/v1/vendor/profile/bank-details",
  REQUEST_MOBILE_OTP: "/api/v1/vendor/profile/mobile-change/request-otp",
  VERIFY_MOBILE_OTP: "/api/v1/vendor/profile/mobile-change/verify-otp",
};

export const CUSTOMER_PROFILE = {
  PROFILE: "/api/customer/profile",
  ADDRESSES: "/api/customer/profile/addresses",
  ADDRESS_BY_ID: (id) => `/api/customer/profile/addresses/${id}`,
  SET_DEFAULT_ADDRESS: (id) => `/api/customer/profile/addresses/${id}/default`,
  SEND_MOBILE_OTP: "/api/customer/profile/mobile/send-otp",
  VERIFY_MOBILE_OTP: "/api/customer/profile/mobile/verify-otp",
};

export const CUSTOMER = {
  DASHBOARD_SUMMARY: "/api/v1/customer/dashboard/summary",
  MARKETPLACE_CATEGORIES: "/api/v1/customer/marketplace/categories",
  MARKETPLACE_PRODUCTS: "/api/v1/customer/marketplace/products",
  MARKETPLACE_PRODUCT_BY_ID: (id) => `/api/v1/customer/marketplace/products/${id}`,
  CART: "/api/v1/customer/cart",
  CART_ITEMS: "/api/v1/customer/cart/items",
  CART_ITEM_BY_ID: (id) => `/api/v1/customer/cart/items/${id}`,
  CHECKOUT: "/api/v1/customer/cart/checkout",
  ORDERS: "/api/v1/customer/orders",
  ORDER_BY_ID: (id) => `/api/v1/customer/orders/${id}`,
  PURCHASES: "/api/v1/customer/purchases",
  PURCHASE_SUMMARY: "/api/v1/customer/purchases/summary",
  PURCHASE_BY_ID: (id) => `/api/v1/customer/purchases/${id}`,
  CONFIRMATIONS: "/api/v1/customer/confirmations",
  CONFIRMATION_BY_ID: (id) => `/api/v1/customer/confirmations/${id}`,
  VERIFY_CONFIRMATION: (id) => `/api/v1/customer/confirmations/${id}/verify`,
  RESEND_CONFIRMATION: (id) => `/api/v1/customer/confirmations/${id}/resend`,
  REJECT_CONFIRMATION: (id) => `/api/v1/customer/confirmations/${id}/reject`,
  NOTIFICATIONS: "/api/v1/customer/notifications",
  NOTIFICATION_SUMMARY: "/api/v1/customer/notifications/summary",
  MARK_NOTIFICATION_READ: (id) => `/api/v1/customer/notifications/${id}/read`,
  MARK_ALL_NOTIFICATIONS_READ: "/api/v1/customer/notifications/read-all",
  NOTIFICATION_BY_ID: (id) => `/api/v1/customer/notifications/${id}`,
};

export const FARMER_PROFILE = {
  ALL: "/api/v1/farmer/profile/all",
  PROFILE: "/api/v1/farmer/profile",
  BANK_DETAILS: "/api/v1/farmer/profile/bank-details",
  SEND_MOBILE_OTP: "/api/v1/farmer/profile/change-mobile/send-otp",
  VERIFY_MOBILE_OTP: "/api/v1/farmer/profile/change-mobile/verify-otp",
  CHANGE_PASSWORD: "/api/v1/farmer/profile/change-password",
};

const API_ENDPOINTS = {
  Auth,
  Registration,
  RoleAccess,
  CustomerProfile,
  FarmerCrops,
  FarmerSales,
  FarmerNotifications,
  FARMER_SALES,
  FarmerProfile,
  MiddlemanDashboard,
  MiddlemanFarmers,
  MiddlemanCustomers,
  MiddlemanCustomerSales,
  MiddlemanInventory,
  MiddlemanLedger,
  MiddlemanNotifications,
  MiddlemanOtpConfirmations,
  MiddlemanConfirmations,
  MiddlemanProfile,
  MiddlemanPurchases,
  MiddlemanTransactionHistory,
  MiddlemanVendorSales,
  MiddlemanVendors,
  VendorDashboard,
  VendorCustomers,
  VendorFarmers,
  VendorFinishedProducts,
  VendorMiddlemen,
  VendorProcessing,
  VendorPurchases,
  VendorRawMaterialInventory,
  VendorSales,
  VendorOrders,
  VendorLedger,
  VendorNotifications,
  VendorConfirmations,
  VendorProfile,
  MIDDLEMAN_FARMERS,
  MIDDLEMAN_PURCHASES,
  MIDDLEMAN_VENDORS,
  MIDDLEMAN_VENDOR_SALES,
  AUTH,
  REGISTRATION,
  ROLE_ACCESS,
  MIDDLEMAN_PROFILE,
  VENDOR_PROFILE,
  CUSTOMER_PROFILE,
  CUSTOMER,
  FARMER_PROFILE,
};

export default API_ENDPOINTS;

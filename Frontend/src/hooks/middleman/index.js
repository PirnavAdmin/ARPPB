import { useMiddleman } from '../../context/middleman';

export const useMiddlemanDashboard = () => {
  const { dashboardMetrics, purchases, vendorSales, customerSales, inventory, confirmations, ledger } = useMiddleman();

  return {
    metrics: dashboardMetrics,
    recentPurchases: purchases.slice(0, 5),
    recentVendorSales: vendorSales.slice(0, 5),
    recentCustomerSales: customerSales.slice(0, 5),
    pendingConfirmations: confirmations.filter((c) => c.otpStatus === 'Pending'),
    inventoryBatches: inventory,
    ledgerEntries: ledger.slice(0, 8),
  };
};

export const useFarmers = () => {
  const { farmers, addFarmer, updateFarmer, purchases, ledger } = useMiddleman();
  return {
    farmers,
    addFarmer,
    updateFarmer,
    getFarmerPurchases: (farmerId) => purchases.filter((p) => p.farmerId === farmerId),
    getFarmerLedger: (farmerId) => ledger.filter((l) => l.partyId === farmerId),
  };
};

export const useVendors = () => {
  const { vendors, addVendor, updateVendor, vendorSales, ledger } = useMiddleman();
  return {
    vendors,
    addVendor,
    updateVendor,
    getVendorSales: (vendorId) => vendorSales.filter((s) => s.vendorId === vendorId),
    getVendorLedger: (vendorId) => ledger.filter((l) => l.partyId === vendorId),
  };
};

export const useCustomers = () => {
  const { customers, addCustomer, updateCustomer, customerSales, ledger } = useMiddleman();
  return {
    customers,
    addCustomer,
    updateCustomer,
    getCustomerSales: (customerId) => customerSales.filter((s) => s.customerId === customerId),
    getCustomerLedger: (customerId) => ledger.filter((l) => l.partyId === customerId),
  };
};

export const usePurchases = () => {
  const { purchases, createPurchase, farmers } = useMiddleman();
  return {
    purchases,
    createPurchase,
    farmers,
  };
};

export const useSales = () => {
  const { vendorSales, customerSales, createVendorSale, createCustomerSale, vendors, customers, inventory } = useMiddleman();
  return {
    vendorSales,
    customerSales,
    createVendorSale,
    createCustomerSale,
    vendors,
    customers,
    inventory,
  };
};

export const useInventory = () => {
  const { inventory, purchases } = useMiddleman();
  return {
    batches: inventory,
    purchases,
  };
};

export const useLedger = () => {
  const { ledger, settleLedgerEntry, dashboardMetrics } = useMiddleman();
  return {
    ledger,
    settleLedgerEntry,
    metrics: dashboardMetrics,
  };
};

export const useConfirmations = () => {
  const { confirmations, confirmTransaction, rejectTransaction } = useMiddleman();
  return {
    confirmations,
    confirmTransaction,
    rejectTransaction,
  };
};

export const useNotifications = () => {
  const { notifications, markNotificationAsRead, markAllNotificationsAsRead } = useMiddleman();
  return {
    notifications,
    unreadCount: notifications.filter((n) => !n.isRead).length,
    markNotificationAsRead,
    markAllNotificationsAsRead,
  };
};

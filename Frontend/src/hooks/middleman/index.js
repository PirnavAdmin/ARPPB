import { useMiddleman } from '../../context/middleman';

export const useMiddlemanDashboard = () => {
  const { dashboardMetrics, purchases, vendorSales, customerSales, inventory, confirmations } = useMiddleman();

  return {
    metrics: dashboardMetrics,
    recentPurchases: purchases.slice(0, 5),
    recentVendorSales: vendorSales.slice(0, 5),
    recentCustomerSales: customerSales.slice(0, 5),
    pendingConfirmations: confirmations.filter((c) => c.otpStatus === 'Pending'),
    inventoryBatches: inventory,
  };
};

export const useFarmers = () => {
  const { farmers, addFarmer, updateFarmer, purchases } = useMiddleman();
  return {
    farmers,
    addFarmer,
    updateFarmer,
    getFarmerPurchases: (farmerId) => purchases.filter((p) => p.farmerId === farmerId),
  };
};

export const useVendors = () => {
  const { vendors, addVendor, updateVendor, vendorSales } = useMiddleman();
  return {
    vendors,
    addVendor,
    updateVendor,
    getVendorSales: (vendorId) => vendorSales.filter((s) => s.vendorId === vendorId),
  };
};

export const useCustomers = () => {
  const { customers, addCustomer, updateCustomer, customerSales } = useMiddleman();
  return {
    customers,
    addCustomer,
    updateCustomer,
    getCustomerSales: (customerId) => customerSales.filter((s) => s.customerId === customerId),
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

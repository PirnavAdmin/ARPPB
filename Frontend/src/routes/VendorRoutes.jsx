import { Routes, Route, Navigate } from 'react-router-dom';
import VendorLayout from '../pages/vendor/VendorLayout';
import VendorDashboard from '../pages/vendor/dashboard/VendorDashboard';
import Farmers from '../pages/vendor/farmers/Farmers';
import Middlemen from '../pages/vendor/middlemen/Middlemen';
import Customers from '../pages/vendor/customers/Customers';
import PurchaseFromFarmers from '../pages/vendor/purchases/PurchaseFromFarmers';
import PurchaseFromMiddlemen from '../pages/vendor/purchases/PurchaseFromMiddlemen';
import PurchaseHistory from '../pages/vendor/purchases/PurchaseHistory';
import RawMaterialInventory from '../pages/vendor/inventory/RawMaterialInventory';
import ProductProcessing from '../pages/vendor/processing/ProductProcessing';
import FinishedProducts from '../pages/vendor/finished-products/FinishedProducts';
import SellProducts from '../pages/vendor/sales/SellProducts';
import CustomerOrders from '../pages/vendor/orders/CustomerOrders';
import SalesHistory from '../pages/vendor/sales/SalesHistory';
import OTPConfirmations from '../pages/vendor/confirmations/OTPConfirmations';
import VendorLedger from '../pages/vendor/ledger/VendorLedger';
import Notifications from '../pages/vendor/notifications/Notifications';
import VendorProfile from '../pages/vendor/profile/VendorProfile';

export default function VendorRoutes() {
  return (
    <Routes>
      <Route element={<VendorLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<VendorDashboard />} />
        <Route path="farmers" element={<Farmers />} />
        <Route path="middlemen" element={<Middlemen />} />
        <Route path="customers" element={<Customers />} />
        <Route path="purchases/farmers" element={<PurchaseFromFarmers />} />
        <Route path="purchases/middlemen" element={<PurchaseFromMiddlemen />} />
        <Route path="purchases/history" element={<PurchaseHistory />} />
        <Route path="inventory" element={<RawMaterialInventory />} />
        <Route path="processing" element={<ProductProcessing />} />
        <Route path="finished-products" element={<FinishedProducts />} />
        <Route path="sales/new" element={<SellProducts />} />
        <Route path="sales/history" element={<SalesHistory />} />
        <Route path="orders" element={<CustomerOrders />} />
        <Route path="confirmations" element={<OTPConfirmations />} />
        <Route path="ledger" element={<VendorLedger />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="profile" element={<VendorProfile />} />
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Route>
    </Routes>
  );
}


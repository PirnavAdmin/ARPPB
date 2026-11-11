import { Routes, Route, Navigate } from 'react-router-dom';
import { CustomerProvider } from '../pages/customer/context/CustomerContext';
import CustomerLayout from '../pages/customer/layout/CustomerLayout';

import Dashboard from '../pages/customer/pages/Dashboard';
import BrowseProducts from '../pages/customer/pages/BrowseProducts';
import Categories from '../pages/customer/pages/Categories';
import MyCart from '../pages/customer/pages/MyCart';
import MyOrders from '../pages/customer/pages/MyOrders';
import PurchaseHistory from '../pages/customer/pages/PurchaseHistory';
import OTPConfirmations from '../pages/customer/pages/OTPConfirmations';
import Notifications from '../pages/customer/pages/Notifications';
import MyProfile from '../pages/customer/pages/MyProfile';

export default function CustomerRoutes() {
  return (
    <CustomerProvider>
      <Routes>
        <Route element={<CustomerLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="products" element={<BrowseProducts />} />
          <Route path="categories" element={<Categories />} />
          <Route path="cart" element={<MyCart />} />
          <Route path="orders" element={<MyOrders />} />
          <Route path="purchase-history" element={<PurchaseHistory />} />
          <Route path="confirmations" element={<OTPConfirmations />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="profile" element={<MyProfile />} />
          <Route path="*" element={<Navigate to="dashboard" replace />} />
        </Route>
      </Routes>
    </CustomerProvider>
  );
}

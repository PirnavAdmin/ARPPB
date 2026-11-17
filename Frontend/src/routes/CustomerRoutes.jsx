import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { CustomerProvider } from '../pages/customer/context/CustomerContext';
import CustomerLayout from '../pages/customer/layout/CustomerLayout';

const Dashboard = lazy(() => import('../pages/customer/pages/Dashboard'));
const BrowseProducts = lazy(() => import('../pages/customer/pages/BrowseProducts'));
const Categories = lazy(() => import('../pages/customer/pages/Categories'));
const MyCart = lazy(() => import('../pages/customer/pages/MyCart'));
const MyOrders = lazy(() => import('../pages/customer/pages/MyOrders'));
const PurchaseHistory = lazy(() => import('../pages/customer/pages/PurchaseHistory'));
const OTPConfirmations = lazy(() => import('../pages/customer/pages/OTPConfirmations'));
const Notifications = lazy(() => import('../pages/customer/pages/Notifications'));
const MyProfile = lazy(() => import('../pages/customer/pages/MyProfile'));

function CustomerPageLoading() {
  return <div className="p-6 text-sm text-[#64748B]" role="status">Loading Customer Portal page...</div>;
}

export default function CustomerRoutes() {
  return (
    <CustomerProvider>
      <Suspense fallback={<CustomerPageLoading />}>
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
      </Suspense>
    </CustomerProvider>
  );
}

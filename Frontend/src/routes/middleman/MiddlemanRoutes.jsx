import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { MiddlemanProvider } from '../../context/middleman/MiddlemanContext';
import {
  MiddlemanLayout,
  MiddlemanDashboard,
  FarmersPage,
  VendorsPage,
  CustomersPage,
  PurchaseFromFarmersPage,
  SalesToVendorsPage,
  SalesToCustomersPage,
  InventoryPage,
  SalesHistoryPage,
  OTPConfirmationsPage,
  LedgerPage,
  NotificationsPage,
  MiddlemanProfilePage,
} from '../../pages/Middleman';

/**
 * Dedicated Middleman Module Routing
 * Fully isolated from Authentication routes.
 */
export const MiddlemanRoutes = () => {
  return (
    <MiddlemanProvider>
      <Routes>
        <Route element={<MiddlemanLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<MiddlemanDashboard />} />

          {/* Farmer Management */}
          <Route path="farmers" element={<FarmersPage />} />
          <Route path="farmers/register" element={<FarmersPage initialOpenRegister />} />
          <Route path="farmers/add" element={<FarmersPage initialOpenRegister />} />
          <Route path="purchases" element={<PurchaseFromFarmersPage />} />
          <Route path="purchase-history" element={<Navigate to="/middleman/sales-history" state={{ activeTab: 'farmer' }} replace />} />

          {/* Vendor Management */}
          <Route path="vendors" element={<VendorsPage />} />
          <Route path="vendors/register" element={<VendorsPage initialOpenRegister />} />
          <Route path="vendors/add" element={<VendorsPage initialOpenRegister />} />
          <Route path="sales/vendors" element={<SalesToVendorsPage />} />
          <Route path="sales-to-vendors" element={<SalesToVendorsPage />} />
          <Route path="sales/vendors/history" element={<Navigate to="/middleman/sales-history" state={{ activeTab: 'vendor' }} replace />} />
          <Route path="vendor-sales-history" element={<Navigate to="/middleman/sales-history" state={{ activeTab: 'vendor' }} replace />} />

          {/* Customer Management */}
          <Route path="customers" element={<CustomersPage />} />
          <Route path="customers/register" element={<CustomersPage initialOpenRegister />} />
          <Route path="customers/add" element={<CustomersPage initialOpenRegister />} />
          <Route path="sales/customers" element={<SalesToCustomersPage />} />
          <Route path="sales-to-customers" element={<SalesToCustomersPage />} />
          <Route path="sales/customers/register" element={<CustomersPage initialOpenRegister />} />
          <Route path="sales/customers/history" element={<Navigate to="/middleman/sales-history" state={{ activeTab: 'customer' }} replace />} />
          <Route path="customer-sales-history" element={<Navigate to="/middleman/sales-history" state={{ activeTab: 'customer' }} replace />} />
          <Route path="sales/customers/draft-saved" element={<SalesToCustomersPage initialDraftSaved />} />
          <Route path="sales/customers/draft" element={<SalesToCustomersPage initialDraftSaved />} />
          <Route path="sales-to-customers/draft" element={<SalesToCustomersPage initialDraftSaved />} />
          <Route path="order-draft-save" element={<SalesToCustomersPage initialDraftSaved />} />

          {/* General Operations */}
          <Route path="inventory" element={<InventoryPage />} />
          <Route path="sales-history" element={<SalesHistoryPage />} />
          <Route path="transaction-history" element={<SalesHistoryPage />} />
          <Route path="sales-order-history" element={<SalesHistoryPage />} />
          <Route path="confirmations" element={<OTPConfirmationsPage />} />
          <Route path="otp-confirmations" element={<Navigate to="/middleman/confirmations" replace />} />
          <Route path="otp" element={<Navigate to="/middleman/confirmations" replace />} />
          <Route path="ledger" element={<LedgerPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="profile" element={<MiddlemanProfilePage />} />
          <Route path="*" element={<Navigate to="dashboard" replace />} />
        </Route>
      </Routes>
    </MiddlemanProvider>
  );
};

export default MiddlemanRoutes;

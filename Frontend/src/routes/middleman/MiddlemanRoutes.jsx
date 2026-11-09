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
          <Route path="farmers" element={<FarmersPage />} />
          <Route path="vendors" element={<VendorsPage />} />
          <Route path="customers" element={<CustomersPage />} />
          <Route path="purchases" element={<PurchaseFromFarmersPage />} />
          <Route path="sales/vendors" element={<SalesToVendorsPage />} />
          <Route path="sales/customers" element={<SalesToCustomersPage />} />
          <Route path="inventory" element={<InventoryPage />} />
          <Route path="sales-history" element={<SalesHistoryPage />} />
          <Route path="confirmations" element={<OTPConfirmationsPage />} />
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


import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import ProtectedRoute from './ProtectedRoute';
import VendorRoutes from './VendorRoutes';

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<Navigate to="/vendor/dashboard" replace />} />
        <Route
          path="/vendor/*"
          element={
            <ProtectedRoute>
              <VendorRoutes />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/vendor/dashboard" replace />} />
      </Route>
    </Routes>
  );
}


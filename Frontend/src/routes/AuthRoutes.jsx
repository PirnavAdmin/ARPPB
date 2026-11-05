import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import RegisterPage from '../pages/auth/registration/RegisterPage';
import LoginPage from '../pages/auth/login/LoginPage';
import ForgotPasswordPage from '../pages/auth/forgot-password/ForgotPasswordPage';
import ResetPasswordPage from '../pages/auth/reset-password/ResetPasswordPage';

/**
 * Route Configuration for AgriConnect Authentication System
 * Exclusively provides the 4 requested authentication pages.
 */
export const AuthRoutes = () => {
  return (
    <Routes>
      {/* Root redirect to Login */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* 4 Required Authentication Routes */}
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {/* Wildcard redirect to Login */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default AuthRoutes;


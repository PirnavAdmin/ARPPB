import React from 'react';
import { Routes, Route, Navigate, useNavigate, Link } from 'react-router-dom';
import {
  LoginPage,
  RegisterPage,
  ForgotPasswordPage,
  ResetPasswordPage,
} from '../pages/Authentication';
import MiddlemanRoutes from './middleman/MiddlemanRoutes';
import { Sprout, LogOut, CheckCircle2, ArrowRight } from 'lucide-react';

/**
 * Lightweight mock dashboard for demonstrating successful authentication flow
 */
const MockDashboard = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#F5FAF8] flex flex-col">
      <header className="bg-white border-b border-[#E2E8F0] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#CCFBF1] flex items-center justify-center text-[#0F766E]">
            <Sprout className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-[#172B29] leading-tight">AgriConnect</h1>
            <p className="text-[11px] text-[#64748B]">Purchase &amp; Billing Management System</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E2E8F0] hover:bg-slate-50 text-xs font-semibold text-[#172B29] cursor-pointer transition-colors"
        >
          <LogOut className="w-3.5 h-3.5 text-[#64748B]" />
          <span>Sign Out</span>
        </button>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full p-6 sm:p-10">
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 sm:p-8 shadow-xs space-y-6">
          <div>
            <div className="flex items-center gap-3 text-[#16A34A] mb-2">
              <CheckCircle2 className="w-6 h-6" />
              <h2 className="text-lg font-bold text-[#172B29]">Authentication Successful</h2>
            </div>
            <p className="text-sm text-[#64748B]">
              You are signed in to the AgriConnect ERP workspace. Select your business portal to continue.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-teal-50/60 border border-teal-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-[#0F766E] uppercase tracking-wider block">
                Active Business Module
              </span>
              <h3 className="text-base font-bold text-[#1F2937] mt-0.5">
                Middleman Enterprise Portal (14 Screens)
              </h3>
              <p className="text-xs text-[#64748B] mt-1">
                Access farmer procurement, inventory batches, vendor/customer sales, OTP confirmations, and ledger.
              </p>
            </div>

            <Link
              to="/middleman/dashboard"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-[#0F766E] text-white hover:bg-[#115E59] shadow-md shadow-[#0F766E]/20 transition-all flex-shrink-0"
            >
              <span>Launch Middleman Portal</span>
              <ArrowRight className="w-4 h-4 text-[#CCFBF1]" />
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

/**
 * Core Application Routes
 * Strictly provides the 4 requested authentication pages, plus an isolated Middleman module.
 */
export const AppRoutes = () => {
  return (
    <Routes>
      {/* Root redirect to Login */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* 4 Required Authentication Routes (Strictly Untouched) */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {/* Auth landing preview */}
      <Route path="/dashboard" element={<MockDashboard />} />

      {/* Independent Middleman Enterprise Module Routes */}
      <Route path="/middleman/*" element={<MiddlemanRoutes />} />

      {/* Wildcard redirect */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default AppRoutes;


import { Routes, Route, Navigate, useNavigate, Link } from 'react-router-dom';
import {
  Sprout,
  LogOut,
  CheckCircle2,
  ArrowRight,
  Wheat,
  Handshake,
} from 'lucide-react';
import {
  LoginPage,
  RegisterPage,
  ForgotPasswordPage,
  ResetPasswordPage,
} from '../pages/Authentication';
import MainLayout from '../layouts/MainLayout';
import ProtectedRoute from './ProtectedRoute';
import VendorRoutes from './VendorRoutes';
import MiddlemanRoutes from './middleman/MiddlemanRoutes';
import { useAuth } from '../hooks/useAuth';

/**
 * Unified Authenticated ERP Workspace Portal Hub (/dashboard)
 * Connects Authentication flow with both the Vendor Enterprise Portal (Pavan)
 * and the Middleman Enterprise Portal (Harsha).
 */
function WorkspacePortalHub() {
  const navigate = useNavigate();
  const { user, vendorUser, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#F5FAF8] flex flex-col">
      <header className="bg-white border-b border-[#E2E8F0] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#CCFBF1] flex items-center justify-center text-[#0F766E]">
            <Sprout className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-[#172B29] leading-tight">
              AgriConnect ERP
            </h1>
            <p className="text-[11px] text-[#64748B]">
              Agri Raw Product Purchase &amp; Billing Management System
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {user?.contactNumber && (
            <span className="hidden sm:inline-block px-3 py-1 rounded-full bg-[#CCFBF1] text-[#0F766E] text-xs font-bold">
              +91 {user.contactNumber}
            </span>
          )}
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-[#E2E8F0] hover:bg-slate-50 text-xs font-semibold text-[#172B29] cursor-pointer transition-colors"
          >
            <LogOut className="w-3.5 h-3.5 text-[#64748B]" />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full p-6 sm:p-10">
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 sm:p-8 shadow-xs space-y-6">
          <div>
            <div className="flex items-center gap-3 text-[#16A34A] mb-2">
              <CheckCircle2 className="w-6 h-6" />
              <h2 className="text-lg font-bold text-[#172B29]">
                Authentication Active — Select Enterprise Portal
              </h2>
            </div>
            <p className="text-sm text-[#64748B]">
              Welcome to the unified AgriConnect ERP workspace. Launch either the{' '}
              <strong>Vendor Portal</strong> or the <strong>Middleman Portal</strong> below.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Vendor Enterprise Portal Card */}
            <div className="p-6 rounded-2xl bg-teal-50/60 border border-teal-200 flex flex-col justify-between gap-5">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#0F766E] uppercase tracking-wider">
                    Vendor Module • 17 Screens
                  </span>
                  <div className="p-2 rounded-xl bg-[#0F766E] text-white">
                    <Wheat className="w-4 h-4" />
                  </div>
                </div>
                <h3 className="text-base font-extrabold text-[#1F2937]">
                  Vendor Enterprise Portal
                </h3>
                <p className="text-xs text-[#64748B] leading-relaxed">
                  {vendorUser?.businessName || 'Sri Rayalaseema Agri Commodities'} — Manage
                  farmer &amp; middleman purchases, OTP verification, raw material inventory,
                  batch processing, finished products, customer orders, sales, and ledger.
                </p>
              </div>

              <Link
                to="/vendor/dashboard"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-[#0F766E] text-white hover:bg-[#115E59] shadow-md shadow-[#0F766E]/20 transition-all"
              >
                <span>Launch Vendor Portal</span>
                <ArrowRight className="w-4 h-4 text-[#CCFBF1]" />
              </Link>
            </div>

            {/* Middleman Enterprise Portal Card */}
            <div className="p-6 rounded-2xl bg-teal-50/60 border border-teal-200 flex flex-col justify-between gap-5">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#0F766E] uppercase tracking-wider">
                    Middleman Module • 14 Screens
                  </span>
                  <div className="p-2 rounded-xl bg-[#14B8A6] text-white">
                    <Handshake className="w-4 h-4" />
                  </div>
                </div>
                <h3 className="text-base font-extrabold text-[#1F2937]">
                  Middleman Enterprise Portal
                </h3>
                <p className="text-xs text-[#64748B] leading-relaxed">
                  Access farmer procurement, inventory batches, sales to vendors &amp;
                  customers, purchase/sales histories, OTP confirmations, notifications, and
                  middleman ledger.
                </p>
              </div>

              <Link
                to="/middleman/dashboard"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-[#0F766E] text-white hover:bg-[#115E59] shadow-md shadow-[#0F766E]/20 transition-all"
              >
                <span>Launch Middleman Portal</span>
                <ArrowRight className="w-4 h-4 text-[#CCFBF1]" />
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

/**
 * Root Redirect Helper based on Authentication State
 */
function RootRedirect() {
  const { isAuthenticated } = useAuth();
  return <Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />;
}

/**
 * Centralized Application Routes
 * Integrates Authentication Routes, Vendor Portal Routes, and Middleman Portal Routes.
 */
export function AppRoutes() {
  return (
    <Routes>
      {/* Root redirect based on authentication */}
      <Route path="/" element={<RootRedirect />} />

      {/* Public Authentication Routes (Harsha) */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {/* Protected Enterprise Modules wrapped in MainLayout */}
      <Route element={<MainLayout />}>
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <WorkspacePortalHub />
            </ProtectedRoute>
          }
        />

        {/* Vendor Portal Routes (Pavan - 17 Screens) */}
        <Route
          path="/vendor/*"
          element={
            <ProtectedRoute>
              <VendorRoutes />
            </ProtectedRoute>
          }
        />

        {/* Middleman Portal Routes (Harsha - 14 Screens) */}
        <Route
          path="/middleman/*"
          element={
            <ProtectedRoute>
              <MiddlemanRoutes />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Wildcard fallback */}
      <Route path="*" element={<RootRedirect />} />
    </Routes>
  );
}

export default AppRoutes;


import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import {
  Sprout,
  LogOut,
  CheckCircle2,
  ArrowRight,
  Wheat,
  Handshake,
  ShoppingBag,
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
import CustomerRoutes from './CustomerRoutes';
import FarmerApp from '../pages/farmer/FarmerApp';
import { useAuth } from '../hooks/useAuth';

/**
 * Unified Authenticated ERP Workspace Portal Hub (/dashboard)
 * Connects the Authentication flow with all four portals:
 * 1. Vendor Portal
 * 2. Middleman Portal
 * 3. Farmer Portal
 * 4. Customer Portal
 */
function WorkspacePortalHub() {
  const navigate = useNavigate();
  const { user, role, vendorUser, switchPortalRole, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleLaunchPortal = (targetRole, targetPath) => {
    switchPortalRole(targetRole);
    navigate(targetPath);
  };

  const portals = [
    {
      roleKey: 'vendor',
      badge: 'Vendor Module • 16 Screens',
      title: 'Vendor Portal',
      description: `${
        vendorUser?.businessName || 'Sri Rayalaseema Agri Commodities'
      } — Manage farmer & middleman purchases, OTP verification, raw material inventory, batch processing, finished products, customer orders, and sales.`,
      path: '/vendor/dashboard',
      buttonLabel: 'Launch Vendor Portal',
      icon: Wheat,
      iconBg: 'bg-[#0F766E]',
    },
    {
      roleKey: 'middleman',
      badge: 'Middleman Module • 13 Screens',
      title: 'Middleman Portal',
      description:
        'Access farmer procurement, inventory batches, sales to vendors & customers, purchase/sales histories, OTP confirmations, and notifications.',
      path: '/middleman/dashboard',
      buttonLabel: 'Launch Middleman Portal',
      icon: Handshake,
      iconBg: 'bg-[#14B8A6]',
    },
    {
      roleKey: 'farmer',
      badge: 'Farmer Module • 7 Screens',
      title: 'Farmer Portal',
      description:
        'Manage harvested crops, live mandi market prices, product sales to vendors & middlemen, OTP buyer confirmations, notifications, and farmer profile.',
      path: '/farmer',
      buttonLabel: 'Launch Farmer Portal',
      icon: Sprout,
      iconBg: 'bg-[#0F766E]',
    },
    {
      roleKey: 'customer',
      badge: 'Customer Module • 6 Screens',
      title: 'Customer Portal',
      description:
        'Browse agricultural products marketplace, place and track purchase orders, review billing invoices, monitor payment summaries, and manage customer profile.',
      path: '/customer/dashboard',
      buttonLabel: 'Launch Customer Portal',
      icon: ShoppingBag,
      iconBg: 'bg-[#14B8A6]',
    },
  ];

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
          {role && (
            <span className="hidden md:inline-block px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-[#0F766E] text-xs font-bold capitalize">
              Role: {role}
            </span>
          )}
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

      <main className="flex-1 max-w-6xl mx-auto w-full p-6 sm:p-10">
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 sm:p-8 shadow-xs space-y-6">
          <div>
            <div className="flex items-center gap-3 text-[#16A34A] mb-2">
              <CheckCircle2 className="w-6 h-6" />
              <h2 className="text-lg font-bold text-[#172B29]">
                Authentication Active — Select Enterprise Portal
              </h2>
            </div>
            <p className="text-sm text-[#64748B]">
              Welcome to the unified AgriConnect ERP workspace. Launch the{' '}
              <strong>Vendor Portal</strong>, <strong>Middleman Portal</strong>,{' '}
              <strong>Farmer Portal</strong>, or <strong>Customer Portal</strong>{' '}
              below.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {portals.map((portal) => {
              const Icon = portal.icon;
              const isCurrentRole = role === portal.roleKey;

              return (
                <div
                  key={portal.roleKey}
                  className={`p-6 rounded-2xl border flex flex-col justify-between gap-5 transition-all ${
                    isCurrentRole
                      ? 'bg-teal-50/90 border-[#0F766E] ring-1 ring-[#0F766E]/25'
                      : 'bg-teal-50/60 border-teal-200'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#0F766E] uppercase tracking-wider">
                          {portal.badge}
                        </span>
                        {isCurrentRole && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#0F766E] text-white">
                            Active Role
                          </span>
                        )}
                      </div>
                      <div className={`p-2 rounded-xl ${portal.iconBg} text-white`}>
                        <Icon className="w-4 h-4" />
                      </div>
                    </div>
                    <h3 className="text-base font-extrabold text-[#1F2937]">
                      {portal.title}
                    </h3>
                    <p className="text-xs text-[#64748B] leading-relaxed">
                      {portal.description}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleLaunchPortal(portal.roleKey, portal.path)}
                    className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-[#0F766E] text-white hover:bg-[#115E59] shadow-md shadow-[#0F766E]/20 transition-all cursor-pointer"
                  >
                    <span>{portal.buttonLabel}</span>
                    <ArrowRight className="w-4 h-4 text-[#CCFBF1]" />
                  </button>
                </div>
              );
            })}
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
 * Integrates Authentication Routes, Vendor Portal, Middleman Portal, Farmer Portal, and Customer Portal.
 */
export function AppRoutes() {
  return (
    <Routes>
      {/* Root redirect based on authentication */}
      <Route path="/" element={<RootRedirect />} />

      {/* Public Authentication Routes */}
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

        {/* 1. Vendor Portal Routes */}
        <Route
          path="/vendor/*"
          element={
            <ProtectedRoute allowedRoles={['vendor']}>
              <VendorRoutes />
            </ProtectedRoute>
          }
        />

        {/* 2. Middleman Portal Routes */}
        <Route
          path="/middleman/*"
          element={
            <ProtectedRoute allowedRoles={['middleman']}>
              <MiddlemanRoutes />
            </ProtectedRoute>
          }
        />

        {/* 3. Farmer Portal Routes */}
        <Route
          path="/farmer/*"
          element={
            <ProtectedRoute allowedRoles={['farmer']}>
              <FarmerApp />
            </ProtectedRoute>
          }
        />

        {/* 4. Customer Portal Routes */}
        <Route
          path="/customer/*"
          element={
            <ProtectedRoute allowedRoles={['customer']}>
              <CustomerRoutes />
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

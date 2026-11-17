import { useMemo } from 'react';
import { FarmerProvider, useFarmer } from './context/FarmerContext';
import FarmerSidebar from './components/FarmerSidebar';
import FarmerNavbar from './components/FarmerNavbar';
import TransactionModal from './components/TransactionModal';
import OTPModal from './components/OTPModal';

import FarmerDashboard from './pages/FarmerDashboard';
import MyCrops from './pages/MyCrops';
import MarketPrices from './pages/MarketPrices';
import SellProducts from './pages/SellProducts';
import MySales from './pages/MySales';
import OTPConfirmations from './pages/OTPConfirmations';
import Notifications from './pages/Notifications';
import MyProfile from './pages/MyProfile';

function FarmerLayoutContent() {
  const {
    activePage,
    selectedTransaction,
    setSelectedTransaction,
    activeOtpRequest,
    setActiveOtpRequest,
    isSidebarCollapsed,
    setIsSidebarCollapsed,
    isMobileDrawerOpen,
    setIsMobileDrawerOpen,
    toast,
    hideToast,
  } = useFarmer();

  const currentPage = useMemo(() => {
    switch (activePage) {
      case 'dashboard':
        return <FarmerDashboard />;
      case 'crops':
        return <MyCrops />;
      case 'prices':
        return <MarketPrices />;
      case 'sell':
        return <SellProducts />;
      case 'sales':
        return <MySales />;
      case 'otp':
        return <OTPConfirmations />;
      case 'notifications':
        return <Notifications />;
      case 'profile':
        return <MyProfile />;
      default:
        return <FarmerDashboard />;
    }
  }, [activePage]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex [&_svg]:!max-w-none [&_svg]:shrink-0 [&_.text-\[10px\]]:!text-[10px] [&_.text-\[11px\]]:!text-[11px] [&_.text-xs]:!text-xs [&_.text-sm]:!text-sm [&_.text-base]:!text-base [&_.text-lg]:!text-lg [&_.text-xl]:!text-xl [&_.sm\:text-sm]:sm:!text-sm [&_.font-normal]:!font-normal [&_.font-medium]:!font-medium [&_.font-semibold]:!font-semibold [&_.font-bold]:!font-bold [&_.font-extrabold]:!font-extrabold">
      <FarmerSidebar
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
        isMobileOpen={isMobileDrawerOpen}
        onCloseMobile={() => setIsMobileDrawerOpen(false)}
      />

      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
          isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'
        }`}
      >
        <FarmerNavbar
          onOpenMobileSidebar={() => setIsMobileDrawerOpen(true)}
          onToggleDesktopSidebar={() => setIsSidebarCollapsed((prev) => !prev)}
        />

        <main className="flex-1 p-4 sm:p-6 max-w-[1600px] w-full mx-auto">
          {currentPage}
        </main>

        <footer className="px-6 py-3 border-t border-[#E2E8F0] bg-white text-xs text-[#64748B] flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            Agri Raw Product Purchase &amp; Billing Management ERP • Farmer Portal v2.4
          </span>
          <span>
            Kurnool Integrated Hub • Verified Agricultural Producer &amp; Mandi Settlement System
          </span>
        </footer>
      </div>

      {/* Global Transaction Details Modal */}
      {selectedTransaction && (
        <TransactionModal
          transaction={selectedTransaction}
          onClose={() => setSelectedTransaction(null)}
        />
      )}

      {/* Global OTP Confirmation Modal */}
      {activeOtpRequest && (
        <OTPModal
          request={activeOtpRequest}
          onClose={() => setActiveOtpRequest(null)}
        />
      )}

      {/* Global Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border bg-white ${
            toast.type === 'success'
              ? 'border-emerald-200 text-emerald-800'
              : toast.type === 'error'
              ? 'border-red-200 text-red-800'
              : 'border-[#14B8A6]/30 text-[#0F766E]'
          }`}
        >
          <span className="text-lg">
            {toast.type === 'success' ? '✅' : toast.type === 'error' ? '❌' : 'ℹ️'}
          </span>
          <div className="text-xs sm:text-sm font-semibold">{toast.message}</div>
          <button
            type="button"
            onClick={hideToast}
            className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}

export function FarmerLayout() {
  return (
    <FarmerProvider>
      <FarmerLayoutContent />
    </FarmerProvider>
  );
}

export default FarmerLayout;

import { useMemo } from 'react';
import { FarmerProvider, useFarmer, farmerNavItems } from './context/FarmerContext';
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
    <div className="farmer-shell">
      <FarmerSidebar items={farmerNavItems} />

      <div className="farmer-main-panel">
        <FarmerNavbar />
        <main className="farmer-page">{currentPage}</main>
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
        <div className={`farmer-toast ${toast.type}`}>
          <span style={{ fontSize: '1.2rem' }}>
            {toast.type === 'success' ? '✅' : toast.type === 'error' ? '❌' : 'ℹ️'}
          </span>
          <div style={{ flex: 1, fontSize: '0.88rem', fontWeight: 500, color: 'var(--farmer-text)' }}>
            {toast.message}
          </div>
          <button
            type="button"
            onClick={hideToast}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--farmer-secondary)',
              fontSize: '1rem',
            }}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}

function FarmerLayout() {
  return (
    <FarmerProvider>
      <FarmerLayoutContent />
    </FarmerProvider>
  );
}

export default FarmerLayout;

import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFarmer, farmerNavItems } from '../context/FarmerContext';
import { useAuth } from '../../../hooks/useAuth';

function FarmerNavbar() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const {
    activePage,
    navigateTo,
    searchQuery,
    setSearchQuery,
    profile,
    unreadNotificationsCount,
    isMobileDrawerOpen,
    setIsMobileDrawerOpen,
  } = useFarmer();

  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef(null);

  // Close dropdown when clicked outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setIsProfileMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentNav = farmerNavItems.find((item) => item.key === activePage) || {
    label: 'Farmer Dashboard',
  };

  const handleSearchKeyDown = (event) => {
    if (event.key !== 'Enter') return;

    const query = searchQuery.trim().toLowerCase();
    if (!query) return;

    if (query.includes('sale') || query.includes('sales')) {
      navigateTo('sales');
      return;
    }

    if (query.includes('crop') || query.includes('harvest')) {
      navigateTo('crops');
      return;
    }

    if (query.includes('price') || query.includes('market') || query.includes('mandi')) {
      navigateTo('prices');
      return;
    }

    if (query.includes('stock')) {
      navigateTo('stock');
      return;
    }

    if (query.includes('payment') || query.includes('balance')) {
      navigateTo('sales');
      return;
    }

    if (query.includes('otp')) {
      navigateTo('otp');
      return;
    }

    if (query.includes('notif') || query.includes('alert')) {
      navigateTo('notifications');
    }
  };

  return (
    <header className="farmer-topbar">
      <div className="farmer-topbar-left">
        {/* Mobile Hamburger Drawer Trigger */}
        <button
          type="button"
          className="farmer-mobile-toggle"
          onClick={() => setIsMobileDrawerOpen(!isMobileDrawerOpen)}
          aria-label="Toggle navigation drawer"
        >
          <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div>
          <div className="farmer-breadcrumbs">
            <span className="crumb-link" onClick={() => navigateTo('dashboard')}>
              AgriConnect
            </span>
            <span>/</span>
            <span className="crumb-link" onClick={() => navigateTo('dashboard')}>
              Farmer Portal
            </span>
            <span>/</span>
            <span className="current">{currentNav.label}</span>
          </div>
          <h1 className="farmer-topbar-title">{currentNav.label}</h1>
        </div>
      </div>

      <div className="farmer-topbar-right">
        {/* Global Search Bar */}
        <div className="farmer-search-box">
          <span className="farmer-search-icon">
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Search crop, buyer, invoice..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearchKeyDown}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                right: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'transparent',
                border: 'none',
                color: 'var(--farmer-secondary)',
                fontSize: '1rem',
                cursor: 'pointer',
              }}
            >
              ✕
            </button>
          )}
        </div>

        {/* Notification Bell */}
        <button
          type="button"
          className="farmer-action-icon-btn"
          onClick={() => navigateTo('notifications')}
          title="Notifications"
          aria-label="Notifications"
        >
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          {unreadNotificationsCount > 0 && (
            <span className="badge-pill">{unreadNotificationsCount}</span>
          )}
        </button>

        {/* Farmer Profile Menu Dropdown */}
        <div style={{ position: 'relative' }} ref={profileMenuRef}>
          <div
            className="farmer-userbox"
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            role="button"
            tabIndex={0}
          >
            <div className="farmer-avatar sm">
              {profile.farmerName.split(' ').map((n) => n[0]).join('').slice(0, 2)}
            </div>
            <div className="farmer-userbox-text">
              <strong>{profile.farmerName}</strong>
              <span>Registered Farmer</span>
            </div>
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--farmer-secondary)' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>

          {isProfileMenuOpen && (
            <div
              style={{
                position: 'absolute',
                right: 0,
                top: 'calc(100% + 8px)',
                width: 240,
                background: 'var(--farmer-white)',
                borderRadius: 14,
                boxShadow: 'var(--farmer-shadow-lg)',
                border: '1px solid var(--farmer-border)',
                padding: '8px 0',
                zIndex: 60,
                animation: 'modalPop 0.2s ease',
              }}
            >
              <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--farmer-border)' }}>
                <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>{profile.farmerName}</div>
                <div style={{ fontSize: '0.76rem', color: 'var(--farmer-secondary)' }}>{profile.email}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--farmer-primary)', fontWeight: 600, marginTop: 2 }}>
                  {profile.membership}
                </div>
              </div>

              <div style={{ padding: '4px 0' }}>
                <button
                  type="button"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    width: '100%',
                    padding: '9px 16px',
                    border: 'none',
                    background: 'transparent',
                    textAlign: 'left',
                    color: 'var(--farmer-text)',
                    fontSize: '0.88rem',
                  }}
                  onClick={() => {
                    navigateTo('profile');
                    setIsProfileMenuOpen(false);
                  }}
                >
                  👤 My Profile & Bank Details
                </button>

                <button
                  type="button"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    width: '100%',
                    padding: '9px 16px',
                    border: 'none',
                    background: 'transparent',
                    textAlign: 'left',
                    color: 'var(--farmer-text)',
                    fontSize: '0.88rem',
                  }}
                  onClick={() => {
                    navigateTo('stock');
                    setIsProfileMenuOpen(false);
                  }}
                >
                  📦 Stock & Inventory
                </button>

                <button
                  type="button"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    width: '100%',
                    padding: '9px 16px',
                    border: 'none',
                    background: 'transparent',
                    textAlign: 'left',
                    color: 'var(--farmer-primary)',
                    fontWeight: 600,
                    fontSize: '0.88rem',
                  }}
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    navigate('/dashboard');
                  }}
                >
                  🌐 Workspace Portal Hub
                </button>

                <button
                  type="button"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    width: '100%',
                    padding: '9px 16px',
                    border: 'none',
                    background: 'transparent',
                    textAlign: 'left',
                    color: '#DC2626',
                    fontWeight: 600,
                    fontSize: '0.88rem',
                  }}
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    logout();
                    navigate('/login');
                  }}
                >
                  🚪 Sign Out
                </button>
              </div>

              <div style={{ padding: '6px 16px', borderTop: '1px solid var(--farmer-border)' }}>
                <small style={{ color: 'var(--farmer-secondary)', fontSize: '0.72rem' }}>
                  Kisan ID: {profile.farmerId}
                </small>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default FarmerNavbar;

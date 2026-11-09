import { useFarmer } from '../context/FarmerContext';

// Clean, consistent agricultural & portal SVG icons
const navIcons = {
  dashboard: (
    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),
  crops: (
    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v18m0-18C8.5 7 5 10 5 14c0 3 2.5 5 7 7m0-18c3.5 4 7 7 7 11 0 3-2.5 5-7 7" />
    </svg>
  ),
  prices: (
    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
    </svg>
  ),
  sell: (
    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  sales: (
    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
  ),
  purchases: (
    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
    </svg>
  ),
  stock: (
    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  ),
  otp: (
    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  ),
  ledger: (
    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  ),
  bell: (
    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  ),
  profile: (
    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
};

function FarmerSidebar({ items }) {
  const {
    activePage,
    navigateTo,
    profile,
    isSidebarCollapsed,
    setIsSidebarCollapsed,
    isMobileDrawerOpen,
    setIsMobileDrawerOpen,
    pendingOtpCount,
    unreadNotificationsCount,
  } = useFarmer();

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileDrawerOpen && (
        <div
          className="farmer-drawer-backdrop"
          onClick={() => setIsMobileDrawerOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`farmer-sidebar ${isSidebarCollapsed ? 'collapsed' : ''} ${
          isMobileDrawerOpen ? 'mobile-open' : ''
        }`}
      >
        {/* Brand Header */}
        <div className="farmer-sidebar-header">
          <div className="farmer-brand">
            <div className="farmer-brand-logo" title="AgriConnect">
              🌾
            </div>
            {!isSidebarCollapsed && (
              <div className="farmer-brand-title">
                <strong>AgriConnect</strong>
                <span>Farmer Portal</span>
              </div>
            )}
          </div>

          <button
            type="button"
            className="farmer-collapse-btn"
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label="Toggle sidebar collapse"
          >
            <svg
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              style={{
                transform: isSidebarCollapsed ? 'rotate(180deg)' : 'none',
                transition: 'transform 0.2s',
              }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </button>
        </div>

        {/* Farmer Profile Mini Card */}

        {/* Navigation Menu */}
        <nav className="farmer-nav-menu" aria-label="Farmer Portal Navigation">
          {items.map((item) => {
            const isActive = activePage === item.key;
            let badge = null;
            if (item.key === 'otp' && pendingOtpCount > 0) {
              badge = pendingOtpCount;
            } else if (item.key === 'notifications' && unreadNotificationsCount > 0) {
              badge = unreadNotificationsCount;
            }

            return (
              <button
                key={item.key}
                type="button"
                className={`farmer-nav-btn ${isActive ? 'active' : ''}`}
                onClick={() => navigateTo(item.key)}
                title={item.label}
              >
                <span className="farmer-nav-icon">{navIcons[item.icon] || '🌱'}</span>
                {!isSidebarCollapsed && (
                  <span className="farmer-nav-label">{item.label}</span>
                )}
                {!isSidebarCollapsed && badge !== null && (
                  <span className="farmer-nav-badge">{badge}</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer Support Info */}
        {!isSidebarCollapsed && (
          <div
            style={{
              padding: '16px 20px',
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              fontSize: '0.75rem',
              color: 'rgba(255, 255, 255, 0.6)',
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
            }}
          >
            <span style={{ fontSize: '0.7rem', marginTop: 4 }}>AgriConnect Platform v2.4</span>
          </div>
        )}
      </aside>
    </>
  );
}

export default FarmerSidebar;

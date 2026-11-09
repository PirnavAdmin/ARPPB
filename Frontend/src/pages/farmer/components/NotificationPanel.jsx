import { useFarmer } from '../context/FarmerContext';

function NotificationPanel({ items = [], showHeader = true }) {
  const { markNotificationAsRead, navigateTo, setSelectedTransaction, sales } = useFarmer();

  const handleNotificationClick = (item) => {
    markNotificationAsRead(item.id);

    if (item.targetId && item.targetId.startsWith('TXN-')) {
      const match = sales.find((s) => s.id === item.targetId);
      if (match) {
        setSelectedTransaction(match);
      }
    }

    if (item.targetPage) {
      const target = item.targetPage === 'sales' || item.targetPage === 'otp' || item.targetPage === 'stock' || item.targetPage === 'purchases' || item.targetPage === 'profile' || item.targetPage === 'prices' || item.targetPage === 'dashboard' || item.targetPage === 'sell' || item.targetPage === 'notifications' || item.targetPage === 'crops' ? item.targetPage : 'dashboard';
      navigateTo(target);
    }
  };

  const getToneStyle = (type) => {
    switch (type) {
      case 'success':
        return { bg: '#E8F5EC', border: '#C3ECD0', dot: 'var(--farmer-success)' };
      case 'warning':
        return { bg: '#FFF7ED', border: '#FED7AA', dot: 'var(--farmer-warning)' };
      case 'danger':
        return { bg: '#FEF2F2', border: '#FECACA', dot: 'var(--farmer-danger)' };
      case 'info':
      default:
        return { bg: '#EFF6FF', border: '#BFDBFE', dot: 'var(--farmer-blue)' };
    }
  };

  return (
    <div className="farmer-card" style={{ padding: '20px' }}>
      {showHeader && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
            paddingBottom: 12,
            borderBottom: '1px solid var(--farmer-border)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h3 style={{ margin: 0, fontSize: '1.15rem' }}>Platform Alerts</h3>
            {items.some((i) => !i.read) && (
              <span className="farmer-nav-badge" style={{ margin: 0 }}>
                {items.filter((i) => !i.read).length} New
              </span>
            )}
          </div>
          <button
            type="button"
            className="farmer-btn farmer-btn-outline farmer-btn-sm"
            onClick={() => navigateTo('notifications')}
          >
            View All
          </button>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px', color: 'var(--farmer-secondary)' }}>
            No alerts at this moment.
          </div>
        ) : (
          items.map((item) => {
            const tone = getToneStyle(item.type);
            return (
              <div
                key={item.id}
                onClick={() => handleNotificationClick(item)}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                  padding: '12px 14px',
                  borderRadius: 12,
                  backgroundColor: item.read ? '#FCFDFC' : tone.bg,
                  border: `1px solid ${item.read ? 'var(--farmer-border)' : tone.border}`,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    backgroundColor: tone.dot,
                    marginTop: 5,
                    flexShrink: 0,
                  }}
                />

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ fontSize: '0.9rem', color: 'var(--farmer-text)' }}>
                      {item.title}
                    </strong>
                    <span style={{ fontSize: '0.74rem', color: 'var(--farmer-secondary)' }}>
                      {item.time}
                    </span>
                  </div>

                  <p
                    style={{
                      margin: '4px 0 0',
                      fontSize: '0.82rem',
                      color: 'var(--farmer-secondary)',
                      lineHeight: 1.4,
                    }}
                  >
                    {item.detail}
                  </p>

                  {item.targetPage && (
                    <span
                      style={{
                        display: 'inline-block',
                        marginTop: 6,
                        fontSize: '0.74rem',
                        fontWeight: 600,
                        color: 'var(--farmer-primary)',
                      }}
                    >
                      Action: Click to view details →
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default NotificationPanel;

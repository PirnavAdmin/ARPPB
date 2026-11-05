import { useMemo, useState } from 'react'
import './Dashboard.css'

const allDashboardItems = [
  "Today's Purchase",
  "Today's Sales",
  'Purchase Quantity',
  'Sales Quantity',
  'Total Stock',
  'Supplier Payable',
  'Customer Receivable',
  'Cash Balance',
  'Bank Balance',
  'Pending Bills',
  'Purchase Trend',
  'Welcome back, Bhanu!',
  'Dashboard',
]

const menuItems = [
  'Dashboard',
  'Farmers',
  'Suppliers',
  'Products',
  'Purchase',
  'Weighment',
  'Quality Check',
  'Settings',
  'Logout',
]

const overviewCards = [
  {
    title: "Today's Purchase",
    value: '₹1,25,000',
    delta: '+12.5%',
    meta: 'Compared to yesterday',
    icon: 'cart',
    details: [
      'Purchase volume: 425.50 Qtl',
      'Active buyers: 18',
      'Vendor payment status: 2 pending',
    ],
  },
  {
    title: 'Total Sales',
    value: '₹85,000',
    delta: '+8.2%',
    meta: 'Compared to yesterday',
    icon: 'chart',
    details: [
      'Overall sales: ₹85,000',
      'Cash received: ₹62,000',
      'Pending receivables: ₹23,000',
    ],
  },
  {
    title: 'Total Stock',
    value: '2,450 kg',
    delta: '+5.4%',
    meta: 'Available inventory',
    icon: 'warehouse',
    details: [
      'Current stock: 2,450 kg',
      'Storage status: healthy',
      'Fast-moving products: Paddy, Cotton',
    ],
  },
  {
    title: 'Supplier Payable',
    value: '₹45,000',
    delta: 'Pending',
    meta: 'Payments to suppliers',
    icon: 'wallet',
    details: [
      'Total payable: ₹45,000',
      'Due this week: ₹21,000',
      'Supplier health: stable',
    ],
  },
]

const highlightCards = [
  { title: "Today's Purchase", value: '₹18,50,000', subtitle: 'Daily purchase value' },
  { title: "Today's Sales", value: '₹22,75,000', subtitle: 'Daily sales value' },
  { title: 'Supplier Payable', value: '₹8,50,000', subtitle: 'Outstanding to suppliers' },
  { title: 'Cash Balance', value: '₹4,80,000', subtitle: 'Available cash' },
]

const chartData = [
  { label: 'Jan', purchase: 60, sales: 80 },
  { label: 'Feb', purchase: 74, sales: 92 },
  { label: 'Mar', purchase: 68, sales: 88 },
  { label: 'Apr', purchase: 82, sales: 96 },
  { label: 'May', purchase: 90, sales: 110 },
  { label: 'Jun', purchase: 76, sales: 98 },
  { label: 'Jul', purchase: 84, sales: 102 },
]

const kpiCards = [
  { title: "Today's Purchase", value: '₹18,50,000', subtitle: 'Daily purchase value' },
  { title: "Today's Sales", value: '₹22,75,000', subtitle: 'Daily sales value' },
  { title: 'Purchase Quantity', value: '425.50 Qtl', subtitle: 'Purchase volume' },
  { title: 'Sales Quantity', value: '510.30 Qtl', subtitle: 'Sales volume' },
  { title: 'Total Stock', value: '1,250 Qtl', subtitle: 'Inventory available' },
  { title: 'Supplier Payable', value: '₹8,50,000', subtitle: 'Outstanding to suppliers' },
  { title: 'Customer Receivable', value: '₹6,20,000', subtitle: 'Receivables from buyers' },
  { title: 'Cash Balance', value: '₹4,80,000', subtitle: 'Available cash' },
  { title: 'Bank Balance', value: '₹9,20,000', subtitle: 'Bank funds' },
  { title: 'Pending Bills', value: '₹2,25,000', subtitle: 'Bills awaiting clearance' },
]

const quickActions = ['Add Purchase', 'New Farmer', 'Supplier Payment', 'Inventory Check']

function Dashboard() {
  const [lastUpdated, setLastUpdated] = useState('Just now')
  const [selectedCard, setSelectedCard] = useState(null)
  const [searchText, setSearchText] = useState('')

  const filteredKpis = useMemo(() => {
    const query = searchText.trim().toLowerCase()
    if (!query) return kpiCards

    return kpiCards.filter((card) => 
      card.title.toLowerCase().includes(query) ||
      card.subtitle.toLowerCase().includes(query)
    )
  }, [searchText])

  const activeSummary = useMemo(
    () =>
      selectedCard || {
        title: "Today's Purchase",
        value: '₹1,25,000',
        details: ['Last refreshed successfully.', 'Business data is updated.'],
      },
    [selectedCard],
  )

  const handleRefresh = () => {
    const now = new Date()
    const formatted = now.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    })

    setLastUpdated(`Updated at ${formatted}`)
    setSelectedCard({
      title: 'Dashboard Refresh',
      value: 'Live data loaded',
      details: [
        'Purchase details synced successfully.',
        'Sales inventory list refreshed.',
        'Current status: all records updated.',
      ],
    })
  }

  const handleCardClick = (card) => {
    setSelectedCard({
      title: card.title,
      value: card.value,
      details: card.details,
    })
  }

  return (
    <div className="agri-layout">
      <aside className="sidebar">
        <div className="brand-box">
          <div className="brand-icon">⍟</div>
          <div className="brand-copy">
            <span className="brand-name">AgriTrade</span>
            <span className="brand-subtitle">Purchase Management</span>
          </div>
        </div>

        <div className="nav-title">MAIN MENU</div>

        <nav className="nav-menu" aria-label="Sidebar navigation">
          {menuItems.map((item, index) => (
            <button
              key={item}
              type="button"
              className={`nav-item ${index === 0 ? 'active' : ''}`}
            >
              <span className="nav-icon">{index === 0 ? '▣' : index === 1 ? '◔' : index === 2 ? '◫' : index === 3 ? '◧' : index === 4 ? '◌' : index === 5 ? '△' : index === 6 ? '◍' : index === 7 ? '⚙' : '⇠'}</span>
              <span>{item}</span>
            </button>
          ))}
        </nav>
      </aside>

      <main className="main-panel">
        <header className="topbar">
          <div className="topbar-header">
            <h1>Dashboard</h1>
            <p>Welcome to your AgriTrade workspace</p>
          </div>

          <div className="topbar-actions">
            <label className="search-box" aria-label="Search">
              <span className="search-icon">⌕</span>
              <input
                type="text"
                placeholder="Search here..."
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
              />
            </label>

            <button type="button" className="icon-button" aria-label="Notifications">
              🔔
            </button>

            <div className="account-box">
              <div className="account-avatar">B</div>
              <div className="account-copy">
                <span>Bhanu</span>
                <small>Account</small>
              </div>
            </div>
          </div>
        </header>

        <section className="welcome-banner">
          <div>
            <h2>Welcome back, Bhanu!</h2>
            <p>Here's what's happening with your business today.</p>
          </div>

          <button type="button" className="refresh-btn" onClick={handleRefresh}>
            ↻ Refresh
          </button>
        </section>

        <section className="highlight-section">
          <div className="highlight-grid">
            {highlightCards.map((card) => (
              <button
                key={card.title}
                type="button"
                className="highlight-card"
                onClick={() => handleCardClick({
                  title: card.title,
                  value: card.value,
                  details: [card.subtitle, 'Current status: monitored in dashboard.', 'Updated for the active business cycle.'],
                })}
              >
                <span className="kpi-label">{card.title}</span>
                <strong>{card.value}</strong>
                <small>{card.subtitle}</small>
              </button>
            ))}
          </div>
        </section>

        <section className="chart-panel">
          <div className="chart-header">
            <div>
              <h3>Purchase Trend</h3>
              <p>Monthly purchase vs sales overview</p>
            </div>
            <span className="chart-badge">This Year</span>
          </div>

          <div className="chart-legend">
            <span><i className="legend-dot purchase-dot" /> Purchase</span>
            <span><i className="legend-dot sales-dot" /> Sales</span>
          </div>

          <div className="bar-chart" aria-label="Purchase and sales trend chart">
            {chartData.map((item) => (
              <div key={item.label} className="chart-column">
                <div className="bar-stack">
                  <span
                    className="bar purchase-bar"
                    style={{ height: `${item.purchase}%` }}
                    title={`${item.label} purchase: ${item.purchase}%`}
                  />
                  <span
                    className="bar sales-bar"
                    style={{ height: `${item.sales}%` }}
                    title={`${item.label} sales: ${item.sales}%`}
                  />
                </div>
                <small>{item.label}</small>
              </div>
            ))}
          </div>
        </section>

        <section className="kpi-section">
          <div className="kpi-grid">
            {filteredKpis.length === 0 ? (
              <div className="no-search-results">
                No matching dashboard item found for “{searchText}”
              </div>
            ) : (
              filteredKpis.map((card) => (
                <button
                  key={card.title}
                  type="button"
                  className="kpi-card"
                  onClick={() => handleCardClick({
                    title: card.title,
                    value: card.value,
                    details: [card.subtitle, 'Current status: monitored in dashboard.', 'Updated for the active business cycle.'],
                  })}
                >
                  <span className="kpi-label">{card.title}</span>
                  <strong>{card.value}</strong>
                  <small>{card.subtitle}</small>
                </button>
              ))
            )}
          </div>
        </section>

      </main>

      {selectedCard && (
        <div className="popup-overlay" onClick={() => setSelectedCard(null)}>
          <div className="popup-card" onClick={(event) => event.stopPropagation()}>
            <button type="button" className="popup-close" onClick={() => setSelectedCard(null)}>
              ×
            </button>
            <div className="popup-header">
              <span className="popup-badge">Live update</span>
              <span className="popup-time">{lastUpdated}</span>
            </div>
            <h3>{activeSummary.title}</h3>
            <div className="popup-value">{activeSummary.value}</div>
            <ul>
              {activeSummary.details.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard

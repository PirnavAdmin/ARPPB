import { useMemo, useState } from 'react';
import { useFarmer } from '../context/FarmerContext';
import DashboardCard from '../components/DashboardCard';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import { formatCurrency, formatDate, buyerCategoryStyles } from '../utils/farmerHelpers';

function FarmerDashboard() {
  const {
    crops,
    sales,
    otpRequests,
    ledger,
    searchQuery,
    navigateTo,
    setSelectedTransaction,
    setActiveOtpRequest,
    profile,
  } = useFarmer();

  const [activeChartMetric, setActiveChartMetric] = useState('value'); // 'value' or 'quantity'

  // Summary Metrics Calculated in Real-Time
  const totalCropTypes = crops.length;
  const totalAvailableStock = useMemo(
    () => crops.reduce((sum, c) => sum + (Number(c.availableQuantity) || 0), 0),
    [crops]
  );
  const totalQuantitySold = useMemo(
    () => crops.reduce((sum, c) => sum + (Number(c.soldQuantity) || 0), 0),
    [crops]
  );
  const totalSalesAmount = useMemo(
    () =>
      sales
        .filter((s) => s.transactionStatus === 'Confirmed')
        .reduce((sum, s) => sum + (Number(s.totalAmount) || 0), 0),
    [sales]
  );
  const expectedReceivables = useMemo(
    () =>
      sales
        .filter(
          (s) =>
            s.transactionStatus === 'Confirmed' &&
            s.paymentStatus === 'Payment Expected'
        )
        .reduce((sum, s) => sum + (Number(s.totalAmount) || 0), 0),
    [sales]
  );
  const pendingOtpList = useMemo(
    () => otpRequests.filter((o) => o.otpStatus === 'Pending'),
    [otpRequests]
  );

  const searchTerm = (searchQuery || '').trim().toLowerCase();

  // Recent Sales (latest 5)
  const recentSales = useMemo(() => {
    if (!searchTerm) return sales.slice(0, 5);

    return sales.filter((item) => {
      const haystack = [
        item.id,
        item.cropName,
        item.buyerName,
        item.buyerCategory,
        item.transactionStatus,
        item.otpStatus,
      ]
        .join(' ')
        .toLowerCase();

      return haystack.includes(searchTerm);
    });
  }, [sales, searchTerm]);

  // Monthly Sales Chart Data
  const monthlyData = [
    { month: 'Sep', qty: 110, value: 2.85 },
    { month: 'Oct', qty: 160, value: 4.12 },
    { month: 'Nov', qty: 195, value: 5.34 },
    { month: 'Dec', qty: 240, value: 6.95 },
    { month: 'Jan', qty: 310, value: 8.64 },
    { month: 'Feb', qty: 380, value: 10.42 },
  ];

  // Crop-wise Sales Breakdown
  const cropSalesBreakdown = [
    { name: 'Paddy', qty: 195, value: 4.38, pct: 36, color: '#237A45' },
    { name: 'Turmeric', qty: 40, value: 3.36, pct: 28, color: '#D97706' },
    { name: 'Groundnut', qty: 70, value: 4.27, pct: 20, color: '#B45309' },
    { name: 'Maize', qty: 95, value: 2.51, pct: 10, color: '#EAB308' },
    { name: 'Chilli & Cotton', qty: 45, value: 5.37, pct: 6, color: '#DC2626' },
  ];

  // Sales Distribution by Buyer Category
  const buyerDistribution = [
    { category: 'Middlemen', count: 4, amount: 952500, share: 45, color: '#3478C7' },
    { category: 'Vendors', count: 5, amount: 812800, share: 38, color: '#6B21A8' },
    { category: 'Customers', count: 2, amount: 352500, share: 17, color: '#16A34A' },
  ];

  // Expected Payments Status
  const paymentBreakdown = [
    { label: 'Expected (Within 3 Days)', amount: expectedReceivables, color: '#E99A24', pct: 62 },
    { label: 'Received & Settled', amount: 677800, color: '#16A34A', pct: 33 },
    { label: 'Delayed / Audit Pending', amount: 75000, color: '#DC4545', pct: 5 },
  ];

  const recentSalesColumns = [
    {
      key: 'id',
      label: 'Txn ID',
      render: (val, row) => (
        <span
          style={{ fontWeight: 700, color: 'var(--farmer-primary)', cursor: 'pointer' }}
          onClick={() => setSelectedTransaction(row)}
        >
          {val}
        </span>
      ),
    },
    {
      key: 'date',
      label: 'Date',
      render: (val) => formatDate(val),
    },
    {
      key: 'cropName',
      label: 'Crop Name',
      render: (val) => <strong>{val}</strong>,
    },
    {
      key: 'buyerName',
      label: 'Buyer Name',
    },
    {
      key: 'buyerCategory',
      label: 'Buyer Category',
      render: (val) => {
        const style = buyerCategoryStyles[val] || { bg: '#F1F5F9', color: '#475569' };
        return (
          <span
            className="buyer-badge"
            style={{ backgroundColor: style.bg, color: style.color }}
          >
            {val}
          </span>
        );
      },
    },
    {
      key: 'quantity',
      label: 'Qty Sold',
      render: (val, row) => `${val} ${row.unit}`,
    },
    {
      key: 'rate',
      label: 'Rate',
      render: (val, row) => `${formatCurrency(val)}/${row.unit}`,
    },
    {
      key: 'totalAmount',
      label: 'Total Amount',
      render: (val) => (
        <strong style={{ color: 'var(--farmer-primary)' }}>{formatCurrency(val)}</strong>
      ),
    },
    {
      key: 'transactionStatus',
      label: 'Txn Status',
      badge: 'transactionStatus',
    },
    {
      key: 'otpStatus',
      label: 'OTP Status',
      badge: 'otpStatus',
    },
    {
      key: 'expectedPaymentDate',
      label: 'Expected Payment',
      render: (val) => formatDate(val),
    },
    {
      key: 'actions',
      label: 'Action',
      render: (_, row) => (
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            type="button"
            className="farmer-btn farmer-btn-outline farmer-btn-sm"
            onClick={() => setSelectedTransaction(row)}
          >
            Details
          </button>
          <button
            type="button"
            className="farmer-btn farmer-btn-secondary farmer-btn-sm"
            onClick={() => navigateTo('ledger')}
          >
            Ledger
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      {searchTerm && (
        <div
          style={{
            background: '#F0FDF4',
            border: '1px solid #C3ECD0',
            borderRadius: 14,
            padding: '12px 14px',
            marginBottom: 18,
            color: 'var(--farmer-primary)',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <span>
            Search results for <strong>"{searchQuery}"</strong>
          </span>
          <span style={{ color: 'var(--farmer-secondary)', fontWeight: 600 }}>
            {recentSales.length} match{recentSales.length === 1 ? '' : 'es'} found
          </span>
        </div>
      )}

      {/* Hero Welcome Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #E8F5EC 0%, #D4EEDC 100%)',
          borderRadius: 20,
          border: '1px solid #C3ECD0',
          padding: '24px 28px',
          marginBottom: 24,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 20,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: '#FFFFFF',
              color: 'var(--farmer-dark)',
              padding: '4px 12px',
              borderRadius: 999,
              fontSize: '0.76rem',
              fontWeight: 700,
              marginBottom: 8,
              boxShadow: 'var(--farmer-shadow-sm)',
            }}
          >
            <span style={{ color: '#16A34A' }}>●</span> Live Agricultural Trading Dashboard
          </div>
          <h2 style={{ margin: '0 0 6px', fontSize: '1.7rem', color: 'var(--farmer-dark)' }}>
            Welcome back, {profile.farmerName}!
          </h2>
          <p style={{ margin: 0, color: 'var(--farmer-secondary)', fontSize: '0.94rem', maxWidth: 640 }}>
            {profile.farmName} • {profile.village}, {profile.district}. Market rates for Paddy and Chilli are trending upward across AP and Telangana mandis today.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            type="button"
            className="farmer-btn farmer-btn-primary"
            onClick={() => navigateTo('sell')}
          >
            ➕ Create Sale Order
          </button>
          <button
            type="button"
            className="farmer-btn farmer-btn-secondary"
            onClick={() => navigateTo('crops')}
          >
            🌾 Manage Crops
          </button>
          <button
            type="button"
            className="farmer-btn farmer-btn-outline"
            onClick={() => navigateTo('prices')}
          >
            📈 Mandi Prices
          </button>
        </div>
      </div>

      {/* 6 Summary Cards */}
      <div className="farmer-stat-grid">
        <DashboardCard
          label="Total Crop Types"
          value={`${totalCropTypes} Crops`}
          trend="+2 This Season"
          tone="positive"
          description="Paddy, Turmeric, Groundnut & more"
          onClick={() => navigateTo('crops')}
          icon={
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v18m0-18C8.5 7 5 10 5 14c0 3 2.5 5 7 7m0-18c3.5 4 7 7 7 11 0 3-2.5 5-7 7" />
            </svg>
          }
        />

        <DashboardCard
          label="Total Available Stock"
          value={`${totalAvailableStock} qtl`}
          trend="In 3 Storage Bays"
          tone="neutral"
          description="Ready for sale & verified dispatch"
          onClick={() => navigateTo('stock')}
          icon={
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          }
        />

        <DashboardCard
          label="Total Quantity Sold"
          value={`${totalQuantitySold} qtl`}
          trend="+18.4% MoM"
          tone="positive"
          description="Dispatched across 8 orders"
          onClick={() => navigateTo('sales')}
          icon={
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />

        <DashboardCard
          label="Total Sales Amount"
          value={formatCurrency(totalSalesAmount)}
          trend="+14.2% Growth"
          tone="positive"
          description="Confirmed transactions value"
          onClick={() => navigateTo('sales')}
          icon={
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />

        <DashboardCard
          label="Expected Receivables"
          value={formatCurrency(expectedReceivables)}
          trend="Due in 3 Days"
          tone="warning"
          description="Awaiting bank settlement after OTP"
          onClick={() => navigateTo('ledger')}
          icon={
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
        />

        <DashboardCard
          label="Pending OTP Confirmations"
          value={`${pendingOtpList.length} Orders`}
          trend={pendingOtpList.length > 0 ? 'Action Required' : 'All Clear'}
          tone={pendingOtpList.length > 0 ? 'warning' : 'positive'}
          description="Buyer verification pending"
          onClick={() => navigateTo('otp')}
          icon={
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          }
        />
      </div>

      {/* 4 Professional Charts Grid */}
      <div className="farmer-charts-grid">
        {/* Chart 1: Monthly Crop Sales */}
        <div className="farmer-card farmer-chart-container">
          <div className="farmer-chart-header">
            <div>
              <h4>Monthly Crop Sales Growth</h4>
              <span>Quantity (qtl) vs Sales Turnover (₹ in Lakhs)</span>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                type="button"
                className={`farmer-btn farmer-btn-sm ${activeChartMetric === 'value' ? 'farmer-btn-primary' : 'farmer-btn-outline'}`}
                onClick={() => setActiveChartMetric('value')}
              >
                ₹ Value
              </button>
              <button
                type="button"
                className={`farmer-btn farmer-btn-sm ${activeChartMetric === 'quantity' ? 'farmer-btn-primary' : 'farmer-btn-outline'}`}
                onClick={() => setActiveChartMetric('quantity')}
              >
                Quintals (qtl)
              </button>
            </div>
          </div>

          {/* Clean Bar Visualization */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14, height: 180, paddingTop: 20, borderBottom: '1px solid var(--farmer-border)' }}>
            {monthlyData.map((d) => {
              const maxVal = activeChartMetric === 'value' ? 12 : 420;
              const current = activeChartMetric === 'value' ? d.value : d.qty;
              const heightPct = Math.round((current / maxVal) * 100);

              return (
                <div key={d.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--farmer-primary)', marginBottom: 4 }}>
                    {activeChartMetric === 'value' ? `₹${d.value}L` : `${d.qty}q`}
                  </span>
                  <div
                    style={{
                      width: '75%',
                      height: `${heightPct}%`,
                      background: 'linear-gradient(180deg, #237A45 0%, #155D35 100%)',
                      borderRadius: '6px 6px 0 0',
                      transition: 'height 0.4s ease',
                    }}
                  />
                  <span style={{ fontSize: '0.78rem', color: 'var(--farmer-secondary)', marginTop: 8 }}>
                    {d.month}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chart 2: Crop-Wise Sales Breakdown */}
        <div className="farmer-card farmer-chart-container">
          <div className="farmer-chart-header">
            <div>
              <h4>Crop-Wise Sales Volume</h4>
              <span>Distribution across harvested crops</span>
            </div>
            <span style={{ fontSize: '0.78rem', color: 'var(--farmer-primary)', fontWeight: 600 }}>
              Total 440 qtl
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
            {cropSalesBreakdown.map((item) => (
              <div key={item.name}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', marginBottom: 4 }}>
                  <strong>{item.name}</strong>
                  <span style={{ color: 'var(--farmer-secondary)' }}>
                    {item.qty} qtl (₹{item.value} Lakhs) • <strong>{item.pct}%</strong>
                  </span>
                </div>
                <div style={{ height: 8, backgroundColor: '#F1F5F9', borderRadius: 999, overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${item.pct}%`,
                      height: '100%',
                      backgroundColor: item.color,
                      borderRadius: 999,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chart 3: Sales Distribution (Middlemen vs Vendors vs Customers) */}
        <div className="farmer-card farmer-chart-container">
          <div className="farmer-chart-header">
            <div>
              <h4>Sales Channel Distribution</h4>
              <span>Sold to Middlemen, Vendors & Direct Consumers</span>
            </div>
            <span style={{ fontSize: '0.78rem', color: 'var(--farmer-secondary)' }}>
              100% Verified Trades
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 10 }}>
            {buyerDistribution.map((b) => (
              <div
                key={b.category}
                style={{
                  padding: '16px 12px',
                  borderRadius: 12,
                  background: '#F9FAF9',
                  border: '1px solid var(--farmer-border)',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: b.color }}>
                  {b.share}%
                </div>
                <strong style={{ fontSize: '0.88rem', display: 'block', marginTop: 4 }}>
                  {b.category}
                </strong>
                <span style={{ fontSize: '0.78rem', color: 'var(--farmer-secondary)' }}>
                  {formatCurrency(b.amount)}
                </span>
                <div style={{ fontSize: '0.72rem', color: 'var(--farmer-primary)', fontWeight: 600, marginTop: 4 }}>
                  {b.count} Orders
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 14, height: 10, display: 'flex', borderRadius: 999, overflow: 'hidden' }}>
            <div style={{ width: '45%', backgroundColor: '#3478C7' }} title="Middlemen: 45%" />
            <div style={{ width: '38%', backgroundColor: '#6B21A8' }} title="Vendors: 38%" />
            <div style={{ width: '17%', backgroundColor: '#16A34A' }} title="Customers: 17%" />
          </div>
        </div>

        {/* Chart 4: Expected Payments Overview */}
        <div className="farmer-card farmer-chart-container">
          <div className="farmer-chart-header">
            <div>
              <h4>Expected Payments & Cashflow</h4>
              <span>Settlement timeline status for farm accounts</span>
            </div>
            <button
              type="button"
              className="farmer-btn farmer-btn-outline farmer-btn-sm"
              onClick={() => navigateTo('ledger')}
            >
              Open Ledger →
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
            {paymentBreakdown.map((p) => (
              <div
                key={p.label}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  borderRadius: 10,
                  backgroundColor: '#FCFDFC',
                  border: '1px solid var(--farmer-border)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      backgroundColor: p.color,
                    }}
                  />
                  <strong style={{ fontSize: '0.88rem' }}>{p.label}</strong>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <strong style={{ fontSize: '0.96rem', color: 'var(--farmer-text)' }}>
                    {formatCurrency(p.amount)}
                  </strong>
                  <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--farmer-secondary)' }}>
                    {p.pct}% of monthly revenue
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pending OTP Confirmations Quick Action Panel */}
      {pendingOtpList.length > 0 && (
        <div className="farmer-card" style={{ padding: '20px', marginBottom: 24, border: '2px solid #FED7AA' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div>
              <h3 style={{ margin: 0, color: 'var(--farmer-text)' }}>
                ⚡ Pending OTP Confirmations ({pendingOtpList.length})
              </h3>
              <p style={{ margin: '4px 0 0', fontSize: '0.86rem', color: 'var(--farmer-secondary)' }}>
                Incoming purchase requests require OTP confirmation before reserved stock is deducted and payment process initiates.
              </p>
            </div>
            <button
              type="button"
              className="farmer-btn farmer-btn-primary farmer-btn-sm"
              onClick={() => navigateTo('otp')}
            >
              View All OTPs
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 14 }}>
            {pendingOtpList.map((otp) => (
              <div
                key={otp.id}
                style={{
                  padding: '16px',
                  borderRadius: 12,
                  backgroundColor: '#FFFDF9',
                  border: '1px solid #FED7AA',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <strong style={{ color: 'var(--farmer-primary)', fontSize: '0.88rem' }}>
                      {otp.transactionId}
                    </strong>
                    <StatusBadge status={otp.otpStatus} />
                  </div>
                  <div style={{ fontSize: '0.94rem', fontWeight: 700 }}>
                    {otp.crop} • {otp.quantity} {otp.unit}
                  </div>
                  <div style={{ fontSize: '0.84rem', color: 'var(--farmer-secondary)', marginTop: 2 }}>
                    Buyer: <strong>{otp.buyerName}</strong> ({otp.buyerCategory})
                  </div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--farmer-dark)', marginTop: 8 }}>
                    {formatCurrency(otp.totalAmount)}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                  <button
                    type="button"
                    className="farmer-btn farmer-btn-primary farmer-btn-sm"
                    style={{ flex: 1 }}
                    onClick={() => setActiveOtpRequest(otp)}
                  >
                    🔐 Confirm OTP
                  </button>
                  <button
                    type="button"
                    className="farmer-btn farmer-btn-outline farmer-btn-sm"
                    onClick={() => {
                      const match = sales.find((s) => s.id === otp.transactionId);
                      if (match) setSelectedTransaction(match);
                    }}
                  >
                    Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Sales Table */}
      <div className="farmer-card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <h3 style={{ margin: 0 }}>Recent Sales Transactions</h3>
            <span style={{ fontSize: '0.84rem', color: 'var(--farmer-secondary)' }}>
              Latest transactions across Middleman, Vendor, and Direct Consumer channels
            </span>
          </div>
          <button
            type="button"
            className="farmer-btn farmer-btn-outline farmer-btn-sm"
            onClick={() => navigateTo('sales')}
          >
            View Full Sales History ({sales.length}) →
          </button>
        </div>

        <DataTable columns={recentSalesColumns} rows={recentSales} />
      </div>
    </div>
  );
}

export default FarmerDashboard;

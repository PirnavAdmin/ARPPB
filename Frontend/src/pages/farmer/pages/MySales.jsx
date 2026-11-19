import { useState, useMemo, useEffect } from 'react';
import { useFarmer } from '../context/FarmerContext';
import DataTable from '../components/DataTable';
import { formatCurrency, formatDate, buyerCategoryStyles } from '../utils/farmerHelpers';

function MySales() {
  const { sales, searchQuery, setSelectedTransaction, setActiveOtpRequest, otpRequests, navigateTo } = useFarmer();

  // Filters
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [cropFilter, setCropFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [otpFilter, setOtpFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;

  // Unique crops for filter
  const uniqueCrops = useMemo(() => {
    return Array.from(new Set(sales.map((s) => s.cropName)));
  }, [sales]);

  // Filtered sales
  const filteredSales = useMemo(() => {
    return sales.filter((item) => {
      const matchSearch =
        !searchQuery ||
        item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.cropName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.buyerName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchCategory =
        categoryFilter === 'All' || item.buyerCategory === categoryFilter;

      const matchCrop = cropFilter === 'All' || item.cropName === cropFilter;

      const matchStatus =
        statusFilter === 'All' || item.transactionStatus === statusFilter;

      const matchOtp =
        otpFilter === 'All' || item.otpStatus === otpFilter;

      return matchSearch && matchCategory && matchCrop && matchStatus && matchOtp;
    });
  }, [sales, searchQuery, categoryFilter, cropFilter, statusFilter, otpFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredSales.length / pageSize));
  const paginatedSales = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredSales.slice(start, start + pageSize);
  }, [filteredSales, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, categoryFilter, cropFilter, statusFilter, otpFilter]);

  // Summary Metrics
  const totalVolume = useMemo(
    () => filteredSales.reduce((acc, s) => acc + (Number(s.quantity) || 0), 0),
    [filteredSales]
  );
  const totalTurnover = useMemo(
    () =>
      filteredSales
        .filter((s) => s.transactionStatus === 'Confirmed')
        .reduce((acc, s) => acc + (Number(s.totalAmount) || 0), 0),
    [filteredSales]
  );
  const pendingCount = useMemo(
    () => filteredSales.filter((s) => s.transactionStatus === 'Pending Confirmation').length,
    [filteredSales]
  );

  const columns = [
    {
      key: 'id',
      label: 'Transaction ID',
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
      key: 'buyerName',
      label: 'Buyer Name & Phone',
      render: (val, row) => (
        <div>
          <strong style={{ fontSize: '0.92rem' }}>{val}</strong>
          <small style={{ display: 'block', color: 'var(--farmer-secondary)' }}>
            {row.buyerMobile}
          </small>
        </div>
      ),
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
      key: 'cropName',
      label: 'Crop & Qty',
      render: (val, row) => (
        <div>
          <strong>{val}</strong>
          <div style={{ fontSize: '0.82rem', color: 'var(--farmer-secondary)' }}>
            {row.quantity} {row.unit}
          </div>
        </div>
      ),
    },
    {
      key: 'rate',
      label: 'Rate',
      render: (val, row) => `${formatCurrency(val)} / ${row.unit}`,
    },
    {
      key: 'totalAmount',
      label: 'Total Amount',
      render: (val) => (
        <strong style={{ color: 'var(--farmer-primary)', fontSize: '1rem' }}>
          {formatCurrency(val)}
        </strong>
      ),
    },
    {
      key: 'transactionStatus',
      label: 'Confirmation Status',
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
      render: (val) => (
        <span style={{ fontSize: '0.86rem', whiteSpace: 'nowrap' }}>
          {formatDate(val)}
        </span>
      ),
    },
    {
      key: 'action',
      label: 'Actions',
      render: (_, row) => {
        const linkedOtp = otpRequests.find(
          (o) => o.transactionId === row.id && o.otpStatus === 'Pending'
        );

        return (
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              type="button"
              className="farmer-btn farmer-btn-outline farmer-btn-sm"
              onClick={() => setSelectedTransaction(row)}
            >
              Details
            </button>

            {linkedOtp && (
              <button
                type="button"
                className="farmer-btn farmer-btn-primary farmer-btn-sm"
                onClick={() => setActiveOtpRequest(linkedOtp)}
              >
                🔐 OTP
              </button>
            )}

          </div>
        );
      },
    },
  ];

  return (
    <div>
      {/* Page Header */}
      <div className="farmer-page-header">
        <div className="farmer-header-titles">
          <h2>My Sales Orders & Transactions</h2>
          <p>
            Complete record of sales initiated by farmer and purchases entered by Middlemen & Vendors
          </p>
        </div>

        <div className="farmer-header-actions">
          <button
            type="button"
            className="farmer-btn farmer-btn-primary"
            onClick={() => navigateTo('sell')}
          >
            ➕ New Sale Order
          </button>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 16,
          marginBottom: 20,
        }}
      >
        <div className="farmer-card" style={{ padding: '16px 20px' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--farmer-secondary)' }}>TOTAL ORDERS</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--farmer-text)', margin: '4px 0 2px' }}>
            {filteredSales.length} Transactions
          </div>
          <small style={{ color: 'var(--farmer-secondary)' }}>Across all buyer categories</small>
        </div>

        <div className="farmer-card" style={{ padding: '16px 20px' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--farmer-secondary)' }}>QUANTITY DISPATCHED</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--farmer-primary)', margin: '4px 0 2px' }}>
            {totalVolume} qtl
          </div>
          <small style={{ color: 'var(--farmer-secondary)' }}>Total produce traded</small>
        </div>

        <div className="farmer-card" style={{ padding: '16px 20px' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--farmer-secondary)' }}>CONFIRMED REVENUE</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--farmer-dark)', margin: '4px 0 2px' }}>
            {formatCurrency(totalTurnover)}
          </div>
          <small style={{ color: 'var(--farmer-secondary)' }}>Verified transactions</small>
        </div>

        <div className="farmer-card" style={{ padding: '16px 20px' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--farmer-secondary)' }}>PENDING OTP CONFIRMATION</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: pendingCount > 0 ? 'var(--farmer-warning)' : 'var(--farmer-success)', margin: '4px 0 2px' }}>
            {pendingCount} Orders
          </div>
          <small style={{ color: 'var(--farmer-secondary)' }}>Stock reserved</small>
        </div>
      </div>

      {/* Filters Strip */}
      <div
        className="farmer-card"
        style={{
          padding: '16px 20px',
          marginBottom: 20,
          display: 'flex',
          gap: 14,
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--farmer-secondary)' }}>
            Buyer:
          </span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={{
              padding: '6px 12px',
              borderRadius: 8,
              border: '1px solid var(--farmer-border)',
              background: '#FFFFFF',
              fontSize: '0.86rem',
            }}
          >
            <option value="All">All Categories</option>
            <option value="Middleman">Middleman</option>
            <option value="Vendor">Vendor</option>
            <option value="Customer">Customer</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--farmer-secondary)' }}>
            Crop:
          </span>
          <select
            value={cropFilter}
            onChange={(e) => setCropFilter(e.target.value)}
            style={{
              padding: '6px 12px',
              borderRadius: 8,
              border: '1px solid var(--farmer-border)',
              background: '#FFFFFF',
              fontSize: '0.86rem',
            }}
          >
            <option value="All">All Crops</option>
            {uniqueCrops.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--farmer-secondary)' }}>
            Status:
          </span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '6px 12px',
              borderRadius: 8,
              border: '1px solid var(--farmer-border)',
              background: '#FFFFFF',
              fontSize: '0.86rem',
            }}
          >
            <option value="All">All Statuses</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Pending Confirmation">Pending Confirmation</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--farmer-secondary)' }}>
            OTP Status:
          </span>
          <select
            value={otpFilter}
            onChange={(e) => setOtpFilter(e.target.value)}
            style={{
              padding: '6px 12px',
              borderRadius: 8,
              border: '1px solid var(--farmer-border)',
              background: '#FFFFFF',
              fontSize: '0.86rem',
            }}
          >
            <option value="All">All OTP States</option>
            <option value="Verified">Verified</option>
            <option value="Pending">Pending</option>
            <option value="Expired">Expired</option>
          </select>
        </div>

        <button
          type="button"
          className="farmer-btn farmer-btn-outline farmer-btn-sm"
          style={{ marginLeft: 'auto' }}
          onClick={() => {
            setCategoryFilter('All');
            setCropFilter('All');
            setStatusFilter('All');
            setOtpFilter('All');
          }}
        >
          Reset Filters
        </button>
      </div>

      {/* Main Table */}
      <div className="farmer-card" style={{ padding: '20px' }}>
        <DataTable columns={columns} rows={paginatedSales} />
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 16,
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <span style={{ fontSize: '0.82rem', color: 'var(--farmer-secondary)' }}>
            Page {currentPage} of {totalPages}
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              className="farmer-btn farmer-btn-outline farmer-btn-sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            >
              Previous
            </button>
            <button
              type="button"
              className="farmer-btn farmer-btn-outline farmer-btn-sm"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MySales;

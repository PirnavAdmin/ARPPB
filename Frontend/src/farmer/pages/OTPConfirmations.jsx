import { useState, useMemo } from 'react';
import { useFarmer } from '../context/FarmerContext';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import { formatCurrency, buyerCategoryStyles } from '../utils/farmerHelpers';

function OTPConfirmations() {
  const { otpRequests, setActiveOtpRequest, setSelectedTransaction, sales, searchQuery } = useFarmer();

  const [activeTab, setActiveTab] = useState('Pending'); // 'Pending' | 'Confirmed' | 'Rejected' | 'Expired'

  const tabCounts = useMemo(() => {
    return {
      Pending: otpRequests.filter((o) => o.otpStatus === 'Pending' && o.direction !== 'farmer_initiated').length,
      Confirmed: otpRequests.filter((o) => o.otpStatus === 'Confirmed' && o.direction !== 'farmer_initiated').length,
      Rejected: otpRequests.filter((o) => o.otpStatus === 'Rejected' && o.direction !== 'farmer_initiated').length,
      Expired: otpRequests.filter((o) => o.otpStatus === 'Expired' && o.direction !== 'farmer_initiated').length,
    };
  }, [otpRequests]);

  const filteredRequests = useMemo(() => {
    return otpRequests.filter((item) => {
      if (item.direction === 'farmer_initiated') return false;
      const matchTab = item.otpStatus === activeTab;
      const matchSearch =
        !searchQuery ||
        item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.transactionId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.buyerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.crop.toLowerCase().includes(searchQuery.toLowerCase());

      return matchTab && matchSearch;
    });
  }, [otpRequests, activeTab, searchQuery]);

  const columns = [
    {
      key: 'id',
      label: 'OTP ID',
      render: (val) => <strong style={{ color: 'var(--farmer-primary)' }}>{val}</strong>,
    },
    {
      key: 'transactionId',
      label: 'Linked Transaction',
      render: (val) => (
        <span
          style={{ fontWeight: 600, color: 'var(--farmer-dark)', cursor: 'pointer' }}
          onClick={() => {
            const match = sales.find((s) => s.id === val);
            if (match) setSelectedTransaction(match);
          }}
        >
          {val}
        </span>
      ),
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
      label: 'Category',
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
      key: 'crop',
      label: 'Crop & Quantity',
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
      key: 'requestDate',
      label: 'Request Time',
      render: (val) => <span style={{ fontSize: '0.84rem' }}>{val}</span>,
    },
    {
      key: 'otpStatus',
      label: 'OTP Status',
      badge: 'otpStatus',
    },
    {
      key: 'action',
      label: 'Action',
      render: (_, row) => (
        <div style={{ display: 'flex', gap: 6 }}>
          {row.otpStatus === 'Pending' ? (
            <button
              type="button"
              className="farmer-btn farmer-btn-primary farmer-btn-sm"
              onClick={() => setActiveOtpRequest(row)}
            >
              🔐 Enter OTP
            </button>
          ) : (
            <button
              type="button"
              className="farmer-btn farmer-btn-outline farmer-btn-sm"
              onClick={() => {
                const match = sales.find((s) => s.id === row.transactionId);
                if (match) setSelectedTransaction(match);
              }}
            >
              View Details
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="farmer-page-header">
        <div className="farmer-header-titles">
          <h2>OTP Confirmations & Verifications</h2>
          <p>
            Cryptographic 6-digit verification protecting stock deduction and authorizing buyer dispatch
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="farmer-tabs">
        {['Pending', 'Confirmed', 'Rejected', 'Expired'].map((tab) => (
          <button
            key={tab}
            type="button"
            className={`farmer-tab-btn ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
            <span
              style={{
                marginLeft: 8,
                fontSize: '0.74rem',
                padding: '2px 8px',
                borderRadius: 999,
                backgroundColor: activeTab === tab ? 'var(--farmer-light)' : '#F1F5F9',
                color: activeTab === tab ? 'var(--farmer-dark)' : 'var(--farmer-secondary)',
                fontWeight: 700,
              }}
            >
              {tabCounts[tab]}
            </span>
          </button>
        ))}
      </div>

      {/* Main Table */}
      <div className="farmer-card" style={{ padding: '20px' }}>
        <DataTable
          columns={columns}
          rows={filteredRequests}
          emptyTitle={`No ${activeTab} OTP Requests`}
          emptyMessage={`There are currently no transactions with ${activeTab.toLowerCase()} OTP status.`}
        />
      </div>
    </div>
  );
}

export default OTPConfirmations;

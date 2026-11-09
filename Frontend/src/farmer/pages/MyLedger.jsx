import { useState, useMemo } from 'react';
import { useFarmer } from '../context/FarmerContext';
import LedgerTable from '../components/LedgerTable';
import { formatCurrency } from '../utils/farmerHelpers';

function MyLedger() {
  const { ledger, updatePaymentStatus, searchQuery, showToast } = useFarmer();

  const [typeFilter, setTypeFilter] = useState('All'); // 'All' | 'Credits' | 'Debits'
  const [statusFilter, setStatusFilter] = useState('All');

  // Summary Metrics
  const totalSales = useMemo(
    () => ledger.reduce((sum, item) => sum + (Number(item.credit) || 0), 0),
    [ledger]
  );
  const totalPurchases = useMemo(
    () => ledger.reduce((sum, item) => sum + (Number(item.debit) || 0), 0),
    [ledger]
  );
  const totalReceivables = useMemo(
    () =>
      ledger
        .filter((i) => i.credit > 0 && i.paymentStatus === 'Payment Expected')
        .reduce((sum, item) => sum + (Number(item.credit) || 0), 0),
    [ledger]
  );
  const amountReceived = useMemo(
    () =>
      ledger
        .filter((i) => i.credit > 0 && i.paymentStatus === 'Received')
        .reduce((sum, item) => sum + (Number(item.credit) || 0), 0),
    [ledger]
  );
  const outstandingAmount = useMemo(
    () =>
      ledger
        .filter((i) => i.paymentStatus === 'Delayed' || i.paymentStatus === 'Payment Expected')
        .reduce((sum, item) => sum + (Number(item.credit) || 0), 0),
    [ledger]
  );

  const filteredLedger = useMemo(() => {
    return ledger.filter((entry) => {
      const matchSearch =
        !searchQuery ||
        entry.transactionId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.partyName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchType =
        typeFilter === 'All'
          ? true
          : typeFilter === 'Credits'
          ? entry.credit > 0
          : entry.debit > 0;

      const matchStatus =
        statusFilter === 'All' || entry.paymentStatus === statusFilter;

      return matchSearch && matchType && matchStatus;
    });
  }, [ledger, searchQuery, typeFilter, statusFilter]);

  const handleExportStatement = () => {
    showToast('Financial ledger statement exported to PDF format successfully!', 'success');
  };

  return (
    <div>
      <div className="farmer-page-header">
        <div className="farmer-header-titles">
          <h2>Farmer Financial Ledger</h2>
          <p>
            Complete double-entry accounting of crop sales credits, farm supply debits, and verified receivables
          </p>
        </div>

        <div className="farmer-header-actions">
          <button
            type="button"
            className="farmer-btn farmer-btn-primary"
            onClick={handleExportStatement}
          >
            📥 Export Statement (PDF)
          </button>
        </div>
      </div>

      {/* 5 Summary KPI Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: 16,
          marginBottom: 24,
        }}
      >
        <div className="farmer-card" style={{ padding: '18px 20px' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--farmer-secondary)', fontWeight: 600 }}>
            TOTAL SALES (CREDITS)
          </span>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--farmer-primary)', margin: '4px 0 2px' }}>
            {formatCurrency(totalSales)}
          </div>
          <small style={{ color: 'var(--farmer-secondary)' }}>All crop dispatches</small>
        </div>

        <div className="farmer-card" style={{ padding: '18px 20px' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--farmer-secondary)', fontWeight: 600 }}>
            TOTAL PURCHASES (DEBITS)
          </span>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--farmer-danger)', margin: '4px 0 2px' }}>
            {formatCurrency(totalPurchases)}
          </div>
          <small style={{ color: 'var(--farmer-secondary)' }}>Seeds & farm inputs</small>
        </div>

        <div className="farmer-card" style={{ padding: '18px 20px' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--farmer-secondary)', fontWeight: 600 }}>
            EXPECTED RECEIVABLES
          </span>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--farmer-warning)', margin: '4px 0 2px' }}>
            {formatCurrency(totalReceivables)}
          </div>
          <small style={{ color: 'var(--farmer-secondary)' }}>Due within 3 business days</small>
        </div>

        <div className="farmer-card" style={{ padding: '18px 20px' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--farmer-secondary)', fontWeight: 600 }}>
            AMOUNT RECEIVED
          </span>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--farmer-dark)', margin: '4px 0 2px' }}>
            {formatCurrency(amountReceived)}
          </div>
          <small style={{ color: 'var(--farmer-secondary)' }}>Bank settled & audited</small>
        </div>

        <div className="farmer-card" style={{ padding: '18px 20px', border: '2px solid #E8F5EC' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--farmer-secondary)', fontWeight: 600 }}>
            OUTSTANDING BALANCE
          </span>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--farmer-primary)', margin: '4px 0 2px' }}>
            {formatCurrency(outstandingAmount)}
          </div>
          <small style={{ color: 'var(--farmer-primary)', fontWeight: 600 }}>Net pending collections</small>
        </div>
      </div>

      {/* Filter Strip */}
      <div
        className="farmer-card"
        style={{
          padding: '16px 20px',
          marginBottom: 20,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--farmer-secondary)' }}>
              Transaction Type:
            </span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              style={{
                padding: '6px 12px',
                borderRadius: 8,
                border: '1px solid var(--farmer-border)',
                background: '#FFFFFF',
                fontSize: '0.86rem',
              }}
            >
              <option value="All">All Transactions</option>
              <option value="Credits">Credits (Sales Inflow)</option>
              <option value="Debits">Debits (Input Outflow)</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--farmer-secondary)' }}>
              Payment Status:
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
              <option value="All">All Payment States</option>
              <option value="Payment Expected">Payment Expected</option>
              <option value="Received">Received / Settled</option>
              <option value="Delayed">Delayed</option>
            </select>
          </div>
        </div>

        <span style={{ fontSize: '0.84rem', color: 'var(--farmer-secondary)' }}>
          Showing <strong>{filteredLedger.length}</strong> journal entries
        </span>
      </div>

      {/* Main Table */}
      <div className="farmer-card" style={{ padding: '20px' }}>
        <LedgerTable
          entries={filteredLedger}
          onUpdateStatus={(id, status) => updatePaymentStatus(id, status)}
        />
      </div>
    </div>
  );
}

export default MyLedger;

import { useState, useMemo } from 'react';
import { useFarmer } from '../context/FarmerContext';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import { formatDate } from '../utils/farmerHelpers';

function StockManagement() {
  const { stockRecords, addHarvestStock, navigateTo, searchQuery } = useFarmer();

  const [yieldModal, setYieldModal] = useState(null);
  const [yieldAmount, setYieldAmount] = useState('');

  // Stock summary aggregations
  const totalHarvested = useMemo(
    () => stockRecords.reduce((sum, s) => sum + (Number(s.harvestedQuantity) || 0), 0),
    [stockRecords]
  );
  const totalSold = useMemo(
    () => stockRecords.reduce((sum, s) => sum + (Number(s.soldQuantity) || 0), 0),
    [stockRecords]
  );
  const totalReserved = useMemo(
    () => stockRecords.reduce((sum, s) => sum + (Number(s.reservedQuantity) || 0), 0),
    [stockRecords]
  );
  const totalAvailable = useMemo(
    () => stockRecords.reduce((sum, s) => sum + (Number(s.availableQuantity) || 0), 0),
    [stockRecords]
  );

  const lowStockCount = useMemo(
    () => stockRecords.filter((s) => s.availableQuantity < 50 || s.status === 'Low Stock').length,
    [stockRecords]
  );

  const filteredRecords = useMemo(() => {
    if (!searchQuery) return stockRecords;
    return stockRecords.filter(
      (s) =>
        s.cropName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.variety.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.storageLocation.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [stockRecords, searchQuery]);

  const handleConfirmYield = () => {
    if (yieldModal && yieldAmount) {
      addHarvestStock(yieldModal.cropId || yieldModal.id || yieldModal.cropName, Number(yieldAmount), yieldModal.unit);
      setYieldModal(null);
      setYieldAmount('');
    }
  };

  const columns = [
    {
      key: 'cropName',
      label: 'Crop & Variety',
      render: (val, row) => (
        <div>
          <strong style={{ fontSize: '0.94rem', color: 'var(--farmer-dark)' }}>{val}</strong>
          <small style={{ display: 'block', color: 'var(--farmer-secondary)' }}>
            {row.variety} • 📍 {row.storageLocation}
          </small>
        </div>
      ),
    },
    {
      key: 'openingStock',
      label: 'Opening Stock',
      render: (val, row) => `${val} ${row.unit}`,
    },
    {
      key: 'harvestedQuantity',
      label: 'Total Harvested',
      render: (val, row) => (
        <strong style={{ color: 'var(--farmer-text)' }}>
          {val} {row.unit}
        </strong>
      ),
    },
    {
      key: 'soldQuantity',
      label: 'Sold Quantity',
      render: (val, row) => `${val} ${row.unit}`,
    },
    {
      key: 'reservedQuantity',
      label: 'Reserved (Pending OTP)',
      render: (val, row) => (
        <span
          style={{
            color: val > 0 ? 'var(--farmer-warning)' : 'var(--farmer-secondary)',
            fontWeight: val > 0 ? 700 : 400,
          }}
        >
          {val} {row.unit}
        </span>
      ),
    },
    {
      key: 'availableQuantity',
      label: 'Available Balance',
      render: (val, row) => {
        const isLow = val < 50;
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <strong
              style={{
                fontSize: '1.05rem',
                color: isLow ? 'var(--farmer-danger)' : 'var(--farmer-primary)',
              }}
            >
              {val} {row.unit}
            </strong>
            {isLow && (
              <span
                style={{
                  fontSize: '0.7rem',
                  backgroundColor: '#FEE2E2',
                  color: 'var(--farmer-danger)',
                  padding: '2px 6px',
                  borderRadius: 4,
                  fontWeight: 700,
                }}
              >
                LOW
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: 'status',
      label: 'Stock Status',
      badge: 'status',
    },
    {
      key: 'lastUpdated',
      label: 'Last Updated',
      render: (val) => formatDate(val),
    },
    {
      key: 'action',
      label: 'Actions',
      render: (_, row) => (
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            type="button"
            className="farmer-btn farmer-btn-secondary farmer-btn-sm"
            onClick={() => setYieldModal(row)}
          >
            + Harvest
          </button>
          <button
            type="button"
            className="farmer-btn farmer-btn-outline farmer-btn-sm"
            onClick={() => navigateTo('sell')}
          >
            Sell
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="farmer-page-header">
        <div className="farmer-header-titles">
          <h2>Stock & Warehouse Inventory</h2>
          <p>
            Real-time tracking of harvested yield, reserved orders, and available farm storage balance
          </p>
        </div>

        <div className="farmer-header-actions">
          <button
            type="button"
            className="farmer-btn farmer-btn-primary"
            onClick={() => navigateTo('sell')}
          >
            🛒 Initiate Sale
          </button>
        </div>
      </div>

      {/* 4 Summary Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 16,
          marginBottom: 24,
        }}
      >
        <div className="farmer-card" style={{ padding: '20px' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--farmer-secondary)', fontWeight: 600 }}>
            TOTAL HARVESTED YIELD
          </span>
          <div style={{ fontSize: '1.7rem', fontWeight: 800, color: 'var(--farmer-text)', margin: '6px 0 2px' }}>
            {totalHarvested} qtl
          </div>
          <small style={{ color: 'var(--farmer-secondary)' }}>All crop varieties combined</small>
        </div>

        <div className="farmer-card" style={{ padding: '20px' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--farmer-secondary)', fontWeight: 600 }}>
            TOTAL QUANTITY SOLD
          </span>
          <div style={{ fontSize: '1.7rem', fontWeight: 800, color: 'var(--farmer-dark)', margin: '6px 0 2px' }}>
            {totalSold} qtl
          </div>
          <small style={{ color: 'var(--farmer-secondary)' }}>Dispatched & settled</small>
        </div>

        <div className="farmer-card" style={{ padding: '20px' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--farmer-secondary)', fontWeight: 600 }}>
            RESERVED STOCK (OTP PENDING)
          </span>
          <div style={{ fontSize: '1.7rem', fontWeight: 800, color: 'var(--farmer-warning)', margin: '6px 0 2px' }}>
            {totalReserved} qtl
          </div>
          <small style={{ color: 'var(--farmer-secondary)' }}>Held for pending confirmations</small>
        </div>

        <div className="farmer-card" style={{ padding: '20px', border: '2px solid #C3ECD0' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--farmer-secondary)', fontWeight: 600 }}>
            AVAILABLE SELLING BALANCE
          </span>
          <div style={{ fontSize: '1.7rem', fontWeight: 800, color: 'var(--farmer-primary)', margin: '6px 0 2px' }}>
            {totalAvailable} qtl
          </div>
          <small style={{ color: 'var(--farmer-primary)', fontWeight: 600 }}>
            Ready for instant trading
          </small>
        </div>
      </div>

      {/* Low Stock Warning Alert if any */}
      {lowStockCount > 0 && (
        <div
          style={{
            backgroundColor: '#FFFBEB',
            border: '1px solid #FDE68A',
            borderRadius: 12,
            padding: '14px 18px',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: '1.3rem' }}>⚠️</span>
            <div>
              <strong style={{ color: '#92400E', fontSize: '0.92rem' }}>
                Stock Warning: {lowStockCount} crop(s) are running low in storage
              </strong>
              <div style={{ fontSize: '0.82rem', color: '#B45309' }}>
                Maize available balance is below 200 qtl safety threshold. Add newly harvested yield or adjust reserve allocation.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stock Table */}
      <div className="farmer-card" style={{ padding: '20px' }}>
        <DataTable columns={columns} rows={filteredRecords} />
      </div>

      {/* Add Harvest Yield Modal */}
      {yieldModal && (
        <div className="farmer-modal-overlay" role="dialog" aria-modal="true">
          <div className="farmer-modal-content">
            <div className="farmer-modal-header">
              <h3>Record Harvest Yield: {yieldModal.cropName}</h3>
              <button
                type="button"
                className="farmer-modal-close"
                onClick={() => setYieldModal(null)}
              >
                ✕
              </button>
            </div>

            <div className="farmer-modal-body">
              <div style={{ marginBottom: 14, fontSize: '0.88rem', color: 'var(--farmer-secondary)' }}>
                Storage Location: <strong>{yieldModal.storageLocation}</strong>
              </div>

              <div className="farmer-form-group">
                <label>Current Available Stock</label>
                <input
                  type="text"
                  disabled
                  value={`${yieldModal.availableQuantity} ${yieldModal.unit}`}
                  style={{ background: '#F1F5F9' }}
                />
              </div>

              <div className="farmer-form-group">
                <label>Additional Harvested Quantity ({yieldModal.unit}) *</label>
                <input
                  type="number"
                  placeholder="e.g. 80"
                  value={yieldAmount}
                  onChange={(e) => setYieldAmount(e.target.value)}
                  autoFocus
                />
                <small>This increases both your Total Harvested and Available Stock balance.</small>
              </div>
            </div>

            <div className="farmer-modal-footer">
              <button
                type="button"
                className="farmer-btn farmer-btn-outline"
                onClick={() => setYieldModal(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="farmer-btn farmer-btn-primary"
                onClick={handleConfirmYield}
                disabled={!yieldAmount || Number(yieldAmount) <= 0}
              >
                Add Harvest Stock
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StockManagement;

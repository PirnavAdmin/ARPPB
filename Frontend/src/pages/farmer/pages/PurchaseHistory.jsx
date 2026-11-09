import { useState, useMemo } from 'react';
import { useFarmer } from '../context/FarmerContext';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import { formatCurrency, formatDate } from '../utils/farmerHelpers';

function PurchaseHistory() {
  const { purchases, addPurchase, searchQuery } = useFarmer();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('All');

  const [newPurchase, setNewPurchase] = useState({
    productName: '',
    supplierName: '',
    category: 'Seeds',
    quantity: '',
    unit: 'bags',
    price: '',
    expectedPaymentDate: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const filteredPurchases = useMemo(() => {
    return purchases.filter((p) => {
      const matchSearch =
        !searchQuery ||
        p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.supplierName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchCategory =
        categoryFilter === 'All' || p.category === categoryFilter;

      return matchSearch && matchCategory;
    });
  }, [purchases, searchQuery, categoryFilter]);

  const totalSpent = useMemo(
    () => filteredPurchases.reduce((acc, p) => acc + (Number(p.totalAmount) || 0), 0),
    [filteredPurchases]
  );

  const handleSavePurchase = (e) => {
    e.preventDefault();
    if (!newPurchase.productName || !newPurchase.supplierName || !newPurchase.quantity || !newPurchase.price) {
      return;
    }
    addPurchase(newPurchase);
    setIsAddModalOpen(false);
    setNewPurchase({
      productName: '',
      supplierName: '',
      category: 'Seeds',
      quantity: '',
      unit: 'bags',
      price: '',
      expectedPaymentDate: new Date().toISOString().split('T')[0],
      notes: '',
    });
  };

  const columns = [
    {
      key: 'id',
      label: 'Purchase ID',
      render: (val) => <strong style={{ color: 'var(--farmer-primary)' }}>{val}</strong>,
    },
    {
      key: 'date',
      label: 'Purchase Date',
      render: (val) => formatDate(val),
    },
    {
      key: 'productName',
      label: 'Product & Input',
      render: (val, row) => (
        <div>
          <strong style={{ fontSize: '0.92rem' }}>{val}</strong>
          <span style={{ display: 'block', fontSize: '0.74rem', color: 'var(--farmer-secondary)' }}>
            Category: {row.category}
          </span>
        </div>
      ),
    },
    {
      key: 'supplierName',
      label: 'Supplier Name',
      render: (val) => <span style={{ fontWeight: 600 }}>{val}</span>,
    },
    {
      key: 'quantity',
      label: 'Quantity',
      render: (val, row) => `${val} ${row.unit || ''}`,
    },
    {
      key: 'price',
      label: 'Price per Unit',
      render: (val, row) => `${formatCurrency(val)} / ${row.unit || 'unit'}`,
    },
    {
      key: 'totalAmount',
      label: 'Total Amount',
      render: (val) => (
        <strong style={{ color: 'var(--farmer-danger)', fontSize: '0.96rem' }}>
          {formatCurrency(val)}
        </strong>
      ),
    },
    {
      key: 'expectedPaymentDate',
      label: 'Payment Due Date',
      render: (val) => formatDate(val),
    },
    {
      key: 'status',
      label: 'Status',
      badge: 'status',
    },
  ];

  return (
    <div>
      <div className="farmer-page-header">
        <div className="farmer-header-titles">
          <h2>Farm Input Purchase History</h2>
          <p>
            Audit records of certified seeds, fertilizers, machinery rental, and packing materials
          </p>
        </div>

        <div className="farmer-header-actions">
          <button
            type="button"
            className="farmer-btn farmer-btn-primary"
            onClick={() => setIsAddModalOpen(true)}
          >
            ➕ Record Input Purchase
          </button>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 16,
          marginBottom: 20,
        }}
      >
        <div className="farmer-card" style={{ padding: '16px 20px' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--farmer-secondary)' }}>TOTAL PURCHASE ORDERS</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--farmer-text)', margin: '4px 0 2px' }}>
            {filteredPurchases.length} Invoices
          </div>
          <small style={{ color: 'var(--farmer-secondary)' }}>Farm operational supplies</small>
        </div>

        <div className="farmer-card" style={{ padding: '16px 20px' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--farmer-secondary)' }}>TOTAL INPUT EXPENDITURE</span>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--farmer-danger)', margin: '4px 0 2px' }}>
            {formatCurrency(totalSpent)}
          </div>
          <small style={{ color: 'var(--farmer-secondary)' }}>Recorded purchase spend</small>
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--farmer-secondary)' }}>
            Input Category:
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
            <option value="Seeds">Seeds</option>
            <option value="Fertilizers">Fertilizers</option>
            <option value="Equipment">Equipment / Irrigation</option>
            <option value="Packaging">Packaging</option>
            <option value="Crop Protection">Crop Protection</option>
          </select>
        </div>

        <span style={{ fontSize: '0.84rem', color: 'var(--farmer-secondary)' }}>
          Showing <strong>{filteredPurchases.length}</strong> purchase records
        </span>
      </div>

      {/* Main Table */}
      <div className="farmer-card" style={{ padding: '20px' }}>
        <DataTable columns={columns} rows={filteredPurchases} />
      </div>

      {/* Record Purchase Modal */}
      {isAddModalOpen && (
        <div className="farmer-modal-overlay" role="dialog" aria-modal="true">
          <div className="farmer-modal-content">
            <div className="farmer-modal-header">
              <h3>Record Farm Input Purchase</h3>
              <button
                type="button"
                className="farmer-modal-close"
                onClick={() => setIsAddModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePurchase}>
              <div className="farmer-modal-body">
                <div className="farmer-form-group">
                  <label>Product / Input Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Foundation Paddy Seeds (25kg bags)"
                    value={newPurchase.productName}
                    onChange={(e) =>
                      setNewPurchase((prev) => ({ ...prev, productName: e.target.value }))
                    }
                    required
                  />
                </div>

                <div className="farmer-form-row">
                  <div className="farmer-form-group">
                    <label>Supplier / Vendor Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Sri Venkateswara Seeds"
                      value={newPurchase.supplierName}
                      onChange={(e) =>
                        setNewPurchase((prev) => ({ ...prev, supplierName: e.target.value }))
                      }
                      required
                    />
                  </div>

                  <div className="farmer-form-group">
                    <label>Category *</label>
                    <select
                      value={newPurchase.category}
                      onChange={(e) =>
                        setNewPurchase((prev) => ({ ...prev, category: e.target.value }))
                      }
                    >
                      <option value="Seeds">Seeds</option>
                      <option value="Fertilizers">Fertilizers</option>
                      <option value="Equipment">Equipment / Micro-Irrigation</option>
                      <option value="Packaging">Packaging / Bags</option>
                      <option value="Crop Protection">Crop Protection / Pesticides</option>
                    </select>
                  </div>
                </div>

                <div className="farmer-form-row">
                  <div className="farmer-form-group">
                    <label>Quantity *</label>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <input
                        type="number"
                        placeholder="Quantity"
                        value={newPurchase.quantity}
                        onChange={(e) =>
                          setNewPurchase((prev) => ({ ...prev, quantity: e.target.value }))
                        }
                        required
                        style={{ flex: 1 }}
                      />
                      <select
                        value={newPurchase.unit}
                        onChange={(e) =>
                          setNewPurchase((prev) => ({ ...prev, unit: e.target.value }))
                        }
                        style={{ width: 100 }}
                      >
                        <option value="bags">bags</option>
                        <option value="litres">litres</option>
                        <option value="kg">kg</option>
                        <option value="tonnes">tonnes</option>
                        <option value="kit">kit</option>
                      </select>
                    </div>
                  </div>

                  <div className="farmer-form-group">
                    <label>Price per Unit (₹) *</label>
                    <input
                      type="number"
                      placeholder="e.g. 1250"
                      value={newPurchase.price}
                      onChange={(e) =>
                        setNewPurchase((prev) => ({ ...prev, price: e.target.value }))
                      }
                      required
                    />
                  </div>
                </div>

                <div className="farmer-form-group">
                  <label>Payment Due / Settlement Date</label>
                  <input
                    type="date"
                    value={newPurchase.expectedPaymentDate}
                    onChange={(e) =>
                      setNewPurchase((prev) => ({
                        ...prev,
                        expectedPaymentDate: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="farmer-modal-footer">
                <button
                  type="button"
                  className="farmer-btn farmer-btn-outline"
                  onClick={() => setIsAddModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="farmer-btn farmer-btn-primary">
                  Save Purchase
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default PurchaseHistory;

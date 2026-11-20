import { useState, useMemo } from 'react';
import { useFarmer } from '../context/FarmerContext';
import CropCard from '../components/CropCard';
import CropForm from '../components/CropForm';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import { formatCurrency, formatDate } from '../utils/farmerHelpers';
import { DEFAULT_CROP_OPTIONS, fetchCropByIdApi } from '../../../services/farmerCropService';

function MyCrops() {
  const {
    crops,
    cropOptions,
    isCropsLoading,
    cropsError,
    refreshCrops,
    addCrop,
    updateCrop,
    deleteCrop,
    addHarvestStock,
    navigateTo,
    searchQuery,
  } = useFarmer();

  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
  const [isAddMode, setIsAddMode] = useState(false);
  const [editingCrop, setEditingCrop] = useState(null);
  const [viewingCrop, setViewingCrop] = useState(null);
  const [stockModalCrop, setStockModalCrop] = useState(null);
  const [harvestYieldInput, setHarvestYieldInput] = useState('');
  const [isStockSubmitting, setIsStockSubmitting] = useState(false);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [seasonFilter, setSeasonFilter] = useState('All');

  const options = cropOptions || DEFAULT_CROP_OPTIONS;
  const categoryOptions = options.categories?.length ? options.categories : DEFAULT_CROP_OPTIONS.categories;
  const seasonOptions = options.seasons?.length ? options.seasons : DEFAULT_CROP_OPTIONS.seasons;

  // Filtered crops
  const filteredCrops = useMemo(() => {
    return (crops || []).filter((crop) => {
      const q = String(searchQuery || '').trim().toLowerCase();
      const matchSearch =
        !q ||
        (crop.name && crop.name.toLowerCase().includes(q)) ||
        (crop.variety && crop.variety.toLowerCase().includes(q)) ||
        (crop.district && crop.district.toLowerCase().includes(q)) ||
        (crop.village && crop.village.toLowerCase().includes(q)) ||
        (crop.storageLocation && crop.storageLocation.toLowerCase().includes(q));

      const cropCat = String(crop.category || crop.cropCategory || '').toLowerCase();
      const matchCategory =
        categoryFilter === 'All' ||
        cropCat === categoryFilter.toLowerCase() ||
        cropCat.includes(categoryFilter.toLowerCase().slice(0, 4));

      const cropSeason = String(crop.season || '').toLowerCase();
      const matchSeason =
        seasonFilter === 'All' ||
        cropSeason === seasonFilter.toLowerCase();

      return matchSearch && matchCategory && matchSeason;
    });
  }, [crops, searchQuery, categoryFilter, seasonFilter]);

  const handleViewCrop = async (crop) => {
    setViewingCrop(crop);
    const id = crop?.id;
    const isBackendId = typeof id === 'number' || (!isNaN(Number(id)) && !String(id).includes('CROP-'));
    if (isBackendId) {
      try {
        const freshCrop = await fetchCropByIdApi(Number(id));
        if (freshCrop && freshCrop.id) {
          setViewingCrop((prev) => (prev && prev.id === crop.id ? { ...prev, ...freshCrop } : prev));
        }
      } catch {
        // Fallback to existing crop details
      }
    }
  };

  const handleSaveCrop = async (formData) => {
    if (editingCrop) {
      await updateCrop(editingCrop.id, formData);
      setEditingCrop(null);
    } else {
      await addCrop(formData);
      setIsAddMode(false);
    }
  };

  const handleConfirmStockAdd = async () => {
    if (stockModalCrop && harvestYieldInput) {
      setIsStockSubmitting(true);
      try {
        await addHarvestStock(
          stockModalCrop.id || stockModalCrop.name,
          Number(harvestYieldInput),
          stockModalCrop.unit
        );
        setStockModalCrop(null);
        setHarvestYieldInput('');
      } finally {
        setIsStockSubmitting(false);
      }
    }
  };

  const cropTableColumns = [
    {
      key: 'name',
      label: 'Crop Name',
      render: (val, row) => (
        <div>
          <strong style={{ color: 'var(--farmer-dark)', fontSize: '0.94rem' }}>{val}</strong>
          <small style={{ display: 'block', color: 'var(--farmer-secondary)' }}>
            {row.variety}
          </small>
        </div>
      ),
    },
    { key: 'category', label: 'Category' },
    { key: 'season', label: 'Season' },
    {
      key: 'cultivationArea',
      label: 'Land Area',
      render: (val) => `${val} Acres`,
    },
    {
      key: 'harvestDate',
      label: 'Harvest Date',
      render: (val) => formatDate(val),
    },
    {
      key: 'availableQuantity',
      label: 'Available Stock',
      render: (val, row) => (
        <strong style={{ color: 'var(--farmer-primary)' }}>
          {val} {row.unit}
        </strong>
      ),
    },
    {
      key: 'expectedSellingPrice',
      label: 'Expected Price',
      render: (val, row) => `${formatCurrency(val)} / ${row.unit}`,
    },
    {
      key: 'qualityGrade',
      label: 'Quality Grade',
      badge: 'qualityGrade',
    },
    {
      key: 'status',
      label: 'Status',
      badge: 'status',
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            type="button"
            className="farmer-btn farmer-btn-outline farmer-btn-sm"
            onClick={() => handleViewCrop(row)}
            title="View Details"
          >
            Details
          </button>
          <button
            type="button"
            className="farmer-btn farmer-btn-secondary farmer-btn-sm"
            onClick={() => setStockModalCrop(row)}
            title="Add Yield"
          >
            + Yield
          </button>
          <button
            type="button"
            className="farmer-btn farmer-btn-outline farmer-btn-sm"
            onClick={() => setEditingCrop(row)}
          >
            ✏️
          </button>
          <button
            type="button"
            className="farmer-btn farmer-btn-danger farmer-btn-sm"
            onClick={() => deleteCrop(row.id)}
          >
            🗑️
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      {/* Page Header */}
      <div className="farmer-page-header">
        <div className="farmer-header-titles">
          <h2>My Crop Inventory</h2>
          <p>Register, monitor stock yield, and manage pricing for farm-grown produce</p>
        </div>

        <div className="farmer-header-actions">
          {/* Refresh / Sync with Backend */}
          <button
            type="button"
            className="farmer-btn farmer-btn-outline"
            onClick={() => refreshCrops && refreshCrops()}
            disabled={isCropsLoading}
            title="Sync inventory with backend server"
          >
            {isCropsLoading ? '⏳ Syncing...' : '🔄 Sync'}
          </button>

          {/* Grid vs Table View Toggle */}
          <div
            style={{
              display: 'flex',
              background: '#FFFFFF',
              borderRadius: 10,
              border: '1px solid var(--farmer-border)',
              padding: 2,
            }}
          >
            <button
              type="button"
              className={`farmer-btn farmer-btn-sm ${viewMode === 'grid' ? 'farmer-btn-primary' : 'farmer-btn-outline'}`}
              onClick={() => setViewMode('grid')}
              style={{ border: 'none' }}
            >
              ⊞ Grid View
            </button>
            <button
              type="button"
              className={`farmer-btn farmer-btn-sm ${viewMode === 'table' ? 'farmer-btn-primary' : 'farmer-btn-outline'}`}
              onClick={() => setViewMode('table')}
              style={{ border: 'none' }}
            >
              ☰ Table View
            </button>
          </div>

          <button
            type="button"
            className="farmer-btn farmer-btn-primary"
            onClick={() => {
              setEditingCrop(null);
              setIsAddMode(true);
            }}
          >
            ➕ Register New Crop
          </button>
        </div>
      </div>

      {/* Sync / Error Banner if any */}
      {cropsError && (
        <div
          style={{
            padding: '12px 18px',
            marginBottom: 20,
            borderRadius: 10,
            background: '#FEF2F2',
            border: '1px solid #FCA5A5',
            color: '#991B1B',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.88rem',
          }}
        >
          <span>⚠️ {cropsError}</span>
          <button
            type="button"
            className="farmer-btn farmer-btn-outline farmer-btn-sm"
            onClick={() => refreshCrops && refreshCrops()}
            disabled={isCropsLoading}
          >
            🔄 Retry Sync
          </button>
        </div>
      )}

      {/* Add / Edit Form Modal or Inline Panel */}
      {(isAddMode || editingCrop) && (
        <div style={{ marginBottom: 24, animation: 'slideUp 0.3s ease' }}>
          <CropForm
            initialData={editingCrop}
            onSave={handleSaveCrop}
            onCancel={() => {
              setIsAddMode(false);
              setEditingCrop(null);
            }}
          />
        </div>
      )}

      {/* Filter and Search Bar Row */}
      <div
        className="farmer-card"
        style={{
          padding: '16px 20px',
          marginBottom: 20,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--farmer-secondary)' }}>
              Category:
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
              {categoryOptions.map((opt) => (
                <option key={opt.code} value={opt.code}>
                  {opt.code}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--farmer-secondary)' }}>
              Season:
            </span>
            <select
              value={seasonFilter}
              onChange={(e) => setSeasonFilter(e.target.value)}
              style={{
                padding: '6px 12px',
                borderRadius: 8,
                border: '1px solid var(--farmer-border)',
                background: '#FFFFFF',
                fontSize: '0.86rem',
              }}
            >
              <option value="All">All Seasons</option>
              {seasonOptions.map((opt) => (
                <option key={opt.code} value={opt.code}>
                  {opt.code}
                </option>
              ))}
            </select>
          </div>
        </div>

        <span style={{ fontSize: '0.84rem', color: 'var(--farmer-secondary)' }}>
          {isCropsLoading ? (
            'Loading crops from server...'
          ) : (
            <>
              Showing <strong>{filteredCrops.length}</strong> of <strong>{(crops || []).length}</strong> registered crops
            </>
          )}
        </span>
      </div>

      {/* Main Content: Loading State, Empty State, Grid View or Table View */}
      {isCropsLoading && (!crops || crops.length === 0) ? (
        <div
          className="farmer-card"
          style={{
            padding: '48px 24px',
            textAlign: 'center',
            color: 'var(--farmer-secondary)',
          }}
        >
          <div style={{ fontSize: '2rem', marginBottom: 12 }}>⏳</div>
          <p style={{ fontWeight: 600, fontSize: '1rem', margin: '0 0 6px' }}>
            Fetching Crops from Server...
          </p>
          <small>Please wait while we sync your crop inventory.</small>
        </div>
      ) : filteredCrops.length === 0 ? (
        <div
          className="farmer-card"
          style={{
            padding: '48px 24px',
            textAlign: 'center',
            color: 'var(--farmer-secondary)',
          }}
        >
          <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🌾</div>
          <h4 style={{ margin: '0 0 8px', color: 'var(--farmer-text)' }}>No Crops Found</h4>
          <p style={{ margin: '0 0 16px', fontSize: '0.9rem' }}>
            {searchQuery || categoryFilter !== 'All' || seasonFilter !== 'All'
              ? 'No crops match the selected filter criteria. Try adjusting your filters.'
              : 'You have not registered any crops yet. Start by registering your first crop.'}
          </p>
          <button
            type="button"
            className="farmer-btn farmer-btn-primary farmer-btn-sm"
            onClick={() => {
              setCategoryFilter('All');
              setSeasonFilter('All');
              setIsAddMode(true);
            }}
          >
            ➕ Register New Crop
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: 20,
          }}
        >
          {filteredCrops.map((crop) => (
            <CropCard
              key={crop.id}
              crop={crop}
              onView={(c) => handleViewCrop(c)}
              onEdit={(c) => setEditingCrop(c)}
              onUpdateStock={(c) => setStockModalCrop(c)}
              onDelete={(id) => deleteCrop(id)}
            />
          ))}
        </div>
      ) : (
        <DataTable columns={cropTableColumns} rows={filteredCrops} />
      )}

      {/* View Crop Details Modal */}
      {viewingCrop && (
        <div className="farmer-modal-overlay" role="dialog" aria-modal="true">
          <div className="farmer-modal-content">
            <div className="farmer-modal-header">
              <div>
                <h3>{viewingCrop.name} ({viewingCrop.variety})</h3>
                <span style={{ fontSize: '0.82rem', color: 'var(--farmer-secondary)' }}>
                  Crop ID: {viewingCrop.id} • {viewingCrop.category}
                </span>
              </div>
              <button
                type="button"
                className="farmer-modal-close"
                onClick={() => setViewingCrop(null)}
              >
                ✕
              </button>
            </div>

            <div className="farmer-modal-body">
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 14,
                  backgroundColor: '#F8FAF8',
                  padding: 18,
                  borderRadius: 12,
                  border: '1px solid var(--farmer-border)',
                }}
              >
                <div>
                  <span style={{ fontSize: '0.74rem', color: 'var(--farmer-secondary)', display: 'block' }}>
                    AVAILABLE STOCK
                  </span>
                  <strong style={{ fontSize: '1.25rem', color: 'var(--farmer-primary)' }}>
                    {viewingCrop.availableQuantity} {viewingCrop.unit}
                  </strong>
                </div>

                <div>
                  <span style={{ fontSize: '0.74rem', color: 'var(--farmer-secondary)', display: 'block' }}>
                    EXPECTED PRICE
                  </span>
                  <strong style={{ fontSize: '1.25rem' }}>
                    {formatCurrency(viewingCrop.expectedSellingPrice)} / {viewingCrop.unit}
                  </strong>
                </div>

                <div>
                  <span style={{ fontSize: '0.74rem', color: 'var(--farmer-secondary)', display: 'block' }}>
                    CULTIVATION AREA
                  </span>
                  <strong>{viewingCrop.cultivationArea} Acres</strong>
                </div>

                <div>
                  <span style={{ fontSize: '0.74rem', color: 'var(--farmer-secondary)', display: 'block' }}>
                    QUALITY GRADE
                  </span>
                  <StatusBadge status={viewingCrop.qualityGrade} />
                </div>

                <div>
                  <span style={{ fontSize: '0.74rem', color: 'var(--farmer-secondary)', display: 'block' }}>
                    HARVEST DATE
                  </span>
                  <span>{formatDate(viewingCrop.harvestDate)}</span>
                </div>

                <div>
                  <span style={{ fontSize: '0.74rem', color: 'var(--farmer-secondary)', display: 'block' }}>
                    LOCATION
                  </span>
                  <span>{viewingCrop.storageLocation || `${viewingCrop.village}, ${viewingCrop.district}`}</span>
                </div>
              </div>

              {viewingCrop.description && (
                <div style={{ marginTop: 14, fontSize: '0.88rem', color: 'var(--farmer-secondary)', lineHeight: 1.5 }}>
                  <strong>Description:</strong> {viewingCrop.description}
                </div>
              )}
            </div>

            <div className="farmer-modal-footer">
              <button
                type="button"
                className="farmer-btn farmer-btn-primary"
                onClick={() => {
                  setViewingCrop(null);
                  navigateTo('sell');
                }}
              >
                🛒 Create Sale for this Crop
              </button>
              <button
                type="button"
                className="farmer-btn farmer-btn-outline"
                onClick={() => setViewingCrop(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Add Harvest Yield Modal */}
      {stockModalCrop && (
        <div className="farmer-modal-overlay" role="dialog" aria-modal="true">
          <div className="farmer-modal-content">
            <div className="farmer-modal-header">
              <h3>Add Harvest Yield: {stockModalCrop.name}</h3>
              <button
                type="button"
                className="farmer-modal-close"
                onClick={() => setStockModalCrop(null)}
                disabled={isStockSubmitting}
              >
                ✕
              </button>
            </div>

            <div className="farmer-modal-body">
              <p style={{ fontSize: '0.9rem', color: 'var(--farmer-secondary)', margin: '0 0 16px' }}>
                Record newly harvested quantity from your farm plot into warehouse storage.
              </p>

              <div className="farmer-form-group">
                <label>Current Available Stock</label>
                <input
                  type="text"
                  disabled
                  value={`${stockModalCrop.availableQuantity} ${stockModalCrop.unit}`}
                  style={{ background: '#F1F5F9' }}
                />
              </div>

              <div className="farmer-form-group">
                <label>Additional Harvested Quantity ({stockModalCrop.unit}) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="e.g. 50"
                  value={harvestYieldInput}
                  onChange={(e) => setHarvestYieldInput(e.target.value)}
                  autoFocus
                  disabled={isStockSubmitting}
                />
              </div>
            </div>

            <div className="farmer-modal-footer">
              <button
                type="button"
                className="farmer-btn farmer-btn-outline"
                onClick={() => setStockModalCrop(null)}
                disabled={isStockSubmitting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="farmer-btn farmer-btn-primary"
                onClick={handleConfirmStockAdd}
                disabled={isStockSubmitting || !harvestYieldInput || Number(harvestYieldInput) <= 0}
              >
                {isStockSubmitting ? 'Adding...' : 'Confirm & Add to Stock'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MyCrops;

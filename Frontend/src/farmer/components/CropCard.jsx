import { formatCurrency } from '../utils/farmerHelpers';
import StatusBadge from './StatusBadge';

function CropCard({ crop, onEdit, onView, onUpdateStock, onDelete }) {
  if (!crop) return null;

  return (
    <div
      className="farmer-card"
      style={{
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        transition: 'transform 0.2s, box-shadow 0.2s',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Top Tag & Status */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <span
          style={{
            fontSize: '0.72rem',
            fontWeight: 700,
            color: 'var(--farmer-primary)',
            background: 'var(--farmer-light)',
            padding: '3px 8px',
            borderRadius: 6,
            textTransform: 'uppercase',
          }}
        >
          {crop.category} • {crop.season}
        </span>
        <StatusBadge status={crop.status} />
      </div>

      {/* Main Info */}
      <div style={{ marginBottom: 14 }}>
        <h3 style={{ margin: '0 0 4px', fontSize: '1.25rem', color: 'var(--farmer-text)' }}>
          {crop.name}
        </h3>
        <div style={{ fontSize: '0.84rem', color: 'var(--farmer-secondary)', fontWeight: 500 }}>
          Variety: <strong>{crop.variety}</strong>
        </div>
        <div style={{ fontSize: '0.76rem', color: 'var(--farmer-secondary)', marginTop: 2 }}>
          📍 {crop.village}, {crop.district} ({crop.cultivationArea} Acres)
        </div>
      </div>

      {/* Stock & Price Metric Box */}
      <div
        style={{
          background: '#F8FAF8',
          borderRadius: 10,
          padding: '12px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 10,
          border: '1px solid var(--farmer-border)',
          marginBottom: 16,
        }}
      >
        <div>
          <span style={{ fontSize: '0.72rem', color: 'var(--farmer-secondary)', display: 'block' }}>
            AVAILABLE STOCK
          </span>
          <strong style={{ fontSize: '1.15rem', color: 'var(--farmer-primary)' }}>
            {crop.availableQuantity} {crop.unit}
          </strong>
          <small style={{ display: 'block', fontSize: '0.7rem', color: 'var(--farmer-secondary)' }}>
            Sold: {crop.soldQuantity || 0} {crop.unit}
          </small>
        </div>

        <div>
          <span style={{ fontSize: '0.72rem', color: 'var(--farmer-secondary)', display: 'block' }}>
            EXPECTED PRICE
          </span>
          <strong style={{ fontSize: '1.15rem', color: 'var(--farmer-text)' }}>
            {formatCurrency(crop.expectedSellingPrice)}
          </strong>
          <small style={{ display: 'block', fontSize: '0.7rem', color: 'var(--farmer-secondary)' }}>
            Grade: <strong>{crop.qualityGrade}</strong>
          </small>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <button
          type="button"
          className="farmer-btn farmer-btn-outline farmer-btn-sm"
          style={{ flex: 1 }}
          onClick={() => onView(crop)}
        >
          View Details
        </button>

        <button
          type="button"
          className="farmer-btn farmer-btn-secondary farmer-btn-sm"
          onClick={() => onUpdateStock(crop)}
          title="Add Harvest Yield"
        >
          + Stock
        </button>

        <button
          type="button"
          className="farmer-btn farmer-btn-outline farmer-btn-sm"
          onClick={() => onEdit(crop)}
          title="Edit Crop"
        >
          ✏️
        </button>

        <button
          type="button"
          className="farmer-btn farmer-btn-danger farmer-btn-sm"
          onClick={() => onDelete(crop.id)}
          title="Delete Crop"
        >
          🗑️
        </button>
      </div>
    </div>
  );
}

export default CropCard;

import { useState, useMemo } from 'react';
import { useFarmer } from '../context/FarmerContext';
import { DEFAULT_CROP_OPTIONS } from '../../../services/farmerCropService';

function CropForm({ initialData = null, onSave, onCancel }) {
  const { profile, cropOptions } = useFarmer();

  const options = cropOptions || DEFAULT_CROP_OPTIONS;
  const categoryOptions = options.categories?.length ? options.categories : DEFAULT_CROP_OPTIONS.categories;
  const seasonOptions = options.seasons?.length ? options.seasons : DEFAULT_CROP_OPTIONS.seasons;
  const gradeOptions = options.qualityGrades?.length ? options.qualityGrades : DEFAULT_CROP_OPTIONS.qualityGrades;
  const unitOptions = options.units?.length ? options.units : DEFAULT_CROP_OPTIONS.units;

  // Resolve initial category/season/unit matching backend codes
  const resolveInitialCategory = () => {
    const raw = initialData?.category || initialData?.cropCategory;
    if (!raw) return categoryOptions[0]?.code || 'Cereals';
    const found = categoryOptions.find(
      (c) => c.code.toLowerCase() === raw.toLowerCase() || raw.toLowerCase().includes(c.code.toLowerCase().slice(0, 4))
    );
    return found ? found.code : categoryOptions[0]?.code || 'Cereals';
  };

  const resolveInitialSeason = () => {
    const raw = initialData?.season;
    if (!raw) return seasonOptions[0]?.code || 'Kharif';
    const found = seasonOptions.find((s) => s.code.toLowerCase() === raw.toLowerCase());
    return found ? found.code : seasonOptions[0]?.code || 'Kharif';
  };

  const resolveInitialUnit = () => {
    const raw = initialData?.unit;
    if (!raw) return unitOptions[0]?.code || 'Quintals';
    const found = unitOptions.find(
      (u) => u.code.toLowerCase() === raw.toLowerCase() || (raw.toLowerCase() === 'qtl' && u.code === 'Quintals')
    );
    return found ? found.code : unitOptions[0]?.code || 'Quintals';
  };

  const resolveInitialLocation = () => {
    if (initialData?.storageLocation) return initialData.storageLocation;
    const parts = [
      initialData?.village || profile.village,
      initialData?.district || profile.district,
      initialData?.state || profile.state,
    ].filter(Boolean);
    return parts.join(', ');
  };

  const [formData, setFormData] = useState({
    name: initialData?.name || initialData?.cropName || '',
    category: resolveInitialCategory(),
    variety: initialData?.variety || initialData?.cropVariety || '',
    season: resolveInitialSeason(),
    cultivationArea: initialData?.cultivationArea ?? initialData?.cultivationAreaAcres ?? '',
    harvestDate: initialData?.harvestDate
      ? String(initialData.harvestDate).split('T')[0]
      : new Date().toISOString().split('T')[0],
    availableQuantity: initialData?.availableQuantity ?? initialData?.harvestedQuantity ?? '',
    unit: resolveInitialUnit(),
    expectedSellingPrice: initialData?.expectedSellingPrice || '',
    qualityGrade: initialData?.qualityGrade || gradeOptions[0]?.code || 'Grade A',
    storageLocation: resolveInitialLocation(),
    village: initialData?.village || profile.village || '',
    district: initialData?.district || profile.district || '',
    description: initialData?.description || initialData?.cropDescription || '',
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
    if (submitError) {
      setSubmitError(null);
    }
  };

  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = 'Crop name is required.';
    if (!formData.variety.trim()) errs.variety = 'Variety is required.';
    if (!initialData && (!formData.availableQuantity || Number(formData.availableQuantity) <= 0)) {
      errs.availableQuantity = 'Quantity must be greater than 0.';
    }
    if (!formData.expectedSellingPrice || Number(formData.expectedSellingPrice) <= 0) {
      errs.expectedSellingPrice = 'Price must be greater than 0.';
    }
    if (!formData.cultivationArea || Number(formData.cultivationArea) <= 0) {
      errs.cultivationArea = 'Cultivation area is required.';
    }
    if (!formData.storageLocation.trim() && !formData.village.trim()) {
      errs.storageLocation = 'Storage location is required.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate() || isSubmitting) return;

    setIsSubmitting(true);
    setSubmitError(null);

    const resolvedLocation =
      formData.storageLocation.trim() ||
      [formData.village, formData.district, profile.state].filter(Boolean).join(', ') ||
      'Farm Warehouse';

    try {
      await onSave({
        ...formData,
        cultivationArea: Number(formData.cultivationArea),
        availableQuantity: Number(formData.availableQuantity || 0),
        harvestedQuantity: Number(formData.availableQuantity || 0),
        expectedSellingPrice: Number(formData.expectedSellingPrice),
        storageLocation: resolvedLocation,
      });
    } catch (err) {
      console.warn('CropForm submission error:', err);
      setSubmitError(err.message || 'Failed to save crop. Please check your inputs and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="farmer-card" style={{ padding: '24px' }}>
      <div className="farmer-card-header" style={{ padding: '0 0 16px', marginBottom: 20 }}>
        <h3>{initialData ? 'Edit Crop Details' : 'Register New Crop'}</h3>
        {onCancel && (
          <button
            type="button"
            className="farmer-btn farmer-btn-outline farmer-btn-sm"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            ✕ Cancel
          </button>
        )}
      </div>

      {submitError && (
        <div
          style={{
            padding: '12px 16px',
            marginBottom: '18px',
            borderRadius: '8px',
            background: '#FEF2F2',
            border: '1px solid #F87171',
            color: '#991B1B',
            fontSize: '0.88rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>⚠️ {submitError}</span>
          <button
            type="button"
            onClick={() => setSubmitError(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#991B1B' }}
          >
            ✕
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="farmer-form-row">
          <div className="farmer-form-group">
            <label>Crop Name *</label>
            <input
              type="text"
              name="name"
              placeholder="e.g. Paddy, Turmeric, Groundnut"
              value={formData.name}
              onChange={handleChange}
              disabled={isSubmitting}
            />
            {errors.name && <small style={{ color: 'var(--farmer-danger)' }}>{errors.name}</small>}
          </div>

          <div className="farmer-form-group">
            <label>Crop Category *</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              disabled={isSubmitting}
            >
              {categoryOptions.map((opt) => (
                <option key={opt.code} value={opt.code}>
                  {opt.label || opt.code}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="farmer-form-row">
          <div className="farmer-form-group">
            <label>Crop Variety *</label>
            <input
              type="text"
              name="variety"
              placeholder="e.g. BPT 5204, K-6, Salem"
              value={formData.variety}
              onChange={handleChange}
              disabled={isSubmitting}
            />
            {errors.variety && <small style={{ color: 'var(--farmer-danger)' }}>{errors.variety}</small>}
          </div>

          <div className="farmer-form-group">
            <label>Season *</label>
            <select
              name="season"
              value={formData.season}
              onChange={handleChange}
              disabled={isSubmitting}
            >
              {seasonOptions.map((opt) => (
                <option key={opt.code} value={opt.code}>
                  {opt.label || opt.code}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="farmer-form-row">
          <div className="farmer-form-group">
            <label>Cultivation Area (Acres) *</label>
            <input
              type="number"
              step="0.1"
              min="0.01"
              name="cultivationArea"
              placeholder="e.g. 5.0"
              value={formData.cultivationArea}
              onChange={handleChange}
              disabled={isSubmitting}
            />
            {errors.cultivationArea && (
              <small style={{ color: 'var(--farmer-danger)' }}>{errors.cultivationArea}</small>
            )}
          </div>

          <div className="farmer-form-group">
            <label>Harvest Date *</label>
            <input
              type="date"
              name="harvestDate"
              value={formData.harvestDate}
              onChange={handleChange}
              disabled={isSubmitting}
            />
          </div>
        </div>

        <div className="farmer-form-row">
          <div className="farmer-form-group">
            <label>
              {initialData ? 'Available Stock (Read-only on edit)' : 'Harvested / Initial Quantity *'}
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="number"
                step="0.01"
                min="0.01"
                name="availableQuantity"
                placeholder="Quantity"
                value={formData.availableQuantity}
                onChange={handleChange}
                disabled={Boolean(initialData) || isSubmitting}
                style={{ flex: 1, ...(initialData ? { background: '#F1F5F9' } : {}) }}
              />
              <select
                name="unit"
                value={formData.unit}
                onChange={handleChange}
                style={{ width: 130 }}
                disabled={isSubmitting}
              >
                {unitOptions.map((opt) => (
                  <option key={opt.code} value={opt.code}>
                    {opt.label || opt.code}
                  </option>
                ))}
              </select>
            </div>
            {errors.availableQuantity && (
              <small style={{ color: 'var(--farmer-danger)' }}>{errors.availableQuantity}</small>
            )}
            {initialData && (
              <small style={{ color: 'var(--farmer-secondary)', display: 'block', marginTop: 3 }}>
                Use <strong>+ Yield</strong> button in the inventory list to add new harvest yield.
              </small>
            )}
          </div>

          <div className="farmer-form-group">
            <label>Expected Selling Price (₹ / unit) *</label>
            <input
              type="number"
              step="1"
              min="0.01"
              name="expectedSellingPrice"
              placeholder="Price in INR"
              value={formData.expectedSellingPrice}
              onChange={handleChange}
              disabled={isSubmitting}
            />
            {errors.expectedSellingPrice && (
              <small style={{ color: 'var(--farmer-danger)' }}>{errors.expectedSellingPrice}</small>
            )}
          </div>
        </div>

        <div className="farmer-form-row">
          <div className="farmer-form-group">
            <label>Quality Grade</label>
            <select
              name="qualityGrade"
              value={formData.qualityGrade}
              onChange={handleChange}
              disabled={isSubmitting}
            >
              {gradeOptions.map((opt) => (
                <option key={opt.code} value={opt.code}>
                  {opt.label || opt.code}
                </option>
              ))}
            </select>
          </div>

          <div className="farmer-form-group">
            <label>Storage / Farm Location *</label>
            <input
              type="text"
              name="storageLocation"
              placeholder="e.g. Tadepalli Farm Warehouse Bay-1, Guntur"
              value={formData.storageLocation}
              onChange={handleChange}
              disabled={isSubmitting}
            />
            {errors.storageLocation && (
              <small style={{ color: 'var(--farmer-danger)' }}>{errors.storageLocation}</small>
            )}
          </div>
        </div>

        <div className="farmer-form-group">
          <label>Crop Description & Quality Notes</label>
          <textarea
            rows={3}
            name="description"
            placeholder="Moisture percentage, storage warehouse bay, cleaning and grading details..."
            value={formData.description}
            onChange={handleChange}
            disabled={isSubmitting}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 20 }}>
          {onCancel && (
            <button
              type="button"
              className="farmer-btn farmer-btn-outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            className="farmer-btn farmer-btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? initialData
                ? 'Updating...'
                : 'Saving...'
              : initialData
              ? 'Update Crop'
              : 'Save & Register Crop'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default CropForm;

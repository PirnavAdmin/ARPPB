import { useState } from 'react';
import { useFarmer } from '../context/FarmerContext';

function CropForm({ initialData = null, onSave, onCancel }) {
  const { profile } = useFarmer();

  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    category: initialData?.category || 'Cereal',
    variety: initialData?.variety || '',
    season: initialData?.season || 'Kharif',
    cultivationArea: initialData?.cultivationArea || '',
    harvestDate: initialData?.harvestDate || new Date().toISOString().split('T')[0],
    availableQuantity: initialData?.availableQuantity || '',
    unit: initialData?.unit || 'qtl',
    expectedSellingPrice: initialData?.expectedSellingPrice || '',
    qualityGrade: initialData?.qualityGrade || 'Grade A',
    village: initialData?.village || profile.village,
    district: initialData?.district || profile.district,
    state: initialData?.state || profile.state,
    description: initialData?.description || '',
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = 'Crop name is required.';
    if (!formData.variety.trim()) errs.variety = 'Variety is required.';
    if (!formData.availableQuantity || Number(formData.availableQuantity) <= 0) {
      errs.availableQuantity = 'Quantity must be greater than 0.';
    }
    if (!formData.expectedSellingPrice || Number(formData.expectedSellingPrice) <= 0) {
      errs.expectedSellingPrice = 'Price must be greater than 0.';
    }
    if (!formData.cultivationArea || Number(formData.cultivationArea) <= 0) {
      errs.cultivationArea = 'Cultivation area is required.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSave({
      ...formData,
      cultivationArea: Number(formData.cultivationArea),
      availableQuantity: Number(formData.availableQuantity),
      harvestedQuantity: Number(formData.availableQuantity),
      expectedSellingPrice: Number(formData.expectedSellingPrice),
    });
  };

  return (
    <div className="farmer-card" style={{ padding: '24px' }}>
      <div className="farmer-card-header" style={{ padding: '0 0 16px', marginBottom: 20 }}>
        <h3>{initialData ? 'Edit Crop Details' : 'Register New Crop'}</h3>
        {onCancel && (
          <button type="button" className="farmer-btn farmer-btn-outline farmer-btn-sm" onClick={onCancel}>
            ✕ Cancel
          </button>
        )}
      </div>

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
            />
            {errors.name && <small style={{ color: 'var(--farmer-danger)' }}>{errors.name}</small>}
          </div>

          <div className="farmer-form-group">
            <label>Crop Category *</label>
            <select name="category" value={formData.category} onChange={handleChange}>
              <option value="Cereal">Cereal (Paddy, Wheat, Maize)</option>
              <option value="Spices">Spices (Turmeric, Chilli)</option>
              <option value="Oilseed">Oilseed (Groundnut, Mustard)</option>
              <option value="Commercial / Cash Crop">Commercial / Cash Crop (Cotton, Sugarcane)</option>
              <option value="Pulses">Pulses (Red Gram, Bengal Gram)</option>
              <option value="Horticulture">Horticulture (Fruits, Vegetables)</option>
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
            />
            {errors.variety && <small style={{ color: 'var(--farmer-danger)' }}>{errors.variety}</small>}
          </div>

          <div className="farmer-form-group">
            <label>Season *</label>
            <select name="season" value={formData.season} onChange={handleChange}>
              <option value="Kharif">Kharif (Monsoon)</option>
              <option value="Rabi">Rabi (Winter)</option>
              <option value="Zaid">Zaid (Summer)</option>
              <option value="Annual">Annual / Perennial</option>
            </select>
          </div>
        </div>

        <div className="farmer-form-row">
          <div className="farmer-form-group">
            <label>Cultivation Area (Acres) *</label>
            <input
              type="number"
              step="0.5"
              name="cultivationArea"
              placeholder="e.g. 5.0"
              value={formData.cultivationArea}
              onChange={handleChange}
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
            />
          </div>
        </div>

        <div className="farmer-form-row">
          <div className="farmer-form-group">
            <label>Harvested / Available Quantity *</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="number"
                name="availableQuantity"
                placeholder="Quantity"
                value={formData.availableQuantity}
                onChange={handleChange}
                style={{ flex: 1 }}
              />
              <select name="unit" value={formData.unit} onChange={handleChange} style={{ width: 110 }}>
                <option value="qtl">Quintals (qtl)</option>
                <option value="kg">Kilograms (kg)</option>
                <option value="bags">Bags (50kg)</option>
                <option value="tonnes">Tonnes</option>
              </select>
            </div>
            {errors.availableQuantity && (
              <small style={{ color: 'var(--farmer-danger)' }}>{errors.availableQuantity}</small>
            )}
          </div>

          <div className="farmer-form-group">
            <label>Expected Selling Price (₹ / unit) *</label>
            <input
              type="number"
              name="expectedSellingPrice"
              placeholder="Price in INR"
              value={formData.expectedSellingPrice}
              onChange={handleChange}
            />
            {errors.expectedSellingPrice && (
              <small style={{ color: 'var(--farmer-danger)' }}>{errors.expectedSellingPrice}</small>
            )}
          </div>
        </div>

        <div className="farmer-form-row">
          <div className="farmer-form-group">
            <label>Quality Grade</label>
            <select name="qualityGrade" value={formData.qualityGrade} onChange={handleChange}>
              <option value="Grade A">Grade A (Premium Export Quality)</option>
              <option value="Grade B">Grade B (Standard Commercial)</option>
              <option value="Grade C">Grade C (Processing Grade)</option>
            </select>
          </div>

          <div className="farmer-form-group">
            <label>Storage / Farm Location</label>
            <input
              type="text"
              name="village"
              placeholder="Village, District"
              value={`${formData.village}, ${formData.district}`}
              onChange={(e) => {
                const parts = e.target.value.split(',');
                setFormData((prev) => ({
                  ...prev,
                  village: parts[0]?.trim() || '',
                  district: parts[1]?.trim() || prev.district,
                }));
              }}
            />
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
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 20 }}>
          {onCancel && (
            <button type="button" className="farmer-btn farmer-btn-outline" onClick={onCancel}>
              Cancel
            </button>
          )}
          <button type="submit" className="farmer-btn farmer-btn-primary">
            {initialData ? 'Update Crop' : 'Save & Register Crop'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default CropForm;

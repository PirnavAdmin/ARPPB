import { useState, useEffect } from 'react';
import { useFarmer } from '../context/FarmerContext';
import { formatCurrency, calculateExpectedPaymentDate, formatDate } from '../utils/farmerHelpers';

function SalesForm({ onSaleCreated }) {
  const { crops, profile, createSale, setActiveOtpRequest } = useFarmer();

  const [formData, setFormData] = useState({
    buyerCategory: 'Middleman',
    buyerName: '',
    buyerMobile: '',
    cropId: crops[0]?.id || '',
    cropName: crops[0]?.name || '',
    sellingQuantity: '',
    rate: crops[0]?.expectedSellingPrice || '',
    qualityGrade: crops[0]?.qualityGrade || 'Grade A',
    pickupLocation: `${profile.farmName}, Tadepalli, Guntur`,
    expectedPickupDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    notes: '',
  });

  const [errors, setErrors] = useState({});
  const [createdResult, setCreatedResult] = useState(null);

  // Find currently selected crop object
  const selectedCrop = crops.find(
    (c) => c.name.toLowerCase() === formData.cropName.toLowerCase()
  ) || crops[0];

  // When selected crop changes, update rate and grade defaults
  useEffect(() => {
    if (selectedCrop) {
      setFormData((prev) => ({
        ...prev,
        cropId: selectedCrop.id,
        rate: selectedCrop.expectedSellingPrice,
        qualityGrade: selectedCrop.qualityGrade,
      }));
    }
  }, [formData.cropName, selectedCrop]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const qty = Number(formData.sellingQuantity) || 0;
  const rate = Number(formData.rate) || 0;
  const totalAmount = qty * rate;
  const expectedPayDate = calculateExpectedPaymentDate(new Date(), 3);

  const validate = () => {
    const errs = {};
    if (!formData.buyerName.trim()) {
      errs.buyerName = 'Buyer or trading firm name is required.';
    }
    if (!formData.buyerMobile.trim() || formData.buyerMobile.trim().length < 10) {
      errs.buyerMobile = 'Valid 10-digit mobile number is required for OTP delivery.';
    }
    if (!selectedCrop) {
      errs.cropName = 'Please select an available crop.';
    }
    if (qty <= 0) {
      errs.sellingQuantity = 'Quantity must be greater than zero.';
    } else if (selectedCrop && qty > selectedCrop.availableQuantity) {
      errs.sellingQuantity = `Cannot sell more than available stock (${selectedCrop.availableQuantity} ${selectedCrop.unit}).`;
    }
    if (rate <= 0) {
      errs.rate = 'Price per unit must be greater than zero.';
    }
    if (!formData.expectedPickupDate) {
      errs.expectedPickupDate = 'Expected pickup date is required.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const result = createSale(formData);
    if (result) {
      setCreatedResult(result);
      if (onSaleCreated) onSaleCreated(result);
    }
  };

  const handleResetForm = () => {
    setCreatedResult(null);
    setFormData({
      buyerCategory: 'Middleman',
      buyerName: '',
      buyerMobile: '',
      cropId: crops[0]?.id || '',
      cropName: crops[0]?.name || '',
      sellingQuantity: '',
      rate: crops[0]?.expectedSellingPrice || '',
      qualityGrade: crops[0]?.qualityGrade || 'Grade A',
      pickupLocation: `${profile.farmName}, Tadepalli, Guntur`,
      expectedPickupDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      notes: '',
    });
    setErrors({});
  };

  return (
    <div>
      {/* If newly created, show prominent success banner with action */}
      {createdResult && (
        <div
          style={{
            backgroundColor: '#E8F5EC',
            border: '2px solid #237A45',
            borderRadius: 16,
            padding: '24px',
            marginBottom: 24,
            animation: 'slideUp 0.3s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <span style={{ fontSize: '1.8rem' }}>🎉</span>
            <div>
              <h3 style={{ margin: 0, color: 'var(--farmer-dark)' }}>
                Sale Order Created Successfully!
              </h3>
              <p style={{ margin: '4px 0 0', color: 'var(--farmer-secondary)', fontSize: '0.92rem' }}>
                Transaction ID: <strong>{createdResult.transaction.id}</strong> • OTP Sent to{' '}
                <strong>{createdResult.transaction.buyerMobile}</strong>
              </p>
            </div>
          </div>

          <div
            style={{
              background: '#FFFFFF',
              borderRadius: 12,
              padding: '16px',
              border: '1px solid var(--farmer-border)',
              margin: '14px 0',
            }}
          >
            <div style={{ fontWeight: 600, color: 'var(--farmer-text)', marginBottom: 6 }}>
              Status: <span style={{ color: 'var(--farmer-warning)' }}>⏳ Pending OTP Confirmation</span>
            </div>
            <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--farmer-secondary)', lineHeight: 1.5 }}>
              Stock for <strong>{createdResult.transaction.quantity} {createdResult.transaction.unit} {createdResult.transaction.cropName}</strong> has been <em>reserved</em>. Your stock balance will update automatically once the receiving party confirms with the 6-digit OTP.
            </p>
            <p style={{ margin: '8px 0 0', fontSize: '0.88rem', color: 'var(--farmer-primary)', fontWeight: 600 }}>
              Expected Payment: Within 3 working days ({formatDate(createdResult.transaction.expectedPaymentDate)}), subject to the agreed settlement method.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button
              type="button"
              className="farmer-btn farmer-btn-primary"
              onClick={() => setActiveOtpRequest(createdResult.otpRequest)}
            >
              🔐 Test / Confirm OTP Verification Now
            </button>
            <button
              type="button"
              className="farmer-btn farmer-btn-outline"
              onClick={handleResetForm}
            >
              Create Another Sale
            </button>
          </div>
        </div>
      )}

      {/* Main Grid: Form on Left, Live Transaction Summary on Right */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 0.9fr', gap: 24 }}>
        {/* Sales Form Card */}
        <div className="farmer-card" style={{ padding: '24px' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '1.25rem' }}>Create Farmer Sale Order</h3>

          <form onSubmit={handleSubmit}>
            {/* Buyer Category Segmented Buttons */}
            <div className="farmer-form-group">
              <label>Buyer Category *</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                {['Middleman', 'Vendor', 'Customer'].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, buyerCategory: cat }))}
                    style={{
                      padding: '10px 12px',
                      borderRadius: 10,
                      border: formData.buyerCategory === cat ? '2px solid var(--farmer-primary)' : '1px solid var(--farmer-border)',
                      backgroundColor: formData.buyerCategory === cat ? 'var(--farmer-light)' : '#FCFDFC',
                      color: formData.buyerCategory === cat ? 'var(--farmer-dark)' : 'var(--farmer-text)',
                      fontWeight: formData.buyerCategory === cat ? 700 : 500,
                      cursor: 'pointer',
                      textAlign: 'center',
                      fontSize: '0.9rem',
                      transition: 'all 0.2s',
                    }}
                  >
                    {cat === 'Middleman' && '🤝 '}
                    {cat === 'Vendor' && '🏭 '}
                    {cat === 'Customer' && '🛒 '}
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="farmer-form-row">
              <div className="farmer-form-group">
                <label>Buyer / Trading Firm Name *</label>
                <input
                  type="text"
                  name="buyerName"
                  placeholder="e.g. Sri Laxmi Agro Traders"
                  value={formData.buyerName}
                  onChange={handleChange}
                />
                {errors.buyerName && (
                  <small style={{ color: 'var(--farmer-danger)' }}>{errors.buyerName}</small>
                )}
              </div>

              <div className="farmer-form-group">
                <label>Buyer Mobile Number (For OTP) *</label>
                <input
                  type="tel"
                  name="buyerMobile"
                  placeholder="e.g. 98480 12345"
                  value={formData.buyerMobile}
                  onChange={handleChange}
                />
                {errors.buyerMobile && (
                  <small style={{ color: 'var(--farmer-danger)' }}>{errors.buyerMobile}</small>
                )}
              </div>
            </div>

            {/* Crop Selection & Available Stock Notice */}
            <div className="farmer-form-row">
              <div className="farmer-form-group">
                <label>Select Crop *</label>
                <select name="cropName" value={formData.cropName} onChange={handleChange}>
                  {crops.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name} ({c.variety}) - Available: {c.availableQuantity} {c.unit}
                    </option>
                  ))}
                </select>
                {selectedCrop && (
                  <small style={{ color: selectedCrop.availableQuantity < 50 ? 'var(--farmer-warning)' : 'var(--farmer-primary)', fontWeight: 600 }}>
                    Current Available Stock: {selectedCrop.availableQuantity} {selectedCrop.unit}
                  </small>
                )}
              </div>

              <div className="farmer-form-group">
                <label>Quality Grade</label>
                <select name="qualityGrade" value={formData.qualityGrade} onChange={handleChange}>
                  <option value="Grade A">Grade A (Premium)</option>
                  <option value="Grade B">Grade B (Standard)</option>
                  <option value="Grade C">Grade C (Commercial)</option>
                </select>
              </div>
            </div>

            <div className="farmer-form-row">
              <div className="farmer-form-group">
                <label>Selling Quantity ({selectedCrop?.unit || 'qtl'}) *</label>
                <input
                  type="number"
                  step="0.5"
                  name="sellingQuantity"
                  placeholder={`Max: ${selectedCrop?.availableQuantity || 0}`}
                  value={formData.sellingQuantity}
                  onChange={handleChange}
                />
                {errors.sellingQuantity && (
                  <small style={{ color: 'var(--farmer-danger)' }}>{errors.sellingQuantity}</small>
                )}
              </div>

              <div className="farmer-form-group">
                <label>Price per {selectedCrop?.unit || 'unit'} (₹) *</label>
                <input
                  type="number"
                  name="rate"
                  placeholder="Price in INR"
                  value={formData.rate}
                  onChange={handleChange}
                />
                {errors.rate && (
                  <small style={{ color: 'var(--farmer-danger)' }}>{errors.rate}</small>
                )}
              </div>
            </div>

            <div className="farmer-form-row">
              <div className="farmer-form-group">
                <label>Pickup / Loading Location *</label>
                <input
                  type="text"
                  name="pickupLocation"
                  value={formData.pickupLocation}
                  onChange={handleChange}
                />
              </div>

              <div className="farmer-form-group">
                <label>Expected Pickup Date *</label>
                <input
                  type="date"
                  name="expectedPickupDate"
                  value={formData.expectedPickupDate}
                  onChange={handleChange}
                />
                {errors.expectedPickupDate && (
                  <small style={{ color: 'var(--farmer-danger)' }}>{errors.expectedPickupDate}</small>
                )}
              </div>
            </div>

            <div className="farmer-form-group">
              <label>Additional Terms / Dispatch Notes</label>
              <textarea
                rows={2}
                name="notes"
                placeholder="Moisture standards, weighing slip requirements, transportation arrangements..."
                value={formData.notes}
                onChange={handleChange}
              />
            </div>

            <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button
                type="button"
                className="farmer-btn farmer-btn-outline"
                onClick={handleResetForm}
              >
                Clear Form
              </button>
              <button type="submit" className="farmer-btn farmer-btn-primary">
                📤 Submit Sale & Send OTP Request
              </button>
            </div>
          </form>
        </div>

        {/* Live Transaction Preview & Calculation Card */}
        <div>
          <div
            className="farmer-card"
            style={{
              padding: '24px',
              position: 'sticky',
              top: '90px',
              backgroundColor: '#FFFFFF',
              border: '2px solid #E8F5EC',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h4 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--farmer-dark)' }}>
                Transaction Summary
              </h4>
              <span
                style={{
                  background: 'var(--farmer-light)',
                  color: 'var(--farmer-primary)',
                  padding: '3px 8px',
                  borderRadius: 6,
                  fontSize: '0.72rem',
                  fontWeight: 700,
                }}
              >
                LIVE PREVIEW
              </span>
            </div>

            {/* Calculations Breakdown */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: '0.9rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--farmer-secondary)' }}>Crop Selected:</span>
                <strong>{selectedCrop ? `${selectedCrop.name} (${selectedCrop.variety})` : '-'}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--farmer-secondary)' }}>Selling Quantity:</span>
                <span>
                  {qty > 0 ? `${qty} ${selectedCrop?.unit || 'qtl'}` : '-'}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--farmer-secondary)' }}>Unit Rate:</span>
                <span>{rate > 0 ? `${formatCurrency(rate)} / ${selectedCrop?.unit || 'qtl'}` : '-'}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--farmer-secondary)' }}>Buyer:</span>
                <span>{formData.buyerName || 'Not specified'}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--farmer-secondary)' }}>Buyer Category:</span>
                <span style={{ fontWeight: 600 }}>{formData.buyerCategory}</span>
              </div>

              {/* Total Calculation Highlight Box */}
              <div
                style={{
                  padding: '16px',
                  background: 'linear-gradient(135deg, #E8F5EC 0%, #D8F2E1 100%)',
                  borderRadius: 12,
                  marginTop: 6,
                  border: '1px solid #BFE8CF',
                }}
              >
                <div style={{ fontSize: '0.8rem', color: 'var(--farmer-dark)', fontWeight: 600 }}>
                  TOTAL TRANSACTION AMOUNT
                </div>
                <div style={{ fontSize: '1.9rem', fontWeight: 800, color: 'var(--farmer-dark)', letterSpacing: '-0.02em', margin: '4px 0' }}>
                  {formatCurrency(totalAmount)}
                </div>
                <small style={{ color: 'var(--farmer-secondary)', display: 'block' }}>
                  Calculated as: {qty} {selectedCrop?.unit || 'qtl'} × {formatCurrency(rate)}
                </small>
              </div>

              <div
                style={{
                  padding: '12px',
                  backgroundColor: '#F8FAF8',
                  borderRadius: 10,
                  fontSize: '0.82rem',
                  color: 'var(--farmer-secondary)',
                  border: '1px solid var(--farmer-border)',
                }}
              >
                <strong style={{ color: 'var(--farmer-text)', display: 'block', marginBottom: 4 }}>
                  🛡️ Security & Stock Guarantee
                </strong>
                Stock is deducted only after recipient inputs their 6-digit OTP code. Payment is credited to your registered bank account within 3 business days ({formatDate(expectedPayDate)}).
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SalesForm;

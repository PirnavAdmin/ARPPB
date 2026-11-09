import { useState } from 'react';
import { useFarmer } from '../context/FarmerContext';

function MyProfile() {
  const { profile, updateProfile, showToast } = useFarmer();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ ...profile });
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('bank_')) {
      const field = name.replace('bank_', '');
      setFormData((prev) => ({
        ...prev,
        bankDetails: {
          ...prev.bankDetails,
          [field]: value,
        },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    updateProfile(formData);
    setIsEditing(false);
  };

  const handleChangePassword = (e) => {
    e.preventDefault();
    if (passwordForm.currentPassword !== profile.password) {
      showToast('Current password is incorrect.', 'error');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showToast('New passwords do not match.', 'error');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      showToast('Password must be at least 6 characters long.', 'error');
      return;
    }

    updateProfile({ password: passwordForm.newPassword });
    showToast('Password updated successfully!', 'success');
    setIsPasswordModalOpen(false);
    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  return (
    <div>
      <div className="farmer-page-header">
        <div className="farmer-header-titles">
          <h2>Farmer Profile & Account Settings</h2>
          <p>Verified farmer credentials, landholding details, and bank account for automated sales settlement</p>
        </div>

        <div className="farmer-header-actions">
          {!isEditing ? (
            <>
              <button
                type="button"
                className="farmer-btn farmer-btn-primary"
                onClick={() => {
                  setFormData({ ...profile });
                  setIsEditing(true);
                }}
              >
                ✏️ Edit Profile Details
              </button>
              <button
                type="button"
                className="farmer-btn farmer-btn-outline"
                onClick={() => setIsPasswordModalOpen(true)}
              >
                🔒 Change Password
              </button>
            </>
          ) : (
            <button
              type="button"
              className="farmer-btn farmer-btn-outline"
              onClick={() => setIsEditing(false)}
            >
              ✕ Cancel Editing
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 24 }}>
        {/* Left Farmer Identity Card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="farmer-card" style={{ padding: '28px 20px', textAlign: 'center' }}>
            <div className="farmer-avatar lg" style={{ margin: '0 auto 16px' }}>
              {profile.farmerName.split(' ').map((n) => n[0]).join('').slice(0, 2)}
            </div>

            <h3 style={{ margin: '0 0 4px', fontSize: '1.35rem' }}>{profile.farmerName}</h3>
            <div style={{ color: 'var(--farmer-primary)', fontWeight: 700, fontSize: '0.9rem' }}>
              {profile.farmName}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--farmer-secondary)', marginTop: 4 }}>
              Kisan ID: <strong>{profile.farmerId}</strong>
            </div>

            <div
              style={{
                marginTop: 20,
                paddingTop: 16,
                borderTop: '1px solid var(--farmer-border)',
                display: 'flex',
                justifyContent: 'space-around',
                textAlign: 'center',
              }}
            >
              <div>
                <strong style={{ fontSize: '1.1rem', color: 'var(--farmer-text)' }}>
                  {profile.rating.split(' ')[0]}
                </strong>
                <small style={{ display: 'block', color: 'var(--farmer-secondary)', fontSize: '0.72rem' }}>
                  Platform Rating
                </small>
              </div>
              <div style={{ borderLeft: '1px solid var(--farmer-border)', paddingLeft: 16 }}>
                <strong style={{ fontSize: '1.1rem', color: 'var(--farmer-primary)' }}>18.5</strong>
                <small style={{ display: 'block', color: 'var(--farmer-secondary)', fontSize: '0.72rem' }}>
                  Total Acres
                </small>
              </div>
            </div>
          </div>

          {/* Quick Agricultural Stats Card */}
        </div>

        {/* Right Details Card & Form */}
        <div className="farmer-card" style={{ padding: '28px' }}>
          <form onSubmit={handleSave}>
            {/* Section 1: Personal & Contact */}
            <h4
              style={{
                margin: '0 0 16px',
                fontSize: '1.05rem',
                color: 'var(--farmer-dark)',
                borderBottom: '1px solid var(--farmer-border)',
                paddingBottom: 8,
              }}
            >
              1. Personal & Contact Information
            </h4>

            <div className="farmer-form-row">
              <div className="farmer-form-group">
                <label>Farmer Full Name *</label>
                <input
                  type="text"
                  name="farmerName"
                  value={formData.farmerName}
                  onChange={handleChange}
                  disabled={!isEditing}
                  required
                />
              </div>

              <div className="farmer-form-group">
                <label>Farmer ID (Official Registry)</label>
                <input
                  type="text"
                  value={formData.farmerId}
                  disabled
                  style={{ background: '#F1F5F9' }}
                />
              </div>
            </div>

            <div className="farmer-form-row">
              <div className="farmer-form-group">
                <label>Mobile Number (SMS & OTP) *</label>
                <input
                  type="tel"
                  name="mobileNumber"
                  value={formData.mobileNumber}
                  onChange={handleChange}
                  disabled={!isEditing}
                  required
                />
              </div>

              <div className="farmer-form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={!isEditing}
                />
              </div>
            </div>

            {/* Section 2: Farm Location & Land Area */}
            <h4
              style={{
                margin: '24px 0 16px',
                fontSize: '1.05rem',
                color: 'var(--farmer-dark)',
                borderBottom: '1px solid var(--farmer-border)',
                paddingBottom: 8,
              }}
            >
              2. Farm Location & Landholding
            </h4>

            <div className="farmer-form-row">
              <div className="farmer-form-group">
                <label>Farm / Plantation Name *</label>
                <input
                  type="text"
                  name="farmName"
                  value={formData.farmName}
                  onChange={handleChange}
                  disabled={!isEditing}
                  required
                />
              </div>

              <div className="farmer-form-group">
                <label>Total Land Area *</label>
                <input
                  type="text"
                  name="totalLandArea"
                  value={formData.totalLandArea}
                  onChange={handleChange}
                  disabled={!isEditing}
                  required
                />
              </div>
            </div>

            <div className="farmer-form-row">
              <div className="farmer-form-group">
                <label>Village *</label>
                <input
                  type="text"
                  name="village"
                  value={formData.village}
                  onChange={handleChange}
                  disabled={!isEditing}
                />
              </div>

              <div className="farmer-form-group">
                <label>Mandal / Tehsil *</label>
                <input
                  type="text"
                  name="mandal"
                  value={formData.mandal}
                  onChange={handleChange}
                  disabled={!isEditing}
                />
              </div>
            </div>

            <div className="farmer-form-row">
              <div className="farmer-form-group">
                <label>District *</label>
                <input
                  type="text"
                  name="district"
                  value={formData.district}
                  onChange={handleChange}
                  disabled={!isEditing}
                />
              </div>

              <div className="farmer-form-row" style={{ gap: 12 }}>
                <div className="farmer-form-group">
                  <label>State *</label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    disabled={!isEditing}
                  />
                </div>
                <div className="farmer-form-group">
                  <label>PIN Code *</label>
                  <input
                    type="text"
                    name="pinCode"
                    value={formData.pinCode}
                    onChange={handleChange}
                    disabled={!isEditing}
                  />
                </div>
              </div>
            </div>

            <div className="farmer-form-group">
              <label>Complete Dispatch & Farm Address *</label>
              <textarea
                rows={2}
                name="completeAddress"
                value={formData.completeAddress}
                onChange={handleChange}
                disabled={!isEditing}
              />
            </div>

            {/* Section 3: Bank Details for Settlement */}
            <h4
              style={{
                margin: '24px 0 16px',
                fontSize: '1.05rem',
                color: 'var(--farmer-dark)',
                borderBottom: '1px solid var(--farmer-border)',
                paddingBottom: 8,
              }}
            >
              3. Bank Details (For Direct Trade Settlement)
            </h4>

            <div className="farmer-form-row">
              <div className="farmer-form-group">
                <label>Bank Name</label>
                <input
                  type="text"
                  name="bank_bankName"
                  value={formData.bankDetails?.bankName || ''}
                  onChange={handleChange}
                  disabled={!isEditing}
                />
              </div>

              <div className="farmer-form-group">
                <label>Account Number</label>
                <input
                  type="text"
                  name="bank_fullAccountNumber"
                  value={
                    isEditing
                      ? formData.bankDetails?.fullAccountNumber || ''
                      : formData.bankDetails?.accountNumber || ''
                  }
                  onChange={handleChange}
                  disabled={!isEditing}
                />
              </div>
            </div>

            <div className="farmer-form-row">
              <div className="farmer-form-group">
                <label>IFSC Code</label>
                <input
                  type="text"
                  name="bank_ifscCode"
                  value={formData.bankDetails?.ifscCode || ''}
                  onChange={handleChange}
                  disabled={!isEditing}
                />
              </div>

              <div className="farmer-form-group">
                <label>Branch Name & Account Type</label>
                <input
                  type="text"
                  name="bank_branch"
                  value={`${formData.bankDetails?.branch || ''} (${formData.bankDetails?.accountType || ''})`}
                  onChange={handleChange}
                  disabled={!isEditing}
                />
              </div>
            </div>

            {isEditing && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
                <button
                  type="button"
                  className="farmer-btn farmer-btn-outline"
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="farmer-btn farmer-btn-primary">
                  💾 Save Profile Changes
                </button>
              </div>
            )}
          </form>
        </div>
      </div>

      {/* Change Password Modal */}
      {isPasswordModalOpen && (
        <div className="farmer-modal-overlay" role="dialog" aria-modal="true">
          <div className="farmer-modal-content">
            <div className="farmer-modal-header">
              <h3>Change Farmer Account Password</h3>
              <button
                type="button"
                className="farmer-modal-close"
                onClick={() => setIsPasswordModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleChangePassword}>
              <div className="farmer-modal-body">
                <div className="farmer-form-group">
                  <label>Current Password *</label>
                  <input
                    type="password"
                    placeholder="Enter current password"
                    value={passwordForm.currentPassword}
                    onChange={(e) =>
                      setPasswordForm((prev) => ({
                        ...prev,
                        currentPassword: e.target.value,
                      }))
                    }
                    required
                  />
                </div>

                <div className="farmer-form-group">
                  <label>New Password *</label>
                  <input
                    type="password"
                    placeholder="Min 6 characters"
                    value={passwordForm.newPassword}
                    onChange={(e) =>
                      setPasswordForm((prev) => ({
                        ...prev,
                        newPassword: e.target.value,
                      }))
                    }
                    required
                  />
                </div>

                <div className="farmer-form-group">
                  <label>Confirm New Password *</label>
                  <input
                    type="password"
                    placeholder="Re-enter new password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) =>
                      setPasswordForm((prev) => ({
                        ...prev,
                        confirmPassword: e.target.value,
                      }))
                    }
                    required
                  />
                </div>
              </div>

              <div className="farmer-modal-footer">
                <button
                  type="button"
                  className="farmer-btn farmer-btn-outline"
                  onClick={() => setIsPasswordModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="farmer-btn farmer-btn-primary">
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default MyProfile;

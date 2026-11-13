import { useState, useEffect } from 'react';
import { useFarmer } from '../context/FarmerContext';
import { generateOTP } from '../utils/farmerHelpers';

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

  // Mobile Number OTP Verification States
  const [verifiedPhone, setVerifiedPhone] = useState('');
  const [isMobileVerified, setIsMobileVerified] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [otpInput, setOtpInput] = useState('');
  const [otpError, setOtpError] = useState('');
  const [demoOtpNotice, setDemoOtpNotice] = useState('');
  const [localGeneratedOtp, setLocalGeneratedOtp] = useState('');

  // Countdown timer for OTP resend cooldown
  useEffect(() => {
    if (otpCooldown <= 0) return;
    const interval = setInterval(() => {
      setOtpCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [otpCooldown]);

  const currentCleanPhone = String(profile.mobileNumber || '').replace(/\D/g, '').slice(-10);
  const formCleanPhone = String(formData.mobileNumber || '').replace(/\D/g, '').slice(-10);
  const hasPhoneChanged = Boolean(formCleanPhone && currentCleanPhone && formCleanPhone !== currentCleanPhone);
  const isPhoneCurrentlyVerified = hasPhoneChanged && isMobileVerified && verifiedPhone === formCleanPhone;

  const handleStartEditing = () => {
    setFormData({ ...profile });
    setIsEditing(true);
    setOtpSent(false);
    setOtpInput('');
    setOtpError('');
    setIsMobileVerified(false);
    setVerifiedPhone('');
    setDemoOtpNotice('');
    setLocalGeneratedOtp('');
  };

  const handleCancelEditing = () => {
    setFormData({ ...profile });
    setIsEditing(false);
    setOtpSent(false);
    setOtpInput('');
    setOtpError('');
    setIsMobileVerified(false);
    setVerifiedPhone('');
    setDemoOtpNotice('');
    setLocalGeneratedOtp('');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'mobileNumber') {
      const sanitized = value.replace(/[^\d+ ]/g, '');
      setFormData((prev) => ({ ...prev, [name]: sanitized }));
      const digits = sanitized.replace(/\D/g, '').slice(-10);
      if (digits !== verifiedPhone) {
        setIsMobileVerified(false);
      }
      setOtpError('');
      return;
    }

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

  const handleSendOtp = () => {
    if (!formCleanPhone || formCleanPhone.length !== 10 || !/^[6-9]\d{9}$/.test(formCleanPhone)) {
      setOtpError('Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    setIsSendingOtp(true);
    setOtpError('');
    setOtpInput('');

    const generated = generateOTP();
    setLocalGeneratedOtp(generated);
    setOtpSent(true);
    setOtpCooldown(30);
    setDemoOtpNotice(generated);
    showToast(`Verification OTP sent to +91 ${formCleanPhone}. (Demo Code: ${generated})`, 'info', 7000);
    setIsSendingOtp(false);
  };

  const handleVerifyOtp = () => {
    const cleanOtp = String(otpInput || '').trim();
    if (cleanOtp.length !== 6) {
      setOtpError('Please enter a complete 6-digit OTP code.');
      return;
    }

    setIsVerifyingOtp(true);
    setOtpError('');

    if (localGeneratedOtp && cleanOtp === localGeneratedOtp) {
      setIsMobileVerified(true);
      setVerifiedPhone(formCleanPhone);
      setOtpSent(false);
      showToast(`Mobile number +91 ${formCleanPhone} verified successfully!`, 'success');
    } else {
      setOtpError('Invalid OTP code. Please enter the correct 6-digit code.');
    }
    setIsVerifyingOtp(false);
  };

  const handleSave = (e) => {
    e.preventDefault();

    if (hasPhoneChanged && !isPhoneCurrentlyVerified) {
      showToast('Please verify your new mobile number with OTP before saving.', 'error');
      return;
    }

    const finalMobile = hasPhoneChanged ? `+91 ${formCleanPhone}` : formData.mobileNumber;

    if (hasPhoneChanged && isPhoneCurrentlyVerified) {
      // 1. Persist updated farmer credentials for future logins
      try {
        const raw = window.localStorage.getItem('agri_farmer_auth_v1');
        const existing = raw ? JSON.parse(raw) : {};
        const oldList = Array.isArray(existing.oldMobiles) ? existing.oldMobiles : [];
        if (currentCleanPhone && !oldList.includes(currentCleanPhone)) {
          oldList.push(currentCleanPhone);
        }

        const updatedFarmerAuth = {
          ...existing,
          mobile: formCleanPhone,
          oldMobiles: oldList,
          password: profile.password || 'farmer@123',
          fullName: formData.farmerName || profile.farmerName,
          farmerId: profile.farmerId,
          updatedAt: new Date().toISOString(),
        };
        window.localStorage.setItem('agri_farmer_auth_v1', JSON.stringify(updatedFarmerAuth));
      } catch (err) {
        console.error('Failed to update farmer auth storage:', err);
      }

      // 2. Update AuthContext session in localStorage if user is currently logged in as farmer
      try {
        const rawSession = window.localStorage.getItem('arppb_auth_session_v1');
        if (rawSession) {
          const parsed = JSON.parse(rawSession);
          if (parsed?.user) {
            parsed.user.mobile = formCleanPhone;
            parsed.user.contactNumber = formCleanPhone;
            parsed.user.phone = formCleanPhone;
            window.localStorage.setItem('arppb_auth_session_v1', JSON.stringify(parsed));
          }
        }
      } catch {
        // Ignore storage errors
      }

      showToast(
        `Mobile number updated to +91 ${formCleanPhone}! Please use this new number for your next login.`,
        'success',
        6000
      );
    }

    updateProfile({
      ...formData,
      mobileNumber: finalMobile,
    });

    setIsEditing(false);
    setOtpSent(false);
    setOtpInput('');
    setOtpError('');
    setIsMobileVerified(false);
    setVerifiedPhone('');
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
    // Also sync password in agri_farmer_auth_v1
    try {
      const raw = window.localStorage.getItem('agri_farmer_auth_v1');
      if (raw) {
        const parsed = JSON.parse(raw);
        parsed.password = passwordForm.newPassword;
        window.localStorage.setItem('agri_farmer_auth_v1', JSON.stringify(parsed));
      }
    } catch {}
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
                onClick={handleStartEditing}
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
              onClick={handleCancelEditing}
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

            <div className="farmer-form-row" style={{ alignItems: 'flex-start' }}>
              <div className="farmer-form-group" style={{ flex: 1.3 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <label style={{ margin: 0 }}>Mobile Number (SMS & OTP) *</label>
                  {isEditing && (
                    hasPhoneChanged ? (
                      isPhoneCurrentlyVerified ? (
                        <span style={{ color: '#16A34A', fontSize: '0.78rem', fontWeight: 700 }}>
                          ✓ OTP Verified
                        </span>
                      ) : (
                        <span style={{ color: '#D97706', fontSize: '0.78rem', fontWeight: 700 }}>
                          ⚠️ Verification Required
                        </span>
                      )
                    ) : (
                      <span style={{ color: '#16A34A', fontSize: '0.78rem', fontWeight: 600 }}>
                        ✓ Current Registered
                      </span>
                    )
                  )}
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="tel"
                    name="mobileNumber"
                    value={formData.mobileNumber}
                    onChange={handleChange}
                    disabled={!isEditing}
                    placeholder="10-digit mobile number"
                    required
                    style={{ flex: 1 }}
                  />
                  {isEditing && hasPhoneChanged && !isPhoneCurrentlyVerified && (
                    <button
                      type="button"
                      className="farmer-btn farmer-btn-primary"
                      onClick={handleSendOtp}
                      disabled={formCleanPhone.length !== 10 || isSendingOtp || otpCooldown > 0}
                      style={{ whiteSpace: 'nowrap', padding: '8px 14px', fontSize: '0.84rem' }}
                    >
                      {isSendingOtp ? 'Sending...' : otpCooldown > 0 ? `Resend (${otpCooldown}s)` : otpSent ? 'Resend OTP' : '📲 Verify with OTP'}
                    </button>
                  )}
                </div>

                {isEditing && hasPhoneChanged && isPhoneCurrentlyVerified && (
                  <div style={{
                    marginTop: 8,
                    background: '#ECFDF5',
                    border: '1px solid #10B981',
                    borderRadius: 8,
                    padding: '8px 12px',
                    color: '#065F46',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}>
                    <span>✅</span>
                    <span>New number +91 {formCleanPhone} verified with OTP. Click "Save Profile Changes" below.</span>
                  </div>
                )}

                {isEditing && hasPhoneChanged && !isPhoneCurrentlyVerified && otpSent && (
                  <div style={{
                    background: '#F0FDF4',
                    border: '1.5px solid #86EFAC',
                    borderRadius: 10,
                    padding: '12px 14px',
                    marginTop: 10,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                      <span style={{ color: '#166534', fontSize: '0.84rem', fontWeight: 700 }}>
                        Enter 6-Digit OTP sent to +91 {formCleanPhone}
                      </span>
                      {demoOtpNotice && (
                        <div style={{
                          background: '#DCFCE7',
                          border: '1px solid #4ADE80',
                          color: '#166534',
                          padding: '3px 8px',
                          borderRadius: 6,
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6
                        }}>
                          <span>🔑 Code: {demoOtpNotice}</span>
                          <button
                            type="button"
                            onClick={() => {
                              const digits = demoOtpNotice.replace(/\D/g, '').slice(0, 6);
                              setOtpInput(digits);
                              setOtpError('');
                            }}
                            style={{
                              background: '#16A34A',
                              color: '#FFF',
                              border: 'none',
                              padding: '2px 6px',
                              borderRadius: 4,
                              cursor: 'pointer',
                              fontSize: '0.7rem',
                              fontWeight: 700
                            }}
                          >
                            Fill
                          </button>
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <input
                        type="text"
                        maxLength={6}
                        placeholder="123456"
                        value={otpInput}
                        onChange={(e) => {
                          const clean = e.target.value.replace(/\D/g, '').slice(0, 6);
                          setOtpInput(clean);
                          setOtpError('');
                        }}
                        style={{
                          letterSpacing: '4px',
                          fontSize: '1.1rem',
                          textAlign: 'center',
                          fontWeight: 700,
                          width: 130,
                          padding: '6px 10px',
                          borderRadius: 6,
                          border: otpError ? '2px solid #DC2626' : '1px solid #86EFAC',
                          background: '#FFF'
                        }}
                      />
                      <button
                        type="button"
                        className="farmer-btn farmer-btn-primary"
                        disabled={otpInput.length !== 6 || isVerifyingOtp}
                        onClick={handleVerifyOtp}
                        style={{ padding: '7px 14px', fontSize: '0.84rem' }}
                      >
                        {isVerifyingOtp ? 'Verifying...' : '✓ Verify Code'}
                      </button>
                      <button
                        type="button"
                        className="farmer-btn farmer-btn-outline"
                        onClick={() => {
                          setFormData((prev) => ({ ...prev, mobileNumber: profile.mobileNumber }));
                          setOtpSent(false);
                          setOtpInput('');
                          setOtpError('');
                        }}
                        style={{ padding: '7px 10px', fontSize: '0.8rem' }}
                      >
                        Revert
                      </button>
                    </div>

                    {otpError && (
                      <div style={{ color: '#DC2626', fontSize: '0.78rem', fontWeight: 600 }}>
                        ❌ {otpError}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="farmer-form-group" style={{ flex: 1 }}>
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
                  onClick={handleCancelEditing}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="farmer-btn farmer-btn-primary"
                  disabled={hasPhoneChanged && !isPhoneCurrentlyVerified}
                  style={{
                    opacity: hasPhoneChanged && !isPhoneCurrentlyVerified ? 0.6 : 1,
                    cursor: hasPhoneChanged && !isPhoneCurrentlyVerified ? 'not-allowed' : 'pointer'
                  }}
                  title={hasPhoneChanged && !isPhoneCurrentlyVerified ? 'Please verify your new mobile number with OTP first' : ''}
                >
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

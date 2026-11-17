import { useState, useEffect, useCallback } from 'react';
import { useFarmer } from '../context/FarmerContext';
import { useAuth } from '../../../hooks/useAuth';
import { useOTPVerification } from '../../../hooks/useOTPVerification';
import {
  fetchFarmerProfileApi,
  updateFarmerProfileApi,
  updateFarmerBankDetailsApi,
  changeFarmerPasswordApi,
  mapFarmerDtoToProfile,
} from '../../../services/profileService';

function MyProfile() {
  const { profile, updateProfile, showToast } = useFarmer();
  const { user, updateUserMobile } = useAuth();

  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ ...profile });

  const [isEditingBank, setIsEditingBank] = useState(false);
  const [isSavingBank, setIsSavingBank] = useState(false);
  const [bankFormData, setBankFormData] = useState({ ...(profile.bankDetails || {}) });

  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [phoneValidationError, setPhoneValidationError] = useState('');
  const [otpInput, setOtpInput] = useState('');

  const {
    isOtpSent,
    isSending: isSendingOtp,
    isVerifying: isVerifyingOtp,
    isVerified: isMobileVerified,
    timer: otpCooldown,
    canResend,
    statusMessage,
    demoOtp: devOtp,
    error: otpError,
    verifiedTarget: verifiedPhone,
    requestOTP,
    verifyOTP,
    resendOTP,
    resetVerification,
    setError: setOtpError,
  } = useOTPVerification(30, { portal: 'farmer' });

  const resolvedUserId = user?.userId || profile?.userId || null;

  const loadProfileFromApi = useCallback(async () => {
    setIsLoadingProfile(true);
    try {
      const data = await fetchFarmerProfileApi(resolvedUserId);
      if (data && typeof data === 'object') {
        const mapped = mapFarmerDtoToProfile(data, profile);
        updateProfile(mapped, { silent: true });
        setFormData({ ...mapped });
        setBankFormData({ ...(mapped.bankDetails || {}) });
      }
    } catch {
      // Gracefully retain existing state if network issue
    } finally {
      setIsLoadingProfile(false);
    }
  }, [resolvedUserId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    loadProfileFromApi();
  }, [loadProfileFromApi]);

  const currentCleanPhone = String(profile.mobileNumber || '').replace(/\D/g, '').slice(-10);
  const formCleanPhone = String(formData.mobileNumber || '').replace(/\D/g, '').slice(-10);
  const hasPhoneChanged = Boolean(formCleanPhone && currentCleanPhone && formCleanPhone !== currentCleanPhone);
  const isPhoneCurrentlyVerified = hasPhoneChanged && isMobileVerified && verifiedPhone === formCleanPhone;

  const handleStartEditing = () => {
    setFormData({ ...profile });
    setIsEditing(true);
    resetVerification();
    setOtpInput('');
    setPhoneValidationError('');
  };

  const handleCancelEditing = () => {
    setFormData({ ...profile });
    setIsEditing(false);
    resetVerification();
    setOtpInput('');
    setPhoneValidationError('');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'mobileNumber') {
      const sanitized = value.replace(/[^\d+ ]/g, '');
      setFormData((prev) => ({ ...prev, [name]: sanitized }));
      const digits = sanitized.replace(/\D/g, '').slice(-10);
      if (digits !== verifiedPhone) {
        resetVerification();
        setOtpInput('');
      }
      setPhoneValidationError('');
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleBankChange = (e) => {
    const { name, value } = e.target;
    const field = name.replace('bank_', '');
    setBankFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSendOtp = async () => {
    setPhoneValidationError('');
    if (!formCleanPhone || formCleanPhone.length !== 10 || !/^[6-9]\d{9}$/.test(formCleanPhone)) {
      setPhoneValidationError('Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    try {
      await requestOTP(formCleanPhone, {
        userId: resolvedUserId,
        customMessage: `Verification OTP sent to +91 ${formCleanPhone}.`,
        duplicateMessage: 'This mobile number is already registered. Please use a different mobile number.',
      });
      showToast(`Verification OTP sent to +91 ${formCleanPhone}.`, 'info');
    } catch {
      // Error captured in otpError by useOTPVerification
    }
  };

  const handleVerifyOtp = async () => {
    setPhoneValidationError('');
    const cleanOtp = String(otpInput || '').trim();
    if (cleanOtp.length !== 6) {
      setOtpError('Please enter a complete 6-digit OTP code.');
      return;
    }

    try {
      await verifyOTP(formCleanPhone, cleanOtp, {
        userId: resolvedUserId,
        customVerifiedMessage: `Mobile number +91 ${formCleanPhone} verified successfully!`,
      });
      showToast(`Mobile number +91 ${formCleanPhone} verified successfully!`, 'success');
    } catch {
      // Error captured in otpError
    }
  };

  const handleResendOtp = async () => {
    if (!canResend || isSendingOtp) return;
    try {
      await resendOTP(formCleanPhone, {
        userId: resolvedUserId,
        customMessage: `Verification OTP sent to +91 ${formCleanPhone}.`,
        duplicateMessage: 'This mobile number is already registered. Please use a different mobile number.',
      });
      showToast(`Verification OTP resent to +91 ${formCleanPhone}.`, 'info');
    } catch {
      // Error captured in otpError
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();

    if (hasPhoneChanged && !isPhoneCurrentlyVerified) {
      showToast('Please verify your new mobile number with OTP before saving.', 'error');
      return;
    }

    const finalMobile = hasPhoneChanged ? formCleanPhone : (formData.mobileNumber || '');

    setIsSavingProfile(true);
    try {
      const updatedDto = await updateFarmerProfileApi(
        {
          ...formData,
          mobileNumber: finalMobile,
        },
        resolvedUserId
      );

      let nextProfile;
      if (updatedDto && typeof updatedDto === 'object') {
        nextProfile = mapFarmerDtoToProfile(updatedDto, {
          ...profile,
          ...formData,
          mobileNumber: `+91 ${finalMobile.replace(/\D/g, '').slice(-10)}`,
        });
      } else {
        nextProfile = {
          ...profile,
          ...formData,
          mobileNumber: `+91 ${finalMobile.replace(/\D/g, '').slice(-10)}`,
        };
      }

      updateProfile(nextProfile, { silent: true });
      setFormData({ ...nextProfile });

      if (hasPhoneChanged) {
        updateUserMobile?.(finalMobile);
      }

      showToast('Farmer profile details updated successfully!', 'success');
      setIsEditing(false);
      resetVerification();
      setOtpInput('');
    } catch (err) {
      showToast(err?.message || 'Failed to update farmer profile.', 'error');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleStartEditingBank = () => {
    setBankFormData({ ...(profile.bankDetails || {}) });
    setIsEditingBank(true);
  };

  const handleCancelEditingBank = () => {
    setBankFormData({ ...(profile.bankDetails || {}) });
    setIsEditingBank(false);
  };

  const handleSaveBankDetails = async (e) => {
    if (e) e.preventDefault();
    setIsSavingBank(true);
    try {
      const updatedBankDto = await updateFarmerBankDetailsApi(bankFormData, resolvedUserId);
      const mergedBank = {
        ...profile.bankDetails,
        ...bankFormData,
        ...(updatedBankDto && typeof updatedBankDto === 'object' ? updatedBankDto : {}),
      };
      const updatedProfile = {
        ...profile,
        bankDetails: mergedBank,
      };
      updateProfile(updatedProfile, { silent: true });
      setBankFormData({ ...mergedBank });
      setFormData((prev) => ({
        ...prev,
        bankDetails: mergedBank,
      }));
      setIsEditingBank(false);
      showToast('Bank details updated successfully.', 'success');
    } catch (err) {
      showToast(err?.message || 'Failed to update bank details.', 'error');
    } finally {
      setIsSavingBank(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');

    if (!passwordForm.currentPassword) {
      setPasswordError('Current password is required.');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters long.');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    setIsChangingPassword(true);
    try {
      const res = await changeFarmerPasswordApi(
        {
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
          confirmNewPassword: passwordForm.confirmPassword,
        },
        resolvedUserId
      );
      showToast(res.message || 'Password updated successfully!', 'success');
      setIsPasswordModalOpen(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPasswordError('');
    } catch (err) {
      setPasswordError(err?.message || 'Failed to change password.');
      showToast(err?.message || 'Failed to change password.', 'error');
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div>
      <div className="farmer-page-header">
        <div className="farmer-header-titles">
          <h2>Farmer Profile &amp; Account Settings</h2>
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
                onClick={() => {
                  setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                  setPasswordError('');
                  setIsPasswordModalOpen(true);
                }}
              >
                🔒 Change Password
              </button>
            </>
          ) : (
            <button
              type="button"
              className="farmer-btn farmer-btn-outline"
              onClick={handleCancelEditing}
              disabled={isSavingProfile}
            >
              ✕ Cancel Editing
            </button>
          )}
        </div>
      </div>

      {isLoadingProfile && (
        <div
          style={{
            padding: '12px 16px',
            background: '#F0FDF4',
            border: '1px solid #86EFAC',
            borderRadius: 10,
            color: '#166534',
            fontSize: '0.84rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 20,
          }}
        >
          <span style={{ fontSize: '1rem' }}>⏳</span>
          <span>Loading verified farmer profile from server...</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 24 }}>
        {/* Left Farmer Identity Card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="farmer-card" style={{ padding: '28px 20px', textAlign: 'center' }}>
            <div className="farmer-avatar lg" style={{ margin: '0 auto 16px' }}>
              {(profile.farmerName || 'FM').split(' ').filter(Boolean).map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
            </div>

            <h3 style={{ margin: '0 0 4px', fontSize: '1.35rem' }}>{profile.farmerName || 'Farmer'}</h3>
            <div style={{ color: 'var(--farmer-primary)', fontWeight: 700, fontSize: '0.9rem' }}>
              {profile.farmName || '—'}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--farmer-secondary)', marginTop: 4 }}>
              Kisan ID: <strong>{profile.farmerId || '—'}</strong>
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
                  {profile.rating ? profile.rating.split(' ')[0] : '—'}
                </strong>
                <small style={{ display: 'block', color: 'var(--farmer-secondary)', fontSize: '0.72rem' }}>
                  Platform Rating
                </small>
              </div>
              <div style={{ borderLeft: '1px solid var(--farmer-border)', paddingLeft: 16 }}>
                <strong style={{ fontSize: '1.1rem', color: 'var(--farmer-primary)' }}>
                  {profile.totalLandArea || '—'}
                </strong>
                <small style={{ display: 'block', color: 'var(--farmer-secondary)', fontSize: '0.72rem' }}>
                  Total Acres
                </small>
              </div>
            </div>
          </div>
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
              1. Personal &amp; Contact Information
            </h4>

            <div className="farmer-form-row">
              <div className="farmer-form-group">
                <label>Farmer Full Name *</label>
                <input
                  type="text"
                  name="farmerName"
                  value={formData.farmerName || ''}
                  onChange={handleChange}
                  disabled={!isEditing}
                  required
                />
              </div>

              <div className="farmer-form-group">
                <label>Farmer ID (Official Registry)</label>
                <input
                  type="text"
                  value={formData.farmerId || ''}
                  disabled
                  style={{ background: '#F1F5F9' }}
                />
              </div>
            </div>

            <div className="farmer-form-row" style={{ alignItems: 'flex-start' }}>
              <div className="farmer-form-group" style={{ flex: 1.3 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <label style={{ margin: 0 }}>Mobile Number (SMS &amp; OTP) *</label>
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
                    value={formData.mobileNumber || ''}
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
                      {isSendingOtp ? 'Sending...' : otpCooldown > 0 ? `Resend (${otpCooldown}s)` : isOtpSent ? 'Resend OTP' : '📲 Verify with OTP'}
                    </button>
                  )}
                </div>

                {(phoneValidationError || (!isOtpSent && otpError)) && (
                  <div style={{ color: '#DC2626', fontSize: '0.78rem', fontWeight: 600, marginTop: 4 }}>
                    ❌ {phoneValidationError || otpError}
                  </div>
                )}

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
                    <span>New number +91 {formCleanPhone} verified with OTP. Click &quot;Save Profile Changes&quot; below.</span>
                  </div>
                )}

                {isEditing && hasPhoneChanged && !isPhoneCurrentlyVerified && isOtpSent && (
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
                        {statusMessage || `Enter 6-Digit OTP sent to +91 ${formCleanPhone}`}
                      </span>
                      {devOtp && (
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
                          <span>🔑 Dev Code: {devOtp}</span>
                          <button
                            type="button"
                            onClick={() => {
                              const digits = devOtp.replace(/\D/g, '').slice(0, 6);
                              setOtpInput(digits);
                              setOtpError(null);
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
                          if (otpError) setOtpError(null);
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
                          resetVerification();
                          setOtpInput('');
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

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', color: '#166534' }}>
                      <span>Didn&apos;t receive code?</span>
                      {canResend ? (
                        <button
                          type="button"
                          onClick={handleResendOtp}
                          disabled={isSendingOtp}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#166534',
                            fontWeight: 700,
                            cursor: 'pointer',
                            textDecoration: 'underline',
                          }}
                        >
                          Resend OTP
                        </button>
                      ) : (
                        <span>Resend in {otpCooldown}s</span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="farmer-form-group" style={{ flex: 1 }}>
                <label>Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email || ''}
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
              2. Farm Location &amp; Landholding
            </h4>

            <div className="farmer-form-row">
              <div className="farmer-form-group">
                <label>Farm / Plantation Name *</label>
                <input
                  type="text"
                  name="farmName"
                  value={formData.farmName || ''}
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
                  value={formData.totalLandArea || ''}
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
                  value={formData.village || ''}
                  onChange={handleChange}
                  disabled={!isEditing}
                />
              </div>

              <div className="farmer-form-group">
                <label>Mandal / Tehsil *</label>
                <input
                  type="text"
                  name="mandal"
                  value={formData.mandal || ''}
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
                  value={formData.district || ''}
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
                    value={formData.state || ''}
                    onChange={handleChange}
                    disabled={!isEditing}
                  />
                </div>
                <div className="farmer-form-group">
                  <label>PIN Code *</label>
                  <input
                    type="text"
                    name="pinCode"
                    value={formData.pinCode || ''}
                    onChange={handleChange}
                    disabled={!isEditing}
                  />
                </div>
              </div>
            </div>

            <div className="farmer-form-group">
              <label>Complete Dispatch &amp; Farm Address *</label>
              <textarea
                rows={2}
                name="completeAddress"
                value={formData.completeAddress || ''}
                onChange={handleChange}
                disabled={!isEditing}
              />
            </div>

            {isEditing && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
                <button
                  type="button"
                  className="farmer-btn farmer-btn-outline"
                  onClick={handleCancelEditing}
                  disabled={isSavingProfile}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="farmer-btn farmer-btn-primary"
                  disabled={isSavingProfile || (hasPhoneChanged && !isPhoneCurrentlyVerified)}
                  style={{
                    opacity: hasPhoneChanged && !isPhoneCurrentlyVerified ? 0.6 : 1,
                    cursor: hasPhoneChanged && !isPhoneCurrentlyVerified ? 'not-allowed' : 'pointer'
                  }}
                  title={hasPhoneChanged && !isPhoneCurrentlyVerified ? 'Please verify your new mobile number with OTP first' : ''}
                >
                  {isSavingProfile ? 'Saving...' : '💾 Save Profile Changes'}
                </button>
              </div>
            )}
          </form>

          {/* Section 3: Bank Details for Settlement (Independent Form & API) */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              margin: '32px 0 16px',
              borderBottom: '1px solid var(--farmer-border)',
              paddingBottom: 8,
            }}
          >
            <h4
              style={{
                margin: 0,
                fontSize: '1.05rem',
                color: 'var(--farmer-dark)',
              }}
            >
              3. Bank Details (For Direct Trade Settlement)
            </h4>
            {!isEditingBank ? (
              <button
                type="button"
                className="farmer-btn farmer-btn-outline"
                onClick={handleStartEditingBank}
                style={{ padding: '5px 12px', fontSize: '0.82rem' }}
              >
                ✏️ Edit Bank Details
              </button>
            ) : (
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  className="farmer-btn farmer-btn-outline"
                  onClick={handleCancelEditingBank}
                  disabled={isSavingBank}
                  style={{ padding: '5px 12px', fontSize: '0.82rem' }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="farmer-btn farmer-btn-primary"
                  onClick={handleSaveBankDetails}
                  disabled={isSavingBank}
                  style={{ padding: '5px 12px', fontSize: '0.82rem' }}
                >
                  {isSavingBank ? 'Saving...' : '💾 Save Bank Details'}
                </button>
              </div>
            )}
          </div>

          <form onSubmit={handleSaveBankDetails}>
            <div className="farmer-form-row">
              <div className="farmer-form-group">
                <label>Bank Name</label>
                <input
                  type="text"
                  name="bank_bankName"
                  value={bankFormData.bankName || ''}
                  onChange={handleBankChange}
                  disabled={!isEditingBank}
                  placeholder="e.g. State Bank of India"
                />
              </div>

              <div className="farmer-form-group">
                <label>Account Number</label>
                <input
                  type="text"
                  name="bank_accountNumber"
                  value={
                    isEditingBank
                      ? bankFormData.accountNumber || bankFormData.fullAccountNumber || ''
                      : bankFormData.accountNumber || '—'
                  }
                  onChange={handleBankChange}
                  disabled={!isEditingBank}
                  placeholder="Bank account number"
                />
              </div>
            </div>

            <div className="farmer-form-row">
              <div className="farmer-form-group">
                <label>IFSC Code</label>
                <input
                  type="text"
                  name="bank_ifscCode"
                  value={bankFormData.ifscCode || ''}
                  onChange={handleBankChange}
                  disabled={!isEditingBank}
                  placeholder="SBIN0001245"
                />
              </div>

              <div className="farmer-form-group">
                <label>Branch Name &amp; Account Type</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <input
                    type="text"
                    name="bank_branchName"
                    value={bankFormData.branchName || bankFormData.branch || ''}
                    onChange={handleBankChange}
                    disabled={!isEditingBank}
                    placeholder="Branch Name"
                  />
                  <input
                    type="text"
                    name="bank_accountType"
                    value={bankFormData.accountType || 'Savings'}
                    onChange={handleBankChange}
                    disabled={!isEditingBank}
                    placeholder="Account Type (e.g. Savings)"
                  />
                </div>
              </div>
            </div>
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
                {passwordError && (
                  <div
                    style={{
                      padding: '8px 12px',
                      background: '#FEF2F2',
                      border: '1px solid #FCA5A5',
                      borderRadius: 8,
                      color: '#DC2626',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      marginBottom: 12,
                    }}
                  >
                    ❌ {passwordError}
                  </div>
                )}

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
                  disabled={isChangingPassword}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="farmer-btn farmer-btn-primary"
                  disabled={isChangingPassword}
                >
                  {isChangingPassword ? 'Updating...' : 'Update Password'}
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

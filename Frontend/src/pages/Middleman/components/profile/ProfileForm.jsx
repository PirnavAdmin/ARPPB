import React, { useState } from 'react';
import {
  Edit2,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { useOTPVerification } from '../../../../hooks/useOTPVerification';
import { FormField } from '../common/FormField';
import { BusinessLogoUpload } from './BusinessLogoUpload';
import { BankDetails } from './BankDetails';

export const ProfileForm = ({
  initialProfile,
  onSave,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ ...initialProfile });
  const [otpCode, setOtpCode] = useState('');
  const [phoneValidationError, setPhoneValidationError] = useState('');
  const [phoneSuccessBanner, setPhoneSuccessBanner] = useState('');

  const {
    isOtpSent,
    isSending,
    isVerifying,
    isVerified,
    timer,
    canResend,
    statusMessage,
    demoOtp,
    error: otpError,
    verifiedTarget,
    requestOTP,
    verifyOTP,
    resendOTP,
    resetVerification,
    setError: setOtpError,
  } = useOTPVerification(30);

  const savedMobile = String(initialProfile?.mobile || '').replace(/\D/g, '');
  const currentMobile = String(formData.mobile || '').replace(/\D/g, '');
  const isMobileChanged = isEditing && currentMobile !== savedMobile;
  const isValidNewMobile = /^[6-9]\d{9}$/.test(currentMobile);
  const isNewMobileVerified =
    isMobileChanged && isVerified && verifiedTarget === currentMobile;

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'mobile') {
      const digitsOnly = String(value || '')
        .replace(/\D/g, '')
        .slice(0, 10);
      setFormData((prev) => ({ ...prev, mobile: digitsOnly }));
      setPhoneValidationError('');
      setPhoneSuccessBanner('');
      if (isOtpSent || isVerified || otpError) {
        resetVerification();
        setOtpCode('');
      }
      return;
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleBankChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      bankDetails: {
        ...(prev.bankDetails || {}),
        [name]: value,
      },
    }));
  };

  const handleLogoChange = (logoUrl) => {
    setFormData((prev) => ({ ...prev, logo: logoUrl }));
  };

  const handleVerifyNewNumber = async () => {
    setPhoneValidationError('');
    setPhoneSuccessBanner('');

    if (!currentMobile) {
      setPhoneValidationError('Mobile number is required.');
      return;
    }
    if (!isValidNewMobile) {
      setPhoneValidationError('Please enter a valid 10-digit Indian mobile number.');
      return;
    }
    if (!isMobileChanged) {
      setPhoneValidationError(
        'Please enter a new mobile number different from your current number.'
      );
      return;
    }

    setOtpCode('');
    try {
      await requestOTP(currentMobile, {
        customMessage: 'OTP sent successfully to your new mobile number.',
        duplicateMessage:
          'This mobile number is already registered. Please use a different mobile number.',
      });
    } catch {
      // Error is captured in otpError state
    }
  };

  const handleConfirmOtp = async () => {
    const cleanOtp = String(otpCode || '').replace(/\D/g, '');
    if (cleanOtp.length !== 6) {
      setOtpError('Please enter a valid 6-digit numeric OTP.');
      return;
    }

    try {
      await verifyOTP(currentMobile, cleanOtp, {
        customVerifiedMessage: 'New mobile number verified successfully.',
      });
    } catch {
      // Error is captured in otpError state
    }
  };

  const handleResendOtp = async () => {
    if (!canResend || isSending) return;
    setOtpCode('');
    try {
      await resendOTP(currentMobile, {
        customMessage: 'OTP sent successfully to your new mobile number.',
        duplicateMessage:
          'This mobile number is already registered. Please use a different mobile number.',
      });
    } catch {
      // Error is captured in otpError state
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setPhoneValidationError('');

    if (!/^[6-9]\d{9}$/.test(currentMobile)) {
      setPhoneValidationError('Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    const mobileChangedOnSubmit = currentMobile !== savedMobile;
    if (mobileChangedOnSubmit && !(isVerified && verifiedTarget === currentMobile)) {
      setPhoneValidationError(
        'Please verify your new mobile number with OTP before saving.'
      );
      return;
    }

    onSave({ ...formData, mobile: currentMobile }, { mobileChanged: mobileChangedOnSubmit });
    resetVerification();
    setOtpCode('');
    setPhoneValidationError('');
    if (mobileChangedOnSubmit) {
      setPhoneSuccessBanner('Your mobile number has been updated successfully.');
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData({ ...initialProfile });
    resetVerification();
    setOtpCode('');
    setPhoneValidationError('');
    setIsEditing(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 1. Business Information Section */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-[#E2E8F0] shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0]">
          <h3 className="text-xs sm:text-sm font-bold text-[#1F2937] uppercase tracking-wider text-[#0F766E]">
            1. Business Identification
          </h3>

          {!isEditing && (
            <button
              type="button"
              onClick={() => {
                setFormData({ ...initialProfile });
                resetVerification();
                setOtpCode('');
                setPhoneValidationError('');
                setIsEditing(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#0F766E] text-white hover:bg-[#115E59] shadow-2xs cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit Profile</span>
            </button>
          )}
        </div>

        {/* Logo Upload & Preview */}
        <BusinessLogoUpload
          logoUrl={formData.logo}
          onLogoChange={handleLogoChange}
          businessName={formData.businessName}
          disabled={!isEditing}
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <FormField label="Middleman Portal ID" name="middlemanId">
            <input
              type="text"
              name="middlemanId"
              value={formData.middlemanId}
              disabled
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-[#E2E8F0] bg-slate-100 text-slate-500 font-mono font-bold cursor-not-allowed"
            />
          </FormField>

          <FormField label="Registered Business Name" name="businessName" required>
            <input
              type="text"
              name="businessName"
              value={formData.businessName}
              onChange={handleChange}
              disabled={!isEditing}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-[#E2E8F0] focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15 outline-none font-bold disabled:bg-slate-50 disabled:text-slate-600"
            />
          </FormField>

          <FormField label="Registration License No" name="registrationNumber">
            <input
              type="text"
              name="registrationNumber"
              value={formData.registrationNumber}
              onChange={handleChange}
              disabled={!isEditing}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-[#E2E8F0] focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15 outline-none font-mono disabled:bg-slate-50 disabled:text-slate-600"
            />
          </FormField>
        </div>

        <div className="max-w-sm">
          <FormField label="GSTIN" name="gstNumber">
            <input
              type="text"
              name="gstNumber"
              value={formData.gstNumber}
              onChange={handleChange}
              disabled={!isEditing}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-[#E2E8F0] focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15 outline-none uppercase font-mono disabled:bg-slate-50 disabled:text-slate-600"
            />
          </FormField>
        </div>
      </div>

      {/* 2. Owner & Contact Details */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-[#E2E8F0] shadow-xs space-y-4">
        <h3 className="text-xs sm:text-sm font-bold text-[#1F2937] uppercase tracking-wider text-[#0F766E] border-b border-[#E2E8F0] pb-2">
          2. Owner &amp; Contact Information
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <FormField label="Proprietor / Owner Name" name="ownerName" required>
            <input
              type="text"
              name="ownerName"
              value={formData.ownerName}
              onChange={handleChange}
              disabled={!isEditing}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-[#E2E8F0] focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15 outline-none disabled:bg-slate-50 disabled:text-slate-600"
            />
          </FormField>

          <FormField label="Mobile Number" name="mobile" required>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="tel"
                  name="mobile"
                  maxLength={10}
                  value={isEditing ? formData.mobile : initialProfile.mobile}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-[#E2E8F0] focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15 outline-none font-mono disabled:bg-slate-50 disabled:text-slate-600"
                />
                {isEditing && isMobileChanged && !isNewMobileVerified && (
                  <button
                    type="button"
                    onClick={handleVerifyNewNumber}
                    disabled={isSending || !isValidNewMobile}
                    className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-[#0F766E] text-white hover:bg-[#115E59] disabled:opacity-50 cursor-pointer"
                  >
                    {isSending ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>{isOtpSent ? 'Resend OTP' : 'Verify New Number'}</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {(phoneValidationError || (!isOtpSent && otpError)) && (
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-red-600">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{phoneValidationError || otpError}</span>
                </div>
              )}

              {!isMobileChanged && savedMobile && (
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#0F766E]">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>
                    {phoneSuccessBanner || 'Registered & verified mobile number'}
                  </span>
                </div>
              )}

              {isEditing && isMobileChanged && isNewMobileVerified && (
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{statusMessage || 'New mobile number verified successfully.'}</span>
                </div>
              )}

              {isEditing && isMobileChanged && !isNewMobileVerified && !isOtpSent && (
                <p className="text-[11px] text-amber-700 font-medium">
                  Click &ldquo;Verify New Number&rdquo; to verify this mobile number with OTP before saving.
                </p>
              )}

              {isEditing && isMobileChanged && isOtpSent && !isNewMobileVerified && (
                <div className="p-3 rounded-xl bg-slate-50 border border-[#0F766E]/30 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold text-[#0F766E]">
                      {statusMessage || 'OTP sent successfully to your new mobile number.'}
                    </span>
                    {demoOtp && (
                      <button
                        type="button"
                        onClick={() => setOtpCode(demoOtp)}
                        className="px-2 py-0.5 rounded bg-[#CCFBF1] text-[#0F766E] font-mono text-[11px] font-bold cursor-pointer"
                        title="Click to auto-fill Dev OTP"
                      >
                        Dev OTP: {demoOtp}
                      </button>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-600">
                    Enter the 6-digit OTP sent to <strong className="font-mono text-slate-900">+91 {currentMobile}</strong> (valid for 5 minutes).
                  </p>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="Enter 6-digit OTP"
                      value={otpCode}
                      onChange={(e) => {
                        setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6));
                        if (otpError) setOtpError(null);
                      }}
                      className="w-full px-3 py-1.5 text-xs font-mono tracking-widest rounded-xl border border-[#E2E8F0] bg-white text-slate-900 focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15 outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleConfirmOtp}
                      disabled={isVerifying || otpCode.length !== 6}
                      className="shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#0F766E] text-white hover:bg-[#115E59] disabled:opacity-50 cursor-pointer"
                    >
                      {isVerifying ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Verifying...</span>
                        </>
                      ) : (
                        <span>Verify OTP</span>
                      )}
                    </button>
                  </div>

                  {otpError && (
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-red-600">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{otpError}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                    <span>Didn&apos;t receive the code?</span>
                    {canResend ? (
                      <button
                        type="button"
                        onClick={handleResendOtp}
                        disabled={isSending}
                        className="inline-flex items-center gap-1 font-bold text-[#0F766E] hover:underline cursor-pointer"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Resend OTP</span>
                      </button>
                    ) : (
                      <span className="font-mono font-semibold">Resend in {timer}s</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </FormField>

          <FormField label="Email Address" name="email">
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              disabled={!isEditing}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-[#E2E8F0] focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15 outline-none disabled:bg-slate-50 disabled:text-slate-600"
            />
          </FormField>
        </div>
      </div>

      {/* 3. Business Location Address */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-[#E2E8F0] shadow-xs space-y-4">
        <h3 className="text-xs sm:text-sm font-bold text-[#1F2937] uppercase tracking-wider text-[#0F766E] border-b border-[#E2E8F0] pb-2">
          3. Principal Place of Business
        </h3>

        <FormField label="Premises / Yard Address" name="businessAddress">
          <input
            type="text"
            name="businessAddress"
            value={formData.businessAddress}
            onChange={handleChange}
            disabled={!isEditing}
            className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-[#E2E8F0] focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15 outline-none disabled:bg-slate-50 disabled:text-slate-600"
          />
        </FormField>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
          <FormField label="Village / Area" name="village">
            <input
              type="text"
              name="village"
              value={formData.village || ''}
              onChange={handleChange}
              disabled={!isEditing}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-[#E2E8F0] focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15 outline-none disabled:bg-slate-50 disabled:text-slate-600"
            />
          </FormField>

          <FormField label="District" name="district">
            <input
              type="text"
              name="district"
              value={formData.district}
              onChange={handleChange}
              disabled={!isEditing}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-[#E2E8F0] focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15 outline-none disabled:bg-slate-50 disabled:text-slate-600"
            />
          </FormField>

          <FormField label="State" name="state">
            <input
              type="text"
              name="state"
              value={formData.state}
              onChange={handleChange}
              disabled={!isEditing}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-[#E2E8F0] focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15 outline-none disabled:bg-slate-50 disabled:text-slate-600"
            />
          </FormField>

          <FormField label="PIN Code" name="pinCode">
            <input
              type="text"
              name="pinCode"
              maxLength={6}
              value={formData.pinCode}
              onChange={handleChange}
              disabled={!isEditing}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-[#E2E8F0] focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15 outline-none disabled:bg-slate-50 disabled:text-slate-600"
            />
          </FormField>
        </div>
      </div>

      {/* 4. Optional Bank Settlement Details */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-[#E2E8F0] shadow-xs">
        <BankDetails
          data={formData.bankDetails || {}}
          onChange={handleBankChange}
          disabled={!isEditing}
        />
      </div>

      {/* Footer Form Controls (shown only when editing) */}
      {isEditing && (
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={handleCancel}
            className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold border border-[#E2E8F0] hover:bg-slate-50 text-[#1F2937] cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isMobileChanged && !isNewMobileVerified}
            className="px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-[#0F766E] hover:bg-[#115E59] text-white shadow-md shadow-[#0F766E]/20 disabled:opacity-50 cursor-pointer"
          >
            Save Profile Changes
          </button>
        </div>
      )}
    </form>
  );
};

export default ProfileForm;

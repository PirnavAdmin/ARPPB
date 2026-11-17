import { useState, useEffect, useCallback } from 'react';
import {
  UserCheck,
  Building2,
  MapPin,
  ShieldCheck,
  Lock,
  Pencil,
  Save,
  X,
  Landmark,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
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
import FarmerPageHeader from '../components/FarmerPageHeader';
import { AP_DISTRICTS, INDIAN_STATES } from '../../../utils/constants';

export default function MyProfile() {
  const { profile, updateProfile } = useFarmer();
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
      toast.info(`Verification OTP sent to +91 ${formCleanPhone}.`);
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
      toast.success(`Mobile number +91 ${formCleanPhone} verified successfully!`);
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
      toast.info(`Verification OTP resent to +91 ${formCleanPhone}.`);
    } catch {
      // Error captured in otpError
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();

    if (hasPhoneChanged && !isPhoneCurrentlyVerified) {
      toast.error('Please verify your new mobile number with OTP before saving.');
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

      toast.success('Farmer profile details updated successfully!');
      setIsEditing(false);
      resetVerification();
      setOtpInput('');
    } catch (err) {
      toast.error(err?.message || 'Failed to update farmer profile.');
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
      toast.success('Bank settlement details updated successfully.');
    } catch (err) {
      toast.error(err?.message || 'Failed to update bank details.');
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
      toast.success(res.message || 'Password updated successfully!');
      setIsPasswordModalOpen(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPasswordError('');
    } catch (err) {
      setPasswordError(err?.message || 'Failed to change password.');
      toast.error(err?.message || 'Failed to change password.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const initials = (profile.farmerName || 'Farmer')
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="space-y-6">
      {/* Page Header (Matches VendorPageHeader & CustomerPageHeader) */}
      <FarmerPageHeader
        title="My Farmer Profile & Settlement Treasury"
        subtitle="Manage your agricultural producer registry, Kisan ID, farm acreage, contact credentials, and bank settlement account."
        icon={UserCheck}
        badge="Verified Agricultural Producer"
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => {
                setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                setPasswordError('');
                setIsPasswordModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 h-9 rounded-xl text-xs font-semibold bg-white border border-[#E2E8F0] text-[#0F172A] hover:bg-[#F8FAFC] hover:text-[#0F766E] transition-all duration-200 cursor-pointer shadow-2xs"
            >
              <Lock className="w-3.5 h-3.5 text-[#0F766E]" />
              <span>Change Password</span>
            </button>

            {!isEditing ? (
              <button
                type="button"
                onClick={handleStartEditing}
                className="inline-flex items-center gap-1.5 px-4 h-9 rounded-xl text-xs font-semibold bg-[#0F766E] text-white hover:bg-[#115E59] transition-all duration-200 cursor-pointer shadow-xs"
              >
                <Pencil className="w-3.5 h-3.5 stroke-[2] shrink-0" />
                <span>Edit Profile</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCancelEditing}
                  disabled={isSavingProfile}
                  className="inline-flex items-center gap-1 px-3.5 h-9 rounded-xl text-xs font-semibold bg-white border border-[#E2E8F0] text-[#64748B] hover:text-[#0F172A] hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Cancel</span>
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSavingProfile}
                  className="inline-flex items-center gap-1.5 px-4 h-9 rounded-xl text-xs font-semibold bg-[#0F766E] text-white hover:bg-[#115E59] transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {isSavingProfile ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        }
      />

      {/* Loading banner if refreshing from server */}
      {isLoadingProfile && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2.5">
          <Loader2 className="w-4 h-4 animate-spin text-[#0F766E] shrink-0" />
          <span>Synchronizing verified agricultural producer records with backend ERP...</span>
        </div>
      )}

      {/* Producer Identity Summary Card (Matches Vendor Enterprise Identity Card) */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start sm:items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-[#0F766E] text-white flex items-center justify-center font-extrabold text-xl shrink-0 shadow-sm shadow-[#0F766E]/20">
            {initials}
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-xl font-extrabold text-[#0F172A]">
                {profile.farmerName || 'Farmer Producer'}
              </h2>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="w-3 h-3" />
                Active Verified Producer
              </span>
            </div>

            <p className="text-xs text-[#64748B] flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1 font-semibold text-[#0F172A]">
                <Building2 className="w-3.5 h-3.5 text-[#0F766E]" />
                {profile.farmName || 'Kisan Agro Enterprise'}
              </span>
              <span>•</span>
              <span className="inline-flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-[#0F766E]" />
                {profile.village ? `${profile.village}, ${profile.district || 'Kurnool'} - ${profile.pinCode || ''}` : 'Kurnool, Andhra Pradesh'}
              </span>
            </p>

            <div className="flex flex-wrap items-center gap-2.5 pt-1 text-xs">
              <span className="px-2.5 py-0.5 rounded-lg bg-[#CCFBF1] text-[#0F766E] font-mono font-bold">
                Kisan ID: {profile.farmerId || 'AG-FARM-01'}
              </span>
              <span className="px-2.5 py-0.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] font-semibold text-[#0F172A]">
                Total Land: <strong>{profile.totalLandArea || '—'}</strong>
              </span>
              <span className="px-2.5 py-0.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] font-semibold text-[#0F172A]">
                Rating: <strong>{profile.rating || '4.9 ★'}</strong>
              </span>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#CCFBF1]/40 border border-[#0F766E]/20 text-xs space-y-1 shrink-0">
          <div className="flex items-center gap-1.5 font-bold text-[#0F766E]">
            <ShieldCheck className="w-4 h-4 stroke-[2]" />
            <span>Mandi Settlement Status</span>
          </div>
          <p className="text-[#0F172A] font-medium">
            Direct Bank ECS &amp; Buyer OTP Verification Enabled
          </p>
          <p className="text-[11px] text-[#64748B]">
            Primary Mandi: Kurnool Agricultural Market Committee
          </p>
        </div>
      </div>

      {/* Section 1: Personal & Contact Information */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-xs space-y-5">
        <div className="border-b border-[#E2E8F0] pb-3 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-[#0F766E] tracking-tight">
              1. Personal &amp; Contact Credentials
            </h3>
            <p className="text-xs text-[#64748B] mt-0.5">
              Verified identity details used for buyer communication, notifications, and transaction SMS
            </p>
          </div>
          {isEditing && (
            <span className="text-xs font-semibold text-[#0F766E] bg-[#CCFBF1] px-2.5 py-0.5 rounded-full">
              Editing Mode
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#64748B] mb-1.5">
              Farmer Full Name *
            </label>
            <input
              type="text"
              name="farmerName"
              value={formData.farmerName || ''}
              onChange={handleChange}
              disabled={!isEditing}
              placeholder="Enter farmer full name"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] text-sm text-[#0F172A] bg-white focus:outline-none focus:ring-2 focus:ring-[#0F766E]/30 focus:border-[#0F766E] transition-all disabled:bg-[#F8FAFC] disabled:text-[#64748B]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#64748B] mb-1.5">
              Kisan / Registry ID (Official)
            </label>
            <input
              type="text"
              value={formData.farmerId || ''}
              disabled
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] text-sm font-mono text-[#64748B] bg-[#F8FAFC]"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#64748B]">
                Registered Mobile (SMS &amp; OTP) *
              </label>
              {isEditing && (
                hasPhoneChanged ? (
                  isPhoneCurrentlyVerified ? (
                    <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> OTP Verified
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold text-amber-600 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> Verification Required
                    </span>
                  )
                ) : (
                  <span className="text-[11px] font-semibold text-emerald-600">
                    ✓ Current Registered
                  </span>
                )
              )}
            </div>

            <div className="flex gap-2">
              <input
                type="tel"
                name="mobileNumber"
                value={formData.mobileNumber || ''}
                onChange={handleChange}
                disabled={!isEditing}
                placeholder="10-digit mobile number"
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] text-sm text-[#0F172A] bg-white focus:outline-none focus:ring-2 focus:ring-[#0F766E]/30 focus:border-[#0F766E] transition-all disabled:bg-[#F8FAFC] disabled:text-[#64748B]"
              />
              {isEditing && hasPhoneChanged && !isPhoneCurrentlyVerified && (
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={formCleanPhone.length !== 10 || isSendingOtp || otpCooldown > 0}
                  className="px-3.5 py-2.5 rounded-xl bg-[#0F766E] hover:bg-[#115E59] text-white text-xs font-bold transition-colors cursor-pointer shrink-0 disabled:opacity-50"
                >
                  {isSendingOtp ? 'Sending...' : otpCooldown > 0 ? `Resend (${otpCooldown}s)` : 'Send OTP'}
                </button>
              )}
            </div>

            {phoneValidationError && (
              <p className="text-xs text-red-600 mt-1 font-medium">{phoneValidationError}</p>
            )}

            {/* OTP Verification Dropdown Box when OTP is sent */}
            {isEditing && hasPhoneChanged && !isPhoneCurrentlyVerified && isOtpSent && (
              <div className="mt-3 p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-3">
                <div className="flex items-center justify-between text-xs text-amber-900 font-semibold">
                  <span>Enter 6-digit OTP sent to +91 {formCleanPhone}</span>
                  {devOtp && (
                    <span className="font-mono bg-white px-2 py-0.5 rounded border border-amber-300 text-amber-800 font-bold">
                      Demo Code: {devOtp}
                    </span>
                  )}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    maxLength={6}
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="Enter 6-digit OTP"
                    className="flex-1 px-3.5 py-2 rounded-xl bg-white border border-amber-300 text-sm font-mono tracking-widest text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/30"
                  />
                  <button
                    type="button"
                    onClick={handleVerifyOtp}
                    disabled={otpInput.length !== 6 || isVerifyingOtp}
                    className="px-4 py-2 rounded-xl bg-[#0F766E] hover:bg-[#115E59] text-white text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isVerifyingOtp ? 'Verifying...' : 'Verify'}
                  </button>
                </div>

                {otpError && (
                  <p className="text-xs text-red-600 font-medium">{otpError}</p>
                )}

                <div className="flex items-center justify-between text-xs text-amber-800">
                  <span>Didn&apos;t receive OTP?</span>
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={!canResend || isSendingOtp}
                    className="font-bold text-[#0F766E] hover:underline cursor-pointer disabled:opacity-50"
                  >
                    Resend Code {otpCooldown > 0 ? `(${otpCooldown}s)` : ''}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#64748B] mb-1.5">
              Alternate Contact Number
            </label>
            <input
              type="tel"
              name="alternateMobile"
              value={formData.alternateMobile || ''}
              onChange={handleChange}
              disabled={!isEditing}
              placeholder="e.g. +91 94401 23456"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] text-sm text-[#0F172A] bg-white focus:outline-none focus:ring-2 focus:ring-[#0F766E]/30 focus:border-[#0F766E] transition-all disabled:bg-[#F8FAFC] disabled:text-[#64748B]"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#64748B] mb-1.5">
              Email Address (Optional)
            </label>
            <input
              type="email"
              name="email"
              value={formData.email || ''}
              onChange={handleChange}
              disabled={!isEditing}
              placeholder="farmer@kisanagri.org"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] text-sm text-[#0F172A] bg-white focus:outline-none focus:ring-2 focus:ring-[#0F766E]/30 focus:border-[#0F766E] transition-all disabled:bg-[#F8FAFC] disabled:text-[#64748B]"
            />
          </div>
        </div>
      </div>

      {/* Section 2: Farm & Agricultural Details */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-xs space-y-5">
        <div className="border-b border-[#E2E8F0] pb-3">
          <h3 className="text-base font-bold text-[#0F766E] tracking-tight">
            2. Farm Landholding &amp; Agricultural Specifications
          </h3>
          <p className="text-xs text-[#64748B] mt-0.5">
            Geographical location, soil composition, and crop acreage for Mandi crop quota compliance
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#64748B] mb-1.5">
              Farm / Enterprise Name
            </label>
            <input
              type="text"
              name="farmName"
              value={formData.farmName || ''}
              onChange={handleChange}
              disabled={!isEditing}
              placeholder="e.g. Reddy Agro Farms & Greenfields"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] text-sm text-[#0F172A] bg-white focus:outline-none focus:ring-2 focus:ring-[#0F766E]/30 focus:border-[#0F766E] transition-all disabled:bg-[#F8FAFC] disabled:text-[#64748B]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#64748B] mb-1.5">
              Total Land Area (Acres)
            </label>
            <input
              type="text"
              name="totalLandArea"
              value={formData.totalLandArea || ''}
              onChange={handleChange}
              disabled={!isEditing}
              placeholder="e.g. 18.5 Acres"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] text-sm text-[#0F172A] bg-white focus:outline-none focus:ring-2 focus:ring-[#0F766E]/30 focus:border-[#0F766E] transition-all disabled:bg-[#F8FAFC] disabled:text-[#64748B]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#64748B] mb-1.5">
              Soil Composition / Type
            </label>
            <input
              type="text"
              name="soilType"
              value={formData.soilType || ''}
              onChange={handleChange}
              disabled={!isEditing}
              placeholder="e.g. Black Cotton & Red Loamy"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] text-sm text-[#0F172A] bg-white focus:outline-none focus:ring-2 focus:ring-[#0F766E]/30 focus:border-[#0F766E] transition-all disabled:bg-[#F8FAFC] disabled:text-[#64748B]"
            />
          </div>

          <div className="lg:col-span-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#64748B] mb-1.5">
              Primary Harvested Crops
            </label>
            <input
              type="text"
              name="primaryCrops"
              value={
                Array.isArray(formData.primaryCrops)
                  ? formData.primaryCrops.join(', ')
                  : formData.primaryCrops || ''
              }
              onChange={handleChange}
              disabled={!isEditing}
              placeholder="e.g. Paddy (BPT 5204), Turmeric, Groundnut, Cotton"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] text-sm text-[#0F172A] bg-white focus:outline-none focus:ring-2 focus:ring-[#0F766E]/30 focus:border-[#0F766E] transition-all disabled:bg-[#F8FAFC] disabled:text-[#64748B]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#64748B] mb-1.5">
              Village / Locality
            </label>
            <input
              type="text"
              name="village"
              value={formData.village || ''}
              onChange={handleChange}
              disabled={!isEditing}
              placeholder="Village name"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] text-sm text-[#0F172A] bg-white focus:outline-none focus:ring-2 focus:ring-[#0F766E]/30 focus:border-[#0F766E] transition-all disabled:bg-[#F8FAFC] disabled:text-[#64748B]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#64748B] mb-1.5">
              Mandal / Taluk
            </label>
            <input
              type="text"
              name="mandal"
              value={formData.mandal || ''}
              onChange={handleChange}
              disabled={!isEditing}
              placeholder="Mandal name"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] text-sm text-[#0F172A] bg-white focus:outline-none focus:ring-2 focus:ring-[#0F766E]/30 focus:border-[#0F766E] transition-all disabled:bg-[#F8FAFC] disabled:text-[#64748B]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#64748B] mb-1.5">
              District
            </label>
            {isEditing ? (
              <select
                name="district"
                value={formData.district || 'Kurnool'}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] text-sm text-[#0F172A] bg-white focus:outline-none focus:ring-2 focus:ring-[#0F766E]/30 focus:border-[#0F766E] transition-all cursor-pointer"
              >
                {AP_DISTRICTS.map((dist) => (
                  <option key={dist} value={dist}>
                    {dist}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={formData.district || 'Kurnool'}
                disabled
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] text-sm text-[#64748B] bg-[#F8FAFC]"
              />
            )}
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#64748B] mb-1.5">
              State
            </label>
            {isEditing ? (
              <select
                name="state"
                value={formData.state || 'Andhra Pradesh'}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] text-sm text-[#0F172A] bg-white focus:outline-none focus:ring-2 focus:ring-[#0F766E]/30 focus:border-[#0F766E] transition-all cursor-pointer"
              >
                {INDIAN_STATES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={formData.state || 'Andhra Pradesh'}
                disabled
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] text-sm text-[#64748B] bg-[#F8FAFC]"
              />
            )}
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#64748B] mb-1.5">
              PIN Code
            </label>
            <input
              type="text"
              name="pinCode"
              value={formData.pinCode || ''}
              onChange={handleChange}
              disabled={!isEditing}
              placeholder="e.g. 518002"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] text-sm text-[#0F172A] bg-white focus:outline-none focus:ring-2 focus:ring-[#0F766E]/30 focus:border-[#0F766E] transition-all disabled:bg-[#F8FAFC] disabled:text-[#64748B]"
            />
          </div>
        </div>
      </div>

      {/* Section 3: Bank Account for Direct Settlements */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-xs space-y-5">
        <div className="border-b border-[#E2E8F0] pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Landmark className="w-5 h-5 text-[#0F766E]" />
              <h3 className="text-base font-bold text-[#0F766E] tracking-tight">
                3. Settlement Bank Account Details
              </h3>
            </div>
            <p className="text-xs text-[#64748B] mt-0.5">
              Authorizes direct Mandi ECS, RTGS, and vendor payment deposits into your verified farmer account
            </p>
          </div>

          {!isEditingBank ? (
            <button
              type="button"
              onClick={handleStartEditingBank}
              className="inline-flex items-center gap-1.5 px-3.5 h-8 rounded-xl text-xs font-semibold border border-[#E2E8F0] bg-white text-[#0F766E] hover:bg-[#F8FAFC] transition-colors cursor-pointer shrink-0 self-start sm:self-auto"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>Update Bank Account</span>
            </button>
          ) : (
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleCancelEditingBank}
                disabled={isSavingBank}
                className="px-3 h-8 rounded-xl text-xs font-semibold border border-[#E2E8F0] bg-white text-[#64748B] hover:text-[#0F172A] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveBankDetails}
                disabled={isSavingBank}
                className="inline-flex items-center gap-1 px-3.5 h-8 rounded-xl text-xs font-semibold bg-[#0F766E] text-white hover:bg-[#115E59] transition-colors cursor-pointer shadow-xs disabled:opacity-50"
              >
                {isSavingBank ? 'Saving...' : 'Save Bank Details'}
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#64748B] mb-1.5">
              Bank Name *
            </label>
            <input
              type="text"
              name="bank_bankName"
              value={bankFormData.bankName || ''}
              onChange={handleBankChange}
              disabled={!isEditingBank}
              placeholder="e.g. State Bank of India"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] text-sm text-[#0F172A] bg-white focus:outline-none focus:ring-2 focus:ring-[#0F766E]/30 focus:border-[#0F766E] transition-all disabled:bg-[#F8FAFC] disabled:text-[#64748B]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#64748B] mb-1.5">
              Account Holder Name *
            </label>
            <input
              type="text"
              name="bank_accountHolderName"
              value={bankFormData.accountHolderName || ''}
              onChange={handleBankChange}
              disabled={!isEditingBank}
              placeholder="Full name as printed on passbook"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] text-sm text-[#0F172A] bg-white focus:outline-none focus:ring-2 focus:ring-[#0F766E]/30 focus:border-[#0F766E] transition-all disabled:bg-[#F8FAFC] disabled:text-[#64748B]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#64748B] mb-1.5">
              Account Number *
            </label>
            <input
              type="text"
              name="bank_accountNumber"
              value={bankFormData.accountNumber || ''}
              onChange={handleBankChange}
              disabled={!isEditingBank}
              placeholder="e.g. 3084920194820"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] text-sm font-mono text-[#0F172A] bg-white focus:outline-none focus:ring-2 focus:ring-[#0F766E]/30 focus:border-[#0F766E] transition-all disabled:bg-[#F8FAFC] disabled:text-[#64748B]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#64748B] mb-1.5">
              IFSC Code *
            </label>
            <input
              type="text"
              name="bank_ifscCode"
              value={bankFormData.ifscCode || ''}
              onChange={handleBankChange}
              disabled={!isEditingBank}
              placeholder="e.g. SBIN0000842"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] text-sm font-mono uppercase text-[#0F172A] bg-white focus:outline-none focus:ring-2 focus:ring-[#0F766E]/30 focus:border-[#0F766E] transition-all disabled:bg-[#F8FAFC] disabled:text-[#64748B]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#64748B] mb-1.5">
              Branch Name
            </label>
            <input
              type="text"
              name="bank_branchName"
              value={bankFormData.branchName || ''}
              onChange={handleBankChange}
              disabled={!isEditingBank}
              placeholder="e.g. Kurnool Main Mandi Branch"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] text-sm text-[#0F172A] bg-white focus:outline-none focus:ring-2 focus:ring-[#0F766E]/30 focus:border-[#0F766E] transition-all disabled:bg-[#F8FAFC] disabled:text-[#64748B]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#64748B] mb-1.5">
              UPI VPA ID (Optional)
            </label>
            <input
              type="text"
              name="bank_upiId"
              value={bankFormData.upiId || ''}
              onChange={handleBankChange}
              disabled={!isEditingBank}
              placeholder="farmer@sbi"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] text-sm text-[#0F172A] bg-white focus:outline-none focus:ring-2 focus:ring-[#0F766E]/30 focus:border-[#0F766E] transition-all disabled:bg-[#F8FAFC] disabled:text-[#64748B]"
            />
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#CCFBF1] text-[#0F766E] flex items-center justify-center">
                  <Lock className="w-4 h-4 stroke-[2]" />
                </div>
                <h3 className="text-base font-bold text-[#0F172A]">
                  Change Account Password
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsPasswordModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4">
              {passwordError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-semibold">
                  {passwordError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#64748B] mb-1">
                  Current Password *
                </label>
                <input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) =>
                    setPasswordForm((p) => ({ ...p, currentPassword: e.target.value }))
                  }
                  required
                  placeholder="Enter current password"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/30 focus:border-[#0F766E]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#64748B] mb-1">
                  New Password *
                </label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) =>
                    setPasswordForm((p) => ({ ...p, newPassword: e.target.value }))
                  }
                  required
                  minLength={6}
                  placeholder="At least 6 characters"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/30 focus:border-[#0F766E]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#64748B] mb-1">
                  Confirm New Password *
                </label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) =>
                    setPasswordForm((p) => ({ ...p, confirmPassword: e.target.value }))
                  }
                  required
                  placeholder="Re-enter new password"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/30 focus:border-[#0F766E]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  disabled={isChangingPassword}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border border-[#E2E8F0] text-[#64748B] hover:text-[#0F172A] hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#0F766E] text-white hover:bg-[#115E59] transition-colors cursor-pointer shadow-xs disabled:opacity-50"
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

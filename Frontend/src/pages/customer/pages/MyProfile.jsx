import { useState, useRef } from 'react';

import {
  UserCheck,
  Pencil,
  Save,
  Send,
  X,
  Upload,
  Trash2,
  MapPin,
  Plus,
  CheckCircle2,
  ShieldCheck,
  Phone,
  Mail,
  AlertCircle,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import { useCustomer } from '../context/useCustomer';
import { useOTPVerification } from '../../../hooks/useOTPVerification';
import { AP_DISTRICTS, INDIAN_STATES } from '../../../utils/constants';
import { formatDate } from '../../../utils/formatDate';
import CustomerPageHeader from '../components/CustomerPageHeader';
import CustomerStatusBadge from '../components/CustomerStatusBadge';
import CustomerModal from '../components/CustomerModal';
import MobileOTPVerification from '../components/MobileOTPVerification';

const EMPTY_ADDRESS = {
  label: '',
  recipientName: '',
  contactNumber: '',
  addressLine: '',
  district: 'Guntur',
  state: 'Andhra Pradesh',
  pinCode: '',
  isDefault: false,
};

function validateProfileFields(form) {
  const errs = {};
  if (!String(form.fullName || '').trim()) {
    errs.fullName = 'Full Name is required.';
  }
  if (!/^[6-9]\d{9}$/.test(String(form.mobileNumber || '').replace(/\D/g, ''))) {
    errs.mobileNumber = 'Enter a valid 10-digit Indian mobile number.';
  }
  const trimmedEmail = String(form.email || '').trim();
  if (trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
    errs.email = 'Enter a valid email address.';
  }
  if (
    form.alternateMobileNumber &&
    !/^[6-9]\d{9}$/.test(String(form.alternateMobileNumber).replace(/\D/g, ''))
  ) {
    errs.alternateMobileNumber = 'Enter a valid 10-digit alternate mobile number.';
  }
  if (!String(form.address || '').trim()) {
    errs.address = 'Address is required.';
  }
  if (!String(form.district || '').trim()) {
    errs.district = 'District is required.';
  }
  if (!String(form.state || '').trim()) {
    errs.state = 'State is required.';
  }
  if (!/^\d{6}$/.test(String(form.pinCode || '').trim())) {
    errs.pinCode = 'Enter a valid 6-digit PIN Code.';
  }
  return errs;
}

function validateAddressForm(addr) {
  const errs = {};
  if (!String(addr.label || '').trim()) errs.label = 'Address label is required (e.g., Home, Warehouse).';
  if (!String(addr.recipientName || '').trim()) errs.recipientName = 'Recipient name is required.';
  if (!/^[6-9]\d{9}$/.test(String(addr.contactNumber || '').replace(/\D/g, ''))) {
    errs.contactNumber = 'Enter a valid 10-digit phone number.';
  }
  if (!String(addr.addressLine || '').trim()) errs.addressLine = 'Street / house address is required.';
  if (!String(addr.district || '').trim()) errs.district = 'District is required.';
  if (!String(addr.state || '').trim()) errs.state = 'State is required.';
  if (!/^\d{6}$/.test(String(addr.pinCode || '').trim())) {
    errs.pinCode = 'Enter a valid 6-digit PIN Code.';
  }
  return errs;
}

export function MyProfile() {
  const {
    profile,
    updateProfile,
    addDeliveryAddress,
    updateDeliveryAddress,
    deleteDeliveryAddress,
    setDefaultDeliveryAddress,
  } = useCustomer();

  const fileInputRef = useRef(null);

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: profile.fullName || '',
    mobileNumber: profile.mobileNumber || '',
    email: profile.email || '',
    profilePhoto: profile.profilePhoto || '',
    alternateMobileNumber: profile.alternateMobileNumber || '',
    address: profile.address || '',
    district: profile.district || 'Guntur',
    state: profile.state || 'Andhra Pradesh',
    pinCode: profile.pinCode || '',
  });
  const [errors, setErrors] = useState({});
  const [photoError, setPhotoError] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [phoneValidationError, setPhoneValidationError] = useState('');
  const [phoneSuccessBanner, setPhoneSuccessBanner] = useState('');

  // Mobile Number Update Modal state
  const [isMobileUpdateModalOpen, setIsMobileUpdateModalOpen] = useState(false);
  const [isOTPModalOpen, setIsOTPModalOpen] = useState(false);
  const [newMobileNumber, setNewMobileNumber] = useState('');
  const [newNumberErrors, setNewNumberErrors] = useState('');
  const [isSendingOTP, setIsSendingOTP] = useState(false);

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

  const savedMobile = String(profile?.mobileNumber || '').replace(/\D/g, '');
  const currentMobile = String(formData.mobileNumber || '').replace(/\D/g, '');
  const isMobileChanged = isEditing && currentMobile !== savedMobile;
  const isValidNewMobile = /^[6-9]\d{9}$/.test(currentMobile);
  const isNewMobileVerified =
    isMobileChanged && isVerified && verifiedTarget === currentMobile;

  // Delivery Address Modal state
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editingAddrId, setEditingAddrId] = useState(null);
  const [addrForm, setAddrForm] = useState(EMPTY_ADDRESS);
  const [addrErrors, setAddrErrors] = useState({});

  const initials = (profile.fullName || 'CUS')
    .trim()
    .split(/\s+/)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const handleStartEdit = () => {
    setFormData({
      fullName: profile.fullName || '',
      mobileNumber: profile.mobileNumber || '',
      email: profile.email || '',
      profilePhoto: profile.profilePhoto || '',
      alternateMobileNumber: profile.alternateMobileNumber || '',
      address: profile.address || '',
      district: profile.district || 'Guntur',
      state: profile.state || 'Andhra Pradesh',
      pinCode: profile.pinCode || '',
    });
    setErrors({});
    setPhotoError('');
    resetVerification();
    setOtpCode('');
    setPhoneValidationError('');
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setFormData({
      fullName: profile.fullName || '',
      mobileNumber: profile.mobileNumber || '',
      email: profile.email || '',
      profilePhoto: profile.profilePhoto || '',
      alternateMobileNumber: profile.alternateMobileNumber || '',
      address: profile.address || '',
      district: profile.district || 'Guntur',
      state: profile.state || 'Andhra Pradesh',
      pinCode: profile.pinCode || '',
    });
    setErrors({});
    setPhotoError('');
    resetVerification();
    setOtpCode('');
    setPhoneValidationError('');
    setIsEditing(false);
  };

  const handleFieldChange = (e) => {
    const { name, value } = e.target;
    if (name === 'mobileNumber') {
      const digitsOnly = String(value || '')
        .replace(/\D/g, '')
        .slice(0, 10);
      setFormData((prev) => ({ ...prev, mobileNumber: digitsOnly }));
      setPhoneValidationError('');
      setPhoneSuccessBanner('');
      if (isOtpSent || isVerified || otpError) {
        resetVerification();
        setOtpCode('');
      }
      if (errors.mobileNumber) {
        setErrors((prev) => {
          const next = { ...prev };
          delete next.mobileNumber;
          return next;
        });
      }
      return;
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
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

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoError('');

    if (file.size > 2 * 1024 * 1024) {
      setPhotoError('Image file must be smaller than 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setFormData((prev) => ({ ...prev, profilePhoto: String(reader.result || '') }));
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    const validationErrors = validateProfileFields(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const mobileChangedOnSubmit = currentMobile !== savedMobile;
    if (mobileChangedOnSubmit && !(isVerified && verifiedTarget === currentMobile)) {
      setPhoneValidationError(
        'Please verify your new mobile number with OTP before saving.'
      );
      toast.error('Please verify your new mobile number with OTP before saving.');
      return;
    }

    updateProfile({
      fullName: formData.fullName.trim(),
      mobileNumber: currentMobile,
      email: formData.email.trim(),
      profilePhoto: formData.profilePhoto,
      alternateMobileNumber: formData.alternateMobileNumber.replace(/\D/g, ''),
      address: formData.address.trim(),
      district: formData.district.trim(),
      state: formData.state.trim(),
      pinCode: formData.pinCode.trim(),
    });
    resetVerification();
    setOtpCode('');
    setPhoneValidationError('');
    if (mobileChangedOnSubmit) {
      setPhoneSuccessBanner('Your mobile number has been updated successfully.');
      toast.success('Your mobile number has been updated successfully.');
    }
    setIsEditing(false);
  };

  // Mobile Number Update Handlers
  const validateNewMobileNumber = (value) => {
    const digits = String(value || '').replace(/\D/g, '');
    if (!digits) return 'Mobile number is required.';
    if (!/^[6-9]\d{9}$/.test(digits)) {
      return 'Enter a valid 10-digit Indian mobile number.';
    }
    if (digits === String(profile.mobileNumber || '').replace(/\D/g, '')) {
      return 'This is already your registered mobile number.';
    }
    return null;
  };

  const openMobileUpdateModal = () => {
    setNewMobileNumber('');
    setNewNumberErrors('');
    setIsMobileUpdateModalOpen(true);
  };

  const closeMobileUpdateModal = () => {
    setIsMobileUpdateModalOpen(false);
    setNewMobileNumber('');
    setNewNumberErrors('');
  };

  const handleSendOTP = () => {
    const error = validateNewMobileNumber(newMobileNumber);
    if (error) {
      setNewNumberErrors(error);
      return;
    }
    setIsSendingOTP(true);
    setNewNumberErrors('');
    setIsSendingOTP(false);
    closeMobileUpdateModal();
    setIsOTPModalOpen(true);
  };

  const handleMobileUpdateSuccess = (verifiedNumber) => {
    updateProfile({ mobileNumber: verifiedNumber });
    setIsOTPModalOpen(false);
    setNewMobileNumber('');
    setNewNumberErrors('');
    toast.success('Mobile number updated successfully.');
  };

  const openAddAddress = () => {
    setEditingAddrId(null);
    setAddrForm({
      ...EMPTY_ADDRESS,
      recipientName: profile.fullName || '',
      contactNumber: profile.mobileNumber || '',
    });
    setAddrErrors({});
    setIsAddressModalOpen(true);
  };

  const openEditAddress = (addr) => {
    setEditingAddrId(addr.id);
    setAddrForm({
      label: addr.label || '',
      recipientName: addr.recipientName || '',
      contactNumber: addr.contactNumber || '',
      addressLine: addr.addressLine || '',
      district: addr.district || 'Guntur',
      state: addr.state || 'Andhra Pradesh',
      pinCode: addr.pinCode || '',
      isDefault: Boolean(addr.isDefault),
    });
    setAddrErrors({});
    setIsAddressModalOpen(true);
  };

  const handleSaveAddress = (e) => {
    e.preventDefault();
    const errs = validateAddressForm(addrForm);
    if (Object.keys(errs).length > 0) {
      setAddrErrors(errs);
      return;
    }

    const payload = {
      ...addrForm,
      label: addrForm.label.trim(),
      recipientName: addrForm.recipientName.trim(),
      contactNumber: addrForm.contactNumber.replace(/\D/g, ''),
      addressLine: addrForm.addressLine.trim(),
      district: addrForm.district.trim(),
      state: addrForm.state.trim(),
      pinCode: addrForm.pinCode.trim(),
    };

    if (editingAddrId) {
      updateDeliveryAddress(editingAddrId, payload);
    } else {
      addDeliveryAddress(payload);
    }
    setIsAddressModalOpen(false);
  };

  const displayPhoto = isEditing ? formData.profilePhoto : profile.profilePhoto;

  return (
    <div className="space-y-6">
      <CustomerPageHeader
        title="My Customer Profile"
        subtitle="Manage your personal contact details, profile photo, residential address, and multiple delivery locations."
        icon={UserCheck}
        badge="Active Customer"
        actions={
          !isEditing && (
            <button
              type="button"
              onClick={handleStartEdit}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-[#0F766E] text-white hover:bg-[#115E59] transition-colors cursor-pointer shadow-xs"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>Edit Profile</span>
            </button>
          )
        }
      />

      {/* Profile Identity Card */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-4">
          {displayPhoto ? (
            <img
              src={displayPhoto}
              alt={profile.fullName}
              className="w-16 h-16 rounded-2xl object-cover border border-[#E2E8F0] shrink-0"
            />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-[#0F766E] text-white flex items-center justify-center font-extrabold text-xl shrink-0">
              {initials}
            </div>
          )}

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-extrabold text-[#0F172A]">
                {profile.fullName}
              </h2>
              <CustomerStatusBadge status="Active" size="xs" />
            </div>

            <div className="text-xs text-[#64748B] flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-[#0F766E]" />
                +91 {profile.mobileNumber}
              </span>
              <button
                type="button"
                onClick={openMobileUpdateModal}
                className="px-3 py-1.5 rounded-lg text-xs font-bold text-[#0F766E] border border-[#0F766E] hover:bg-[#0F766E] hover:text-white transition-colors cursor-pointer"
              >
                Update
              </button>
              {profile.email && (
                <>
                  <span>&bull;</span>
                  <span className="inline-flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-[#0F766E]" />
                    {profile.email}
                  </span>
                </>
              )}
              <span>&bull;</span>
              <span className="inline-flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-[#0F766E]" />
                {profile.district}, {profile.state} - {profile.pinCode}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
              <span className="px-2.5 py-0.5 rounded-md bg-[#CCFBF1] text-[#0F766E] font-mono font-bold">
                Customer ID: {profile.customerId}
              </span>
              <span className="px-2.5 py-0.5 rounded-md bg-[#F8FAFC] border border-[#E2E8F0] text-[#64748B] font-medium">
                Member Since: {formatDate(profile.memberSince || '2025-01-15')}
              </span>
            </div>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-[#CCFBF1]/40 border border-[#14B8A6]/30 text-xs space-y-1 shrink-0">
          <div className="flex items-center gap-1.5 font-bold text-[#0F766E]">
            <ShieldCheck className="w-4 h-4" />
            <span>Verified Buyer Account</span>
          </div>
          <p className="text-[#0F172A]">
            {(profile.deliveryAddresses || []).length} Saved Delivery Address(es)
          </p>
        </div>
      </div>

      {/* Personal Information & Photo Form */}
      <form
        onSubmit={handleSaveProfile}
        className="bg-white border border-[#E2E8F0] rounded-2xl p-5 sm:p-6 space-y-5 shadow-2xs"
      >
        <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
          <div>
            <h3 className="text-base font-bold text-[#0F172A]">
              Customer Account Information
            </h3>
            <p className="text-xs text-[#64748B]">
              Update contact details, photo, and primary address
            </p>
          </div>
          {!isEditing && (
            <button
              type="button"
              onClick={handleStartEdit}
              className="text-xs font-bold text-[#0F766E] hover:underline cursor-pointer"
            >
              Edit Fields
            </button>
          )}
        </div>

        {/* Profile Photo Upload Control (visible & interactive in Edit mode) */}
        {isEditing && (
          <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {formData.profilePhoto ? (
                <img
                  src={formData.profilePhoto}
                  alt="Preview"
                  className="w-12 h-12 rounded-xl object-cover border border-[#E2E8F0]"
                />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-[#CCFBF1] text-[#0F766E] flex items-center justify-center font-bold text-sm">
                  {initials}
                </div>
              )}
              <div className="text-xs">
                <p className="font-bold text-[#0F172A]">Profile Photo</p>
                <p className="text-[#64748B]">PNG or JPG image up to 2MB</p>
                {photoError && <p className="text-[#DC2626] font-semibold mt-0.5">{photoError}</p>}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handlePhotoUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#CCFBF1] text-[#0F766E] hover:bg-[#14B8A6] hover:text-white transition-colors cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Photo</span>
              </button>
              {formData.profilePhoto && (
                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, profilePhoto: '' }))}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-red-200 text-[#DC2626] hover:bg-[#FEE2E2] cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove</span>
                </button>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Customer ID (Read-only) */}
          <div>
            <label className="block text-xs font-semibold text-[#0F172A] mb-1">
              Customer ID
            </label>
            <input
              type="text"
              readOnly
              value={profile.customerId}
              className="w-full px-3 py-2 text-sm font-mono font-bold rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] text-[#0F766E] cursor-not-allowed"
            />
          </div>

          {/* Full Name */}
          <div>
            <label htmlFor="fullName" className="block text-xs font-semibold text-[#0F172A] mb-1">
              Full Name <span className="text-[#DC2626]">*</span>
            </label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              value={isEditing ? formData.fullName : profile.fullName}
              onChange={handleFieldChange}
              disabled={!isEditing}
              className="w-full px-3 py-2 text-sm rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A] disabled:bg-[#F8FAFC] disabled:text-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
            />
            {errors.fullName && (
              <p className="text-[11px] font-medium text-[#DC2626] mt-1">{errors.fullName}</p>
            )}
          </div>

          {/* Email (Optional) */}
          <div>
            <label htmlFor="email" className="block text-xs font-semibold text-[#0F172A] mb-1">
              Email Address <span className="text-[#64748B] font-normal">(Optional)</span>
            </label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="Optional email address"
              value={isEditing ? formData.email : profile.email}
              onChange={handleFieldChange}
              disabled={!isEditing}
              className="w-full px-3 py-2 text-sm rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A] disabled:bg-[#F8FAFC] disabled:text-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
            />
            {errors.email && (
              <p className="text-[11px] font-medium text-[#DC2626] mt-1">{errors.email}</p>
            )}
          </div>

          {/* Mobile Number */}
          <div>
            <label htmlFor="mobileNumber" className="block text-xs font-semibold text-[#0F172A] mb-1">
              Mobile Number <span className="text-[#DC2626]">*</span>
            </label>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  id="mobileNumber"
                  name="mobileNumber"
                  type="tel"
                  maxLength={10}
                  value={isEditing ? formData.mobileNumber : profile.mobileNumber}
                  onChange={handleFieldChange}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A] disabled:bg-[#F8FAFC] disabled:text-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                />
                {isEditing && isMobileChanged && !isNewMobileVerified && (
                  <button
                    type="button"
                    onClick={handleVerifyNewNumber}
                    disabled={isSending || !isValidNewMobile}
                    className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-[#0F766E] text-white hover:bg-[#115E59] disabled:opacity-50 cursor-pointer"
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

              {(errors.mobileNumber || phoneValidationError || (!isOtpSent && otpError)) && (
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#DC2626]">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{errors.mobileNumber || phoneValidationError || otpError}</span>
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
                <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-1.5">
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
                <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#0F766E]/30 space-y-2.5">
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

                  <p className="text-[11px] text-[#64748B]">
                    Enter the 6-digit OTP sent to <strong className="font-mono text-[#0F172A]">+91 {currentMobile}</strong> (valid for 5 minutes).
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
                      className="w-full px-3 py-1.5 text-xs font-mono tracking-widest rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                    />
                    <button
                      type="button"
                      onClick={handleConfirmOtp}
                      disabled={isVerifying || otpCode.length !== 6}
                      className="shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#0F766E] text-white hover:bg-[#115E59] disabled:opacity-50 cursor-pointer"
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
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#DC2626]">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{otpError}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[11px] text-[#64748B] pt-0.5">
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
          </div>

          {/* Alternate Mobile Number */}
          <div>
            <label htmlFor="alternateMobileNumber" className="block text-xs font-semibold text-[#0F172A] mb-1">
              Alternate Mobile Number
            </label>
            <input
              id="alternateMobileNumber"
              name="alternateMobileNumber"
              type="tel"
              maxLength={10}
              value={isEditing ? formData.alternateMobileNumber : profile.alternateMobileNumber}
              onChange={handleFieldChange}
              disabled={!isEditing}
              placeholder="Optional 10-digit number"
              className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A] disabled:bg-[#F8FAFC] disabled:text-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
            />
            {errors.alternateMobileNumber && (
              <p className="text-[11px] font-medium text-[#DC2626] mt-1">
                {errors.alternateMobileNumber}
              </p>
            )}
          </div>

          {/* PIN Code */}
          <div>
            <label htmlFor="pinCode" className="block text-xs font-semibold text-[#0F172A] mb-1">
              PIN Code <span className="text-[#DC2626]">*</span>
            </label>
            <input
              id="pinCode"
              name="pinCode"
              type="text"
              maxLength={6}
              value={isEditing ? formData.pinCode : profile.pinCode}
              onChange={handleFieldChange}
              disabled={!isEditing}
              className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A] disabled:bg-[#F8FAFC] disabled:text-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
            />
            {errors.pinCode && (
              <p className="text-[11px] font-medium text-[#DC2626] mt-1">{errors.pinCode}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Address */}
          <div className="md:col-span-1">
            <label htmlFor="address" className="block text-xs font-semibold text-[#0F172A] mb-1">
              Address <span className="text-[#DC2626]">*</span>
            </label>
            <input
              id="address"
              name="address"
              type="text"
              value={isEditing ? formData.address : profile.address}
              onChange={handleFieldChange}
              disabled={!isEditing}
              className="w-full px-3 py-2 text-sm rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A] disabled:bg-[#F8FAFC] disabled:text-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
            />
            {errors.address && (
              <p className="text-[11px] font-medium text-[#DC2626] mt-1">{errors.address}</p>
            )}
          </div>

          {/* District */}
          <div>
            <label htmlFor="district" className="block text-xs font-semibold text-[#0F172A] mb-1">
              District <span className="text-[#DC2626]">*</span>
            </label>
            <select
              id="district"
              name="district"
              value={isEditing ? formData.district : profile.district}
              onChange={handleFieldChange}
              disabled={!isEditing}
              className="w-full px-3 py-2 text-sm rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A] disabled:bg-[#F8FAFC] disabled:text-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
            >
              {Array.from(new Set([...AP_DISTRICTS, 'Warangal', 'Hyderabad', 'Vijayawada'])).map(
                (dist) => (
                  <option key={dist} value={dist}>
                    {dist}
                  </option>
                )
              )}
            </select>
            {errors.district && (
              <p className="text-[11px] font-medium text-[#DC2626] mt-1">{errors.district}</p>
            )}
          </div>

          {/* State */}
          <div>
            <label htmlFor="state" className="block text-xs font-semibold text-[#0F172A] mb-1">
              State <span className="text-[#DC2626]">*</span>
            </label>
            <select
              id="state"
              name="state"
              value={isEditing ? formData.state : profile.state}
              onChange={handleFieldChange}
              disabled={!isEditing}
              className="w-full px-3 py-2 text-sm rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A] disabled:bg-[#F8FAFC] disabled:text-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
            >
              {INDIAN_STATES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
            {errors.state && (
              <p className="text-[11px] font-medium text-[#DC2626] mt-1">{errors.state}</p>
            )}
          </div>
        </div>

        {isEditing && (
          <div className="flex flex-wrap items-center justify-end gap-2 pt-3 border-t border-[#E2E8F0]">
            <button
              type="button"
              onClick={handleCancelEdit}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl border border-[#E2E8F0] bg-white text-[#0F172A] hover:bg-[#F8FAFC] cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Cancel</span>
            </button>
            <button
              type="submit"
              disabled={isMobileChanged && !isNewMobileVerified}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-[#0F766E] text-white hover:bg-[#115E59] disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Save Changes</span>
            </button>
          </div>
        )}
      </form>

      {/* Multiple Delivery Addresses Section */}
      <section className="bg-white border border-[#E2E8F0] rounded-2xl p-5 sm:p-6 space-y-4 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#E2E8F0]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#CCFBF1] text-[#0F766E] flex items-center justify-center">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#0F172A]">
                Saved Delivery Addresses
              </h3>
              <p className="text-xs text-[#64748B]">
                Manage multiple warehouses, stores, or home drop-off locations for your orders
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={openAddAddress}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#CCFBF1] text-[#0F766E] border border-[#14B8A6]/30 hover:bg-[#0F766E] hover:text-white transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Delivery Address</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(profile.deliveryAddresses || []).map((addr) => (
            <div
              key={addr.id}
              className={`p-4 rounded-xl border flex flex-col justify-between gap-3 transition-all ${addr.isDefault
                  ? 'bg-[#CCFBF1]/25 border-[#0F766E] ring-1 ring-[#0F766E]/20'
                  : 'bg-[#F8FAFC]/60 border-[#E2E8F0]'
                }`}
            >
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-sm text-[#0F172A]">{addr.label}</span>
                  {addr.isDefault ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#0F766E] text-white">
                      <CheckCircle2 className="w-3 h-3" />
                      Default
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setDefaultDeliveryAddress(addr.id)}
                      className="text-[11px] font-bold text-[#0F766E] hover:underline cursor-pointer"
                    >
                      Set as Default
                    </button>
                  )}
                </div>

                <p className="font-semibold text-[#0F172A]">{addr.recipientName}</p>
                <p className="text-[#64748B]">{addr.addressLine}</p>
                <p className="text-[#0F172A] font-medium">
                  {addr.district}, {addr.state} - {addr.pinCode}
                </p>
                <p className="text-[#64748B] font-mono">Phone: +91 {addr.contactNumber}</p>
              </div>

              <div className="pt-2.5 border-t border-[#E2E8F0] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => openEditAddress(addr)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-white border border-[#E2E8F0] text-[#0F766E] hover:bg-[#CCFBF1] transition-colors cursor-pointer"
                >
                  <Pencil className="w-3 h-3" />
                  <span>Edit</span>
                </button>
                <button
                  type="button"
                  disabled={(profile.deliveryAddresses || []).length <= 1}
                  onClick={() => deleteDeliveryAddress(addr.id)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-white border border-red-200 text-[#DC2626] hover:bg-[#FEE2E2] disabled:opacity-40 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Remove</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Add / Edit Delivery Address Modal */}
      <CustomerModal
        isOpen={isAddressModalOpen}
        onClose={() => setIsAddressModalOpen(false)}
        title={editingAddrId ? 'Edit Delivery Address' : 'Add New Delivery Address'}
        subtitle="Provide complete location details for agri produce delivery"
        size="md"
        footer={
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAddressModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold rounded-xl border border-[#E2E8F0] bg-white text-[#0F172A] hover:bg-[#F8FAFC] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveAddress}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-[#0F766E] text-white hover:bg-[#115E59] cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Address</span>
            </button>
          </div>
        }
      >
        <div className="space-y-3 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#0F172A] mb-1">
                Address Label *
              </label>
              <input
                type="text"
                value={addrForm.label}
                onChange={(e) => setAddrForm((p) => ({ ...p, label: e.target.value }))}
                placeholder="e.g., Main Warehouse / Store"
                className="w-full px-3 py-2 text-xs rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A]"
              />
              {addrErrors.label && (
                <p className="text-[11px] text-[#DC2626] mt-0.5">{addrErrors.label}</p>
              )}
            </div>
            <div>
              <label className="block font-semibold text-[#0F172A] mb-1">
                Recipient Name *
              </label>
              <input
                type="text"
                value={addrForm.recipientName}
                onChange={(e) => setAddrForm((p) => ({ ...p, recipientName: e.target.value }))}
                className="w-full px-3 py-2 text-xs rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A]"
              />
              {addrErrors.recipientName && (
                <p className="text-[11px] text-[#DC2626] mt-0.5">{addrErrors.recipientName}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#0F172A] mb-1">
                Contact Number *
              </label>
              <input
                type="tel"
                maxLength={10}
                value={addrForm.contactNumber}
                onChange={(e) =>
                  setAddrForm((p) => ({ ...p, contactNumber: e.target.value }))
                }
                className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A]"
              />
              {addrErrors.contactNumber && (
                <p className="text-[11px] text-[#DC2626] mt-0.5">{addrErrors.contactNumber}</p>
              )}
            </div>
            <div>
              <label className="block font-semibold text-[#0F172A] mb-1">
                PIN Code *
              </label>
              <input
                type="text"
                maxLength={6}
                value={addrForm.pinCode}
                onChange={(e) => setAddrForm((p) => ({ ...p, pinCode: e.target.value }))}
                className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A]"
              />
              {addrErrors.pinCode && (
                <p className="text-[11px] text-[#DC2626] mt-0.5">{addrErrors.pinCode}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block font-semibold text-[#0F172A] mb-1">
              Full Street / Warehouse Address *
            </label>
            <input
              type="text"
              value={addrForm.addressLine}
              onChange={(e) => setAddrForm((p) => ({ ...p, addressLine: e.target.value }))}
              placeholder="Plot number, market yard, street landmark..."
              className="w-full px-3 py-2 text-xs rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A]"
            />
            {addrErrors.addressLine && (
              <p className="text-[11px] text-[#DC2626] mt-0.5">{addrErrors.addressLine}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#0F172A] mb-1">District *</label>
              <input
                type="text"
                value={addrForm.district}
                onChange={(e) => setAddrForm((p) => ({ ...p, district: e.target.value }))}
                className="w-full px-3 py-2 text-xs rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A]"
              />
              {addrErrors.district && (
                <p className="text-[11px] text-[#DC2626] mt-0.5">{addrErrors.district}</p>
              )}
            </div>
            <div>
              <label className="block font-semibold text-[#0F172A] mb-1">State *</label>
              <select
                value={addrForm.state}
                onChange={(e) => setAddrForm((p) => ({ ...p, state: e.target.value }))}
                className="w-full px-3 py-2 text-xs rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A]"
              >
                {INDIAN_STATES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
              {addrErrors.state && (
                <p className="text-[11px] text-[#DC2626] mt-0.5">{addrErrors.state}</p>
              )}
            </div>
          </div>

          <label className="flex items-center gap-2 pt-1 cursor-pointer">
            <input
              type="checkbox"
              checked={addrForm.isDefault}
              onChange={(e) => setAddrForm((p) => ({ ...p, isDefault: e.target.checked }))}
              className="rounded border-[#E2E8F0] text-[#0F766E] focus:ring-[#0F766E]"
            />
            <span className="font-semibold text-[#0F172A]">Set as default delivery address</span>
          </label>
        </div>
      </CustomerModal>

      {/* Mobile Number Update Modal - New Number Entry */}
      <CustomerModal
        isOpen={isMobileUpdateModalOpen}
        onClose={closeMobileUpdateModal}
        title="Update Mobile Number"
        subtitle="Enter your new mobile number to receive an OTP for verification"
        size="md"
        footer={
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={closeMobileUpdateModal}
              className="px-4 py-2 text-xs font-semibold rounded-xl border border-[#E2E8F0] bg-white text-[#0F172A] hover:bg-[#F8FAFC] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSendOTP}
              disabled={isSendingOTP}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-[#0F766E] text-white hover:bg-[#115E59] disabled:opacity-50 cursor-pointer"
            >
              {isSendingOTP ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <Send className="w-3 h-3" />
                  <span>Send OTP</span>
                </>
              )}
            </button>
          </div>
        }
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-[#0F172A] mb-1">
              New Mobile Number *
            </label>
            <input
              type="tel"
              maxLength={10}
              value={newMobileNumber}
              onChange={(e) => setNewMobileNumber(e.target.value.replace(/\D/g, ''))}
              placeholder="+91 9876543210"
              className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
            />
            {newNumberErrors && (
              <p className="text-[11px] text-[#DC2626] mt-0.5">{newNumberErrors}</p>
            )}
          </div>
          <p className="text-[11px] text-[#64748B]">
            An OTP will be sent to <strong className="font-mono text-[#0F172A]">+91 {newMobileNumber || ''}</strong> for verification.
          </p>
        </div>
      </CustomerModal>

      {/* Mobile OTP Verification Modal */}
      <MobileOTPVerification
        isOpen={isOTPModalOpen}
        phoneNumber={newMobileNumber}
        onClose={() => setIsOTPModalOpen(false)}
        onSuccess={handleMobileUpdateSuccess}
      />

    </div>
  );
}

export default MyProfile;


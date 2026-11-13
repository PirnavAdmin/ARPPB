import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Building2,
  Save,
  RotateCcw,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import { profileSchema } from '../../../utils/validators';
import { AP_DISTRICTS } from '../../../utils/constants';
import { useOTPVerification } from '../../../hooks/useOTPVerification';
import VendorFormField from '../VendorFormField';
import VendorFileUpload from '../VendorFileUpload';

export default function ProfileForm({ vendorUser, onSaveProfile }) {
  const [logoUrl, setLogoUrl] = useState(vendorUser?.logoUrl || '');
  const [savedMobile, setSavedMobile] = useState(() =>
    String(vendorUser?.mobileNumber || '').replace(/\D/g, '')
  );
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

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      businessName: vendorUser?.businessName || '',
      ownerName: vendorUser?.ownerName || '',
      mobileNumber: vendorUser?.mobileNumber || '',
      email: vendorUser?.email || '',
      gstNumber: vendorUser?.gstNumber || '',
      businessRegNumber: vendorUser?.businessRegNumber || '',
      businessType:
        vendorUser?.businessType ||
        'Agri Procurement, Milling & Wholesale Distribution',
      businessAddress: vendorUser?.businessAddress || '',
      district: vendorUser?.district || 'Kurnool',
      state: vendorUser?.state || 'Andhra Pradesh',
      pinCode: vendorUser?.pinCode || '518003',
    },
  });

  useEffect(() => {
    const cleanPropMobile = String(vendorUser?.mobileNumber || '').replace(/\D/g, '');
    if (cleanPropMobile && cleanPropMobile !== savedMobile) {
      setSavedMobile(cleanPropMobile);
      setValue('mobileNumber', cleanPropMobile, { shouldDirty: false });
    }
  }, [vendorUser?.mobileNumber, savedMobile, setValue]);

  const watchedMobile = String(watch('mobileNumber') || '').replace(/\D/g, '');
  const isMobileChanged = watchedMobile !== savedMobile;
  const isValidNewMobile = /^[6-9]\d{9}$/.test(watchedMobile);
  const isNewMobileVerified =
    isMobileChanged && isVerified && verifiedTarget === watchedMobile;

  const mobileRegister = register('mobileNumber');

  const handleMobileInputChange = (e) => {
    const digitsOnly = String(e.target.value || '')
      .replace(/\D/g, '')
      .slice(0, 10);
    e.target.value = digitsOnly;
    mobileRegister.onChange(e);
    setPhoneValidationError('');
    setPhoneSuccessBanner('');
    if (isOtpSent || isVerified || otpError) {
      resetVerification();
      setOtpCode('');
    }
  };

  const handleVerifyNewNumber = async () => {
    setPhoneValidationError('');
    setPhoneSuccessBanner('');

    if (!watchedMobile) {
      setPhoneValidationError('Mobile number is required.');
      return;
    }
    if (!isValidNewMobile) {
      setPhoneValidationError('Please enter a valid 10-digit Indian mobile number.');
      return;
    }
    if (!isMobileChanged) {
      setPhoneValidationError('Please enter a new mobile number different from your current number.');
      return;
    }

    setOtpCode('');
    try {
      await requestOTP(watchedMobile, {
        customMessage: 'OTP sent successfully to your new mobile number.',
        duplicateMessage:
          'This mobile number is already registered. Please use a different mobile number.',
      });
    } catch {
      // Error is captured in otpError state by useOTPVerification
    }
  };

  const handleConfirmOtp = async () => {
    const cleanOtp = String(otpCode || '').replace(/\D/g, '');
    if (cleanOtp.length !== 6) {
      setOtpError('Please enter a valid 6-digit numeric OTP.');
      return;
    }

    try {
      await verifyOTP(watchedMobile, cleanOtp, {
        customVerifiedMessage: 'New mobile number verified successfully.',
      });
    } catch {
      // Error is captured in otpError state by useOTPVerification
    }
  };

  const handleResendOtp = async () => {
    if (!canResend || isSending) return;
    setOtpCode('');
    try {
      await resendOTP(watchedMobile, {
        customMessage: 'OTP sent successfully to your new mobile number.',
        duplicateMessage:
          'This mobile number is already registered. Please use a different mobile number.',
      });
    } catch {
      // Error is captured in otpError state
    }
  };

  const onSubmit = (data) => {
    const cleanSubmittedMobile = String(data.mobileNumber || '').replace(/\D/g, '');
    const mobileChangedOnSubmit = cleanSubmittedMobile !== savedMobile;

    if (mobileChangedOnSubmit && !(isVerified && verifiedTarget === cleanSubmittedMobile)) {
      setPhoneValidationError(
        'Please verify your new mobile number with OTP before saving your profile.'
      );
      toast.error('Please verify your new mobile number with OTP before saving.');
      return;
    }

    const updatedPayload = {
      ...data,
      mobileNumber: cleanSubmittedMobile,
      logoUrl,
    };

    onSaveProfile(updatedPayload);
    setSavedMobile(cleanSubmittedMobile);
    reset(updatedPayload);
    resetVerification();
    setOtpCode('');
    setPhoneValidationError('');

    if (mobileChangedOnSubmit) {
      setPhoneSuccessBanner('Your mobile number has been updated successfully.');
      toast.success('Your mobile number has been updated successfully.');
    } else {
      toast.success('Vendor business profile updated successfully.');
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="bg-brand-surface border border-brand-border rounded-xl p-5 space-y-5 shadow-xs"
    >
      <div className="flex items-center justify-between border-b border-brand-border pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-brand-light text-brand-primary">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-brand-text">
              Business & Statutory Profile
            </h2>
            <p className="text-xs text-brand-muted">
              Update registered enterprise identity, GSTIN, APMC details, and business logo
            </p>
          </div>
        </div>
        <span className="px-2.5 py-1 rounded-md bg-brand-light text-brand-primary font-mono text-xs font-bold">
          {vendorUser?.vendorId || 'VND-AP-2026-001'}
        </span>
      </div>

      {/* Business Logo Upload */}
      <div className="p-4 rounded-xl bg-brand-background/60 border border-brand-border">
        <VendorFileUpload
          label="Business Logo (Displayed on Invoices & Reports)"
          value={logoUrl}
          onChange={setLogoUrl}
          helperText="Upload PNG, JPG or WEBP corporate seal/logo (Max 2MB)"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <VendorFormField label="Vendor ID (Read-Only)">
          <input
            type="text"
            readOnly
            value={vendorUser?.vendorId || 'VND-AP-2026-001'}
            className="w-full px-3 py-2 text-sm font-mono font-bold rounded-lg border border-brand-border bg-brand-background text-brand-primary cursor-not-allowed"
          />
        </VendorFormField>

        <div className="md:col-span-2">
          <VendorFormField
            label="Business Name"
            required
            error={errors.businessName?.message}
          >
            <input
              type="text"
              {...register('businessName')}
              className="w-full px-3 py-2 text-sm rounded-lg border border-brand-border bg-brand-surface text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary"
            />
          </VendorFormField>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <VendorFormField
          label="Owner / Managing Director Name"
          required
          error={errors.ownerName?.message}
        >
          <input
            type="text"
            {...register('ownerName')}
            className="w-full px-3 py-2 text-sm rounded-lg border border-brand-border bg-brand-surface text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary"
          />
        </VendorFormField>

        <VendorFormField
          label="Mobile Number"
          required
          error={
            errors.mobileNumber?.message ||
            phoneValidationError ||
            (!isOtpSent && otpError ? otpError : '')
          }
        >
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="tel"
                maxLength={10}
                {...mobileRegister}
                onChange={handleMobileInputChange}
                className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-brand-border bg-brand-surface text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary"
              />
              {isMobileChanged && !isNewMobileVerified && (
                <button
                  type="button"
                  onClick={handleVerifyNewNumber}
                  disabled={isSending || !isValidNewMobile}
                  className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg bg-brand-primary text-white hover:bg-brand-secondary transition-colors disabled:opacity-50 cursor-pointer"
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

            {!isMobileChanged && savedMobile && (
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-brand-primary">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>
                  {phoneSuccessBanner || 'Registered & verified mobile number'}
                </span>
              </div>
            )}

            {isMobileChanged && isNewMobileVerified && (
              <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{statusMessage || 'New mobile number verified successfully.'}</span>
              </div>
            )}

            {isMobileChanged && !isNewMobileVerified && !isOtpSent && (
              <p className="text-[11px] text-amber-700 font-medium">
                Click &ldquo;Verify New Number&rdquo; to verify this mobile number with OTP before saving.
              </p>
            )}

            {isMobileChanged && isOtpSent && !isNewMobileVerified && (
              <div className="p-3 rounded-xl bg-brand-background border border-brand-primary/30 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold text-brand-primary">
                    {statusMessage || 'OTP sent successfully to your new mobile number.'}
                  </span>
                  {demoOtp && (
                    <button
                      type="button"
                      onClick={() => setOtpCode(demoOtp)}
                      className="px-2 py-0.5 rounded bg-brand-light text-brand-primary font-mono text-[11px] font-bold cursor-pointer"
                      title="Click to auto-fill Dev OTP"
                    >
                      Dev OTP: {demoOtp}
                    </button>
                  )}
                </div>

                <p className="text-[11px] text-brand-muted">
                  Enter the 6-digit OTP sent to <strong className="font-mono text-brand-text">+91 {watchedMobile}</strong> (valid for 5 minutes).
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
                    className="w-full px-3 py-1.5 text-xs font-mono tracking-widest rounded-lg border border-brand-border bg-brand-surface text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  />
                  <button
                    type="button"
                    onClick={handleConfirmOtp}
                    disabled={isVerifying || otpCode.length !== 6}
                    className="shrink-0 inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg bg-brand-primary text-white hover:bg-brand-secondary disabled:opacity-50 cursor-pointer"
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

                <div className="flex items-center justify-between text-[11px] text-brand-muted pt-0.5">
                  <span>Didn&apos;t receive the code?</span>
                  {canResend ? (
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={isSending}
                      className="inline-flex items-center gap-1 font-bold text-brand-primary hover:underline cursor-pointer"
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
        </VendorFormField>

        <VendorFormField label="Email Address" required error={errors.email?.message}>
          <input
            type="email"
            {...register('email')}
            className="w-full px-3 py-2 text-sm rounded-lg border border-brand-border bg-brand-surface text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary"
          />
        </VendorFormField>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <VendorFormField
          label="GST Number (GSTIN)"
          required
          error={errors.gstNumber?.message}
        >
          <input
            type="text"
            maxLength={15}
            {...register('gstNumber')}
            className="w-full px-3 py-2 text-sm font-mono uppercase rounded-lg border border-brand-border bg-brand-surface text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary"
          />
        </VendorFormField>

        <VendorFormField
          label="Business Registration Number (CIN / MSME)"
          required
          error={errors.businessRegNumber?.message}
        >
          <input
            type="text"
            {...register('businessRegNumber')}
            className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-brand-border bg-brand-surface text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary"
          />
        </VendorFormField>

        <VendorFormField
          label="Business Type"
          required
          error={errors.businessType?.message}
        >
          <select
            {...register('businessType')}
            className="w-full px-3 py-2 text-sm rounded-lg border border-brand-border bg-brand-surface text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary"
          >
            <option value="Agri Procurement, Milling & Wholesale Distribution">
              Agri Procurement, Milling & Wholesale Distribution
            </option>
            <option value="Raw Commodity Processing & Oil Extraction Mill">
              Raw Commodity Processing & Oil Extraction Mill
            </option>
            <option value="APMC Licensed Commission & Bulk Trading House">
              APMC Licensed Commission & Bulk Trading House
            </option>
            <option value="FPO / Agro-Processing Cooperative Enterprise">
              FPO / Agro-Processing Cooperative Enterprise
            </option>
          </select>
        </VendorFormField>
      </div>

      <VendorFormField
        label="Business Address"
        required
        error={errors.businessAddress?.message}
      >
        <input
          type="text"
          {...register('businessAddress')}
          className="w-full px-3 py-2 text-sm rounded-lg border border-brand-border bg-brand-surface text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary"
        />
      </VendorFormField>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <VendorFormField label="District" required error={errors.district?.message}>
          <select
            {...register('district')}
            className="w-full px-3 py-2 text-sm rounded-lg border border-brand-border bg-brand-surface text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary"
          >
            {AP_DISTRICTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </VendorFormField>

        <VendorFormField label="State" required error={errors.state?.message}>
          <input
            type="text"
            {...register('state')}
            className="w-full px-3 py-2 text-sm rounded-lg border border-brand-border bg-brand-surface text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary"
          />
        </VendorFormField>

        <VendorFormField label="PIN Code" required error={errors.pinCode?.message}>
          <input
            type="text"
            maxLength={6}
            {...register('pinCode')}
            className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-brand-border bg-brand-surface text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary"
          />
        </VendorFormField>
      </div>

      <div className="flex items-center justify-end gap-2 pt-3 border-t border-brand-border">
        <button
          type="button"
          onClick={() => {
            reset();
            setValue('mobileNumber', savedMobile, { shouldDirty: false });
            setLogoUrl(vendorUser?.logoUrl || '');
            resetVerification();
            setOtpCode('');
            setPhoneValidationError('');
            setPhoneSuccessBanner('');
          }}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg border border-brand-border text-brand-text hover:bg-brand-background transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset Changes
        </button>
        <button
          type="submit"
          disabled={
            (!isDirty && logoUrl === (vendorUser?.logoUrl || '')) ||
            (isMobileChanged && !isNewMobileVerified)
          }
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg bg-brand-primary text-white hover:bg-brand-secondary transition-colors disabled:opacity-50 cursor-pointer"
        >
          <Save className="w-4 h-4" />
          Save Business Profile
        </button>
      </div>
    </form>
  );
}


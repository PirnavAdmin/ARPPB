import React from 'react';
import { Link } from 'react-router-dom';
import { Phone, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { validateIndianPhone, sanitizePhone } from '../../../utils/validation/phoneValidation';
import { OTPVerification } from './OTPVerification';
import { VerificationStatus } from './VerificationStatus';

/**
 * PhoneNumberInput Component
 * In-row layout: [ Phone icon | 10-digit input ] [ Send OTP ]
 * Automatically resets verification when the number is modified.
 * Renders OTPVerification drawer and VerificationStatus badge.
 */
export const PhoneNumberInput = ({
  label = 'Phone Number',
  name = 'phone',
  value = '',
  onChange,
  onBlur,
  error = null,
  required = true,
  disabled = false,
  className = '',
  // OTP Verification state & handlers
  isOtpSent = false,
  isSending = false,
  isVerifying = false,
  isVerified = false,
  timer = 30,
  canResend = false,
  otpNotice = 'OTP sent successfully to your registered mobile number.',
  demoOtp = null,
  rawDevOtp = null,
  isDuplicateMobile = false,
  otpError = null,
  onRequestOTP,
  onVerifyOTP,
  onResendOTP,
  onResetVerification,
}) => {
  const fieldErrorMessage = error || (!isOtpSent ? otpError : null);
  const hasError = Boolean(fieldErrorMessage);
  const isValidPhone = !validateIndianPhone(value);

  const handleInputChange = (e) => {
    const rawVal = e.target.value;
    const cleaned = sanitizePhone(rawVal);

    // If verified, OTP is already sent, or an OTP error/duplicate status is active, editing resets it
    if (isVerified || isOtpSent || otpError || isDuplicateMobile) {
      if (onResetVerification) {
        onResetVerification();
      }
    }

    if (onChange) {
      onChange({
        target: {
          name,
          value: cleaned,
        },
      });
    }
  };

  const handleSendOtpClick = async (e) => {
    e.preventDefault();
    if (!isValidPhone || isSending || isVerified) return;
    if (onRequestOTP) {
      await onRequestOTP(value);
    }
  };

  return (
    <div className={`w-full space-y-2 ${className}`}>
      {/* Label and Verified Badge in Header */}
      <div className="flex items-center justify-between">
        {label && (
          <label
            htmlFor={name}
            className="block text-xs font-semibold text-[#1F2937] select-none"
          >
            {label}
            {required && <span className="text-[#DC2626] ml-1">*</span>}
          </label>
        )}
        {isVerified && (
          <span className="text-[11px] font-semibold text-[#16A34A] flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Verified
          </span>
        )}
      </div>

      {/* In-row Input + Action Button */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 rounded-xl">
          <div className="absolute inset-y-0 left-0 pl-3 sm:pl-3.5 flex items-center pointer-events-none text-[#64748B]">
            <Phone className="w-4 h-4" />
          </div>

          <input
            id={name}
            name={name}
            type="tel"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={10}
            value={value}
            onChange={handleInputChange}
            onBlur={onBlur}
            disabled={disabled}
            placeholder="Enter 10-digit mobile number"
            className={`
              w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm rounded-xl border bg-white text-[#1F2937]
              placeholder:text-[#94A3B8] transition-all duration-150 outline-none
              ${
                hasError
                  ? 'border-[#DC2626] focus:border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/15 bg-red-50/20'
                  : isVerified
                  ? 'border-emerald-400 bg-emerald-50/20 focus:border-[#16A34A] focus:ring-2 focus:ring-[#16A34A]/15'
                  : 'border-[#DCE3EA] hover:border-[#CBD5E1] focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15'
              }
              ${disabled ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : ''}
            `}
          />
        </div>

        {/* Send OTP button or status indicator */}
        {!isVerified ? (
          <button
            type="button"
            onClick={handleSendOtpClick}
            disabled={!isValidPhone || isSending || disabled}
            className={`
              h-[42px] px-3.5 sm:px-4 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-150 flex items-center gap-1.5 cursor-pointer shadow-2xs
              ${
                isValidPhone && !isSending
                  ? 'bg-[#0F766E] text-white hover:bg-[#115E59] active:scale-[0.98]'
                  : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-80'
              }
            `}
          >
            {isSending ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Sending...</span>
              </>
            ) : isOtpSent ? (
              <span>Resend OTP</span>
            ) : (
              <span>Send OTP</span>
            )}
          </button>
        ) : (
          <div className="h-[42px] px-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-[#16A34A] flex items-center gap-1.5 text-xs font-semibold select-none">
            <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
            <span className="hidden sm:inline">Verified</span>
          </div>
        )}
      </div>

      {/* Field-level error */}
      {hasError && (
        <div className="text-[11px] text-[#DC2626] flex flex-wrap items-center gap-1.5 font-medium">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{fieldErrorMessage}</span>
          {isDuplicateMobile && (
            <Link
              to="/login"
              state={{ contactNumber: value }}
              className="font-bold text-[#0F766E] hover:text-[#115E59] underline ml-0.5"
            >
              Sign In →
            </Link>
          )}
        </div>
      )}

      {/* OTP verification input section (revealed ONLY when OTP is sent and not yet verified) */}
      {isOtpSent && !isVerified && !isDuplicateMobile && (
        <div className="pt-1.5">
          <OTPVerification
            phone={value}
            onVerify={onVerifyOTP}
            onResend={onResendOTP}
            isVerifying={isVerifying}
            isSending={isSending}
            timer={timer}
            canResend={canResend}
            notice={otpNotice}
            demoOtp={demoOtp}
            rawDevOtp={rawDevOtp}
            error={otpError}
          />
        </div>
      )}

      {/* Verified Banner confirmation */}
      {isVerified && (
        <VerificationStatus message="Phone Number Verified" />
      )}
    </div>
  );
};

export default PhoneNumberInput;



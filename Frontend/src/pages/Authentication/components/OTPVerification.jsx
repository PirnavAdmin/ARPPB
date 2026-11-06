import React, { useState } from 'react';
import { Info, AlertCircle, RefreshCw, CheckCircle2 } from 'lucide-react';
import { OTPInput } from './OTPInput';
import { AuthButton } from './AuthButton';

/**
 * OTPVerification Component
 * Embeds OTP notice, 6-digit input, timer/resend link, and verification action button.
 */
export const OTPVerification = ({
  phone,
  onVerify,
  onResend,
  isVerifying = false,
  isSending = false,
  timer = 30,
  canResend = false,
  notice = 'Demo OTP generated. Enter the 6-digit code to continue.',
  error = null,
  className = '',
}) => {
  const [otpCode, setOtpCode] = useState('');
  const [localError, setLocalError] = useState(null);

  const displayError = error || localError;

  const handleVerify = async (e) => {
    e?.preventDefault();
    if (otpCode.length !== 6) {
      setLocalError('Please enter the full 6-digit OTP code.');
      return;
    }
    setLocalError(null);
    if (onVerify) {
      await onVerify(otpCode);
    }
  };

  const handleResend = async () => {
    if (!canResend || isSending) return;
    setLocalError(null);
    setOtpCode('');
    if (onResend) {
      await onResend();
    }
  };

  return (
    <div
      className={`p-3.5 sm:p-4 rounded-2xl bg-teal-50/40 border border-teal-100/80 space-y-3.5 animate-fadeIn ${className}`}
    >
      {/* Notice Header */}
      {notice && (
        <div className="flex items-start gap-2 text-xs text-[#0F766E] bg-white/80 p-2.5 rounded-xl border border-teal-100 shadow-2xs">
          <Info className="w-4 h-4 text-[#0F766E] flex-shrink-0 mt-0.5" />
          <div className="leading-snug">
            <span className="font-semibold block">{notice}</span>
            <span className="text-[11px] text-[#64748B]">
              Code sent to <span className="font-medium text-[#1F2937]">+91 {phone}</span>
            </span>
          </div>
        </div>
      )}

      {/* 6-digit OTP Input */}
      <div className="py-1">
        <OTPInput
          value={otpCode}
          onChange={(val) => {
            setOtpCode(val);
            if (localError) setLocalError(null);
          }}
          disabled={isVerifying}
          hasError={Boolean(displayError)}
        />
      </div>

      {/* Error Message */}
      {displayError && (
        <p className="text-xs text-[#DC2626] flex items-center justify-center gap-1 font-medium bg-red-50/80 p-2 rounded-lg border border-red-100">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{displayError}</span>
        </p>
      )}

      {/* Footer Actions: Timer & Resend, Verify Button */}
      <div className="flex items-center justify-between gap-3 pt-1">
        <div className="text-xs">
          {timer > 0 ? (
            <span className="text-[#64748B]">
              Resend in <span className="font-semibold text-[#0F766E]">{timer}s</span>
            </span>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              disabled={isSending}
              className="inline-flex items-center gap-1 font-semibold text-[#0F766E] hover:text-[#115E59] hover:underline cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSending ? 'animate-spin' : ''}`} />
              <span>Resend OTP</span>
            </button>
          )}
        </div>

        <AuthButton
          type="button"
          onClick={handleVerify}
          isLoading={isVerifying}
          disabled={otpCode.length !== 6 || isVerifying}
          size="sm"
          className="!w-auto px-4 !py-1.5 text-xs font-semibold rounded-lg"
          icon={CheckCircle2}
        >
          Verify OTP
        </AuthButton>
      </div>
    </div>
  );
};

export default OTPVerification;


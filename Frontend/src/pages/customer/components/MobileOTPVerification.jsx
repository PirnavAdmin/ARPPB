import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Phone,
  CheckCircle2,
  AlertCircle,
  Clock,
  X,
  Loader2,
} from 'lucide-react';
import {
  formatMaskedNumber,
  formatDisplayNumber,
  OTP_EXPIRY_SECONDS,
  RESEND_COOLDOWN_SECONDS,
} from '../data/customerOTPService';
import {
  sendCustomerMobileChangeOtp,
  verifyCustomerMobileChangeOtp,
} from '../../../services/profileService';

/**
 * MobileOTPVerification
 *
 * Reusable OTP verification modal for customer mobile number updates.
 * Connected to POST /api/customer/profile/mobile/send-otp and
 * POST /api/customer/profile/mobile/verify-otp via profileService.js.
 */
export function MobileOTPVerification({
  isOpen,
  onClose,
  newNumber,
  phoneNumber,
  initialDemoOtp = '',
  onSuccess,
}) {
  const targetNumber = String(newNumber || phoneNumber || '').replace(/\D/g, '');
  const [otpInput, setOtpInput] = useState('');
  const [expirySeconds, setExpirySeconds] = useState(OTP_EXPIRY_SECONDS);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [activeDemoOtp, setActiveDemoOtp] = useState(initialDemoOtp || '');
  const timerRef = useRef(null);
  const cooldownRef = useRef(null);
  const inputsRef = useRef([]);

  const digits = Array.from({ length: 6 }, (_, i) => otpInput[i] || '');

  // Live expiry countdown while modal is open
  useEffect(() => {
    if (!isOpen) return undefined;
    if (expirySeconds <= 0) return undefined;

    timerRef.current = setInterval(() => {
      setExpirySeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          timerRef.current = null;
          setFeedback({
            type: 'error',
            message: 'OTP has expired. Please request a new OTP.',
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
    };
  }, [isOpen, expirySeconds]);

  // Live resend cooldown countdown
  useEffect(() => {
    if (resendCooldown <= 0) return undefined;
    cooldownRef.current = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current);
      cooldownRef.current = null;
    };
  }, [resendCooldown]);

  // Focus first input when modal opens
  useEffect(() => {
    if (isOpen) {
      setOtpInput('');
      setFeedback(null);
      setActiveDemoOtp(initialDemoOtp || '');
      setExpirySeconds(OTP_EXPIRY_SECONDS);
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
    }
  }, [isOpen, targetNumber, initialDemoOtp]);

  const formatCountdown = useCallback((seconds) => {
    const safe = Math.max(0, Number(seconds) || 0);
    const mins = String(Math.floor(safe / 60)).padStart(2, '0');
    const secs = String(safe % 60).padStart(2, '0');
    return `${mins}:${secs}`;
  }, []);

  const handleDigitChange = (e, index) => {
    const char = e.target.value.slice(-1);
    if (char && !/^\d$/.test(char)) return;

    const next = [...digits];
    next[index] = char;
    setOtpInput(next.join(''));

    if (feedback) setFeedback(null);

    if (char && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        inputsRef.current[index - 1]?.focus();
        const next = [...digits];
        next[index - 1] = '';
        setOtpInput(next.join(''));
      } else {
        const next = [...digits];
        next[index] = '';
        setOtpInput(next.join(''));
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputsRef.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData('text/plain')
      .replace(/\D/g, '')
      .slice(0, 6);
    if (!pasted) return;

    setOtpInput(pasted);
    inputsRef.current[Math.min(pasted.length, 5)]?.focus();
    if (feedback) setFeedback(null);
  };

  const handleVerify = async () => {
    if (otpInput.length !== 6 || !/^\d{6}$/.test(otpInput)) {
      setFeedback({
        type: 'error',
        message: 'Please enter a valid 6-digit OTP.',
      });
      return;
    }

    setIsVerifying(true);
    setFeedback(null);

    try {
      const result = await verifyCustomerMobileChangeOtp(targetNumber, otpInput);
      clearInterval(timerRef.current);
      timerRef.current = null;
      setIsVerifying(false);
      setFeedback({
        type: 'success',
        message: result.message || 'Mobile number verified and updated successfully.',
      });

      setTimeout(() => {
        onSuccess(targetNumber, result.profileData);
      }, 600);
    } catch (err) {
      setIsVerifying(false);
      const errMsg = err?.message || 'Invalid or expired OTP code.';
      const lower = errMsg.toLowerCase();
      setFeedback({
        type: 'error',
        message: errMsg,
        errorType: lower.includes('maximum') || lower.includes('attempt')
          ? 'locked'
          : lower.includes('expired')
          ? 'expired'
          : 'incorrect',
      });
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || isResending) return;

    setIsResending(true);
    setFeedback(null);

    try {
      const res = await sendCustomerMobileChangeOtp(targetNumber);
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
      setExpirySeconds(OTP_EXPIRY_SECONDS);
      setOtpInput('');
      setActiveDemoOtp(res?.demoOtp || '');
      setIsResending(false);

      setFeedback({
        type: 'info',
        message:
          res?.message ||
          `New OTP sent to ${formatMaskedNumber(targetNumber)}.`,
      });
    } catch (err) {
      setIsResending(false);
      setFeedback({
        type: 'error',
        message: err?.message || 'Failed to resend OTP.',
      });
    }
  };

  const handleCancel = () => {
    onClose();
  };

  if (!isOpen) return null;

  const maskedNumber = formatMaskedNumber(targetNumber);
  const displayNumber = formatDisplayNumber(targetNumber);
  const isLocked = feedback?.errorType === 'locked';
  const isExpired = feedback?.errorType === 'expired';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="mobile-otp-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F172A]/50 backdrop-blur-xs overflow-y-auto"
    >
      <div className="relative w-full max-w-md bg-white rounded-2xl border border-[#E2E8F0] shadow-xl my-8 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-start justify-between gap-4 px-6 py-4 bg-[#CCFBF1]/40 border-b border-[#E2E8F0] shrink-0">
          <div>
            <h2 id="mobile-otp-modal-title" className="text-lg font-bold text-[#0F766E]">
              Verify Mobile Number
            </h2>
            <p className="text-xs text-[#64748B] mt-0.5">
              Enter the 6-digit OTP sent to{' '}
              <span className="font-mono font-bold text-[#0F172A]">{maskedNumber}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={handleCancel}
            aria-label="Close modal"
            className="p-1.5 rounded-lg text-[#64748B] hover:text-[#0F766E] hover:bg-[#CCFBF1] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 text-[#0F172A]">
          {/* Dev OTP banner when returned by backend in Development mode */}
          {activeDemoOtp && (
            <div className="mb-4 rounded-lg border border-[#14B8A6]/30 bg-[#CCFBF1]/20 p-3 text-xs flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-[#0F766E] font-semibold">Developer OTP:</span>
                <span className="font-mono font-bold text-[#0F766E] text-sm">
                  {activeDemoOtp}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setOtpInput(activeDemoOtp)}
                className="px-2.5 py-1 rounded-md bg-[#0F766E] text-white font-semibold text-[11px] cursor-pointer"
              >
                Auto-fill
              </button>
            </div>
          )}

          {/* Feedback messages */}
          {feedback && (
            <div
              className={`mb-4 rounded-lg p-3 text-xs font-medium ${
                feedback.type === 'success'
                  ? 'bg-[#DCFCE7] border border-[#16A34A]/20 text-[#16A34A]'
                  : feedback.type === 'info'
                    ? 'bg-[#CCFBF1] border border-[#14B8A6]/30 text-[#0F766E]'
                    : 'bg-[#FEE2E2] border border-[#DC2626]/20 text-[#DC2626]'
              }`}
            >
              <div className="flex items-start gap-2">
                {feedback.type === 'success' && (
                  <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                )}
                {feedback.type === 'error' && (
                  <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                )}
                {feedback.type === 'info' && (
                  <Clock className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                )}
                <span>{feedback.message}</span>
              </div>
            </div>
          )}

          {/* OTP input fields */}
          <div className="mb-6 flex items-center justify-between gap-1.5 sm:gap-2">
            {digits.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputsRef.current[index] = el)}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={digit}
                onChange={(e) => handleDigitChange(e, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                onPaste={handlePaste}
                disabled={isVerifying}
                aria-label={`OTP digit ${index + 1}`}
                autoComplete="one-time-code"
                className={`w-9 h-11 sm:w-11 sm:h-12 text-center text-base sm:text-lg font-bold rounded-xl border transition-all duration-150 outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/20 disabled:bg-slate-100 disabled:text-slate-400 cursor-not-allowed ${
                  digit
                    ? 'border-[#0F766E] bg-teal-50/20 text-[#0F766E]'
                    : 'border-[#DCE3EA] bg-white text-[#1F2937]'
                } ${isLocked || isExpired ? 'opacity-50' : ''}`}
              />
            ))}
          </div>

          {/* Status indicators */}
          <div className="flex items-center justify-between gap-3 mb-6 text-xs">
            <div className="flex items-center gap-1.5">
              <Phone className="w-4 h-4 text-[#0F766E]" />
              <span className="font-medium text-[#0F172A]">
                {displayNumber}
              </span>
            </div>
            {expirySeconds > 0 && !isLocked && !isExpired && (
              <div className="flex items-center gap-1 text-[#64748B]">
                <Clock className="w-3.5 h-3.5" />
                <span className="font-mono">{formatCountdown(expirySeconds)}</span>
              </div>
            )}
          </div>

          {isLocked && (
            <div className="mb-4 p-3 rounded-lg bg-[#FEE2E2] border border-[#DC2626]/20 text-xs text-[#DC2626]">
              <AlertCircle className="w-4 h-4 inline mr-2" />
              Maximum attempts reached. Please request a new OTP.
            </div>
          )}

          {isExpired && (
            <div className="mb-4 p-3 rounded-lg bg-[#FEE2E2] border border-[#DC2626]/20 text-xs text-[#DC2626]">
              <AlertCircle className="w-4 h-4 inline mr-2" />
              OTP has expired. Please request a new OTP.
            </div>
          )}
        </div>

        <div className="px-6 py-3.5 bg-[#F8FAFC] border-t border-[#E2E8F0] flex items-center justify-between gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleCancel}
            disabled={isVerifying}
            className="px-4 py-2 text-xs font-semibold rounded-xl border border-[#E2E8F0] bg-white text-[#0F172A] disabled:opacity-60 disabled:cursor-not-allowed hover:bg-[#F8FAFC] cursor-pointer transition-colors"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResend}
              disabled={resendCooldown > 0 || isVerifying || isLocked || isExpired}
              className={`text-xs font-semibold rounded-xl px-3 py-1.5 transition-colors cursor-pointer ${
                resendCooldown > 0
                  ? 'text-[#64748B] bg-[#F8FAFC] cursor-not-allowed'
                  : 'text-[#0F766E] hover:text-white hover:bg-[#0F766E]'
              }`}
            >
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP'}
            </button>

            <button
              type="button"
              onClick={handleVerify}
              disabled={
                otpInput.length !== 6 || isVerifying || isLocked || isExpired
              }
              className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
                otpInput.length === 6 && !isVerifying && !isLocked && !isExpired
                  ? 'bg-[#0F766E] text-white hover:bg-[#115E59]'
                  : 'border border-[#E2E8F0] bg-white text-[#64748B]'
              }`}
            >
              {isVerifying ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Verify OTP</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MobileOTPVerification;

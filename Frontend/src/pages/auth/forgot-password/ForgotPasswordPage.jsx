import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Phone, AlertTriangle, CheckCircle2, RotateCw, KeyRound, ShieldCheck, ArrowRight } from 'lucide-react';
import { AuthLayout } from '../../../components/auth/AuthLayout';
import { AuthInput } from '../../../components/auth/AuthInput';
import { AuthButton } from '../../../components/auth/AuthButton';
import { sendForgotPasswordOTP, verifyForgotPasswordOTP } from '../../../services/auth/authService';
import bgImage from '../../../assets/R&L_BG_Image.png';

/**
 * Premium Floating Card Forgot Password & OTP Verification Page
 * Styled over the full-viewport agricultural scenery background (R&L_BG_Image.png).
 * Handles the complete 2-step password recovery workflow:
 * Step 1: Phone input -> Send OTP
 * Step 2: 6-digit OTP input -> Verify OTP -> Navigates to Reset Password -> Redirects to Login
 */
export const ForgotPasswordPage = () => {
  const navigate = useNavigate();

  // Step state: 1 = phone request, 2 = OTP verification
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState(null);

  // OTP inputs (6 individual digits)
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef([]);

  // Timers and loading states
  const [timer, setTimer] = useState(60);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [errorNotice, setErrorNotice] = useState(null);
  const [successNotice, setSuccessNotice] = useState(null);

  const canResend = timer === 0;

  // Countdown timer when on step 2
  useEffect(() => {
    if (step !== 2 || timer <= 0) return;
    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [step, timer]);

  // Validate Indian 10-digit mobile number
  const validatePhone = (val) => {
    const clean = val.replace(/\D/g, '');
    if (!clean) return 'Mobile number is required';
    if (clean.length !== 10) return 'Mobile number must be exactly 10 digits';
    if (!/^[6-9]/.test(clean)) return 'Mobile number must start with 6, 7, 8, or 9';
    return null;
  };

  // STEP 1: Handle Send OTP
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setErrorNotice(null);
    setSuccessNotice(null);

    const err = validatePhone(phone);
    if (err) {
      setPhoneError(err);
      return;
    }

    setPhoneError(null);
    setIsSendingOtp(true);
    try {
      const response = await sendForgotPasswordOTP({ phone });
      setSuccessNotice(
        response.message || `A 6-digit verification code has been sent to +91 ${phone}.`
      );
      setStep(2);
      setTimer(60);
    } catch (apiErr) {
      setErrorNotice(apiErr.message || 'Failed to send OTP. Please check the number and try again.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Digit input change with auto-advance and paste support
  const handleDigitChange = (index, value) => {
    const cleanVal = value.replace(/\D/g, '');
    if (!cleanVal && value !== '') return;

    const newDigits = [...otpDigits];

    // Handle full paste
    if (cleanVal.length > 1) {
      const chars = cleanVal.slice(0, 6).split('');
      chars.forEach((c, i) => {
        if (i < 6) newDigits[i] = c;
      });
      setOtpDigits(newDigits);
      const nextIdx = Math.min(chars.length, 5);
      inputRefs.current[nextIdx]?.focus();
      return;
    }

    newDigits[index] = cleanVal;
    setOtpDigits(newDigits);
    setErrorNotice(null);

    // Auto advance to next box
    if (cleanVal && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;

    const newDigits = [...otpDigits];
    pasted.split('').forEach((ch, idx) => {
      if (idx < 6) newDigits[idx] = ch;
    });
    setOtpDigits(newDigits);
    const target = Math.min(pasted.length, 5);
    inputRefs.current[target]?.focus();
  };

  // STEP 2: Handle Verify OTP -> Navigate to Reset Password
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setErrorNotice(null);

    const fullOtp = otpDigits.join('');
    if (fullOtp.length !== 6) {
      setErrorNotice('Please enter the full 6-digit OTP code.');
      return;
    }

    setIsVerifyingOtp(true);
    try {
      const result = await verifyForgotPasswordOTP({ phone, otp: fullOtp });

      // Navigate to Reset Password page with verified session state
      navigate('/reset-password', {
        state: {
          phone,
          otp: fullOtp,
          verified: true,
          resetToken: result.resetToken || `auth-${Date.now()}`,
        },
      });
    } catch (apiErr) {
      setErrorNotice(apiErr.message || 'Invalid or expired OTP. Please try again.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // Resend OTP handler
  const handleResend = async () => {
    if (!canResend || isResending) return;

    setIsResending(true);
    setErrorNotice(null);
    try {
      await sendForgotPasswordOTP({ phone });
      setSuccessNotice('A new 6-digit OTP code has been dispatched.');
      setTimer(60);
      setOtpDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (apiErr) {
      setErrorNotice(apiErr.message || 'Could not resend OTP. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <AuthLayout
      title="Forgot Password?"
      subtitle={
        step === 1
          ? 'Enter your registered mobile number to receive an OTP.'
          : `Enter the 6-digit verification code sent to +91 ${phone}.`
      }
      backgroundImage={bgImage}
      containerWidth="max-w-[440px]"
    >
      {/* Success notification */}
      {successNotice && (
        <div className="mb-5 p-3.5 rounded-xl bg-teal-50 border border-teal-200 text-[#0F766E] text-xs flex items-start gap-2.5">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-[#16A34A]" />
          <span className="leading-relaxed font-medium">{successNotice}</span>
        </div>
      )}

      {/* Error alert */}
      {errorNotice && (
        <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-[#DC2626] text-xs flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong className="font-bold block mb-0.5">Verification Error</strong>
            <span>{errorNotice}</span>
          </div>
        </div>
      )}

      {/* STEP 1: ENTER PHONE NUMBER */}
      {step === 1 ? (
        <form onSubmit={handleSendOtp} className="space-y-4" noValidate>
          <AuthInput
            label="Registered Mobile Number"
            name="phone"
            type="tel"
            inputMode="numeric"
            maxLength={10}
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
              if (phoneError) setPhoneError(null);
            }}
            placeholder="10-digit registered number"
            required={true}
            icon={Phone}
            error={phoneError}
            helperText="We will send a 6-digit verification code to this mobile number"
            autoComplete="tel"
          />

          <div className="pt-2">
            <AuthButton
              type="submit"
              variant="primary"
              size="md"
              isLoading={isSendingOtp}
              loadingText="Sending OTP..."
              fullWidth={true}
            >
              Send OTP
            </AuthButton>
          </div>
        </form>
      ) : (
        /* STEP 2: ENTER & VERIFY OTP */
        <form onSubmit={handleVerifyOtp} className="space-y-5" noValidate>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold text-[#172B29]">
                Enter 6-Digit OTP Code
              </label>
              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setOtpDigits(['', '', '', '', '', '']);
                  setErrorNotice(null);
                }}
                className="text-[11px] font-semibold text-[#0F766E] hover:underline cursor-pointer"
              >
                Change Number
              </button>
            </div>

            {/* 6 Digit Inputs */}
            <div
              className="flex items-center justify-between gap-2 sm:gap-2.5"
              onPaste={handlePaste}
            >
              {otpDigits.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => (inputRefs.current[idx] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleDigitChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  autoFocus={idx === 0}
                  className={`
                    w-11 sm:w-12 h-12 sm:h-13 text-center text-lg sm:text-xl font-bold rounded-xl border transition-all duration-150
                    focus:outline-none text-[#172B29]
                    ${
                      errorNotice
                        ? 'border-[#DC2626] bg-red-50/20 focus:ring-2 focus:ring-[#DC2626]/20'
                        : digit
                        ? 'border-[#0F766E] bg-teal-50/20 focus:ring-2 focus:ring-[#14B8A6]/20'
                        : 'border-[#E2E8F0] bg-white hover:border-[#CBD5E1] focus:border-[#0F766E] focus:ring-2 focus:ring-[#14B8A6]/20'
                    }
                  `}
                />
              ))}
            </div>
          </div>

          {/* Resend Option and Timer */}
          <div className="flex items-center justify-between text-xs pt-0.5">
            <span className="text-[#64748B]">Didn't receive the OTP?</span>

            {canResend ? (
              <button
                type="button"
                onClick={handleResend}
                disabled={isResending}
                className="font-bold text-[#0F766E] hover:text-[#0d645e] hover:underline inline-flex items-center gap-1 cursor-pointer transition-colors"
              >
                <RotateCw className={`w-3.5 h-3.5 ${isResending ? 'animate-spin' : ''}`} />
                <span>{isResending ? 'Resending...' : 'Resend OTP'}</span>
              </button>
            ) : (
              <span className="text-[#64748B] font-medium">
                Resend in <strong className="font-bold text-[#0F766E]">{timer}s</strong>
              </span>
            )}
          </div>

          <div className="pt-2">
            <AuthButton
              type="submit"
              variant="primary"
              size="md"
              icon={KeyRound}
              isLoading={isVerifyingOtp}
              loadingText="Verifying OTP..."
              fullWidth={true}
            >
              Verify OTP
            </AuthButton>
          </div>
        </form>
      )}

      {/* Security note */}
      <div className="mt-5 p-3 rounded-xl bg-slate-50 border border-[#E2E8F0] flex items-center gap-2 text-xs text-[#64748B]">
        <ShieldCheck className="w-4 h-4 text-[#0F766E] flex-shrink-0" />
        <span>One-time passcodes expire after a short validity window for your security.</span>
      </div>

      {/* Explicit Return / Redirect to Login */}
      <div className="mt-5 pt-4 border-t border-[#E2E8F0] text-center text-xs text-[#64748B]">
        <span>Remembered your password? </span>
        <Link
          to="/login"
          className="font-bold text-[#0F766E] hover:text-[#0d645e] hover:underline transition-colors inline-flex items-center gap-1"
        >
          <span>Return to Sign In</span>
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </AuthLayout>
  );
};

export default ForgotPasswordPage;

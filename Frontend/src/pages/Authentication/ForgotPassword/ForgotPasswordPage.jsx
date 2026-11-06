import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Phone, AlertCircle, CheckCircle2, RotateCw, ArrowLeft, KeyRound } from 'lucide-react';
import { AuthLayout } from '../components/AuthLayout';
import { AuthHeader } from '../components/AuthHeader';
import { AuthInput } from '../components/AuthInput';
import { OTPInput } from '../components/OTPInput';
import { AuthButton } from '../components/AuthButton';
import { sendForgotPasswordOTP, verifyForgotPasswordOTP } from '../../../services/auth/authService';
import { validateIndianPhone, sanitizePhone } from '../../../utils/validation/phoneValidation';

export const ForgotPasswordPage = () => {
  const navigate = useNavigate();

  // Step 1: Request OTP by mobile number
  // Step 2: Enter 6-digit OTP to verify
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState(null);

  // OTP State
  const [otpCode, setOtpCode] = useState('');
  const [timer, setTimer] = useState(30);
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorNotice, setErrorNotice] = useState(null);
  const [successNotice, setSuccessNotice] = useState(null);

  // Countdown timer for resend
  useEffect(() => {
    if (step !== 2 || timer <= 0) return;
    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [step, timer]);

  const handlePhoneChange = (e) => {
    const cleaned = sanitizePhone(e.target.value);
    setPhone(cleaned);
    if (phoneError) setPhoneError(null);
    if (errorNotice) setErrorNotice(null);
  };

  // Step 1: Send OTP
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setErrorNotice(null);
    setSuccessNotice(null);

    const err = validateIndianPhone(phone);
    if (err) {
      setPhoneError(err);
      return;
    }

    setIsSending(true);
    try {
      const response = await sendForgotPasswordOTP({ phone });
      setSuccessNotice(response.message || `A 6-digit verification code has been sent to +91 ${phone}.`);
      setStep(2);
      setTimer(30);
    } catch (err) {
      setErrorNotice(err.message || 'Failed to send OTP. Please check the number and try again.');
    } finally {
      setIsSending(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (otpCode.length !== 6) {
      setErrorNotice('Please enter the complete 6-digit OTP code.');
      return;
    }

    setIsVerifying(true);
    setErrorNotice(null);

    try {
      const response = await verifyForgotPasswordOTP({ phone, otp: otpCode });
      setSuccessNotice(response.message || 'Verification successful! Redirecting to set a new password...');

      setTimeout(() => {
        navigate('/reset-password', {
          state: {
            phone,
            resetToken: response.resetToken || `mock-token-${Date.now()}`,
          },
        });
      }, 900);
    } catch (err) {
      setErrorNotice(err.message || 'Invalid or expired OTP code. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  // Resend OTP
  const handleResend = async () => {
    if (timer > 0 || isSending) return;
    setErrorNotice(null);
    setOtpCode('');
    setIsSending(true);

    try {
      const response = await sendForgotPasswordOTP({ phone });
      setSuccessNotice(response.message || `New verification code sent to +91 ${phone}.`);
      setTimer(30);
    } catch (err) {
      setErrorNotice(err.message || 'Failed to resend OTP.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <AuthLayout maxWidth="max-w-[480px]">
      <AuthHeader
        title={step === 1 ? 'Forgot Password?' : 'Enter Verification Code'}
        subtitle={
          step === 1
            ? 'Enter your registered contact number to receive a 6-digit reset code.'
            : `Enter the 6-digit code sent to +91 ${phone}`
        }
      />

      {/* Success Banner */}
      {successNotice && (
        <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-[#16A34A] text-xs flex items-center gap-2 font-medium animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{successNotice}</span>
        </div>
      )}

      {/* Error Banner */}
      {errorNotice && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-[#DC2626] text-xs flex items-center gap-2 font-medium animate-fadeIn">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorNotice}</span>
        </div>
      )}

      {/* STEP 1: Phone Request Form */}
      {step === 1 && (
        <form onSubmit={handleSendOtp} className="space-y-4">
          <AuthInput
            label="Contact Number"
            name="phone"
            type="tel"
            inputMode="numeric"
            maxLength={10}
            value={phone}
            onChange={handlePhoneChange}
            placeholder="Enter your registered mobile number"
            icon={Phone}
            required
            error={phoneError}
          />

          <div className="pt-2">
            <AuthButton
              type="submit"
              isLoading={isSending}
              disabled={isSending || phone.length !== 10}
              size="lg"
              icon={KeyRound}
            >
              Send Reset Code
            </AuthButton>
          </div>

          <div className="pt-2 text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0F766E] hover:text-[#115E59] hover:underline"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Login</span>
            </Link>
          </div>
        </form>
      )}

      {/* STEP 2: OTP Verification Form */}
      {step === 2 && (
        <form onSubmit={handleVerifyOtp} className="space-y-4">
          <div className="py-2">
            <OTPInput
              value={otpCode}
              onChange={(val) => {
                setOtpCode(val);
                if (errorNotice) setErrorNotice(null);
              }}
              disabled={isVerifying}
              hasError={Boolean(errorNotice)}
            />
          </div>

          <div className="flex items-center justify-between text-xs text-[#64748B]">
            <span>Didn&apos;t receive code?</span>
            {timer > 0 ? (
              <span>
                Resend in <span className="font-semibold text-[#0F766E]">{timer}s</span>
              </span>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                disabled={isSending}
                className="inline-flex items-center gap-1 font-semibold text-[#0F766E] hover:text-[#115E59] hover:underline cursor-pointer"
              >
                <RotateCw className={`w-3.5 h-3.5 ${isSending ? 'animate-spin' : ''}`} />
                <span>Resend OTP</span>
              </button>
            )}
          </div>

          <div className="pt-2">
            <AuthButton
              type="submit"
              isLoading={isVerifying}
              disabled={otpCode.length !== 6 || isVerifying}
              size="lg"
            >
              Verify &amp; Continue
            </AuthButton>
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <button
              type="button"
              onClick={() => {
                setStep(1);
                setOtpCode('');
                setErrorNotice(null);
              }}
              className="inline-flex items-center gap-1 text-[#64748B] hover:text-[#1F2937] hover:underline cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Change Number</span>
            </button>

            <Link
              to="/login"
              className="font-semibold text-[#0F766E] hover:text-[#115E59] hover:underline"
            >
              Back to Login
            </Link>
          </div>
        </form>
      )}
    </AuthLayout>
  );
};

export default ForgotPasswordPage;


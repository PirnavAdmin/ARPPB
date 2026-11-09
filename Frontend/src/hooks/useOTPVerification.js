import { useState, useEffect, useCallback } from 'react';
import { sendPhoneOTP, verifyPhoneOTP } from '../services/auth/otpService';

/**
 * Custom hook to manage frontend OTP request, countdown timer, and verification lifecycle.
 */
export const useOTPVerification = (defaultCooldown = 30) => {
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [timer, setTimer] = useState(defaultCooldown);
  const [statusMessage, setStatusMessage] = useState(null);
  const [error, setError] = useState(null);
  const [verifiedTarget, setVerifiedTarget] = useState(null);

  const canResend = isOtpSent && timer === 0;

  // Countdown timer effect
  useEffect(() => {
    if (!isOtpSent || timer <= 0 || isVerified) return;
    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isOtpSent, timer, isVerified]);

  // Request new OTP
  const requestOTP = useCallback(async (phone) => {
    setError(null);
    setStatusMessage(null);
    setIsSending(true);

    try {
      const response = await sendPhoneOTP(phone);
      setIsOtpSent(true);
      setTimer(response.cooldownSeconds || defaultCooldown);
      setStatusMessage(response.message);
      return response;
    } catch (err) {
      setError(err.message || 'Failed to send OTP.');
      throw err;
    } finally {
      setIsSending(false);
    }
  }, [defaultCooldown]);

  // Verify entered OTP
  const verifyOTP = useCallback(async (phone, otpCode) => {
    setError(null);
    setIsVerifying(true);

    try {
      const response = await verifyPhoneOTP(phone, otpCode);
      setIsVerified(true);
      setVerifiedTarget(phone);
      setStatusMessage('Phone Number Verified');
      return response;
    } catch (err) {
      setError(err.message || 'OTP verification failed.');
      throw err;
    } finally {
      setIsVerifying(false);
    }
  }, []);

  // Resend OTP
  const resendOTP = useCallback(async (phone) => {
    if (!canResend || isSending) return;
    return await requestOTP(phone);
  }, [canResend, isSending, requestOTP]);

  // Reset verification state (e.g., when the user changes their phone number)
  const resetVerification = useCallback(() => {
    setIsOtpSent(false);
    setIsSending(false);
    setIsVerifying(false);
    setIsVerified(false);
    setTimer(defaultCooldown);
    setStatusMessage(null);
    setError(null);
    setVerifiedTarget(null);
  }, [defaultCooldown]);

  return {
    isOtpSent,
    isSending,
    isVerifying,
    isVerified,
    timer,
    canResend,
    statusMessage,
    error,
    verifiedTarget,
    requestOTP,
    verifyOTP,
    resendOTP,
    resetVerification,
    setError,
    setStatusMessage,
  };
};

export default useOTPVerification;


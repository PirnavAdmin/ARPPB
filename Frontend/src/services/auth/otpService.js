/**
 * OTP Service for AgriConnect Registration
 * Connects mobile OTP generation and verification to the Backend API
 * using Endpoints.REGISTRATION.SEND_MOBILE_OTP and Endpoints.REGISTRATION.VERIFY_MOBILE_OTP.
 */

import Endpoints from '../../API/Endpoints';
import { DEMO_CONFIG } from '../../data/mock/authMockData';
import { postToBackend, parseBackendError } from './authService';

/**
 * Sends a registration OTP to a 10-digit Indian mobile number
 * via POST /api/v1/Registration/send-mobile-otp
 * @param {string} phone - 10-digit phone number
 */
export const sendPhoneOTP = async (phone) => {
  const cleanPhone = String(phone || '').replace(/\D/g, '');
  if (cleanPhone.length !== 10) {
    throw new Error(
      'Please enter a valid 10-digit mobile number before requesting an OTP.'
    );
  }

  try {
    const resData = await postToBackend(Endpoints.REGISTRATION.SEND_MOBILE_OTP, {
      mobile: cleanPhone,
    });

    const isSuccess = resData?.success ?? resData?.Success ?? true;
    if (!isSuccess) {
      throw new Error(
        resData?.message || resData?.Message || 'Failed to send OTP.'
      );
    }

    // In Development environment, the backend returns DevOtp formatted as "DEV-123456".
    // Extract the 6-digit numeric code for verification.
    const rawDevOtp = resData?.devOtp ?? resData?.DevOtp ?? null;
    const extractedOtp = rawDevOtp
      ? String(rawDevOtp).replace(/\D/g, '').slice(0, 6)
      : null;

    const baseMessage =
      resData?.message ||
      resData?.Message ||
      resData?.data ||
      'OTP generated successfully.';

    return {
      success: true,
      message: extractedOtp
        ? `${baseMessage} (OTP: ${extractedOtp})`
        : baseMessage,
      devOtp: extractedOtp,
      cooldownSeconds: DEMO_CONFIG.otpCooldownSeconds,
      target: cleanPhone,
      channel: 'phone',
    };
  } catch (error) {
    if (
      error?.response ||
      error?.isNetworkError ||
      error?.code === 'ERR_NETWORK'
    ) {
      throw parseBackendError(error, 'Failed to send OTP. Please try again.');
    }
    throw error;
  }
};

/**
 * Verifies the 6-digit registration mobile OTP
 * via POST /api/v1/Registration/verify-mobile-otp
 * @param {string} phone
 * @param {string} otp
 */
export const verifyPhoneOTP = async (phone, otp) => {
  const cleanPhone = String(phone || '').replace(/\D/g, '');
  const cleanOtp = String(otp || '').replace(/\D/g, '').trim();

  if (cleanOtp.length !== 6 || !/^\d{6}$/.test(cleanOtp)) {
    throw new Error('Please enter a complete 6-digit numeric OTP code.');
  }

  try {
    const resData = await postToBackend(
      Endpoints.REGISTRATION.VERIFY_MOBILE_OTP,
      {
        mobile: cleanPhone,
        otp: cleanOtp,
      }
    );

    const isSuccess = resData?.success ?? resData?.Success ?? true;
    if (!isSuccess) {
      throw new Error(
        resData?.message || resData?.Message || 'OTP verification failed.'
      );
    }

    return {
      success: true,
      verified: true,
      message:
        resData?.data ||
        resData?.message ||
        resData?.Message ||
        'Phone number verified successfully.',
      target: cleanPhone,
      channel: 'phone',
    };
  } catch (error) {
    if (
      error?.response ||
      error?.isNetworkError ||
      error?.code === 'ERR_NETWORK'
    ) {
      throw parseBackendError(error, 'OTP verification failed.');
    }
    throw error;
  }
};

export default {
  sendPhoneOTP,
  verifyPhoneOTP,
};

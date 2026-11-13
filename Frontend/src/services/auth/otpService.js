/**
 * OTP Service for AgriConnect
 * Connected to backend Registration OTP endpoints via src/API/Config.js and src/API/Endpoints.js
 */

import api from '../../API/Config';
import Endpoints from '../../API/Endpoints';
import { DEMO_CONFIG } from '../../data/mock/authMockData';

export const DUPLICATE_MOBILE_MESSAGE =
  'This mobile number is already registered. Please login with your existing account.';

/**
 * Checks whether a backend error/response indicates the mobile number is already registered.
 */
export const isDuplicateMobileMessage = (status, message = '', errors = []) => {
  const combined = [
    String(message || ''),
    ...(Array.isArray(errors) ? errors.map((e) => String(e || '')) : []),
  ]
    .join(' ')
    .toLowerCase();

  if (combined.includes('email') && !combined.includes('mobile') && !combined.includes('phone')) {
    return false;
  }

  if (
    /already\s*(registered|exists|in\s*use|taken)|duplicate\s*(mobile|phone|number|user|account)|mobile.*exists|phone.*exists|user\s*already\s*(registered|exists)/i.test(
      combined
    )
  ) {
    return true;
  }

  if (status === 409 && (combined.includes('mobile') || combined.includes('phone') || !combined)) {
    return true;
  }

  return false;
};

/**
 * Extracts a structured Error from an Axios error or failed ApiResponse<T>
 */
const parseOtpApiError = (error, fallbackMessage) => {
  if (error?.isDuplicateMobile) {
    return error;
  }

  const response = error?.response;
  const status = response?.status || error?.status;
  const data = response?.data || error?.data;

  let message = fallbackMessage;
  const rawErrors = [];

  if (data && typeof data === 'object') {
    if (Array.isArray(data.errors) && data.errors.length > 0) {
      rawErrors.push(...data.errors);
      message = data.errors[0] || data.message || fallbackMessage;
    } else if (data.errors && typeof data.errors === 'object') {
      const firstKey = Object.keys(data.errors)[0];
      const firstErr = Array.isArray(data.errors[firstKey])
        ? data.errors[firstKey][0]
        : data.errors[firstKey];
      if (firstErr) {
        rawErrors.push(String(firstErr));
        message = String(firstErr);
      }
    } else if (data.message || data.title || data.error) {
      message = data.message || data.title || data.error;
    }
  } else if (typeof data === 'string' && data.trim()) {
    message = data.trim();
  } else if (!response && error?.request) {
    message =
      'Unable to reach the authentication server. Please verify the backend API is running.';
  } else if (error?.message) {
    message = error.message;
  }

  const duplicate = isDuplicateMobileMessage(status, message, rawErrors);
  if (duplicate) {
    message = DUPLICATE_MOBILE_MESSAGE;
  }

  const normalizedError = new Error(message);
  normalizedError.status = status;
  normalizedError.data = data;
  normalizedError.isDuplicateMobile = duplicate;
  if (duplicate) {
    normalizedError.fieldErrors = { phone: DUPLICATE_MOBILE_MESSAGE };
  }
  return normalizedError;
};

/**
 * Extracts any demo/dev OTP returned by the backend response (e.g., devOtp: "DEV-203584")
 */
export const extractBackendDemoOtp = (body) => {
  const rawDevOtp =
    body?.devOtp ||
    body?.data?.devOtp ||
    body?.demoOtp ||
    body?.data?.demoOtp ||
    body?.otp ||
    body?.data?.otp ||
    null;

  if (!rawDevOtp || typeof rawDevOtp !== 'string') {
    return { rawDevOtp: null, demoOtp: null };
  }

  const trimmed = rawDevOtp.trim();
  const cleanDigits = trimmed.replace(/^DEV-/i, '').trim();
  return {
    rawDevOtp: trimmed,
    demoOtp: cleanDigits || trimmed,
  };
};

/**
 * Request a 6-digit registration OTP for a 10-digit mobile number
 * Endpoint: POST /api/v1/Registration/send-mobile-otp
 * @param {string} phone - 10-digit phone number
 */
export const sendPhoneOTP = async (phone) => {
  const cleanPhone = String(phone || '').replace(/\D/g, '');
  if (cleanPhone.length !== 10 || !/^[6-9]\d{9}$/.test(cleanPhone)) {
    throw new Error('Please enter a valid 10-digit mobile number before requesting an OTP.');
  }

  try {
    const response = await api.post(Endpoints.REGISTRATION.SEND_MOBILE_OTP, {
      mobile: cleanPhone,
    });

    const body = response.data;
    if (body && body.success === false) {
      const duplicate = isDuplicateMobileMessage(
        response.status,
        body.message,
        body.errors
      );
      const err = new Error(
        duplicate
          ? DUPLICATE_MOBILE_MESSAGE
          : body.message || 'Failed to send OTP to mobile number.'
      );
      err.status = response.status;
      err.data = body;
      err.isDuplicateMobile = duplicate;
      if (duplicate) {
        err.fieldErrors = { phone: DUPLICATE_MOBILE_MESSAGE };
      }
      throw err;
    }

    const { rawDevOtp, demoOtp } = extractBackendDemoOtp(body);

    const statusMessage = demoOtp
      ? body?.data || body?.message || 'OTP generated successfully. It expires in 5 minutes.'
      : 'OTP sent successfully to your registered mobile number.';

    return {
      success: true,
      message: statusMessage,
      demoOtp,
      rawDevOtp,
      cooldownSeconds: DEMO_CONFIG.otpCooldownSeconds || 30,
      target: cleanPhone,
      channel: 'phone',
      raw: body,
    };
  } catch (error) {
    throw parseOtpApiError(error, 'Failed to send OTP. Please try again.');
  }
};

/**
 * Verify the 6-digit registration mobile OTP
 * Endpoint: POST /api/v1/Registration/verify-mobile-otp
 * @param {string} phone - 10-digit phone number
 * @param {string} otp - 6-digit OTP code
 */
export const verifyPhoneOTP = async (phone, otp) => {
  const cleanPhone = String(phone || '').replace(/\D/g, '');
  const cleanOtp = String(otp || '')
    .trim()
    .replace(/^DEV-/i, '')
    .replace(/\D/g, '');

  if (cleanPhone.length !== 10) {
    throw new Error('Please enter a valid 10-digit mobile number.');
  }

  if (cleanOtp.length !== 6 || !/^\d{6}$/.test(cleanOtp)) {
    throw new Error('Please enter a complete 6-digit numeric OTP code.');
  }

  try {
    const response = await api.post(Endpoints.REGISTRATION.VERIFY_MOBILE_OTP, {
      mobile: cleanPhone,
      otp: cleanOtp,
    });

    const body = response.data;
    if (body && body.success === false) {
      const err = new Error(body.message || 'OTP verification failed.');
      err.status = response.status;
      err.data = body;
      throw err;
    }

    return {
      success: true,
      verified: true,
      message:
        (typeof body?.data === 'string' && body.data) ||
        body?.message ||
        'Phone number verified successfully.',
      target: cleanPhone,
      channel: 'phone',
      raw: body,
    };
  } catch (error) {
    throw parseOtpApiError(error, 'Invalid or expired OTP code. Please try again.');
  }
};

export default {
  sendPhoneOTP,
  verifyPhoneOTP,
  DUPLICATE_MOBILE_MESSAGE,
  isDuplicateMobileMessage,
  extractBackendDemoOtp,
};



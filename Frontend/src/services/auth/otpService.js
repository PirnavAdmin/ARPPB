/**
 * OTP Service for AgriConnect (Frontend Simulated Implementation)
 * Prepared for future backend SMS/email provider integration.
 */

import { DEMO_CONFIG } from '../../data/mock/authMockData';

/**
 * Simulates generating and sending an OTP to a phone number
 * @param {string} phone - 10-digit phone number
 */
export const sendPhoneOTP = async (phone) => {
  // Realistic simulated network latency (400ms)
  await new Promise((resolve) => setTimeout(resolve, 400));

  const cleanPhone = String(phone).replace(/\D/g, '');
  if (cleanPhone.length !== 10) {
    throw new Error('Please enter a valid 10-digit mobile number before requesting an OTP.');
  }

  return {
    success: true,
    message: DEMO_CONFIG.defaultOtpDemoNotice,
    cooldownSeconds: DEMO_CONFIG.otpCooldownSeconds,
    target: cleanPhone,
    channel: 'phone',
  };
};

/**
 * Simulates verifying a 6-digit phone OTP
 * @param {string} phone
 * @param {string} otp
 */
export const verifyPhoneOTP = async (phone, otp) => {
  await new Promise((resolve) => setTimeout(resolve, 450));

  const cleanOtp = String(otp || '').trim();
  if (cleanOtp.length !== 6 || !/^\d{6}$/.test(cleanOtp)) {
    throw new Error('Please enter a complete 6-digit numeric OTP code.');
  }

  return {
    success: true,
    verified: true,
    message: 'Phone number verified successfully.',
    target: phone,
    channel: 'phone',
  };
};

/**
 * Optional email OTP simulation
 * @param {string} email
 */
export const sendEmailOTP = async (email) => {
  await new Promise((resolve) => setTimeout(resolve, 400));
  return {
    success: true,
    message: 'Demo Email OTP generated. Enter the 6-digit code to continue.',
    cooldownSeconds: DEMO_CONFIG.otpCooldownSeconds,
    target: email,
    channel: 'email',
  };
};

/**
 * Optional email OTP verification
 * @param {string} email
 * @param {string} otp
 */
export const verifyEmailOTP = async (email, otp) => {
  await new Promise((resolve) => setTimeout(resolve, 450));
  const cleanOtp = String(otp || '').trim();
  if (cleanOtp.length !== 6 || !/^\d{6}$/.test(cleanOtp)) {
    throw new Error('Please enter a complete 6-digit numeric OTP code.');
  }
  return {
    success: true,
    verified: true,
    message: 'Email address verified successfully.',
    target: email,
    channel: 'email',
  };
};

export default {
  sendPhoneOTP,
  verifyPhoneOTP,
  sendEmailOTP,
  verifyEmailOTP,
};


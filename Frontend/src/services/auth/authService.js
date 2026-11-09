/**
 * AgriConnect ERP - Authentication Service Layer
 * Uses Contact Number as primary identifier for login.
 * Prepared for future backend API integration with standalone simulated fallback.
 */

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export const AUTH_ENDPOINTS = {
  REGISTER: `${API_BASE_URL}/auth/register`,
  LOGIN: `${API_BASE_URL}/auth/login`,
  SEND_FORGOT_OTP: `${API_BASE_URL}/auth/forgot-password/send-otp`,
  VERIFY_FORGOT_OTP: `${API_BASE_URL}/auth/forgot-password/verify-otp`,
  RESET_PASSWORD: `${API_BASE_URL}/auth/reset-password`,
};

/**
 * Fallback simulation for frontend-only testing when backend API is offline
 */
const handleFrontendFallback = async (endpoint, payload) => {
  await new Promise((resolve) => setTimeout(resolve, 450));

  if (endpoint.includes('/auth/register')) {
    return {
      success: true,
      message: 'Account created successfully.',
      user: {
        fullName: payload.fullName,
        role: payload.role,
        email: payload.email || null,
        phone: payload.phone,
      },
    };
  }

  if (endpoint.includes('/auth/login')) {
    return {
      success: true,
      message: 'Welcome back! Signed in successfully.',
      token: `demo-token-${Date.now()}`,
      user: {
        contactNumber: payload.contactNumber,
      },
    };
  }

  if (endpoint.includes('/auth/forgot-password/send-otp')) {
    return {
      success: true,
      message: `A 6-digit OTP has been sent to +91 ${payload.phone}.`,
    };
  }

  if (endpoint.includes('/auth/forgot-password/verify-otp')) {
    if (payload.otp && payload.otp.length === 6) {
      return {
        success: true,
        verified: true,
        message: 'OTP verified successfully.',
        resetToken: `reset-auth-${Date.now()}`,
      };
    }
    const err = new Error('Invalid OTP code. Please enter the correct 6-digit code.');
    err.status = 400;
    throw err;
  }

  if (endpoint.includes('/auth/reset-password')) {
    return {
      success: true,
      message: 'Password reset successfully. Please sign in with your new password.',
    };
  }

  return { success: true };
};

/**
 * Core HTTP Request Wrapper
 */
const apiRequest = async (url, options = {}) => {
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);

    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      const message =
        (typeof data === 'object' && data !== null && (data.message || data.error)) ||
        `Request failed with status ${response.status}`;
      const err = new Error(message);
      err.status = response.status;
      err.data = data;
      throw err;
    }

    return data;
  } catch (error) {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      if (import.meta.env.VITE_STRICT_API === 'true') {
        const netErr = new Error(
          'Unable to reach the authentication server. Please ensure the backend API is running.'
        );
        netErr.isNetworkError = true;
        throw netErr;
      }

      let parsedBody = {};
      if (options.body) {
        try {
          parsedBody = JSON.parse(options.body);
        } catch {
          parsedBody = {};
        }
      }
      return await handleFrontendFallback(url, parsedBody);
    }
    throw error;
  }
};

/**
 * Register a new user
 * @param {Object} data - { fullName, role, email, phone, password }
 */
export const register = async ({ fullName, role, email, phone, password }) => {
  const payload = {
    fullName: fullName.trim(),
    role: role.trim(),
    email: email && email.trim() ? email.trim().toLowerCase() : null,
    phone: String(phone).replace(/\D/g, ''),
    password,
  };

  return await apiRequest(AUTH_ENDPOINTS.REGISTER, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};

/**
 * Authenticate existing user with Contact Number only
 * @param {Object} credentials - { contactNumber, password, rememberMe }
 */
export const login = async ({ contactNumber, password, rememberMe }) => {
  const payload = {
    contactNumber: String(contactNumber).replace(/\D/g, ''),
    password,
    rememberMe: Boolean(rememberMe),
  };

  return await apiRequest(AUTH_ENDPOINTS.LOGIN, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};

/**
 * Step 1: Send OTP for password recovery
 * @param {Object} data - { phone }
 */
export const sendForgotPasswordOTP = async ({ phone }) => {
  const payload = {
    phone: String(phone).replace(/\D/g, ''),
  };

  return await apiRequest(AUTH_ENDPOINTS.SEND_FORGOT_OTP, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};

/**
 * Step 2: Verify received 6-digit OTP
 * @param {Object} data - { phone, otp }
 */
export const verifyForgotPasswordOTP = async ({ phone, otp }) => {
  const payload = {
    phone: String(phone).replace(/\D/g, ''),
    otp: String(otp).trim(),
  };

  return await apiRequest(AUTH_ENDPOINTS.VERIFY_FORGOT_OTP, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};

/**
 * Step 3: Set new password with verified OTP
 * @param {Object} data - { phone, otp, newPassword }
 */
export const resetPassword = async ({ phone, otp, newPassword }) => {
  const payload = {
    phone: String(phone).replace(/\D/g, ''),
    otp: String(otp).trim(),
    newPassword,
  };

  return await apiRequest(AUTH_ENDPOINTS.RESET_PASSWORD, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};

export default {
  register,
  login,
  sendForgotPasswordOTP,
  verifyForgotPasswordOTP,
  resetPassword,
};

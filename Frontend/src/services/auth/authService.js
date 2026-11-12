/**
 * AgriConnect ERP - Authentication & Role-Access Service Layer
 * Connected to backend Authentication, Registration, and RoleAccess APIs
 * via src/API/Config.js and src/API/Endpoints.js.
 */

import api from '../../API/Config';
import Endpoints from '../../API/Endpoints';
import {
  DUPLICATE_MOBILE_MESSAGE,
  isDuplicateMobileMessage,
  extractBackendDemoOtp,
} from './otpService';

/**
 * Maps frontend role labels ('Farmer', 'Customer', 'Middle Man', 'Vendor')
 * to the backend UserRole enum ('Farmer', 'Customer', 'Middleman', 'Vendor').
 */
export const mapRoleToBackend = (role) => {
  if (!role) return '';
  const cleaned = String(role)
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, '');
  if (cleaned === 'farmer' || cleaned === '1') return 'Farmer';
  if (cleaned === 'customer' || cleaned === '2') return 'Customer';
  if (cleaned === 'middleman' || cleaned === 'supplier' || cleaned === '3') {
    return 'Middleman';
  }
  if (cleaned === 'vendor' || cleaned === '4') return 'Vendor';
  return String(role).trim();
};

/**
 * Normalizes Axios / ASP.NET Core / FluentValidation / ApiResponse errors into a structured Error
 */
const parseAuthApiError = (error, fallbackMessage) => {
  if (error?.isNormalizedAuthError) {
    return error;
  }

  const response = error?.response;
  const status = response?.status || error?.status;
  const data = response?.data || error?.data;

  let message = fallbackMessage;
  const fieldErrors = {};
  const rawErrors = [];

  if (data && typeof data === 'object') {
    if (Array.isArray(data.errors) && data.errors.length > 0) {
      rawErrors.push(...data.errors);
      message = data.errors[0] || data.message || fallbackMessage;
    } else if (data.errors && typeof data.errors === 'object') {
      Object.entries(data.errors).forEach(([fieldKey, val]) => {
        const errMsg = Array.isArray(val) ? val[0] : String(val);
        if (!errMsg) return;
        rawErrors.push(errMsg);
        const lowerKey = fieldKey.toLowerCase();
        if (lowerKey.includes('fullname') || lowerKey.includes('name')) {
          fieldErrors.fullName = errMsg;
        } else if (lowerKey.includes('mobile') || lowerKey.includes('phone')) {
          fieldErrors.phone = errMsg;
          fieldErrors.contactNumber = errMsg;
        } else if (lowerKey.includes('identifier')) {
          fieldErrors.contactNumber = errMsg;
        } else if (lowerKey.includes('email')) {
          fieldErrors.email = errMsg;
        } else if (lowerKey.includes('role')) {
          fieldErrors.role = errMsg;
        } else if (lowerKey.includes('confirm')) {
          fieldErrors.confirmPassword = errMsg;
        } else if (lowerKey.includes('password')) {
          fieldErrors.password = errMsg;
          fieldErrors.newPassword = errMsg;
        }
      });
      const firstFieldErr = Object.values(fieldErrors)[0];
      message = firstFieldErr || data.message || data.title || fallbackMessage;
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

  const duplicateMobile = isDuplicateMobileMessage(status, message, rawErrors);
  if (duplicateMobile) {
    message = DUPLICATE_MOBILE_MESSAGE;
    fieldErrors.phone = DUPLICATE_MOBILE_MESSAGE;
  } else if (
    message.toLowerCase().includes('email') &&
    message.toLowerCase().includes('already registered')
  ) {
    fieldErrors.email = message;
  }

  const normalizedError = new Error(message);
  normalizedError.status = status;
  normalizedError.data = data;
  normalizedError.fieldErrors = fieldErrors;
  normalizedError.isDuplicateMobile = duplicateMobile;
  normalizedError.isNormalizedAuthError = true;
  return normalizedError;
};

/**
 * Register a new user
 * Endpoint: POST /api/v1/Registration
 * @param {Object} data - { fullName, role, email, phone, mobile, password, confirmPassword }
 */
export const register = async ({
  fullName,
  role,
  email,
  phone,
  mobile,
  password,
  confirmPassword,
}) => {
  const cleanMobile = String(mobile || phone || '').replace(/\D/g, '');
  const backendRole = mapRoleToBackend(role);

  const payload = {
    fullName: String(fullName || '').trim(),
    email: email && String(email).trim() ? String(email).trim().toLowerCase() : null,
    mobile: cleanMobile,
    role: backendRole,
    password,
    confirmPassword: confirmPassword ?? password,
  };

  try {
    const response = await api.post(Endpoints.REGISTRATION.REGISTER, payload);
    const body = response.data;

    if (body && body.success === false) {
      const duplicate = isDuplicateMobileMessage(
        response.status,
        body.message,
        body.errors
      );
      const err = new Error(
        duplicate ? DUPLICATE_MOBILE_MESSAGE : body.message || 'Registration failed.'
      );
      err.status = response.status;
      err.data = body;
      err.isDuplicateMobile = duplicate;
      err.fieldErrors = duplicate ? { phone: DUPLICATE_MOBILE_MESSAGE } : {};
      err.isNormalizedAuthError = true;
      throw err;
    }

    const userData = body?.data || body?.user || {};
    const normalizedUser = {
      userId: userData.userId ?? userData.id ?? null,
      fullName: userData.fullName || payload.fullName,
      email: userData.email ?? payload.email,
      mobile: userData.mobile || cleanMobile,
      contactNumber: userData.mobile || cleanMobile,
      phone: userData.mobile || cleanMobile,
      role: userData.role || backendRole,
      entityCode: userData.entityCode || null,
      createdAt: userData.createdAt || null,
    };

    return {
      success: true,
      message: body?.message || 'Account created successfully.',
      user: normalizedUser,
      data: normalizedUser,
      raw: body,
    };
  } catch (error) {
    throw parseAuthApiError(error, 'Registration failed. Please try again.');
  }
};

/**
 * Authenticate an existing user with mobile number (or email) and password
 * Endpoint: POST /api/v1/Auth/login
 * @param {Object} credentials - { contactNumber, identifier, password, rememberMe }
 */
export const login = async ({ contactNumber, identifier, password, rememberMe }) => {
  const rawIdentifier = identifier || contactNumber || '';
  const cleanIdentifier = String(rawIdentifier).includes('@')
    ? String(rawIdentifier).trim().toLowerCase()
    : String(rawIdentifier).replace(/\D/g, '');

  const payload = {
    identifier: cleanIdentifier,
    password,
  };

  try {
    const response = await api.post(Endpoints.AUTH.LOGIN, payload);
    const body = response.data;

    if (body && body.success === false) {
      const err = new Error(body.message || 'Invalid login credentials.');
      err.status = response.status;
      err.data = body;
      err.isNormalizedAuthError = true;
      throw err;
    }

    const userData = body?.data || body?.user || {};
    const accessToken =
      userData?.accessToken || body?.accessToken || body?.token || null;
    const tokenType = userData?.tokenType || body?.tokenType || 'Bearer';
    const expiresAt = userData?.expiresAt || body?.expiresAt || null;

    const normalizedUser = {
      userId: userData.userId ?? userData.id ?? null,
      fullName: userData.fullName || userData.userName || '',
      email: userData.email || null,
      mobile: userData.mobile || userData.contactNumber || cleanIdentifier,
      contactNumber: userData.mobile || userData.contactNumber || cleanIdentifier,
      phone: userData.mobile || userData.contactNumber || cleanIdentifier,
      role: userData.role || body?.role || null,
      entityCode: userData.entityCode || null,
      accessToken,
      tokenType,
      expiresAt,
    };

    return {
      success: true,
      message: body?.message || 'Login successful.',
      token: accessToken,
      accessToken,
      tokenType,
      expiresAt,
      rememberMe: Boolean(rememberMe),
      user: normalizedUser,
      data: normalizedUser,
      raw: body,
    };
  } catch (error) {
    throw parseAuthApiError(
      error,
      'Invalid login credentials. Please verify your contact number and password.'
    );
  }
};

/**
 * Step 1: Send OTP for password recovery
 * Endpoint: POST /api/v1/Auth/forgot-password
 * @param {Object} data - { phone, mobile, email }
 */
export const sendForgotPasswordOTP = async ({ phone, mobile, email }) => {
  const cleanMobile = String(mobile || phone || '').replace(/\D/g, '');
  const cleanEmail =
    email && String(email).trim() ? String(email).trim().toLowerCase() : null;

  const payload = cleanEmail ? { email: cleanEmail } : { mobile: cleanMobile };

  try {
    const response = await api.post(Endpoints.AUTH.FORGOT_PASSWORD, payload);
    const body = response.data;

    if (body && body.success === false) {
      const err = new Error(body.message || 'Failed to send password reset OTP.');
      err.status = response.status;
      err.data = body;
      err.isNormalizedAuthError = true;
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
      raw: body,
    };
  } catch (error) {
    throw parseAuthApiError(
      error,
      'Failed to send OTP. Please check the number and try again.'
    );
  }
};

/**
 * Step 2: Verify 6-digit password recovery OTP
 * Endpoint: POST /api/v1/Auth/verify-otp
 * @param {Object} data - { phone, mobile, email, otp }
 */
export const verifyForgotPasswordOTP = async ({ phone, mobile, email, otp }) => {
  const cleanMobile = String(mobile || phone || '').replace(/\D/g, '');
  const cleanEmail =
    email && String(email).trim() ? String(email).trim().toLowerCase() : null;
  const cleanOtp = String(otp || '')
    .trim()
    .replace(/^DEV-/i, '')
    .replace(/\D/g, '');

  const payload = cleanEmail
    ? { email: cleanEmail, otp: cleanOtp }
    : { mobile: cleanMobile, otp: cleanOtp };

  try {
    const response = await api.post(Endpoints.AUTH.VERIFY_OTP, payload);
    const body = response.data;

    if (body && body.success === false) {
      const err = new Error(body.message || 'Invalid or expired OTP code.');
      err.status = response.status;
      err.data = body;
      err.isNormalizedAuthError = true;
      throw err;
    }

    return {
      success: true,
      verified: true,
      message:
        (typeof body?.data === 'string' && body.data) ||
        body?.message ||
        'OTP verified successfully.',
      raw: body,
    };
  } catch (error) {
    throw parseAuthApiError(
      error,
      'Invalid or expired OTP code. Please try again.'
    );
  }
};

/**
 * Step 3: Reset password after OTP verification
 * Endpoint: POST /api/v1/Auth/reset-password
 * @param {Object} data - { phone, mobile, email, newPassword, confirmPassword }
 */
export const resetPassword = async ({
  phone,
  mobile,
  email,
  newPassword,
  confirmPassword,
}) => {
  const cleanMobile = String(mobile || phone || '').replace(/\D/g, '');
  const cleanEmail =
    email && String(email).trim() ? String(email).trim().toLowerCase() : null;

  const payload = {
    ...(cleanEmail ? { email: cleanEmail } : { mobile: cleanMobile }),
    newPassword,
    confirmPassword: confirmPassword ?? newPassword,
  };

  try {
    const response = await api.post(Endpoints.AUTH.RESET_PASSWORD, payload);
    const body = response.data;

    if (body && body.success === false) {
      const err = new Error(body.message || 'Failed to reset password.');
      err.status = response.status;
      err.data = body;
      err.isNormalizedAuthError = true;
      throw err;
    }

    return {
      success: true,
      message: body?.message || 'Password reset successfully.',
      raw: body,
    };
  } catch (error) {
    throw parseAuthApiError(
      error,
      'Failed to reset password. Please try again.'
    );
  }
};

/**
 * Verify current JWT token & retrieve authenticated user profile
 * Endpoint: GET /api/v1/role-access/profile
 */
export const fetchAuthenticatedProfile = async () => {
  try {
    const response = await api.get(Endpoints.ROLE_ACCESS.PROFILE);
    const body = response.data;
    return {
      success: Boolean(body?.success ?? true),
      userId: body?.userId ?? null,
      fullName: body?.userName || body?.fullName || '',
      mobile: body?.mobile || '',
      email: body?.email ?? null,
      role: body?.role || null,
      message: body?.message || 'Authenticated user access granted.',
      raw: body,
    };
  } catch (error) {
    throw parseAuthApiError(error, 'Unable to verify authenticated session.');
  }
};

/**
 * Verify role-specific portal authorization with the backend
 * Endpoints:
 * - GET /api/v1/role-access/farmer
 * - GET /api/v1/role-access/customer
 * - GET /api/v1/role-access/middleman
 * - GET /api/v1/role-access/vendor
 */
export const verifyRoleAccess = async (role) => {
  const normalized = String(role || '')
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, '');

  const roleEndpointMap = {
    farmer: Endpoints.ROLE_ACCESS.FARMER,
    customer: Endpoints.ROLE_ACCESS.CUSTOMER,
    middleman: Endpoints.ROLE_ACCESS.MIDDLEMAN,
    supplier: Endpoints.ROLE_ACCESS.MIDDLEMAN,
    vendor: Endpoints.ROLE_ACCESS.VENDOR,
  };

  const targetEndpoint = roleEndpointMap[normalized];
  if (!targetEndpoint) {
    const err = new Error(`Unrecognized portal role: ${role}`);
    err.status = 403;
    throw err;
  }

  try {
    const response = await api.get(targetEndpoint);
    const body = response.data;
    return {
      success: Boolean(body?.success ?? true),
      role: body?.role || role,
      userId: body?.userId ?? null,
      userName: body?.userName || '',
      message: body?.message || 'Role access granted.',
      raw: body,
    };
  } catch (error) {
    throw parseAuthApiError(error, 'Access denied for this portal role.');
  }
};

/**
 * Verify business access authorization with the backend
 * Endpoint: GET /api/v1/role-access/business-access
 */
export const verifyBusinessAccess = async () => {
  try {
    const response = await api.get(Endpoints.ROLE_ACCESS.BUSINESS_ACCESS);
    const body = response.data;
    return {
      success: Boolean(body?.success ?? true),
      userId: body?.userId ?? null,
      role: body?.role || null,
      message: body?.message || 'Business access granted.',
      raw: body,
    };
  } catch (error) {
    throw parseAuthApiError(error, 'Business access denied.');
  }
};

export default {
  register,
  login,
  sendForgotPasswordOTP,
  verifyForgotPasswordOTP,
  resetPassword,
  fetchAuthenticatedProfile,
  verifyRoleAccess,
  verifyBusinessAccess,
  mapRoleToBackend,
};


/**
 * AgriConnect ERP - Authentication Service Layer
 * Integrates Registration, Login, and Password Recovery with the Backend API
 * using the existing Axios instance (src/API/Config.js) and Endpoints (src/API/Endpoints.js).
 */

import api from '../../API/Config';
import Endpoints from '../../API/Endpoints';
import { normalizeRole, getDashboardPathByRole } from '../../context/AuthContext';

/**
 * Maps frontend registration role selection ('Farmer', 'Customer', 'Middle Man', 'Vendor')
 * to the backend UserRole enum ('Farmer', 'Customer', 'Supplier', 'Vendor').
 */
export const mapRoleToBackendRole = (rawRole) => {
  if (!rawRole) return '';
  const cleaned = String(rawRole)
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, '');
  if (cleaned === 'farmer') return 'Farmer';
  if (cleaned === 'customer') return 'Customer';
  if (cleaned === 'middleman' || cleaned === 'supplier') return 'Supplier';
  if (cleaned === 'vendor') return 'Vendor';
  return String(rawRole).trim();
};

/**
 * Maps backend validation field keys to frontend form field names.
 */
const FIELD_NAME_MAP = {
  fullname: 'fullName',
  email: 'email',
  mobile: 'phone',
  phone: 'phone',
  role: 'role',
  password: 'password',
  confirmpassword: 'confirmPassword',
  identifier: 'contactNumber',
  contactnumber: 'contactNumber',
};

/**
 * Extracts structured error messages and field-level validation errors from Axios/Backend responses.
 */
export const parseBackendError = (error, defaultMessage = 'Request failed. Please try again.') => {
  if (!error?.response) {
    const netErr = new Error(
      'Unable to connect to the server. Please check your internet connection or ensure the backend server is running.'
    );
    netErr.isNetworkError = true;
    return netErr;
  }

  const { status, data } = error.response;
  const fieldErrors = {};
  const errorMessages = [];

  if (data && typeof data === 'object') {
    // 1. ASP.NET Core ValidationProblemDetails: data.errors is an object { FieldName: ["msg1", ...] }
    if (data.errors && !Array.isArray(data.errors) && typeof data.errors === 'object') {
      Object.entries(data.errors).forEach(([rawKey, messages]) => {
        const mappedKey = FIELD_NAME_MAP[String(rawKey).toLowerCase()] || rawKey;
        const msgList = Array.isArray(messages) ? messages : [String(messages)];
        if (msgList.length > 0 && msgList[0]) {
          fieldErrors[mappedKey] = msgList[0];
          errorMessages.push(...msgList);
        }
      });
    }

    // 2. ApiResponse<T> errors list: data.errors is an array of strings
    if (Array.isArray(data.errors) && data.errors.length > 0) {
      errorMessages.push(...data.errors.filter(Boolean));
    }

    // 3. ApiResponse<T> message
    const primaryMessage = data.message || data.Message || data.detail || data.title;
    if (
      primaryMessage &&
      primaryMessage !== 'One or more validation errors occurred.'
    ) {
      errorMessages.unshift(primaryMessage);
    }

    // Map duplicate mobile or email conflict message to specific field error
    const combinedCheck = errorMessages.join(' ');
    if (/mobile number.*already registered/i.test(combinedCheck)) {
      fieldErrors.phone = errorMessages[0];
    } else if (/email address.*already registered/i.test(combinedCheck)) {
      fieldErrors.email = errorMessages[0];
    }
  } else if (typeof data === 'string' && data.trim()) {
    errorMessages.push(data.trim());
  }

  let finalMessage = errorMessages[0] || defaultMessage;
  if (!errorMessages.length) {
    if (status === 401) {
      finalMessage = 'Invalid login credentials. Please check your contact number and password.';
    } else if (status === 409) {
      finalMessage = 'An account with this mobile number or email address is already registered.';
    } else if (status === 429) {
      finalMessage = 'Too many failed login attempts. Your account is temporarily locked.';
    } else if (status >= 500) {
      finalMessage = 'A server error occurred while processing your request. Please try again later.';
    }
  }

  const parsedError = new Error(finalMessage);
  parsedError.status = status;
  parsedError.data = data;
  parsedError.fieldErrors = fieldErrors;
  return parsedError;
};

/**
 * Executes a POST request using the existing Axios instance from src/API/Config.js.
 * In Vite development mode, if the browser blocks a cross-origin preflight to ngrok
 * (because Kestrel has no CORS middleware on OPTIONS), it automatically falls back to
 * the local Vite `/api` proxy targeting the same backend URL.
 */
export const postToBackend = async (endpoint, payload) => {
  try {
    const response = await api.post(endpoint, payload);
    return response.data;
  } catch (error) {
    if (
      !error?.response &&
      error?.code === 'ERR_NETWORK' &&
      import.meta.env.DEV &&
      typeof endpoint === 'string' &&
      endpoint.startsWith('/api/')
    ) {
      const proxiedResponse = await api.post(endpoint, payload, { baseURL: '' });
      return proxiedResponse.data;
    }
    throw error;
  }
};

/**
 * Normalizes a backend user DTO (RegistrationResponseDto or LoginResponseDto)
 * into the frontend user session format without storing passwords.
 */
const formatBackendUser = (rawUser, fallbackMobile = '') => {
  if (!rawUser || typeof rawUser !== 'object') return null;

  const rawRole = rawUser.role ?? rawUser.Role ?? null;
  const normalizedRole = normalizeRole(rawRole);
  const mobile = String(
    rawUser.mobile ??
      rawUser.Mobile ??
      rawUser.contactNumber ??
      rawUser.phone ??
      fallbackMobile
  ).replace(/\D/g, '');

  return {
    userId: rawUser.userId ?? rawUser.UserId ?? rawUser.id ?? null,
    fullName: rawUser.fullName ?? rawUser.FullName ?? '',
    email: rawUser.email ?? rawUser.Email ?? null,
    mobile,
    contactNumber: mobile,
    phone: mobile,
    role: normalizedRole,
    backendRole: rawRole,
    entityCode: rawUser.entityCode ?? rawUser.EntityCode ?? null,
    createdAt: rawUser.createdAt ?? rawUser.CreatedAt ?? null,
  };
};

/**
 * Register a new user via POST /api/v1/Registration
 * Backend RegisterRequestDto: { fullName, email, mobile, role, password, confirmPassword }
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
  const cleanEmail =
    email && String(email).trim() ? String(email).trim().toLowerCase() : null;

  const payload = {
    fullName: String(fullName || '').trim(),
    email: cleanEmail,
    mobile: cleanMobile,
    role: mapRoleToBackendRole(role),
    password,
    confirmPassword: confirmPassword ?? password,
  };

  try {
    const resData = await postToBackend(Endpoints.REGISTRATION.REGISTER, payload);

    const isSuccess = resData?.success ?? resData?.Success ?? true;
    if (!isSuccess) {
      const failErr = new Error(
        resData?.message || resData?.Message || 'Registration failed. Please try again.'
      );
      failErr.data = resData;
      throw failErr;
    }

    const rawUser = resData?.data ?? resData?.Data ?? resData?.user ?? null;
    const formattedUser = formatBackendUser(rawUser, cleanMobile);
    const resolvedRole = formattedUser?.role || normalizeRole(resData?.role);

    if (!resolvedRole) {
      throw new Error(
        'Registration succeeded, but the user role was missing or unrecognized in the server response.'
      );
    }

    const finalUser = {
      ...(formattedUser || {
        fullName: payload.fullName,
        email: payload.email,
        mobile: cleanMobile,
        contactNumber: cleanMobile,
        phone: cleanMobile,
      }),
      role: resolvedRole,
    };

    return {
      success: true,
      message:
        resData?.message ||
        resData?.Message ||
        'Account created successfully!',
      data: rawUser,
      user: finalUser,
      role: resolvedRole,
      redirectPath: getDashboardPathByRole(resolvedRole),
    };
  } catch (error) {
    if (error?.response || error?.isNetworkError || error?.code === 'ERR_NETWORK') {
      throw parseBackendError(error, 'Registration failed. Please try again.');
    }
    throw error;
  }
};

/**
 * Authenticate an existing user via POST /api/v1/Auth/login
 * Backend LoginRequestDto: { identifier, password }
 */
export const login = async ({ contactNumber, identifier, password }) => {
  const rawIdentifier = String(identifier || contactNumber || '').trim();
  const cleanIdentifier = rawIdentifier.includes('@')
    ? rawIdentifier.toLowerCase()
    : rawIdentifier.replace(/\D/g, '');

  const payload = {
    identifier: cleanIdentifier,
    password,
  };

  try {
    const resData = await postToBackend(Endpoints.AUTH.LOGIN, payload);

    const isSuccess = resData?.success ?? resData?.Success ?? true;
    if (!isSuccess) {
      const failErr = new Error(
        resData?.message ||
          resData?.Message ||
          'Invalid login credentials. Please verify your contact number and password.'
      );
      failErr.data = resData;
      throw failErr;
    }

    const rawUser = resData?.data ?? resData?.Data ?? resData?.user ?? null;
    const formattedUser = formatBackendUser(rawUser, cleanIdentifier);
    const resolvedRole = formattedUser?.role || normalizeRole(resData?.role);

    if (!resolvedRole) {
      throw new Error(
        'Unable to determine your user role from the server response. Please contact support.'
      );
    }

    const finalUser = {
      ...(formattedUser || {
        mobile: cleanIdentifier,
        contactNumber: cleanIdentifier,
        phone: cleanIdentifier,
      }),
      role: resolvedRole,
    };

    const result = {
      success: true,
      message: resData?.message || resData?.Message || 'Login successful.',
      data: rawUser,
      user: finalUser,
      role: resolvedRole,
      redirectPath: getDashboardPathByRole(resolvedRole),
    };

    // Preserve token fields only if actually provided by the backend
    if (resData?.token || resData?.accessToken || rawUser?.accessToken) {
      result.token = resData.token || resData.accessToken || rawUser.accessToken;
    }

    return result;
  } catch (error) {
    if (error?.response || error?.isNetworkError || error?.code === 'ERR_NETWORK') {
      throw parseBackendError(
        error,
        'Invalid credentials. Please verify your contact number and password.'
      );
    }
    throw error;
  }
};

/**
 * Step 1: Send OTP for password recovery via POST /api/v1/Auth/forgot-password
 */
export const sendForgotPasswordOTP = async ({ phone, email }) => {
  const payload = {};
  if (email && String(email).trim()) {
    payload.email = String(email).trim().toLowerCase();
  } else {
    payload.mobile = String(phone || '').replace(/\D/g, '');
  }

  try {
    const resData = await postToBackend(Endpoints.AUTH.FORGOT_PASSWORD, payload);
    const rawDevOtp = resData?.devOtp || resData?.DevOtp || null;
    const sixDigitOtp = rawDevOtp
      ? String(rawDevOtp).replace(/\D/g, '').slice(0, 6)
      : null;

    return {
      success: true,
      message: sixDigitOtp
        ? `${resData?.message || 'OTP generated successfully.'} (OTP: ${sixDigitOtp})`
        : resData?.data || resData?.message || 'OTP sent successfully.',
      devOtp: sixDigitOtp,
    };
  } catch (error) {
    throw parseBackendError(error, 'Failed to send reset OTP.');
  }
};

/**
 * Step 2: Verify received 6-digit OTP via POST /api/v1/Auth/verify-otp
 */
export const verifyForgotPasswordOTP = async ({ phone, email, otp }) => {
  const cleanOtp = String(otp || '').replace(/\D/g, '').trim();
  const payload = {
    otp: cleanOtp,
  };
  if (email && String(email).trim()) {
    payload.email = String(email).trim().toLowerCase();
  } else {
    payload.mobile = String(phone || '').replace(/\D/g, '');
  }

  try {
    const resData = await postToBackend(Endpoints.AUTH.VERIFY_OTP, payload);
    return {
      success: true,
      verified: true,
      message: resData?.data || resData?.message || 'OTP verified successfully.',
      resetToken: cleanOtp,
    };
  } catch (error) {
    throw parseBackendError(error, 'Invalid or expired OTP code.');
  }
};

/**
 * Step 3: Reset password via POST /api/v1/Auth/reset-password
 */
export const resetPassword = async ({
  phone,
  email,
  newPassword,
  confirmPassword,
}) => {
  const payload = {
    newPassword,
    confirmPassword: confirmPassword ?? newPassword,
  };
  if (email && String(email).trim()) {
    payload.email = String(email).trim().toLowerCase();
  } else {
    payload.mobile = String(phone || '').replace(/\D/g, '');
  }

  try {
    const resData = await postToBackend(Endpoints.AUTH.RESET_PASSWORD, payload);
    return {
      success: true,
      message:
        resData?.data ||
        resData?.message ||
        'Password reset successfully. Please sign in with your new password.',
    };
  } catch (error) {
    throw parseBackendError(error, 'Failed to reset password.');
  }
};

export default {
  register,
  login,
  sendForgotPasswordOTP,
  verifyForgotPasswordOTP,
  resetPassword,
};

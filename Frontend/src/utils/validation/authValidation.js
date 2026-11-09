/**
 * Authentication Form Validation Utilities for AgriConnect
 */

import { validateIndianPhone } from './phoneValidation';

export const VALID_ROLES = ['Farmer', 'Vendor', 'Middle Man', 'Customer'];
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validates Full Name
 */
export const validateFullName = (name) => {
  if (!name || !String(name).trim()) {
    return 'Full name is required';
  }
  if (String(name).trim().length < 2) {
    return 'Full name must be at least 2 characters';
  }
  return null;
};

/**
 * Validates Role selection
 */
export const validateRole = (role) => {
  if (!role || !String(role).trim()) {
    return 'Please select your role';
  }
  if (!VALID_ROLES.includes(role)) {
    return 'Please select a valid role from the list';
  }
  return null;
};

/**
 * Validates Optional Email Address
 * If empty, returns null (valid). If provided, validates standard email format.
 */
export const validateOptionalEmail = (email) => {
  if (!email || !String(email).trim()) {
    return null; // Empty is valid since email is optional
  }
  const clean = String(email).trim();
  if (!EMAIL_REGEX.test(clean)) {
    return 'Please enter a valid email address';
  }
  return null;
};

/**
 * Validates Password criteria
 */
export const validatePassword = (password) => {
  if (!password) {
    return 'Password is required';
  }
  if (password.length < 8) {
    return 'Minimum 8 characters required';
  }
  if (!/[A-Z]/.test(password)) {
    return 'Include at least one uppercase letter';
  }
  if (!/[a-z]/.test(password)) {
    return 'Include at least one lowercase letter';
  }
  if (!/[0-9]/.test(password)) {
    return 'Include at least one number';
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return 'Include at least one special symbol';
  }
  return null;
};

/**
 * Validates Confirm Password matches Password
 */
export const validateConfirmPassword = (confirmPassword, password) => {
  if (!confirmPassword) {
    return 'Please confirm your password';
  }
  if (confirmPassword !== password) {
    return 'Passwords do not match';
  }
  return null;
};

/**
 * Validates Contact Number for Login
 */
export const validateContactNumber = (contact) => {
  if (!contact || !String(contact).trim()) {
    return 'Contact number is required';
  }
  return validateIndianPhone(contact);
};

/**
 * Validates entire registration form including phone OTP verification state
 */
export const validateRegistrationForm = (formData, isPhoneVerified = false) => {
  const errors = {};

  const nameErr = validateFullName(formData.fullName);
  if (nameErr) errors.fullName = nameErr;

  const roleErr = validateRole(formData.role);
  if (roleErr) errors.role = roleErr;

  const emailErr = validateOptionalEmail(formData.email);
  if (emailErr) errors.email = emailErr;

  const phoneErr = validateIndianPhone(formData.phone);
  if (phoneErr) {
    errors.phone = phoneErr;
  } else if (!isPhoneVerified) {
    errors.phone = 'Please verify your phone number via OTP';
  }

  const passErr = validatePassword(formData.password);
  if (passErr) errors.password = passErr;

  const confirmErr = validateConfirmPassword(formData.confirmPassword, formData.password);
  if (confirmErr) errors.confirmPassword = confirmErr;

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

export default {
  VALID_ROLES,
  validateFullName,
  validateRole,
  validateOptionalEmail,
  validatePassword,
  validateConfirmPassword,
  validateContactNumber,
  validateIndianPhone,
  validateRegistrationForm,
};

/**
 * Phone Number Validation Utility for AgriConnect
 * Strictly validates Indian 10-digit mobile numbers starting with 6, 7, 8, or 9.
 */

export const INDIAN_PHONE_REGEX = /^[6-9]\d{9}$/;

/**
 * Validates whether a given phone number is a valid 10-digit Indian mobile number
 * @param {string} phone
 * @returns {string|null} Error message or null if valid
 */
export const validateIndianPhone = (phone) => {
  if (!phone || !String(phone).trim()) {
    return 'Phone number is required';
  }
  const clean = String(phone).replace(/\D/g, '');
  if (clean.length === 0) {
    return 'Phone number is required';
  }
  if (clean.length !== 10) {
    return 'Phone number must be exactly 10 digits';
  }
  if (!/^[6-9]/.test(clean)) {
    return 'Mobile number must start with 6, 7, 8, or 9';
  }
  return null;
};

/**
 * Cleans phone string to only digits, max 10 characters
 */
export const sanitizePhone = (phone) => {
  return String(phone || '').replace(/\D/g, '').slice(0, 10);
};

export default {
  INDIAN_PHONE_REGEX,
  validateIndianPhone,
  sanitizePhone,
};


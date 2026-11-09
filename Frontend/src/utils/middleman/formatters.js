/**
 * Formatters for AgriConnect Middleman Portal
 * Consistent Indian Rupee formatting, dates, numbers, and weights.
 */

/**
 * Format number into Indian Rupee currency format (e.g., ₹1,25,000)
 * @param {number|string} amount
 * @param {boolean} includeDecimals
 * @returns {string}
 */
export const formatINR = (amount, includeDecimals = false) => {
  const num = Number(amount) || 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: includeDecimals ? 2 : 0,
    minimumFractionDigits: includeDecimals ? 2 : 0,
  }).format(num);
};

/**
 * Format standard number with Indian comma separators
 * @param {number|string} value
 * @returns {string}
 */
export const formatIndianNumber = (value) => {
  const num = Number(value) || 0;
  return new Intl.NumberFormat('en-IN').format(num);
};

/**
 * Format date into standard display format (e.g., "14 Oct 2026")
 * @param {string|Date} dateString
 * @param {boolean} includeTime
 * @returns {string}
 */
export const formatDate = (dateString, includeTime = false) => {
  if (!dateString) return '—';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return String(dateString);

  const options = {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...(includeTime ? { hour: '2-digit', minute: '2-digit', hour12: true } : {}),
  };

  return new Intl.DateTimeFormat('en-IN', options).format(date);
};

/**
 * Format quantity with its unit (e.g., "120 Quintals", "4,500 kg")
 * @param {number|string} quantity
 * @param {string} unit
 * @returns {string}
 */
export const formatQuantity = (quantity, unit = 'Quintal') => {
  const num = Number(quantity) || 0;
  return `${formatIndianNumber(num)} ${unit}`;
};

/**
 * Truncate text with ellipsis
 * @param {string} str
 * @param {number} maxLen
 * @returns {string}
 */
export const truncateText = (str, maxLen = 30) => {
  if (!str) return '';
  return str.length > maxLen ? `${str.slice(0, maxLen)}...` : str;
};


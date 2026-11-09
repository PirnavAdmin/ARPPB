/**
 * Indian Rupee (₹) Currency & Agricultural Quantity Formatting Utilities
 * Example output: ₹2,40,000.00
 */

const inrFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const inrCompactFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat('en-IN', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export function formatCurrency(amount, showDecimals = true) {
  const num = Number(amount);
  if (!Number.isFinite(num)) {
    return showDecimals ? '₹0.00' : '₹0';
  }
  return showDecimals ? inrFormatter.format(num) : inrCompactFormatter.format(num);
}

export function formatNumber(value, decimals = 2) {
  const num = Number(value);
  if (!Number.isFinite(num)) return '0';
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(num);
}

export function formatQuantity(quantity, unit = 'Quintal') {
  const num = Number(quantity);
  if (!Number.isFinite(num)) return `0 ${unit}`;
  return `${numberFormatter.format(num)} ${unit || ''}`.trim();
}

export function maskMobileNumber(mobile) {
  if (!mobile) return '—';
  const cleaned = String(mobile).replace(/\D/g, '');
  if (cleaned.length < 6) return mobile;
  const last4 = cleaned.slice(-4);
  const first2 = cleaned.slice(0, 2);
  return `+91 ${first2}••••${last4}`;
}

export function maskIdentifier(value, visibleEnd = 4) {
  if (!value) return '—';
  const str = String(value).trim();
  if (str.length <= visibleEnd) return str;
  const tail = str.slice(-visibleEnd);
  return `•••• •••• ${tail}`;
}

export const maskMobile = maskMobileNumber;
export const maskAccountNumber = maskIdentifier;

export default formatCurrency;

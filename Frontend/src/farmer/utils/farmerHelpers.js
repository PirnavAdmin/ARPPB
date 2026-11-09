// AgriConnect Farmer Portal Helpers & Utilities

export const formatCurrency = (value) => {
  if (value === null || value === undefined || value === '') return '₹0';
  const num = typeof value === 'string' ? parseFloat(value.replace(/[^0-9.-]+/g, '')) : value;
  if (isNaN(num)) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(num);
};

export const formatNumber = (value, decimals = 0) => {
  if (value === null || value === undefined || value === '') return '0';
  const num = typeof value === 'string' ? parseFloat(value.replace(/[^0-9.-]+/g, '')) : value;
  if (isNaN(num)) return '0';
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: decimals,
  }).format(num);
};

export const formatDate = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export const formatDateTime = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const indianPublicHolidays = new Set([
  '2025-01-26',
  '2025-02-15',
  '2025-03-31',
  '2025-08-15',
  '2025-09-05',
  '2025-10-02',
  '2025-10-21',
  '2025-11-01',
  '2025-12-25',
  '2026-01-26',
  '2026-02-15',
  '2026-03-20',
  '2026-08-15',
  '2026-09-05',
  '2026-10-02',
  '2026-11-14',
  '2026-12-25',
]);

export const getLocalDateKey = (date) => {
  const value = new Date(date);
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const calculateExpectedPaymentDate = (baseDate = new Date(), workingDays = 3) => {
  const result = new Date(baseDate);
  result.setHours(0, 0, 0, 0);

  let addedDays = 0;
  let cursor = new Date(result);

  while (addedDays < workingDays) {
    cursor.setDate(cursor.getDate() + 1);
    const dateKey = getLocalDateKey(cursor);
    const dayOfWeek = cursor.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isPublicHoliday = indianPublicHolidays.has(dateKey);

    if (!isWeekend && !isPublicHoliday) {
      addedDays++;
    }
  }

  return getLocalDateKey(cursor);
};

export const generateTransactionId = () => {
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `TXN-AGRI-${new Date().getFullYear()}-${rand}`;
};

export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const statusClassMap = {
  // Sales / Transactions
  'Confirmed': 'success',
  'Pending Confirmation': 'warning',
  'Awaiting OTP': 'warning',
  'Pending': 'warning',
  'Rejected': 'danger',
  'Expired': 'neutral',
  'Cancelled': 'danger',

  // Payments
  'Payment Expected': 'info',
  'Outstanding': 'warning',
  'Received': 'success',
  'Recorded': 'info',
  'Settled': 'success',
  'Delayed': 'danger',
  'Paid': 'success',

  // Stock / Crop health
  'Healthy': 'success',
  'High Demand': 'info',
  'Normal': 'success',
  'Low Stock': 'warning',
  'Out of Stock': 'danger',
  'Ready to Sell': 'success',
  'In Storage': 'neutral',
  'Processing': 'neutral',
  'Grade A': 'success',
  'Grade B': 'info',
  'Grade C': 'warning',
  'Verified': 'success',
};

export const buyerCategoryStyles = {
  'Middleman': { bg: '#EBF3FB', color: '#1B609E', border: '#BED8F4' },
  'Vendor': { bg: '#F3E8FF', color: '#6B21A8', border: '#D8B4FE' },
  'Customer': { bg: '#ECFDF5', color: '#047857', border: '#A7F3D0' },
};

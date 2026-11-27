/**
 * Middleman Payment Status Helpers & Financial Calculations
 * Single source of truth for payment status, badge styles, validation and previews.
 */

/**
 * Standardize payment status calculation
 * Business Rules:
 * - No successful payment -> 'Unpaid'
 * - Some amount paid, balance remains -> 'Partially Paid'
 * - Entire amount paid successfully -> 'Paid'
 * - Payment awaiting confirmation / draft -> 'Pending' (if explicitly passed)
 * - Payment failed -> 'Failed'
 * - Transaction cancelled -> 'Cancelled'
 * 
 * @param {number} totalAmount - Original transaction amount
 * @param {number} paidAmount - Total successful payments settled so far
 * @param {number} [outstandingAmount] - Optional explicit outstanding balance
 * @param {string} [rawStatus] - Optional raw status from entity or transaction
 * @returns {'Paid' | 'Partially Paid' | 'Unpaid' | 'Pending' | 'Failed' | 'Cancelled'}
 */
export function calculatePaymentStatus(totalAmount = 0, paidAmount = 0, outstandingAmount = null, rawStatus = '') {
  const raw = (rawStatus || '').toLowerCase().trim();
  if (raw === 'failed') return 'Failed';
  if (raw === 'cancelled' || raw === 'canceled') return 'Cancelled';

  const total = Number(totalAmount) || 0;
  const paid = Number(paidAmount) || 0;
  const outstanding = outstandingAmount !== null && outstandingAmount !== undefined
    ? Number(outstandingAmount)
    : Math.max(0, total - paid);

  if (total > 0 && outstanding <= 0.001) {
    return 'Paid';
  }
  if (paid > 0 && outstanding > 0.001) {
    return 'Partially Paid';
  }
  if (raw === 'pending' || raw === 'draft' || raw === 'pending confirmation') {
    return 'Pending';
  }
  return 'Unpaid';
}

/**
 * Get badge color classes for payment statuses
 * @param {string} status
 * @returns {string} Tailwind CSS classes
 */
export function getPaymentStatusBadgeClasses(status) {
  const s = (status || '').toLowerCase().trim();
  if (s === 'paid') {
    return 'bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold';
  }
  if (s === 'partially paid' || s === 'partial' || s === 'partiallypaid') {
    return 'bg-amber-50 text-amber-700 border border-amber-200 font-semibold';
  }
  if (s === 'unpaid') {
    return 'bg-rose-50 text-rose-700 border border-rose-200 font-semibold';
  }
  if (s === 'pending' || s === 'pending confirmation' || s === 'draft') {
    return 'bg-amber-50 text-amber-600 border border-amber-200 font-semibold';
  }
  if (s === 'failed') {
    return 'bg-red-50 text-red-700 border border-red-200 font-semibold';
  }
  if (s === 'cancelled' || s === 'canceled') {
    return 'bg-slate-100 text-slate-700 border border-slate-300 font-semibold';
  }
  return 'bg-slate-50 text-slate-700 border border-slate-200';
}

/**
 * Format currency in Indian Rupees format (₹)
 * @param {number|string} amount
 * @returns {string}
 */
export function formatCurrencyINR(amount) {
  const num = Number(amount) || 0;
  return `₹${num.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

/**
 * Calculate post-settlement projection
 * @param {number} originalAmount
 * @param {number} previouslyPaid
 * @param {number} newPaymentAmount
 * @returns {{ totalPaidAfter: number, remainingBalanceAfter: number, statusAfter: string, isValid: boolean, error: string|null }}
 */
export function calculateSettlementPreview(originalAmount = 0, previouslyPaid = 0, newPaymentAmount = 0) {
  const orig = Number(originalAmount) || 0;
  const prev = Number(previouslyPaid) || 0;
  const currentOutstanding = Math.max(0, orig - prev);
  const payment = Number(newPaymentAmount) || 0;

  if (payment <= 0) {
    return {
      totalPaidAfter: prev,
      remainingBalanceAfter: currentOutstanding,
      statusAfter: calculatePaymentStatus(orig, prev, currentOutstanding),
      isValid: false,
      error: 'Payment amount must be greater than zero.'
    };
  }

  if (payment > currentOutstanding) {
    return {
      totalPaidAfter: prev + payment,
      remainingBalanceAfter: 0,
      statusAfter: 'Paid',
      isValid: false,
      error: `Payment amount (${formatCurrencyINR(payment)}) cannot exceed current outstanding balance (${formatCurrencyINR(currentOutstanding)}).`
    };
  }

  const totalPaidAfter = prev + payment;
  const remainingBalanceAfter = Math.max(0, orig - totalPaidAfter);
  const statusAfter = calculatePaymentStatus(orig, totalPaidAfter, remainingBalanceAfter);

  return {
    totalPaidAfter,
    remainingBalanceAfter,
    statusAfter,
    isValid: true,
    error: null
  };
}

import dayjs from 'dayjs';

/**
 * Indian Date & Time Formatting Utilities
 * Uses DD/MM/YYYY and DD MMM YYYY Indian standard presentation.
 */

export function formatDate(dateInput, formatStr = 'DD MMM YYYY') {
  if (!dateInput) return '—';
  const parsed = dayjs(dateInput);
  if (!parsed.isValid()) return String(dateInput);
  return parsed.format(formatStr);
}

export function formatDateShort(dateInput) {
  return formatDate(dateInput, 'DD/MM/YYYY');
}

export function formatDateTime(dateInput) {
  if (!dateInput) return '—';
  const parsed = dayjs(dateInput);
  if (!parsed.isValid()) return String(dateInput);
  return parsed.format('DD MMM YYYY, hh:mm A');
}

export function getTodayISO() {
  return dayjs().format('YYYY-MM-DD');
}

export function addDaysISO(dateInput, days = 7) {
  const base = dateInput ? dayjs(dateInput) : dayjs();
  return base.add(days, 'day').format('YYYY-MM-DD');
}

/**
 * Checks whether a given date string falls within a selected preset or custom range.
 * Reference "now" defaults to the latest date in dataset or current date.
 */
export function isDateInRange(dateStr, preset = 'all', customStart = '', customEnd = '', referenceDate = null) {
  if (!preset || preset === 'all') return true;
  if (!dateStr) return false;

  const target = dayjs(dateStr).startOf('day');
  if (!target.isValid()) return true;

  const ref = referenceDate ? dayjs(referenceDate).startOf('day') : dayjs().startOf('day');

  switch (preset) {
    case 'today':
      return target.isSame(ref, 'day');
    case 'yesterday':
      return target.isSame(ref.subtract(1, 'day'), 'day');
    case 'last7': {
      const start = ref.subtract(6, 'day');
      return (target.isAfter(start) || target.isSame(start, 'day')) && (target.isBefore(ref) || target.isSame(ref, 'day'));
    }
    case 'last30': {
      const start = ref.subtract(29, 'day');
      return (target.isAfter(start) || target.isSame(start, 'day')) && (target.isBefore(ref) || target.isSame(ref, 'day'));
    }
    case 'thisMonth':
      return target.isSame(ref, 'month') && target.isSame(ref, 'year');
    case 'lastMonth': {
      const lastMonth = ref.subtract(1, 'month');
      return target.isSame(lastMonth, 'month') && target.isSame(lastMonth, 'year');
    }
    case 'custom': {
      if (!customStart && !customEnd) return true;
      const startOk = customStart ? !target.isBefore(dayjs(customStart).startOf('day')) : true;
      const endOk = customEnd ? !target.isAfter(dayjs(customEnd).endOf('day')) : true;
      return startOk && endOk;
    }
    default:
      return true;
  }
}

export default formatDate;


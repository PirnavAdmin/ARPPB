/**
 * Transaction & Entity ID Generator
 * Follows strict prefix conventions from the specification:
 * - FARM-0001
 * - MID-0001
 * - CUST-0001
 * - PUR-F-0001
 * - PUR-M-0001
 * - STK-0001
 * - PROC-0001
 * - PROD-0001
 * - PBAT-0001
 * - SALE-0001
 * - ORD-0001
 * - OTP-0001
 * - LDG-0001
 * - NTF-0001
 */

export function generateNextId(prefix, existingItems = [], idField = 'id', padLength = 4) {
  let maxNum = 0;

  existingItems.forEach((item) => {
    const val = String(item?.[idField] || '');
    if (val.startsWith(prefix)) {
      const numericPart = val.slice(prefix.length).replace(/\D/g, '');
      const parsed = parseInt(numericPart, 10);
      if (!Number.isNaN(parsed) && parsed > maxNum) {
        maxNum = parsed;
      }
    }
  });

  const nextNum = maxNum + 1;
  return `${prefix}${String(nextNum).padStart(padLength, '0')}`;
}

export function generateBatchNumber(prefix = 'BCH', cropOrProduct = 'AGRI', index = 1) {
  const code = String(cropOrProduct || 'AGRI')
    .replace(/[^a-zA-Z]/g, '')
    .toUpperCase()
    .slice(0, 3)
    .padEnd(3, 'X');
  const year = new Date().getFullYear();
  return `${prefix}-${code}-${year}-${String(index).padStart(3, '0')}`;
}

export default generateNextId;


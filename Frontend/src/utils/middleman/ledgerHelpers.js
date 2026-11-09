/**
 * Ledger Helpers for calculating balances and accounting entries
 */

/**
 * Recompute running balances for a list of ledger entries
 * Convention:
 * - Farmer Purchases: Credit to Farmer (Middleman owes Farmer, Payable increase)
 * - Vendor/Customer Sales: Debit to Buyer (Buyer owes Middleman, Receivable increase)
 * - Payments Made to Farmers: Debit to Farmer account (settlement)
 * - Receipts Received from Buyers: Credit to Buyer account (settlement)
 */
export const computeLedgerRunningBalances = (entries = []) => {
  let running = 0;
  return entries.map((entry) => {
    const debit = Number(entry.debit) || 0;
    const credit = Number(entry.credit) || 0;
    running = running + debit - credit;
    return {
      ...entry,
      runningBalance: running,
    };
  });
};


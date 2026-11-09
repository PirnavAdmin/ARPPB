import React, { useMemo } from 'react';
import {
  ShoppingCart,
  TrendingUp,
  Factory,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle2,
  AlertCircle,
  Award,
} from 'lucide-react';
import { useMiddleman } from '../../../context/middleman';
import { computeLedgerRunningBalances } from '../../../utils/middleman/ledgerHelpers';
import { formatCurrency } from '../../../utils/formatCurrency';
import SharedMyLedger from '../../../components/shared/ledger/MyLedger';

const MIDDLEMAN_SUB_LEDGER_TABS = [
  {
    id: 'All',
    label: 'All Journal Entries (Party-Wise Balances)',
  },
  {
    id: 'Payables',
    label: 'Farmer Payables Sub-Ledger (Producers)',
  },
  {
    id: 'Receivables',
    label: 'Buyer Receivables Sub-Ledger (Vendors & Customers)',
  },
];

export const LedgerPage = () => {
  const { ledger, settleLedgerEntry, dashboardMetrics } = useMiddleman();

  // Recompute running balances dynamically using existing Middleman ledger helper
  const balancedLedger = useMemo(() => {
    return computeLedgerRunningBalances(ledger).map((item) => ({
      ...item,
      id: item.ledgerId,
      category:
        item.partyCategory === 'Farmer'
          ? 'Farmer Purchase'
          : item.partyCategory === 'Vendor'
          ? 'Vendor Sale'
          : 'Customer Sale',
      subLedgerGroup:
        item.partyCategory === 'Farmer' ? 'Payables' : 'Receivables',
      balanceLabel:
        item.partyCategory === 'Farmer' ? 'Payable Due' : 'Receivable Due',
    }));
  }, [ledger]);

  // 8 Standardized Summary KPI Cards matching the common enterprise Ledger layout
  const summaryCards = useMemo(() => {
    const {
      totalPurchaseValue = 0,
      totalSalesValue = 0,
      totalCogs = 0,
      expectedPayables = 0,
      expectedReceivables = 0,
      amountReceived = 0,
      netOutstanding = 0,
      grossProfit = 0,
    } = dashboardMetrics || {};

    return [
      {
        title: '1. Total Purchases',
        value: formatCurrency(totalPurchaseValue),
        subtitle: 'Confirmed farmer procurement stock',
        icon: ShoppingCart,
      },
      {
        title: '2. Total Sales',
        value: formatCurrency(totalSalesValue),
        subtitle: 'Confirmed vendor & customer billing',
        icon: TrendingUp,
      },
      {
        title: '3. Cost of Goods Sold',
        value: formatCurrency(totalCogs),
        subtitle: 'FIFO allocated batch procurement cost',
        icon: Factory,
      },
      {
        title: '4. Total Payables',
        value: formatCurrency(expectedPayables),
        subtitle: 'Unsettled dues owed to Farmers',
        icon: ArrowUpRight,
      },
      {
        title: '5. Total Receivables',
        value: formatCurrency(expectedReceivables),
        subtitle: 'Pending dues from Vendors & Customers',
        icon: ArrowDownLeft,
      },
      {
        title: '6. Amount Received',
        value: formatCurrency(amountReceived),
        subtitle: 'Realized inward cash receipts',
        icon: CheckCircle2,
      },
      {
        title: '7. Net Position',
        value: formatCurrency(netOutstanding),
        subtitle: 'Receivables minus Payables balance',
        icon: AlertCircle,
      },
      {
        title: '8. Gross Profit',
        value: formatCurrency(grossProfit),
        subtitle: 'Net trading profit margin',
        icon: Award,
      },
    ];
  }, [dashboardMetrics]);

  const handleQuickSettle = (entry, amount) => {
    const id = entry.ledgerId || entry.id;
    if (!id || !amount || amount <= 0) return;
    settleLedgerEntry(id, amount);
  };

  return (
    <SharedMyLedger
      portal="middleman"
      title="My Financial Ledger & Account Statements"
      subtitle="Double-entry financial accounting across Farmer Payables, Vendor & Customer Receivables, and Cash Settlements"
      entries={balancedLedger}
      summaryCards={summaryCards}
      subLedgerTabs={MIDDLEMAN_SUB_LEDGER_TABS}
      ledgerCategories={['Farmer Purchase', 'Vendor Sale', 'Customer Sale']}
      partyCategories={['Farmer', 'Vendor', 'Customer']}
      statusOptions={['Paid', 'Pending', 'Partially Paid', 'Overdue']}
      showProcessingExpenses={false}
      canSettleRow={(row) => (row.outstandingAmount || 0) > 0}
      onQuickSettleRow={handleQuickSettle}
      exportFilePrefix="Middleman_Ledger"
    />
  );
};

export default LedgerPage;

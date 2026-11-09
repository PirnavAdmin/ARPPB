import { useState, useMemo } from 'react';
import {
  CreditCard,
  ArrowUpRight,
  ArrowDownLeft,
  ShoppingCart,
  TrendingUp,
  Factory,
  CheckCircle2,
  AlertCircle,
  Award,
} from 'lucide-react';
import { useVendor } from '../../../hooks/useVendor';
import { formatCurrency } from '../../../utils/formatCurrency';
import { LEDGER_CATEGORIES } from '../../../utils/constants';
import VendorModal from '../VendorModal';
import SharedMyLedger from '../../../components/shared/ledger/MyLedger';

const SUB_LEDGER_TABS = [
  {
    id: 'All',
    label: 'All Journal Entries (Party-Wise Balances)',
  },
  {
    id: 'Payables',
    label: 'Supplier Payables Sub-Ledger (Farmers & Middlemen)',
  },
  {
    id: 'Receivables',
    label: 'Customer Receivables Sub-Ledger (Buyers)',
  },
  {
    id: 'Expenses',
    label: 'Processing & Operating Expenses',
  },
];

export default function VendorLedger() {
  const {
    ledger,
    farmers,
    middlemen,
    customers,
    financialSummary,
    recordFinancialSettlement,
  } = useVendor();

  const [activeSubLedger, setActiveSubLedger] = useState('All');

  // Settlement Modal State
  const [isSettlementModalOpen, setIsSettlementModalOpen] = useState(false);
  const [settlementForm, setSettlementForm] = useState({
    settlementType: 'Supplier Payment',
    partyCategory: 'Farmer',
    partyId: '',
    partyName: '',
    referenceTransactionId: '',
    amount: '',
    paymentMode: 'NEFT / RTGS',
    notes: '',
    date: '2026-11-05',
  });

  // Compute accurate, domain-separated Running Balances chronologically
  const enrichedLedger = useMemo(() => {
    const chronological = [...ledger].sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.id.localeCompare(b.id);
    });

    const partyBalances = {};
    middlemen.forEach((m) => {
      partyBalances[m.id] = Number(m.openingBalance || 0);
    });
    customers.forEach((c) => {
      partyBalances[c.id] = Number(c.openingBalance || 0);
    });

    let payableSubLedgerRunning = middlemen.reduce(
      (s, m) => s + Number(m.openingBalance || 0),
      0
    );
    let receivableSubLedgerRunning = customers.reduce(
      (s, c) => s + Number(c.openingBalance || 0),
      0
    );
    let expenseSubLedgerRunning = 0;

    const computed = chronological.map((entry) => {
      const pId = entry.partyId || entry.partyName;
      const prevPartyBal = partyBalances[pId] || 0;
      const dr = Number(entry.debit || 0);
      const cr = Number(entry.credit || 0);

      let nextPartyBal = prevPartyBal;
      let balanceLabel = 'Party Bal';
      let subLedgerGroup = 'Expenses';

      if (
        entry.partyCategory === 'Farmer' ||
        entry.partyCategory === 'Middleman'
      ) {
        nextPartyBal = prevPartyBal + cr - dr;
        payableSubLedgerRunning += cr - dr;
        balanceLabel = 'Payable Due';
        subLedgerGroup = 'Payables';
      } else if (entry.partyCategory === 'Customer') {
        nextPartyBal = prevPartyBal + dr - cr;
        receivableSubLedgerRunning += dr - cr;
        balanceLabel = 'Receivable Due';
        subLedgerGroup = 'Receivables';
      } else {
        nextPartyBal = prevPartyBal + dr;
        expenseSubLedgerRunning += dr;
        balanceLabel = 'Cum. Expense';
        subLedgerGroup = 'Expenses';
      }

      partyBalances[pId] = nextPartyBal;

      return {
        ...entry,
        partyRunningBalance: nextPartyBal,
        payableSubLedgerRunning,
        receivableSubLedgerRunning,
        expenseSubLedgerRunning,
        balanceLabel,
        subLedgerGroup,
      };
    });

    return computed
      .reverse()
      .map((item) => {
        let displayRunningBalance = item.partyRunningBalance;
        let displayLabel = `${item.partyName.split(' ')[0]} ${item.balanceLabel}`;

        if (activeSubLedger === 'Payables') {
          displayRunningBalance = item.payableSubLedgerRunning;
          displayLabel = 'Total Payables Bal';
        } else if (activeSubLedger === 'Receivables') {
          displayRunningBalance = item.receivableSubLedgerRunning;
          displayLabel = 'Total Receivables Bal';
        } else if (activeSubLedger === 'Expenses') {
          displayRunningBalance = item.expenseSubLedgerRunning;
          displayLabel = 'Total Expense Bal';
        }

        return {
          ...item,
          runningBalance: displayRunningBalance,
          balanceLabel: displayLabel,
        };
      });
  }, [ledger, middlemen, customers, activeSubLedger]);

  // 8 Standardized Summary KPI Cards
  const summaryCards = useMemo(() => {
    const grossReceivables =
      customers.reduce((s, c) => s + Number(c.openingBalance || 0), 0) +
      (financialSummary.totalSalesRevenue || 0);

    return [
      {
        title: '1. Total Purchases',
        value: formatCurrency(financialSummary.totalPurchasesAmount || 0),
        subtitle: 'Confirmed farmer & middleman procurement',
        icon: ShoppingCart,
      },
      {
        title: '2. Total Sales',
        value: formatCurrency(financialSummary.totalSalesRevenue || 0),
        subtitle: 'Confirmed finished product invoices',
        icon: TrendingUp,
      },
      {
        title: '3. Processing Expenses',
        value: formatCurrency(financialSummary.totalProcessingExpenses || 0),
        subtitle: 'Labour, machine, electricity & packaging',
        icon: Factory,
      },
      {
        title: '4. Total Payables',
        value: formatCurrency(financialSummary.expectedPayables || 0),
        subtitle: 'Unsettled dues to Farmers & Middlemen',
        icon: ArrowUpRight,
      },
      {
        title: '5. Total Receivables',
        value: formatCurrency(grossReceivables),
        subtitle: 'Gross customer billing + opening dues',
        icon: ArrowDownLeft,
      },
      {
        title: '6. Amount Received',
        value: formatCurrency(financialSummary.customerReceiptsTotal || 0),
        subtitle: 'Realized collections from customers',
        icon: CheckCircle2,
      },
      {
        title: '7. Outstanding Amount',
        value: formatCurrency(financialSummary.expectedReceivables || 0),
        subtitle: 'Net pending customer receivables',
        icon: AlertCircle,
      },
      {
        title: '8. Estimated Profit',
        value: formatCurrency(financialSummary.estimatedProfit || 0),
        subtitle: 'Sales − Allocated Raw Mat − Processing Exp',
        icon: Award,
      },
    ];
  }, [financialSummary, customers]);

  const handleOpenQuickSettle = (entry) => {
    const isSupplier =
      entry.partyCategory === 'Farmer' || entry.partyCategory === 'Middleman';
    const defaultAmount = isSupplier ? entry.credit : entry.debit;
    setSettlementForm({
      settlementType: isSupplier ? 'Supplier Payment' : 'Customer Payment',
      partyCategory: entry.partyCategory,
      partyId: entry.partyId,
      partyName: entry.partyName,
      referenceTransactionId: entry.transactionId,
      amount: String(defaultAmount || ''),
      paymentMode: 'NEFT / RTGS',
      notes: `Settlement against ${entry.transactionId}`,
      date: '2026-11-05',
    });
    setIsSettlementModalOpen(true);
  };

  const handleOpenNewSettlementModal = (type = 'Supplier Payment') => {
    if (type === 'Supplier Payment') {
      const f = farmers[0];
      setSettlementForm({
        settlementType: 'Supplier Payment',
        partyCategory: 'Farmer',
        partyId: f?.id || '',
        partyName: f?.farmerName || '',
        referenceTransactionId: '',
        amount: '25000',
        paymentMode: 'NEFT / RTGS',
        notes: 'Part settlement of raw material procurement dues',
        date: '2026-11-05',
      });
    } else {
      const c = customers[0];
      setSettlementForm({
        settlementType: 'Customer Payment',
        partyCategory: 'Customer',
        partyId: c?.id || '',
        partyName: c?.customerName || '',
        referenceTransactionId: '',
        amount: '50000',
        paymentMode: 'NEFT / RTGS',
        notes: 'Customer invoice collection receipt',
        date: '2026-11-05',
      });
    }
    setIsSettlementModalOpen(true);
  };

  const handleSubmitSettlement = (e) => {
    e.preventDefault();
    const res = recordFinancialSettlement(settlementForm);
    if (res?.success) {
      setIsSettlementModalOpen(false);
    }
  };

  // Party options for settlement modal
  const settlementParties = useMemo(() => {
    if (settlementForm.partyCategory === 'Farmer') {
      return farmers.map((f) => ({ id: f.id, name: f.farmerName }));
    }
    if (settlementForm.partyCategory === 'Middleman') {
      return middlemen.map((m) => ({ id: m.id, name: m.businessName }));
    }
    return customers.map((c) => ({ id: c.id, name: c.customerName }));
  }, [settlementForm.partyCategory, farmers, middlemen, customers]);

  const canSettleVendorRow = (row) =>
    (row.status === 'Unpaid' || row.status === 'Partial') &&
    (row.category === 'Farmer Purchase' ||
      row.category === 'Middleman Purchase' ||
      row.category === 'Customer Sale');

  return (
    <SharedMyLedger
      portal="vendor"
      title="My Financial Ledger & Account Statements"
      subtitle="Double-entry financial accounting across Supplier Payables, Customer Receivables, Processing Expenses, and Settlements"
      entries={enrichedLedger}
      summaryCards={summaryCards}
      subLedgerTabs={SUB_LEDGER_TABS}
      activeSubLedger={activeSubLedger}
      onSubLedgerChange={setActiveSubLedger}
      ledgerCategories={LEDGER_CATEGORIES}
      partyCategories={['Farmer', 'Middleman', 'Customer', 'Processing Plant']}
      statusOptions={['Paid', 'Partial', 'Unpaid']}
      showProcessingExpenses={true}
      canSettleRow={canSettleVendorRow}
      onQuickSettleRow={handleOpenQuickSettle}
      exportFilePrefix="Vendor_Ledger"
      headerSettlementActions={
        <>
          <button
            type="button"
            onClick={() => handleOpenNewSettlementModal('Supplier Payment')}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg border border-brand-primary text-brand-primary hover:bg-brand-light/50 transition-colors cursor-pointer"
          >
            <ArrowUpRight className="w-4 h-4" />
            Pay Supplier
          </button>
          <button
            type="button"
            onClick={() => handleOpenNewSettlementModal('Customer Payment')}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg bg-brand-primary text-white hover:bg-brand-secondary transition-colors cursor-pointer"
          >
            <ArrowDownLeft className="w-4 h-4" />
            Record Customer Receipt
          </button>
        </>
      }
      customSettlementModal={
        <VendorModal
          isOpen={isSettlementModalOpen}
          onClose={() => setIsSettlementModalOpen(false)}
          title={`Record Financial Settlement – ${settlementForm.settlementType}`}
          subtitle="Post supplier payment or customer receipt directly to the Vendor Ledger"
          size="md"
        >
          <form onSubmit={handleSubmitSettlement} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-brand-text mb-1">
                  Settlement Type
                </label>
                <select
                  value={settlementForm.settlementType}
                  onChange={(e) => {
                    const isSup = e.target.value === 'Supplier Payment';
                    const defaultParty = isSup ? farmers[0] : customers[0];
                    setSettlementForm((p) => ({
                      ...p,
                      settlementType: e.target.value,
                      partyCategory: isSup ? 'Farmer' : 'Customer',
                      partyId: defaultParty?.id || '',
                      partyName: isSup
                        ? defaultParty?.farmerName || ''
                        : defaultParty?.customerName || '',
                    }));
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-brand-border bg-brand-surface text-brand-text"
                >
                  <option value="Supplier Payment">
                    Supplier Payment (Debit Payable)
                  </option>
                  <option value="Customer Payment">
                    Customer Receipt (Credit Receivable)
                  </option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-brand-text mb-1">
                  Party Category
                </label>
                <select
                  value={settlementForm.partyCategory}
                  onChange={(e) => {
                    const cat = e.target.value;
                    const first =
                      cat === 'Farmer'
                        ? farmers[0]
                        : cat === 'Middleman'
                        ? middlemen[0]
                        : customers[0];
                    setSettlementForm((p) => ({
                      ...p,
                      partyCategory: cat,
                      settlementType:
                        cat === 'Customer'
                          ? 'Customer Payment'
                          : 'Supplier Payment',
                      partyId: first?.id || '',
                      partyName:
                        cat === 'Farmer'
                          ? first?.farmerName
                          : cat === 'Middleman'
                          ? first?.businessName
                          : first?.customerName,
                    }));
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-brand-border bg-brand-surface text-brand-text"
                >
                  <option value="Farmer">Farmer</option>
                  <option value="Middleman">Middleman</option>
                  <option value="Customer">Customer</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-brand-text mb-1">
                  Select Party <span className="text-brand-error">*</span>
                </label>
                <select
                  value={settlementForm.partyId}
                  onChange={(e) => {
                    const found = settlementParties.find(
                      (x) => x.id === e.target.value
                    );
                    setSettlementForm((p) => ({
                      ...p,
                      partyId: e.target.value,
                      partyName: found?.name || '',
                    }));
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-brand-border bg-brand-surface text-brand-text"
                >
                  {settlementParties.map((pt) => (
                    <option key={pt.id} value={pt.id}>
                      {pt.name} ({pt.id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-brand-text mb-1">
                  Linked Invoice / Purchase ID (Optional)
                </label>
                <input
                  type="text"
                  value={settlementForm.referenceTransactionId}
                  onChange={(e) =>
                    setSettlementForm((p) => ({
                      ...p,
                      referenceTransactionId: e.target.value,
                    }))
                  }
                  placeholder="e.g., PUR-F-0001 or SALE-0001"
                  className="w-full px-3 py-2 rounded-lg border border-brand-border bg-brand-surface text-brand-text"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-brand-text mb-1">
                  Amount (₹) <span className="text-brand-error">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={settlementForm.amount}
                  onChange={(e) =>
                    setSettlementForm((p) => ({ ...p, amount: e.target.value }))
                  }
                  className="w-full px-3 py-2 rounded-lg border border-brand-border bg-brand-surface text-brand-text font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-brand-text mb-1">
                  Payment Mode
                </label>
                <select
                  value={settlementForm.paymentMode}
                  onChange={(e) =>
                    setSettlementForm((p) => ({
                      ...p,
                      paymentMode: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 rounded-lg border border-brand-border bg-brand-surface text-brand-text"
                >
                  <option value="NEFT / RTGS">NEFT / RTGS</option>
                  <option value="UPI / IMPS">UPI / IMPS</option>
                  <option value="Cheque / DD">Cheque / DD</option>
                  <option value="Cash">Cash</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-brand-text mb-1">
                  Settlement Date
                </label>
                <input
                  type="date"
                  value={settlementForm.date}
                  onChange={(e) =>
                    setSettlementForm((p) => ({ ...p, date: e.target.value }))
                  }
                  className="w-full px-3 py-2 rounded-lg border border-brand-border bg-brand-surface text-brand-text"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-brand-text mb-1">
                Bank UTR / Voucher Narration
              </label>
              <input
                type="text"
                value={settlementForm.notes}
                onChange={(e) =>
                  setSettlementForm((p) => ({ ...p, notes: e.target.value }))
                }
                placeholder="Enter UTR reference or narration..."
                className="w-full px-3 py-2 rounded-lg border border-brand-border bg-brand-surface text-brand-text"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-brand-border">
              <button
                type="button"
                onClick={() => setIsSettlementModalOpen(false)}
                className="px-4 py-2 rounded-lg border border-brand-border text-brand-text font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-primary text-white font-bold hover:bg-brand-secondary transition-colors cursor-pointer"
              >
                <CreditCard className="w-4 h-4" />
                Post Voucher to Ledger
              </button>
            </div>
          </form>
        </VendorModal>
      }
    />
  );
}

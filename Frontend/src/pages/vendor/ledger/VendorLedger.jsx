import { useState, useMemo } from 'react';
import {
  CreditCard,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
} from 'lucide-react';
import { useVendor } from '../../../hooks/useVendor';
import { useDebounce } from '../../../hooks/useDebounce';
import { usePagination } from '../../../hooks/usePagination';
import { formatCurrency } from '../../../utils/formatCurrency';
import { formatDate, isDateInRange } from '../../../utils/formatDate';
import { LEDGER_CATEGORIES } from '../../../utils/constants';
import { exportToCSV, printDocumentSummary } from '../../../utils/exportUtils';
import VendorPageHeader from '../VendorPageHeader';
import VendorSearch from '../VendorSearch';
import VendorFilters from '../VendorFilters';
import VendorPagination from '../VendorPagination';
import VendorModal from '../VendorModal';
import VendorExportMenu from '../VendorExportMenu';
import LedgerSummary from './LedgerSummary';
import LedgerTable from './LedgerTable';
import LedgerDetails from './LedgerDetails';

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
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 200);

  const [filters, setFilters] = useState({
    datePreset: 'All Time',
    category: 'All',
    partyCategory: 'All',
    partyName: 'All',
    entrySide: 'All', // All | Debit | Credit
    status: 'All',
  });

  const [selectedVoucherId, setSelectedVoucherId] = useState(null);

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
  // Suppliers (Farmer/Middleman): Payable = Opening + Credit (Purchases) - Debit (Supplier Payments)
  // Customers: Receivable = Opening + Debit (Sales) - Credit (Customer Payments/Reversals)
  // Processing Plant: Cumulative Operating Expense = Debit
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
        // Payable convention: Cr increases payable, Dr decreases payable
        nextPartyBal = prevPartyBal + cr - dr;
        payableSubLedgerRunning += cr - dr;
        balanceLabel = 'Payable Due';
        subLedgerGroup = 'Payables';
      } else if (entry.partyCategory === 'Customer') {
        // Receivable convention: Dr increases receivable, Cr decreases receivable
        nextPartyBal = prevPartyBal + dr - cr;
        receivableSubLedgerRunning += dr - cr;
        balanceLabel = 'Receivable Due';
        subLedgerGroup = 'Receivables';
      } else {
        // Operating / Processing expense
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

    // Return newest first for ERP display, with contextual runningBalance based on active sub-ledger
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

  // Unique party names for filter
  const uniqueParties = useMemo(() => {
    const names = Array.from(new Set(ledger.map((l) => l.partyName).filter(Boolean)));
    return names.sort();
  }, [ledger]);

  // Filtered Entries
  const filteredEntries = useMemo(() => {
    return enrichedLedger.filter((entry) => {
      if (activeSubLedger !== 'All' && entry.subLedgerGroup !== activeSubLedger) {
        return false;
      }

      if (debouncedSearch) {
        const q = debouncedSearch.toLowerCase();
        const match = [
          entry.id,
          entry.transactionId,
          entry.description,
          entry.partyName,
          entry.category,
        ]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(q));
        if (!match) return false;
      }

      if (
        filters.datePreset !== 'All Time' &&
        !isDateInRange(entry.date, filters.datePreset, '', '', '2026-11-05')
      ) {
        return false;
      }

      if (filters.category !== 'All' && entry.category !== filters.category) {
        return false;
      }

      if (
        filters.partyCategory !== 'All' &&
        entry.partyCategory !== filters.partyCategory
      ) {
        return false;
      }

      if (filters.partyName !== 'All' && entry.partyName !== filters.partyName) {
        return false;
      }

      if (filters.entrySide === 'Debit' && !(entry.debit > 0)) {
        return false;
      }
      if (filters.entrySide === 'Credit' && !(entry.credit > 0)) {
        return false;
      }

      if (filters.status !== 'All' && entry.status !== filters.status) {
        return false;
      }

      return true;
    });
  }, [enrichedLedger, activeSubLedger, debouncedSearch, filters]);

  const pagination = usePagination(filteredEntries, 10);

  // Date-wise totals for currently filtered entries
  const dateWiseTotals = useMemo(() => {
    const map = {};
    filteredEntries.forEach((e) => {
      if (!map[e.date]) {
        map[e.date] = {
          date: e.date,
          count: 0,
          totalDebit: 0,
          totalCredit: 0,
          totalProcExp: 0,
        };
      }
      map[e.date].count += 1;
      map[e.date].totalDebit += Number(e.debit || 0);
      map[e.date].totalCredit += Number(e.credit || 0);
      map[e.date].totalProcExp += Number(e.processingExpenses || 0);
    });
    return Object.values(map)
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 6);
  }, [filteredEntries]);

  const selectedVoucher = useMemo(
    () => enrichedLedger.find((e) => e.id === selectedVoucherId) || null,
    [enrichedLedger, selectedVoucherId]
  );

  // 8 Summary Card Values mapped from financialSummary
  const summaryCardProps = useMemo(() => {
    const grossReceivables =
      customers.reduce((s, c) => s + Number(c.openingBalance || 0), 0) +
      (financialSummary.totalSalesRevenue || 0);

    return {
      totalPurchases: financialSummary.totalPurchasesAmount,
      totalSales: financialSummary.totalSalesRevenue,
      processingExpenses: financialSummary.totalProcessingExpenses,
      totalPayables: financialSummary.expectedPayables,
      totalReceivables: grossReceivables,
      amountReceived: financialSummary.customerReceiptsTotal,
      outstandingAmount: financialSummary.expectedReceivables,
      estimatedProfit: financialSummary.estimatedProfit,
    };
  }, [financialSummary, customers]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    pagination.goToPage(1);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setActiveSubLedger('All');
    setFilters({
      datePreset: 'All Time',
      category: 'All',
      partyCategory: 'All',
      partyName: 'All',
      entrySide: 'All',
      status: 'All',
    });
    pagination.goToPage(1);
  };

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

  const handleExportCSV = () => {
    exportToCSV(
      filteredEntries,
      [
        { key: 'date', label: 'Date' },
        { key: 'id', label: 'Voucher ID' },
        { key: 'transactionId', label: 'Transaction ID' },
        { key: 'category', label: 'Ledger Category' },
        { key: 'description', label: 'Description' },
        { key: 'partyName', label: 'Party Name' },
        { key: 'partyCategory', label: 'Party Category' },
        { key: 'debit', label: 'Debit (INR)' },
        { key: 'credit', label: 'Credit (INR)' },
        { key: 'processingExpenses', label: 'Processing Expenses (INR)' },
        { key: 'runningBalance', label: 'Running Balance (INR)' },
        { key: 'expectedPaymentDate', label: 'Expected Payment Date' },
        { key: 'status', label: 'Status' },
      ],
      `Vendor_Ledger_${activeSubLedger}`
    );
  };

  const handlePrintLedger = () => {
    printDocumentSummary({
      title: `Vendor Financial Ledger Statement (${activeSubLedger})`,
      subtitle: `Total Entries: ${filteredEntries.length} | Generated on 05 Nov 2026`,
      metadata: [
        {
          label: 'Total Confirmed Purchases',
          value: formatCurrency(summaryCardProps.totalPurchases),
        },
        {
          label: 'Total Confirmed Sales',
          value: formatCurrency(summaryCardProps.totalSales),
        },
        {
          label: 'Total Processing Expenses',
          value: formatCurrency(summaryCardProps.processingExpenses),
        },
        {
          label: 'Outstanding Supplier Payables',
          value: formatCurrency(summaryCardProps.totalPayables),
        },
        {
          label: 'Outstanding Customer Receivables',
          value: formatCurrency(summaryCardProps.outstandingAmount),
        },
        {
          label: 'Estimated Net Profit',
          value: formatCurrency(summaryCardProps.estimatedProfit),
        },
      ],
      items: filteredEntries.map((e) => ({
        Date: formatDate(e.date),
        'Txn ID': e.transactionId,
        Category: e.category,
        Party: `${e.partyName} (${e.partyCategory})`,
        'Debit (Dr)': formatCurrency(e.debit || 0),
        'Credit (Cr)': formatCurrency(e.credit || 0),
        'Running Bal': `${formatCurrency(Math.abs(e.runningBalance || 0))} (${e.balanceLabel})`,
        Status: e.status,
      })),
    });
  };

  const filterConfig = [
    {
      key: 'datePreset',
      label: 'Date Range',
      value: filters.datePreset,
      options: [
        { label: 'All Time', value: 'All Time' },
        { label: 'Today', value: 'Today' },
        { label: 'Yesterday', value: 'Yesterday' },
        { label: 'Last 7 Days', value: 'Last 7 Days' },
        { label: 'This Month', value: 'This Month' },
        { label: 'Last Month', value: 'Last Month' },
      ],
    },
    {
      key: 'category',
      label: 'Transaction Type',
      value: filters.category,
      options: [
        { label: 'All Ledger Categories', value: 'All' },
        ...LEDGER_CATEGORIES.map((c) => ({ label: c, value: c })),
      ],
    },
    {
      key: 'partyCategory',
      label: 'Party Category',
      value: filters.partyCategory,
      options: [
        { label: 'All Party Categories', value: 'All' },
        { label: 'Farmer', value: 'Farmer' },
        { label: 'Middleman', value: 'Middleman' },
        { label: 'Customer', value: 'Customer' },
        { label: 'Processing Plant', value: 'Processing Plant' },
      ],
    },
    {
      key: 'partyName',
      label: 'Party Name',
      value: filters.partyName,
      options: [
        { label: 'All Parties', value: 'All' },
        ...uniqueParties.map((p) => ({ label: p, value: p })),
      ],
    },
    {
      key: 'entrySide',
      label: 'Debit / Credit',
      value: filters.entrySide,
      options: [
        { label: 'Both Debit & Credit', value: 'All' },
        { label: 'Debit Entries Only (Dr)', value: 'Debit' },
        { label: 'Credit Entries Only (Cr)', value: 'Credit' },
      ],
    },
    {
      key: 'status',
      label: 'Payment Status',
      value: filters.status,
      options: [
        { label: 'All Statuses', value: 'All' },
        { label: 'Paid', value: 'Paid' },
        { label: 'Partial', value: 'Partial' },
        { label: 'Unpaid', value: 'Unpaid' },
      ],
    },
  ];

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

  return (
    <div className="space-y-6">
      <VendorPageHeader
        title="My Financial Ledger & Account Statements"
        subtitle="Double-entry financial accounting across Supplier Payables, Customer Receivables, Processing Expenses, and Settlements"
        badge={`${filteredEntries.length} Vouchers`}
        actions={
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
            <VendorExportMenu
              onExportCSV={handleExportCSV}
              onPrint={handlePrintLedger}
              label="Download / Print Statement"
            />
          </>
        }
      />

      {/* 8 Summary Cards */}
      <LedgerSummary summary={summaryCardProps} />

      {/* Sub-Ledger Separation Tabs */}
      <div className="bg-brand-surface border border-brand-border rounded-xl p-2 flex flex-wrap items-center gap-2 shadow-xs">
        {SUB_LEDGER_TABS.map((tab) => {
          const active = activeSubLedger === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveSubLedger(tab.id);
                pagination.goToPage(1);
              }}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                active
                  ? 'bg-brand-primary text-white shadow-xs'
                  : 'text-brand-muted hover:bg-brand-light/50 hover:text-brand-primary'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Date-Wise Totals Summary Strip */}
      {dateWiseTotals.length > 0 && (
        <div className="bg-brand-surface border border-brand-border rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-brand-text flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-brand-primary" />
              Date-Wise Financial Totals (Recent Posting Days)
            </h3>
            <span className="text-[11px] text-brand-muted">
              Payables (Cr) and Receivables (Dr) tracked with strict account separation
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
            {dateWiseTotals.map((day) => (
              <div
                key={day.date}
                className="p-3 rounded-lg bg-brand-background border border-brand-border text-xs space-y-1"
              >
                <div className="flex items-center justify-between font-bold text-brand-primary">
                  <span>{formatDate(day.date)}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-brand-light">
                    {day.count} Vouchers
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-brand-muted">Debit (Dr):</span>
                  <span className="font-semibold text-brand-text">
                    {formatCurrency(day.totalDebit)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-brand-muted">Credit (Cr):</span>
                  <span className="font-semibold text-brand-primary">
                    {formatCurrency(day.totalCredit)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search & Filters */}
      <div className="bg-brand-surface border border-brand-border rounded-xl p-4 space-y-4 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="w-full md:w-96">
            <VendorSearch
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search Voucher ID, Transaction ID, Party Name, Description..."
            />
          </div>
          <div className="text-xs text-brand-muted">
            Showing <strong>{filteredEntries.length}</strong> ledger postings
          </div>
        </div>

        <VendorFilters
          filters={filterConfig}
          onFilterChange={handleFilterChange}
          onReset={handleResetFilters}
        />
      </div>

      {/* Ledger Table */}
      <div className="bg-brand-surface border border-brand-border rounded-xl overflow-hidden shadow-xs">
        <LedgerTable
          entries={pagination.paginatedData}
          onViewEntry={(entry) => setSelectedVoucherId(entry.id)}
          onSettleEntry={handleOpenQuickSettle}
        />
        <VendorPagination {...pagination} />
      </div>

      {/* Voucher Details Modal */}
      <LedgerDetails
        entry={selectedVoucher}
        isOpen={Boolean(selectedVoucher)}
        onClose={() => setSelectedVoucherId(null)}
      />

      {/* Record Supplier Payment / Customer Receipt Modal */}
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
                <option value="Supplier Payment">Supplier Payment (Debit Payable)</option>
                <option value="Customer Payment">Customer Receipt (Credit Receivable)</option>
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
                      cat === 'Customer' ? 'Customer Payment' : 'Supplier Payment',
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
                  const found = settlementParties.find((x) => x.id === e.target.value);
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
                  setSettlementForm((p) => ({ ...p, paymentMode: e.target.value }))
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
    </div>
  );
}


import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingCart,
  TrendingUp,
  Factory,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle2,
  AlertCircle,
  Award,
  Calendar,
  Eye,
  CreditCard,
  BookOpen,
  Printer,
  UserCheck,
  Scale,
  Home,
  ChevronRight,
} from 'lucide-react';
import { useDebounce } from '../../../hooks/useDebounce';
import { usePagination } from '../../../hooks/usePagination';
import { formatCurrency } from '../../../utils/formatCurrency';
import { formatDate, isDateInRange } from '../../../utils/formatDate';
import { exportToCSV, printDocumentSummary } from '../../../utils/exportUtils';
import VendorStatCard from '../../../pages/vendor/VendorStatCard';
import VendorSearch from '../../../pages/vendor/VendorSearch';
import VendorFilters from '../../../pages/vendor/VendorFilters';
import VendorDataTable from '../../../pages/vendor/VendorDataTable';
import VendorPagination from '../../../pages/vendor/VendorPagination';
import VendorModal from '../../../pages/vendor/VendorModal';
import VendorStatusBadge from '../../../pages/vendor/VendorStatusBadge';
import VendorExportMenu from '../../../pages/vendor/VendorExportMenu';

const ICON_MAP = {
  ShoppingCart,
  TrendingUp,
  Factory,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle2,
  AlertCircle,
  Award,
};

/**
 * Shared, standardized My Ledger screen component used by both
 * Vendor Portal and Middleman Portal while keeping portal data isolated.
 */
export default function MyLedger({
  portal = 'vendor',
  title = 'My Financial Ledger & Account Statements',
  subtitle = 'Double-entry financial accounting across Supplier Payables, Buyer Receivables, Expenses, and Settlements',
  entries = [],
  summaryCards = [],
  subLedgerTabs = [
    { id: 'All', label: 'All Journal Entries (Party-Wise Balances)' },
    { id: 'Payables', label: 'Supplier Payables Sub-Ledger' },
    { id: 'Receivables', label: 'Customer Receivables Sub-Ledger' },
    { id: 'Expenses', label: 'Processing & Operating Expenses' },
  ],
  activeSubLedger: controlledSubLedger,
  onSubLedgerChange,
  ledgerCategories = [],
  partyCategories = ['Farmer', 'Middleman', 'Customer', 'Processing Plant'],
  statusOptions = ['Paid', 'Partial', 'Partially Paid', 'Unpaid', 'Pending', 'Overdue'],
  showProcessingExpenses = true,
  canSettleRow,
  onQuickSettleRow,
  headerSettlementActions = null,
  customSettlementModal = null,
  exportFilePrefix = 'Financial_Ledger',
}) {
  const [internalSubLedger, setInternalSubLedger] = useState('All');
  const activeSubLedger =
    controlledSubLedger !== undefined ? controlledSubLedger : internalSubLedger;

  const handleSubLedgerSelect = (tabId) => {
    if (onSubLedgerChange) {
      onSubLedgerChange(tabId);
    } else {
      setInternalSubLedger(tabId);
    }
  };

  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 200);

  const [filters, setFilters] = useState({
    datePreset: 'All Time',
    category: 'All',
    partyCategory: 'All',
    partyName: 'All',
    entrySide: 'All',
    status: 'All',
  });

  const [selectedVoucherId, setSelectedVoucherId] = useState(null);

  // Built-in Quick Settle Modal State (used when customSettlementModal is not supplied)
  const [settlingEntry, setSettlingEntry] = useState(null);
  const [settleAmount, setSettleAmount] = useState('');
  const [settleMode, setSettleMode] = useState('NEFT / RTGS');
  const [settleNotes, setSettleNotes] = useState('');

  // Normalize entries without mutating source objects
  const normalizedEntries = useMemo(() => {
    return (entries || []).map((item, idx) => {
      const id = item.id || item.ledgerId || `LDG-${idx + 1}`;
      const partyCategory = item.partyCategory || 'Farmer';
      const category =
        item.category ||
        (partyCategory === 'Farmer'
          ? 'Farmer Purchase'
          : partyCategory === 'Vendor'
          ? 'Vendor Sale'
          : partyCategory === 'Customer'
          ? 'Customer Sale'
          : 'Ledger Entry');

      const subLedgerGroup =
        item.subLedgerGroup ||
        (partyCategory === 'Farmer' || partyCategory === 'Middleman'
          ? 'Payables'
          : partyCategory === 'Customer' || partyCategory === 'Vendor'
          ? 'Receivables'
          : 'Expenses');

      const runningBalance = Number(item.runningBalance || 0);
      const balanceLabel =
        item.balanceLabel ||
        (subLedgerGroup === 'Payables'
          ? 'Payable Due'
          : subLedgerGroup === 'Receivables'
          ? 'Receivable Due'
          : 'Running Bal');

      return {
        raw: item,
        id,
        date: item.date || '—',
        transactionId: item.transactionId || '—',
        category,
        description: item.description || '—',
        partyId: item.partyId || '—',
        partyName: item.partyName || '—',
        partyCategory,
        debit: Number(item.debit || 0),
        credit: Number(item.credit || 0),
        processingExpenses: Number(item.processingExpenses || 0),
        settledAmount: Number(item.settledAmount || 0),
        outstandingAmount: Number(item.outstandingAmount || 0),
        runningBalance,
        balanceLabel,
        subLedgerGroup,
        expectedPaymentDate: item.expectedPaymentDate || item.dueDate || '—',
        status: item.status || 'Pending',
      };
    });
  }, [entries]);

  const uniqueParties = useMemo(() => {
    const names = Array.from(
      new Set(normalizedEntries.map((l) => l.partyName).filter(Boolean))
    );
    return names.sort();
  }, [normalizedEntries]);

  const availableLedgerCategories = useMemo(() => {
    if (ledgerCategories && ledgerCategories.length > 0) return ledgerCategories;
    return Array.from(
      new Set(normalizedEntries.map((l) => l.category).filter(Boolean))
    );
  }, [ledgerCategories, normalizedEntries]);

  // Filtered Entries
  const filteredEntries = useMemo(() => {
    return normalizedEntries.filter((entry) => {
      if (
        activeSubLedger !== 'All' &&
        entry.subLedgerGroup !== activeSubLedger
      ) {
        return false;
      }

      if (debouncedSearch) {
        const q = debouncedSearch.toLowerCase();
        const match = [
          entry.id,
          entry.transactionId,
          entry.description,
          entry.partyName,
          entry.partyId,
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
  }, [normalizedEntries, activeSubLedger, debouncedSearch, filters]);

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
    () => normalizedEntries.find((e) => e.id === selectedVoucherId) || null,
    [normalizedEntries, selectedVoucherId]
  );

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    pagination.goToPage(1);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    handleSubLedgerSelect('All');
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

  const handleSettleButtonClick = (row) => {
    if (customSettlementModal && onQuickSettleRow) {
      onQuickSettleRow(row.raw);
      return;
    }
    setSettlingEntry(row);
    const defaultAmt =
      row.outstandingAmount > 0
        ? row.outstandingAmount
        : row.debit > 0
        ? row.debit
        : row.credit;
    setSettleAmount(String(defaultAmt || ''));
    setSettleMode('NEFT / RTGS');
    setSettleNotes(`Settlement against ${row.transactionId}`);
  };

  const handleConfirmBuiltInSettle = (e) => {
    e.preventDefault();
    if (!settlingEntry || !onQuickSettleRow) return;
    const amount = Number(settleAmount) || 0;
    if (amount <= 0) return;
    onQuickSettleRow(settlingEntry.raw, amount, {
      paymentMode: settleMode,
      notes: settleNotes,
    });
    setSettlingEntry(null);
  };

  const handleExportCSV = () => {
    const csvColumns = [
      { key: 'date', label: 'Date' },
      { key: 'id', label: 'Voucher ID' },
      { key: 'transactionId', label: 'Transaction ID' },
      { key: 'category', label: 'Ledger Category' },
      { key: 'description', label: 'Description' },
      { key: 'partyName', label: 'Party Name' },
      { key: 'partyCategory', label: 'Party Category' },
      { key: 'debit', label: 'Debit (INR)' },
      { key: 'credit', label: 'Credit (INR)' },
      ...(showProcessingExpenses
        ? [{ key: 'processingExpenses', label: 'Processing Expenses (INR)' }]
        : []),
      { key: 'runningBalance', label: 'Running Balance (INR)' },
      { key: 'expectedPaymentDate', label: 'Expected Payment Date' },
      { key: 'status', label: 'Status' },
    ];
    exportToCSV(
      filteredEntries,
      csvColumns,
      `${exportFilePrefix}_${activeSubLedger}`
    );
  };

  const handlePrintLedger = () => {
    printDocumentSummary({
      title: `${title} (${activeSubLedger})`,
      subtitle: `Total Entries: ${filteredEntries.length} | Generated on 05 Nov 2026`,
      metadata: summaryCards.map((c) => ({
        label: c.title,
        value: c.value,
      })),
      items: filteredEntries.map((e) => ({
        Date: formatDate(e.date),
        'Txn ID': e.transactionId,
        Category: e.category,
        Party: `${e.partyName} (${e.partyCategory})`,
        'Debit (Dr)': formatCurrency(e.debit || 0),
        'Credit (Cr)': formatCurrency(e.credit || 0),
        'Running Bal': `${formatCurrency(Math.abs(e.runningBalance || 0))} (${
          e.balanceLabel
        })`,
        Status: e.status,
      })),
    });
  };

  const handlePrintVoucher = (entry) => {
    if (!entry) return;
    printDocumentSummary({
      title: `Accounting Ledger Voucher – ${entry.id}`,
      subtitle: `Reference Transaction: ${entry.transactionId} | Posting Date: ${formatDate(
        entry.date
      )}`,
      metadata: [
        { label: 'Ledger Voucher ID', value: entry.id },
        { label: 'Transaction Reference', value: entry.transactionId },
        { label: 'Ledger Category', value: entry.category },
        { label: 'Party Name', value: entry.partyName },
        { label: 'Party ID', value: entry.partyId },
        { label: 'Party Category', value: entry.partyCategory },
        { label: 'Posting Date', value: formatDate(entry.date) },
        {
          label: 'Expected Settlement Date',
          value: formatDate(entry.expectedPaymentDate),
        },
        { label: 'Settlement Status', value: entry.status },
        {
          label: 'Running Balance After Entry',
          value: `${formatCurrency(Math.abs(entry.runningBalance || 0))} (${
            entry.balanceLabel || 'Bal'
          })`,
        },
      ],
      items: [
        {
          Particulars: entry.description,
          'Debit (Dr)': formatCurrency(entry.debit || 0),
          'Credit (Cr)': formatCurrency(entry.credit || 0),
          ...(showProcessingExpenses
            ? {
                'Processing Exp': formatCurrency(
                  entry.processingExpenses || 0
                ),
              }
            : {
                'Outstanding Bal': formatCurrency(
                  entry.outstandingAmount || 0
                ),
              }),
        },
      ],
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
        ...availableLedgerCategories.map((c) => ({ label: c, value: c })),
      ],
    },
    {
      key: 'partyCategory',
      label: 'Party Category',
      value: filters.partyCategory,
      options: [
        { label: 'All Party Categories', value: 'All' },
        ...partyCategories.map((c) => ({ label: c, value: c })),
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
        ...statusOptions.map((s) => ({ label: s, value: s })),
      ],
    },
  ];

  const columns = [
    {
      key: 'date',
      label: 'Date',
      sortable: true,
      render: (row) => (
        <span className="font-medium text-xs whitespace-nowrap">
          {formatDate(row.date)}
        </span>
      ),
    },
    {
      key: 'transactionId',
      label: 'Transaction ID',
      sortable: true,
      render: (row) => (
        <div>
          <span className="font-bold text-brand-primary block">
            {row.transactionId}
          </span>
          <span className="text-[11px] font-mono text-brand-muted">
            {row.id} • {row.category}
          </span>
        </div>
      ),
    },
    {
      key: 'description',
      label: 'Description',
      render: (row) => (
        <p className="text-xs text-brand-text max-w-xs leading-snug">
          {row.description}
        </p>
      ),
    },
    {
      key: 'partyName',
      label: 'Party Name',
      sortable: true,
      render: (row) => (
        <div>
          <span className="font-semibold text-brand-text block">
            {row.partyName}
          </span>
          <span className="text-[10px] font-mono text-brand-muted">
            {row.partyId}
          </span>
        </div>
      ),
    },
    {
      key: 'partyCategory',
      label: 'Party Category',
      render: (row) => <VendorStatusBadge status={row.partyCategory} />,
    },
    {
      key: 'debit',
      label: 'Debit (Dr)',
      align: 'right',
      sortable: true,
      render: (row) =>
        row.debit > 0 ? (
          <span className="font-bold text-brand-text">
            {formatCurrency(row.debit)}
          </span>
        ) : (
          <span className="text-brand-muted">—</span>
        ),
    },
    {
      key: 'credit',
      label: 'Credit (Cr)',
      align: 'right',
      sortable: true,
      render: (row) =>
        row.credit > 0 ? (
          <span className="font-bold text-brand-primary">
            {formatCurrency(row.credit)}
          </span>
        ) : (
          <span className="text-brand-muted">—</span>
        ),
    },
    ...(showProcessingExpenses
      ? [
          {
            key: 'processingExpenses',
            label: 'Processing Expenses',
            align: 'right',
            render: (row) =>
              row.processingExpenses > 0 ? (
                <span className="font-semibold text-brand-warning">
                  {formatCurrency(row.processingExpenses)}
                </span>
              ) : (
                <span className="text-brand-muted">—</span>
              ),
          },
        ]
      : []),
    {
      key: 'runningBalance',
      label: 'Running Balance',
      align: 'right',
      render: (row) => (
        <div className="text-right">
          <span className="font-bold text-brand-text block">
            {formatCurrency(Math.abs(row.runningBalance || 0))}
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-brand-primary">
            {row.balanceLabel || 'Party Bal'}
          </span>
        </div>
      ),
    },
    {
      key: 'expectedPaymentDate',
      label: 'Expected Payment Date',
      render: (row) => (
        <span className="text-xs whitespace-nowrap">
          {formatDate(row.expectedPaymentDate)}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <VendorStatusBadge status={row.status} />,
    },
    {
      key: 'actions',
      label: 'Actions',
      align: 'right',
      render: (row) => {
        const allowSettle = canSettleRow
          ? canSettleRow(row.raw)
          : row.status !== 'Paid' &&
            (row.outstandingAmount > 0 ||
              row.status === 'Unpaid' ||
              row.status === 'Partial' ||
              row.status === 'Partially Paid' ||
              row.status === 'Pending' ||
              row.status === 'Overdue');

        return (
          <div className="flex items-center justify-end gap-1.5">
            {allowSettle && onQuickSettleRow && (
              <button
                type="button"
                onClick={() => handleSettleButtonClick(row)}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg bg-brand-primary text-white hover:bg-brand-secondary transition-colors cursor-pointer"
                title="Record Settlement Payment"
              >
                <CreditCard className="w-3.5 h-3.5" />
                Settle
              </button>
            )}
            <button
              type="button"
              onClick={() => setSelectedVoucherId(row.id)}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-brand-light text-brand-primary hover:bg-brand-primary hover:text-white transition-colors cursor-pointer"
              title="View Voucher Details"
            >
              <Eye className="w-3.5 h-3.5" />
              Voucher
            </button>
          </div>
        );
      },
    },
  ];

  const dashboardPath =
    portal === 'middleman' ? '/middleman/dashboard' : '/vendor/dashboard';
  const portalLabel =
    portal === 'middleman' ? 'Middleman Portal' : 'Vendor Portal';

  return (
    <div className="space-y-6">
      {/* Unified Portal-Aware Header */}
      <div>
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-1.5 text-xs text-brand-muted mb-2"
        >
          <Link
            to={dashboardPath}
            className="inline-flex items-center gap-1 text-brand-muted hover:text-brand-primary transition-colors font-medium"
          >
            <Home className="w-3.5 h-3.5 text-brand-primary" />
            <span className="hidden sm:inline">{portalLabel}</span>
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-brand-border shrink-0" />
          <span className="font-semibold text-brand-primary truncate">
            My Ledger
          </span>
        </nav>

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-brand-surface p-5 rounded-2xl border border-brand-border shadow-2xs">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-brand-light text-brand-primary flex items-center justify-center shrink-0 border border-brand-secondary/30">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-bold text-brand-primary tracking-tight">
                  {title}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-light text-brand-primary border border-brand-secondary/30">
                  {filteredEntries.length} Vouchers
                </span>
              </div>
              {subtitle && (
                <p className="text-xs sm:text-sm text-brand-muted mt-1">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {headerSettlementActions}
            <VendorExportMenu
              onExportCSV={handleExportCSV}
              onPrint={handlePrintLedger}
              label="Download / Print Statement"
            />
          </div>
        </div>
      </div>

      {/* Unified Summary KPI Cards */}
      {summaryCards.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {summaryCards.map((card, i) => {
            const IconComp =
              typeof card.icon === 'string'
                ? ICON_MAP[card.icon] || BookOpen
                : card.icon || BookOpen;
            return (
              <VendorStatCard
                key={card.title || i}
                title={card.title}
                value={card.value}
                subtitle={card.subtitle}
                icon={IconComp}
              />
            );
          })}
        </div>
      )}

      {/* Sub-Ledger Separation Tabs */}
      <div className="bg-brand-surface border border-brand-border rounded-xl p-2 flex flex-wrap items-center gap-2 shadow-xs">
        {subLedgerTabs.map((tab) => {
          const active = activeSubLedger === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                handleSubLedgerSelect(tab.id);
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
              Payables (Cr) and Receivables (Dr) tracked with strict account
              separation
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
              onChange={(val) => {
                setSearchQuery(val);
                pagination.goToPage(1);
              }}
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

      {/* Unified Ledger Table */}
      <div className="bg-brand-surface border border-brand-border rounded-xl overflow-hidden shadow-xs">
        <VendorDataTable
          columns={columns}
          data={pagination.paginatedData}
          rowKey="id"
          enablePagination={false}
          emptyTitle="No Ledger Entries Found"
          emptyDescription="Adjust your sub-ledger tab or filter criteria to view financial postings."
          emptyIcon={BookOpen}
          onResetFilters={handleResetFilters}
        />
        <VendorPagination {...pagination} />
      </div>

      {/* Voucher Details Modal */}
      <VendorModal
        isOpen={Boolean(selectedVoucher)}
        onClose={() => setSelectedVoucherId(null)}
        title={`Accounting Voucher Details – ${selectedVoucher?.id || ''}`}
        subtitle={
          selectedVoucher
            ? `Category: ${selectedVoucher.category} | Reference ID: ${selectedVoucher.transactionId}`
            : ''
        }
        size="lg"
        footer={
          selectedVoucher && (
            <div className="flex items-center justify-between w-full">
              <button
                type="button"
                onClick={() => handlePrintVoucher(selectedVoucher)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg bg-brand-primary text-white hover:bg-brand-secondary transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                Print Accounting Voucher
              </button>

              <button
                type="button"
                onClick={() => setSelectedVoucherId(null)}
                className="px-4 py-2 text-xs font-semibold rounded-lg border border-brand-border text-brand-text hover:bg-brand-background cursor-pointer"
              >
                Close
              </button>
            </div>
          )
        }
      >
        {selectedVoucher && (
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-brand-light/40 border border-brand-primary/30 flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="text-brand-muted block">
                  Ledger Voucher & Reference
                </span>
                <span className="text-sm font-extrabold text-brand-primary">
                  {selectedVoucher.id} • {selectedVoucher.transactionId}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <VendorStatusBadge status={selectedVoucher.partyCategory} />
                <VendorStatusBadge status={selectedVoucher.status} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-brand-border bg-brand-background/50 space-y-2">
                <h4 className="font-bold text-brand-text flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-brand-primary" />
                  Counterparty Details
                </h4>
                <div>
                  <span className="text-brand-muted block">Party Name</span>
                  <span className="font-bold text-brand-text">
                    {selectedVoucher.partyName}
                  </span>
                </div>
                <div>
                  <span className="text-brand-muted block">
                    Party ID & Category
                  </span>
                  <span className="font-mono font-semibold text-brand-primary">
                    {selectedVoucher.partyId} ({selectedVoucher.partyCategory})
                  </span>
                </div>
                <div>
                  <span className="text-brand-muted block">
                    Ledger Category
                  </span>
                  <span className="font-semibold text-brand-text">
                    {selectedVoucher.category}
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-brand-border bg-brand-background/50 space-y-2">
                <h4 className="font-bold text-brand-text flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-brand-primary" />
                  Dates & Running Balance
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-brand-muted block">Posting Date</span>
                    <span className="font-semibold">
                      {formatDate(selectedVoucher.date)}
                    </span>
                  </div>
                  <div>
                    <span className="text-brand-muted block">
                      Expected Settlement
                    </span>
                    <span className="font-semibold">
                      {formatDate(selectedVoucher.expectedPaymentDate)}
                    </span>
                  </div>
                </div>
                <div className="pt-2 border-t border-brand-border">
                  <span className="text-brand-muted block">
                    Contextual Running Balance (
                    {selectedVoucher.balanceLabel || 'Party Account'})
                  </span>
                  <span className="text-base font-extrabold text-brand-primary">
                    {formatCurrency(
                      Math.abs(selectedVoucher.runningBalance || 0)
                    )}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-brand-border bg-brand-surface space-y-3">
              <h4 className="font-bold text-brand-text flex items-center gap-1.5">
                <Scale className="w-4 h-4 text-brand-primary" />
                Double-Entry Posting Breakdown
              </h4>
              <p className="text-brand-text bg-brand-background p-3 rounded-lg border border-brand-border">
                {selectedVoucher.description}
              </p>

              <div className="grid grid-cols-3 gap-3 pt-1">
                <div className="p-3 rounded-lg bg-brand-background border border-brand-border">
                  <span className="text-brand-muted block">Debit (Dr)</span>
                  <span className="text-sm font-extrabold text-brand-text">
                    {formatCurrency(selectedVoucher.debit || 0)}
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-brand-background border border-brand-border">
                  <span className="text-brand-muted block">Credit (Cr)</span>
                  <span className="text-sm font-extrabold text-brand-primary">
                    {formatCurrency(selectedVoucher.credit || 0)}
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-brand-background border border-brand-border">
                  <span className="text-brand-muted block">
                    {showProcessingExpenses
                      ? 'Processing Expense'
                      : 'Outstanding Amount'}
                  </span>
                  <span className="text-sm font-extrabold text-brand-warning">
                    {formatCurrency(
                      showProcessingExpenses
                        ? selectedVoucher.processingExpenses || 0
                        : selectedVoucher.outstandingAmount || 0
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </VendorModal>

      {/* Custom Settlement Modal (e.g. Vendor Portal full settlement form) */}
      {customSettlementModal}

      {/* Built-in Settlement Modal (e.g. Middleman Portal settlement) */}
      {!customSettlementModal && (
        <VendorModal
          isOpen={Boolean(settlingEntry)}
          onClose={() => setSettlingEntry(null)}
          title={`Record Financial Settlement – ${
            settlingEntry?.transactionId || ''
          }`}
          subtitle="Post supplier payment or buyer receipt directly to the Financial Ledger"
          size="md"
        >
          {settlingEntry && (
            <form
              onSubmit={handleConfirmBuiltInSettle}
              className="space-y-4 text-xs"
            >
              <div className="p-4 rounded-xl bg-brand-light/40 border border-brand-primary/30 space-y-2">
                <div className="flex justify-between">
                  <span className="text-brand-muted">Counterparty:</span>
                  <span className="font-bold text-brand-text">
                    {settlingEntry.partyName} ({settlingEntry.partyCategory})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-brand-muted">Voucher Amount:</span>
                  <span className="font-semibold text-brand-text">
                    {formatCurrency(
                      settlingEntry.debit > 0
                        ? settlingEntry.debit
                        : settlingEntry.credit
                    )}
                  </span>
                </div>
                {settlingEntry.settledAmount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-brand-muted">Already Settled:</span>
                    <span className="font-semibold text-brand-success">
                      {formatCurrency(settlingEntry.settledAmount)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between pt-1 border-t border-brand-primary/20">
                  <span className="text-brand-muted font-semibold">
                    Current Outstanding:
                  </span>
                  <span className="font-extrabold text-brand-error">
                    {formatCurrency(settlingEntry.outstandingAmount || 0)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-brand-text mb-1">
                    Settlement Amount (₹){' '}
                    <span className="text-brand-error">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={settlingEntry.outstandingAmount || undefined}
                    required
                    value={settleAmount}
                    onChange={(e) => setSettleAmount(e.target.value)}
                    placeholder="Enter amount to settle"
                    className="w-full px-3 py-2 rounded-lg border border-brand-border bg-brand-surface text-brand-text font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-brand-text mb-1">
                    Payment Mode
                  </label>
                  <select
                    value={settleMode}
                    onChange={(e) => setSettleMode(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-brand-border bg-brand-surface text-brand-text"
                  >
                    <option value="NEFT / RTGS">NEFT / RTGS</option>
                    <option value="UPI / IMPS">UPI / IMPS</option>
                    <option value="Bank Cheque">Bank Cheque</option>
                    <option value="Cash Settlement">Cash Settlement</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-brand-text mb-1">
                  Settlement Narration / Notes
                </label>
                <input
                  type="text"
                  value={settleNotes}
                  onChange={(e) => setSettleNotes(e.target.value)}
                  placeholder="Enter payment reference or remarks"
                  className="w-full px-3 py-2 rounded-lg border border-brand-border bg-brand-surface text-brand-text"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-brand-border">
                <button
                  type="button"
                  onClick={() => setSettlingEntry(null)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold border border-brand-border text-brand-text hover:bg-brand-background cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg text-xs font-bold bg-brand-primary text-white hover:bg-brand-secondary transition-colors cursor-pointer"
                >
                  Confirm & Post Settlement
                </button>
              </div>
            </form>
          )}
        </VendorModal>
      )}
    </div>
  );
}


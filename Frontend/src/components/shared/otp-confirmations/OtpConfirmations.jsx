import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Clock,
  CheckCircle2,
  AlertTriangle,
  KeyRound,
  RefreshCw,
  History,
  Eye,
  XCircle,
  Home,
  ChevronRight,
} from 'lucide-react';
import { useDebounce } from '../../../hooks/useDebounce';
import { usePagination } from '../../../hooks/usePagination';
import { formatCurrency, maskMobile } from '../../../utils/formatCurrency';
import { isDateInRange } from '../../../utils/formatDate';
import { exportToCSV } from '../../../utils/exportUtils';
import VendorStatCard from '../../../pages/vendor/VendorStatCard';
import VendorSearch from '../../../pages/vendor/VendorSearch';
import VendorFilters from '../../../pages/vendor/VendorFilters';
import VendorDataTable from '../../../pages/vendor/VendorDataTable';
import VendorPagination from '../../../pages/vendor/VendorPagination';
import VendorModal from '../../../pages/vendor/VendorModal';
import VendorStatusBadge from '../../../pages/vendor/VendorStatusBadge';
import VendorExportMenu from '../../../pages/vendor/VendorExportMenu';

/**
 * Shared, standardized OTP Confirmations screen component used by both
 * Vendor Portal and Middleman Portal while keeping portal data isolated.
 */
export default function OtpConfirmations({
  portal = 'vendor',
  title = 'OTP Confirmations & Transaction Security',
  subtitle = 'Multi-party OTP verification center for agricultural purchases and sales transactions',
  confirmations = [],
  tabs = [
    { id: 'Farmer', label: 'Farmer Confirmations' },
    { id: 'Middleman', label: 'Middleman Confirmations' },
    { id: 'Customer', label: 'Customer Confirmations' },
    { id: 'All', label: 'All Confirmations' },
  ],
  statusOptions = ['Pending', 'Sent', 'Verified', 'Confirmed', 'Failed', 'Expired', 'Rejected'],
  onVerifyOtp,
  onResendOtp,
  onRejectOtp,
  exportFilePrefix = 'OTP_Confirmations_Log',
}) {
  const [activeTab, setActiveTab] = useState(tabs[0]?.id || 'Farmer');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 200);

  const [filters, setFilters] = useState({
    category: 'All',
    otpStatus: 'All',
    datePreset: 'All Time',
  });

  // Verify / Authorize Modal State
  const [verifyingRecordId, setVerifyingRecordId] = useState(null);
  const [otpInput, setOtpInput] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState(null);
  const [isRejectingMode, setIsRejectingMode] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  // Details & Attempt History Modal State
  const [detailsRecordId, setDetailsRecordId] = useState(null);

  // Toast feedback for quick actions
  const [toastMessage, setToastMessage] = useState(null);

  // Normalize portal-specific confirmation items without mutating underlying state
  const normalizedRecords = useMemo(() => {
    return (confirmations || []).map((item, idx) => {
      const id = item.id || item.confirmationId || `OTP-${idx + 1}`;
      const transactionId = item.transactionId || '—';
      const partyCategory = item.partyCategory || item.partyType || 'Farmer';
      const mobileNumber = item.mobileNumber || item.partyMobile || '';
      const product =
        item.product ||
        (item.crop
          ? item.variety && item.variety !== 'Standard'
            ? `${item.crop} (${item.variety})`
            : item.crop
          : '—');
      const quantity =
        typeof item.quantity === 'number'
          ? `${item.quantity} ${item.unit || 'Quintal'}`
          : item.quantity || '—';
      const amount = Number(item.amount ?? item.transactionAmount ?? 0);
      const otpStatus = item.otpStatus || 'Pending';
      const initiatedDate = item.initiatedDate || item.requestDate || '—';
      const confirmationDate = item.confirmationDate || null;
      const expiryTime = item.expiryTime || item.expiryDate || '—';
      const demoOtpCode =
        item.demoOtpCode ||
        String(100000 + ((String(id).charCodeAt(String(id).length - 1) || 42) * 7919) % 899999);

      const isVerified = otpStatus === 'Verified' || otpStatus === 'Confirmed';
      const attempts = item.attempts ?? (isVerified ? 1 : 0);
      const maxAttempts = item.maxAttempts ?? 3;

      const attemptHistory =
        Array.isArray(item.attemptHistory) && item.attemptHistory.length > 0
          ? item.attemptHistory
          : [
              {
                timestamp: initiatedDate,
                status: 'Sent',
                note: `OTP verification request dispatched to ${item.partyName} (${maskMobile(
                  mobileNumber
                )}).`,
              },
              ...(confirmationDate
                ? [
                    {
                      timestamp: confirmationDate,
                      status: otpStatus,
                      note:
                        item.notes ||
                        `Transaction ${transactionId} ${otpStatus.toLowerCase()} and synced with inventory & ledger.`,
                    },
                  ]
                : item.notes
                ? [
                    {
                      timestamp: initiatedDate,
                      status: otpStatus,
                      note: item.notes,
                    },
                  ]
                : []),
            ];

      return {
        raw: item,
        id,
        transactionId,
        partyId: item.partyId || '—',
        partyName: item.partyName || '—',
        partyCategory,
        mobileNumber,
        transactionType: item.transactionType || `${partyCategory} Transaction`,
        product,
        quantity,
        amount,
        otpStatus,
        demoOtpCode,
        initiatedDate,
        confirmationDate,
        expiryTime,
        attempts,
        maxAttempts,
        attemptHistory,
        notes: item.notes || '',
      };
    });
  }, [confirmations]);

  const verifyingRecord = useMemo(
    () => normalizedRecords.find((c) => c.id === verifyingRecordId) || null,
    [normalizedRecords, verifyingRecordId]
  );

  const detailsRecord = useMemo(
    () => normalizedRecords.find((c) => c.id === detailsRecordId) || null,
    [normalizedRecords, detailsRecordId]
  );

  // Summary Stats
  const stats = useMemo(() => {
    const pending = normalizedRecords.filter(
      (c) => c.otpStatus === 'Pending' || c.otpStatus === 'Sent'
    ).length;
    const verified = normalizedRecords.filter(
      (c) => c.otpStatus === 'Verified' || c.otpStatus === 'Confirmed'
    ).length;
    const failedOrExpired = normalizedRecords.filter(
      (c) =>
        c.otpStatus === 'Failed' ||
        c.otpStatus === 'Expired' ||
        c.otpStatus === 'Rejected'
    ).length;

    const countsByTab = { All: normalizedRecords.length };
    tabs.forEach((t) => {
      if (t.id !== 'All') {
        countsByTab[t.id] = normalizedRecords.filter(
          (c) => c.partyCategory === t.id
        ).length;
      }
    });

    return {
      total: normalizedRecords.length,
      pending,
      verified,
      failedOrExpired,
      countsByTab,
    };
  }, [normalizedRecords, tabs]);

  // Filtered Confirmations
  const filteredRecords = useMemo(() => {
    return normalizedRecords.filter((c) => {
      if (activeTab !== 'All' && c.partyCategory !== activeTab) {
        return false;
      }

      if (filters.category !== 'All' && c.partyCategory !== filters.category) {
        return false;
      }

      if (filters.otpStatus !== 'All' && c.otpStatus !== filters.otpStatus) {
        return false;
      }

      if (debouncedSearch) {
        const q = debouncedSearch.toLowerCase();
        const match = [
          c.id,
          c.transactionId,
          c.partyName,
          c.partyId,
          c.mobileNumber,
          c.product,
          c.transactionType,
        ]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(q));
        if (!match) return false;
      }

      if (filters.datePreset !== 'All Time') {
        const dateOnly = String(c.initiatedDate || c.confirmationDate || '').slice(
          0,
          10
        );
        if (
          dateOnly &&
          dateOnly !== '—' &&
          !isDateInRange(dateOnly, filters.datePreset, '', '', '2026-11-05')
        ) {
          return false;
        }
      }

      return true;
    });
  }, [normalizedRecords, activeTab, filters, debouncedSearch]);

  const pagination = usePagination(filteredRecords, 10);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    if (key === 'category' && value !== 'All') {
      setActiveTab(value);
    }
    pagination.goToPage(1);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setFilters({
      category: 'All',
      otpStatus: 'All',
      datePreset: 'All Time',
    });
    pagination.goToPage(1);
  };

  const handleOpenVerifyModal = (record) => {
    setVerifyingRecordId(record.id);
    setOtpInput(record.demoOtpCode || '');
    setFeedbackMsg(null);
    setIsRejectingMode(false);
    setRejectReason('');
  };

  const handleVerifySubmit = (e) => {
    e.preventDefault();
    if (!verifyingRecord || !onVerifyOtp) return;

    const res = onVerifyOtp({
      record: verifyingRecord.raw,
      otpId: verifyingRecord.id,
      transactionId: verifyingRecord.transactionId,
      enteredCode: otpInput,
    });

    if (res && typeof res === 'object' && 'message' in res) {
      setFeedbackMsg(res);
      if (res.success) {
        showToast(res.message);
      }
    } else {
      setFeedbackMsg({
        success: true,
        message: `Transaction ${verifyingRecord.transactionId} verified & synced with inventory and ledger.`,
      });
      showToast(
        `Transaction ${verifyingRecord.transactionId} authorized! Stock & ledger records updated.`
      );
    }
  };

  const handleResendClick = (record) => {
    if (!onResendOtp) return;
    const newCode = onResendOtp(record.id, record.raw);
    if (newCode && verifyingRecordId === record.id) {
      setOtpInput(newCode);
      setFeedbackMsg({
        success: true,
        isResend: true,
        message: `New OTP ${newCode} generated and sent.`,
      });
    } else if (newCode) {
      showToast(`Fresh OTP ${newCode} sent to ${record.partyName}.`);
    }
  };

  const handleRejectSubmit = (record, reasonText) => {
    if (!onRejectOtp) return;
    onRejectOtp(record.id, reasonText || 'Verification declined by party', record.raw);
    setVerifyingRecordId(null);
    setIsRejectingMode(false);
    setRejectReason('');
    showToast(`Transaction ${record.transactionId} rejected and archived.`);
  };

  const handleExportCSV = () => {
    exportToCSV(
      filteredRecords,
      [
        { key: 'id', label: 'OTP ID' },
        { key: 'transactionId', label: 'Transaction ID' },
        { key: 'partyName', label: 'Party Name' },
        { key: 'partyCategory', label: 'Party Category' },
        { key: 'mobileNumber', label: 'Mobile Number' },
        { key: 'transactionType', label: 'Transaction Type' },
        { key: 'product', label: 'Product' },
        { key: 'quantity', label: 'Quantity' },
        { key: 'amount', label: 'Amount (INR)' },
        { key: 'otpStatus', label: 'OTP Status' },
        { key: 'initiatedDate', label: 'Initiated Date' },
        { key: 'confirmationDate', label: 'Confirmation Date' },
        { key: 'expiryTime', label: 'Expiry Time' },
      ],
      exportFilePrefix
    );
  };

  const categoryOptions = useMemo(() => {
    const partyTabs = tabs.filter((t) => t.id !== 'All');
    return [
      { label: 'All Categories', value: 'All' },
      ...partyTabs.map((t) => ({ label: t.id, value: t.id })),
    ];
  }, [tabs]);

  const filterConfig = [
    {
      key: 'category',
      label: 'Party Category',
      value: filters.category,
      options: categoryOptions,
    },
    {
      key: 'otpStatus',
      label: 'OTP Status',
      value: filters.otpStatus,
      options: [
        { label: 'All OTP Status', value: 'All' },
        ...statusOptions.map((st) => ({ label: st, value: st })),
      ],
    },
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
      ],
    },
  ];

  const columns = [
    {
      key: 'transactionId',
      label: 'Transaction ID',
      sortable: true,
      render: (row) => (
        <div>
          <span className="font-bold text-brand-primary block">
            {row.transactionId}
          </span>
          <span className="text-[11px] font-mono text-brand-muted">{row.id}</span>
        </div>
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
          <span className="text-[11px] text-brand-muted">{row.partyId}</span>
        </div>
      ),
    },
    {
      key: 'partyCategory',
      label: 'Party Category',
      render: (row) => <VendorStatusBadge status={row.partyCategory} />,
    },
    {
      key: 'mobileNumber',
      label: 'Mobile Number',
      render: (row) => (
        <span className="font-mono text-xs">{maskMobile(row.mobileNumber)}</span>
      ),
    },
    {
      key: 'transactionType',
      label: 'Transaction Type',
      render: (row) => <span className="font-medium">{row.transactionType}</span>,
    },
    {
      key: 'product',
      label: 'Product',
      render: (row) => (
        <span className="font-semibold text-brand-text">{row.product}</span>
      ),
    },
    {
      key: 'quantity',
      label: 'Quantity',
      render: (row) => <span className="font-semibold">{row.quantity}</span>,
    },
    {
      key: 'amount',
      label: 'Amount',
      align: 'right',
      sortable: true,
      render: (row) => (
        <span className="font-bold text-brand-primary">
          {formatCurrency(row.amount)}
        </span>
      ),
    },
    {
      key: 'otpStatus',
      label: 'OTP Status',
      render: (row) => {
        const isDone =
          row.otpStatus === 'Verified' ||
          row.otpStatus === 'Confirmed' ||
          row.otpStatus === 'Cancelled' ||
          row.otpStatus === 'Rejected';
        return (
          <div className="space-y-1">
            <VendorStatusBadge status={row.otpStatus} />
            {!isDone && (
              <span className="block text-[10px] font-mono font-bold text-brand-primary">
                Demo OTP: {row.demoOtpCode}
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: 'confirmationDate',
      label: 'Confirmation Date',
      render: (row) => (
        <span className="text-xs">
          {row.confirmationDate || 'Awaiting Verification'}
        </span>
      ),
    },
    {
      key: 'expiryTime',
      label: 'Expiry Time',
      render: (row) => (
        <span className="text-xs text-brand-muted">{row.expiryTime}</span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      align: 'right',
      render: (row) => {
        const canVerify =
          row.otpStatus === 'Pending' ||
          row.otpStatus === 'Sent' ||
          row.otpStatus === 'Failed' ||
          row.otpStatus === 'Expired';

        return (
          <div className="flex items-center justify-end gap-1.5">
            {canVerify && (
              <>
                <button
                  type="button"
                  onClick={() => handleOpenVerifyModal(row)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg bg-brand-primary text-white hover:bg-brand-secondary transition-colors cursor-pointer"
                  title="Enter & Verify OTP"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  Verify
                </button>
                {onResendOtp && (
                  <button
                    type="button"
                    onClick={() => handleResendClick(row)}
                    className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-lg border border-brand-primary text-brand-primary hover:bg-brand-light/50 transition-colors cursor-pointer"
                    title="Resend OTP"
                  >
                    <RefreshCw className="w-3 h-3" />
                  </button>
                )}
                {onRejectOtp && row.otpStatus === 'Pending' && (
                  <button
                    type="button"
                    onClick={() =>
                      handleRejectSubmit(row, 'Declined from quick action')
                    }
                    className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-lg border border-red-200 text-brand-error hover:bg-red-50 transition-colors cursor-pointer"
                    title="Reject Verification"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                  </button>
                )}
              </>
            )}
            <button
              type="button"
              onClick={() => setDetailsRecordId(row.id)}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-brand-light text-brand-primary hover:bg-brand-primary hover:text-white transition-colors cursor-pointer"
              title="View Transaction & OTP Attempt History"
            >
              <Eye className="w-3.5 h-3.5" />
              Details
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

  const isVerifyingRecordCompleted =
    verifyingRecord?.otpStatus === 'Verified' ||
    verifyingRecord?.otpStatus === 'Confirmed';

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
            OTP Confirmations
          </span>
        </nav>

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-brand-surface p-5 rounded-2xl border border-brand-border shadow-2xs">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-brand-light text-brand-primary flex items-center justify-center shrink-0 border border-brand-secondary/30">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-bold text-brand-primary tracking-tight">
                  {title}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-light text-brand-primary border border-brand-secondary/30">
                  {stats.pending} Pending Verification
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
            <VendorExportMenu
              onExportCSV={handleExportCSV}
              label="Export OTP Audit Log"
            />
          </div>
        </div>
      </div>

      {/* Feedback Toast */}
      {toastMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-brand-success" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 4 Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <VendorStatCard
          title="Total OTP Requests"
          value={stats.total}
          subtitle="Across all counterparty categories"
          icon={ShieldCheck}
        />
        <VendorStatCard
          title="Pending / Sent OTPs"
          value={stats.pending}
          subtitle="Awaiting party OTP entry"
          icon={Clock}
        />
        <VendorStatCard
          title="Verified Transactions"
          value={stats.verified}
          subtitle="Confirmed & posted to inventory/ledger"
          icon={CheckCircle2}
        />
        <VendorStatCard
          title="Failed / Expired / Rejected"
          value={stats.failedOrExpired}
          subtitle="Requires re-initiation or review"
          icon={AlertTriangle}
        />
      </div>

      {/* Category Tabs */}
      <div className="bg-brand-surface border border-brand-border rounded-xl p-2 flex flex-wrap items-center gap-2 shadow-xs">
        {tabs.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveTab(tab.id);
                pagination.goToPage(1);
              }}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                active
                  ? 'bg-brand-primary text-white shadow-xs'
                  : 'text-brand-muted hover:bg-brand-light/50 hover:text-brand-primary'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] ${
                  active
                    ? 'bg-white/20 text-white'
                    : 'bg-brand-background text-brand-text'
                }`}
              >
                {stats.countsByTab[tab.id] || 0}
              </span>
            </button>
          );
        })}
      </div>

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
              placeholder="Search by Transaction ID, Party Name, Mobile, or Product..."
            />
          </div>
          <div className="text-xs text-brand-muted">
            Showing <strong>{filteredRecords.length}</strong> OTP records
          </div>
        </div>

        <VendorFilters
          filters={filterConfig}
          onFilterChange={handleFilterChange}
          onReset={handleResetFilters}
        />
      </div>

      {/* Unified Data Table */}
      <div className="bg-brand-surface border border-brand-border rounded-xl overflow-hidden shadow-xs">
        <VendorDataTable
          columns={columns}
          data={pagination.paginatedData}
          rowKey="id"
          enablePagination={false}
          emptyTitle="No OTP Confirmations Found"
          emptyDescription="No confirmation records match your selected tab or filter criteria."
          emptyIcon={ShieldCheck}
          onResetFilters={handleResetFilters}
        />

        <VendorPagination {...pagination} />
      </div>

      {/* ENTER & VERIFY OTP MODAL */}
      <VendorModal
        isOpen={Boolean(verifyingRecord)}
        onClose={() => {
          setVerifyingRecordId(null);
          setFeedbackMsg(null);
          setIsRejectingMode(false);
        }}
        title={`Verify Transaction OTP – ${verifyingRecord?.transactionId || ''}`}
        subtitle={
          verifyingRecord
            ? `${verifyingRecord.partyCategory}: ${verifyingRecord.partyName} (${maskMobile(
                verifyingRecord.mobileNumber
              )})`
            : ''
        }
        size="md"
      >
        {verifyingRecord && (
          <form onSubmit={handleVerifySubmit} className="space-y-4">
            <div className="p-4 rounded-xl bg-brand-light/40 border border-brand-primary/30 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-brand-primary uppercase">
                  {verifyingRecord.transactionType}
                </span>
                <VendorStatusBadge status={verifyingRecord.otpStatus} />
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <span className="text-brand-muted block">
                    Product & Quantity
                  </span>
                  <span className="font-semibold text-brand-text">
                    {verifyingRecord.product} ({verifyingRecord.quantity})
                  </span>
                </div>
                <div>
                  <span className="text-brand-muted block">
                    Transaction Amount
                  </span>
                  <span className="font-bold text-brand-primary">
                    {formatCurrency(verifyingRecord.amount)}
                  </span>
                </div>
                <div>
                  <span className="text-brand-muted block">Attempts Used</span>
                  <span className="font-semibold">
                    {verifyingRecord.attempts || 0} /{' '}
                    {verifyingRecord.maxAttempts || 3}
                  </span>
                </div>
                <div>
                  <span className="text-brand-muted block">Expiry Time</span>
                  <span className="font-semibold">
                    {verifyingRecord.expiryTime}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-brand-primary/20 flex items-center justify-between">
                <span className="text-brand-muted font-medium">
                  Active Demo OTP Code:
                </span>
                <span className="px-3 py-1 rounded-md bg-brand-primary text-white font-mono text-sm font-extrabold tracking-widest">
                  {verifyingRecord.demoOtpCode}
                </span>
              </div>
            </div>

            {!isVerifyingRecordCompleted ? (
              <div className="space-y-3">
                {!isRejectingMode ? (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-brand-text mb-1">
                        Enter 6-Digit OTP Received by{' '}
                        {verifyingRecord.partyCategory}
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          maxLength={6}
                          value={otpInput}
                          onChange={(e) => setOtpInput(e.target.value)}
                          placeholder="Enter 6-digit OTP"
                          className="flex-1 px-3 py-2 text-sm font-mono font-bold tracking-widest rounded-lg border border-brand-border bg-brand-surface text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setOtpInput(verifyingRecord.demoOtpCode)
                          }
                          className="px-3 py-2 text-xs font-semibold rounded-lg bg-brand-light text-brand-primary hover:bg-brand-secondary hover:text-white transition-colors cursor-pointer"
                        >
                          Auto-Fill Demo OTP
                        </button>
                      </div>
                    </div>

                    {feedbackMsg && (
                      <div
                        className={`p-3 rounded-lg text-xs font-semibold ${
                          feedbackMsg.success
                            ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
                            : 'bg-red-50 border border-red-200 text-brand-error'
                        }`}
                      >
                        {feedbackMsg.message}
                      </div>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                      <div className="flex items-center gap-3">
                        {onResendOtp && (
                          <button
                            type="button"
                            onClick={() => handleResendClick(verifyingRecord)}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-primary hover:underline cursor-pointer"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            Resend Fresh OTP
                          </button>
                        )}
                        {onRejectOtp && (
                          <button
                            type="button"
                            onClick={() => setIsRejectingMode(true)}
                            className="inline-flex items-center gap-1 text-xs font-bold text-brand-error hover:underline cursor-pointer"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            Reject Verification
                          </button>
                        )}
                      </div>

                      <div className="flex gap-2 ml-auto">
                        <button
                          type="button"
                          onClick={() => setVerifyingRecordId(null)}
                          className="px-3.5 py-2 text-xs font-semibold rounded-lg border border-brand-border text-brand-text cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg bg-brand-primary text-white hover:bg-brand-secondary transition-colors cursor-pointer"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                          Verify & Confirm Transaction
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="p-4 rounded-xl bg-red-50 border border-red-200 space-y-3 text-xs">
                    <span className="font-bold text-brand-error block">
                      Specify Reason for Rejecting Verification
                    </span>
                    <input
                      type="text"
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="e.g., Moisture mismatch, quantity discrepancy..."
                      className="w-full px-3 py-2 rounded-lg border border-red-300 bg-white text-brand-text focus:outline-none"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setIsRejectingMode(false)}
                        className="px-3 py-1.5 rounded-lg border border-brand-border bg-white text-brand-text font-semibold cursor-pointer"
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          handleRejectSubmit(verifyingRecord, rejectReason)
                        }
                        className="px-3.5 py-1.5 rounded-lg bg-brand-error text-white font-bold cursor-pointer"
                      >
                        Confirm Rejection
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-2 text-xs">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5 text-brand-success" />
                  <span>Transaction Confirmed & Synced!</span>
                </div>
                <p>
                  OTP for <strong>{verifyingRecord.transactionId}</strong> was
                  verified on{' '}
                  <strong>{verifyingRecord.confirmationDate}</strong>. Inventory
                  and Financial Ledger have been updated automatically.
                </p>
                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setVerifyingRecordId(null)}
                    className="px-4 py-2 rounded-lg bg-brand-primary text-white font-bold cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </form>
        )}
      </VendorModal>

      {/* TRANSACTION DETAILS & ATTEMPT HISTORY MODAL */}
      <VendorModal
        isOpen={Boolean(detailsRecord)}
        onClose={() => setDetailsRecordId(null)}
        title={`OTP Audit Trail & Transaction Details – ${detailsRecord?.id || ''}`}
        subtitle={
          detailsRecord
            ? `Linked Transaction: ${detailsRecord.transactionId} | Party: ${detailsRecord.partyName}`
            : ''
        }
        size="lg"
      >
        {detailsRecord && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-brand-background border border-brand-border">
              <div>
                <span className="text-brand-muted block">Transaction ID</span>
                <span className="font-bold text-brand-primary">
                  {detailsRecord.transactionId}
                </span>
              </div>
              <div>
                <span className="text-brand-muted block">Party Name</span>
                <span className="font-semibold text-brand-text">
                  {detailsRecord.partyName} ({detailsRecord.partyId})
                </span>
              </div>
              <div>
                <span className="text-brand-muted block">Party Category</span>
                <VendorStatusBadge status={detailsRecord.partyCategory} />
              </div>
              <div>
                <span className="text-brand-muted block">Mobile Number</span>
                <span className="font-mono font-semibold">
                  {maskMobile(detailsRecord.mobileNumber)}
                </span>
              </div>
              <div>
                <span className="text-brand-muted block">
                  Product & Quantity
                </span>
                <span className="font-semibold">
                  {detailsRecord.product} ({detailsRecord.quantity})
                </span>
              </div>
              <div>
                <span className="text-brand-muted block">Amount</span>
                <span className="font-bold text-brand-primary">
                  {formatCurrency(detailsRecord.amount)}
                </span>
              </div>
              <div>
                <span className="text-brand-muted block">Initiated At</span>
                <span className="font-medium">
                  {detailsRecord.initiatedDate}
                </span>
              </div>
              <div>
                <span className="text-brand-muted block">
                  Confirmation Date
                </span>
                <span className="font-medium">
                  {detailsRecord.confirmationDate || 'Not yet verified'}
                </span>
              </div>
              <div>
                <span className="text-brand-muted block">OTP Status</span>
                <VendorStatusBadge status={detailsRecord.otpStatus} />
              </div>
            </div>

            <div className="p-4 rounded-xl border border-brand-border bg-brand-surface space-y-2.5">
              <h4 className="font-bold text-brand-text flex items-center gap-1.5">
                <History className="w-4 h-4 text-brand-primary" />
                OTP Verification Attempt Log ({detailsRecord.attempts || 0} /{' '}
                {detailsRecord.maxAttempts || 3} Attempts)
              </h4>

              <div className="space-y-2">
                {(detailsRecord.attemptHistory || []).map((log, i) => (
                  <div
                    key={i}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 py-2 border-b last:border-b-0 border-brand-border"
                  >
                    <div className="flex items-center gap-2">
                      <VendorStatusBadge status={log.status} />
                      <span className="font-medium text-brand-text">
                        {log.note}
                      </span>
                    </div>
                    <span className="font-mono text-[11px] text-brand-muted">
                      {log.timestamp}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </VendorModal>
    </div>
  );
}


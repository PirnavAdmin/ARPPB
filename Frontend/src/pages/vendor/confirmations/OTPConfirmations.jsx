import { useState, useMemo } from 'react';
import {
  ShieldCheck,
  Clock,
  CheckCircle2,
  AlertTriangle,
  KeyRound,
  RefreshCw,
  History,
} from 'lucide-react';
import { useVendor } from '../../../hooks/useVendor';
import { useDebounce } from '../../../hooks/useDebounce';
import { usePagination } from '../../../hooks/usePagination';
import { formatCurrency, maskMobile } from '../../../utils/formatCurrency';
import { isDateInRange } from '../../../utils/formatDate';
import { OTP_STATUSES } from '../../../utils/constants';
import { exportToCSV } from '../../../utils/exportUtils';
import VendorPageHeader from '../VendorPageHeader';
import VendorStatCard from '../VendorStatCard';
import VendorSearch from '../VendorSearch';
import VendorFilters from '../VendorFilters';
import VendorPagination from '../VendorPagination';
import VendorModal from '../VendorModal';
import VendorStatusBadge from '../VendorStatusBadge';
import VendorExportMenu from '../VendorExportMenu';
import FarmerConfirmations from './FarmerConfirmations';
import MiddlemanConfirmations from './MiddlemanConfirmations';
import CustomerConfirmations from './CustomerConfirmations';

const TABS = [
  { id: 'Farmer', label: 'Farmer Confirmations' },
  { id: 'Middleman', label: 'Middleman Confirmations' },
  { id: 'Customer', label: 'Customer Confirmations' },
  { id: 'All', label: 'All Confirmations' },
];

export default function OTPConfirmations() {
  const {
    confirmations,
    verifyTransactionOtp,
    resendTransactionOtp,
  } = useVendor();

  const [activeTab, setActiveTab] = useState('Farmer');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 200);

  const [filters, setFilters] = useState({
    category: 'All',
    otpStatus: 'All',
    datePreset: 'All Time',
  });

  // Verify Modal State
  const [verifyingRecordId, setVerifyingRecordId] = useState(null);
  const [otpInput, setOtpInput] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState(null);

  // Details & Attempt History Modal State
  const [detailsRecordId, setDetailsRecordId] = useState(null);

  const verifyingRecord = useMemo(
    () => confirmations.find((c) => c.id === verifyingRecordId) || null,
    [confirmations, verifyingRecordId]
  );

  const detailsRecord = useMemo(
    () => confirmations.find((c) => c.id === detailsRecordId) || null,
    [confirmations, detailsRecordId]
  );

  // Summary Stats
  const stats = useMemo(() => {
    const pending = confirmations.filter(
      (c) => c.otpStatus === 'Pending' || c.otpStatus === 'Sent'
    ).length;
    const verified = confirmations.filter((c) => c.otpStatus === 'Verified').length;
    const failedOrExpired = confirmations.filter(
      (c) => c.otpStatus === 'Failed' || c.otpStatus === 'Expired'
    ).length;

    const farmerCount = confirmations.filter((c) => c.partyCategory === 'Farmer').length;
    const middlemanCount = confirmations.filter(
      (c) => c.partyCategory === 'Middleman'
    ).length;
    const customerCount = confirmations.filter(
      (c) => c.partyCategory === 'Customer'
    ).length;

    return {
      total: confirmations.length,
      pending,
      verified,
      failedOrExpired,
      countsByTab: {
        Farmer: farmerCount,
        Middleman: middlemanCount,
        Customer: customerCount,
        All: confirmations.length,
      },
    };
  }, [confirmations]);

  // Filtered Confirmations
  const filteredRecords = useMemo(() => {
    return confirmations.filter((c) => {
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
          c.product,
          c.transactionType,
        ]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(q));
        if (!match) return false;
      }

      if (filters.datePreset !== 'All Time') {
        const dateOnly = String(c.initiatedDate || c.confirmationDate || '').slice(0, 10);
        if (
          dateOnly &&
          !isDateInRange(dateOnly, filters.datePreset, '', '', '2026-11-05')
        ) {
          return false;
        }
      }

      return true;
    });
  }, [confirmations, activeTab, filters, debouncedSearch]);

  const pagination = usePagination(filteredRecords, 10);

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
  };

  const handleVerifySubmit = (e) => {
    e.preventDefault();
    if (!verifyingRecord) return;
    const res = verifyTransactionOtp({
      otpId: verifyingRecord.id,
      transactionId: verifyingRecord.transactionId,
      enteredCode: otpInput,
    });
    setFeedbackMsg(res);
  };

  const handleResendOtp = (otpId) => {
    const newCode = resendTransactionOtp(otpId);
    if (newCode && verifyingRecordId === otpId) {
      setOtpInput(newCode);
      setFeedbackMsg({
        success: true,
        isResend: true,
        message: `New OTP ${newCode} generated and sent.`,
      });
    }
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
        { key: 'confirmationDate', label: 'Confirmation Date' },
        { key: 'expiryTime', label: 'Expiry Time' },
      ],
      'Vendor_OTP_Confirmations_Log'
    );
  };

  const filterConfig = [
    {
      key: 'category',
      label: 'Party Category',
      value: filters.category,
      options: [
        { label: 'All Categories', value: 'All' },
        { label: 'Farmer', value: 'Farmer' },
        { label: 'Middleman', value: 'Middleman' },
        { label: 'Customer', value: 'Customer' },
      ],
    },
    {
      key: 'otpStatus',
      label: 'OTP Status',
      value: filters.otpStatus,
      options: [
        { label: 'All OTP Status', value: 'All' },
        ...OTP_STATUSES.map((st) => ({ label: st, value: st })),
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

  return (
    <div className="space-y-6">
      <VendorPageHeader
        title="OTP Confirmations & Transaction Security"
        subtitle="Multi-party OTP verification center for Farmer Purchases, Middleman Purchases, and Customer Sales Orders"
        badge={`${stats.pending} Pending Verification`}
        actions={
          <VendorExportMenu
            onExportCSV={handleExportCSV}
            label="Export OTP Audit Log"
          />
        }
      />

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <VendorStatCard
          title="Total OTP Requests"
          value={stats.total}
          subtitle="Across Farmers, Middlemen & Customers"
          icon={ShieldCheck}
        />
        <VendorStatCard
          title="Pending / Sent OTPs"
          value={stats.pending}
          subtitle="Awaiting party OTP entry"
          icon={Clock}
          highlight
        />
        <VendorStatCard
          title="Verified Transactions"
          value={stats.verified}
          subtitle="Confirmed & posted to inventory/ledger"
          icon={CheckCircle2}
        />
        <VendorStatCard
          title="Failed / Expired OTPs"
          value={stats.failedOrExpired}
          subtitle="Use Resend OTP to re-initiate"
          icon={AlertTriangle}
        />
      </div>

      {/* 3 Category Tabs (+ All) */}
      <div className="bg-brand-surface border border-brand-border rounded-xl p-2 flex flex-wrap items-center gap-2 shadow-xs">
        {TABS.map((tab) => {
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
              onChange={setSearchQuery}
              placeholder="Search by Transaction ID (PUR-/SALE-) or Party Name..."
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

      {/* Tab Content Table */}
      <div className="bg-brand-surface border border-brand-border rounded-xl overflow-hidden shadow-xs">
        {activeTab === 'Farmer' && (
          <FarmerConfirmations
            records={pagination.paginatedData}
            onOpenVerifyModal={handleOpenVerifyModal}
            onResendOtp={handleResendOtp}
            onViewDetails={(r) => setDetailsRecordId(r.id)}
          />
        )}
        {activeTab === 'Middleman' && (
          <MiddlemanConfirmations
            records={pagination.paginatedData}
            onOpenVerifyModal={handleOpenVerifyModal}
            onResendOtp={handleResendOtp}
            onViewDetails={(r) => setDetailsRecordId(r.id)}
          />
        )}
        {(activeTab === 'Customer' || activeTab === 'All') && (
          <CustomerConfirmations
            records={pagination.paginatedData}
            onOpenVerifyModal={handleOpenVerifyModal}
            onResendOtp={handleResendOtp}
            onViewDetails={(r) => setDetailsRecordId(r.id)}
          />
        )}

        <VendorPagination {...pagination} />
      </div>

      {/* ENTER & VERIFY OTP MODAL */}
      <VendorModal
        isOpen={Boolean(verifyingRecord)}
        onClose={() => {
          setVerifyingRecordId(null);
          setFeedbackMsg(null);
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
                  <span className="text-brand-muted block">Product & Quantity</span>
                  <span className="font-semibold text-brand-text">
                    {verifyingRecord.product} ({verifyingRecord.quantity})
                  </span>
                </div>
                <div>
                  <span className="text-brand-muted block">Transaction Amount</span>
                  <span className="font-bold text-brand-primary">
                    {formatCurrency(verifyingRecord.amount)}
                  </span>
                </div>
                <div>
                  <span className="text-brand-muted block">Attempts Used</span>
                  <span className="font-semibold">
                    {verifyingRecord.attempts || 0} / {verifyingRecord.maxAttempts || 3}
                  </span>
                </div>
                <div>
                  <span className="text-brand-muted block">Expiry Time</span>
                  <span className="font-semibold">{verifyingRecord.expiryTime}</span>
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

            {verifyingRecord.otpStatus !== 'Verified' ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-brand-text mb-1">
                    Enter 6-Digit OTP Received by {verifyingRecord.partyCategory}
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
                      onClick={() => setOtpInput(verifyingRecord.demoOtpCode)}
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

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => handleResendOtp(verifyingRecord.id)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-primary hover:underline cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Resend Fresh OTP (Resets Attempts & Expiry)
                  </button>

                  <div className="flex gap-2">
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
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-2 text-xs">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5 text-brand-success" />
                  <span>Transaction Confirmed & Synced!</span>
                </div>
                <p>
                  OTP for <strong>{verifyingRecord.transactionId}</strong> was verified on{' '}
                  <strong>{verifyingRecord.confirmationDate}</strong>. Inventory and Vendor
                  Ledger have been updated automatically.
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
                <span className="text-brand-muted block">Product & Quantity</span>
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
                <span className="font-medium">{detailsRecord.initiatedDate}</span>
              </div>
              <div>
                <span className="text-brand-muted block">Confirmation Date</span>
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
                      <span className="font-medium text-brand-text">{log.note}</span>
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


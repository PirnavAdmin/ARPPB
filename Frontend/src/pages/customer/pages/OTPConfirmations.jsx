import { useState, useMemo, useEffect } from 'react';
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
  Lock,
} from 'lucide-react';
import { useCustomer } from '../context/useCustomer';
import { useDebounce } from '../../../hooks/useDebounce';
import { usePagination } from '../../../hooks/usePagination';
import { formatCurrency } from '../../../utils/formatCurrency';
import CustomerPageHeader from '../components/CustomerPageHeader';
import CustomerStatCard from '../components/CustomerStatCard';
import CustomerSearch from '../components/CustomerSearch';
import CustomerFilters from '../components/CustomerFilters';
import CustomerOrderTable from '../components/CustomerOrderTable';
import CustomerPagination from '../components/CustomerPagination';
import CustomerModal from '../components/CustomerModal';
import CustomerStatusBadge from '../components/CustomerStatusBadge';

function formatCountdown(seconds) {
  const safe = Math.max(0, Number(seconds) || 0);
  const mins = String(Math.floor(safe / 60)).padStart(2, '0');
  const secs = String(safe % 60).padStart(2, '0');
  return `${mins}:${secs}`;
}

export function OTPConfirmations() {
  const {
    profile,
    confirmations,
    verifyOtpConfirmation,
    expireOtpConfirmation,
    resendOtpConfirmation,
    rejectOtpConfirmation,
  } = useCustomer();

  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 200);
  const [otpStatusFilter, setOtpStatusFilter] = useState('All');

  // Verify / Reject Modal State
  const [verifyingId, setVerifyingId] = useState(null);
  const [otpInput, setOtpInput] = useState('');
  const [expirySeconds, setExpirySeconds] = useState(0);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [isRejectingMode, setIsRejectingMode] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  // Audit Details Modal
  const [detailsId, setDetailsId] = useState(null);

  const verifyingRecord = useMemo(
    () => confirmations.find((c) => c.id === verifyingId) || null,
    [confirmations, verifyingId]
  );

  const detailsRecord = useMemo(
    () => confirmations.find((c) => c.id === detailsId) || null,
    [confirmations, detailsId]
  );

  const isReceivingPartyAuthorized = Boolean(
    verifyingRecord &&
      verifyingRecord.receivingPartyRole === 'Customer' &&
      verifyingRecord.receivingPartyId === profile.customerId
  );

  // Live OTP expiry countdown while Verify Modal is open
  useEffect(() => {
    if (!verifyingRecord) return undefined;
    if (
      verifyingRecord.otpStatus !== 'Pending' &&
      verifyingRecord.otpStatus !== 'Sent'
    ) {
      return undefined;
    }

    const timer = setInterval(() => {
      setExpirySeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          expireOtpConfirmation(verifyingRecord.id);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [verifyingRecord, expireOtpConfirmation]);

  // Live Resend OTP cooldown countdown
  useEffect(() => {
    if (resendCooldown <= 0) return undefined;
    const timer = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const stats = useMemo(() => {
    const total = confirmations.length;
    const pending = confirmations.filter(
      (c) => c.otpStatus === 'Pending' || c.otpStatus === 'Sent'
    ).length;
    const confirmed = confirmations.filter(
      (c) => c.otpStatus === 'Confirmed' || c.otpStatus === 'Verified'
    ).length;
    const failedOrOther = confirmations.filter((c) =>
      ['Failed', 'Expired', 'Rejected'].includes(c.otpStatus)
    ).length;
    return { total, pending, confirmed, failedOrOther };
  }, [confirmations]);

  const filteredConfirmations = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    return confirmations.filter((c) => {
      if (activeTab === 'Pending' && !['Pending', 'Sent'].includes(c.otpStatus)) {
        return false;
      }
      if (activeTab === 'Confirmed' && c.otpStatus !== 'Confirmed') {
        return false;
      }
      if (
        activeTab === 'Action Needed' &&
        !['Pending', 'Sent', 'Expired', 'Failed'].includes(c.otpStatus)
      ) {
        return false;
      }
      if (otpStatusFilter !== 'All' && c.otpStatus !== otpStatusFilter) {
        return false;
      }
      if (q) {
        const hit = [
          c.id,
          c.transactionId,
          c.orderId,
          c.product,
        ]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(q));
        if (!hit) return false;
      }
      return true;
    });
  }, [confirmations, activeTab, otpStatusFilter, debouncedSearch]);

  const pagination = usePagination(filteredConfirmations, 8);

  const openVerifyModal = (record, rejectDirectly = false) => {
    setVerifyingId(record.id);
    setOtpInput('');
    setExpirySeconds(
      record.otpStatus === 'Expired'
        ? 0
        : Math.max(30, Number(record.expirySecondsRemaining) || 240)
    );
    setResendCooldown(0);
    setFeedback(null);
    setIsRejectingMode(rejectDirectly);
    setRejectReason('');
  };

  const handleConfirmPurchase = (e) => {
    e.preventDefault();
    if (!verifyingRecord) return;
    const result = verifyOtpConfirmation(verifyingRecord.id, otpInput);
    setFeedback(result);
    if (result.success) {
      setExpirySeconds(0);
    }
  };

  const handleResendOtp = (record) => {
    if (!record || resendCooldown > 0) return;
    const newCode = resendOtpConfirmation(record.id);
    setResendCooldown(30);
    if (verifyingId === record.id) {
      setExpirySeconds(300);
      setOtpInput('');
      setIsRejectingMode(false);
      setFeedback({
        success: true,
        isInfo: true,
        message: `New frontend demo OTP generated (${newCode}). Timer reset to 05:00 and attempts cleared.`,
      });
    }
  };

  const handleRejectPurchase = (record, reason) => {
    if (!record) return;
    const res = rejectOtpConfirmation(
      record.id,
      reason.trim() || 'Purchase declined by customer'
    );
    if (res.success) {
      setVerifyingId(null);
      setIsRejectingMode(false);
      setRejectReason('');
      setFeedback(null);
    }
  };

  const handleResetFilters = () => {
    setActiveTab('All');
    setSearchQuery('');
    setOtpStatusFilter('All');
    pagination.goToPage(1);
  };

  const filterConfig = [
    {
      key: 'otpStatus',
      label: 'OTP Status',
      value: otpStatusFilter,
      onChange: (val) => {
        setOtpStatusFilter(val);
        pagination.goToPage(1);
      },
      options: [
        { label: 'All OTP Status', value: 'All' },
        { label: 'Pending', value: 'Pending' },
        { label: 'Confirmed', value: 'Confirmed' },
        { label: 'Expired', value: 'Expired' },
        { label: 'Failed', value: 'Failed' },
        { label: 'Rejected', value: 'Rejected' },
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
          <span className="font-bold text-[#0F766E] block">{row.transactionId}</span>
          <span className="text-[11px] font-mono text-[#64748B]">
            {row.orderId || row.id}
          </span>
        </div>
      ),
    },
    {
      key: 'product',
      label: 'Product',
      sortable: true,
      render: (row) => <span className="font-medium text-[#0F172A]">{row.product}</span>,
    },
    {
      key: 'quantity',
      label: 'Quantity',
      render: (row) => <span className="font-semibold">{row.quantity}</span>,
    },
    {
      key: 'unitPrice',
      label: 'Unit Price',
      align: 'right',
      sortable: true,
      render: (row) => <span>{formatCurrency(row.unitPrice)}</span>,
    },
    {
      key: 'totalAmount',
      label: 'Total Amount',
      align: 'right',
      sortable: true,
      render: (row) => (
        <span className="font-bold text-[#0F766E]">
          {formatCurrency(row.totalAmount)}
        </span>
      ),
    },
    {
      key: 'requestDate',
      label: 'Request Date',
      render: (row) => <span className="text-xs text-[#64748B]">{row.requestDate}</span>,
    },
    {
      key: 'otpStatus',
      label: 'OTP Status',
      render: (row) => {
        const isFinal = row.otpStatus === 'Confirmed' || row.otpStatus === 'Rejected';
        return (
          <div className="space-y-1">
            <CustomerStatusBadge status={row.otpStatus} size="xs" />
            {!isFinal && (
              <span className="block text-[10px] font-mono font-bold text-[#0F766E]">
                Demo OTP: {row.demoOtpCode}
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: 'actions',
      label: 'Actions',
      align: 'right',
      render: (row) => {
        const isPendingOrRetryable = [
          'Pending',
          'Sent',
          'Expired',
          'Failed',
        ].includes(row.otpStatus);

        return (
          <div className="inline-flex items-center justify-end gap-1.5 whitespace-nowrap">
            {isPendingOrRetryable && (
              <>
                <button
                  type="button"
                  onClick={() => openVerifyModal(row, false)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg bg-[#0F766E] text-white hover:bg-[#115E59] transition-colors cursor-pointer"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Enter OTP</span>
                </button>
                <button
                  type="button"
                  onClick={() => openVerifyModal(row, true)}
                  title="Reject Purchase"
                  aria-label={`Reject ${row.transactionId}`}
                  className="p-1.5 rounded-lg border border-red-200 text-[#DC2626] hover:bg-[#FEE2E2] transition-colors cursor-pointer"
                >
                  <XCircle className="w-3.5 h-3.5" />
                </button>
              </>
            )}
            <button
              type="button"
              onClick={() => setDetailsId(row.id)}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-[#CCFBF1] text-[#0F766E] hover:bg-[#0F766E] hover:text-white transition-colors cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>View Details</span>
            </button>
          </div>
        );
      },
    },
  ];

  const isCompletedModal = verifyingRecord?.otpStatus === 'Confirmed';

  return (
    <div className="space-y-6">
      <CustomerPageHeader
        title="OTP Confirmations"
        subtitle="Customer-side transaction verification center. Only the receiving customer may authorize or decline pending purchase orders."
        icon={ShieldCheck}
        badge={`${stats.pending} Pending`}
      />

      {/* Receiving Party Security Notice */}
      <div className="p-3.5 rounded-xl bg-[#CCFBF1]/45 border border-[#14B8A6]/40 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-[#0F766E] font-semibold">
          <Lock className="w-4 h-4 shrink-0" />
          <span>
            Receiving Party Enforcement Active: Authenticated as{' '}
            <strong>{profile.fullName}</strong> ({profile.customerId}). Demo codes below simulate frontend-only OTP validation (no external SMS sent).
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <CustomerStatCard
          title="Total OTP Requests"
          value={stats.total}
          description="All customer OTP requests"
          icon={ShieldCheck}
        />
        <CustomerStatCard
          title="Pending Confirmation"
          value={stats.pending}
          description="Awaiting customer OTP entry"
          icon={Clock}
        />
        <CustomerStatCard
          title="Confirmed Purchases"
          value={stats.confirmed}
          description="Verified & synced to history"
          icon={CheckCircle2}
        />
        <CustomerStatCard
          title="Expired / Failed / Rejected"
          value={stats.failedOrOther}
          description="Requires resend or closed"
          icon={AlertTriangle}
        />
      </div>

      {/* Quick Filter Tabs */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-2 flex flex-wrap items-center gap-2 shadow-xs">
        {[
          { id: 'All', label: 'All Requests', count: confirmations.length },
          { id: 'Pending', label: 'Pending OTP', count: stats.pending },
          { id: 'Confirmed', label: 'Confirmed', count: stats.confirmed },
          { id: 'Action Needed', label: 'Action / Resend', count: stats.pending + confirmations.filter((c) => c.otpStatus === 'Expired' || c.otpStatus === 'Failed').length },
        ].map((tab) => {
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
                  ? 'bg-[#0F766E] text-white shadow-xs'
                  : 'text-[#64748B] hover:bg-[#CCFBF1]/50 hover:text-[#0F766E]'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] ${
                  active ? 'bg-white/20 text-white' : 'bg-[#F8FAFC] text-[#0F172A]'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search & Filters */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 space-y-4 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="w-full md:w-96">
            <CustomerSearch
              value={searchQuery}
              onChange={(val) => {
                setSearchQuery(val);
                pagination.goToPage(1);
              }}
              placeholder="Search Transaction ID, Order ID, or Product..."
            />
          </div>
          <div className="text-xs text-[#64748B]">
            Showing <strong>{filteredConfirmations.length}</strong> confirmation records
          </div>
        </div>

        <CustomerFilters
          filters={filterConfig}
          hasExtraActive={Boolean(searchQuery.trim() || activeTab !== 'All')}
          onReset={handleResetFilters}
        />
      </div>

      {/* Table */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden shadow-xs">
        <CustomerOrderTable
          columns={columns}
          data={pagination.paginatedData}
          rowKey="id"
          enablePagination={false}
          emptyTitle="No OTP Confirmations Found"
          emptyDescription="No confirmation records matched your selected tab or filter criteria."
          emptyIcon={ShieldCheck}
          onResetFilters={handleResetFilters}
        />
        <CustomerPagination {...pagination} pageSizeOptions={[5, 8, 15, 25]} />
      </div>

      {/* ENTER OTP / CONFIRM OR REJECT MODAL */}
      <CustomerModal
        isOpen={Boolean(verifyingRecord)}
        onClose={() => {
          setVerifyingId(null);
          setFeedback(null);
          setIsRejectingMode(false);
        }}
        title={`Verify Customer Purchase OTP – ${verifyingRecord?.transactionId || ''}`}
        subtitle={
          verifyingRecord
            ? `Order: ${verifyingRecord.orderId || verifyingRecord.transactionId} • Receiving Customer: ${profile.customerId}`
            : ''
        }
        size="md"
      >
        {verifyingRecord && (
          <form onSubmit={handleConfirmPurchase} className="space-y-4 text-xs">
            {/* Transaction Summary & Countdown */}
            <div className="p-4 rounded-xl bg-[#CCFBF1]/35 border border-[#14B8A6]/40 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#0F766E] uppercase">
                  {verifyingRecord.product}
                </span>
                <CustomerStatusBadge status={verifyingRecord.otpStatus} size="xs" />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <span className="text-[#64748B] block">Quantity & Unit Price</span>
                  <span className="font-semibold text-[#0F172A]">
                    {verifyingRecord.quantity} @ {formatCurrency(verifyingRecord.unitPrice)}
                  </span>
                </div>
                <div>
                  <span className="text-[#64748B] block">Total Amount</span>
                  <span className="font-bold text-[#0F766E]">
                    {formatCurrency(verifyingRecord.totalAmount)}
                  </span>
                </div>
                <div>
                  <span className="text-[#64748B] block">Attempts Used</span>
                  <span className="font-semibold text-[#0F172A]">
                    {verifyingRecord.attemptsUsed || 0} / {verifyingRecord.maxAttempts || 3}
                  </span>
                </div>
                <div>
                  <span className="text-[#64748B] block">OTP Expiry Countdown</span>
                  <span
                    className={`font-mono font-bold ${
                      expirySeconds <= 30 && expirySeconds > 0
                        ? 'text-[#DC2626]'
                        : 'text-[#0F766E]'
                    }`}
                  >
                    {verifyingRecord.otpStatus === 'Confirmed'
                      ? 'Verified'
                      : verifyingRecord.otpStatus === 'Expired'
                      ? '00:00 (Expired)'
                      : formatCountdown(expirySeconds)}
                  </span>
                </div>
              </div>

              {verifyingRecord.otpStatus !== 'Confirmed' &&
                verifyingRecord.otpStatus !== 'Rejected' && (
                  <div className="pt-2 border-t border-[#14B8A6]/25 flex items-center justify-between">
                    <span className="text-[#64748B] font-medium">
                      Frontend Mock OTP Code:
                    </span>
                    <span className="px-3 py-1 rounded-md bg-[#0F766E] text-white font-mono text-sm font-extrabold tracking-widest">
                      {verifyingRecord.demoOtpCode}
                    </span>
                  </div>
                )}
            </div>

            {!isReceivingPartyAuthorized && (
              <div className="p-3 rounded-xl bg-[#FEE2E2] border border-[#DC2626]/20 text-[#DC2626] font-semibold">
                Only the receiving party ({verifyingRecord.receivingPartyId}) may confirm or reject this transaction.
              </div>
            )}

            {isCompletedModal ? (
              <div className="p-4 rounded-xl bg-[#DCFCE7] border border-[#16A34A]/30 text-[#0F172A] space-y-2">
                <div className="flex items-center gap-2 font-bold text-sm text-[#15803D]">
                  <CheckCircle2 className="w-5 h-5 text-[#16A34A] shrink-0" />
                  <span>Transaction Confirmed Successfully!</span>
                </div>
                <p className="font-medium text-[#0F172A]">
                  Your payment is expected to be credited within 3 working days.
                </p>
                <p className="text-[11px] text-[#64748B]">
                  Linked order {verifyingRecord.orderId || verifyingRecord.transactionId} and Purchase History have been updated.
                </p>
                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setVerifyingId(null)}
                    className="px-4 py-2 rounded-xl bg-[#0F766E] text-white font-bold hover:bg-[#115E59] cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : verifyingRecord.otpStatus === 'Rejected' ? (
              <div className="p-4 rounded-xl bg-[#FEE2E2] border border-[#DC2626]/20 text-[#DC2626] space-y-2">
                <p className="font-bold">Purchase Rejected</p>
                <p>{verifyingRecord.rejectionReason || 'Verification declined by customer.'}</p>
              </div>
            ) : !isRejectingMode ? (
              <div className="space-y-3">
                <div>
                  <label
                    htmlFor="customer-otp-code-input"
                    className="block text-xs font-bold text-[#0F172A] mb-1.5"
                  >
                    Enter 6-Digit OTP to Confirm Purchase
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      id="customer-otp-code-input"
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={otpInput}
                      onChange={(e) =>
                        setOtpInput(e.target.value.replace(/\D/g, '').slice(0, 6))
                      }
                      placeholder="Enter 6-digit OTP"
                      disabled={
                        !isReceivingPartyAuthorized ||
                        verifyingRecord.otpStatus === 'Expired' ||
                        verifyingRecord.otpStatus === 'Failed'
                      }
                      className="flex-1 px-3 py-2 text-sm font-mono font-bold tracking-[0.25em] rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0F766E] disabled:bg-slate-100"
                    />
                    <button
                      type="button"
                      disabled={
                        !isReceivingPartyAuthorized ||
                        verifyingRecord.otpStatus === 'Expired' ||
                        verifyingRecord.otpStatus === 'Failed'
                      }
                      onClick={() => setOtpInput(verifyingRecord.demoOtpCode)}
                      className="px-3 py-2 text-xs font-semibold rounded-lg bg-[#CCFBF1] text-[#0F766E] hover:bg-[#14B8A6] hover:text-white disabled:opacity-40 transition-colors cursor-pointer"
                    >
                      Auto-Fill Demo OTP
                    </button>
                  </div>
                </div>

                {feedback && !feedback.success && (
                  <div className="p-3 rounded-lg bg-[#FEE2E2] border border-[#DC2626]/20 text-[#DC2626] font-semibold">
                    {feedback.message}
                  </div>
                )}

                {feedback && feedback.isInfo && (
                  <div className="p-3 rounded-lg bg-[#CCFBF1]/50 border border-[#14B8A6]/30 text-[#0F766E] font-semibold">
                    {feedback.message}
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#E2E8F0]">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      disabled={resendCooldown > 0}
                      onClick={() => handleResendOtp(verifyingRecord)}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0F766E] hover:underline disabled:opacity-50 disabled:no-underline cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>
                        {resendCooldown > 0
                          ? `Resend OTP (${resendCooldown}s)`
                          : 'Resend OTP'}
                      </span>
                    </button>

                    <button
                      type="button"
                      disabled={!isReceivingPartyAuthorized}
                      onClick={() => setIsRejectingMode(true)}
                      className="inline-flex items-center gap-1 text-xs font-bold text-[#DC2626] hover:underline cursor-pointer"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Reject Purchase</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2 ml-auto">
                    <button
                      type="button"
                      onClick={() => setVerifyingId(null)}
                      className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-[#E2E8F0] bg-white text-[#0F172A] hover:bg-[#F8FAFC] cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={
                        !isReceivingPartyAuthorized ||
                        verifyingRecord.otpStatus === 'Expired' ||
                        verifyingRecord.otpStatus === 'Failed' ||
                        otpInput.length !== 6
                      }
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-[#0F766E] text-white hover:bg-[#115E59] disabled:opacity-45 cursor-pointer"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>Confirm Purchase</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-[#FEE2E2]/60 border border-[#DC2626]/20 space-y-3">
                <span className="font-bold text-[#DC2626] block">
                  Reject Purchase Confirmation ({verifyingRecord.transactionId})
                </span>
                <input
                  type="text"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Enter reason (e.g., quality discrepancy, rate mismatch)..."
                  className="w-full px-3 py-2 rounded-lg border border-red-300 bg-white text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#DC2626]/30"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsRejectingMode(false)}
                    className="px-3 py-1.5 rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A] font-semibold cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRejectPurchase(verifyingRecord, rejectReason)}
                    className="px-3.5 py-1.5 rounded-lg bg-[#DC2626] text-white font-bold hover:bg-red-700 cursor-pointer"
                  >
                    Confirm Rejection
                  </button>
                </div>
              </div>
            )}
          </form>
        )}
      </CustomerModal>

      {/* TRANSACTION DETAILS & ATTEMPT AUDIT LOG MODAL */}
      <CustomerModal
        isOpen={Boolean(detailsRecord)}
        onClose={() => setDetailsId(null)}
        title={`Confirmation Audit & Details – ${detailsRecord?.transactionId || ''}`}
        subtitle={
          detailsRecord
            ? `Order: ${detailsRecord.orderId} | Transaction: ${detailsRecord.transactionId}`
            : ''
        }
        size="lg"
        footer={
          <button
            type="button"
            onClick={() => setDetailsId(null)}
            className="px-4 py-2 text-xs font-semibold rounded-xl border border-[#E2E8F0] bg-white text-[#0F172A] hover:bg-[#F8FAFC] cursor-pointer"
          >
            Close
          </button>
        }
      >
        {detailsRecord && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
              <div>
                <span className="text-[#64748B] block">Transaction ID</span>
                <span className="font-bold text-[#0F766E]">
                  {detailsRecord.transactionId}
                </span>
              </div>
              <div>
                <span className="text-[#64748B] block">Order Reference</span>
                <span className="font-semibold text-[#0F172A]">
                  {detailsRecord.orderId || '—'}
                </span>
              </div>
              <div>
                <span className="text-[#64748B] block">Product &amp; Quantity</span>
                <span className="font-semibold text-[#0F172A]">
                  {detailsRecord.product} ({detailsRecord.quantity})
                </span>
              </div>
              <div>
                <span className="text-[#64748B] block">Unit Price</span>
                <span className="font-semibold">
                  {formatCurrency(detailsRecord.unitPrice)}
                </span>
              </div>
              <div>
                <span className="text-[#64748B] block">Total Amount</span>
                <span className="font-bold text-[#0F766E]">
                  {formatCurrency(detailsRecord.totalAmount)}
                </span>
              </div>
              <div>
                <span className="text-[#64748B] block">Request Date</span>
                <span className="font-medium">{detailsRecord.requestDate}</span>
              </div>
              <div>
                <span className="text-[#64748B] block">Receiving Customer ID</span>
                <span className="font-mono font-bold text-[#0F172A]">
                  {detailsRecord.receivingPartyId}
                </span>
              </div>
              <div>
                <span className="text-[#64748B] block">OTP Status</span>
                <div className="mt-0.5">
                  <CustomerStatusBadge status={detailsRecord.otpStatus} size="xs" />
                </div>
              </div>
            </div>

            {detailsRecord.otpStatus === 'Confirmed' && (
              <div className="p-3.5 rounded-xl bg-[#DCFCE7] border border-[#16A34A]/30 text-[#15803D] space-y-1">
                <p className="font-bold">Transaction Confirmed Successfully!</p>
                <p className="text-[#0F172A]">
                  Your payment is expected to be credited within 3 working days.
                </p>
              </div>
            )}

            <div className="p-4 rounded-xl border border-[#E2E8F0] bg-white space-y-2.5">
              <h4 className="font-bold text-[#0F172A] flex items-center gap-1.5">
                <History className="w-4 h-4 text-[#0F766E]" />
                OTP Attempt Log ({detailsRecord.attemptsUsed || 0} /{' '}
                {detailsRecord.maxAttempts || 3} Attempts)
              </h4>
              <div className="space-y-2">
                {(detailsRecord.attemptHistory || []).map((log, i) => (
                  <div
                    key={`${log.status}-${i}`}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 py-2 border-b last:border-b-0 border-[#E2E8F0]"
                  >
                    <div className="flex items-center gap-2">
                      <CustomerStatusBadge status={log.status} size="xs" />
                      <span className="font-medium text-[#0F172A]">{log.note}</span>
                    </div>
                    <span className="font-mono text-[11px] text-[#64748B]">
                      {log.timestamp}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </CustomerModal>
    </div>
  );
}

export default OTPConfirmations;


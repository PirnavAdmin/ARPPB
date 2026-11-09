import { useState, useMemo } from 'react';
import {
  Phone,
  Mail,
  MapPin,
  Landmark,
  Handshake,
  FileText,
  Eye,
  Printer,
  CheckCircle2,
  Send,
  IndianRupee,
  FileSpreadsheet,
  KeyRound,
  Building2,
  ArrowLeft,
} from 'lucide-react';
import { useVendor } from '../../../hooks/useVendor';
import VendorStatusBadge from '../VendorStatusBadge';
import VendorDataTable from '../VendorDataTable';
import PurchaseDetails from '../purchases/PurchaseDetails';
import PurchaseForm from '../purchases/PurchaseForm';
import {
  formatCurrency,
  formatNumber,
  maskIdentifier,
  maskMobileNumber,
} from '../../../utils/formatCurrency';
import { formatDate } from '../../../utils/formatDate';
import { printDocumentSummary } from '../../../utils/exportUtils';

export function MiddlemanDetails({
  middleman,
  purchases = [],
  ledger = [],
  initialTab = 'overview',
  initialPurchaseId = '',
  onEdit,
}) {
  const {
    confirmations,
    verifyTransactionOtp,
    resendTransactionOtp,
    recordFinancialSettlement,
  } = useVendor();

  const [activeTab, setActiveTab] = useState(
    initialPurchaseId ? 'transactions' : initialTab
  );
  const [selectedPurchaseId, setSelectedPurchaseId] = useState(
    initialPurchaseId || ''
  );
  const [otpInputs, setOtpInputs] = useState({});
  const [settlementAmount, setSettlementAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('NEFT / RTGS');

  const midPurchases = useMemo(() => {
    if (!middleman) return [];
    return purchases.filter(
      (p) => p.supplierCategory === 'Middleman' && p.supplierId === middleman.id
    );
  }, [purchases, middleman]);

  const confirmedPurchases = useMemo(
    () => midPurchases.filter((p) => p.status === 'Confirmed'),
    [midPurchases]
  );

  const midLedger = useMemo(() => {
    if (!middleman) return [];
    return ledger.filter((l) => l.partyId === middleman.id);
  }, [ledger, middleman]);

  const midConfirmations = useMemo(() => {
    if (!middleman) return [];
    const purchaseIds = new Set(midPurchases.map((p) => p.id));
    return confirmations.filter(
      (c) => c.partyId === middleman.id || purchaseIds.has(c.transactionId)
    );
  }, [confirmations, middleman, midPurchases]);

  const selectedPurchase = useMemo(
    () =>
      selectedPurchaseId
        ? midPurchases.find((p) => p.id === selectedPurchaseId) || null
        : null,
    [midPurchases, selectedPurchaseId]
  );

  if (!middleman) return null;

  const totalQty = midPurchases.reduce(
    (sum, p) => sum + Number(p.quantity || 0),
    0
  );
  const totalPurchaseAmount = confirmedPurchases.reduce(
    (sum, p) => sum + Number(p.totalAmount || 0),
    0
  );
  const totalPaidAmount = confirmedPurchases.reduce(
    (sum, p) => sum + Number(p.paidAmount || 0),
    0
  );
  const openingBal = Number(middleman.openingBalance || 0);
  const outstandingPayables = Math.max(
    0,
    openingBal + totalPurchaseAmount - totalPaidAmount
  );

  const transactionColumns = [
    {
      key: 'id',
      header: 'Transaction ID',
      sortable: true,
      render: (row) => (
        <button
          type="button"
          onClick={() => setSelectedPurchaseId(row.id)}
          className="font-mono font-bold text-[#0F766E] hover:underline cursor-pointer"
        >
          {row.id}
        </button>
      ),
    },
    {
      key: 'purchaseDate',
      header: 'Date',
      sortable: true,
      render: (row) => (
        <span className="whitespace-nowrap font-medium text-[#172B29]">
          {formatDate(row.purchaseDate)}
        </span>
      ),
    },
    {
      key: 'crop',
      header: 'Product / Raw Material',
      render: (row) => (
        <div>
          <p className="font-bold text-[#172B29]">{row.crop}</p>
          <p className="text-[11px] text-[#64748B]">
            {row.variety} • {row.qualityGrade || 'Standard'}
          </p>
        </div>
      ),
    },
    {
      key: 'quantity',
      header: 'Quantity',
      align: 'right',
      sortable: true,
      render: (row) => (
        <span className="font-semibold text-[#172B29] whitespace-nowrap">
          {formatNumber(row.quantity)} {row.unit}
        </span>
      ),
    },
    {
      key: 'rate',
      header: 'Rate / Unit',
      align: 'right',
      sortable: true,
      render: (row) => (
        <span className="whitespace-nowrap text-[#172B29]">
          {formatCurrency(row.rate)}
        </span>
      ),
    },
    {
      key: 'totalAmount',
      header: 'Total Amount',
      align: 'right',
      sortable: true,
      render: (row) => (
        <span className="font-bold text-[#0F766E] whitespace-nowrap">
          {formatCurrency(row.totalAmount)}
        </span>
      ),
    },
    {
      key: 'paidAmount',
      header: 'Payment Details',
      render: (row) => {
        const due = Math.max(
          0,
          Number(row.totalAmount || 0) - Number(row.paidAmount || 0)
        );
        return (
          <div className="text-xs">
            <VendorStatusBadge status={row.paymentStatus} size="xs" />
            <p className="text-[11px] text-[#64748B] mt-0.5 whitespace-nowrap">
              Paid: {formatCurrency(row.paidAmount)}
              {due > 0 ? ` • Due: ${formatCurrency(due)}` : ''}
            </p>
          </div>
        );
      },
    },
    {
      key: 'otpStatus',
      header: 'OTP Status',
      render: (row) => <VendorStatusBadge status={row.otpStatus} size="xs" />,
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <VendorStatusBadge status={row.status} size="xs" />,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (row) => (
        <div className="inline-flex items-center justify-end gap-1.5 whitespace-nowrap">
          <button
            type="button"
            onClick={() => setSelectedPurchaseId(row.id)}
            title="View Complete Transaction Details"
            className="h-8 inline-flex items-center gap-1.5 px-2.5 rounded-lg text-xs font-semibold bg-[#CCFBF1] text-[#0F766E] border border-[#14B8A6]/30 hover:bg-[#0F766E] hover:text-white transition-colors cursor-pointer shrink-0"
          >
            <Eye className="w-3.5 h-3.5 shrink-0 !max-w-none" />
            <span>Details</span>
          </button>
          <button
            type="button"
            onClick={() =>
              printDocumentSummary(
                `Middleman Purchase Voucher – ${row.id}`,
                `Middleman: ${middleman.businessName} (${middleman.id}) • Date: ${formatDate(row.purchaseDate)}`,
                [
                  {
                    heading: 'Transaction Summary',
                    rows: [
                      ['Transaction ID', row.id],
                      ['Business Name', `${middleman.businessName} (${middleman.id})`],
                      ['Owner', middleman.ownerName],
                      ['Raw Material', `${row.crop} (${row.variety})`],
                      ['Quantity & Rate', `${row.quantity} ${row.unit} @ ${formatCurrency(row.rate)}`],
                      ['Total Amount', formatCurrency(row.totalAmount)],
                      ['Amount Paid', formatCurrency(row.paidAmount)],
                      ['OTP & Status', `${row.otpStatus} / ${row.status}`],
                    ],
                  },
                ]
              )
            }
            title="Print Voucher"
            className="w-8 h-8 inline-flex items-center justify-center shrink-0 rounded-lg border border-[#E2E8F0] bg-white text-[#64748B] hover:bg-[#CCFBF1] hover:text-[#0F766E] transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4 shrink-0 !max-w-none" />
          </button>
        </div>
      ),
    },
  ];

  const ledgerColumns = [
    {
      key: 'id',
      header: 'Voucher ID',
      sortable: true,
      render: (row) => (
        <span className="font-mono font-bold text-[#0F766E]">{row.id}</span>
      ),
    },
    {
      key: 'date',
      header: 'Date',
      sortable: true,
      render: (row) => formatDate(row.date),
    },
    {
      key: 'transactionType',
      header: 'Transaction Type',
      render: (row) => (
        <span className="px-2 py-0.5 rounded-md bg-[#CCFBF1]/70 text-[#0F766E] text-xs font-semibold">
          {row.transactionType}
        </span>
      ),
    },
    {
      key: 'referenceId',
      header: 'Reference ID',
      render: (row) => (
        <span className="font-mono text-xs font-semibold text-[#172B29]">
          {row.referenceId}
        </span>
      ),
    },
    {
      key: 'credit',
      header: 'Payable (Cr)',
      align: 'right',
      render: (row) =>
        row.credit > 0 ? (
          <span className="font-bold text-[#172B29]">
            {formatCurrency(row.credit)}
          </span>
        ) : (
          '—'
        ),
    },
    {
      key: 'debit',
      header: 'Settled (Dr)',
      align: 'right',
      render: (row) =>
        row.debit > 0 ? (
          <span className="font-bold text-[#16A34A]">
            {formatCurrency(row.debit)}
          </span>
        ) : (
          '—'
        ),
    },
    {
      key: 'paymentMode',
      header: 'Payment Mode',
      render: (row) => row.paymentMode || '—',
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <VendorStatusBadge status={row.status} size="xs" />,
    },
  ];

  const handleSettlePayable = (e) => {
    e.preventDefault();
    const targetPurchase = confirmedPurchases.find(
      (p) => Number(p.totalAmount || 0) > Number(p.paidAmount || 0)
    );
    const amt = Number(settlementAmount || outstandingPayables);
    if (amt <= 0) return;
    recordFinancialSettlement({
      settlementType: 'Supplier Payment',
      partyId: middleman.id,
      partyName: middleman.businessName,
      partyCategory: 'Middleman',
      referenceTransactionId: targetPurchase?.id || midPurchases[0]?.id || '',
      amount: Math.min(amt, outstandingPayables),
      paymentMode,
      notes: `Settlement to Middleman ${middleman.businessName} (${middleman.id})`,
    });
    setSettlementAmount('');
  };

  return (
    <div className="space-y-6">
      {/* Top Profile Identity Banner */}
      <div className="p-5 rounded-2xl bg-[#F5FAF8] border border-[#14B8A6]/30 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#0F766E] text-white flex items-center justify-center font-bold text-lg shrink-0 shadow-xs">
            {middleman.businessName?.charAt(0) || 'M'}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="px-2.5 py-0.5 rounded-md bg-[#0F766E] text-white font-mono text-xs font-bold">
                {middleman.id}
              </span>
              <h3 className="text-lg font-bold text-[#172B29]">
                {middleman.businessName}
              </h3>
              <VendorStatusBadge status={middleman.status} size="xs" />
            </div>
            <p className="text-xs text-[#64748B] mt-1">
              Owner: <strong>{middleman.ownerName}</strong> • GSTIN:{' '}
              <strong>{middleman.gstNumber || 'Unregistered'}</strong> • PAN:{' '}
              <strong>{middleman.pan || '—'}</strong> • Registered:{' '}
              <strong>{formatDate(middleman.createdAt)}</strong>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setSelectedPurchaseId('');
              setActiveTab('new-purchase');
            }}
            className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl text-xs font-semibold bg-[#0F766E] text-white hover:bg-[#115E59] transition-colors cursor-pointer shadow-xs"
          >
            <Handshake className="w-4 h-4" />
            <span>Record Purchase</span>
          </button>
          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(middleman)}
              className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl text-xs font-semibold bg-white border border-[#E2E8F0] text-[#0F766E] hover:bg-[#CCFBF1]/60 transition-colors cursor-pointer"
            >
              Edit Profile
            </button>
          )}
        </div>
      </div>

      {/* 4 Profile Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-[#E2E8F0] shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wide text-[#64748B]">
            Total Transactions
          </span>
          <p className="text-xl font-extrabold text-[#0F766E] mt-1">
            {midPurchases.length} ({formatNumber(totalQty)} Qtl)
          </p>
          <span className="text-[11px] text-[#64748B] mt-1 block">
            {confirmedPurchases.length} confirmed bulk lots
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#E2E8F0] shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wide text-[#64748B]">
            Total Transaction Amount
          </span>
          <p className="text-xl font-extrabold text-[#0F766E] mt-1">
            {formatCurrency(totalPurchaseAmount)}
          </p>
          <span className="text-[11px] text-[#64748B] mt-1 block">
            Opening Bal: {formatCurrency(openingBal)}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#E2E8F0] shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wide text-[#64748B]">
            Payments Settled
          </span>
          <p className="text-xl font-extrabold text-[#16A34A] mt-1">
            {formatCurrency(totalPaidAmount)}
          </p>
          <span className="text-[11px] text-[#64748B] mt-1 block">
            Paid via RTGS / NEFT / UPI
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-[#F5FAF8] border border-[#14B8A6]/35 shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wide text-[#0F766E]">
            Outstanding Payables
          </span>
          <p className="text-xl font-extrabold text-amber-600 mt-1">
            {formatCurrency(outstandingPayables)}
          </p>
          <span className="text-[11px] text-[#64748B] mt-1 block">
            Net balance due to middleman
          </span>
        </div>
      </div>

      {/* Profile Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-[#E2E8F0] pb-2">
        {[
          { id: 'overview', label: 'Overview & Compliance', icon: Building2 },
          {
            id: 'transactions',
            label: `Procurement Transactions (${midPurchases.length})`,
            icon: FileSpreadsheet,
          },
          {
            id: 'payments',
            label: `Payments & Ledger (${midLedger.length})`,
            icon: Landmark,
          },
          {
            id: 'otp',
            label: `OTP Confirmations (${midConfirmations.length})`,
            icon: KeyRound,
          },
          {
            id: 'new-purchase',
            label: '+ New Purchase',
            icon: Handshake,
          },
        ].map((tab) => {
          const TabIcon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setSelectedPurchaseId('');
                setActiveTab(tab.id);
              }}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#0F766E] text-white shadow-xs'
                  : 'bg-[#F5FAF8] text-[#64748B] hover:text-[#0F766E] hover:bg-[#CCFBF1]/50'
              }`}
            >
              <TabIcon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-5 rounded-2xl bg-white border border-[#E2E8F0] space-y-3">
              <h4 className="font-bold text-[#0F766E] uppercase tracking-wider text-xs">
                Business, Owner &amp; Market Yard Location
              </h4>
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <span className="text-[#64748B] block">Business Name</span>
                  <strong className="text-[#172B29] text-sm">
                    {middleman.businessName}
                  </strong>
                </div>
                <div>
                  <span className="text-[#64748B] block">Owner / Proprietor</span>
                  <strong className="text-[#172B29]">
                    {middleman.ownerName}
                  </strong>
                </div>
                <div className="flex items-center gap-2 text-[#172B29]">
                  <Phone className="w-3.5 h-3.5 text-[#0F766E]" />
                  <span>+91 {middleman.mobileNumber}</span>
                </div>
                <div className="flex items-center gap-2 text-[#172B29]">
                  <Mail className="w-3.5 h-3.5 text-[#0F766E]" />
                  <span className="truncate">{middleman.email || '—'}</span>
                </div>
              </div>
              <div className="pt-2 border-t border-[#E2E8F0] flex items-start gap-2 text-[#172B29]">
                <MapPin className="w-4 h-4 text-[#0F766E] shrink-0 mt-0.5" />
                <span>
                  {middleman.address},{' '}
                  {middleman.village ? `${middleman.village}, ` : ''}
                  {middleman.district}, {middleman.state} -{' '}
                  {middleman.pinCode || '—'}
                </span>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-[#E2E8F0] space-y-3">
              <h4 className="font-bold text-[#0F766E] uppercase tracking-wider text-xs flex items-center gap-1.5">
                <Landmark className="w-4 h-4" />
                GST Registration &amp; Bank Settlement Details
              </h4>
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <span className="text-[#64748B] block">GSTIN</span>
                  <strong className="font-mono text-[#0F766E]">
                    {middleman.gstNumber || 'N/A'}
                  </strong>
                </div>
                <div>
                  <span className="text-[#64748B] block">PAN Number</span>
                  <strong className="font-mono text-[#172B29]">
                    {middleman.pan || 'N/A'}
                  </strong>
                </div>
                <div>
                  <span className="text-[#64748B] block">Bank Name</span>
                  <strong className="text-[#172B29]">
                    {middleman.bankName || 'Not provided'}
                  </strong>
                </div>
                <div>
                  <span className="text-[#64748B] block">Account &amp; IFSC</span>
                  <strong className="font-mono text-[#172B29]">
                    {maskIdentifier(middleman.accountNumber, 4)} (
                    {middleman.ifscCode || '—'})
                  </strong>
                </div>
              </div>
              <div className="pt-2 border-t border-[#E2E8F0] flex items-center justify-between text-[#64748B]">
                <span className="inline-flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-[#0F766E]" />
                  Registered on {formatDate(middleman.createdAt)}
                </span>
                <span>
                  Linked Vouchers: <strong className="text-[#172B29]">{midLedger.length}</strong>
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#0F766E]">
                Associated Middleman Procurement Transactions ({midPurchases.length})
              </h4>
              <button
                type="button"
                onClick={() => setActiveTab('transactions')}
                className="text-xs font-semibold text-[#0F766E] hover:underline cursor-pointer"
              >
                Open Full Transactions View →
              </button>
            </div>
            <VendorDataTable
              columns={transactionColumns}
              data={midPurchases}
              initialPageSize={5}
              emptyTitle="No purchases recorded from this middleman"
              emptyDescription="Click 'Record Purchase' above to record a bulk procurement lot from this middleman."
            />
          </div>
        </div>
      )}

      {/* TAB 2: PROCUREMENT TRANSACTIONS */}
      {activeTab === 'transactions' && (
        <div className="space-y-4">
          {selectedPurchase ? (
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => setSelectedPurchaseId('')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#CCFBF1] text-[#0F766E] hover:bg-[#0F766E] hover:text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to All {middleman.businessName} Transactions
              </button>
              <div className="p-4 rounded-2xl bg-white border border-[#E2E8F0]">
                <PurchaseDetails
                  purchase={selectedPurchase}
                  onClose={() => setSelectedPurchaseId('')}
                />
              </div>
            </div>
          ) : (
            <VendorDataTable
              columns={transactionColumns}
              data={midPurchases}
              initialPageSize={8}
              emptyTitle="No procurement transactions recorded for this middleman"
            />
          )}
        </div>
      )}

      {/* TAB 3: PAYMENTS & LEDGER */}
      {activeTab === 'payments' && (
        <div className="space-y-5">
          {outstandingPayables > 0 && (
            <form
              onSubmit={handleSettlePayable}
              className="p-4 rounded-2xl bg-[#F5FAF8] border border-[#14B8A6]/35 flex flex-wrap items-end justify-between gap-4 text-xs"
            >
              <div>
                <h4 className="font-bold text-[#0F766E] text-sm">
                  Settle Outstanding Middleman Payable ({formatCurrency(outstandingPayables)})
                </h4>
                <p className="text-[#64748B] mt-0.5">
                  Record bank/RTGS payment to {middleman.businessName} ({middleman.id}) and update the vendor ledger.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2.5">
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
                  className="h-9 px-3 rounded-xl bg-white border border-[#E2E8F0] text-xs font-semibold text-[#172B29]"
                >
                  <option value="NEFT / RTGS">NEFT / RTGS</option>
                  <option value="UPI / IMPS">UPI / IMPS</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Cash">Cash</option>
                </select>
                <input
                  type="number"
                  min="1"
                  max={outstandingPayables}
                  value={settlementAmount}
                  onChange={(e) => setSettlementAmount(e.target.value)}
                  placeholder={`Amount (up to ₹${outstandingPayables})`}
                  className="h-9 px-3 rounded-xl bg-white border border-[#E2E8F0] text-xs w-48"
                />
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-[#0F766E] text-white hover:bg-[#115E59] font-semibold cursor-pointer"
                >
                  <IndianRupee className="w-3.5 h-3.5" />
                  Record Payment
                </button>
              </div>
            </form>
          )}

          <VendorDataTable
            columns={ledgerColumns}
            data={midLedger}
            initialPageSize={8}
            emptyTitle="No financial ledger entries for this middleman"
          />
        </div>
      )}

      {/* TAB 4: OTP CONFIRMATIONS */}
      {activeTab === 'otp' && (
        <div className="space-y-3">
          {midConfirmations.length === 0 ? (
            <div className="p-8 rounded-2xl bg-[#F5FAF8] border border-[#E2E8F0] text-center text-xs text-[#64748B]">
              No OTP confirmation records found for {middleman.businessName}.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {midConfirmations.map((otp) => {
                const isVerified = otp.otpStatus === 'Verified';
                const currentVal =
                  otpInputs[otp.id] !== undefined
                    ? otpInputs[otp.id]
                    : otp.demoOtpCode || '';
                return (
                  <div
                    key={otp.id}
                    className="p-4 rounded-2xl bg-white border border-[#E2E8F0] shadow-2xs space-y-3 text-xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-[#0F766E]">
                            {otp.id}
                          </span>
                          <span className="text-[#64748B]">•</span>
                          <span className="font-mono font-semibold text-[#172B29]">
                            {otp.transactionId}
                          </span>
                        </div>
                        <p className="font-bold text-[#172B29] mt-1">
                          {otp.product} ({otp.quantity})
                        </p>
                        <p className="text-[#64748B]">
                          Mobile: {maskMobileNumber(otp.mobileNumber)} • Value:{' '}
                          <strong className="text-[#0F766E]">
                            {formatCurrency(otp.amount)}
                          </strong>
                        </p>
                      </div>
                      <VendorStatusBadge status={otp.otpStatus} size="xs" />
                    </div>

                    <div className="pt-2 border-t border-[#E2E8F0] flex items-center justify-between text-[11px] text-[#64748B]">
                      <span>Initiated: {otp.initiatedDate}</span>
                      <span>
                        {otp.verifiedAt
                          ? `Verified: ${otp.verifiedAt}`
                          : `Demo OTP: ${otp.demoOtpCode}`}
                      </span>
                    </div>

                    {!isVerified && (
                      <div className="pt-2 border-t border-[#E2E8F0] flex items-center gap-2">
                        <input
                          type="text"
                          maxLength={6}
                          value={currentVal}
                          onChange={(e) =>
                            setOtpInputs((prev) => ({
                              ...prev,
                              [otp.id]: e.target.value,
                            }))
                          }
                          placeholder="6-digit OTP"
                          className="h-8 px-2.5 rounded-lg border border-[#E2E8F0] font-mono font-bold tracking-widest w-28"
                        />
                        <button
                          type="button"
                          onClick={() => verifyTransactionOtp(otp.id, currentVal)}
                          className="inline-flex items-center gap-1 h-8 px-3 rounded-lg bg-[#0F766E] text-white hover:bg-[#115E59] font-semibold cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Verify OTP
                        </button>
                        <button
                          type="button"
                          onClick={() => resendTransactionOtp(otp.id)}
                          className="inline-flex items-center gap-1 h-8 px-2.5 rounded-lg bg-[#CCFBF1] text-[#0F766E] hover:bg-[#0F766E] hover:text-white font-semibold cursor-pointer"
                        >
                          <Send className="w-3 h-3" />
                          Resend
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: INLINE NEW PURCHASE FOR THIS MIDDLEMAN */}
      {activeTab === 'new-purchase' && (
        <div className="space-y-4">
          <PurchaseForm
            supplierCategory="Middleman"
            initialSupplierId={middleman.id}
            onSuccess={(created) => {
              setActiveTab('transactions');
              if (created?.id) setSelectedPurchaseId(created.id);
            }}
            onCancel={() => setActiveTab('overview')}
          />
        </div>
      )}
    </div>
  );
}

export default MiddlemanDetails;

import { useState, useMemo } from 'react';
import {
  MapPin,
  Phone,
  Mail,
  Landmark,
  Shield,
  Tractor,
  Eye,
  Printer,
  CheckCircle2,
  Send,
  IndianRupee,
  FileSpreadsheet,
  KeyRound,
  User,
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

export function FarmerDetails({
  farmer,
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
  const [selectedPurchaseId, setSelectedPurchaseId] = useState(initialPurchaseId || '');
  const [otpInputs, setOtpInputs] = useState({});
  const [settlementAmount, setSettlementAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('NEFT / RTGS');

  const farmerPurchases = useMemo(() => {
    if (!farmer) return [];
    return purchases.filter(
      (p) => p.supplierCategory === 'Farmer' && p.supplierId === farmer.id
    );
  }, [purchases, farmer]);

  const confirmedPurchases = useMemo(
    () => farmerPurchases.filter((p) => p.status === 'Confirmed'),
    [farmerPurchases]
  );

  const farmerLedger = useMemo(() => {
    if (!farmer) return [];
    return ledger.filter((l) => l.partyId === farmer.id);
  }, [ledger, farmer]);

  const farmerConfirmations = useMemo(() => {
    if (!farmer) return [];
    const purchaseIds = new Set(farmerPurchases.map((p) => p.id));
    return confirmations.filter(
      (c) => c.partyId === farmer.id || purchaseIds.has(c.transactionId)
    );
  }, [confirmations, farmer, farmerPurchases]);

  const selectedPurchase = useMemo(
    () =>
      selectedPurchaseId
        ? farmerPurchases.find((p) => p.id === selectedPurchaseId) || null
        : null,
    [farmerPurchases, selectedPurchaseId]
  );

  if (!farmer) return null;

  const totalQty = farmerPurchases.reduce(
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
  const pendingPayableAmount = Math.max(0, totalPurchaseAmount - totalPaidAmount);

  const transactionColumns = [
    {
      key: 'id',
      header: 'Purchase ID',
      sortable: true,
      render: (row) => (
        <button
          type="button"
          onClick={() => setSelectedPurchaseId(row.id)}
          className="font-mono font-bold text-brand-primary hover:underline cursor-pointer"
        >
          {row.id}
        </button>
      ),
    },
    {
      key: 'purchaseDate',
      header: 'Purchase Date',
      sortable: true,
      render: (row) => (
        <span className="whitespace-nowrap font-medium text-[#172B29]">
          {formatDate(row.purchaseDate)}
        </span>
      ),
    },
    {
      key: 'crop',
      header: 'Raw Material & Grade',
      render: (row) => (
        <div>
          <p className="font-bold text-[#172B29]">{row.crop}</p>
          <p className="text-[11px] text-brand-muted">
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
        <span className="font-bold text-brand-primary whitespace-nowrap">
          {formatCurrency(row.totalAmount)}
        </span>
      ),
    },
    {
      key: 'paidAmount',
      header: 'Payment Info',
      render: (row) => {
        const due = Math.max(
          0,
          Number(row.totalAmount || 0) - Number(row.paidAmount || 0)
        );
        return (
          <div className="text-xs">
            <div className="flex items-center gap-1.5">
              <VendorStatusBadge status={row.paymentStatus} size="xs" />
            </div>
            <p className="text-[11px] text-brand-muted mt-0.5 whitespace-nowrap">
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
            title="View Complete Purchase Details"
            className="h-8 inline-flex items-center gap-1.5 px-2.5 rounded-lg text-xs font-semibold bg-brand-light text-brand-primary border border-brand-secondary/30 hover:bg-brand-primary hover:text-white transition-colors cursor-pointer shrink-0"
          >
            <Eye className="w-3.5 h-3.5 shrink-0 !max-w-none" />
            <span>Details</span>
          </button>
          <button
            type="button"
            onClick={() =>
              printDocumentSummary(
                `Farmer Purchase Voucher – ${row.id}`,
                `Farmer: ${farmer.farmerName} (${farmer.id}) • Date: ${formatDate(row.purchaseDate)}`,
                [
                  {
                    heading: 'Purchase Summary',
                    rows: [
                      ['Purchase ID', row.id],
                      ['Farmer', `${farmer.farmerName} (${farmer.id})`],
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
            title="Print Purchase Voucher"
            className="w-8 h-8 inline-flex items-center justify-center shrink-0 rounded-lg border border-brand-border bg-white text-brand-muted hover:bg-brand-light hover:text-brand-primary transition-colors cursor-pointer"
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
        <span className="font-mono font-bold text-brand-primary">{row.id}</span>
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
        <span className="px-2 py-0.5 rounded-md bg-brand-light/70 text-brand-primary text-xs font-semibold">
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
      header: 'Purchase Payable (Cr)',
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
      header: 'Payment Settled (Dr)',
      align: 'right',
      render: (row) =>
        row.debit > 0 ? (
          <span className="font-bold text-brand-success">
            {formatCurrency(row.debit)}
          </span>
        ) : (
          '—'
        ),
    },
    {
      key: 'paymentMode',
      header: 'Mode',
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
    const amt = Number(settlementAmount || pendingPayableAmount);
    if (amt <= 0) return;
    recordFinancialSettlement({
      settlementType: 'Supplier Payment',
      partyId: farmer.id,
      partyName: farmer.farmerName,
      partyCategory: 'Farmer',
      referenceTransactionId: targetPurchase?.id || farmerPurchases[0]?.id || '',
      amount: Math.min(amt, pendingPayableAmount),
      paymentMode,
      notes: `Direct settlement to Farmer ${farmer.farmerName} (${farmer.id})`,
    });
    setSettlementAmount('');
  };

  return (
    <div className="space-y-6">
      {/* Top Profile Identity Banner */}
      <div className="p-5 rounded-2xl bg-[#F5FAF8] border border-brand-secondary/30 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-brand-primary text-white flex items-center justify-center font-bold text-lg shrink-0 shadow-xs">
            {farmer.farmerName?.charAt(0) || 'F'}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="px-2.5 py-0.5 rounded-md bg-brand-primary text-white font-mono text-xs font-bold">
                {farmer.id}
              </span>
              <h3 className="text-lg font-bold text-[#172B29]">
                {farmer.farmerName}
              </h3>
              <VendorStatusBadge status={farmer.status} size="xs" />
            </div>
            <p className="text-xs text-brand-muted mt-1">
              S/o <strong>{farmer.fatherName || '—'}</strong> • Village:{' '}
              <strong>
                {farmer.village}, {farmer.district}, {farmer.state}
              </strong>{' '}
              • Registered on <strong>{formatDate(farmer.createdAt)}</strong>
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
            className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl text-xs font-semibold bg-brand-primary text-white hover:bg-brand-primary-dark transition-colors cursor-pointer shadow-xs"
          >
            <Tractor className="w-4 h-4" />
            <span>Record Purchase</span>
          </button>
          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(farmer)}
              className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl text-xs font-semibold bg-white border border-brand-border text-brand-primary hover:bg-brand-light/60 transition-colors cursor-pointer"
            >
              Edit Profile
            </button>
          )}
        </div>
      </div>

      {/* 4 Profile Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-brand-border shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wide text-brand-muted">
            Associated Purchases
          </span>
          <p className="text-xl font-extrabold text-brand-primary mt-1">
            {farmerPurchases.length} ({formatNumber(totalQty)} Qtl)
          </p>
          <span className="text-[11px] text-brand-muted mt-1 block">
            {confirmedPurchases.length} confirmed •{' '}
            {farmerPurchases.length - confirmedPurchases.length} pending/draft
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-brand-border shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wide text-brand-muted">
            Total Purchase Amount
          </span>
          <p className="text-xl font-extrabold text-brand-primary mt-1">
            {formatCurrency(totalPurchaseAmount)}
          </p>
          <span className="text-[11px] text-brand-muted mt-1 block">
            Confirmed procurement value
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-brand-border shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wide text-brand-muted">
            Completed Payments
          </span>
          <p className="text-xl font-extrabold text-brand-success mt-1">
            {formatCurrency(totalPaidAmount)}
          </p>
          <span className="text-[11px] text-brand-muted mt-1 block">
            Settled via bank / mandi voucher
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-[#F5FAF8] border border-brand-secondary/35 shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wide text-brand-primary">
            Pending Payments
          </span>
          <p className="text-xl font-extrabold text-amber-600 mt-1">
            {formatCurrency(pendingPayableAmount)}
          </p>
          <span className="text-[11px] text-brand-muted mt-1 block">
             Balance payable to farmer
          </span>
        </div>
      </div>

      {/* Profile Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-brand-border pb-2">
        {[
          { id: 'overview', label: 'Overview & Registration', icon: User },
          {
            id: 'transactions',
            label: `Procurement Transactions (${farmerPurchases.length})`,
            icon: FileSpreadsheet,
          },
          {
            id: 'payments',
            label: `Payments & Ledger (${farmerLedger.length})`,
            icon: Landmark,
          },
          {
            id: 'otp',
            label: `OTP Confirmations (${farmerConfirmations.length})`,
            icon: KeyRound,
          },
          {
            id: 'new-purchase',
            label: '+ New Purchase',
            icon: Tractor,
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
                  ? 'bg-brand-primary text-white shadow-xs'
                  : 'bg-[#F5FAF8] text-brand-muted hover:text-brand-primary hover:bg-brand-light/50'
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
            <div className="p-5 rounded-2xl bg-white border border-brand-border space-y-3">
              <h4 className="font-bold text-brand-primary uppercase tracking-wider text-xs">
                Personal, Contact &amp; Location Details
              </h4>
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <span className="text-brand-muted block">Farmer Name</span>
                  <strong className="text-[#172B29] text-sm">
                    {farmer.farmerName}
                  </strong>
                </div>
                <div>
                  <span className="text-brand-muted block">Father&apos;s Name</span>
                  <strong className="text-[#172B29]">
                    {farmer.fatherName || '—'}
                  </strong>
                </div>
                <div className="flex items-center gap-2 text-[#172B29]">
                  <Phone className="w-3.5 h-3.5 text-brand-primary" />
                  <span>+91 {farmer.mobileNumber}</span>
                </div>
                <div className="flex items-center gap-2 text-[#172B29]">
                  <Mail className="w-3.5 h-3.5 text-brand-primary" />
                  <span className="truncate">{farmer.email || '—'}</span>
                </div>
              </div>
              <div className="pt-2 border-t border-brand-border flex items-start gap-2 text-[#172B29]">
                <MapPin className="w-4 h-4 text-brand-primary shrink-0 mt-0.5" />
                <span>
                  {farmer.address ? `${farmer.address}, ` : ''}
                  {farmer.village}, {farmer.mandal ? `${farmer.mandal} Mandal, ` : ''}
                  {farmer.district}, {farmer.state} - {farmer.pinCode || '—'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[#172B29]">
                <Shield className="w-4 h-4 text-brand-primary" />
                <span>
                  Aadhaar / Kisan ID:{' '}
                  <strong>{maskIdentifier(farmer.aadhaarId, 4)}</strong> • Registered:{' '}
                  <strong>{formatDate(farmer.createdAt)}</strong>
                </span>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-brand-border space-y-4">
              <div>
                <h4 className="font-bold text-brand-primary uppercase tracking-wider text-xs mb-2.5">
                  Registered Available Crops
                </h4>
                <div className="flex flex-wrap gap-2">
                  {(farmer.availableCrops || []).map((crop) => (
                    <span
                      key={crop}
                      className="px-3 py-1 rounded-xl bg-brand-light text-brand-primary text-xs font-bold border border-brand-secondary/30"
                    >
                      {crop}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-brand-border space-y-2">
                <h4 className="font-bold text-brand-primary uppercase tracking-wider text-xs flex items-center gap-1.5">
                  <Landmark className="w-4 h-4" />
                  Bank Settlement &amp; Account Details
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-brand-muted block">Bank Name</span>
                    <strong className="text-[#172B29]">
                      {farmer.bankName || 'Not provided'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-brand-muted block">Account Number</span>
                    <strong className="font-mono text-[#172B29]">
                      {maskIdentifier(farmer.accountNumber, 4)}
                    </strong>
                  </div>
                  <div>
                    <span className="text-brand-muted block">IFSC Code</span>
                    <strong className="font-mono text-brand-primary">
                      {farmer.ifscCode || '—'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-brand-muted block">Ledger Vouchers</span>
                    <strong className="text-[#172B29]">
                      {farmerLedger.length} entries
                    </strong>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Preview of Associated Purchases */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-brand-primary">
                Associated Farmer Purchase Transactions ({farmerPurchases.length})
              </h4>
              <button
                type="button"
                onClick={() => setActiveTab('transactions')}
                className="text-xs font-semibold text-brand-primary hover:underline cursor-pointer"
              >
                Open Full Transactions View →
              </button>
            </div>
            <VendorDataTable
              columns={transactionColumns}
              data={farmerPurchases}
              initialPageSize={5}
              emptyTitle="No purchases recorded for this farmer yet"
              emptyDescription="Click 'Record Purchase' above to record a raw material purchase from this farmer."
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
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-light text-brand-primary hover:bg-brand-primary hover:text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to All {farmer.farmerName} Purchases
              </button>
              <div className="p-4 rounded-2xl bg-white border border-brand-border">
                <PurchaseDetails
                  purchase={selectedPurchase}
                  onClose={() => setSelectedPurchaseId('')}
                />
              </div>
            </div>
          ) : (
            <VendorDataTable
              columns={transactionColumns}
              data={farmerPurchases}
              initialPageSize={8}
              emptyTitle="No purchases recorded for this farmer"
              emptyDescription="Use the '+ New Purchase' tab to record a direct raw material purchase."
            />
          )}
        </div>
      )}

      {/* TAB 3: PAYMENTS & LEDGER */}
      {activeTab === 'payments' && (
        <div className="space-y-5">
          {pendingPayableAmount > 0 && (
            <form
              onSubmit={handleSettlePayable}
              className="p-4 rounded-2xl bg-[#F5FAF8] border border-brand-secondary/35 flex flex-wrap items-end justify-between gap-4 text-xs"
            >
              <div>
                <h4 className="font-bold text-brand-primary text-sm">
                  Settle Pending Farmer Payable ({formatCurrency(pendingPayableAmount)})
                </h4>
                <p className="text-brand-muted mt-0.5">
                  Record direct bank/cash settlement to {farmer.farmerName} ({farmer.id}) and update the vendor ledger.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2.5">
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
                  className="h-9 px-3 rounded-xl bg-white border border-brand-border text-xs font-semibold text-[#172B29]"
                >
                  <option value="NEFT / RTGS">NEFT / RTGS</option>
                  <option value="UPI / IMPS">UPI / IMPS</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Cash">Cash</option>
                </select>
                <input
                  type="number"
                  min="1"
                  max={pendingPayableAmount}
                  value={settlementAmount}
                  onChange={(e) => setSettlementAmount(e.target.value)}
                  placeholder={`Amount (up to ₹${pendingPayableAmount})`}
                  className="h-9 px-3 rounded-xl bg-white border border-brand-border text-xs w-48"
                />
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-brand-primary text-white hover:bg-brand-primary-dark font-semibold cursor-pointer"
                >
                  <IndianRupee className="w-3.5 h-3.5" />
                  Record Payment
                </button>
              </div>
            </form>
          )}

          <VendorDataTable
            columns={ledgerColumns}
            data={farmerLedger}
            initialPageSize={8}
            emptyTitle="No financial ledger entries for this farmer"
          />
        </div>
      )}

      {/* TAB 4: OTP CONFIRMATIONS */}
      {activeTab === 'otp' && (
        <div className="space-y-3">
          {farmerConfirmations.length === 0 ? (
            <div className="p-8 rounded-2xl bg-[#F5FAF8] border border-brand-border text-center text-xs text-brand-muted">
              No OTP confirmation records found for {farmer.farmerName}.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {farmerConfirmations.map((otp) => {
                const isVerified = otp.otpStatus === 'Verified';
                const currentVal =
                  otpInputs[otp.id] !== undefined
                    ? otpInputs[otp.id]
                    : otp.demoOtpCode || '';
                return (
                  <div
                    key={otp.id}
                    className="p-4 rounded-2xl bg-white border border-brand-border shadow-2xs space-y-3 text-xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-brand-primary">
                            {otp.id}
                          </span>
                          <span className="text-brand-muted">•</span>
                          <span className="font-mono font-semibold text-[#172B29]">
                            {otp.transactionId}
                          </span>
                        </div>
                        <p className="font-bold text-[#172B29] mt-1">
                          {otp.product} ({otp.quantity})
                        </p>
                        <p className="text-brand-muted">
                          Mobile: {maskMobileNumber(otp.mobileNumber)} • Value:{' '}
                          <strong className="text-brand-primary">
                            {formatCurrency(otp.amount)}
                          </strong>
                        </p>
                      </div>
                      <VendorStatusBadge status={otp.otpStatus} size="xs" />
                    </div>

                    <div className="pt-2 border-t border-brand-border flex items-center justify-between text-[11px] text-brand-muted">
                      <span>Initiated: {otp.initiatedDate}</span>
                      <span>
                        {otp.verifiedAt
                          ? `Verified: ${otp.verifiedAt}`
                          : `Demo OTP: ${otp.demoOtpCode}`}
                      </span>
                    </div>

                    {!isVerified && (
                      <div className="pt-2 border-t border-brand-border flex items-center gap-2">
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
                          className="h-8 px-2.5 rounded-lg border border-brand-border font-mono font-bold tracking-widest w-28"
                        />
                        <button
                          type="button"
                          onClick={() => verifyTransactionOtp(otp.id, currentVal)}
                          className="inline-flex items-center gap-1 h-8 px-3 rounded-lg bg-brand-primary text-white hover:bg-brand-primary-dark font-semibold cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Verify OTP
                        </button>
                        <button
                          type="button"
                          onClick={() => resendTransactionOtp(otp.id)}
                          className="inline-flex items-center gap-1 h-8 px-2.5 rounded-lg bg-brand-light text-brand-primary hover:bg-brand-primary hover:text-white font-semibold cursor-pointer"
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

      {/* TAB 5: INLINE NEW PURCHASE FOR THIS FARMER */}
      {activeTab === 'new-purchase' && (
        <div className="space-y-4">
          <PurchaseForm
            supplierCategory="Farmer"
            initialSupplierId={farmer.id}
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

export default FarmerDetails;

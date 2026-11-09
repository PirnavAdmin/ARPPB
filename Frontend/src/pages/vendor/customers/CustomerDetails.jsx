import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Phone,
  Mail,
  MapPin,
  ShoppingBag,
  Landmark,
  Eye,
  Printer,
  CheckCircle2,
  Send,
  IndianRupee,
  FileSpreadsheet,
  KeyRound,
  User,
  FileText,
} from 'lucide-react';
import { useVendor } from '../../../hooks/useVendor';
import VendorStatusBadge from '../VendorStatusBadge';
import VendorDataTable from '../VendorDataTable';
import SalesDetails from '../sales/SalesDetails';
import {
  formatCurrency,
  formatNumber,
  maskMobileNumber,
} from '../../../utils/formatCurrency';
import { formatDate } from '../../../utils/formatDate';
import { printDocumentSummary } from '../../../utils/exportUtils';

export function CustomerDetails({
  customer,
  orders = [],
  sales = [],
  initialTab = 'overview',
  onEdit,
  onClose,
}) {
  const navigate = useNavigate();
  const {
    ledger,
    confirmations,
    verifyTransactionOtp,
    resendTransactionOtp,
    recordFinancialSettlement,
  } = useVendor();

  const [activeTab, setActiveTab] = useState(initialTab);
  const [selectedSale, setSelectedSale] = useState(null);
  const [otpInputs, setOtpInputs] = useState({});
  const [receiptAmount, setReceiptAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('NEFT / RTGS');

  const custSales = useMemo(() => {
    if (!customer) return [];
    return sales.filter((s) => s.customerId === customer.id);
  }, [sales, customer]);

  const custOrders = useMemo(() => {
    if (!customer) return [];
    return orders.filter((o) => o.customerId === customer.id);
  }, [orders, customer]);

  const custLedger = useMemo(() => {
    if (!customer) return [];
    return ledger.filter((l) => l.partyId === customer.id);
  }, [ledger, customer]);

  const custConfirmations = useMemo(() => {
    if (!customer) return [];
    const saleIds = new Set(custSales.map((s) => s.id));
    return confirmations.filter(
      (c) => c.partyId === customer.id || saleIds.has(c.transactionId)
    );
  }, [confirmations, customer, custSales]);

  if (!customer) return null;

  const totalSalesAmount = Number(customer.totalPurchaseValue || 0);
  const totalAmountReceived = Number(customer.totalAmountReceived || 0);
  const outstandingReceivables = Number(customer.outstandingReceivables || 0);

  const transactionColumns = [
    {
      key: 'id',
      header: 'Sales / Order ID',
      sortable: true,
      render: (row) => (
        <div>
          <button
            type="button"
            onClick={() => setSelectedSale(row)}
            className="font-mono font-bold text-[#0F766E] hover:underline cursor-pointer"
          >
            {row.id}
          </button>
          <p className="font-mono text-[11px] text-[#64748B]">
            Order: {row.orderId || 'Direct'}
          </p>
        </div>
      ),
    },
    {
      key: 'salesDate',
      header: 'Order Date',
      sortable: true,
      render: (row) => (
        <span className="whitespace-nowrap font-medium text-[#172B29]">
          {formatDate(row.salesDate)}
        </span>
      ),
    },
    {
      key: 'product',
      header: 'Product Details',
      render: (row) => (
        <div>
          <p className="font-bold text-[#172B29]">{row.product}</p>
          <p className="text-[11px] text-[#64748B]">
            Batch: {row.batchNumber || 'Standard'}
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
      key: 'unitPrice',
      header: 'Rate / Unit',
      align: 'right',
      sortable: true,
      render: (row) => (
        <span className="whitespace-nowrap text-[#172B29]">
          {formatCurrency(row.unitPrice)}
        </span>
      ),
    },
    {
      key: 'totalAmount',
      header: 'Total Order Amount',
      align: 'right',
      sortable: true,
      render: (row) => (
        <span className="font-bold text-[#0F766E] whitespace-nowrap">
          {formatCurrency(row.totalAmount)}
        </span>
      ),
    },
    {
      key: 'paymentStatus',
      header: 'Payment Details',
      render: (row) => {
        const due = Math.max(
          0,
          Number(row.totalAmount || 0) - Number(row.receivedAmount || 0)
        );
        return (
          <div className="text-xs">
            <VendorStatusBadge status={row.paymentStatus} size="xs" />
            <p className="text-[11px] text-[#64748B] mt-0.5 whitespace-nowrap">
              Rcvd: {formatCurrency(row.receivedAmount)}
              {due > 0 ? ` • Due: ${formatCurrency(due)}` : ''}
            </p>
          </div>
        );
      },
    },
    {
      key: 'confirmationStatus',
      header: 'OTP Status',
      render: (row) => (
        <VendorStatusBadge status={row.confirmationStatus} size="xs" />
      ),
    },
    {
      key: 'salesStatus',
      header: 'Order Status',
      render: (row) => <VendorStatusBadge status={row.salesStatus} size="xs" />,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (row) => (
        <div className="inline-flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setSelectedSale(row)}
            title="View Invoice & Order Details"
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#CCFBF1] text-[#0F766E] hover:bg-[#0F766E] hover:text-white transition-colors cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            Details
          </button>
          <button
            type="button"
            onClick={() =>
              printDocumentSummary(
                `Customer Sales Invoice – ${row.id}`,
                `Customer: ${customer.customerName} (${customer.id}) • Date: ${formatDate(row.salesDate)}`,
                [
                  {
                    heading: 'Sales Order Summary',
                    rows: [
                      ['Sales ID / Order ID', `${row.id} / ${row.orderId || '—'}`],
                      ['Customer', `${customer.customerName} (${customer.businessName || 'Direct'})`],
                      ['Product & Batch', `${row.product} (${row.batchNumber || 'Standard'})`],
                      ['Quantity & Rate', `${row.quantity} ${row.unit} @ ${formatCurrency(row.unitPrice)}`],
                      ['Total Amount', formatCurrency(row.totalAmount)],
                      ['Amount Received', formatCurrency(row.receivedAmount)],
                      ['OTP & Order Status', `${row.confirmationStatus} / ${row.salesStatus}`],
                    ],
                  },
                ]
              )
            }
            title="Print Sales Invoice"
            className="p-1.5 rounded-lg border border-[#E2E8F0] bg-white text-[#64748B] hover:text-[#0F766E] cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
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
      key: 'debit',
      header: 'Invoice Receivable (Dr)',
      align: 'right',
      render: (row) =>
        row.debit > 0 ? (
          <span className="font-bold text-[#172B29]">
            {formatCurrency(row.debit)}
          </span>
        ) : (
          '—'
        ),
    },
    {
      key: 'credit',
      header: 'Payment Received (Cr)',
      align: 'right',
      render: (row) =>
        row.credit > 0 ? (
          <span className="font-bold text-[#16A34A]">
            {formatCurrency(row.credit)}
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

  const handleRecordCustomerReceipt = (e) => {
    e.preventDefault();
    const targetSale = custSales.find(
      (s) => Number(s.totalAmount || 0) > Number(s.receivedAmount || 0)
    );
    const amt = Number(receiptAmount || outstandingReceivables);
    if (amt <= 0) return;
    recordFinancialSettlement({
      settlementType: 'Customer Payment',
      partyId: customer.id,
      partyName: customer.customerName,
      partyCategory: 'Customer',
      referenceTransactionId: targetSale?.id || custSales[0]?.id || '',
      amount: Math.min(amt, outstandingReceivables),
      paymentMode,
      notes: `Receipt from Customer ${customer.customerName} (${customer.id})`,
    });
    setReceiptAmount('');
  };

  return (
    <div className="space-y-6">
      {/* Top Profile Identity Banner */}
      <div className="p-5 rounded-2xl bg-[#F5FAF8] border border-[#14B8A6]/30 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#0F766E] text-white flex items-center justify-center font-bold text-lg shrink-0 shadow-xs">
            {customer.customerName?.charAt(0) || 'C'}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="px-2.5 py-0.5 rounded-md bg-[#0F766E] text-white font-mono text-xs font-bold">
                {customer.id}
              </span>
              <h3 className="text-lg font-bold text-[#172B29]">
                {customer.customerName}
              </h3>
              <VendorStatusBadge status={customer.status} size="xs" />
            </div>
            <p className="text-xs text-[#64748B] mt-1">
              <strong>{customer.businessName || 'Direct Buyer'}</strong> (
              {customer.customerType || 'Wholesale'}) • GSTIN:{' '}
              <strong>{customer.gstNumber || 'N/A'}</strong> • Credit Limit:{' '}
              <strong>{formatCurrency(customer.creditLimit)}</strong>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              if (onClose) onClose();
              navigate(`/vendor/sales/new?customerId=${customer.id}`);
            }}
            className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl text-xs font-semibold bg-[#0F766E] text-white hover:bg-[#115E59] transition-colors cursor-pointer shadow-xs"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Sell Products</span>
          </button>
          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(customer)}
              className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl text-xs font-semibold bg-white border border-[#E2E8F0] text-[#0F766E] hover:bg-[#CCFBF1]/60 transition-colors cursor-pointer"
            >
              Edit Profile
            </button>
          )}
        </div>
      </div>

      {/* 6 Customer Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3.5 rounded-2xl bg-white border border-[#E2E8F0] shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wide text-[#64748B]">
            Total Orders
          </span>
          <p className="text-lg font-extrabold text-[#0F766E] mt-1">
            {customer.totalOrders}
          </p>
        </div>
        <div className="p-3.5 rounded-2xl bg-white border border-[#E2E8F0] shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wide text-[#64748B]">
            Completed Orders
          </span>
          <p className="text-lg font-extrabold text-[#16A34A] mt-1">
            {customer.completedOrders}
          </p>
        </div>
        <div className="p-3.5 rounded-2xl bg-white border border-[#E2E8F0] shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wide text-[#64748B]">
            Pending Orders
          </span>
          <p className="text-lg font-extrabold text-amber-600 mt-1">
            {customer.pendingOrders}
          </p>
        </div>
        <div className="p-3.5 rounded-2xl bg-white border border-[#E2E8F0] shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wide text-[#64748B]">
            Total Sales Amount
          </span>
          <p className="text-base font-extrabold text-[#0F766E] mt-1 truncate">
            {formatCurrency(totalSalesAmount)}
          </p>
        </div>
        <div className="p-3.5 rounded-2xl bg-white border border-[#E2E8F0] shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wide text-[#64748B]">
            Amount Received
          </span>
          <p className="text-base font-extrabold text-[#16A34A] mt-1 truncate">
            {formatCurrency(totalAmountReceived)}
          </p>
        </div>
        <div className="p-3.5 rounded-2xl bg-[#F5FAF8] border border-[#14B8A6]/35 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wide text-[#0F766E]">
            Outstanding Balance
          </span>
          <p className="text-base font-extrabold text-amber-600 mt-1 truncate">
            {formatCurrency(outstandingReceivables)}
          </p>
        </div>
      </div>

      {/* Profile Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-[#E2E8F0] pb-2">
        {[
          { id: 'overview', label: 'Overview & Registration', icon: User },
          {
            id: 'transactions',
            label: `Sales Orders & Invoices (${custSales.length})`,
            icon: FileSpreadsheet,
          },
          {
            id: 'payments',
            label: `Payments & Receivables (${custLedger.length})`,
            icon: Landmark,
          },
          {
            id: 'otp',
            label: `OTP Confirmations (${custConfirmations.length})`,
            icon: KeyRound,
          },
        ].map((tab) => {
          const TabIcon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
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
                Customer, Contact &amp; Delivery Address
              </h4>
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <span className="text-[#64748B] block">Customer Name</span>
                  <strong className="text-[#172B29] text-sm">
                    {customer.customerName}
                  </strong>
                </div>
                <div>
                  <span className="text-[#64748B] block">Business Name</span>
                  <strong className="text-[#172B29]">
                    {customer.businessName || 'Individual Direct Buyer'}
                  </strong>
                </div>
                <div className="flex items-center gap-2 text-[#172B29]">
                  <Phone className="w-3.5 h-3.5 text-[#0F766E]" />
                  <span>+91 {customer.mobileNumber}</span>
                </div>
                <div className="flex items-center gap-2 text-[#172B29]">
                  <Mail className="w-3.5 h-3.5 text-[#0F766E]" />
                  <span className="truncate">{customer.email || '—'}</span>
                </div>
              </div>
              <div className="pt-2 border-t border-[#E2E8F0] flex items-start gap-2 text-[#172B29]">
                <MapPin className="w-4 h-4 text-[#0F766E] shrink-0 mt-0.5" />
                <span>
                  {customer.address}, {customer.district}, {customer.state} -{' '}
                  {customer.pinCode || '—'}
                </span>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-[#E2E8F0] space-y-3">
              <h4 className="font-bold text-[#0F766E] uppercase tracking-wider text-xs flex items-center gap-1.5">
                <Landmark className="w-4 h-4" />
                Registration, Tax &amp; Credit Terms
              </h4>
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <span className="text-[#64748B] block">Customer Type</span>
                  <strong className="text-[#172B29]">
                    {customer.customerType || 'Wholesaler'}
                  </strong>
                </div>
                <div>
                  <span className="text-[#64748B] block">GSTIN &amp; PAN</span>
                  <strong className="font-mono text-[#0F766E]">
                    {customer.gstNumber || 'N/A'} / {customer.pan || '—'}
                  </strong>
                </div>
                <div>
                  <span className="text-[#64748B] block">Credit Limit</span>
                  <strong className="text-[#172B29]">
                    {formatCurrency(customer.creditLimit)}
                  </strong>
                </div>
                <div>
                  <span className="text-[#64748B] block">Opening Balance</span>
                  <strong className="text-[#172B29]">
                    {formatCurrency(customer.openingBalance)}
                  </strong>
                </div>
              </div>
              <div className="pt-2 border-t border-[#E2E8F0] flex items-center justify-between text-[#64748B]">
                <span className="inline-flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-[#0F766E]" />
                  Registered on {formatDate(customer.createdAt)}
                </span>
                <span>
                  Active Orders:{' '}
                  <strong className="text-[#172B29]">{custOrders.length}</strong>
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#0F766E]">
                Associated Sales Orders &amp; Invoices ({custSales.length})
              </h4>
              <button
                type="button"
                onClick={() => setActiveTab('transactions')}
                className="text-xs font-semibold text-[#0F766E] hover:underline cursor-pointer"
              >
                Open Full Orders &amp; Invoices View →
              </button>
            </div>
            <VendorDataTable
              columns={transactionColumns}
              data={custSales}
              initialPageSize={5}
              emptyTitle="No sales orders recorded for this customer"
            />
          </div>
        </div>
      )}

      {/* TAB 2: SALES ORDERS & INVOICES */}
      {activeTab === 'transactions' && (
        <div className="space-y-4">
          <VendorDataTable
            columns={transactionColumns}
            data={custSales}
            initialPageSize={8}
            emptyTitle="No sales orders recorded for this customer"
          />
        </div>
      )}

      {/* TAB 3: PAYMENTS & RECEIVABLES */}
      {activeTab === 'payments' && (
        <div className="space-y-5">
          {outstandingReceivables > 0 && (
            <form
              onSubmit={handleRecordCustomerReceipt}
              className="p-4 rounded-2xl bg-[#F5FAF8] border border-[#14B8A6]/35 flex flex-wrap items-end justify-between gap-4 text-xs"
            >
              <div>
                <h4 className="font-bold text-[#0F766E] text-sm">
                  Collect Outstanding Customer Receivable (
                  {formatCurrency(outstandingReceivables)})
                </h4>
                <p className="text-[#64748B] mt-0.5">
                  Record customer payment receipt for {customer.customerName} (
                  {customer.id}) and update the vendor ledger.
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
                  max={outstandingReceivables}
                  value={receiptAmount}
                  onChange={(e) => setReceiptAmount(e.target.value)}
                  placeholder={`Amount (up to ₹${outstandingReceivables})`}
                  className="h-9 px-3 rounded-xl bg-white border border-[#E2E8F0] text-xs w-48"
                />
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-[#0F766E] text-white hover:bg-[#115E59] font-semibold cursor-pointer"
                >
                  <IndianRupee className="w-3.5 h-3.5" />
                  Record Receipt
                </button>
              </div>
            </form>
          )}

          <VendorDataTable
            columns={ledgerColumns}
            data={custLedger}
            initialPageSize={8}
            emptyTitle="No financial ledger entries for this customer"
          />
        </div>
      )}

      {/* TAB 4: OTP CONFIRMATIONS */}
      {activeTab === 'otp' && (
        <div className="space-y-3">
          {custConfirmations.length === 0 ? (
            <div className="p-8 rounded-2xl bg-[#F5FAF8] border border-[#E2E8F0] text-center text-xs text-[#64748B]">
              No OTP confirmation records found for {customer.customerName}.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {custConfirmations.map((otp) => {
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

      {/* Sales Invoice Details Modal */}
      <SalesDetails
        sale={selectedSale}
        isOpen={Boolean(selectedSale)}
        onClose={() => setSelectedSale(null)}
      />
    </div>
  );
}

export default CustomerDetails;

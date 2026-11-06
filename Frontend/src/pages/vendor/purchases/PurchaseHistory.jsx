import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  FileSpreadsheet,
  Tractor,
  Handshake,
  Eye,
  Printer,
  ShoppingCart,
  IndianRupee,
  ShieldAlert,
  Clock,
} from 'lucide-react';
import { useVendor } from '../../../hooks/useVendor';
import { useDebounce } from '../../../hooks/useDebounce';
import VendorPageHeader from '../VendorPageHeader';
import VendorStatCard from '../VendorStatCard';
import VendorSearch from '../VendorSearch';
import VendorFilters from '../VendorFilters';
import VendorDatePicker from '../VendorDatePicker';
import VendorDataTable from '../VendorDataTable';
import VendorStatusBadge from '../VendorStatusBadge';
import VendorModal from '../VendorModal';
import VendorExportMenu from '../VendorExportMenu';
import PurchaseDetails from './PurchaseDetails';
import { CROP_OPTIONS, OTP_STATUSES } from '../../../utils/constants';
import { formatCurrency, formatNumber } from '../../../utils/formatCurrency';
import { formatDate, isDateInRange } from '../../../utils/formatDate';
import { printDocumentSummary } from '../../../utils/exportUtils';

export function PurchaseHistory() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialPurchaseId = searchParams.get('purchaseId');

  const { purchases } = useVendor();

  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'Farmer' | 'Middleman'
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 200);
  const [cropFilter, setCropFilter] = useState('All');
  const [otpFilter, setOtpFilter] = useState('All');
  const [paymentFilter, setPaymentFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [datePreset, setDatePreset] = useState('all');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const [selectedPurchase, setSelectedPurchase] = useState(null);

  useEffect(() => {
    if (initialPurchaseId) {
      const found = purchases.find((p) => p.id === initialPurchaseId);
      if (found) setSelectedPurchase(found);
    }
  }, [initialPurchaseId, purchases]);

  // Keep modal data live when OTP or payment updates
  const liveSelectedPurchase = useMemo(
    () =>
      selectedPurchase
        ? purchases.find((p) => p.id === selectedPurchase.id) || selectedPurchase
        : null,
    [selectedPurchase, purchases]
  );

  const summary = useMemo(() => {
    const confirmed = purchases.filter((p) => p.status === 'Confirmed');
    const farmerList = purchases.filter((p) => p.supplierCategory === 'Farmer');
    const midList = purchases.filter((p) => p.supplierCategory === 'Middleman');
    const totalValue = confirmed.reduce((sum, p) => sum + Number(p.totalAmount || 0), 0);
    const pendingConfirmations = purchases.filter((p) => p.otpStatus !== 'Verified').length;
    const pendingPayments = confirmed.reduce(
      (sum, p) => sum + Math.max(0, Number(p.totalAmount || 0) - Number(p.paidAmount || 0)),
      0
    );

    return {
      totalPurchases: purchases.length,
      farmerCount: farmerList.length,
      middlemanCount: midList.length,
      totalValue,
      pendingConfirmations,
      pendingPayments,
    };
  }, [purchases]);

  const filteredPurchases = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    return purchases.filter((p) => {
      if (activeTab !== 'all' && p.supplierCategory !== activeTab) return false;
      if (cropFilter !== 'All' && !p.crop.toLowerCase().includes(cropFilter.toLowerCase())) {
        return false;
      }
      if (otpFilter !== 'All' && p.otpStatus !== otpFilter) return false;
      if (paymentFilter !== 'All' && p.paymentStatus !== paymentFilter) return false;
      if (statusFilter !== 'All' && p.status !== statusFilter) return false;
      if (
        !isDateInRange(p.purchaseDate, datePreset, customStart, customEnd, '2026-11-05')
      ) {
        return false;
      }
      if (q) {
        const match =
          p.id.toLowerCase().includes(q) ||
          p.supplierName.toLowerCase().includes(q) ||
          p.crop.toLowerCase().includes(q) ||
          (p.district || '').toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [
    purchases,
    activeTab,
    debouncedSearch,
    cropFilter,
    otpFilter,
    paymentFilter,
    statusFilter,
    datePreset,
    customStart,
    customEnd,
  ]);

  const resetFilters = () => {
    setSearch('');
    setCropFilter('All');
    setOtpFilter('All');
    setPaymentFilter('All');
    setStatusFilter('All');
    setDatePreset('all');
  };

  const columns = [
    {
      key: 'id',
      header: 'Purchase ID',
      sortable: true,
      render: (row) => (
        <button
          type="button"
          onClick={() => setSelectedPurchase(row)}
          className="font-mono font-bold text-brand-primary hover:underline cursor-pointer"
        >
          {row.id}
        </button>
      ),
    },
    {
      key: 'supplierName',
      header: 'Supplier Name',
      sortable: true,
      render: (row) => (
        <div>
          <p className="font-bold text-brand-text">{row.supplierName}</p>
          <p className="text-xs text-brand-muted">{row.supplierId}</p>
        </div>
      ),
    },
    {
      key: 'supplierCategory',
      header: 'Supplier Category',
      sortable: true,
      render: (row) => (
        <span className="px-2 py-0.5 rounded-md bg-brand-light/70 text-brand-primary text-xs font-semibold">
          {row.supplierCategory}
        </span>
      ),
    },
    {
      key: 'crop',
      header: 'Crop',
      sortable: true,
      render: (row) => (
        <div>
          <p className="font-semibold text-brand-text">{row.crop}</p>
          <p className="text-[11px] text-brand-muted">{row.variety}</p>
        </div>
      ),
    },
    {
      key: 'quantity',
      header: 'Quantity',
      align: 'right',
      sortable: true,
      render: (row) => <span className="font-semibold">{formatNumber(row.quantity)}</span>,
    },
    {
      key: 'unit',
      header: 'Unit',
    },
    {
      key: 'rate',
      header: 'Rate',
      align: 'right',
      sortable: true,
      render: (row) => formatCurrency(row.rate),
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
      exportAccessor: (row) => row.totalAmount,
    },
    {
      key: 'purchaseDate',
      header: 'Purchase Date',
      sortable: true,
      render: (row) => <span className="whitespace-nowrap">{formatDate(row.purchaseDate)}</span>,
    },
    {
      key: 'otpStatus',
      header: 'OTP Status',
      render: (row) => <VendorStatusBadge status={row.otpStatus} size="xs" />,
    },
    {
      key: 'expectedPaymentDate',
      header: 'Expected Payment Date',
      render: (row) => (
        <span className="whitespace-nowrap text-xs text-brand-muted">
          {formatDate(row.expectedPaymentDate)}
        </span>
      ),
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
        <div className="inline-flex items-center gap-1">
          <button
            type="button"
            onClick={() => setSelectedPurchase(row)}
            title="View Purchase Details"
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-brand-light text-brand-primary hover:bg-brand-secondary hover:text-white transition-colors cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            View
          </button>
          <button
            type="button"
            onClick={() =>
              printDocumentSummary(
                `Purchase Voucher – ${row.id}`,
                `${row.supplierCategory} Purchase • ${formatDate(row.purchaseDate)}`,
                [
                  {
                    heading: 'Purchase Summary',
                    rows: [
                      ['Purchase ID', row.id],
                      ['Supplier', `${row.supplierName} (${row.supplierCategory})`],
                      ['Crop & Quantity', `${row.crop} – ${row.quantity} ${row.unit}`],
                      ['Total Amount', formatCurrency(row.totalAmount)],
                      ['OTP & Status', `${row.otpStatus} / ${row.status}`],
                    ],
                  },
                ]
              )
            }
            title="Print Voucher"
            className="p-1.5 rounded-lg border border-brand-border bg-brand-surface text-brand-muted hover:text-brand-primary cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <VendorPageHeader
        title="Purchase History"
        subtitle="Audit log of all raw material purchases from Farmers and Middlemen with OTP, inventory, and ledger traceability."
        icon={FileSpreadsheet}
        actions={
          <>
            <VendorExportMenu
              data={filteredPurchases}
              columns={columns.filter((c) => c.key !== 'actions')}
              filename="purchase_history.csv"
            />
            <button
              type="button"
              onClick={() => navigate('/vendor/purchases/farmers')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-brand-light text-brand-primary hover:bg-brand-secondary hover:text-white transition-colors cursor-pointer"
            >
              <Tractor className="w-3.5 h-3.5" />
              <span>+ Farmer Purchase</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/vendor/purchases/middlemen')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-brand-primary text-white hover:bg-brand-secondary transition-colors cursor-pointer"
            >
              <Handshake className="w-3.5 h-3.5" />
              <span>+ Middleman Purchase</span>
            </button>
          </>
        }
      />

      {/* 6 Purchase Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        <VendorStatCard
          title="Total Purchases"
          value={formatNumber(summary.totalPurchases, 0)}
          description="All purchase transactions"
          icon={ShoppingCart}
        />
        <VendorStatCard
          title="Farmer Purchases"
          value={formatNumber(summary.farmerCount, 0)}
          description="Direct from farmers"
          icon={Tractor}
        />
        <VendorStatCard
          title="Middleman Purchases"
          value={formatNumber(summary.middlemanCount, 0)}
          description="From mandi traders"
          icon={Handshake}
        />
        <VendorStatCard
          title="Total Purchase Value"
          value={formatCurrency(summary.totalValue)}
          description="Confirmed purchases"
          icon={IndianRupee}
          highlight
        />
        <VendorStatCard
          title="Pending Confirmations"
          value={formatNumber(summary.pendingConfirmations, 0)}
          description="Awaiting OTP verification"
          icon={ShieldAlert}
          onClick={() => navigate('/vendor/confirmations')}
        />
        <VendorStatCard
          title="Pending Payments"
          value={formatCurrency(summary.pendingPayments)}
          description="Supplier payables due"
          icon={Clock}
          onClick={() => navigate('/vendor/ledger')}
        />
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-brand-border pb-3">
        <div className="inline-flex rounded-xl bg-brand-surface p-1 border border-brand-border shadow-2xs">
          {[
            { id: 'all', label: `All Purchases (${purchases.length})` },
            { id: 'Farmer', label: `Purchases from Farmers (${summary.farmerCount})` },
            { id: 'Middleman', label: `Purchases from Middlemen (${summary.middlemanCount})` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-brand-primary text-white shadow-2xs'
                  : 'text-brand-muted hover:text-brand-primary'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <VendorDatePicker
          preset={datePreset}
          onPresetChange={setDatePreset}
          startDate={customStart}
          endDate={customEnd}
          onStartDateChange={setCustomStart}
          onEndDateChange={setCustomEnd}
        />
      </div>

      {/* Search & Filters */}
      <div className="bg-brand-surface p-4 rounded-2xl border border-brand-border shadow-2xs flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3">
        <VendorSearch
          value={search}
          onChange={setSearch}
          placeholder="Search by Purchase ID, Supplier Name, Crop, or District..."
        />
        <VendorFilters
          filters={[
            {
              key: 'crop',
              label: 'Crop',
              value: cropFilter,
              onChange: setCropFilter,
              options: CROP_OPTIONS,
            },
            {
              key: 'otp',
              label: 'OTP Status',
              value: otpFilter,
              onChange: setOtpFilter,
              options: OTP_STATUSES,
            },
            {
              key: 'payment',
              label: 'Payment Status',
              value: paymentFilter,
              onChange: setPaymentFilter,
              options: ['Paid', 'Partial', 'Unpaid', 'Pending'],
            },
            {
              key: 'status',
              label: 'Purchase Status',
              value: statusFilter,
              onChange: setStatusFilter,
              options: ['Confirmed', 'Pending OTP Confirmation', 'Draft'],
            },
          ]}
          onReset={resetFilters}
        />
      </div>

      {/* Purchase History Table */}
      <VendorDataTable
        columns={columns}
        data={filteredPurchases}
        onResetFilters={resetFilters}
      />

      {/* Purchase Details Modal */}
      <VendorModal
        isOpen={Boolean(liveSelectedPurchase)}
        onClose={() => setSelectedPurchase(null)}
        title={`Purchase Details – ${liveSelectedPurchase?.id || ''}`}
        subtitle={`${liveSelectedPurchase?.supplierName || ''} (${liveSelectedPurchase?.supplierCategory || ''})`}
        size="xl"
      >
        <PurchaseDetails
          purchase={liveSelectedPurchase}
          onClose={() => setSelectedPurchase(null)}
        />
      </VendorModal>
    </div>
  );
}

export default PurchaseHistory;


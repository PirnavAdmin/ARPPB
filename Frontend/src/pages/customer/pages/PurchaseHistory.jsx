import { useState, useMemo } from 'react';
import {
  History,
  CheckCircle2,
  Wallet,
  ShoppingBag,
  Eye,
  Calendar,
  MapPin,
  Package,
} from 'lucide-react';
import { useCustomer } from '../context/useCustomer';
import { useDebounce } from '../../../hooks/useDebounce';
import { usePagination } from '../../../hooks/usePagination';
import { formatCurrency } from '../../../utils/formatCurrency';
import { formatDate, isDateInRange } from '../../../utils/formatDate';
import CustomerPageHeader from '../components/CustomerPageHeader';
import CustomerStatCard from '../components/CustomerStatCard';
import CustomerSearch from '../components/CustomerSearch';
import CustomerFilters from '../components/CustomerFilters';
import CustomerOrderTable from '../components/CustomerOrderTable';
import CustomerPagination from '../components/CustomerPagination';
import CustomerStatusBadge from '../components/CustomerStatusBadge';
import CustomerModal from '../components/CustomerModal';

export function PurchaseHistory() {
  const { purchaseHistory, categories } = useCustomer();

  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 200);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [datePreset, setDatePreset] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const [selectedTxn, setSelectedTxn] = useState(null);

  const filteredHistory = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    return purchaseHistory.filter((item) => {
      if (categoryFilter !== 'All' && item.category !== categoryFilter) return false;
      if (statusFilter !== 'All' && item.status !== statusFilter) return false;

      if (fromDate || toDate) {
        if (!isDateInRange(item.purchaseDate, 'custom', fromDate, toDate, '2026-11-11')) {
          return false;
        }
      } else if (
        datePreset !== 'all' &&
        !isDateInRange(item.purchaseDate, datePreset, '', '', '2026-11-11')
      ) {
        return false;
      }

      if (q) {
        const hit = [
          item.transactionId,
          item.orderId,
          item.productName,
          item.category,
          item.location,
          item.batchReference,
        ]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(q));
        if (!hit) return false;
      }
      return true;
    });
  }, [purchaseHistory, debouncedSearch, categoryFilter, statusFilter, datePreset, fromDate, toDate]);

  const summary = useMemo(() => {
    const totalCount = purchaseHistory.length;
    const completedCount = purchaseHistory.filter((p) => p.status === 'Completed').length;
    const confirmedCount = purchaseHistory.filter((p) => p.status === 'Confirmed').length;
    const totalValue = purchaseHistory.reduce(
      (sum, p) => sum + (Number(p.totalAmount) || 0),
      0
    );
    return { totalCount, completedCount, confirmedCount, totalValue };
  }, [purchaseHistory]);

  const pagination = usePagination(filteredHistory, 8);

  const handleResetFilters = () => {
    setSearchQuery('');
    setCategoryFilter('All');
    setStatusFilter('All');
    setDatePreset('all');
    setFromDate('');
    setToDate('');
    pagination.goToPage(1);
  };

  const filterConfig = [
    {
      key: 'category',
      label: 'Product Category',
      value: categoryFilter,
      onChange: (val) => {
        setCategoryFilter(val);
        pagination.goToPage(1);
      },
      options: [
        { label: 'All Categories', value: 'All' },
        ...categories.map((c) => ({ label: c.name, value: c.name })),
      ],
    },
    {
      key: 'status',
      label: 'Purchase Status',
      value: statusFilter,
      onChange: (val) => {
        setStatusFilter(val);
        pagination.goToPage(1);
      },
      options: [
        { label: 'All Status', value: 'All' },
        { label: 'Completed', value: 'Completed' },
        { label: 'Confirmed', value: 'Confirmed' },
      ],
    },
    {
      key: 'datePreset',
      label: 'Date Range',
      value: datePreset,
      onChange: (val) => {
        setDatePreset(val);
        if (val !== 'custom') {
          setFromDate('');
          setToDate('');
        }
        pagination.goToPage(1);
      },
      options: [
        { label: 'All Time', value: 'all' },
        { label: 'Last 7 Days', value: 'last7' },
        { label: 'Last 30 Days', value: 'last30' },
        { label: 'This Month', value: 'thisMonth' },
        { label: 'Last Month', value: 'lastMonth' },
        { label: 'Custom Range', value: 'custom' },
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
          <span className="text-[11px] font-mono text-[#64748B]">{row.orderId}</span>
        </div>
      ),
    },
    {
      key: 'purchaseDate',
      label: 'Purchase Date',
      sortable: true,
      render: (row) => <span className="text-xs">{formatDate(row.purchaseDate)}</span>,
    },
    {
      key: 'productName',
      label: 'Product Name',
      sortable: true,
      render: (row) => (
        <div>
          <span className="font-semibold text-[#0F172A] block">{row.productName}</span>
          <span className="text-[11px] text-[#64748B]">{row.category}</span>
        </div>
      ),
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
      key: 'expectedPaymentDate',
      label: 'Expected Payment Date',
      render: (row) => (
        <span className="text-xs">{formatDate(row.expectedPaymentDate)}</span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <CustomerStatusBadge status={row.status} size="xs" />,
    },
    {
      key: 'actions',
      label: 'Action',
      align: 'right',
      render: (row) => (
        <button
          type="button"
          onClick={() => setSelectedTxn(row)}
          className="h-8 inline-flex items-center gap-1.5 px-2.5 text-xs font-semibold rounded-lg bg-[#CCFBF1] text-[#0F766E] border border-[#14B8A6]/30 hover:bg-[#0F766E] hover:text-white transition-colors cursor-pointer"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Details</span>
        </button>
      ),
    },
  ];

  const hasExtraFilter = Boolean(searchQuery.trim() || fromDate || toDate || datePreset !== 'all');

  return (
    <div className="space-y-6">
      <CustomerPageHeader
        title="Purchase History"
        subtitle="Audit log of completed and OTP-confirmed raw agricultural product purchases."
        icon={History}
        badge={`${purchaseHistory.length} Transactions`}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <CustomerStatCard
          title="Confirmed Purchases"
          value={summary.totalCount}
          description="Confirmed & completed records"
          icon={ShoppingBag}
        />
        <CustomerStatCard
          title="Completed Orders"
          value={summary.completedCount}
          description="Delivered & finalized"
          icon={CheckCircle2}
        />
        <CustomerStatCard
          title="In Fulfilment (Confirmed)"
          value={summary.confirmedCount}
          description="OTP verified, preparing delivery"
          icon={History}
        />
        <CustomerStatCard
          title="Total Purchase Spend"
          value={formatCurrency(summary.totalValue, false)}
          description="Cumulative verified purchase value"
          icon={Wallet}
        />
      </div>

      {/* Search, Filters & Custom Date Range */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 space-y-4 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="w-full md:w-96">
            <CustomerSearch
              value={searchQuery}
              onChange={(val) => {
                setSearchQuery(val);
                pagination.goToPage(1);
              }}
              placeholder="Search Transaction ID, Order ID, Product, Location..."
            />
          </div>
          <div className="text-xs text-[#64748B]">
            Showing <strong>{filteredHistory.length}</strong> verified purchase records
          </div>
        </div>

        <CustomerFilters
          filters={filterConfig}
          hasExtraActive={hasExtraFilter}
          onReset={handleResetFilters}
        >
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-[#64748B] inline-flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-[#0F766E]" />
              From:
            </span>
            <input
              type="date"
              aria-label="Purchase history start date"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
                setDatePreset('custom');
                pagination.goToPage(1);
              }}
              className="px-2.5 py-1.5 text-xs bg-white border border-[#E2E8F0] rounded-lg text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/30 focus:border-[#0F766E]"
            />
            <span className="text-xs text-[#64748B]">To:</span>
            <input
              type="date"
              aria-label="Purchase history end date"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value);
                setDatePreset('custom');
                pagination.goToPage(1);
              }}
              className="px-2.5 py-1.5 text-xs bg-white border border-[#E2E8F0] rounded-lg text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/30 focus:border-[#0F766E]"
            />
          </div>
        </CustomerFilters>
      </div>

      {/* Purchase History Table */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden shadow-xs">
        <CustomerOrderTable
          columns={columns}
          data={pagination.paginatedData}
          rowKey="transactionId"
          enablePagination={false}
          emptyTitle="No Purchase History Records Match"
          emptyDescription="Try clearing your date range or category filters to view completed and confirmed purchases."
          emptyIcon={History}
          onResetFilters={handleResetFilters}
        />
        <CustomerPagination {...pagination} pageSizeOptions={[5, 8, 15, 25]} />
      </div>

      {/* Transaction Details Modal */}
      <CustomerModal
        isOpen={Boolean(selectedTxn)}
        onClose={() => setSelectedTxn(null)}
        title={`Purchase Transaction Details – ${selectedTxn?.transactionId || ''}`}
        subtitle={
          selectedTxn
            ? `Linked Order: ${selectedTxn.orderId} • Lot ${selectedTxn.batchReference || 'Standard'}`
            : ''
        }
        size="md"
        footer={
          <button
            type="button"
            onClick={() => setSelectedTxn(null)}
            className="px-4 py-2 text-xs font-semibold rounded-xl border border-[#E2E8F0] bg-white text-[#0F172A] hover:bg-[#F8FAFC] cursor-pointer"
          >
            Close
          </button>
        }
      >
        {selectedTxn && (
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] grid grid-cols-2 gap-3">
              <div>
                <span className="text-[#64748B] block">Transaction ID</span>
                <span className="font-bold text-[#0F766E]">{selectedTxn.transactionId}</span>
              </div>
              <div>
                <span className="text-[#64748B] block">Status</span>
                <div className="mt-0.5">
                  <CustomerStatusBadge status={selectedTxn.status} size="xs" />
                </div>
              </div>
              <div>
                <span className="text-[#64748B] block">Purchase Date</span>
                <span className="font-semibold text-[#0F172A]">
                  {formatDate(selectedTxn.purchaseDate)}
                </span>
              </div>
              <div>
                <span className="text-[#64748B] block">Expected Payment Date</span>
                <span className="font-semibold text-[#0F766E]">
                  {formatDate(selectedTxn.expectedPaymentDate)}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-[#E2E8F0] space-y-2.5">
              <h4 className="font-bold text-[#0F172A] flex items-center gap-1.5">
                <Package className="w-4 h-4 text-[#0F766E]" />
                Product &amp; Transaction Breakdown
              </h4>
              <div className="flex justify-between">
                <span className="text-[#64748B]">Product Name</span>
                <span className="font-bold text-[#0F172A]">{selectedTxn.productName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748B]">Category</span>
                <span className="font-semibold text-[#0F172A]">{selectedTxn.category}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#64748B] inline-flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[#0F766E]" /> Source Region
                </span>
                <span className="font-medium text-[#0F172A]">{selectedTxn.location}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748B]">Quantity</span>
                <span className="font-semibold">{selectedTxn.quantity}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748B]">Unit Price</span>
                <span className="font-semibold">{formatCurrency(selectedTxn.unitPrice)}</span>
              </div>
              <div className="pt-2 border-t border-[#E2E8F0] flex justify-between text-sm font-extrabold text-[#0F766E]">
                <span>Total Amount</span>
                <span>{formatCurrency(selectedTxn.totalAmount)}</span>
              </div>
            </div>
          </div>
        )}
      </CustomerModal>
    </div>
  );
}

export default PurchaseHistory;

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye } from 'lucide-react';
import VendorDataTable from '../VendorDataTable';
import VendorSearch from '../VendorSearch';
import VendorFilters from '../VendorFilters';
import VendorExportMenu from '../VendorExportMenu';
import VendorStatusBadge from '../VendorStatusBadge';
import VendorModal from '../VendorModal';
import { useDebounce } from '../../../hooks/useDebounce';
import { formatCurrency } from '../../../utils/formatCurrency';
import { formatDate } from '../../../utils/formatDate';

export function RecentTransactions({ purchases = [], sales = [], processingRecords = [] }) {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 200);
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('');
  const [selectedTxn, setSelectedTxn] = useState(null);

  const unifiedTransactions = useMemo(() => {
    const list = [];

    purchases.forEach((p) => {
      list.push({
        id: p.id,
        date: p.purchaseDate,
        partyName: p.supplierName,
        transactionType:
          p.supplierCategory === 'Farmer' ? 'Farmer Purchase' : 'Middleman Purchase',
        product: p.crop,
        quantity: `${p.quantity} ${p.unit}`,
        amount: p.totalAmount,
        otpStatus: p.otpStatus,
        expectedPaymentDate: p.expectedPaymentDate,
        status: p.status,
        targetPath:
          p.supplierCategory === 'Farmer'
            ? `/vendor/farmers?purchaseId=${p.id}`
            : `/vendor/middlemen?purchaseId=${p.id}`,
        raw: p,
      });
    });

    sales.forEach((s) => {
      list.push({
        id: s.id,
        date: s.salesDate,
        partyName: s.customerName,
        transactionType: 'Customer Sale',
        product: s.product,
        quantity: `${s.quantity} ${s.unit}`,
        amount: s.totalAmount,
        otpStatus: s.confirmationStatus,
        expectedPaymentDate: s.expectedPaymentDate,
        status: s.salesStatus,
        targetPath: '/vendor/sales/history',
        raw: s,
      });
    });

    processingRecords.forEach((proc) => {
      list.push({
        id: proc.id,
        date: proc.processingDate,
        partyName: proc.processingLocation || 'Internal Processing Unit',
        transactionType: 'Processing',
        product: `${proc.rawMaterial} → ${
          proc.outputs?.map((o) => o.productName).join(', ') || 'Finished Goods'
        }`,
        quantity: `${proc.inputQuantity} ${proc.inputUnit} → ${proc.actualOutputQuantity} ${proc.outputUnit}`,
        amount: proc.totalBatchCost,
        otpStatus: 'Verified',
        expectedPaymentDate: proc.processingDate,
        status: proc.status,
        targetPath: '/vendor/processing',
        raw: proc,
      });
    });

    return list.sort((a, b) => String(b.date).localeCompare(String(a.date)));
  }, [purchases, sales, processingRecords]);

  const filteredTransactions = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    return unifiedTransactions.filter((t) => {
      if (typeFilter !== 'All' && t.transactionType !== typeFilter) return false;
      if (statusFilter !== 'All' && t.status !== statusFilter) return false;
      if (dateFilter && t.date !== dateFilter) return false;
      if (q) {
        const match =
          t.id.toLowerCase().includes(q) ||
          t.partyName.toLowerCase().includes(q) ||
          t.product.toLowerCase().includes(q) ||
          t.transactionType.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [unifiedTransactions, debouncedSearch, typeFilter, statusFilter, dateFilter]);

  const columns = [
    {
      key: 'id',
      header: 'Transaction ID',
      sortable: true,
      render: (row) => (
        <button
          type="button"
          onClick={() => setSelectedTxn(row)}
          className="font-bold text-brand-primary hover:underline cursor-pointer"
        >
          {row.id}
        </button>
      ),
    },
    {
      key: 'date',
      header: 'Date',
      sortable: true,
      render: (row) => <span className="whitespace-nowrap">{formatDate(row.date)}</span>,
    },
    {
      key: 'partyName',
      header: 'Supplier / Customer',
      sortable: true,
      render: (row) => <span className="font-medium text-brand-text">{row.partyName}</span>,
    },
    {
      key: 'transactionType',
      header: 'Transaction Type',
      sortable: true,
      render: (row) => (
        <span className="px-2 py-0.5 rounded-md bg-brand-light/60 text-brand-primary text-xs font-semibold whitespace-nowrap">
          {row.transactionType}
        </span>
      ),
    },
    {
      key: 'product',
      header: 'Product',
      render: (row) => <span className="text-xs font-medium">{row.product}</span>,
    },
    {
      key: 'quantity',
      header: 'Quantity',
      render: (row) => <span className="whitespace-nowrap text-xs font-semibold">{row.quantity}</span>,
    },
    {
      key: 'amount',
      header: 'Amount',
      align: 'right',
      sortable: true,
      render: (row) => (
        <span className="font-bold text-brand-text whitespace-nowrap">
          {formatCurrency(row.amount)}
        </span>
      ),
      exportAccessor: (row) => row.amount,
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
        <button
          type="button"
          onClick={() => setSelectedTxn(row)}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-brand-light text-brand-primary hover:bg-brand-secondary hover:text-white transition-colors cursor-pointer"
        >
          <Eye className="w-3.5 h-3.5" />
          View
        </button>
      ),
    },
  ];

  const resetFilters = () => {
    setSearch('');
    setTypeFilter('All');
    setStatusFilter('All');
    setDateFilter('');
  };

  return (
    <div className="bg-brand-surface rounded-2xl border border-brand-border p-5 shadow-2xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-brand-primary">Recent Transactions</h3>
          <p className="text-xs text-brand-muted">
            Unified log of Farmer Purchases, Middleman Purchases, Customer Sales, and Processing Batches
          </p>
        </div>
        <VendorExportMenu
          data={filteredTransactions}
          columns={columns.filter((c) => c.key !== 'actions')}
          filename="recent_transactions.csv"
        />
      </div>

      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        <VendorSearch
          value={search}
          onChange={setSearch}
          placeholder="Search by Transaction ID, supplier, customer, or product..."
        />
        <VendorFilters
          filters={[
            {
              key: 'type',
              label: 'Type',
              value: typeFilter,
              onChange: setTypeFilter,
              options: [
                'Farmer Purchase',
                'Middleman Purchase',
                'Customer Sale',
                'Processing',
              ],
            },
            {
              key: 'status',
              label: 'Status',
              value: statusFilter,
              onChange: setStatusFilter,
              options: [
                'Confirmed',
                'Pending OTP Confirmation',
                'Completed',
                'Delivered',
                'Shipped',
                'Packed',
                'Processing',
                'New',
                'Draft',
              ],
            },
          ]}
          onReset={resetFilters}
        >
          <input
            type="date"
            aria-label="Filter by exact transaction date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-brand-surface border border-brand-border rounded-lg text-brand-text focus:outline-none focus:border-brand-primary"
          />
        </VendorFilters>
      </div>

      <VendorDataTable
        columns={columns}
        data={filteredTransactions}
        initialPageSize={8}
        onResetFilters={resetFilters}
      />

      {/* Transaction Quick Details Modal */}
      <VendorModal
        isOpen={Boolean(selectedTxn)}
        onClose={() => setSelectedTxn(null)}
        title={selectedTxn ? `Transaction Details – ${selectedTxn.id}` : ''}
        subtitle={selectedTxn ? `${selectedTxn.transactionType} • ${formatDate(selectedTxn.date)}` : ''}
        size="md"
        footer={
          selectedTxn && (
            <>
              <button
                type="button"
                onClick={() => setSelectedTxn(null)}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-brand-light text-brand-primary hover:bg-brand-secondary hover:text-white transition-colors cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  const path = selectedTxn.targetPath;
                  setSelectedTxn(null);
                  navigate(path);
                }}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-brand-primary text-white hover:bg-brand-secondary transition-colors cursor-pointer"
              >
                Open Full Module
              </button>
            </>
          )
        }
      >
        {selectedTxn && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3 rounded-xl bg-brand-background border border-brand-border">
              <span className="text-brand-muted">Transaction ID</span>
              <p className="font-bold text-brand-primary text-sm mt-0.5">{selectedTxn.id}</p>
            </div>
            <div className="p-3 rounded-xl bg-brand-background border border-brand-border">
              <span className="text-brand-muted">Transaction Type</span>
              <p className="font-bold text-brand-text text-sm mt-0.5">
                {selectedTxn.transactionType}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-brand-background border border-brand-border">
              <span className="text-brand-muted">Party / Facility</span>
              <p className="font-semibold text-brand-text mt-0.5">{selectedTxn.partyName}</p>
            </div>
            <div className="p-3 rounded-xl bg-brand-background border border-brand-border">
              <span className="text-brand-muted">Product &amp; Quantity</span>
              <p className="font-semibold text-brand-text mt-0.5">
                {selectedTxn.product} ({selectedTxn.quantity})
              </p>
            </div>
            <div className="p-3 rounded-xl bg-brand-light/40 border border-brand-secondary/30">
              <span className="text-brand-primary font-semibold">Total Value</span>
              <p className="font-bold text-brand-primary text-base mt-0.5">
                {formatCurrency(selectedTxn.amount)}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-brand-background border border-brand-border flex items-center justify-between">
              <div>
                <span className="text-brand-muted block">Status / OTP</span>
                <div className="flex items-center gap-2 mt-1">
                  <VendorStatusBadge status={selectedTxn.status} size="xs" />
                  <VendorStatusBadge status={selectedTxn.otpStatus} size="xs" />
                </div>
              </div>
            </div>
          </div>
        )}
      </VendorModal>
    </div>
  );
}

export default RecentTransactions;


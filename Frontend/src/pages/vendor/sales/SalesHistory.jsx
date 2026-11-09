import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  ClipboardCheck,
  Clock,
  IndianRupee,
  Wallet,
  Plus,
  Eye,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import { useVendor } from '../../../hooks/useVendor';
import { useDebounce } from '../../../hooks/useDebounce';
import { usePagination } from '../../../hooks/usePagination';
import { formatCurrency } from '../../../utils/formatCurrency';
import { formatDate, isDateInRange } from '../../../utils/formatDate';
import { exportToCSV, printDocumentSummary } from '../../../utils/exportUtils';
import VendorPageHeader from '../VendorPageHeader';
import VendorStatCard from '../VendorStatCard';
import VendorSearch from '../VendorSearch';
import VendorFilters from '../VendorFilters';
import VendorDataTable from '../VendorDataTable';
import VendorPagination from '../VendorPagination';
import VendorStatusBadge from '../VendorStatusBadge';
import VendorExportMenu from '../VendorExportMenu';
import SalesDetails from './SalesDetails';

export default function SalesHistory() {
  const navigate = useNavigate();
  const { sales, orders, customers, products } = useVendor();

  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 200);

  const [filters, setFilters] = useState({
    datePreset: 'All Time',
    customerId: 'All',
    productName: 'All',
    confirmationStatus: 'All',
    paymentStatus: 'All',
    salesStatus: 'All',
  });

  const [selectedSaleId, setSelectedSaleId] = useState(null);

  const selectedSale = useMemo(
    () => sales.find((s) => s.id === selectedSaleId) || null,
    [sales, selectedSaleId]
  );

  // 6 Summary Cards
  const summaryStats = useMemo(() => {
    const validSales = sales.filter((s) => s.salesStatus !== 'Cancelled');
    const confirmedSales = validSales.filter((s) => s.confirmationStatus === 'Verified');
    const completedSalesCount = sales.filter((s) => s.salesStatus === 'Completed').length;
    const pendingOrdersCount = orders.filter(
      (o) => o.orderStatus !== 'Completed' && o.orderStatus !== 'Cancelled'
    ).length;

    const totalRevenue = confirmedSales.reduce(
      (sum, s) => sum + Number(s.totalAmount || 0),
      0
    );
    const totalReceived = confirmedSales.reduce(
      (sum, s) => sum + Number(s.receivedAmount || 0),
      0
    );
    const outstandingReceivables = Math.max(0, totalRevenue - totalReceived);

    return {
      totalSales: sales.length,
      totalOrders: orders.length,
      completedSalesCount,
      pendingOrdersCount,
      totalRevenue,
      outstandingReceivables,
    };
  }, [sales, orders]);

  // Filtered Sales
  const filteredSales = useMemo(() => {
    return sales.filter((s) => {
      if (
        debouncedSearch &&
        ![s.id, s.orderId, s.customerName, s.businessName, s.product, s.batchNumber]
          .filter(Boolean)
          .some((val) =>
            String(val).toLowerCase().includes(debouncedSearch.toLowerCase())
          )
      ) {
        return false;
      }

      if (
        filters.datePreset !== 'All Time' &&
        !isDateInRange(s.salesDate, filters.datePreset, '', '', '2026-11-05')
      ) {
        return false;
      }

      if (filters.customerId !== 'All' && s.customerId !== filters.customerId) {
        return false;
      }

      if (
        filters.productName !== 'All' &&
        !String(s.product || '')
          .toLowerCase()
          .includes(filters.productName.toLowerCase())
      ) {
        return false;
      }

      if (
        filters.confirmationStatus !== 'All' &&
        s.confirmationStatus !== filters.confirmationStatus
      ) {
        return false;
      }

      if (
        filters.paymentStatus !== 'All' &&
        s.paymentStatus !== filters.paymentStatus
      ) {
        return false;
      }

      if (filters.salesStatus !== 'All' && s.salesStatus !== filters.salesStatus) {
        return false;
      }

      return true;
    });
  }, [sales, debouncedSearch, filters]);

  const pagination = usePagination(filteredSales, 10);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    pagination.goToPage(1);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setFilters({
      datePreset: 'All Time',
      customerId: 'All',
      productName: 'All',
      confirmationStatus: 'All',
      paymentStatus: 'All',
      salesStatus: 'All',
    });
    pagination.goToPage(1);
  };

  const handleExportCSV = () => {
    exportToCSV(
      filteredSales,
      [
        { key: 'id', label: 'Sales ID' },
        { key: 'orderId', label: 'Order ID' },
        { key: 'customerName', label: 'Customer Name' },
        { key: 'product', label: 'Product' },
        { key: 'quantity', label: 'Quantity' },
        { key: 'unit', label: 'Unit' },
        { key: 'unitPrice', label: 'Unit Price (INR)' },
        { key: 'totalAmount', label: 'Total Amount (INR)' },
        { key: 'salesDate', label: 'Sales Date' },
        { key: 'confirmationStatus', label: 'Confirmation Status' },
        { key: 'expectedPaymentDate', label: 'Expected Payment Date' },
        { key: 'paymentStatus', label: 'Payment Status' },
        { key: 'salesStatus', label: 'Sales Status' },
      ],
      'Vendor_Sales_History_Register'
    );
  };

  const handlePrintRegister = () => {
    printDocumentSummary({
      title: 'Finished Products Sales History & Receivables Register',
      subtitle: `Total Filtered Sales: ${filteredSales.length} | Generated on 05 Nov 2026`,
      metadata: [
        { label: 'Total Sales Records', value: String(summaryStats.totalSales) },
        { label: 'Completed Sales', value: String(summaryStats.completedSalesCount) },
        { label: 'Confirmed Sales Revenue', value: formatCurrency(summaryStats.totalRevenue) },
        {
          label: 'Outstanding Receivables',
          value: formatCurrency(summaryStats.outstandingReceivables),
        },
      ],
      items: filteredSales.map((s) => ({
        'Sales ID': s.id,
        Customer: s.customerName,
        Product: s.product,
        Qty: `${s.quantity} ${s.unit}`,
        'Total Amount': formatCurrency(s.totalAmount),
        'Sales Date': formatDate(s.salesDate),
        OTP: s.confirmationStatus,
        Payment: s.paymentStatus,
        Status: s.salesStatus,
      })),
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
      key: 'customerId',
      label: 'Customer',
      value: filters.customerId,
      options: [
        { label: 'All Customers', value: 'All' },
        ...customers.map((c) => ({ label: c.customerName, value: c.id })),
      ],
    },
    {
      key: 'productName',
      label: 'Finished Product',
      value: filters.productName,
      options: [
        { label: 'All Products', value: 'All' },
        ...products.map((p) => ({ label: p.productName, value: p.productName })),
      ],
    },
    {
      key: 'confirmationStatus',
      label: 'Confirmation Status',
      value: filters.confirmationStatus,
      options: [
        { label: 'All OTP Status', value: 'All' },
        { label: 'Verified', value: 'Verified' },
        { label: 'Pending', value: 'Pending' },
        { label: 'Not Sent', value: 'Not Sent' },
      ],
    },
    {
      key: 'paymentStatus',
      label: 'Payment Status',
      value: filters.paymentStatus,
      options: [
        { label: 'All Payment Status', value: 'All' },
        { label: 'Paid', value: 'Paid' },
        { label: 'Partial', value: 'Partial' },
        { label: 'Unpaid', value: 'Unpaid' },
        { label: 'Pending', value: 'Pending' },
      ],
    },
    {
      key: 'salesStatus',
      label: 'Sales Status',
      value: filters.salesStatus,
      options: [
        { label: 'All Sales Status', value: 'All' },
        { label: 'New', value: 'New' },
        { label: 'Confirmed', value: 'Confirmed' },
        { label: 'Processing', value: 'Processing' },
        { label: 'Packed', value: 'Packed' },
        { label: 'Shipped', value: 'Shipped' },
        { label: 'Delivered', value: 'Delivered' },
        { label: 'Completed', value: 'Completed' },
        { label: 'Cancelled', value: 'Cancelled' },
      ],
    },
  ];

  const columns = [
    {
      key: 'id',
      label: 'Sales ID',
      render: (row) => (
        <div>
          <span className="font-bold text-brand-primary block">{row.id}</span>
          <span className="text-[11px] text-brand-muted font-mono">
            {row.orderId || '—'}
          </span>
        </div>
      ),
    },
    {
      key: 'customerName',
      label: 'Customer Name',
      render: (row) => (
        <div>
          <span className="font-semibold text-brand-text block">
            {row.customerName}
          </span>
          <span className="text-[11px] text-brand-muted">
            {row.businessName || row.customerId}
          </span>
        </div>
      ),
    },
    {
      key: 'product',
      label: 'Product',
      render: (row) => (
        <div>
          <span className="font-medium text-brand-text block">{row.product}</span>
          <span className="text-[11px] font-mono text-brand-primary">
            {row.batchNumber || 'Standard Batch'}
          </span>
        </div>
      ),
    },
    {
      key: 'quantity',
      label: 'Quantity',
      align: 'right',
      render: (row) => <span className="font-semibold">{row.quantity}</span>,
    },
    {
      key: 'unit',
      label: 'Unit',
      render: (row) => <span className="text-brand-muted">{row.unit}</span>,
    },
    {
      key: 'unitPrice',
      label: 'Unit Price',
      align: 'right',
      render: (row) => (
        <span className="font-medium">{formatCurrency(row.unitPrice)}</span>
      ),
    },
    {
      key: 'totalAmount',
      label: 'Total Amount',
      align: 'right',
      render: (row) => (
        <span className="font-bold text-brand-primary">
          {formatCurrency(row.totalAmount)}
        </span>
      ),
    },
    {
      key: 'salesDate',
      label: 'Sales Date',
      render: (row) => <span>{formatDate(row.salesDate)}</span>,
    },
    {
      key: 'confirmationStatus',
      label: 'Confirmation Status',
      render: (row) => <VendorStatusBadge status={row.confirmationStatus} />,
    },
    {
      key: 'expectedPaymentDate',
      label: 'Expected Payment Date',
      render: (row) => <span>{formatDate(row.expectedPaymentDate)}</span>,
    },
    {
      key: 'paymentStatus',
      label: 'Payment Status',
      render: (row) => <VendorStatusBadge status={row.paymentStatus} />,
    },
    {
      key: 'salesStatus',
      label: 'Sales Status',
      render: (row) => <VendorStatusBadge status={row.salesStatus} />,
    },
    {
      key: 'actions',
      label: 'Actions',
      align: 'right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            type="button"
            onClick={() => setSelectedSaleId(row.id)}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-brand-light text-brand-primary hover:bg-brand-primary hover:text-white transition-colors cursor-pointer"
            title="View Sales Details & Invoice"
          >
            <Eye className="w-3.5 h-3.5" />
            Details
          </button>
          {row.confirmationStatus !== 'Verified' && (
            <button
              type="button"
              onClick={() => navigate('/vendor/confirmations')}
              className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-lg border border-brand-primary text-brand-primary hover:bg-brand-light/50 transition-colors cursor-pointer"
              title="Verify Customer OTP"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              OTP
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <VendorPageHeader
        title="Sales History & Invoice Register"
        subtitle="Complete register of B2B/B2C finished product sales, customer OTP confirmations, and receivable settlements"
        badge={`${filteredSales.length} Sales Records`}
        actions={
          <>
            <VendorExportMenu
              onExportCSV={handleExportCSV}
              onPrint={handlePrintRegister}
              label="Export / Print Sales"
            />
            <button
              type="button"
              onClick={() => navigate('/vendor/sales/new')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg bg-brand-primary text-white hover:bg-brand-secondary transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Sell Finished Products
            </button>
          </>
        }
      />

      {/* 6 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <VendorStatCard
          title="Total Sales"
          value={summaryStats.totalSales}
          subtitle="All recorded invoices"
          icon={ShoppingBag}
        />
        <VendorStatCard
          title="Total Orders"
          value={summaryStats.totalOrders}
          subtitle="Customer order book"
          icon={TrendingUp}
        />
        <VendorStatCard
          title="Completed Sales"
          value={summaryStats.completedSalesCount}
          subtitle="Delivered & closed"
          icon={ClipboardCheck}
        />
        <VendorStatCard
          title="Pending Orders"
          value={summaryStats.pendingOrdersCount}
          subtitle="In fulfilment pipeline"
          icon={Clock}
        />
        <VendorStatCard
          title="Total Revenue"
          value={formatCurrency(summaryStats.totalRevenue)}
          subtitle="OTP-verified sales"
          icon={IndianRupee}
          highlight
        />
        <VendorStatCard
          title="Outstanding Receivables"
          value={formatCurrency(summaryStats.outstandingReceivables)}
          subtitle="Pending customer dues"
          icon={Wallet}
        />
      </div>

      {/* Search & Filters */}
      <div className="bg-brand-surface border border-brand-border rounded-xl p-4 space-y-4 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="w-full md:w-96">
            <VendorSearch
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search Sales ID, Order ID, Customer, Product, Batch..."
            />
          </div>
          <div className="text-xs text-brand-muted">
            Showing <strong>{filteredSales.length}</strong> of{' '}
            <strong>{sales.length}</strong> sales invoices
          </div>
        </div>

        <VendorFilters
          filters={filterConfig}
          onFilterChange={handleFilterChange}
          onReset={handleResetFilters}
        />
      </div>

      {/* Sales Table */}
      <div className="bg-brand-surface border border-brand-border rounded-xl overflow-hidden shadow-xs">
        <VendorDataTable
          columns={columns}
          data={pagination.paginatedData}
          rowKey="id"
          enablePagination={false}
          emptyTitle="No Sales Invoices Found"
          emptyDescription="Adjust your search query or filters, or create a new customer sales order."
        />
        <VendorPagination {...pagination} />
      </div>

      {/* Sales Details & Invoice Modal */}
      <SalesDetails
        sale={selectedSale}
        isOpen={Boolean(selectedSale)}
        onClose={() => setSelectedSaleId(null)}
      />
    </div>
  );
}


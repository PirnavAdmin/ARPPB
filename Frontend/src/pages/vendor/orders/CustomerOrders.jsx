import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ClipboardList,
  Plus,
  Eye,
  ArrowRight,
  ShieldCheck,
  Truck,
  CheckCircle2,
  Clock,
  XCircle,
} from 'lucide-react';
import { useVendor } from '../../../hooks/useVendor';
import { useDebounce } from '../../../hooks/useDebounce';
import { usePagination } from '../../../hooks/usePagination';
import { formatCurrency } from '../../../utils/formatCurrency';
import { formatDate, isDateInRange } from '../../../utils/formatDate';
import { ORDER_STATUSES, VALID_ORDER_TRANSITIONS } from '../../../utils/constants';
import { exportToCSV, printDocumentSummary } from '../../../utils/exportUtils';
import VendorPageHeader from '../VendorPageHeader';
import VendorStatCard from '../VendorStatCard';
import VendorSearch from '../VendorSearch';
import VendorFilters from '../VendorFilters';
import VendorDataTable from '../VendorDataTable';
import VendorPagination from '../VendorPagination';
import VendorStatusBadge from '../VendorStatusBadge';
import VendorExportMenu from '../VendorExportMenu';
import OrderDetails from './OrderDetails';

const TABS = ['All', ...ORDER_STATUSES];

export default function CustomerOrders() {
  const navigate = useNavigate();
  const { orders, customers, updateOrderStatus } = useVendor();

  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 200);

  const [filters, setFilters] = useState({
    datePreset: 'All Time',
    customerId: 'All',
    otpStatus: 'All',
    paymentStatus: 'All',
  });

  const [selectedOrderId, setSelectedOrderId] = useState(null);

  const selectedOrder = useMemo(
    () => orders.find((o) => o.id === selectedOrderId) || null,
    [orders, selectedOrderId]
  );

  // Counts per tab
  const statusCounts = useMemo(() => {
    const counts = { All: orders.length };
    ORDER_STATUSES.forEach((st) => {
      counts[st] = orders.filter((o) => o.orderStatus === st).length;
    });
    return counts;
  }, [orders]);

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (activeTab !== 'All' && o.orderStatus !== activeTab) {
        return false;
      }

      if (
        debouncedSearch &&
        ![o.id, o.salesId, o.customerName, o.businessName, o.product]
          .filter(Boolean)
          .some((val) =>
            String(val).toLowerCase().includes(debouncedSearch.toLowerCase())
          )
      ) {
        return false;
      }

      if (
        filters.datePreset !== 'All Time' &&
        !isDateInRange(o.orderDate, filters.datePreset, '', '', '2026-11-05')
      ) {
        return false;
      }

      if (filters.customerId !== 'All' && o.customerId !== filters.customerId) {
        return false;
      }

      if (filters.otpStatus !== 'All' && o.otpStatus !== filters.otpStatus) {
        return false;
      }

      if (
        filters.paymentStatus !== 'All' &&
        o.paymentStatus !== filters.paymentStatus
      ) {
        return false;
      }

      return true;
    });
  }, [orders, activeTab, debouncedSearch, filters]);

  const pagination = usePagination(filteredOrders, 10);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    pagination.goToPage(1);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setActiveTab('All');
    setFilters({
      datePreset: 'All Time',
      customerId: 'All',
      otpStatus: 'All',
      paymentStatus: 'All',
    });
    pagination.goToPage(1);
  };

  const handleExportCSV = () => {
    exportToCSV(
      filteredOrders,
      [
        { key: 'id', label: 'Order ID' },
        { key: 'salesId', label: 'Sales ID' },
        { key: 'customerName', label: 'Customer Name' },
        { key: 'product', label: 'Product' },
        { key: 'quantity', label: 'Quantity' },
        { key: 'unit', label: 'Unit' },
        { key: 'price', label: 'Price (INR)' },
        { key: 'totalAmount', label: 'Total Amount (INR)' },
        { key: 'orderDate', label: 'Order Date' },
        { key: 'expectedDeliveryDate', label: 'Expected Delivery Date' },
        { key: 'otpStatus', label: 'OTP Status' },
        { key: 'paymentStatus', label: 'Payment Status' },
        { key: 'orderStatus', label: 'Order Status' },
      ],
      'Vendor_Customer_Orders'
    );
  };

  const handlePrintOrders = () => {
    printDocumentSummary({
      title: 'Customer Orders & Fulfilment Register',
      subtitle: `Filter Tab: ${activeTab} | Total Orders: ${filteredOrders.length}`,
      metadata: [
        { label: 'Total Orders', value: String(orders.length) },
        { label: 'Active Pipeline Orders', value: String(orders.length - statusCounts.Completed - statusCounts.Cancelled) },
        { label: 'Completed Orders', value: String(statusCounts.Completed || 0) },
        { label: 'Cancelled Orders', value: String(statusCounts.Cancelled || 0) },
      ],
      items: filteredOrders.map((o) => ({
        'Order ID': o.id,
        Customer: o.customerName,
        Product: o.product,
        Qty: `${o.quantity} ${o.unit}`,
        'Total Amount': formatCurrency(o.totalAmount),
        'Order Date': formatDate(o.orderDate),
        'Expected Delivery': formatDate(o.expectedDeliveryDate),
        OTP: o.otpStatus,
        Status: o.orderStatus,
      })),
    });
  };

  const filterConfig = [
    {
      key: 'datePreset',
      label: 'Order Date Range',
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
      key: 'otpStatus',
      label: 'OTP Status',
      value: filters.otpStatus,
      options: [
        { label: 'All OTP Status', value: 'All' },
        { label: 'Verified', value: 'Verified' },
        { label: 'Pending', value: 'Pending' },
        { label: 'Cancelled', value: 'Cancelled' },
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
  ];

  // 13 Required Columns
  const columns = [
    {
      key: 'id',
      label: 'Order ID',
      render: (row) => (
        <div>
          <span className="font-bold text-brand-primary block">{row.id}</span>
          <span className="text-[11px] font-mono text-brand-muted">
            {row.salesId}
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
            {(row.batchReferences || [])[0] || 'Standard Batch'}
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
      key: 'price',
      label: 'Price',
      align: 'right',
      render: (row) => <span className="font-medium">{formatCurrency(row.price)}</span>,
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
      key: 'orderDate',
      label: 'Order Date',
      render: (row) => <span>{formatDate(row.orderDate)}</span>,
    },
    {
      key: 'expectedDeliveryDate',
      label: 'Expected Delivery Date',
      render: (row) => <span>{formatDate(row.expectedDeliveryDate)}</span>,
    },
    {
      key: 'otpStatus',
      label: 'OTP Status',
      render: (row) => <VendorStatusBadge status={row.otpStatus} />,
    },
    {
      key: 'paymentStatus',
      label: 'Payment Status',
      render: (row) => <VendorStatusBadge status={row.paymentStatus} />,
    },
    {
      key: 'orderStatus',
      label: 'Order Status',
      render: (row) => <VendorStatusBadge status={row.orderStatus} />,
    },
    {
      key: 'actions',
      label: 'Actions',
      align: 'right',
      render: (row) => {
        const allowedNext = VALID_ORDER_TRANSITIONS[row.orderStatus] || [];
        const nextStep = allowedNext.find((s) => s !== 'Cancelled') || null;

        return (
          <div className="flex items-center justify-end gap-1.5">
            {nextStep && (
              <button
                type="button"
                onClick={() => {
                  if (nextStep === 'Confirmed' && row.otpStatus !== 'Verified') {
                    setSelectedOrderId(row.id);
                  } else {
                    updateOrderStatus(
                      row.id,
                      nextStep,
                      `Status advanced to ${nextStep}`
                    );
                  }
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg bg-brand-primary text-white hover:bg-brand-secondary transition-colors cursor-pointer"
                title={`Advance to ${nextStep}`}
              >
                <span>{nextStep}</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setSelectedOrderId(row.id)}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-brand-light text-brand-primary hover:bg-brand-primary hover:text-white transition-colors cursor-pointer"
              title="View Order Details & Timeline"
            >
              <Eye className="w-3.5 h-3.5" />
              Manage
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <VendorPageHeader
        title="Customer Orders & Fulfilment Pipeline"
        subtitle="Manage customer order lifecycle from OTP confirmation through packing, shipping, delivery, and completion"
        badge={`${orders.length} Total Orders`}
        actions={
          <>
            <VendorExportMenu
              onExportCSV={handleExportCSV}
              onPrint={handlePrintOrders}
              label="Export Orders"
            />
            <button
              type="button"
              onClick={() => navigate('/vendor/sales/new')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg bg-brand-primary text-white hover:bg-brand-secondary transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Create New Order
            </button>
          </>
        }
      />

      {/* Quick KPI Summary Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <VendorStatCard
          title="New / Awaiting OTP"
          value={statusCounts.New || 0}
          subtitle="Stock reserved, awaiting confirmation"
          icon={Clock}
        />
        <VendorStatCard
          title="In Fulfilment & Transit"
          value={
            (statusCounts.Confirmed || 0) +
            (statusCounts.Processing || 0) +
            (statusCounts.Packed || 0) +
            (statusCounts.Shipped || 0) +
            (statusCounts.Delivered || 0)
          }
          subtitle="Confirmed → Shipped → Delivered"
          icon={Truck}
          highlight
        />
        <VendorStatCard
          title="Completed Orders"
          value={statusCounts.Completed || 0}
          subtitle="Successfully delivered & closed"
          icon={CheckCircle2}
        />
        <VendorStatCard
          title="Cancelled Orders"
          value={statusCounts.Cancelled || 0}
          subtitle="Stock automatically restored"
          icon={XCircle}
        />
      </div>

      {/* 8 Order Status Tabs (+ All) */}
      <div className="bg-brand-surface border border-brand-border rounded-xl p-2 flex flex-wrap items-center gap-1.5 shadow-xs">
        {TABS.map((tab) => {
          const active = activeTab === tab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => {
                setActiveTab(tab);
                pagination.goToPage(1);
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                active
                  ? 'bg-brand-primary text-white shadow-xs'
                  : 'text-brand-muted hover:bg-brand-light/50 hover:text-brand-primary'
              }`}
            >
              <span>{tab}</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                  active
                    ? 'bg-white/20 text-white'
                    : 'bg-brand-background text-brand-text'
                }`}
              >
                {statusCounts[tab] || 0}
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
              placeholder="Search Order ID, Sales ID, Customer Name, Product..."
            />
          </div>
          <div className="text-xs text-brand-muted">
            Showing <strong>{filteredOrders.length}</strong> orders in{' '}
            <strong>{activeTab}</strong> tab
          </div>
        </div>

        <VendorFilters
          filters={filterConfig}
          onFilterChange={handleFilterChange}
          onReset={handleResetFilters}
        />
      </div>

      {/* Orders Table */}
      <div className="bg-brand-surface border border-brand-border rounded-xl overflow-hidden shadow-xs">
        <VendorDataTable
          columns={columns}
          data={pagination.paginatedData}
          rowKey="id"
          enablePagination={false}
          emptyTitle={`No ${activeTab === 'All' ? '' : activeTab} Orders Found`}
          emptyDescription="Select a different status tab or create a new customer order."
        />
        <VendorPagination {...pagination} />
      </div>

      {/* Order Details & Status Update Modal */}
      <OrderDetails
        order={selectedOrder}
        isOpen={Boolean(selectedOrder)}
        onClose={() => setSelectedOrderId(null)}
      />
    </div>
  );
}


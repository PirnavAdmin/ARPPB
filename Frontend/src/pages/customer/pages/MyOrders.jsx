import { useState, useMemo } from 'react';
import {
  Truck,
  Clock,
  CheckCircle2,
  XCircle,
  Package,
  Eye,
} from 'lucide-react';
import { useCustomer } from '../context/useCustomer';
import { CUSTOMER_ORDER_STATUSES } from '../data/customerData';
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
import CustomerOrderDetailsModal from '../components/CustomerOrderDetailsModal';

export function MyOrders() {
  const { orders, categories } = useCustomer();

  const [activeTab, setActiveTab] = useState('All Orders');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 200);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [datePreset, setDatePreset] = useState('all');

  const [selectedOrderId, setSelectedOrderId] = useState(null);

  const selectedOrder = useMemo(
    () => orders.find((o) => o.id === selectedOrderId) || null,
    [orders, selectedOrderId]
  );

  const tabCounts = useMemo(() => {
    const counts = { 'All Orders': orders.length };
    CUSTOMER_ORDER_STATUSES.slice(1).forEach((st) => {
      counts[st] = orders.filter((o) => o.orderStatus === st).length;
    });
    return counts;
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    return orders.filter((o) => {
      if (activeTab !== 'All Orders' && o.orderStatus !== activeTab) {
        return false;
      }
      if (categoryFilter !== 'All' && o.category !== categoryFilter) {
        return false;
      }
      if (
        datePreset !== 'all' &&
        !isDateInRange(o.orderDate, datePreset, '', '', '2026-11-11')
      ) {
        return false;
      }
      if (q) {
        const hit = [o.id, o.transactionId, o.product, o.category, o.batchReference]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(q));
        if (!hit) return false;
      }
      return true;
    });
  }, [orders, activeTab, categoryFilter, datePreset, debouncedSearch]);

  const pagination = usePagination(filteredOrders, 8);

  const handleResetFilters = () => {
    setActiveTab('All Orders');
    setSearchQuery('');
    setCategoryFilter('All');
    setDatePreset('all');
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
      key: 'datePreset',
      label: 'Order Date',
      value: datePreset,
      onChange: (val) => {
        setDatePreset(val);
        pagination.goToPage(1);
      },
      options: [
        { label: 'All Time', value: 'all' },
        { label: 'Today', value: 'today' },
        { label: 'Yesterday', value: 'yesterday' },
        { label: 'Last 7 Days', value: 'last7' },
        { label: 'Last 30 Days', value: 'last30' },
      ],
    },
  ];

  const columns = [
    {
      key: 'id',
      label: 'Order ID',
      sortable: true,
      render: (row) => (
        <div>
          <span className="font-bold text-[#0F766E] block">{row.id}</span>
          {row.transactionId && (
            <span className="text-[11px] font-mono text-[#64748B]">
              {row.transactionId}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'orderDate',
      label: 'Order Date',
      sortable: true,
      render: (row) => <span className="text-xs">{formatDate(row.orderDate)}</span>,
    },
    {
      key: 'product',
      label: 'Product',
      sortable: true,
      render: (row) => (
        <div>
          <span className="font-semibold text-[#0F172A] block">{row.product}</span>
          <span className="text-[11px] text-[#64748B]">{row.category}</span>
        </div>
      ),
    },
    {
      key: 'quantity',
      label: 'Quantity',
      render: (row) => (
        <span className="font-semibold">
          {row.quantity} {row.unit}
        </span>
      ),
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
      key: 'orderStatus',
      label: 'Order Status',
      render: (row) => <CustomerStatusBadge status={row.orderStatus} size="xs" />,
    },
    {
      key: 'expectedDeliveryDate',
      label: 'Expected Delivery Date',
      render: (row) => (
        <span className="text-xs">{formatDate(row.expectedDeliveryDate)}</span>
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
      key: 'actions',
      label: 'Action',
      align: 'right',
      render: (row) => (
        <button
          type="button"
          onClick={() => setSelectedOrderId(row.id)}
          className="h-8 inline-flex items-center gap-1.5 px-2.5 text-xs font-semibold rounded-lg bg-[#CCFBF1] text-[#0F766E] border border-[#14B8A6]/30 hover:bg-[#0F766E] hover:text-white transition-colors cursor-pointer"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Details</span>
        </button>
      ),
    },
  ];

  const activeFulfilmentCount = orders.filter(
    (o) => !['New', 'Completed', 'Cancelled'].includes(o.orderStatus)
  ).length;

  return (
    <div className="space-y-6">
      <CustomerPageHeader
        title="My Orders"
        subtitle="Track agricultural purchase orders from New OTP creation through Processing, Packing, Shipping, Delivery, and Completion."
        icon={Truck}
        badge={`${orders.length} Total Orders`}
      />

      {/* Quick Order Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <CustomerStatCard
          title="New / Awaiting OTP"
          value={tabCounts.New || 0}
          description="Pending confirmation"
          icon={Clock}
        />
        <CustomerStatCard
          title="Active Fulfilment"
          value={activeFulfilmentCount}
          description="Confirmed through Delivered"
          icon={Package}
        />
        <CustomerStatCard
          title="Completed Orders"
          value={tabCounts.Completed || 0}
          description="Successfully closed purchases"
          icon={CheckCircle2}
        />
        <CustomerStatCard
          title="Cancelled Orders"
          value={tabCounts.Cancelled || 0}
          description="Declined or cancelled orders"
          icon={XCircle}
        />
      </div>

      {/* 9 Order Status Tabs */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-2 flex flex-wrap items-center gap-1.5 shadow-xs">
        {CUSTOMER_ORDER_STATUSES.map((tab) => {
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
                  ? 'bg-[#0F766E] text-white shadow-xs'
                  : 'text-[#64748B] hover:bg-[#CCFBF1]/50 hover:text-[#0F766E]'
              }`}
            >
              <span>{tab}</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                  active ? 'bg-white/20 text-white' : 'bg-[#F8FAFC] text-[#0F172A]'
                }`}
              >
                {tabCounts[tab] || 0}
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
              placeholder="Search Order ID, Transaction ID, Product, Category..."
            />
          </div>
          <div className="text-xs text-[#64748B]">
            Showing <strong>{filteredOrders.length}</strong> orders in{' '}
            <strong>{activeTab}</strong>
          </div>
        </div>

        <CustomerFilters
          filters={filterConfig}
          hasExtraActive={Boolean(searchQuery.trim() || activeTab !== 'All Orders')}
          onReset={handleResetFilters}
        />
      </div>

      {/* Orders Table */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden shadow-xs">
        <CustomerOrderTable
          columns={columns}
          data={pagination.paginatedData}
          rowKey="id"
          enablePagination={false}
          emptyTitle={`No ${activeTab === 'All Orders' ? '' : activeTab} Orders Found`}
          emptyDescription="Select a different status tab or clear your active filters."
          emptyIcon={Truck}
          onResetFilters={handleResetFilters}
        />
        <CustomerPagination {...pagination} pageSizeOptions={[5, 8, 15, 25]} />
      </div>

      <CustomerOrderDetailsModal
        order={selectedOrder}
        isOpen={Boolean(selectedOrder)}
        onClose={() => setSelectedOrderId(null)}
      />
    </div>
  );
}

export default MyOrders;

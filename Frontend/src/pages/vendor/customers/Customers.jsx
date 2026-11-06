import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Plus,
  Eye,
  Edit3,
  Power,
  Truck,
  Receipt,
  Landmark,
  CheckCircle2,
  IndianRupee,
} from 'lucide-react';
import { useVendor } from '../../../hooks/useVendor';
import { useDebounce } from '../../../hooks/useDebounce';
import VendorPageHeader from '../VendorPageHeader';
import VendorStatCard from '../VendorStatCard';
import VendorSearch from '../VendorSearch';
import VendorFilters from '../VendorFilters';
import VendorDataTable from '../VendorDataTable';
import VendorStatusBadge from '../VendorStatusBadge';
import VendorModal from '../VendorModal';
import VendorConfirmDialog from '../VendorConfirmDialog';
import VendorExportMenu from '../VendorExportMenu';
import CustomerForm from './CustomerForm';
import CustomerDetails from './CustomerDetails';
import { AP_DISTRICTS, INDIAN_STATES } from '../../../utils/constants';
import { formatCurrency, formatNumber } from '../../../utils/formatCurrency';
import { generateNextId } from '../../../utils/generateTransactionId';

export function Customers() {
  const navigate = useNavigate();
  const {
    customers,
    orders,
    sales,
    addCustomer,
    updateCustomer,
    toggleCustomerStatus,
  } = useVendor();

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 200);
  const [districtFilter, setDistrictFilter] = useState('All');
  const [stateFilter, setStateFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [viewingCustomer, setViewingCustomer] = useState(null);
  const [confirmDeactivate, setConfirmDeactivate] = useState(null);

  const summary = useMemo(() => {
    const total = customers.length;
    const active = customers.filter((c) => c.status === 'Active').length;
    const totalOrders = customers.reduce((sum, c) => sum + (c.totalOrders || 0), 0);
    const totalSalesValue = customers.reduce((sum, c) => sum + (c.totalPurchaseValue || 0), 0);
    const totalReceivables = customers.reduce(
      (sum, c) => sum + (c.outstandingReceivables || 0),
      0
    );
    return { total, active, totalOrders, totalSalesValue, totalReceivables };
  }, [customers]);

  const filteredCustomers = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    return customers.filter((c) => {
      if (districtFilter !== 'All' && c.district !== districtFilter) return false;
      if (stateFilter !== 'All' && c.state !== stateFilter) return false;
      if (statusFilter !== 'All' && c.status !== statusFilter) return false;
      if (q) {
        const match =
          c.id.toLowerCase().includes(q) ||
          c.customerName.toLowerCase().includes(q) ||
          (c.businessName || '').toLowerCase().includes(q) ||
          c.mobileNumber.includes(q) ||
          c.district.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [customers, debouncedSearch, districtFilter, stateFilter, statusFilter]);

  const nextCustomerId = useMemo(
    () => generateNextId('CUST-', customers, 'id', 4),
    [customers]
  );

  const handleSave = (formData) => {
    if (editingCustomer) {
      updateCustomer(editingCustomer.id, formData);
    } else {
      addCustomer(formData);
    }
    setIsFormOpen(false);
    setEditingCustomer(null);
  };

  const resetFilters = () => {
    setSearch('');
    setDistrictFilter('All');
    setStateFilter('All');
    setStatusFilter('All');
  };

  const columns = [
    {
      key: 'id',
      header: 'Customer ID',
      sortable: true,
      render: (row) => (
        <button
          type="button"
          onClick={() => setViewingCustomer(row)}
          className="font-mono font-bold text-brand-primary hover:underline cursor-pointer"
        >
          {row.id}
        </button>
      ),
    },
    {
      key: 'customerName',
      header: 'Customer Name',
      sortable: true,
      render: (row) => (
        <div>
          <p className="font-bold text-brand-text">{row.customerName}</p>
          <p className="text-xs text-brand-muted">
            {row.businessName || 'Individual Buyer'} •{' '}
            <VendorStatusBadge status={row.status} size="xs" />
          </p>
        </div>
      ),
    },
    {
      key: 'mobileNumber',
      header: 'Mobile Number',
      render: (row) => <span className="whitespace-nowrap">+91 {row.mobileNumber}</span>,
    },
    {
      key: 'email',
      header: 'Email',
      render: (row) => <span className="text-xs text-brand-muted">{row.email || '—'}</span>,
    },
    {
      key: 'address',
      header: 'Address',
      render: (row) => <span className="text-xs line-clamp-1 max-w-[180px]">{row.address}</span>,
    },
    {
      key: 'district',
      header: 'District',
      sortable: true,
    },
    {
      key: 'state',
      header: 'State',
      sortable: true,
    },
    {
      key: 'totalOrders',
      header: 'Total Orders',
      align: 'center',
      sortable: true,
      render: (row) => <span className="font-bold text-brand-primary">{row.totalOrders}</span>,
    },
    {
      key: 'totalPurchaseValue',
      header: 'Total Purchase Value',
      align: 'right',
      sortable: true,
      render: (row) => (
        <span className="font-bold text-brand-text whitespace-nowrap">
          {formatCurrency(row.totalPurchaseValue)}
        </span>
      ),
      exportAccessor: (row) => row.totalPurchaseValue,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (row) => (
        <div className="inline-flex items-center gap-1">
          <button
            type="button"
            onClick={() => setViewingCustomer(row)}
            title="View Customer Details"
            className="p-1.5 rounded-lg bg-brand-light/70 text-brand-primary hover:bg-brand-primary hover:text-white transition-colors cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => {
              setEditingCustomer(row);
              setIsFormOpen(true);
            }}
            title="Edit Customer"
            className="p-1.5 rounded-lg bg-brand-background border border-brand-border text-brand-text hover:bg-brand-light hover:text-brand-primary transition-colors cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => navigate(`/vendor/orders?customer=${encodeURIComponent(row.customerName)}`)}
            title="View Order History"
            className="p-1.5 rounded-lg bg-brand-background border border-brand-border text-brand-text hover:bg-brand-light hover:text-brand-primary transition-colors cursor-pointer"
          >
            <Truck className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => navigate(`/vendor/sales/history?customer=${encodeURIComponent(row.customerName)}`)}
            title="View Sales History"
            className="p-1.5 rounded-lg bg-brand-background border border-brand-border text-brand-text hover:bg-brand-light hover:text-brand-primary transition-colors cursor-pointer"
          >
            <Receipt className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => navigate(`/vendor/ledger?party=${encodeURIComponent(row.customerName)}`)}
            title="View Customer Ledger"
            className="p-1.5 rounded-lg bg-brand-background border border-brand-border text-brand-text hover:bg-brand-light hover:text-brand-primary transition-colors cursor-pointer"
          >
            <Landmark className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setConfirmDeactivate(row)}
            title={row.status === 'Active' ? 'Deactivate Customer' : 'Activate Customer'}
            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
              row.status === 'Active'
                ? 'bg-brand-error-light/60 border-brand-error/20 text-brand-error hover:bg-brand-error hover:text-white'
                : 'bg-brand-success-light/60 border-brand-success/20 text-brand-success hover:bg-brand-success hover:text-white'
            }`}
          >
            <Power className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <VendorPageHeader
        title="Customer Management"
        subtitle="Manage wholesale distributors, retail stores, and individual buyers with order, sales, and receivable tracking."
        icon={Users}
        actions={
          <>
            <VendorExportMenu
              data={filteredCustomers}
              columns={columns.filter((c) => c.key !== 'actions')}
              filename="customers_directory.csv"
            />
            <button
              type="button"
              onClick={() => {
                setEditingCustomer(null);
                setIsFormOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-brand-primary text-white hover:bg-brand-secondary transition-colors cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Add Customer</span>
            </button>
          </>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <VendorStatCard
          title="Total Customers"
          value={formatNumber(summary.total, 0)}
          description={`${summary.active} active accounts`}
          icon={Users}
        />
        <VendorStatCard
          title="Active Buyers"
          value={formatNumber(summary.active, 0)}
          description="Wholesalers, retailers & individuals"
          icon={CheckCircle2}
        />
        <VendorStatCard
          title="Total Customer Orders"
          value={formatNumber(summary.totalOrders, 0)}
          description="Cumulative sales orders placed"
          icon={Truck}
        />
        <VendorStatCard
          title="Total Sales Value"
          value={formatCurrency(summary.totalSalesValue)}
          description={`Receivables: ${formatCurrency(summary.totalReceivables)}`}
          icon={IndianRupee}
          highlight
        />
      </div>

      {/* Search & Filters */}
      <div className="bg-brand-surface p-4 rounded-2xl border border-brand-border shadow-2xs flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3">
        <VendorSearch
          value={search}
          onChange={setSearch}
          placeholder="Search by Customer ID, Name, Business Name, Mobile, or District..."
        />
        <VendorFilters
          filters={[
            {
              key: 'district',
              label: 'District',
              value: districtFilter,
              onChange: setDistrictFilter,
              options: AP_DISTRICTS,
            },
            {
              key: 'state',
              label: 'State',
              value: stateFilter,
              onChange: setStateFilter,
              options: INDIAN_STATES,
            },
            {
              key: 'status',
              label: 'Status',
              value: statusFilter,
              onChange: setStatusFilter,
              options: ['Active', 'Inactive'],
            },
          ]}
          onReset={resetFilters}
        />
      </div>

      {/* Table */}
      <VendorDataTable
        columns={columns}
        data={filteredCustomers}
        onResetFilters={resetFilters}
      />

      {/* Add / Edit Modal */}
      <VendorModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingCustomer(null);
        }}
        title={editingCustomer ? `Edit Customer – ${editingCustomer.id}` : 'Register New Customer'}
        subtitle="Enter buyer details, GSTIN, credit limit, and delivery address."
        size="lg"
      >
        <CustomerForm
          initialData={editingCustomer}
          nextCustomerId={nextCustomerId}
          onSubmit={handleSave}
          onCancel={() => {
            setIsFormOpen(false);
            setEditingCustomer(null);
          }}
        />
      </VendorModal>

      {/* Customer Details Modal */}
      <VendorModal
        isOpen={Boolean(viewingCustomer)}
        onClose={() => setViewingCustomer(null)}
        title={`Customer Profile – ${viewingCustomer?.customerName || ''}`}
        subtitle={`Customer ID: ${viewingCustomer?.id || ''} • ${viewingCustomer?.businessName || 'Direct Buyer'}`}
        size="xl"
      >
        <CustomerDetails
          customer={viewingCustomer}
          orders={orders}
          sales={sales}
          onClose={() => setViewingCustomer(null)}
          onEdit={(c) => {
            setViewingCustomer(null);
            setEditingCustomer(c);
            setIsFormOpen(true);
          }}
        />
      </VendorModal>

      {/* Deactivate Confirmation */}
      <VendorConfirmDialog
        isOpen={Boolean(confirmDeactivate)}
        onClose={() => setConfirmDeactivate(null)}
        onConfirm={() => {
          if (confirmDeactivate) {
            toggleCustomerStatus(confirmDeactivate.id);
            setConfirmDeactivate(null);
          }
        }}
        title={
          confirmDeactivate?.status === 'Active'
            ? `Deactivate Customer ${confirmDeactivate?.id}?`
            : `Activate Customer ${confirmDeactivate?.id}?`
        }
        description={
          confirmDeactivate?.status === 'Active'
            ? `Deactivating ${confirmDeactivate?.customerName} will pause new sales orders for this customer while preserving existing receivables and order history.`
            : `Re-activating ${confirmDeactivate?.customerName} will enable new sales orders.`
        }
        confirmLabel={confirmDeactivate?.status === 'Active' ? 'Deactivate' : 'Activate'}
        variant={confirmDeactivate?.status === 'Active' ? 'danger' : 'primary'}
      />
    </div>
  );
}

export default Customers;


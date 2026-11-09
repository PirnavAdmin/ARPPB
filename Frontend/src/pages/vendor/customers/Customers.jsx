import { useState, useMemo, useRef, useLayoutEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import {
  UsersRound,
  Plus,
  Eye,
  Edit3,
  Power,
  Truck,
  ShoppingBag,
  UserRoundCheck,
  UserX,
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
import VendorDetailPage from '../VendorDetailPage';
import CustomerForm from './CustomerForm';
import CustomerDetails from './CustomerDetails';
import { AP_DISTRICTS, INDIAN_STATES } from '../../../utils/constants';
import { formatCurrency, formatNumber } from '../../../utils/formatCurrency';
import { generateNextId } from '../../../utils/generateTransactionId';

export function Customers() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryCustomerId = searchParams.get('customerId') || '';

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
  const [confirmDeactivate, setConfirmDeactivate] = useState(null);

  // Enrich each customer with total purchased quantity across their sales/orders
  const customersWithQty = useMemo(() => {
    return customers.map((c) => {
      const custSales = sales.filter(
        (s) => s.customerId === c.id && s.salesStatus !== 'Cancelled'
      );
      const totalPurchasedQty = custSales.reduce(
        (sum, s) => sum + Number(s.quantity || 0),
        0
      );
      const primaryUnit = custSales[0]?.unit || 'Units';
      return {
        ...c,
        totalPurchasedQty,
        primaryUnit,
      };
    });
  }, [customers, sales]);

  // Resolve active customer for the full-page profile view (driven by URL query params)
  const activeProfileCustomer = useMemo(() => {
    if (!queryCustomerId) return null;
    return customersWithQty.find((c) => c.id === queryCustomerId) || null;
  }, [customersWithQty, queryCustomerId]);

  const isProfileView = Boolean(activeProfileCustomer);
  const listScrollRef = useRef(0);
  const prevProfileViewRef = useRef(false);

  // Scroll to top when opening the full-page profile; restore table scroll position on Back
  useLayoutEffect(() => {
    if (prevProfileViewRef.current === isProfileView) return;
    prevProfileViewRef.current = isProfileView;
    window.scrollTo(0, isProfileView ? 0 : listScrollRef.current);
  }, [isProfileView]);

  // Open the full-page Customer profile (pushes a history entry so browser Back works)
  const openProfile = (customerId) => {
    listScrollRef.current = window.scrollY;
    setSearchParams({ customerId }, { state: { fromDirectory: true } });
  };

  // Return to the Customers table (search, filters, pagination and scroll are preserved)
  const handleCloseProfile = () => {
    if (location.state?.fromDirectory) {
      navigate(-1);
    } else {
      setSearchParams({}, { replace: true });
    }
  };

  const summary = useMemo(() => {
    const total = customersWithQty.length;
    const active = customersWithQty.filter((c) => c.status === 'Active').length;
    const inactive = total - active;
    const totalOrders = customersWithQty.reduce(
      (sum, c) => sum + Number(c.totalOrders || 0),
      0
    );
    const totalSalesValue = customersWithQty.reduce(
      (sum, c) => sum + Number(c.totalPurchaseValue || 0),
      0
    );
    const totalReceivables = customersWithQty.reduce(
      (sum, c) => sum + Number(c.outstandingReceivables || 0),
      0
    );
    return {
      total,
      active,
      inactive,
      totalOrders,
      totalSalesValue,
      totalReceivables,
    };
  }, [customersWithQty]);

  const filteredCustomers = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    return customersWithQty.filter((c) => {
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
  }, [
    customersWithQty,
    debouncedSearch,
    districtFilter,
    stateFilter,
    statusFilter,
  ]);

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
          onClick={() => openProfile(row.id)}
          className="font-mono font-bold text-[#0F766E] hover:underline cursor-pointer"
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
          <p className="font-bold text-[#172B29]">{row.customerName}</p>
          <p className="text-[11px] text-[#64748B]">
            {row.businessName || 'Individual Buyer'} •{' '}
            {row.customerType || 'Wholesaler'}
          </p>
        </div>
      ),
    },
    {
      key: 'mobileNumber',
      header: 'Mobile Number',
      render: (row) => (
        <span className="font-medium text-[#172B29] whitespace-nowrap">
          +91 {row.mobileNumber}
        </span>
      ),
    },
    {
      key: 'address',
      header: 'Address',
      sortable: true,
      render: (row) => (
        <div>
          <p className="font-semibold text-[#172B29]">
            {row.district}, {row.state}
          </p>
          <p className="text-[11px] text-[#64748B] line-clamp-1 max-w-[180px]">
            {row.address}
          </p>
        </div>
      ),
      exportAccessor: (row) => `${row.address}, ${row.district}, ${row.state}`,
    },
    {
      key: 'totalOrders',
      header: 'Total Orders',
      align: 'center',
      sortable: true,
      render: (row) => (
        <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full bg-[#CCFBF1] text-[#0F766E] text-xs font-bold">
          {row.totalOrders}
        </span>
      ),
    },
    {
      key: 'totalPurchasedQty',
      header: 'Total Purchase Quantity',
      align: 'right',
      sortable: true,
      render: (row) => (
        <span className="font-semibold text-[#172B29] whitespace-nowrap">
          {formatNumber(row.totalPurchasedQty)} {row.primaryUnit}
        </span>
      ),
      exportAccessor: (row) => `${row.totalPurchasedQty} ${row.primaryUnit}`,
    },
    {
      key: 'totalPurchaseValue',
      header: 'Total Sales Amount',
      align: 'right',
      sortable: true,
      render: (row) => (
        <div>
          <p className="font-bold text-[#0F766E] whitespace-nowrap">
            {formatCurrency(row.totalPurchaseValue)}
          </p>
          {row.outstandingReceivables > 0 && (
            <p className="text-[11px] text-amber-600 font-medium whitespace-nowrap">
              Receivable: {formatCurrency(row.outstandingReceivables)}
            </p>
          )}
        </div>
      ),
      exportAccessor: (row) => row.totalPurchaseValue,
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (row) => <VendorStatusBadge status={row.status} size="xs" />,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (row) => (
        <div className="inline-flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => openProfile(row.id)}
            title="View Complete Customer Profile & Order Transactions"
            className="p-1.5 rounded-lg bg-[#CCFBF1] text-[#0F766E] hover:bg-[#0F766E] hover:text-white transition-colors cursor-pointer"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => navigate(`/vendor/sales/new?customerId=${row.id}`)}
            title="Sell Products to this Customer"
            className="p-1.5 rounded-lg bg-[#F5FAF8] border border-[#E2E8F0] text-[#0F766E] hover:bg-[#CCFBF1] transition-colors cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              setEditingCustomer(row);
              setIsFormOpen(true);
            }}
            title="Edit Customer"
            className="p-1.5 rounded-lg bg-[#F5FAF8] border border-[#E2E8F0] text-[#172B29] hover:bg-[#CCFBF1] hover:text-[#0F766E] transition-colors cursor-pointer"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setConfirmDeactivate(row)}
            title={
              row.status === 'Active'
                ? 'Deactivate Customer'
                : 'Activate Customer'
            }
            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
              row.status === 'Active'
                ? 'bg-red-50 border-red-200 text-red-600 hover:bg-red-600 hover:text-white'
                : 'bg-[#DCFCE7] border-[#16A34A]/20 text-[#16A34A] hover:bg-[#16A34A] hover:text-white'
            }`}
          >
            <Power className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      {/* Customers Directory (kept mounted while a profile is open so table state is preserved) */}
      <div className={isProfileView ? 'hidden' : 'space-y-6'}>
      <VendorPageHeader
        title="Customers Directory & Sales Orders"
        subtitle="Manage wholesale distributors, retail stores, and individual buyers with complete order, invoice, OTP, and receivable tracking."
        icon={UsersRound}
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            <VendorExportMenu
              data={filteredCustomers}
              columns={columns.filter((c) => c.key !== 'actions')}
              filename="customers_directory.csv"
            />
            <button
              type="button"
              onClick={() => navigate('/vendor/sales/new')}
              className="inline-flex items-center justify-center gap-2 h-9 px-3.5 rounded-xl text-xs font-semibold bg-[#CCFBF1] text-[#0F766E] border border-[#14B8A6]/30 hover:bg-[#115E59] hover:text-white transition-all duration-200 cursor-pointer shadow-2xs"
            >
              <ShoppingBag className="w-4 h-4 stroke-[2]" />
              <span>Create Customer Sale</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setEditingCustomer(null);
                setIsFormOpen(true);
              }}
              className="inline-flex items-center justify-center gap-2 h-9 px-4 rounded-xl text-xs font-semibold bg-[#0F766E] text-white hover:bg-[#115E59] transition-all duration-200 cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4 stroke-[2]" />
              <span>Add Customer</span>
            </button>
          </div>
        }
      />

      {/* 5 Customers Summary KPI Cards (Vendor Dashboard Design System) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 items-stretch">
        <VendorStatCard
          title="Total Customers"
          value={formatNumber(summary.total, 0)}
          description="Registered buyer accounts"
          icon={UsersRound}
        />
        <VendorStatCard
          title="Active Customers"
          value={formatNumber(summary.active, 0)}
          description="Wholesalers & retail stores"
          icon={UserRoundCheck}
        />
        <VendorStatCard
          title="Inactive Customers"
          value={formatNumber(summary.inactive, 0)}
          description="Temporarily deactivated"
          icon={UserX}
        />
        <VendorStatCard
          title="Total Orders"
          value={formatNumber(summary.totalOrders, 0)}
          description="Cumulative sales orders"
          icon={Truck}
        />
        <VendorStatCard
          title="Total Sales Amount"
          value={formatCurrency(summary.totalSalesValue)}
          description={`Receivables: ${formatCurrency(summary.totalReceivables)}`}
          icon={IndianRupee}
        />
      </div>

      {/* Search & Filters */}
      <div className="bg-white p-4 rounded-2xl border border-[#E2E8F0] shadow-xs flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3">
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

      {/* Customers Listing Table */}
      <VendorDataTable
        columns={columns}
        data={filteredCustomers}
        onResetFilters={resetFilters}
      />
      </div>

      {/* Complete Individual Customer Profile – Full-Page View (Eye Icon) */}
      {isProfileView && (
        <VendorDetailPage
          title={`Customer Profile – ${activeProfileCustomer.customerName || ''}`}
          subtitle={`Customer ID: ${activeProfileCustomer.id || ''} • ${activeProfileCustomer.businessName || 'Direct Buyer'}`}
          icon={UsersRound}
          backLabel="Back to Customers"
          onBack={handleCloseProfile}
        >
          <CustomerDetails
            key={activeProfileCustomer.id}
            customer={activeProfileCustomer}
            orders={orders}
            sales={sales}
            onEdit={(c) => {
              handleCloseProfile();
              setEditingCustomer(c);
              setIsFormOpen(true);
            }}
          />
        </VendorDetailPage>
      )}

      {/* Add / Edit Modal */}
      <VendorModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingCustomer(null);
        }}
        title={
          editingCustomer
            ? `Edit Customer – ${editingCustomer.id}`
            : 'Register New Customer'
        }
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
        confirmLabel={
          confirmDeactivate?.status === 'Active' ? 'Deactivate' : 'Activate'
        }
        variant={confirmDeactivate?.status === 'Active' ? 'danger' : 'primary'}
      />
    </div>
  );
}

export default Customers;

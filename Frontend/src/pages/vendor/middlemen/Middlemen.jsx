import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  BriefcaseBusiness,
  Plus,
  Eye,
  Edit3,
  Power,
  Handshake,
  UserRoundCheck,
  UserX,
  ShoppingCart,
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
import MiddlemanForm from './MiddlemanForm';
import MiddlemanDetails from './MiddlemanDetails';
import PurchaseForm from '../purchases/PurchaseForm';
import { AP_DISTRICTS, INDIAN_STATES } from '../../../utils/constants';
import { formatCurrency, formatNumber } from '../../../utils/formatCurrency';
import { generateNextId } from '../../../utils/generateTransactionId';

export function Middlemen() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryMiddlemanId = searchParams.get('middlemanId') || '';
  const queryPurchaseId = searchParams.get('purchaseId') || '';

  const {
    middlemen,
    purchases,
    ledger,
    addMiddleman,
    updateMiddleman,
    toggleMiddlemanStatus,
  } = useVendor();

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 200);
  const [districtFilter, setDistrictFilter] = useState('All');
  const [stateFilter, setStateFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMid, setEditingMid] = useState(null);
  const [viewingMidId, setViewingMidId] = useState('');
  const [profileInitialTab, setProfileInitialTab] = useState('overview');
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [confirmDeactivate, setConfirmDeactivate] = useState(null);

  const activeProfileMiddleman = useMemo(() => {
    if (viewingMidId) {
      return middlemen.find((m) => m.id === viewingMidId) || null;
    }
    if (queryMiddlemanId) {
      return middlemen.find((m) => m.id === queryMiddlemanId) || null;
    }
    if (queryPurchaseId) {
      const matchedPurchase = purchases.find(
        (p) => p.id === queryPurchaseId && p.supplierCategory === 'Middleman'
      );
      if (matchedPurchase) {
        return middlemen.find((m) => m.id === matchedPurchase.supplierId) || null;
      }
    }
    return null;
  }, [middlemen, purchases, viewingMidId, queryMiddlemanId, queryPurchaseId]);

  const handleCloseProfile = () => {
    setViewingMidId('');
    setProfileInitialTab('overview');
    if (queryMiddlemanId || queryPurchaseId) {
      setSearchParams({});
    }
  };

  const summary = useMemo(() => {
    const total = middlemen.length;
    const active = middlemen.filter((m) => m.status === 'Active').length;
    const inactive = total - active;
    const midPurchaseRecords = purchases.filter(
      (p) => p.supplierCategory === 'Middleman'
    );
    const totalTransactions = midPurchaseRecords.length;
    const totalQty = midPurchaseRecords.reduce(
      (sum, p) => sum + Number(p.quantity || 0),
      0
    );
    const totalValue = middlemen.reduce(
      (sum, m) => sum + Number(m.purchaseValue || 0),
      0
    );
    const totalPayables = middlemen.reduce(
      (sum, m) => sum + Number(m.outstandingPayables || 0),
      0
    );
    return {
      total,
      active,
      inactive,
      totalTransactions,
      totalQty,
      totalValue,
      totalPayables,
    };
  }, [middlemen, purchases]);

  const filteredMiddlemen = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    return middlemen.filter((m) => {
      if (districtFilter !== 'All' && m.district !== districtFilter) return false;
      if (stateFilter !== 'All' && m.state !== stateFilter) return false;
      if (statusFilter !== 'All' && m.status !== statusFilter) return false;
      if (q) {
        const match =
          m.id.toLowerCase().includes(q) ||
          m.businessName.toLowerCase().includes(q) ||
          m.ownerName.toLowerCase().includes(q) ||
          m.mobileNumber.includes(q) ||
          (m.gstNumber || '').toLowerCase().includes(q) ||
          m.district.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [middlemen, debouncedSearch, districtFilter, stateFilter, statusFilter]);

  const nextMiddlemanId = useMemo(
    () => generateNextId('MID-', middlemen, 'id', 4),
    [middlemen]
  );

  const handleSave = (formData) => {
    if (editingMid) {
      updateMiddleman(editingMid.id, formData);
    } else {
      addMiddleman(formData);
    }
    setIsFormOpen(false);
    setEditingMid(null);
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
      header: 'Middleman ID',
      sortable: true,
      render: (row) => (
        <button
          type="button"
          onClick={() => {
            setProfileInitialTab('overview');
            setViewingMidId(row.id);
          }}
          className="font-mono font-bold text-[#0F766E] hover:underline cursor-pointer"
        >
          {row.id}
        </button>
      ),
    },
    {
      key: 'ownerName',
      header: 'Middleman Name',
      sortable: true,
      render: (row) => (
        <div>
          <p className="font-bold text-[#172B29]">{row.ownerName}</p>
          <p className="text-[11px] text-[#64748B]">{row.email || '—'}</p>
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
      key: 'businessName',
      header: 'Business Name',
      sortable: true,
      render: (row) => (
        <div>
          <p className="font-bold text-[#172B29]">{row.businessName}</p>
          <p className="font-mono text-[11px] text-[#0F766E] font-semibold">
            GST: {row.gstNumber || 'Unregistered'}
          </p>
        </div>
      ),
    },
    {
      key: 'district',
      header: 'Location',
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
      key: 'totalPurchases',
      header: 'Total Transactions',
      align: 'center',
      sortable: true,
      render: (row) => (
        <div className="text-center">
          <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full bg-[#CCFBF1] text-[#0F766E] text-xs font-bold">
            {row.totalPurchases}
          </span>
          <p className="text-[11px] text-[#64748B] mt-0.5">
            {formatNumber(row.totalQuantity)} Qtl
          </p>
        </div>
      ),
    },
    {
      key: 'purchaseValue',
      header: 'Total Transaction Amount',
      align: 'right',
      sortable: true,
      render: (row) => (
        <div>
          <p className="font-bold text-[#0F766E] whitespace-nowrap">
            {formatCurrency(row.purchaseValue)}
          </p>
          {row.outstandingPayables > 0 && (
            <p className="text-[11px] text-amber-600 font-medium whitespace-nowrap">
              Due: {formatCurrency(row.outstandingPayables)}
            </p>
          )}
        </div>
      ),
      exportAccessor: (row) => row.purchaseValue,
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
            onClick={() => {
              setProfileInitialTab('overview');
              setViewingMidId(row.id);
            }}
            title="View Complete Middleman Profile & Procurement Transactions"
            className="p-1.5 rounded-lg bg-[#CCFBF1] text-[#0F766E] hover:bg-[#0F766E] hover:text-white transition-colors cursor-pointer"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              setProfileInitialTab('new-purchase');
              setViewingMidId(row.id);
            }}
            title="Record Purchase from this Middleman"
            className="p-1.5 rounded-lg bg-[#F5FAF8] border border-[#E2E8F0] text-[#0F766E] hover:bg-[#CCFBF1] transition-colors cursor-pointer"
          >
            <Handshake className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              setEditingMid(row);
              setIsFormOpen(true);
            }}
            title="Edit Middleman"
            className="p-1.5 rounded-lg bg-[#F5FAF8] border border-[#E2E8F0] text-[#172B29] hover:bg-[#CCFBF1] hover:text-[#0F766E] transition-colors cursor-pointer"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setConfirmDeactivate(row)}
            title={
              row.status === 'Active'
                ? 'Deactivate Middleman'
                : 'Activate Middleman'
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
    <div className="space-y-6">
      <VendorPageHeader
        title="Middlemen Directory & Procurement"
        subtitle="Manage mandi commission agents, bulk raw material purchases, GST compliance, OTP confirmations, and payables."
        icon={BriefcaseBusiness}
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            <VendorExportMenu
              data={filteredMiddlemen}
              columns={columns.filter((c) => c.key !== 'actions')}
              filename="middlemen_directory.csv"
            />
            <button
              type="button"
              onClick={() => setIsPurchaseModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 h-9 px-3.5 rounded-xl text-xs font-semibold bg-[#CCFBF1] text-[#0F766E] border border-[#14B8A6]/30 hover:bg-[#115E59] hover:text-white transition-all duration-200 cursor-pointer shadow-2xs"
            >
              <Handshake className="w-4 h-4 stroke-[2]" />
              <span>Record Middleman Purchase</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setEditingMid(null);
                setIsFormOpen(true);
              }}
              className="inline-flex items-center justify-center gap-2 h-9 px-4 rounded-xl text-xs font-semibold bg-[#0F766E] text-white hover:bg-[#115E59] transition-all duration-200 cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4 stroke-[2]" />
              <span>Add Middleman</span>
            </button>
          </div>
        }
      />

      {/* 5 Middlemen Summary KPI Cards (Vendor Dashboard Design System) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 items-stretch">
        <VendorStatCard
          title="Total Middlemen"
          value={formatNumber(summary.total, 0)}
          description="Registered commission agents"
          icon={BriefcaseBusiness}
        />
        <VendorStatCard
          title="Active Middlemen"
          value={formatNumber(summary.active, 0)}
          description="GST-verified mandi traders"
          icon={UserRoundCheck}
        />
        <VendorStatCard
          title="Inactive Middlemen"
          value={formatNumber(summary.inactive, 0)}
          description="Temporarily deactivated"
          icon={UserX}
        />
        <VendorStatCard
          title="Total Transactions"
          value={formatNumber(summary.totalTransactions, 0)}
          description={`${formatNumber(summary.totalQty)} Qtl procured`}
          icon={ShoppingCart}
        />
        <VendorStatCard
          title="Total Transaction Amount"
          value={formatCurrency(summary.totalValue)}
          description={`Payables due: ${formatCurrency(summary.totalPayables)}`}
          icon={IndianRupee}
        />
      </div>

      {/* Search & Filters */}
      <div className="bg-white p-4 rounded-2xl border border-[#E2E8F0] shadow-xs flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3">
        <VendorSearch
          value={search}
          onChange={setSearch}
          placeholder="Search by Middleman ID, Business Name, Owner, Mobile, or GSTIN..."
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

      {/* Middlemen Listing Table */}
      <VendorDataTable
        columns={columns}
        data={filteredMiddlemen}
        onResetFilters={resetFilters}
      />

      {/* Add / Edit Modal */}
      <VendorModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingMid(null);
        }}
        title={
          editingMid
            ? `Edit Middleman – ${editingMid.id}`
            : 'Register New Middleman'
        }
        subtitle="Enter mandi commission agency details, GSTIN, address, and bank account."
        size="lg"
      >
        <MiddlemanForm
          initialData={editingMid}
          nextMiddlemanId={nextMiddlemanId}
          onSubmit={handleSave}
          onCancel={() => {
            setIsFormOpen(false);
            setEditingMid(null);
          }}
        />
      </VendorModal>

      {/* Complete Individual Middleman Profile Modal (Eye Icon) */}
      <VendorModal
        isOpen={Boolean(activeProfileMiddleman)}
        onClose={handleCloseProfile}
        title={`Middleman Profile – ${activeProfileMiddleman?.businessName || ''}`}
        subtitle={`Middleman ID: ${activeProfileMiddleman?.id || ''} • Owner: ${activeProfileMiddleman?.ownerName || ''}`}
        size="xl"
      >
        <MiddlemanDetails
          key={`${activeProfileMiddleman?.id || ''}-${profileInitialTab}-${queryPurchaseId}`}
          middleman={activeProfileMiddleman}
          purchases={purchases}
          ledger={ledger}
          initialTab={profileInitialTab}
          initialPurchaseId={queryPurchaseId}
          onClose={handleCloseProfile}
          onEdit={(m) => {
            handleCloseProfile();
            setEditingMid(m);
            setIsFormOpen(true);
          }}
        />
      </VendorModal>

      {/* Record Bulk Middleman Purchase Modal */}
      <VendorModal
        isOpen={isPurchaseModalOpen}
        onClose={() => setIsPurchaseModalOpen(false)}
        title="Record Bulk Purchase from Middleman"
        subtitle="Select a registered mandi trader, enter bulk raw material lots and charges, and verify with OTP."
        size="xl"
      >
        <PurchaseForm
          supplierCategory="Middleman"
          onSuccess={(created) => {
            setIsPurchaseModalOpen(false);
            if (created?.supplierId) {
              setProfileInitialTab('transactions');
              setViewingMidId(created.supplierId);
            }
          }}
          onCancel={() => setIsPurchaseModalOpen(false)}
        />
      </VendorModal>

      {/* Activate / Deactivate Confirmation */}
      <VendorConfirmDialog
        isOpen={Boolean(confirmDeactivate)}
        onClose={() => setConfirmDeactivate(null)}
        onConfirm={() => {
          if (confirmDeactivate) {
            toggleMiddlemanStatus(confirmDeactivate.id);
            setConfirmDeactivate(null);
          }
        }}
        title={
          confirmDeactivate?.status === 'Active'
            ? `Deactivate ${confirmDeactivate?.businessName}?`
            : `Activate ${confirmDeactivate?.businessName}?`
        }
        description={
          confirmDeactivate?.status === 'Active'
            ? `Deactivating ${confirmDeactivate?.businessName} (${confirmDeactivate?.id}) will prevent new purchases from this middleman while preserving historical ledger and inventory records.`
            : `Re-activating ${confirmDeactivate?.businessName} will enable new raw material purchases.`
        }
        confirmLabel={
          confirmDeactivate?.status === 'Active' ? 'Deactivate' : 'Activate'
        }
        variant={confirmDeactivate?.status === 'Active' ? 'danger' : 'primary'}
      />
    </div>
  );
}

export default Middlemen;

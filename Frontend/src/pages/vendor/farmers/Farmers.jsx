import { useState, useMemo, useRef, useLayoutEffect } from 'react';
import { useSearchParams, useLocation, useNavigate } from 'react-router-dom';
import {
  Sprout,
  Plus,
  Eye,
  Edit3,
  Power,
  Tractor,
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
import VendorDetailPage from '../VendorDetailPage';
import FarmerForm from './FarmerForm';
import FarmerDetails from './FarmerDetails';
import PurchaseForm from '../purchases/PurchaseForm';
import { CROP_OPTIONS, AP_DISTRICTS, INDIAN_STATES } from '../../../utils/constants';
import { formatCurrency, formatNumber } from '../../../utils/formatCurrency';
import { generateNextId } from '../../../utils/generateTransactionId';

export function Farmers() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryFarmerId = searchParams.get('farmerId') || '';
  const queryPurchaseId = searchParams.get('purchaseId') || '';
  const profileInitialTab = searchParams.get('tab') || 'overview';

  const {
    farmers,
    purchases,
    addFarmer,
    updateFarmer,
    toggleFarmerStatus,
  } = useVendor();

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 200);
  const [districtFilter, setDistrictFilter] = useState('All');
  const [stateFilter, setStateFilter] = useState('All');
  const [cropFilter, setCropFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingFarmer, setEditingFarmer] = useState(null);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [confirmDeactivate, setConfirmDeactivate] = useState(null);

  // Resolve active farmer for the full-page profile view (driven by URL query params)
  const activeProfileFarmer = useMemo(() => {
    if (queryFarmerId) {
      return farmers.find((f) => f.id === queryFarmerId) || null;
    }
    if (queryPurchaseId) {
      const matchedPurchase = purchases.find(
        (p) => p.id === queryPurchaseId && p.supplierCategory === 'Farmer'
      );
      if (matchedPurchase) {
        return farmers.find((f) => f.id === matchedPurchase.supplierId) || null;
      }
    }
    return null;
  }, [farmers, purchases, queryFarmerId, queryPurchaseId]);

  const isProfileView = Boolean(activeProfileFarmer);
  const listScrollRef = useRef(0);
  const prevProfileViewRef = useRef(false);

  // Scroll to top when opening the full-page profile; restore table scroll position on Back
  useLayoutEffect(() => {
    if (prevProfileViewRef.current === isProfileView) return;
    prevProfileViewRef.current = isProfileView;
    window.scrollTo(0, isProfileView ? 0 : listScrollRef.current);
  }, [isProfileView]);

  // Open the full-page Farmer profile (pushes a history entry so browser Back works)
  const openProfile = (farmerId, tab = 'overview') => {
    listScrollRef.current = window.scrollY;
    const params = { farmerId };
    if (tab && tab !== 'overview') params.tab = tab;
    setSearchParams(params, { state: { fromDirectory: true } });
  };

  // Return to the Farmers table (search, filters, pagination and scroll are preserved)
  const handleCloseProfile = () => {
    if (location.state?.fromDirectory) {
      navigate(-1);
    } else {
      setSearchParams({}, { replace: true });
    }
  };

  const summary = useMemo(() => {
    const total = farmers.length;
    const active = farmers.filter((f) => f.status === 'Active').length;
    const inactive = total - active;
    const farmerPurchaseRecords = purchases.filter(
      (p) => p.supplierCategory === 'Farmer'
    );
    const totalPurchases = farmerPurchaseRecords.length;
    const totalQty = farmerPurchaseRecords.reduce(
      (sum, p) => sum + Number(p.quantity || 0),
      0
    );
    const totalValue = farmers.reduce(
      (sum, f) => sum + Number(f.totalPurchaseValue || 0),
      0
    );
    const totalPending = farmers.reduce(
      (sum, f) => sum + Number(f.pendingPayables || 0),
      0
    );
    return {
      total,
      active,
      inactive,
      totalPurchases,
      totalQty,
      totalValue,
      totalPending,
    };
  }, [farmers, purchases]);

  const filteredFarmers = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    return farmers.filter((f) => {
      if (districtFilter !== 'All' && f.district !== districtFilter) return false;
      if (stateFilter !== 'All' && f.state !== stateFilter) return false;
      if (cropFilter !== 'All' && !(f.availableCrops || []).includes(cropFilter))
        return false;
      if (statusFilter !== 'All' && f.status !== statusFilter) return false;
      if (q) {
        const match =
          f.id.toLowerCase().includes(q) ||
          f.farmerName.toLowerCase().includes(q) ||
          f.mobileNumber.includes(q) ||
          f.village.toLowerCase().includes(q) ||
          f.district.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [
    farmers,
    debouncedSearch,
    districtFilter,
    stateFilter,
    cropFilter,
    statusFilter,
  ]);

  const nextFarmerId = useMemo(
    () => generateNextId('FARM-', farmers, 'id', 4),
    [farmers]
  );

  const handleSaveFarmer = (formData) => {
    if (editingFarmer) {
      updateFarmer(editingFarmer.id, formData);
    } else {
      addFarmer(formData);
    }
    setIsFormOpen(false);
    setEditingFarmer(null);
  };

  const resetFilters = () => {
    setSearch('');
    setDistrictFilter('All');
    setStateFilter('All');
    setCropFilter('All');
    setStatusFilter('All');
  };

  const columns = [
    {
      key: 'id',
      header: 'Farmer ID',
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
      key: 'farmerName',
      header: 'Farmer Name',
      sortable: true,
      render: (row) => (
        <div>
          <p className="font-bold text-[#172B29]">{row.farmerName}</p>
          <p className="text-[11px] text-[#64748B]">
            S/o {row.fatherName || '—'} •{' '}
            {(row.availableCrops || []).slice(0, 2).join(', ')}
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
      key: 'village',
      header: 'Village',
      sortable: true,
      render: (row) => (
        <div>
          <p className="font-semibold text-[#172B29]">{row.village}</p>
          <p className="text-[11px] text-[#64748B]">
            {row.district}, {row.state}
          </p>
        </div>
      ),
    },
    {
      key: 'totalPurchases',
      header: 'Total Purchases',
      align: 'center',
      sortable: true,
      render: (row) => (
        <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full bg-[#CCFBF1] text-[#0F766E] text-xs font-bold">
          {formatNumber(row.totalPurchases, 0)}
        </span>
      ),
    },
    {
      key: 'totalQuantity',
      header: 'Total Purchase Quantity',
      align: 'right',
      sortable: true,
      render: (row) => (
        <span className="font-semibold text-[#172B29] whitespace-nowrap">
          {formatNumber(row.totalQuantity)} Qtl
        </span>
      ),
      exportAccessor: (row) => `${row.totalQuantity} Qtl`,
    },
    {
      key: 'totalPurchaseValue',
      header: 'Total Purchase Amount',
      align: 'right',
      sortable: true,
      render: (row) => (
        <div>
          <p className="font-bold text-[#0F766E] whitespace-nowrap">
            {formatCurrency(row.totalPurchaseValue)}
          </p>
          {row.pendingPayables > 0 && (
            <p className="text-[11px] text-amber-600 font-medium whitespace-nowrap">
              Due: {formatCurrency(row.pendingPayables)}
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
        <div className="inline-flex items-center justify-end gap-1.5 whitespace-nowrap">
          <button
            type="button"
            onClick={() => openProfile(row.id)}
            title="View Complete Farmer Profile & Procurement Transactions"
            className="w-8 h-8 inline-flex items-center justify-center shrink-0 rounded-lg border border-[#14B8A6]/30 bg-[#CCFBF1] text-[#0F766E] hover:bg-[#0F766E] hover:text-white transition-colors cursor-pointer"
          >
            <Eye className="w-4 h-4 shrink-0 !max-w-none" />
          </button>
          <button
            type="button"
            onClick={() => openProfile(row.id, 'new-purchase')}
            title="Record Purchase from this Farmer"
            className="w-8 h-8 inline-flex items-center justify-center shrink-0 rounded-lg bg-[#F5FAF8] border border-[#E2E8F0] text-[#0F766E] hover:bg-[#CCFBF1] transition-colors cursor-pointer"
          >
            <Tractor className="w-4 h-4 shrink-0 !max-w-none" />
          </button>
          <button
            type="button"
            onClick={() => {
              setEditingFarmer(row);
              setIsFormOpen(true);
            }}
            title="Edit Farmer"
            className="w-8 h-8 inline-flex items-center justify-center shrink-0 rounded-lg bg-[#F5FAF8] border border-[#E2E8F0] text-[#172B29] hover:bg-[#CCFBF1] hover:text-[#0F766E] transition-colors cursor-pointer"
          >
            <Edit3 className="w-4 h-4 shrink-0 !max-w-none" />
          </button>
          <button
            type="button"
            onClick={() => setConfirmDeactivate(row)}
            title={
              row.status === 'Active' ? 'Deactivate Farmer' : 'Activate Farmer'
            }
            className={`w-8 h-8 inline-flex items-center justify-center shrink-0 rounded-lg border transition-colors cursor-pointer ${
              row.status === 'Active'
                ? 'bg-red-50 border-red-200 text-red-600 hover:bg-red-600 hover:text-white'
                : 'bg-[#DCFCE7] border-[#16A34A]/20 text-[#16A34A] hover:bg-[#16A34A] hover:text-white'
            }`}
          >
            <Power className="w-4 h-4 shrink-0 !max-w-none" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      {/* Farmers Directory (kept mounted while a profile is open so table state is preserved) */}
      <div className={isProfileView ? 'hidden' : 'space-y-6'}>
      <VendorPageHeader
        title="Farmers Directory & Procurement"
        subtitle="Manage registered farmers, crop availability, direct raw material purchases, OTP confirmations, and settlements."
        icon={Sprout}
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            <VendorExportMenu
              data={filteredFarmers}
              columns={columns.filter((c) => c.key !== 'actions')}
              filename="farmers_directory.csv"
            />
            <button
              type="button"
              onClick={() => setIsPurchaseModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 h-9 px-3.5 rounded-xl text-xs font-semibold bg-[#CCFBF1] text-[#0F766E] border border-[#14B8A6]/30 hover:bg-[#115E59] hover:text-white transition-all duration-200 cursor-pointer shadow-2xs"
            >
              <Tractor className="w-4 h-4 stroke-[2]" />
              <span>Record Farmer Purchase</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setEditingFarmer(null);
                setIsFormOpen(true);
              }}
              className="inline-flex items-center justify-center gap-2 h-9 px-4 rounded-xl text-xs font-semibold bg-[#0F766E] text-white hover:bg-[#115E59] transition-all duration-200 cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4 stroke-[2]" />
              <span>Add Farmer</span>
            </button>
          </div>
        }
      />

      {/* 5 Farmer Summary KPI Cards (Vendor Dashboard Design System) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 items-stretch">
        <VendorStatCard
          title="Total Farmers"
          value={formatNumber(summary.total, 0)}
          description="Registered in directory"
          icon={Sprout}
        />
        <VendorStatCard
          title="Active Farmers"
          value={formatNumber(summary.active, 0)}
          description="Eligible for direct purchase"
          icon={UserRoundCheck}
        />
        <VendorStatCard
          title="Inactive Farmers"
          value={formatNumber(summary.inactive, 0)}
          description="Temporarily deactivated"
          icon={UserX}
        />
        <VendorStatCard
          title="Total Purchases"
          value={formatNumber(summary.totalPurchases, 0)}
          description={`${formatNumber(summary.totalQty)} Qtl procured`}
          icon={ShoppingCart}
        />
        <VendorStatCard
          title="Total Purchase Amount"
          value={formatCurrency(summary.totalValue)}
          description={`Payables due: ${formatCurrency(summary.totalPending)}`}
          icon={IndianRupee}
        />
      </div>

      {/* Search & Filters */}
      <div className="bg-white p-4 rounded-2xl border border-[#E2E8F0] shadow-xs flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3">
        <VendorSearch
          value={search}
          onChange={setSearch}
          placeholder="Search by Farmer ID, Name, Mobile, Village, or District..."
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
              key: 'crop',
              label: 'Crop',
              value: cropFilter,
              onChange: setCropFilter,
              options: CROP_OPTIONS,
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

      {/* Farmer Listing Table */}
      <VendorDataTable
        columns={columns}
        data={filteredFarmers}
        onResetFilters={resetFilters}
      />
      </div>

      {/* Complete Individual Farmer Profile – Full-Page View (Eye Icon) */}
      {isProfileView && (
        <VendorDetailPage
          title={`Farmer Profile – ${activeProfileFarmer.farmerName || ''}`}
          subtitle={`Farmer ID: ${activeProfileFarmer.id || ''} • ${activeProfileFarmer.village || ''}, ${activeProfileFarmer.district || ''}`}
          icon={Sprout}
          backLabel="Back to Farmers"
          onBack={handleCloseProfile}
        >
          <FarmerDetails
            key={`${activeProfileFarmer.id}-${profileInitialTab}-${queryPurchaseId}`}
            farmer={activeProfileFarmer}
            purchases={purchases}
            initialTab={profileInitialTab}
            initialPurchaseId={queryPurchaseId}
            onEdit={(f) => {
              handleCloseProfile();
              setEditingFarmer(f);
              setIsFormOpen(true);
            }}
          />
        </VendorDetailPage>
      )}

      {/* Add / Edit Farmer Modal */}
      <VendorModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingFarmer(null);
        }}
        title={
          editingFarmer
            ? `Edit Farmer – ${editingFarmer.id}`
            : 'Register New Farmer'
        }
        subtitle="Enter farmer identity, village location, available crops, and optional bank details."
        size="lg"
      >
        <FarmerForm
          initialData={editingFarmer}
          nextFarmerId={nextFarmerId}
          onSubmit={handleSaveFarmer}
          onCancel={() => {
            setIsFormOpen(false);
            setEditingFarmer(null);
          }}
        />
      </VendorModal>

      {/* Record Direct Farmer Purchase Modal */}
      <VendorModal
        isOpen={isPurchaseModalOpen}
        onClose={() => setIsPurchaseModalOpen(false)}
        title="Record Direct Purchase from Farmer"
        subtitle="Select a registered farmer, enter raw material lots and charges, and verify with OTP."
        size="xl"
      >
        <PurchaseForm
          supplierCategory="Farmer"
          onSuccess={(created) => {
            setIsPurchaseModalOpen(false);
            if (created?.supplierId) {
              openProfile(created.supplierId, 'transactions');
            }
          }}
          onCancel={() => setIsPurchaseModalOpen(false)}
        />
      </VendorModal>

      {/* Activate / Deactivate Confirmation Dialog */}
      <VendorConfirmDialog
        isOpen={Boolean(confirmDeactivate)}
        onClose={() => setConfirmDeactivate(null)}
        onConfirm={() => {
          if (confirmDeactivate) {
            toggleFarmerStatus(confirmDeactivate.id);
            setConfirmDeactivate(null);
          }
        }}
        title={
          confirmDeactivate?.status === 'Active'
            ? `Deactivate Farmer ${confirmDeactivate?.id}?`
            : `Activate Farmer ${confirmDeactivate?.id}?`
        }
        description={
          confirmDeactivate?.status === 'Active'
            ? `Deactivating ${confirmDeactivate?.farmerName} will pause new raw material purchases from this farmer while preserving all historical purchase records.`
            : `Re-activating ${confirmDeactivate?.farmerName} will allow new raw material purchase transactions.`
        }
        confirmLabel={
          confirmDeactivate?.status === 'Active'
            ? 'Deactivate Farmer'
            : 'Activate Farmer'
        }
        variant={confirmDeactivate?.status === 'Active' ? 'danger' : 'primary'}
      />
    </div>
  );
}

export default Farmers;

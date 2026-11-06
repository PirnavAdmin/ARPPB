import { useState, useMemo } from 'react';
import {
  Sprout,
  Plus,
  Eye,
  Edit3,
  Power,
  History,
  CheckCircle2,
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
import FarmerForm from './FarmerForm';
import FarmerDetails from './FarmerDetails';
import FarmerPurchaseHistory from './FarmerPurchaseHistory';
import { CROP_OPTIONS, AP_DISTRICTS, INDIAN_STATES } from '../../../utils/constants';
import { formatCurrency, formatNumber } from '../../../utils/formatCurrency';
import { generateNextId } from '../../../utils/generateTransactionId';

export function Farmers() {
  const {
    farmers,
    purchases,
    ledger,
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
  const [viewingFarmer, setViewingFarmer] = useState(null);
  const [historyFarmer, setHistoryFarmer] = useState(null);
  const [confirmDeactivate, setConfirmDeactivate] = useState(null);

  const summary = useMemo(() => {
    const total = farmers.length;
    const active = farmers.filter((f) => f.status === 'Active').length;
    const inactive = total - active;
    const totalPurchases = farmers.reduce((sum, f) => sum + (f.totalPurchases || 0), 0);
    const totalValue = farmers.reduce((sum, f) => sum + (f.totalPurchaseValue || 0), 0);
    return { total, active, inactive, totalPurchases, totalValue };
  }, [farmers]);

  const filteredFarmers = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    return farmers.filter((f) => {
      if (districtFilter !== 'All' && f.district !== districtFilter) return false;
      if (stateFilter !== 'All' && f.state !== stateFilter) return false;
      if (cropFilter !== 'All' && !(f.availableCrops || []).includes(cropFilter)) return false;
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
  }, [farmers, debouncedSearch, districtFilter, stateFilter, cropFilter, statusFilter]);

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
          onClick={() => setViewingFarmer(row)}
          className="font-mono font-bold text-brand-primary hover:underline cursor-pointer"
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
          <p className="font-bold text-brand-text">{row.farmerName}</p>
          <p className="text-xs text-brand-muted">
            <VendorStatusBadge status={row.status} size="xs" className="mt-0.5" />
          </p>
        </div>
      ),
    },
    {
      key: 'mobileNumber',
      header: 'Mobile Number',
      render: (row) => <span className="font-medium whitespace-nowrap">+91 {row.mobileNumber}</span>,
    },
    {
      key: 'village',
      header: 'Village',
      sortable: true,
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
      key: 'availableCrops',
      header: 'Available Crops',
      render: (row) => (
        <div className="flex flex-wrap gap-1 max-w-[200px]">
          {(row.availableCrops || []).map((c) => (
            <span
              key={c}
              className="px-2 py-0.5 rounded-md bg-brand-light text-brand-primary text-[11px] font-semibold"
            >
              {c}
            </span>
          ))}
        </div>
      ),
      exportAccessor: (row) => (row.availableCrops || []).join(', '),
    },
    {
      key: 'totalPurchases',
      header: 'Total Purchases',
      align: 'center',
      sortable: true,
      render: (row) => (
        <span className="font-bold text-brand-primary">
          {row.totalPurchases} ({formatNumber(row.totalQuantity)} Qtl)
        </span>
      ),
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
            onClick={() => setViewingFarmer(row)}
            title="View Farmer Details"
            className="p-1.5 rounded-lg bg-brand-light/70 text-brand-primary hover:bg-brand-primary hover:text-white transition-colors cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => {
              setEditingFarmer(row);
              setIsFormOpen(true);
            }}
            title="Edit Farmer"
            className="p-1.5 rounded-lg bg-brand-background border border-brand-border text-brand-text hover:bg-brand-light hover:text-brand-primary transition-colors cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setHistoryFarmer(row)}
            title="Purchase History"
            className="p-1.5 rounded-lg bg-brand-background border border-brand-border text-brand-text hover:bg-brand-light hover:text-brand-primary transition-colors cursor-pointer"
          >
            <History className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setConfirmDeactivate(row)}
            title={row.status === 'Active' ? 'Deactivate Farmer' : 'Activate Farmer'}
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
        title="Farmers Management"
        subtitle="Manage registered farmers, crop availability, direct procurement history, and settlement accounts."
        icon={Sprout}
        actions={
          <>
            <VendorExportMenu
              data={filteredFarmers}
              columns={columns.filter((c) => c.key !== 'actions')}
              filename="farmers_directory.csv"
            />
            <button
              type="button"
              onClick={() => {
                setEditingFarmer(null);
                setIsFormOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-brand-primary text-white hover:bg-brand-secondary transition-colors cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Add Farmer</span>
            </button>
          </>
        }
      />

      {/* 5 Farmer Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <VendorStatCard
          title="Total Farmers"
          value={formatNumber(summary.total, 0)}
          description="Registered in Andhra Pradesh"
          icon={Sprout}
        />
        <VendorStatCard
          title="Active Farmers"
          value={formatNumber(summary.active, 0)}
          description="Eligible for direct purchase"
          icon={CheckCircle2}
        />
        <VendorStatCard
          title="Inactive Farmers"
          value={formatNumber(summary.inactive, 0)}
          description="Temporarily deactivated"
          icon={UserX}
        />
        <VendorStatCard
          title="Total Farmer Purchases"
          value={formatNumber(summary.totalPurchases, 0)}
          description="Confirmed procurement batches"
          icon={ShoppingCart}
        />
        <VendorStatCard
          title="Total Purchase Value"
          value={formatCurrency(summary.totalValue)}
          description="Cumulative farmer procurement"
          icon={IndianRupee}
          highlight
        />
      </div>

      {/* Search & Filters */}
      <div className="bg-brand-surface p-4 rounded-2xl border border-brand-border shadow-2xs flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3">
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

      {/* Add / Edit Farmer Modal */}
      <VendorModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingFarmer(null);
        }}
        title={editingFarmer ? `Edit Farmer – ${editingFarmer.id}` : 'Register New Farmer'}
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

      {/* Farmer Details Modal */}
      <VendorModal
        isOpen={Boolean(viewingFarmer)}
        onClose={() => setViewingFarmer(null)}
        title={`Farmer Profile – ${viewingFarmer?.farmerName || ''}`}
        subtitle={`Farmer ID: ${viewingFarmer?.id || ''} • ${viewingFarmer?.village || ''}, ${viewingFarmer?.district || ''}`}
        size="xl"
      >
        <FarmerDetails
          farmer={viewingFarmer}
          purchases={purchases}
          ledger={ledger}
          onClose={() => setViewingFarmer(null)}
          onEdit={(f) => {
            setViewingFarmer(null);
            setEditingFarmer(f);
            setIsFormOpen(true);
          }}
        />
      </VendorModal>

      {/* Farmer Purchase History Modal */}
      <VendorModal
        isOpen={Boolean(historyFarmer)}
        onClose={() => setHistoryFarmer(null)}
        title={`Purchase History – ${historyFarmer?.farmerName || ''}`}
        subtitle={`Linked procurement transactions for ${historyFarmer?.id || ''}`}
        size="xl"
      >
        <FarmerPurchaseHistory farmer={historyFarmer} purchases={purchases} />
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
            ? `Deactivating ${confirmDeactivate?.farmerName} will pause new raw material purchases from this farmer while preserving all historical purchase and ledger records.`
            : `Re-activating ${confirmDeactivate?.farmerName} will allow new raw material purchase transactions.`
        }
        confirmLabel={confirmDeactivate?.status === 'Active' ? 'Deactivate Farmer' : 'Activate Farmer'}
        variant={confirmDeactivate?.status === 'Active' ? 'danger' : 'primary'}
      />
    </div>
  );
}

export default Farmers;


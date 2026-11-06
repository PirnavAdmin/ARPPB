import { useState, useMemo } from 'react';
import {
  Briefcase,
  Plus,
  Eye,
  Edit3,
  Power,
  History,
  CheckCircle2,
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
import { AP_DISTRICTS, INDIAN_STATES } from '../../../utils/constants';
import { formatCurrency, formatNumber } from '../../../utils/formatCurrency';
import { generateNextId } from '../../../utils/generateTransactionId';

export function Middlemen() {
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
  const [viewingMid, setViewingMid] = useState(null);
  const [confirmDeactivate, setConfirmDeactivate] = useState(null);

  const summary = useMemo(() => {
    const total = middlemen.length;
    const active = middlemen.filter((m) => m.status === 'Active').length;
    const totalPurchases = middlemen.reduce((sum, m) => sum + (m.totalPurchases || 0), 0);
    const totalValue = middlemen.reduce((sum, m) => sum + (m.purchaseValue || 0), 0);
    const totalPayables = middlemen.reduce((sum, m) => sum + (m.outstandingPayables || 0), 0);
    return { total, active, totalPurchases, totalValue, totalPayables };
  }, [middlemen]);

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
          onClick={() => setViewingMid(row)}
          className="font-mono font-bold text-brand-primary hover:underline cursor-pointer"
        >
          {row.id}
        </button>
      ),
    },
    {
      key: 'businessName',
      header: 'Business Name',
      sortable: true,
      render: (row) => (
        <div>
          <p className="font-bold text-brand-text">{row.businessName}</p>
          <VendorStatusBadge status={row.status} size="xs" className="mt-0.5" />
        </div>
      ),
    },
    {
      key: 'ownerName',
      header: 'Owner Name',
      sortable: true,
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
      key: 'gstNumber',
      header: 'GST Number',
      render: (row) => (
        <span className="font-mono text-xs font-semibold text-brand-primary">
          {row.gstNumber || '—'}
        </span>
      ),
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
      key: 'purchaseValue',
      header: 'Purchase Value',
      align: 'right',
      sortable: true,
      render: (row) => (
        <span className="font-bold text-brand-text whitespace-nowrap">
          {formatCurrency(row.purchaseValue)}
        </span>
      ),
      exportAccessor: (row) => row.purchaseValue,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (row) => (
        <div className="inline-flex items-center gap-1">
          <button
            type="button"
            onClick={() => setViewingMid(row)}
            title="View Middleman Details & Purchase History"
            className="p-1.5 rounded-lg bg-brand-light/70 text-brand-primary hover:bg-brand-primary hover:text-white transition-colors cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => {
              setEditingMid(row);
              setIsFormOpen(true);
            }}
            title="Edit Middleman"
            className="p-1.5 rounded-lg bg-brand-background border border-brand-border text-brand-text hover:bg-brand-light hover:text-brand-primary transition-colors cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setViewingMid(row)}
            title="Purchase History"
            className="p-1.5 rounded-lg bg-brand-background border border-brand-border text-brand-text hover:bg-brand-light hover:text-brand-primary transition-colors cursor-pointer"
          >
            <History className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setConfirmDeactivate(row)}
            title={row.status === 'Active' ? 'Deactivate Middleman' : 'Activate Middleman'}
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
        title="Middlemen Management"
        subtitle="Manage mandi commission agents, bulk raw material traders, GST credentials, and payables."
        icon={Briefcase}
        actions={
          <>
            <VendorExportMenu
              data={filteredMiddlemen}
              columns={columns.filter((c) => c.key !== 'actions')}
              filename="middlemen_directory.csv"
            />
            <button
              type="button"
              onClick={() => {
                setEditingMid(null);
                setIsFormOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-brand-primary text-white hover:bg-brand-secondary transition-colors cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Add Middleman</span>
            </button>
          </>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <VendorStatCard
          title="Total Middlemen"
          value={formatNumber(summary.total, 0)}
          description={`${summary.active} active commission agencies`}
          icon={Briefcase}
        />
        <VendorStatCard
          title="Active Traders"
          value={formatNumber(summary.active, 0)}
          description="GST-verified mandi partners"
          icon={CheckCircle2}
        />
        <VendorStatCard
          title="Total Middleman Purchases"
          value={formatNumber(summary.totalPurchases, 0)}
          description="Confirmed bulk procurement lots"
          icon={ShoppingCart}
        />
        <VendorStatCard
          title="Total Purchase Value"
          value={formatCurrency(summary.totalValue)}
          description={`Payables due: ${formatCurrency(summary.totalPayables)}`}
          icon={IndianRupee}
          highlight
        />
      </div>

      {/* Search & Filters */}
      <div className="bg-brand-surface p-4 rounded-2xl border border-brand-border shadow-2xs flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3">
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

      {/* Table */}
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
        title={editingMid ? `Edit Middleman – ${editingMid.id}` : 'Register New Middleman'}
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

      {/* Details Modal */}
      <VendorModal
        isOpen={Boolean(viewingMid)}
        onClose={() => setViewingMid(null)}
        title={`Middleman Profile – ${viewingMid?.businessName || ''}`}
        subtitle={`Middleman ID: ${viewingMid?.id || ''} • Owner: ${viewingMid?.ownerName || ''}`}
        size="xl"
      >
        <MiddlemanDetails
          middleman={viewingMid}
          purchases={purchases}
          ledger={ledger}
          onClose={() => setViewingMid(null)}
          onEdit={(m) => {
            setViewingMid(null);
            setEditingMid(m);
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
        confirmLabel={confirmDeactivate?.status === 'Active' ? 'Deactivate' : 'Activate'}
        variant={confirmDeactivate?.status === 'Active' ? 'danger' : 'primary'}
      />
    </div>
  );
}

export default Middlemen;


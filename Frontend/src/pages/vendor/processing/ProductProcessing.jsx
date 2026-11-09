import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Factory,
  Plus,
  CheckCircle2,
  FileEdit,
  ArrowDownToLine,
  PackageCheck,
  AlertTriangle,
  IndianRupee,
} from 'lucide-react';
import { useVendor } from '../../../hooks/useVendor';
import { useDebounce } from '../../../hooks/useDebounce';
import VendorPageHeader from '../VendorPageHeader';
import VendorStatCard from '../VendorStatCard';
import VendorSearch from '../VendorSearch';
import VendorFilters from '../VendorFilters';
import VendorModal from '../VendorModal';
import VendorExportMenu from '../VendorExportMenu';
import ProcessingForm from './ProcessingForm';
import ProcessingHistory from './ProcessingHistory';
import ProcessingDetails from './ProcessingDetails';
import { CROP_OPTIONS } from '../../../utils/constants';
import { formatCurrency, formatNumber } from '../../../utils/formatCurrency';

export function ProductProcessing() {
  const [searchParams] = useSearchParams();
  const preselectedStockId = searchParams.get('stockId') || '';

  const { processingRecords, cancelDraftProcessing } = useVendor();

  const [activeView, setActiveView] = useState(
    preselectedStockId ? 'form' : 'dashboard'
  ); // 'dashboard' | 'form'
  const [editingDraft, setEditingDraft] = useState(null);
  const [viewingRecord, setViewingRecord] = useState(null);

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 200);
  const [cropFilter, setCropFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  useEffect(() => {
    if (preselectedStockId) {
      setActiveView('form');
    }
  }, [preselectedStockId]);

  // 7 Required Processing Dashboard KPIs
  const stats = useMemo(() => {
    const totalBatches = processingRecords.length;
    const draftCount = processingRecords.filter((r) => r.status === 'Draft').length;
    const completed = processingRecords.filter((r) => r.status === 'Completed');
    const completedCount = completed.length;

    const totalInput = completed.reduce((s, r) => s + Number(r.inputQuantity || 0), 0);
    const totalOutput = completed.reduce(
      (s, r) => s + Number(r.actualOutputQuantity || 0),
      0
    );
    const totalWastage = completed.reduce(
      (s, r) => s + Number(r.wastageQuantity || 0),
      0
    );
    const totalExpenses = completed.reduce(
      (s, r) => s + Number(r.totalProcessingExpenses || 0),
      0
    );

    return {
      totalBatches,
      draftCount,
      completedCount,
      totalInput,
      totalOutput,
      totalWastage,
      totalExpenses,
    };
  }, [processingRecords]);

  const filteredRecords = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    return processingRecords.filter((r) => {
      if (cropFilter !== 'All' && r.rawMaterial !== cropFilter) return false;
      if (statusFilter !== 'All' && r.status !== statusFilter) return false;
      if (q) {
        const match =
          r.id.toLowerCase().includes(q) ||
          r.batchNumber.toLowerCase().includes(q) ||
          r.rawMaterial.toLowerCase().includes(q) ||
          r.rawMaterialBatchNumber.toLowerCase().includes(q) ||
          (r.outputs || []).some((o) => o.productName.toLowerCase().includes(q));
        if (!match) return false;
      }
      return true;
    });
  }, [processingRecords, debouncedSearch, cropFilter, statusFilter]);

  const resetFilters = () => {
    setSearch('');
    setCropFilter('All');
    setStatusFilter('All');
  };

  return (
    <div className="space-y-6">
      <VendorPageHeader
        title="Product Processing Management"
        subtitle="Convert raw material batches into finished agricultural products with actual yield, wastage, and batch unit costing."
        icon={Factory}
        actions={
          <>
            <VendorExportMenu
              data={filteredRecords}
              columns={[
                { key: 'id', header: 'Processing ID' },
                { key: 'processingDate', header: 'Date' },
                { key: 'rawMaterial', header: 'Raw Material' },
                { key: 'rawMaterialBatchNumber', header: 'Source Batch' },
                { key: 'inputQuantity', header: 'Input Qty' },
                { key: 'inputUnit', header: 'Input Unit' },
                { key: 'actualOutputQuantity', header: 'Output Qty' },
                { key: 'outputUnit', header: 'Output Unit' },
                { key: 'wastageQuantity', header: 'Wastage Qty' },
                { key: 'wastagePercentage', header: 'Wastage %' },
                { key: 'totalProcessingExpenses', header: 'Processing Expenses' },
                { key: 'totalBatchCost', header: 'Total Batch Cost' },
                { key: 'costPerUnit', header: 'Cost per Unit' },
                { key: 'status', header: 'Status' },
              ]}
              filename="product_processing_batches.csv"
            />
            <button
              type="button"
              onClick={() => {
                setEditingDraft(null);
                setActiveView((prev) => (prev === 'form' ? 'dashboard' : 'form'));
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-brand-primary text-white hover:bg-brand-secondary transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>
                {activeView === 'form'
                  ? 'View Processing History'
                  : 'New Processing Batch'}
              </span>
            </button>
          </>
        }
      />

      {/* A. PROCESSING DASHBOARD – 7 KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3">
        <VendorStatCard
          title="Total Batches"
          value={formatNumber(stats.totalBatches, 0)}
          description="All processing runs"
          icon={Factory}
        />
        <VendorStatCard
          title="Draft Processing"
          value={formatNumber(stats.draftCount, 0)}
          description="Pending completion"
          icon={FileEdit}
          onClick={() => setStatusFilter('Draft')}
        />
        <VendorStatCard
          title="Completed"
          value={formatNumber(stats.completedCount, 0)}
          description="Stock converted"
          icon={CheckCircle2}
          onClick={() => setStatusFilter('Completed')}
        />
        <VendorStatCard
          title="Total Input Qty"
          value={`${formatNumber(stats.totalInput)} Qtl`}
          description="Raw material consumed"
          icon={ArrowDownToLine}
        />
        <VendorStatCard
          title="Total Output Qty"
          value={formatNumber(stats.totalOutput)}
          description="Qtl / Kg / Litre produced"
          icon={PackageCheck}
          highlight
        />
        <VendorStatCard
          title="Total Wastage"
          value={`${formatNumber(stats.totalWastage)} Qtl`}
          description="Husk, moisture & loss"
          icon={AlertTriangle}
        />
        <VendorStatCard
          title="Processing Expenses"
          value={formatCurrency(stats.totalExpenses)}
          description="Milling, labour & power"
          icon={IndianRupee}
        />
      </div>

      {/* Toggle between Processing Form and Processing History Table */}
      {activeView === 'form' ? (
        <ProcessingForm
          initialDraft={editingDraft}
          preselectedStockId={preselectedStockId}
          onSuccess={() => {
            setEditingDraft(null);
            setActiveView('dashboard');
          }}
          onCancel={() => {
            setEditingDraft(null);
            setActiveView('dashboard');
          }}
        />
      ) : (
        <div className="space-y-4">
          <div className="bg-brand-surface p-4 rounded-2xl border border-brand-border shadow-2xs flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3">
            <VendorSearch
              value={search}
              onChange={setSearch}
              placeholder="Search by Processing ID, Batch Number, Raw Material, or Output Product..."
            />
            <VendorFilters
              filters={[
                {
                  key: 'crop',
                  label: 'Raw Material',
                  value: cropFilter,
                  onChange: setCropFilter,
                  options: CROP_OPTIONS,
                },
                {
                  key: 'status',
                  label: 'Status',
                  value: statusFilter,
                  onChange: setStatusFilter,
                  options: ['Completed', 'Draft'],
                },
              ]}
              onReset={resetFilters}
            />
          </div>

          <ProcessingHistory
            records={filteredRecords}
            onViewDetails={setViewingRecord}
            onEditDraft={(draft) => {
              setEditingDraft(draft);
              setActiveView('form');
            }}
            onCancelDraft={cancelDraftProcessing}
            onResetFilters={resetFilters}
          />
        </div>
      )}

      {/* Processing Details Modal */}
      <VendorModal
        isOpen={Boolean(viewingRecord)}
        onClose={() => setViewingRecord(null)}
        title={`Processing Batch Details – ${viewingRecord?.id || ''}`}
        subtitle={`${viewingRecord?.rawMaterial || ''} → ${(viewingRecord?.outputs || [])
          .map((o) => o.productName)
          .join(', ')}`}
        size="xl"
      >
        <ProcessingDetails
          record={viewingRecord}
          onClose={() => setViewingRecord(null)}
          onEditDraft={(draft) => {
            setViewingRecord(null);
            setEditingDraft(draft);
            setActiveView('form');
          }}
        />
      </VendorModal>
    </div>
  );
}

export default ProductProcessing;


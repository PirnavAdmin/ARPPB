import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Warehouse, Factory, AlertTriangle } from 'lucide-react';
import { useVendor } from '../../../hooks/useVendor';
import { useDebounce } from '../../../hooks/useDebounce';
import VendorPageHeader from '../VendorPageHeader';
import VendorSearch from '../VendorSearch';
import VendorFilters from '../VendorFilters';
import VendorModal from '../VendorModal';
import VendorExportMenu from '../VendorExportMenu';
import InventorySummary from './InventorySummary';
import InventoryTable from './InventoryTable';
import InventoryDetails from './InventoryDetails';
import StockMovementHistory from './StockMovementHistory';
import { CROP_OPTIONS, QUALITY_GRADES } from '../../../utils/constants';

export function RawMaterialInventory() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedCrop = searchParams.get('crop') || 'All';

  const { inventory, stockMovements, processingRecords, productBatches } = useVendor();

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 200);
  const [cropFilter, setCropFilter] = useState(preselectedCrop);
  const [supplierCategoryFilter, setSupplierCategoryFilter] = useState('All');
  const [gradeFilter, setGradeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [purchaseDateFilter, setPurchaseDateFilter] = useState('');
  const [onlyLowStock, setOnlyLowStock] = useState(false);

  const [selectedBatch, setSelectedBatch] = useState(null);

  useEffect(() => {
    if (preselectedCrop && preselectedCrop !== 'All') {
      setCropFilter(preselectedCrop);
    }
  }, [preselectedCrop]);

  const lowStockBatches = useMemo(
    () =>
      inventory.filter(
        (b) =>
          Number(b.availableQuantity || 0) <= Number(b.minimumThreshold || 15) &&
          Number(b.availableQuantity || 0) > 0
      ),
    [inventory]
  );

  const filteredInventory = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    return inventory.filter((b) => {
      if (cropFilter !== 'All' && b.cropName.toLowerCase() !== cropFilter.toLowerCase()) {
        return false;
      }
      if (
        supplierCategoryFilter !== 'All' &&
        b.supplierCategory !== supplierCategoryFilter
      ) {
        return false;
      }
      if (gradeFilter !== 'All' && b.qualityGrade !== gradeFilter) return false;
      if (purchaseDateFilter && b.purchaseDate !== purchaseDateFilter) return false;

      const isLow =
        Number(b.availableQuantity || 0) <= Number(b.minimumThreshold || 15) &&
        Number(b.availableQuantity || 0) > 0;
      const effectiveStatus =
        Number(b.availableQuantity || 0) <= 0
          ? 'Exhausted'
          : isLow
          ? 'Low Stock'
          : 'In Stock';

      if (statusFilter !== 'All' && effectiveStatus !== statusFilter) return false;
      if (onlyLowStock && !isLow) return false;

      if (q) {
        const match =
          b.id.toLowerCase().includes(q) ||
          b.batchNumber.toLowerCase().includes(q) ||
          b.cropName.toLowerCase().includes(q) ||
          b.cropVariety.toLowerCase().includes(q) ||
          b.supplierName.toLowerCase().includes(q) ||
          b.purchaseId.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [
    inventory,
    debouncedSearch,
    cropFilter,
    supplierCategoryFilter,
    gradeFilter,
    statusFilter,
    purchaseDateFilter,
    onlyLowStock,
  ]);

  const resetFilters = () => {
    setSearch('');
    setCropFilter('All');
    setSupplierCategoryFilter('All');
    setGradeFilter('All');
    setStatusFilter('All');
    setPurchaseDateFilter('');
    setOnlyLowStock(false);
  };

  const exportColumns = [
    { key: 'id', header: 'Stock ID' },
    { key: 'cropName', header: 'Crop Name' },
    { key: 'cropVariety', header: 'Crop Variety' },
    { key: 'supplierName', header: 'Supplier Name' },
    { key: 'supplierCategory', header: 'Supplier Category' },
    { key: 'purchaseId', header: 'Purchase ID' },
    { key: 'batchNumber', header: 'Batch Number' },
    { key: 'purchaseDate', header: 'Purchase Date' },
    { key: 'purchasedQuantity', header: 'Purchased Quantity' },
    { key: 'processedQuantity', header: 'Processed Quantity' },
    { key: 'availableQuantity', header: 'Available Quantity' },
    { key: 'unit', header: 'Unit' },
    { key: 'averageCost', header: 'Average Cost' },
    { key: 'qualityGrade', header: 'Quality Grade' },
    { key: 'status', header: 'Status' },
  ];

  return (
    <div className="space-y-6">
      <VendorPageHeader
        title="Raw Material Inventory"
        subtitle="Batch-wise raw material stock management with full purchase-to-processing traceability."
        icon={Warehouse}
        actions={
          <>
            <VendorExportMenu
              data={filteredInventory}
              columns={exportColumns}
              filename="raw_material_inventory.csv"
            />
            <button
              type="button"
              onClick={() => navigate('/vendor/processing')}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-brand-primary text-white hover:bg-brand-secondary transition-colors cursor-pointer"
            >
              <Factory className="w-4 h-4" />
              <span>Start Product Processing</span>
            </button>
          </>
        }
      />

      {/* 4 Summary Cards */}
      <InventorySummary
        inventory={inventory}
        onFilterLowStock={() => setOnlyLowStock((prev) => !prev)}
      />

      {/* Low Stock Alert Banner */}
      {lowStockBatches.length > 0 && (
        <div className="p-4 rounded-xl bg-brand-warning-light/60 border border-brand-warning/30 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-brand-warning shrink-0" />
            <div>
              <strong className="text-brand-text">
                Low Stock Alert ({lowStockBatches.length} Batches):
              </strong>{' '}
              <span className="text-brand-muted">
                {lowStockBatches
                  .map(
                    (b) =>
                      `${b.cropName} (${b.batchNumber}: ${b.availableQuantity} ${b.unit} left)`
                  )
                  .join(' • ')}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setOnlyLowStock((prev) => !prev)}
            className="px-3 py-1.5 rounded-lg font-semibold bg-brand-surface border border-brand-warning/40 text-brand-warning hover:bg-brand-warning hover:text-white transition-colors cursor-pointer"
          >
            {onlyLowStock ? 'Show All Batches' : 'Filter Low Stock Only'}
          </button>
        </div>
      )}

      {/* Search & Filters */}
      <div className="bg-brand-surface p-4 rounded-2xl border border-brand-border shadow-2xs flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3">
        <VendorSearch
          value={search}
          onChange={setSearch}
          placeholder="Search by Stock ID, Batch Number, Crop, Variety, Supplier, or Purchase ID..."
        />
        <VendorFilters
          filters={[
            {
              key: 'crop',
              label: 'Crop',
              value: cropFilter,
              onChange: setCropFilter,
              options: CROP_OPTIONS,
            },
            {
              key: 'supplierCategory',
              label: 'Supplier Type',
              value: supplierCategoryFilter,
              onChange: setSupplierCategoryFilter,
              options: ['Farmer', 'Middleman'],
            },
            {
              key: 'grade',
              label: 'Grade',
              value: gradeFilter,
              onChange: setGradeFilter,
              options: QUALITY_GRADES,
            },
            {
              key: 'status',
              label: 'Stock Status',
              value: statusFilter,
              onChange: setStatusFilter,
              options: ['In Stock', 'Low Stock', 'Exhausted'],
            },
          ]}
          onReset={resetFilters}
        >
          <input
            type="date"
            aria-label="Filter by purchase date"
            value={purchaseDateFilter}
            onChange={(e) => setPurchaseDateFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-brand-surface border border-brand-border rounded-lg text-brand-text"
          />
        </VendorFilters>
      </div>

      {/* Inventory Batch Table */}
      <InventoryTable
        inventory={filteredInventory}
        onSelectBatch={setSelectedBatch}
        onResetFilters={resetFilters}
      />

      {/* Stock Movement History Section */}
      <div className="bg-brand-surface rounded-2xl border border-brand-border p-5 shadow-2xs">
        <h3 className="text-base font-bold text-brand-primary mb-3">
          Stock Movement History (Inward Purchases &amp; Processing Deductions)
        </h3>
        <StockMovementHistory movements={stockMovements} />
      </div>

      {/* Batch Traceability Details Modal */}
      <VendorModal
        isOpen={Boolean(selectedBatch)}
        onClose={() => setSelectedBatch(null)}
        title={`Raw Material Batch Details – ${selectedBatch?.batchNumber || ''}`}
        subtitle={`Stock ID: ${selectedBatch?.id || ''} • Source Purchase: ${selectedBatch?.purchaseId || ''}`}
        size="xl"
      >
        <InventoryDetails
          stock={selectedBatch}
          movements={stockMovements}
          processingRecords={processingRecords}
          productBatches={productBatches}
          onClose={() => setSelectedBatch(null)}
        />
      </VendorModal>
    </div>
  );
}

export default RawMaterialInventory;


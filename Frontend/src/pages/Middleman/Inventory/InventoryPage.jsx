import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useMiddleman } from '../../../context/middleman';
import { MiddlemanPageHeader } from '../components/layout/MiddlemanPageHeader';
import { InventorySummary } from '../components/inventory/InventorySummary';
import { InventoryTable } from '../components/inventory/InventoryTable';
import { BatchDetails } from '../components/inventory/BatchDetails';
import { SearchInput } from '../components/common/SearchInput';
import { FilterDropdown } from '../components/common/FilterDropdown';
import { Pagination } from '../components/common/Pagination';
import { SectionCard } from '../components/common/SectionCard';
import { CROP_LIST, QUALITY_GRADES } from '../../../utils/middleman/transactionHelpers';

export const InventoryPage = () => {
  const navigate = useNavigate();
  const { inventory } = useMiddleman();

  const [searchTerm, setSearchTerm] = useState('');
  const [cropFilter, setCropFilter] = useState('ALL');
  const [qualityFilter, setQualityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  const [viewingBatch, setViewingBatch] = useState(null);

  const filteredBatches = useMemo(() => {
    return inventory.filter((b) => {
      const matchSearch =
        !searchTerm ||
        b.stockId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.cropName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.farmerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.purchaseId.toLowerCase().includes(searchTerm.toLowerCase());

      const matchCrop = cropFilter === 'ALL' || b.cropName === cropFilter;
      const matchQuality = qualityFilter === 'ALL' || b.quality === qualityFilter;
      const matchStatus = statusFilter === 'ALL' || b.status === statusFilter;

      return matchSearch && matchCrop && matchQuality && matchStatus;
    });
  }, [inventory, searchTerm, cropFilter, qualityFilter, statusFilter]);

  const totalItems = filteredBatches.length;
  const paginatedBatches = filteredBatches.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-6">
      <MiddlemanPageHeader
        title="My Inventory (Batch-Wise Stock)"
        subtitle="Batch-level agricultural stock tracking with FIFO landed cost allocation."
        actions={
          <button
            type="button"
            onClick={() => navigate('/middleman/purchases')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-[#0F766E] text-white hover:bg-[#115E59] shadow-sm cursor-pointer transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Procure New Stock</span>
          </button>
        }
      />

      {/* 13.2 Summary Cards */}
      <InventorySummary batches={inventory} />

      {/* 13.6 Filters & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-[#E2E8F0]">
        <SearchInput
          value={searchTerm}
          onChange={(val) => {
            setSearchTerm(val);
            setCurrentPage(1);
          }}
          placeholder="Search by Stock ID, Crop, Farmer, Purchase ID..."
          className="w-full sm:max-w-xs"
        />

        <div className="flex flex-wrap items-center gap-2.5">
          <FilterDropdown
            label="Crop"
            value={cropFilter}
            onChange={(val) => {
              setCropFilter(val);
              setCurrentPage(1);
            }}
            options={CROP_LIST}
          />

          <FilterDropdown
            label="Quality"
            value={qualityFilter}
            onChange={(val) => {
              setQualityFilter(val);
              setCurrentPage(1);
            }}
            options={QUALITY_GRADES}
          />

          <FilterDropdown
            label="Stock Status"
            value={statusFilter}
            onChange={(val) => {
              setStatusFilter(val);
              setCurrentPage(1);
            }}
            options={['In Stock', 'Low Stock', 'Exhausted']}
          />
        </div>
      </div>

      {/* 13.3 Inventory Table */}
      <SectionCard bodyClassName="p-0">
        <InventoryTable
          batches={paginatedBatches}
          onViewBatch={(batch) => setViewingBatch(batch)}
        />

        <Pagination
          currentPage={currentPage}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
        />
      </SectionCard>

      {/* Batch Details Modal */}
      {viewingBatch && (
        <BatchDetails
          batch={viewingBatch}
          onClose={() => setViewingBatch(null)}
        />
      )}
    </div>
  );
};

export default InventoryPage;

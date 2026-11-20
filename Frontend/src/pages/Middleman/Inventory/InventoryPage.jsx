import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, RefreshCw, X, Check, PackagePlus, ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';
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
import { fetchMiddlemanInventoryBatchByIdApi } from '../../../services/middleman';

export const InventoryPage = () => {
  const navigate = useNavigate();
  const {
    inventory,
    farmers,
    addInventoryBatch,
    updateInventoryBatch,
    refreshInventory,
  } = useMiddleman();

  const [searchTerm, setSearchTerm] = useState('');
  const [cropFilter, setCropFilter] = useState('ALL');
  const [qualityFilter, setQualityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  const [viewingBatch, setViewingBatch] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Direct Stock Intake form state
  const [formData, setFormData] = useState({
    cropName: CROP_LIST[0] || 'Paddy (Dhan)',
    variety: 'Standard Grade',
    farmerId: '',
    farmerName: '',
    purchasedQuantity: '',
    unit: 'Quintal',
    purchaseRate: '',
    allocatedCharges: 0,
    quality: 'Grade A',
    godownLocation: 'Main AMC Warehouse',
    minimumThreshold: 10,
    purchaseDate: new Date().toISOString().slice(0, 10),
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      if (refreshInventory) await refreshInventory();
      toast.success('Inventory refreshed from server');
    } catch {
      toast.error('Failed to refresh inventory');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleFarmerChange = (e) => {
    const selectedId = e.target.value;
    const matched = farmers.find((f) => f.farmerId === selectedId || String(f.id) === selectedId);
    setFormData((prev) => ({
      ...prev,
      farmerId: selectedId,
      farmerName: matched ? (matched.farmerName || matched.name) : '',
    }));
  };

  const handleAddBatchSubmit = async (e) => {
    e.preventDefault();
    if (!formData.cropName.trim()) {
      toast.error('Crop name is required');
      return;
    }
    const qty = Number(formData.purchasedQuantity);
    if (!qty || qty <= 0) {
      toast.error('Please enter a valid purchased quantity greater than 0');
      return;
    }
    const rate = Number(formData.purchaseRate);
    if (!rate || rate <= 0) {
      toast.error('Please enter a valid purchase rate');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        purchasedQuantity: qty,
        availableQuantity: qty,
        soldQuantity: 0,
        purchaseRate: rate,
        allocatedCharges: Number(formData.allocatedCharges || 0),
        minimumThreshold: Number(formData.minimumThreshold || 10),
      };

      const result = await addInventoryBatch(payload);
      if (result) {
        toast.success(`Stock Batch ${result.stockId || ''} added to inventory and saved to database!`);
        setIsAddModalOpen(false);
        // Reset form
        setFormData({
          cropName: CROP_LIST[0] || 'Paddy (Dhan)',
          variety: 'Standard Grade',
          farmerId: '',
          farmerName: '',
          purchasedQuantity: '',
          unit: 'Quintal',
          purchaseRate: '',
          allocatedCharges: 0,
          quality: 'Grade A',
          godownLocation: 'Main AMC Warehouse',
          minimumThreshold: 10,
          purchaseDate: new Date().toISOString().slice(0, 10),
        });
      }
    } catch (err) {
      toast.error(err?.message || 'Failed to add batch to database');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredBatches = useMemo(() => {
    return inventory.filter((b) => {
      const matchSearch =
        !searchTerm ||
        (b.stockId && b.stockId.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (b.cropName && b.cropName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (b.farmerName && b.farmerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (b.purchaseId && b.purchaseId.toLowerCase().includes(searchTerm.toLowerCase()));

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
        subtitle="Batch-level agricultural stock tracking with FIFO landed cost allocation & live backend persistence."
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-2.5 rounded-xl border border-[#E2E8F0] bg-white hover:bg-slate-50 text-[#64748B] hover:text-[#0F766E] shadow-xs cursor-pointer transition-all"
              title="Refresh from Database"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-[#0F766E]' : ''}`} />
            </button>

            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold border border-teal-200 bg-teal-50 text-[#0F766E] hover:bg-teal-100 shadow-2xs cursor-pointer transition-all"
            >
              <PackagePlus className="w-4 h-4" />
              <span>Direct Stock In</span>
            </button>

            <button
              type="button"
              onClick={() => navigate('/middleman/purchases')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-[#0F766E] text-white hover:bg-[#115E59] shadow-xs cursor-pointer transition-all"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Procure from Farmer</span>
            </button>
          </div>
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
          onViewBatch={async (batch) => {
            setViewingBatch(batch);
            const id = batch?.id || batch?.stockId;
            if (id) {
              const detail = await fetchMiddlemanInventoryBatchByIdApi(id);
              if (detail) {
                setViewingBatch((prev) => (prev ? { ...prev, ...detail } : prev));
              }
            }
          }}
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
          onUpdateBatch={async (id, data) => {
            await updateInventoryBatch(id, data);
            setViewingBatch((prev) => (prev ? { ...prev, ...data } : prev));
          }}
        />
      )}

      {/* Direct Add Batch Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-[#E2E8F0] p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-teal-50 text-[#0F766E] rounded-xl">
                  <PackagePlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#1F2937]">Direct Stock Entry / Add Batch</h3>
                  <p className="text-xs text-[#64748B]">Add a fresh produce batch directly into warehouse inventory database</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-[#94A3B8] hover:text-[#1F2937] p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddBatchSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-[#1F2937] mb-1">Crop Name *</label>
                  <select
                    value={formData.cropName}
                    onChange={(e) => setFormData((prev) => ({ ...prev, cropName: e.target.value }))}
                    className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-xl focus:outline-hidden focus:border-[#0F766E] bg-white font-medium"
                    required
                  >
                    {CROP_LIST.map((crop) => (
                      <option key={crop} value={crop}>{crop}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1F2937] mb-1">Variety</label>
                  <input
                    type="text"
                    value={formData.variety}
                    onChange={(e) => setFormData((prev) => ({ ...prev, variety: e.target.value }))}
                    placeholder="e.g. Sona Masoori, Sharbati"
                    className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-xl focus:outline-hidden focus:border-[#0F766E]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1F2937] mb-1">Farmer / Supplier</label>
                  {farmers && farmers.length > 0 ? (
                    <select
                      value={formData.farmerId}
                      onChange={handleFarmerChange}
                      className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-xl focus:outline-hidden focus:border-[#0F766E] bg-white"
                    >
                      <option value="">Select registered farmer (Optional)</option>
                      {farmers.map((f) => (
                        <option key={f.farmerId || f.id} value={f.farmerId || f.id}>
                          {f.farmerName || f.name} ({f.farmerId || `ID: ${f.id}`})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={formData.farmerName}
                      onChange={(e) => setFormData((prev) => ({ ...prev, farmerName: e.target.value }))}
                      placeholder="Farmer or Supplier Name"
                      className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-xl focus:outline-hidden focus:border-[#0F766E]"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1F2937] mb-1">Quality Grade</label>
                  <select
                    value={formData.quality}
                    onChange={(e) => setFormData((prev) => ({ ...prev, quality: e.target.value }))}
                    className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-xl focus:outline-hidden focus:border-[#0F766E] bg-white font-medium"
                  >
                    {QUALITY_GRADES.map((q) => (
                      <option key={q} value={q}>{q}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1F2937] mb-1">Purchased Quantity *</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      step="any"
                      min="0.1"
                      value={formData.purchasedQuantity}
                      onChange={(e) => setFormData((prev) => ({ ...prev, purchasedQuantity: e.target.value }))}
                      placeholder="e.g. 50"
                      className="w-2/3 px-3 py-2 text-xs border border-[#E2E8F0] rounded-xl focus:outline-hidden focus:border-[#0F766E] font-semibold"
                      required
                    />
                    <select
                      value={formData.unit}
                      onChange={(e) => setFormData((prev) => ({ ...prev, unit: e.target.value }))}
                      className="w-1/3 px-2 py-2 text-xs border border-[#E2E8F0] rounded-xl focus:outline-hidden focus:border-[#0F766E] bg-white"
                    >
                      <option value="Quintal">Quintal</option>
                      <option value="Kg">Kg</option>
                      <option value="Ton">Ton</option>
                      <option value="Bags">Bags</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1F2937] mb-1">Purchase Rate (₹ per unit) *</label>
                  <input
                    type="number"
                    step="any"
                    min="1"
                    value={formData.purchaseRate}
                    onChange={(e) => setFormData((prev) => ({ ...prev, purchaseRate: e.target.value }))}
                    placeholder="e.g. 2400"
                    className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-xl focus:outline-hidden focus:border-[#0F766E] font-semibold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1F2937] mb-1">Allocated Charges (₹ Freight/Handling)</label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={formData.allocatedCharges}
                    onChange={(e) => setFormData((prev) => ({ ...prev, allocatedCharges: e.target.value }))}
                    placeholder="e.g. 500"
                    className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-xl focus:outline-hidden focus:border-[#0F766E]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1F2937] mb-1">Warehouse / Godown Location</label>
                  <input
                    type="text"
                    value={formData.godownLocation}
                    onChange={(e) => setFormData((prev) => ({ ...prev, godownLocation: e.target.value }))}
                    placeholder="e.g. Godown #4, Sector A"
                    className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-xl focus:outline-hidden focus:border-[#0F766E]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1F2937] mb-1">Minimum Alert Threshold</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.minimumThreshold}
                    onChange={(e) => setFormData((prev) => ({ ...prev, minimumThreshold: e.target.value }))}
                    className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-xl focus:outline-hidden focus:border-[#0F766E]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1F2937] mb-1">Purchase Date</label>
                  <input
                    type="date"
                    value={formData.purchaseDate}
                    onChange={(e) => setFormData((prev) => ({ ...prev, purchaseDate: e.target.value }))}
                    className="w-full px-3 py-2 text-xs border border-[#E2E8F0] rounded-xl focus:outline-hidden focus:border-[#0F766E]"
                  />
                </div>
              </div>

              {/* Cost Summary Preview */}
              {Number(formData.purchasedQuantity) > 0 && Number(formData.purchaseRate) > 0 && (
                <div className="p-3 bg-teal-50/60 rounded-xl border border-teal-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[#64748B] block text-[11px]">Calculated Landed Cost</span>
                    <span className="font-bold text-[#1F2937]">
                      ₹{((Number(formData.purchasedQuantity) * Number(formData.purchaseRate) + Number(formData.allocatedCharges || 0)) / Number(formData.purchasedQuantity)).toFixed(2)} / {formData.unit}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[#64748B] block text-[11px]">Total Stock Value</span>
                    <span className="font-extrabold text-[#0F766E]">
                      ₹{(Number(formData.purchasedQuantity) * Number(formData.purchaseRate) + Number(formData.allocatedCharges || 0)).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border border-[#E2E8F0] text-[#64748B] hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold bg-[#0F766E] text-white hover:bg-[#115E59] shadow-xs cursor-pointer disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>{isSubmitting ? 'Saving to Database...' : 'Save Batch to Database'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryPage;

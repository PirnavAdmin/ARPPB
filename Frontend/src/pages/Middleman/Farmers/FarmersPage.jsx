import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useMiddleman } from '../../../context/middleman';
import { MiddlemanPageHeader } from '../components/layout/MiddlemanPageHeader';
import { FarmerTable } from '../components/farmers/FarmerTable';
import { FarmerForm } from '../components/farmers/FarmerForm';
import { FarmerDetails } from '../components/farmers/FarmerDetails';
import { FarmerHistory } from '../components/farmers/FarmerHistory';
import { SearchInput } from '../components/common/SearchInput';
import { FilterDropdown } from '../components/common/FilterDropdown';
import { Pagination } from '../components/common/Pagination';
import { SectionCard } from '../components/common/SectionCard';
import { CROP_LIST } from '../../../utils/middleman/transactionHelpers';

export const FarmersPage = () => {
  const navigate = useNavigate();
  const { farmers, addFarmer, updateFarmer, purchases } = useMiddleman();

  // Search & Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [cropFilter, setCropFilter] = useState('ALL');
  const [districtFilter, setDistrictFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingFarmer, setEditingFarmer] = useState(null);
  const [viewingFarmer, setViewingFarmer] = useState(null);
  const [historyFarmer, setHistoryFarmer] = useState(null);

  // Extract unique districts for filter
  const districts = useMemo(() => {
    return Array.from(new Set(farmers.map((f) => f.district).filter(Boolean)));
  }, [farmers]);

  // Filtered farmers
  const filteredFarmers = useMemo(() => {
    return farmers.filter((f) => {
      const matchSearch =
        !searchTerm ||
        f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.farmerId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.mobile.includes(searchTerm) ||
        f.village.toLowerCase().includes(searchTerm.toLowerCase());

      const matchCrop =
        cropFilter === 'ALL' || (f.crops && f.crops.includes(cropFilter));

      const matchDistrict =
        districtFilter === 'ALL' || f.district === districtFilter;

      const matchStatus =
        statusFilter === 'ALL' || (f.status || 'Active') === statusFilter;

      return matchSearch && matchCrop && matchDistrict && matchStatus;
    });
  }, [farmers, searchTerm, cropFilter, districtFilter, statusFilter]);

  const totalItems = filteredFarmers.length;
  const paginatedFarmers = filteredFarmers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const activeCount = farmers.filter((f) => (f.status || 'Active') === 'Active').length;

  const handleSaveFarmer = (formData) => {
    if (editingFarmer) {
      updateFarmer(editingFarmer.farmerId, formData);
    } else {
      addFarmer(formData);
    }
    setIsFormOpen(false);
    setEditingFarmer(null);
  };

  return (
    <div className="space-y-6">
      {/* 7.2 Header */}
      <MiddlemanPageHeader
        title="Farmers Management"
        subtitle={`Total: ${farmers.length} registered farmers • ${activeCount} actively supplying`}
        actions={
          <button
            type="button"
            onClick={() => {
              setEditingFarmer(null);
              setIsFormOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-[#0F766E] text-white hover:bg-[#115E59] shadow-sm cursor-pointer transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Farmer</span>
          </button>
        }
      />

      {/* Search & Filters Row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-[#E2E8F0]">
        <SearchInput
          value={searchTerm}
          onChange={(val) => {
            setSearchTerm(val);
            setCurrentPage(1);
          }}
          placeholder="Search by name, ID, phone, village..."
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
            label="District"
            value={districtFilter}
            onChange={(val) => {
              setDistrictFilter(val);
              setCurrentPage(1);
            }}
            options={districts}
          />

          <FilterDropdown
            label="Status"
            value={statusFilter}
            onChange={(val) => {
              setStatusFilter(val);
              setCurrentPage(1);
            }}
            options={['Active', 'Inactive']}
          />
        </div>
      </div>

      {/* 7.5 Farmer Table */}
      <SectionCard bodyClassName="p-0">
        <FarmerTable
          farmers={paginatedFarmers}
          onView={(f) => setViewingFarmer(f)}
          onEdit={(f) => {
            setEditingFarmer(f);
            setIsFormOpen(true);
          }}
          onViewPurchases={(f) => setHistoryFarmer(f)}
          onViewLedger={(f) => navigate('/middleman/ledger', { state: { partyFilter: f.farmerId } })}
        />

        <Pagination
          currentPage={currentPage}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
        />
      </SectionCard>

      {/* Add / Edit Farmer Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-[#E2E8F0] p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base sm:text-lg font-bold text-[#1F2937] mb-1">
              {editingFarmer ? 'Edit Farmer Details' : 'Register New Farmer'}
            </h3>
            <p className="text-xs text-[#64748B] mb-5">
              Fill in farmer contact, village location, and cultivated crops.
            </p>
            <FarmerForm
              initialData={editingFarmer}
              isEdit={Boolean(editingFarmer)}
              onSave={handleSaveFarmer}
              onCancel={() => {
                setIsFormOpen(false);
                setEditingFarmer(null);
              }}
            />
          </div>
        </div>
      )}

      {/* View Farmer Details Modal */}
      {viewingFarmer && (
        <FarmerDetails
          farmer={viewingFarmer}
          onClose={() => setViewingFarmer(null)}
          onEdit={(f) => {
            setViewingFarmer(null);
            setEditingFarmer(f);
            setIsFormOpen(true);
          }}
        />
      )}

      {/* View Farmer Purchase History Modal */}
      {historyFarmer && (
        <FarmerHistory
          farmer={historyFarmer}
          purchases={purchases.filter((p) => p.farmerId === historyFarmer.farmerId)}
          onClose={() => setHistoryFarmer(null)}
        />
      )}
    </div>
  );
};

export default FarmersPage;

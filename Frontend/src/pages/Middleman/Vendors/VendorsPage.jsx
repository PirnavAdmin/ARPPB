import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useMiddleman } from '../../../context/middleman';
import { MiddlemanPageHeader } from '../components/layout/MiddlemanPageHeader';
import { VendorTable } from '../components/vendors/VendorTable';
import { VendorForm } from '../components/vendors/VendorForm';
import { VendorDetails } from '../components/vendors/VendorDetails';
import { SearchInput } from '../components/common/SearchInput';
import { FilterDropdown } from '../components/common/FilterDropdown';
import { Pagination } from '../components/common/Pagination';
import { SectionCard } from '../components/common/SectionCard';
import { VENDOR_BUSINESS_TYPES } from '../../../data/mock/middleman/vendorData';

export const VendorsPage = () => {
  const navigate = useNavigate();
  const { vendors, addVendor, updateVendor, vendorSales } = useMiddleman();

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [districtFilter, setDistrictFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);
  const [viewingVendor, setViewingVendor] = useState(null);

  const districts = useMemo(() => {
    return Array.from(new Set(vendors.map((v) => v.district).filter(Boolean)));
  }, [vendors]);

  const filteredVendors = useMemo(() => {
    return vendors.filter((v) => {
      const matchSearch =
        !searchTerm ||
        v.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.vendorId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.mobile.includes(searchTerm) ||
        (v.gstNumber && v.gstNumber.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchType = typeFilter === 'ALL' || v.businessType === typeFilter;
      const matchDistrict = districtFilter === 'ALL' || v.district === districtFilter;

      return matchSearch && matchType && matchDistrict;
    });
  }, [vendors, searchTerm, typeFilter, districtFilter]);

  const totalItems = filteredVendors.length;
  const paginatedVendors = filteredVendors.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleSaveVendor = (formData) => {
    if (editingVendor) {
      updateVendor(editingVendor.vendorId, formData);
    } else {
      addVendor(formData);
    }
    setIsFormOpen(false);
    setEditingVendor(null);
  };

  return (
    <div className="space-y-6">
      <MiddlemanPageHeader
        title="Vendors & Wholesale Buyers"
        subtitle={`Total: ${vendors.length} registered agro-businesses, processing mills, and traders`}
        actions={
          <button
            type="button"
            onClick={() => {
              setEditingVendor(null);
              setIsFormOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-[#0F766E] text-white hover:bg-[#115E59] shadow-sm cursor-pointer transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Vendor</span>
          </button>
        }
      />

      {/* Filters Row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-[#E2E8F0]">
        <SearchInput
          value={searchTerm}
          onChange={(val) => {
            setSearchTerm(val);
            setCurrentPage(1);
          }}
          placeholder="Search business, owner, GST, phone..."
          className="w-full sm:max-w-xs"
        />

        <div className="flex flex-wrap items-center gap-2.5">
          <FilterDropdown
            label="Business Type"
            value={typeFilter}
            onChange={(val) => {
              setTypeFilter(val);
              setCurrentPage(1);
            }}
            options={VENDOR_BUSINESS_TYPES}
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
        </div>
      </div>

      {/* Table */}
      <SectionCard bodyClassName="p-0">
        <VendorTable
          vendors={paginatedVendors}
          onView={(v) => setViewingVendor(v)}
          onEdit={(v) => {
            setEditingVendor(v);
            setIsFormOpen(true);
          }}
          onViewSales={(v) => navigate('/middleman/sales-history', { state: { partyFilter: v.businessName } })}
        />

        <Pagination
          currentPage={currentPage}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
        />
      </SectionCard>

      {/* Add / Edit Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-[#E2E8F0] p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base sm:text-lg font-bold text-[#1F2937] mb-1">
              {editingVendor ? 'Edit Vendor Details' : 'Register New Vendor'}
            </h3>
            <p className="text-xs text-[#64748B] mb-5">
              Enter agro-commercial buyer details, business entity type, and GSTIN.
            </p>
            <VendorForm
              initialData={editingVendor}
              isEdit={Boolean(editingVendor)}
              onSave={handleSaveVendor}
              onCancel={() => {
                setIsFormOpen(false);
                setEditingVendor(null);
              }}
            />
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewingVendor && (
        <VendorDetails
          vendor={viewingVendor}
          sales={vendorSales.filter((s) => s.vendorId === viewingVendor.vendorId)}
          onClose={() => setViewingVendor(null)}
          onEdit={(v) => {
            setViewingVendor(null);
            setEditingVendor(v);
            setIsFormOpen(true);
          }}
        />
      )}
    </div>
  );
};

export default VendorsPage;

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useMiddleman } from '../../../context/middleman';
import { MiddlemanPageHeader } from '../components/layout/MiddlemanPageHeader';
import { CustomerTable } from '../components/customers/CustomerTable';
import { CustomerForm } from '../components/customers/CustomerForm';
import { CustomerDetails } from '../components/customers/CustomerDetails';
import { SearchInput } from '../components/common/SearchInput';
import { FilterDropdown } from '../components/common/FilterDropdown';
import { Pagination } from '../components/common/Pagination';
import { SectionCard } from '../components/common/SectionCard';

export const CustomersPage = () => {
  const navigate = useNavigate();
  const { customers, addCustomer, updateCustomer, customerSales } = useMiddleman();

  const [searchTerm, setSearchTerm] = useState('');
  const [districtFilter, setDistrictFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [viewingCustomer, setViewingCustomer] = useState(null);

  const districts = useMemo(() => {
    return Array.from(new Set(customers.map((c) => c.district).filter(Boolean)));
  }, [customers]);

  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const matchSearch =
        !searchTerm ||
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.customerId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.mobile.includes(searchTerm) ||
        (c.address && c.address.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchDistrict = districtFilter === 'ALL' || c.district === districtFilter;

      return matchSearch && matchDistrict;
    });
  }, [customers, searchTerm, districtFilter]);

  const totalItems = filteredCustomers.length;
  const paginatedCustomers = filteredCustomers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleSaveCustomer = (formData) => {
    if (editingCustomer) {
      updateCustomer(editingCustomer.customerId, formData);
    } else {
      addCustomer(formData);
    }
    setIsFormOpen(false);
    setEditingCustomer(null);
  };

  return (
    <div className="space-y-6">
      <MiddlemanPageHeader
        title="Direct Customers & Retail Buyers"
        subtitle={`Total: ${customers.length} registered consumer and retail buyers`}
        actions={
          <button
            type="button"
            onClick={() => {
              setEditingCustomer(null);
              setIsFormOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-[#0F766E] text-white hover:bg-[#115E59] shadow-sm cursor-pointer transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Customer</span>
          </button>
        }
      />

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-[#E2E8F0]">
        <SearchInput
          value={searchTerm}
          onChange={(val) => {
            setSearchTerm(val);
            setCurrentPage(1);
          }}
          placeholder="Search by name, ID, mobile, address..."
          className="w-full sm:max-w-xs"
        />

        <div className="flex flex-wrap items-center gap-2.5">
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
        <CustomerTable
          customers={paginatedCustomers}
          onView={(c) => setViewingCustomer(c)}
          onEdit={(c) => {
            setEditingCustomer(c);
            setIsFormOpen(true);
          }}
          onViewSales={(c) => navigate('/middleman/sales-history', { state: { partyFilter: c.name } })}
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
          <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-[#E2E8F0] p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base sm:text-lg font-bold text-[#1F2937] mb-1">
              {editingCustomer ? 'Edit Customer Details' : 'Register New Customer'}
            </h3>
            <p className="text-xs text-[#64748B] mb-5">
              Enter customer / retail shop contact and delivery address.
            </p>
            <CustomerForm
              initialData={editingCustomer}
              isEdit={Boolean(editingCustomer)}
              onSave={handleSaveCustomer}
              onCancel={() => {
                setIsFormOpen(false);
                setEditingCustomer(null);
              }}
            />
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {viewingCustomer && (
        <CustomerDetails
          customer={viewingCustomer}
          sales={customerSales.filter((s) => s.customerId === viewingCustomer.customerId)}
          onClose={() => setViewingCustomer(null)}
          onEdit={(c) => {
            setViewingCustomer(null);
            setEditingCustomer(c);
            setIsFormOpen(true);
          }}
        />
      )}
    </div>
  );
};

export default CustomersPage;

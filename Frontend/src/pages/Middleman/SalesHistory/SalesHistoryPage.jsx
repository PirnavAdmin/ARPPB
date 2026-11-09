import React, { useState, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Building2, Store, Plus, X } from 'lucide-react';
import { useMiddleman } from '../../../context/middleman';
import { MiddlemanPageHeader } from '../components/layout/MiddlemanPageHeader';
import { VendorSalesTable } from '../components/history/VendorSalesTable';
import { CustomerSalesTable } from '../components/history/CustomerSalesTable';
import { SearchInput } from '../components/common/SearchInput';
import { FilterDropdown } from '../components/common/FilterDropdown';
import { Pagination } from '../components/common/Pagination';
import { SectionCard } from '../components/common/SectionCard';
import { StatusBadge } from '../components/common/StatusBadge';
import { CROP_LIST } from '../../../utils/middleman/transactionHelpers';
import { formatINR, formatDate, formatQuantity } from '../../../utils/middleman/formatters';

export const SalesHistoryPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { vendorSales, customerSales } = useMiddleman();

  // Active tab: 'vendor' or 'customer'
  const [activeTab, setActiveTab] = useState(
    location.state?.activeTab === 'customer' ? 'customer' : 'vendor'
  );

  const [searchTerm, setSearchTerm] = useState(location.state?.partyFilter || '');
  const [cropFilter, setCropFilter] = useState('ALL');
  const [otpFilter, setOtpFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  const [selectedSale, setSelectedSale] = useState(null);

  // Filter Vendor Sales
  const filteredVendorSales = useMemo(() => {
    return vendorSales.filter((s) => {
      const matchSearch =
        !searchTerm ||
        s.saleId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.businessName && s.businessName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (s.vendorName && s.vendorName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        s.cropName.toLowerCase().includes(searchTerm.toLowerCase());

      const matchCrop = cropFilter === 'ALL' || s.cropName === cropFilter;
      const matchOtp = otpFilter === 'ALL' || s.otpStatus === otpFilter;

      return matchSearch && matchCrop && matchOtp;
    });
  }, [vendorSales, searchTerm, cropFilter, otpFilter]);

  // Filter Customer Sales
  const filteredCustomerSales = useMemo(() => {
    return customerSales.filter((s) => {
      const matchSearch =
        !searchTerm ||
        s.saleId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.customerName && s.customerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        s.cropName.toLowerCase().includes(searchTerm.toLowerCase());

      const matchCrop = cropFilter === 'ALL' || s.cropName === cropFilter;
      const matchOtp = otpFilter === 'ALL' || s.otpStatus === otpFilter;

      return matchSearch && matchCrop && matchOtp;
    });
  }, [customerSales, searchTerm, cropFilter, otpFilter]);

  const currentDataset = activeTab === 'vendor' ? filteredVendorSales : filteredCustomerSales;
  const totalItems = currentDataset.length;
  const paginatedData = currentDataset.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-6">
      <MiddlemanPageHeader
        title="Sales Order History"
        subtitle="Auditable records of produce sold to commercial vendors and local retail consumers."
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/middleman/sales/vendors')}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-[#0F766E] text-white hover:bg-[#115E59] shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Vendor Sale</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/middleman/sales/customers')}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-[#E2E8F0] bg-white hover:bg-slate-50 text-[#1F2937] shadow-2xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-[#0F766E]" />
              <span>Customer Sale</span>
            </button>
          </div>
        }
      />

      {/* Primary Tab Selector */}
      <div className="flex items-center border-b border-[#E2E8F0] gap-3">
        <button
          type="button"
          onClick={() => {
            setActiveTab('vendor');
            setCurrentPage(1);
          }}
          className={`flex items-center gap-2 pb-3 px-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'vendor'
              ? 'border-[#0F766E] text-[#0F766E]'
              : 'border-transparent text-[#64748B] hover:text-[#1F2937]'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Sales to Vendors</span>
          <span className="px-2 py-0.5 text-xs rounded-full bg-slate-100 text-[#64748B]">
            {vendorSales.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('customer');
            setCurrentPage(1);
          }}
          className={`flex items-center gap-2 pb-3 px-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'customer'
              ? 'border-[#0F766E] text-[#0F766E]'
              : 'border-transparent text-[#64748B] hover:text-[#1F2937]'
          }`}
        >
          <Store className="w-4 h-4" />
          <span>Sales to Customers</span>
          <span className="px-2 py-0.5 text-xs rounded-full bg-slate-100 text-[#64748B]">
            {customerSales.length}
          </span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-[#E2E8F0]">
        <SearchInput
          value={searchTerm}
          onChange={(val) => {
            setSearchTerm(val);
            setCurrentPage(1);
          }}
          placeholder={
            activeTab === 'vendor'
              ? 'Search by Vendor, Order ID, Crop...'
              : 'Search by Customer, Order ID, Crop...'
          }
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
            label="OTP Status"
            value={otpFilter}
            onChange={(val) => {
              setOtpFilter(val);
              setCurrentPage(1);
            }}
            options={['Confirmed', 'Pending', 'Draft', 'Rejected', 'Expired']}
          />
        </div>
      </div>

      {/* Selected Tab Table */}
      <SectionCard bodyClassName="p-0">
        {activeTab === 'vendor' ? (
          <VendorSalesTable
            sales={paginatedData}
            onViewDetails={(s) => setSelectedSale({ ...s, isCustomer: false })}
          />
        ) : (
          <CustomerSalesTable
            sales={paginatedData}
            onViewDetails={(s) => setSelectedSale({ ...s, isCustomer: true })}
          />
        )}

        <Pagination
          currentPage={currentPage}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
        />
      </SectionCard>

      {/* Sale Record Detail Modal */}
      {selectedSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-[#E2E8F0] p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-[#1F2937]">
                    Order #{selectedSale.saleId}
                  </h3>
                  <StatusBadge status={selectedSale.otpStatus} size="sm" />
                </div>
                <p className="text-xs text-[#64748B]">Date: {formatDate(selectedSale.salesDate)}</p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedSale(null)}
                className="text-[#94A3B8] hover:text-[#1F2937] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-teal-50/50 rounded-2xl border border-teal-100 flex items-center justify-between">
              <div>
                <span className="text-xs text-[#64748B] block">Total Order Value</span>
                <span className="text-xl font-black text-[#0F766E]">
                  {formatINR(selectedSale.totalAmount || selectedSale.finalAmount)}
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs text-[#64748B] block">Payment Due</span>
                <span className="text-sm font-bold text-[#1F2937]">
                  {formatDate(selectedSale.expectedPaymentDate)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 bg-slate-50 rounded-xl">
                <span className="text-[#64748B] block">Buyer</span>
                <span className="font-bold text-[#1F2937]">
                  {selectedSale.businessName || selectedSale.customerName}
                </span>
                <span className="text-[#64748B] block mt-0.5">{selectedSale.mobile}</span>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-xl">
                <span className="text-[#64748B] block">Produce</span>
                <span className="font-bold text-[#1F2937]">
                  {formatQuantity(selectedSale.quantity, selectedSale.unit)} {selectedSale.cropName}
                </span>
                <span className="text-[#64748B] block mt-0.5">Rate: {formatINR(selectedSale.rate || selectedSale.price)}</span>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-[#E2E8F0]">
              <button
                type="button"
                onClick={() => setSelectedSale(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-[#1F2937] cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesHistoryPage;

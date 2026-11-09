import React, { useState, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ShoppingCart, Building2, Store, Plus, X } from 'lucide-react';
import { useMiddleman } from '../../../context/middleman';
import { MiddlemanPageHeader } from '../components/layout/MiddlemanPageHeader';
import { PurchaseHistoryTable } from '../components/history/PurchaseHistoryTable';
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
  const { purchases, vendorSales, customerSales } = useMiddleman();

  // Active tab: 'farmer' (1st), 'vendor' (2nd), or 'customer' (3rd)
  const [activeTab, setActiveTab] = useState(() => {
    if (location.state?.activeTab === 'vendor') return 'vendor';
    if (location.state?.activeTab === 'customer') return 'customer';
    return 'farmer';
  });

  const [searchTerm, setSearchTerm] = useState(location.state?.partyFilter || '');
  const [cropFilter, setCropFilter] = useState('ALL');
  const [otpFilter, setOtpFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [selectedSale, setSelectedSale] = useState(null);

  // 1. Filter Farmer Purchases
  const filteredPurchases = useMemo(() => {
    return purchases.filter((p) => {
      const matchSearch =
        !searchTerm ||
        p.purchaseId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.farmerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.cropName.toLowerCase().includes(searchTerm.toLowerCase());

      const matchCrop = cropFilter === 'ALL' || p.cropName === cropFilter;
      const matchOtp = otpFilter === 'ALL' || p.otpStatus === otpFilter;

      return matchSearch && matchCrop && matchOtp;
    });
  }, [purchases, searchTerm, cropFilter, otpFilter]);

  // 2. Filter Vendor Sales
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

  // 3. Filter Customer Sales
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

  const currentDataset =
    activeTab === 'farmer'
      ? filteredPurchases
      : activeTab === 'vendor'
      ? filteredVendorSales
      : filteredCustomerSales;
  const totalItems = currentDataset.length;
  const paginatedData = currentDataset.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-6">
      <MiddlemanPageHeader
        title="Sales Order History"
        subtitle="Auditable records of farmer produce procurement, commercial vendor sales, and retail consumer sales."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/middleman/purchases')}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-[#0F766E] text-white hover:bg-[#115E59] shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Purchase</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/middleman/sales/vendors')}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-[#E2E8F0] bg-white hover:bg-slate-50 text-[#1F2937] shadow-2xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-[#0F766E]" />
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

      {/* Primary Section Selector: 1. Farmer Purchase History, 2. Sales to Vendors, 3. Sales to Customers */}
      <div className="flex flex-wrap items-center border-b border-[#E2E8F0] gap-3">
        <button
          type="button"
          onClick={() => {
            setActiveTab('farmer');
            setCurrentPage(1);
          }}
          className={`flex items-center gap-2 pb-3 px-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'farmer'
              ? 'border-[#0F766E] text-[#0F766E]'
              : 'border-transparent text-[#64748B] hover:text-[#1F2937]'
          }`}
        >
          <ShoppingCart className="w-4 h-4" />
          <span>Farmer Purchase History</span>
          <span className="px-2 py-0.5 text-xs rounded-full bg-slate-100 text-[#64748B]">
            {purchases.length}
          </span>
        </button>

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
            activeTab === 'farmer'
              ? 'Search by Purchase ID, Farmer Name, Crop...'
              : activeTab === 'vendor'
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

      {/* Selected Section Table */}
      <SectionCard bodyClassName="p-0">
        {activeTab === 'farmer' ? (
          <PurchaseHistoryTable
            purchases={paginatedData}
            onViewDetails={(p) => setSelectedPurchase(p)}
          />
        ) : activeTab === 'vendor' ? (
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

      {/* Complete Purchase Detail Modal */}
      {selectedPurchase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-[#E2E8F0] p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-bold text-[#1F2937]">
                    Purchase Record &bull; <span className="font-mono text-[#0F766E]">{selectedPurchase.purchaseId}</span>
                  </h3>
                  <StatusBadge status={selectedPurchase.otpStatus} size="sm" />
                </div>
                <p className="text-xs text-[#64748B]">Procured on {formatDate(selectedPurchase.purchaseDate)}</p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedPurchase(null)}
                className="text-[#94A3B8] hover:text-[#1F2937] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Financial Overview */}
            <div className="p-4 bg-teal-50/50 rounded-2xl border border-teal-100 flex items-center justify-between">
              <div>
                <span className="text-xs text-[#64748B] block">Total Purchase Settlement</span>
                <span className="text-xl font-black text-[#0F766E]">{formatINR(selectedPurchase.totalAmount)}</span>
              </div>
              <div className="text-right">
                <span className="text-xs text-[#64748B] block">Payment Due Date</span>
                <span className="text-sm font-bold text-[#1F2937]">{formatDate(selectedPurchase.expectedPaymentDate)}</span>
              </div>
            </div>

            {/* Details Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl space-y-1.5">
                <span className="font-bold text-[#64748B] uppercase tracking-wider block text-[10px]">Farmer Supplier</span>
                <div className="font-bold text-[#1F2937]">{selectedPurchase.farmerName}</div>
                <div className="text-[#64748B]">+91 {selectedPurchase.farmerMobile}</div>
                <div className="text-[#64748B]">{selectedPurchase.farmerLocation}</div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl space-y-1.5">
                <span className="font-bold text-[#64748B] uppercase tracking-wider block text-[10px]">Produce Specs</span>
                <div>
                  <span className="text-[#64748B]">Crop: </span>
                  <span className="font-bold text-[#1F2937]">{selectedPurchase.cropName} ({selectedPurchase.variety || 'Standard'})</span>
                </div>
                <div>
                  <span className="text-[#64748B]">Quantity: </span>
                  <span className="font-semibold text-[#1F2937]">{formatQuantity(selectedPurchase.quantity, selectedPurchase.unit)}</span>
                </div>
                <div>
                  <span className="text-[#64748B]">Purchase Rate: </span>
                  <span className="font-semibold text-[#1F2937]">{formatINR(selectedPurchase.rate)} / {selectedPurchase.unit}</span>
                </div>
              </div>
            </div>

            {/* Charges */}
            <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 text-xs">
              <span className="font-bold text-[#64748B] uppercase tracking-wider block text-[10px]">Cost Composition</span>
              <div className="flex justify-between text-[#64748B]">
                <span>Crop Subtotal:</span>
                <span className="font-semibold text-[#1F2937]">{formatINR(selectedPurchase.subtotal)}</span>
              </div>
              <div className="flex justify-between text-[#64748B]">
                <span>Transport / Loading / Other Surcharges:</span>
                <span className="font-semibold text-[#1F2937]">{formatINR(selectedPurchase.additionalCharges || 0)}</span>
              </div>
              <div className="flex justify-between text-[#0F766E] font-medium pt-1 border-t border-slate-200">
                <span>Calculated Landed Cost per {selectedPurchase.unit}:</span>
                <span className="font-bold">{formatINR(selectedPurchase.averageCostPerUnit, true)}</span>
              </div>
            </div>

            {/* Notes */}
            {selectedPurchase.notes && (
              <div className="p-3 bg-slate-50 rounded-xl text-xs">
                <span className="font-semibold text-[#64748B] block mb-0.5">Notes:</span>
                <p className="text-[#1F2937]">{selectedPurchase.notes}</p>
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-[#E2E8F0]">
              <button
                type="button"
                onClick={() => setSelectedPurchase(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-[#1F2937] cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

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

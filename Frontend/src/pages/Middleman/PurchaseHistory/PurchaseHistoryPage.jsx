import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, X } from 'lucide-react';
import { useMiddleman } from '../../../context/middleman';
import { MiddlemanPageHeader } from '../components/layout/MiddlemanPageHeader';
import { PurchaseHistoryTable } from '../components/history/PurchaseHistoryTable';
import { SearchInput } from '../components/common/SearchInput';
import { FilterDropdown } from '../components/common/FilterDropdown';
import { Pagination } from '../components/common/Pagination';
import { SectionCard } from '../components/common/SectionCard';
import { StatusBadge } from '../components/common/StatusBadge';
import { CROP_LIST } from '../../../utils/middleman/transactionHelpers';
import { formatINR, formatDate, formatQuantity } from '../../../utils/middleman/formatters';

export const PurchaseHistoryPage = () => {
  const navigate = useNavigate();
  const { purchases } = useMiddleman();

  const [searchTerm, setSearchTerm] = useState('');
  const [cropFilter, setCropFilter] = useState('ALL');
  const [otpFilter, setOtpFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  const [selectedPurchase, setSelectedPurchase] = useState(null);

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

  const totalItems = filteredPurchases.length;
  const paginatedPurchases = filteredPurchases.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-6">
      <MiddlemanPageHeader
        title="Farmer Purchase History"
        subtitle={`Complete audit trail of all ${purchases.length} raw produce procurement transactions.`}
        actions={
          <button
            type="button"
            onClick={() => navigate('/middleman/purchases')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-[#0F766E] text-white hover:bg-[#115E59] shadow-sm cursor-pointer transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Purchase</span>
          </button>
        }
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-[#E2E8F0]">
        <SearchInput
          value={searchTerm}
          onChange={(val) => {
            setSearchTerm(val);
            setCurrentPage(1);
          }}
          placeholder="Search by Purchase ID, Farmer Name, Crop..."
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

      {/* Table */}
      <SectionCard bodyClassName="p-0">
        <PurchaseHistoryTable
          purchases={paginatedPurchases}
          onViewDetails={(p) => setSelectedPurchase(p)}
        />

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
    </div>
  );
};

export default PurchaseHistoryPage;

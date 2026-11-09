import React, { useState, useMemo } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { useMiddleman } from '../../../context/middleman';
import { MiddlemanPageHeader } from '../components/layout/MiddlemanPageHeader';
import { ConfirmationTabs } from '../components/confirmations/ConfirmationTabs';
import { ConfirmationTable } from '../components/confirmations/ConfirmationTable';
import { ConfirmationDetails } from '../components/confirmations/ConfirmationDetails';
import { SearchInput } from '../components/common/SearchInput';
import { Pagination } from '../components/common/Pagination';
import { SectionCard } from '../components/common/SectionCard';

export const OTPConfirmationsPage = () => {
  const { confirmations, confirmTransaction, rejectTransaction } = useMiddleman();

  const [activeTab, setActiveTab] = useState('Farmer'); // 'Farmer', 'Vendor', 'Customer'
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  const [viewingConfirmation, setViewingConfirmation] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Tab counts
  const tabCounts = useMemo(() => ({
    farmer: confirmations.filter((c) => c.partyType === 'Farmer').length,
    vendor: confirmations.filter((c) => c.partyType === 'Vendor').length,
    customer: confirmations.filter((c) => c.partyType === 'Customer').length,
  }), [confirmations]);

  // Filter dataset
  const filteredList = useMemo(() => {
    return confirmations.filter((item) => {
      const matchTab = item.partyType === activeTab;
      const matchStatus = statusFilter === 'ALL' || item.otpStatus === statusFilter;
      const matchSearch =
        !searchTerm ||
        item.transactionId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.partyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.crop.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.partyMobile.includes(searchTerm);

      return matchTab && matchStatus && matchSearch;
    });
  }, [confirmations, activeTab, statusFilter, searchTerm]);

  const totalItems = filteredList.length;
  const paginatedList = filteredList.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleVerify = (confirmationId) => {
    confirmTransaction(confirmationId);
    setToastMessage('Transaction authorized! Stock & ledger records updated.');
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleReject = (confirmationId, reason) => {
    rejectTransaction(confirmationId, reason);
    setToastMessage('Transaction rejected and archived.');
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className="space-y-6">
      <MiddlemanPageHeader
        title="OTP Confirmation Center"
        subtitle="Authorize incoming farmer purchases and outgoing vendor/customer sales via simulated OTPs."
      />

      {/* Success Toast */}
      {toastMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-[#15803D] text-xs font-bold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Tabs & Status Selector */}
      <ConfirmationTabs
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          setCurrentPage(1);
        }}
        statusFilter={statusFilter}
        onStatusChange={(status) => {
          setStatusFilter(status);
          setCurrentPage(1);
        }}
        counts={tabCounts}
      />

      {/* Search Input */}
      <div className="flex items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-[#E2E8F0]">
        <SearchInput
          value={searchTerm}
          onChange={(val) => {
            setSearchTerm(val);
            setCurrentPage(1);
          }}
          placeholder="Search by Txn ID, Party Name, Mobile, Crop..."
          className="w-full sm:max-w-sm"
        />
      </div>

      {/* Confirmation Table */}
      <SectionCard bodyClassName="p-0">
        <ConfirmationTable
          confirmations={paginatedList}
          onViewDetails={(item) => setViewingConfirmation(item)}
          onQuickVerify={(item) => handleVerify(item.confirmationId)}
          onQuickReject={(item) => handleReject(item.confirmationId, 'Declined from quick action')}
        />

        <Pagination
          currentPage={currentPage}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
        />
      </SectionCard>

      {/* Confirmation Details Modal */}
      {viewingConfirmation && (
        <ConfirmationDetails
          item={viewingConfirmation}
          onClose={() => setViewingConfirmation(null)}
          onConfirm={handleVerify}
          onReject={handleReject}
        />
      )}
    </div>
  );
};

export default OTPConfirmationsPage;

import React, { useState, useMemo } from 'react';
import { X } from 'lucide-react';
import { useMiddleman } from '../../../context/middleman';
import { MiddlemanPageHeader } from '../components/layout/MiddlemanPageHeader';
import { LedgerSummary } from '../components/ledger/LedgerSummary';
import { LedgerTable } from '../components/ledger/LedgerTable';
import { SearchInput } from '../components/common/SearchInput';
import { FilterDropdown } from '../components/common/FilterDropdown';
import { Pagination } from '../components/common/Pagination';
import { SectionCard } from '../components/common/SectionCard';
import { computeLedgerRunningBalances } from '../../../utils/middleman/ledgerHelpers';
import { formatINR } from '../../../utils/middleman/formatters';

export const LedgerPage = () => {
  const { ledger, settleLedgerEntry, dashboardMetrics } = useMiddleman();

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Settle Modal State
  const [settlingEntry, setSettlingEntry] = useState(null);
  const [settleAmount, setSettleAmount] = useState('');

  // Recompute running balances dynamically
  const balancedLedger = useMemo(() => {
    return computeLedgerRunningBalances(ledger);
  }, [ledger]);

  const filteredEntries = useMemo(() => {
    return balancedLedger.filter((item) => {
      const matchSearch =
        !searchTerm ||
        item.transactionId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.partyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase());

      const matchCategory = categoryFilter === 'ALL' || item.partyCategory === categoryFilter;
      const matchStatus = statusFilter === 'ALL' || item.status === statusFilter;

      return matchSearch && matchCategory && matchStatus;
    });
  }, [balancedLedger, searchTerm, categoryFilter, statusFilter]);

  const totalItems = filteredEntries.length;
  const paginatedEntries = filteredEntries.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleOpenSettle = (entry) => {
    setSettlingEntry(entry);
    setSettleAmount(String(entry.outstandingAmount || entry.debit || entry.credit));
  };

  const handleConfirmSettle = () => {
    if (!settlingEntry) return;
    const amount = Number(settleAmount) || 0;
    if (amount <= 0) return;

    settleLedgerEntry(settlingEntry.ledgerId, amount);
    setSettlingEntry(null);
  };

  return (
    <div className="space-y-6">
      <MiddlemanPageHeader
        title="My Financial Ledger"
        subtitle="Complete double-entry accounting records: Farmer payables, buyer receivables, and cash settlements."
      />

      {/* 17.2 Ledger Summary Cards */}
      <LedgerSummary metrics={dashboardMetrics} />

      {/* 17.5 Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-[#E2E8F0]">
        <SearchInput
          value={searchTerm}
          onChange={(val) => {
            setSearchTerm(val);
            setCurrentPage(1);
          }}
          placeholder="Search by Txn ID, Party, Description..."
          className="w-full sm:max-w-xs"
        />

        <div className="flex flex-wrap items-center gap-2.5">
          <FilterDropdown
            label="Party Category"
            value={categoryFilter}
            onChange={(val) => {
              setCategoryFilter(val);
              setCurrentPage(1);
            }}
            options={['Farmer', 'Vendor', 'Customer']}
          />

          <FilterDropdown
            label="Payment Status"
            value={statusFilter}
            onChange={(val) => {
              setStatusFilter(val);
              setCurrentPage(1);
            }}
            options={['Paid', 'Pending', 'Partially Paid', 'Overdue']}
          />
        </div>
      </div>

      {/* 17.3 Ledger Table */}
      <SectionCard bodyClassName="p-0">
        <LedgerTable
          entries={paginatedEntries}
          onSettle={handleOpenSettle}
        />

        <Pagination
          currentPage={currentPage}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
        />
      </SectionCard>

      {/* Settle Payment Modal */}
      {settlingEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-[#E2E8F0] p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <div>
                <h3 className="text-base font-bold text-[#1F2937]">Record Settlement</h3>
                <p className="text-xs text-[#64748B]">Txn: {settlingEntry.transactionId}</p>
              </div>

              <button
                type="button"
                onClick={() => setSettlingEntry(null)}
                className="text-[#94A3B8] hover:text-[#1F2937] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-[#64748B]">Party:</span>
                <span className="font-bold text-[#1F2937]">{settlingEntry.partyName} ({settlingEntry.partyCategory})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748B]">Total Amount:</span>
                <span className="font-semibold text-[#1F2937]">
                  {formatINR(settlingEntry.debit > 0 ? settlingEntry.debit : settlingEntry.credit)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748B]">Current Outstanding:</span>
                <span className="font-bold text-[#DC2626]">
                  {formatINR(settlingEntry.outstandingAmount || 0)}
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#1F2937]">Settlement Amount (₹)</label>
              <input
                type="number"
                min="1"
                max={settlingEntry.outstandingAmount || undefined}
                value={settleAmount}
                onChange={(e) => setSettleAmount(e.target.value)}
                placeholder="Enter amount to settle"
                className="w-full px-3 py-2 text-sm font-bold rounded-xl border border-[#E2E8F0] focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15 outline-none"
              />
              <span className="text-[11px] text-[#64748B] block">
                Supports partial payment or full settlement.
              </span>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#E2E8F0]">
              <button
                type="button"
                onClick={() => setSettlingEntry(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold border border-[#E2E8F0] hover:bg-slate-50 text-[#1F2937] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSettle}
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-[#0F766E] hover:bg-[#115E59] text-white shadow-xs cursor-pointer"
              >
                Confirm Settlement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LedgerPage;

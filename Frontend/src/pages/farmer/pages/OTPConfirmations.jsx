import { useState, useMemo } from 'react';
import {
  ShieldCheck,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  Eye,
  KeyRound,
} from 'lucide-react';
import { useFarmer } from '../context/FarmerContext';
import DataTable from '../components/DataTable';
import { formatCurrency, buyerCategoryStyles } from '../utils/farmerHelpers';

export default function OTPConfirmations() {
  const {
    otpRequests,
    setActiveOtpRequest,
    setSelectedTransaction,
    sales,
    searchQuery: globalSearchQuery,
  } = useFarmer();

  const [activeTab, setActiveTab] = useState('Pending'); // 'Pending' | 'Confirmed' | 'Rejected' | 'Expired' | 'All'
  const [internalSearch, setInternalSearch] = useState('');
  const [buyerCategoryFilter, setBuyerCategoryFilter] = useState('All');

  const effectiveSearch = (globalSearchQuery || internalSearch).trim().toLowerCase();

  // Tab counts
  const tabCounts = useMemo(() => {
    return {
      Pending: otpRequests.filter((o) => o.otpStatus === 'Pending' && o.direction !== 'farmer_initiated').length,
      Confirmed: otpRequests.filter((o) => o.otpStatus === 'Confirmed' && o.direction !== 'farmer_initiated').length,
      Rejected: otpRequests.filter((o) => o.otpStatus === 'Rejected' && o.direction !== 'farmer_initiated').length,
      Expired: otpRequests.filter((o) => o.otpStatus === 'Expired' && o.direction !== 'farmer_initiated').length,
      All: otpRequests.filter((o) => o.direction !== 'farmer_initiated').length,
    };
  }, [otpRequests]);

  const filteredRequests = useMemo(() => {
    return otpRequests.filter((item) => {
      if (item.direction === 'farmer_initiated') return false;

      const matchTab = activeTab === 'All' ? true : item.otpStatus === activeTab;
      const matchCategory = buyerCategoryFilter === 'All' ? true : item.buyerCategory === buyerCategoryFilter;

      const matchSearch =
        !effectiveSearch ||
        item.id.toLowerCase().includes(effectiveSearch) ||
        item.transactionId.toLowerCase().includes(effectiveSearch) ||
        item.buyerName.toLowerCase().includes(effectiveSearch) ||
        item.crop.toLowerCase().includes(effectiveSearch);

      return matchTab && matchCategory && matchSearch;
    });
  }, [otpRequests, activeTab, buyerCategoryFilter, effectiveSearch]);

  const columns = [
    {
      key: 'id',
      label: 'OTP ID',
      render: (val) => (
        <span className="font-mono font-bold text-[#0F766E] text-xs md:text-sm">
          {val}
        </span>
      ),
    },
    {
      key: 'transactionId',
      label: 'Linked Transaction',
      render: (val) => (
        <span
          className="font-mono font-semibold text-slate-800 hover:text-[#0F766E] hover:underline cursor-pointer text-xs md:text-sm"
          onClick={() => {
            const match = sales.find((s) => s.id === val);
            if (match) setSelectedTransaction(match);
          }}
        >
          {val}
        </span>
      ),
    },
    {
      key: 'buyerName',
      label: 'Buyer Information',
      render: (val, row) => (
        <div className="space-y-0.5">
          <div className="font-bold text-slate-900 text-sm">{val}</div>
          <div className="text-xs text-slate-500 font-mono">{row.buyerMobile}</div>
        </div>
      ),
    },
    {
      key: 'buyerCategory',
      label: 'Channel',
      render: (val) => {
        const style = buyerCategoryStyles[val] || { bg: '#F1F5F9', color: '#475569' };
        return (
          <span
            className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold"
            style={{ backgroundColor: style.bg, color: style.color }}
          >
            {val}
          </span>
        );
      },
    },
    {
      key: 'crop',
      label: 'Crop & Quantity',
      render: (val, row) => (
        <div className="space-y-0.5">
          <span className="font-bold text-slate-900 text-sm">{val}</span>
          <div className="text-xs text-slate-500 font-medium">
            {row.quantity} {row.unit}
          </div>
        </div>
      ),
    },
    {
      key: 'rate',
      label: 'Agreed Rate',
      render: (val, row) => (
        <span className="text-xs md:text-sm text-slate-700 font-medium">
          {formatCurrency(val)} / {row.unit}
        </span>
      ),
    },
    {
      key: 'totalAmount',
      label: 'Total Value',
      render: (val) => (
        <span className="font-extrabold text-[#0F766E] text-sm md:text-base">
          {formatCurrency(val)}
        </span>
      ),
    },
    {
      key: 'requestDate',
      label: 'Request Date',
      render: (val) => <span className="text-xs text-slate-500">{val}</span>,
    },
    {
      key: 'otpStatus',
      label: 'Verification Status',
      badge: 'otpStatus',
    },
    {
      key: 'action',
      label: 'Action',
      render: (_, row) => (
        <div className="flex items-center gap-1.5">
          {row.otpStatus === 'Pending' ? (
            <button
              type="button"
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg bg-[#0F766E] hover:bg-[#115E59] text-white shadow-xs transition-colors cursor-pointer"
              onClick={() => setActiveOtpRequest(row)}
            >
              <KeyRound className="w-3.5 h-3.5" />
              Enter OTP
            </button>
          ) : (
            <button
              type="button"
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              onClick={() => {
                const match = sales.find((s) => s.id === row.transactionId);
                if (match) setSelectedTransaction(match);
              }}
            >
              <Eye className="w-3.5 h-3.5 text-slate-400" />
              Details
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#CCFBF1] text-[#0F766E] border border-[#0F766E]/20">
            <ShieldCheck className="w-3.5 h-3.5 text-[#0F766E]" />
            Kisan Trade Security Center
          </div>
          <h1 className="text-xl md:text-2xl font-extrabold text-slate-900">
            OTP Confirmations &amp; Verifications
          </h1>
          <p className="text-xs md:text-sm text-slate-500 max-w-2xl">
            Cryptographic 6-digit verification protecting stock deduction and authorizing buyer dispatch for agricultural produce sales.
          </p>
        </div>
      </div>

      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => setActiveTab('All')}
          className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-[#CCFBF1] text-[#0F766E] flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-50 text-slate-600 border border-slate-200">
              Total Log
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-900">{tabCounts.All}</div>
            <div className="text-xs font-semibold text-slate-500">Total OTP Requests</div>
            <div className="text-[11px] text-slate-400 mt-0.5">All verification cycles</div>
          </div>
        </div>

        <div
          onClick={() => setActiveTab('Pending')}
          className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center font-bold">
              <Clock className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
              {tabCounts.Pending > 0 ? 'Action Required' : 'Cleared'}
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-900">{tabCounts.Pending}</div>
            <div className="text-xs font-semibold text-slate-500">Pending Confirmations</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Awaiting buyer verification</div>
          </div>
        </div>

        <div
          onClick={() => setActiveTab('Confirmed')}
          className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              Verified
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-900">{tabCounts.Confirmed}</div>
            <div className="text-xs font-semibold text-slate-500">Confirmed &amp; Settled</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Dispatched to buyer</div>
          </div>
        </div>

        <div
          onClick={() => setActiveTab('Expired')}
          className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 border border-slate-200 flex items-center justify-center font-bold">
              <XCircle className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-50 text-slate-600 border border-slate-200">
              Expired
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-900">{tabCounts.Expired + tabCounts.Rejected}</div>
            <div className="text-xs font-semibold text-slate-500">Expired / Rejected</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Stock automatically retained</div>
          </div>
        </div>
      </div>

      {/* Tabs, Search & Filters Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Status Tab Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {['Pending', 'Confirmed', 'Rejected', 'Expired', 'All'].map((tab) => {
            const isActive = activeTab === tab;
            const count = tabCounts[tab];
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-[#0F766E] text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span>{tab}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Channel Filter & Search */}
        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={buyerCategoryFilter}
            onChange={(e) => setBuyerCategoryFilter(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20"
          >
            <option value="All">All Channels</option>
            <option value="Middleman">Middlemen</option>
            <option value="Vendor">Vendors</option>
            <option value="Customer">Customers</option>
          </select>

          <div className="relative w-full sm:w-60">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search OTP or txn..."
              value={internalSearch}
              onChange={(e) => setInternalSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]"
            />
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <DataTable
          columns={columns}
          rows={filteredRequests}
          emptyTitle={`No ${activeTab} OTP Requests`}
          emptyMessage={`There are currently no transactions matching your ${activeTab.toLowerCase()} status or search filter.`}
        />
      </div>
    </div>
  );
}

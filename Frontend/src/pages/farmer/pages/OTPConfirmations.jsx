import { useState, useMemo } from 'react';
import {
  ShieldCheck,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  Eye,
  KeyRound,
  Download,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import { useFarmer } from '../context/FarmerContext';
import FarmerPageHeader from '../components/FarmerPageHeader';
import FarmerStatCard from '../components/FarmerStatCard';
import { formatCurrency, buyerCategoryStyles } from '../utils/farmerHelpers';
import { exportToCSV } from '../../../utils/exportUtils';

const TABS = [
  { id: 'Pending', label: 'Pending Authorizations' },
  { id: 'Confirmed', label: 'Confirmed Transactions' },
  { id: 'Rejected', label: 'Rejected' },
  { id: 'Expired', label: 'Expired' },
  { id: 'All', label: 'All Confirmations' },
];

export default function OTPConfirmations() {
  const {
    otpRequests,
    otpSummary,
    otpChannels,
    isOtpLoading,
    otpError,
    refreshOtpRequests,
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
    const localPending = otpRequests.filter((o) => o.otpStatus === 'Pending' && o.direction !== 'farmer_initiated').length;
    const localConfirmed = otpRequests.filter((o) => o.otpStatus === 'Confirmed' && o.direction !== 'farmer_initiated').length;
    const localRejected = otpRequests.filter((o) => o.otpStatus === 'Rejected' && o.direction !== 'farmer_initiated').length;
    const localExpired = otpRequests.filter((o) => o.otpStatus === 'Expired' && o.direction !== 'farmer_initiated').length;

    const pending = otpSummary?.pendingCount ?? otpSummary?.pending ?? localPending;
    const confirmed = otpSummary?.confirmedCount ?? otpSummary?.confirmed ?? localConfirmed;
    const rejected = otpSummary?.rejectedCount ?? otpSummary?.rejected ?? localRejected;
    const expired = otpSummary?.expiredCount ?? otpSummary?.expired ?? localExpired;

    return {
      Pending: Number(pending) || 0,
      Confirmed: Number(confirmed) || 0,
      Rejected: Number(rejected) || 0,
      Expired: Number(expired) || 0,
      All: (Number(pending) || 0) + (Number(confirmed) || 0) + (Number(rejected) || 0) + (Number(expired) || 0),
    };
  }, [otpRequests, otpSummary]);

  // Total secured value
  const totalSecuredValue = useMemo(() => {
    if (otpSummary?.totalSecuredValue != null) return Number(otpSummary.totalSecuredValue) || 0;
    if (otpSummary?.totalAmount != null) return Number(otpSummary.totalAmount) || 0;
    return otpRequests
      .filter((o) => o.direction !== 'farmer_initiated')
      .reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
  }, [otpRequests, otpSummary]);

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

  const handleExportCSV = () => {
    const rows = filteredRequests.map((r) => ({
      otpId: r.id,
      transactionId: r.transactionId,
      buyerName: r.buyerName,
      buyerCategory: r.buyerCategory,
      crop: r.crop,
      quantity: `${r.quantity} ${r.unit}`,
      totalAmount: r.totalAmount,
      status: r.otpStatus,
      requestDate: r.requestDate,
    }));

    exportToCSV(
      rows,
      [
        { key: 'otpId', header: 'OTP ID' },
        { key: 'transactionId', header: 'Linked Transaction' },
        { key: 'buyerName', header: 'Buyer Name' },
        { key: 'buyerCategory', header: 'Channel' },
        { key: 'crop', header: 'Crop' },
        { key: 'quantity', header: 'Quantity' },
        { key: 'totalAmount', header: 'Total Amount (INR)' },
        { key: 'status', header: 'Status' },
        { key: 'requestDate', header: 'Request Date' },
      ],
      `farmer_otp_confirmations_${activeTab.toLowerCase()}.csv`
    );
    toast.success('OTP Confirmations log exported to CSV.');
  };

  return (
    <div className="space-y-6">
      {/* Page Header (Matches VendorPageHeader & CustomerPageHeader) */}
      <FarmerPageHeader
        title="OTP Confirmations & Transaction Security"
        subtitle="Multi-party OTP authorization center for crop sales, dispatch clearances, and secure mandi settlement."
        icon={ShieldCheck}
        badge="Kisan Dispatch Security"
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => refreshOtpRequests?.()}
              disabled={isOtpLoading}
              className="inline-flex items-center gap-1.5 px-3 h-9 rounded-xl text-xs font-semibold bg-white border border-[#E2E8F0] text-[#0F172A] hover:bg-[#F8FAFC] hover:text-[#0F766E] transition-all duration-200 cursor-pointer shadow-xs disabled:opacity-60"
              title="Sync OTP Confirmations from backend"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isOtpLoading ? 'animate-spin text-[#0F766E]' : 'text-[#64748B]'}`} />
              <span>{isOtpLoading ? 'Syncing...' : 'Sync'}</span>
            </button>
            <button
              type="button"
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-4 h-9 rounded-xl text-xs font-semibold bg-[#0F766E] text-white hover:bg-[#115E59] transition-all duration-200 cursor-pointer shadow-xs"
            >
              <Download className="w-3.5 h-3.5 stroke-[2] shrink-0" />
              <span>Export Audit Log</span>
            </button>
          </div>
        }
      />

      {/* Backend error status banner if any */}
      {otpError && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 flex items-center justify-between gap-2 shadow-xs">
          <span>Backend sync: {otpError}. Showing saved OTP records.</span>
          <button
            type="button"
            onClick={() => refreshOtpRequests?.()}
            className="underline font-bold text-amber-900 cursor-pointer hover:opacity-80"
          >
            Retry
          </button>
        </div>
      )}

      {/* 4 Standard Summary KPI Cards (Using FarmerStatCard) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <FarmerStatCard
          title="Pending Authorizations"
          value={`${tabCounts.Pending} Orders`}
          subtitle="Awaiting your 6-digit OTP"
          icon={Clock}
          trend={tabCounts.Pending > 0 ? { value: 'Action req.', direction: 'down' } : null}
          onClick={() => setActiveTab('Pending')}
        />
        <FarmerStatCard
          title="Confirmed Transactions"
          value={`${tabCounts.Confirmed} Dispatches`}
          subtitle="Verified & stock released"
          icon={CheckCircle2}
          trend={{ value: 'Verified', direction: 'up' }}
          onClick={() => setActiveTab('Confirmed')}
        />
        <FarmerStatCard
          title="Rejected / Expired"
          value={`${tabCounts.Rejected + tabCounts.Expired} Total`}
          subtitle="Declined or timed out"
          icon={XCircle}
          onClick={() => setActiveTab('Rejected')}
        />
        <FarmerStatCard
          title="Total Protected Value"
          value={formatCurrency(totalSecuredValue)}
          subtitle="Secured by OTP handshake"
          icon={ShieldCheck}
          onClick={() => setActiveTab('All')}
        />
      </div>

      {/* Filter Tabs and Search Bar */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Status Tab Pills with Badge Counts */}
        <div className="flex flex-wrap items-center gap-2">
          {TABS.map((tab) => {
            const count = tabCounts[tab.id];
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#0F766E] text-white shadow-xs'
                    : 'bg-[#F8FAFC] border border-[#E2E8F0] text-[#64748B] hover:text-[#0F172A] hover:bg-slate-100'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Channel Filter & Search Input */}
        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={buyerCategoryFilter}
            onChange={(e) => setBuyerCategoryFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/30 focus:border-[#0F766E] focus:bg-white transition-all cursor-pointer"
          >
            <option value="All">All Buyer Channels</option>
            {Array.isArray(otpChannels) && otpChannels.length > 0 ? (
              otpChannels.map((ch, idx) => {
                const val = typeof ch === 'string' ? ch : ch.id || ch.value || ch.name;
                const label = typeof ch === 'string' ? ch : ch.label || ch.name || val;
                return (
                  <option key={val || idx} value={val}>
                    {label}
                  </option>
                );
              })
            ) : (
              <>
                <option value="Vendor">Vendors Only</option>
                <option value="Middleman">Middlemen Only</option>
                <option value="Customer">Retail Customers</option>
              </>
            )}
          </select>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-[#64748B] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={internalSearch}
              onChange={(e) => setInternalSearch(e.target.value)}
              placeholder="Search OTP ID, buyer, crop..."
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[#0F172A] placeholder:text-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/30 focus:border-[#0F766E] focus:bg-white transition-all"
            />
          </div>
        </div>
      </div>

      {/* OTP Confirmations Data Table */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] uppercase tracking-wider font-bold">
                <th className="py-3 px-4">OTP ID</th>
                <th className="py-3 px-4">Linked Txn</th>
                <th className="py-3 px-4">Buyer Information</th>
                <th className="py-3 px-4">Channel</th>
                <th className="py-3 px-4">Crop &amp; Quantity</th>
                <th className="py-3 px-4">Agreed Rate</th>
                <th className="py-3 px-4">Total Value</th>
                <th className="py-3 px-4">Request Date</th>
                <th className="py-3 px-4">Verification Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {isOtpLoading && filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan="10" className="py-12 text-center text-xs text-[#64748B]">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-6 h-6 border-2 border-[#0F766E] border-t-transparent rounded-full animate-spin" />
                      <span>Loading OTP authorizations from backend...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan="10" className="py-12 text-center text-xs text-[#64748B]">
                    No OTP verification records match your selected tab or search query.
                  </td>
                </tr>
              ) : (
                filteredRequests.map((row) => {
                  const channelStyle = buyerCategoryStyles[row.buyerCategory] || {
                    bg: '#F1F5F9',
                    color: '#475569',
                  };

                  return (
                    <tr
                      key={row.id}
                      className="hover:bg-[#CCFBF1]/20 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-[#0F766E]">
                        {row.id}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-semibold text-[#0F172A]">
                        <button
                          type="button"
                          onClick={() => {
                            const match = sales.find((s) => s.id === row.transactionId);
                            if (match) setSelectedTransaction(match);
                          }}
                          className="hover:text-[#0F766E] hover:underline cursor-pointer"
                        >
                          {row.transactionId}
                        </button>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-[#0F172A]">{row.buyerName}</div>
                        <div className="text-[11px] text-[#64748B] font-mono">{row.buyerMobile}</div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold"
                          style={{ backgroundColor: channelStyle.bg, color: channelStyle.color }}
                        >
                          {row.buyerCategory}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-[#0F172A]">{row.crop}</div>
                        <div className="text-[11px] text-[#64748B] font-medium">
                          {row.quantity} {row.unit}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-[#64748B] whitespace-nowrap">
                        {formatCurrency(row.rate)}/{row.unit}
                      </td>
                      <td className="py-3.5 px-4 font-extrabold text-[#0F766E] text-sm whitespace-nowrap">
                        {formatCurrency(row.totalAmount)}
                      </td>
                      <td className="py-3.5 px-4 text-[#64748B] whitespace-nowrap">
                        {row.requestDate}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            row.otpStatus === 'Confirmed'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : row.otpStatus === 'Pending'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse'
                              : row.otpStatus === 'Expired'
                              ? 'bg-slate-100 text-slate-600'
                              : 'bg-red-50 text-red-700 border border-red-200'
                          }`}
                        >
                          {row.otpStatus}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        {row.otpStatus === 'Pending' ? (
                          <button
                            type="button"
                            onClick={() => setActiveOtpRequest(row)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-[#0F766E] hover:bg-[#115E59] text-white shadow-xs transition-colors cursor-pointer"
                          >
                            <KeyRound className="w-3.5 h-3.5 stroke-[2]" />
                            <span>Enter OTP</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              const match = sales.find((s) => s.id === row.transactionId);
                              if (match) setSelectedTransaction(match);
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-xl border border-[#E2E8F0] bg-white text-[#0F172A] hover:bg-[#F8FAFC] hover:text-[#0F766E] transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5 text-[#64748B]" />
                            <span>Details</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

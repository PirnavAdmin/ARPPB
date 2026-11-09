import React from 'react';
import { CreditCard, CheckCircle2 } from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge';
import { formatINR, formatDate } from '../../../../utils/middleman/formatters';

export const LedgerTable = ({
  entries = [],
  onSettle,
}) => {
  return (
    <div className="w-full overflow-x-auto rounded-xl border border-[#E2E8F0] bg-white">
      <table className="w-full text-left border-collapse min-w-[950px]">
        <thead>
          <tr className="bg-slate-50/80 border-b border-[#E2E8F0]">
            <th className="py-3 px-3 text-[11px] font-semibold text-[#64748B] uppercase">Date</th>
            <th className="py-3 px-3 text-[11px] font-semibold text-[#64748B] uppercase">Txn ID</th>
            <th className="py-3 px-3 text-[11px] font-semibold text-[#64748B] uppercase">Description</th>
            <th className="py-3 px-3 text-[11px] font-semibold text-[#64748B] uppercase">Party Name</th>
            <th className="py-3 px-3 text-[11px] font-semibold text-[#64748B] uppercase">Category</th>
            <th className="py-3 px-3 text-[11px] font-semibold text-[#64748B] uppercase text-right">Debit (₹)</th>
            <th className="py-3 px-3 text-[11px] font-semibold text-[#64748B] uppercase text-right">Credit (₹)</th>
            <th className="py-3 px-3 text-[11px] font-semibold text-[#64748B] uppercase text-right">Running</th>
            <th className="py-3 px-3 text-[11px] font-semibold text-[#64748B] uppercase">Due Date</th>
            <th className="py-3 px-3 text-[11px] font-semibold text-[#64748B] uppercase">Status</th>
            <th className="py-3 px-3 text-[11px] font-semibold text-[#64748B] uppercase text-center">Settlement</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#E2E8F0] text-xs text-[#1F2937]">
          {entries.map((entry) => {
            const hasOutstanding = (entry.outstandingAmount || 0) > 0;

            return (
              <tr key={entry.ledgerId} className="hover:bg-slate-50/60 transition-colors">
                <td className="py-3 px-3 text-[#64748B] whitespace-nowrap">{formatDate(entry.date)}</td>
                <td className="py-3 px-3 font-mono font-bold text-[#0F766E]">{entry.transactionId}</td>
                <td className="py-3 px-3 max-w-[200px] truncate" title={entry.description}>
                  {entry.description}
                </td>
                <td className="py-3 px-3 font-bold text-[#1F2937] max-w-[140px] truncate">
                  {entry.partyName}
                </td>
                <td className="py-3 px-3">
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${
                      entry.partyCategory === 'Farmer'
                        ? 'bg-amber-50 text-[#D97706] border-amber-200'
                        : entry.partyCategory === 'Vendor'
                        ? 'bg-teal-50 text-[#0F766E] border-teal-200'
                        : 'bg-blue-50 text-[#2563EB] border-blue-200'
                    }`}
                  >
                    {entry.partyCategory}
                  </span>
                </td>
                <td className="py-3 px-3 text-right font-medium text-[#15803D]">
                  {entry.debit > 0 ? formatINR(entry.debit) : '—'}
                </td>
                <td className="py-3 px-3 text-right font-medium text-[#DC2626]">
                  {entry.credit > 0 ? formatINR(entry.credit) : '—'}
                </td>
                <td className="py-3 px-3 text-right font-bold text-[#1F2937]">
                  {formatINR(entry.runningBalance)}
                </td>
                <td className="py-3 px-3 text-[#64748B] whitespace-nowrap">
                  {formatDate(entry.expectedPaymentDate)}
                </td>
                <td className="py-3 px-3">
                  <StatusBadge status={entry.status} size="sm" />
                </td>
                <td className="py-3 px-3 text-center whitespace-nowrap">
                  {hasOutstanding ? (
                    <button
                      type="button"
                      onClick={() => onSettle(entry)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-[#0F766E] text-white hover:bg-[#115E59] shadow-2xs cursor-pointer"
                    >
                      <CreditCard className="w-3 h-3 text-[#CCFBF1]" />
                      <span>Settle</span>
                    </button>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#15803D]">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Settled</span>
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default LedgerTable;


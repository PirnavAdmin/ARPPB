import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, ShieldCheck } from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge';
import { formatINR, formatDate, formatQuantity } from '../../../../utils/middleman/formatters';
import { getPaymentStatusBadgeClasses, calculatePaymentStatus } from '../../../../utils/middleman/paymentStatusHelpers';

export const RecentTransactionsTable = ({
  transactions = [],
  className = '',
}) => {
  const navigate = useNavigate();
  const [selectedTxn, setSelectedTxn] = useState(null);

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="w-full overflow-x-auto rounded-xl border border-[#E2E8F0] bg-white">
        <table className="w-full text-left border-collapse min-w-[950px]">
          <thead>
            <tr className="bg-slate-50/80 border-b border-[#E2E8F0]">
              <th className="py-3 px-3.5 text-[11px] font-semibold text-[#64748B] uppercase">Txn ID</th>
              <th className="py-3 px-3.5 text-[11px] font-semibold text-[#64748B] uppercase">Date</th>
              <th className="py-3 px-3.5 text-[11px] font-semibold text-[#64748B] uppercase">Type</th>
              <th className="py-3 px-3.5 text-[11px] font-semibold text-[#64748B] uppercase">Party</th>
              <th className="py-3 px-3.5 text-[11px] font-semibold text-[#64748B] uppercase">Crop</th>
              <th className="py-3 px-3.5 text-[11px] font-semibold text-[#64748B] uppercase">Quantity</th>
              <th className="py-3 px-3.5 text-[11px] font-semibold text-[#64748B] uppercase text-right">Total Amount</th>
              <th className="py-3 px-3.5 text-[11px] font-semibold text-[#64748B] uppercase text-right">Paid / Received</th>
              <th className="py-3 px-3.5 text-[11px] font-semibold text-[#64748B] uppercase text-right">Due Balance</th>
              <th className="py-3 px-3.5 text-[11px] font-semibold text-[#64748B] uppercase">OTP Status</th>
              <th className="py-3 px-3.5 text-[11px] font-semibold text-[#64748B] uppercase text-center">Payment Status</th>
              <th className="py-3 px-3.5 text-[11px] font-semibold text-[#64748B] uppercase text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2E8F0] text-xs text-[#1F2937]">
            {transactions.slice(0, 6).map((txn) => {
              const partyName = txn.farmerName || txn.businessName || txn.customerName;
              const type = txn.purchaseId
                ? 'Farmer Purchase'
                : txn.vendorId
                ? 'Vendor Sale'
                : 'Customer Sale';
              const id = txn.purchaseId || txn.saleId || txn.txnId;
              const total = Number(txn.totalAmount || txn.finalAmount || txn.amount) || 0;
              const paid = Number(txn.paidAmount || 0);
              const due = txn.outstandingAmount !== undefined && txn.outstandingAmount !== null
                ? Number(txn.outstandingAmount)
                : Math.max(0, total - paid);
              const payStatus = txn.paymentStatus || calculatePaymentStatus(total, paid, due, txn.status);

              return (
                <tr key={id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-3.5 font-mono font-bold text-[#0F766E]">{id}</td>
                  <td className="py-3 px-3.5 text-[#64748B] whitespace-nowrap">
                    {formatDate(txn.purchaseDate || txn.salesDate || txn.transactionDate)}
                  </td>
                  <td className="py-3 px-3.5 font-medium">{type}</td>
                  <td className="py-3 px-3.5 font-semibold text-[#1F2937] max-w-[140px] truncate">
                    {partyName}
                  </td>
                  <td className="py-3 px-3.5">{txn.cropName || txn.crop}</td>
                  <td className="py-3 px-3.5 font-medium">
                    {formatQuantity(txn.quantity, txn.unit)}
                  </td>
                  <td className="py-3 px-3.5 font-bold text-right text-[#1F2937]">
                    {formatINR(total)}
                  </td>
                  <td className="py-3 px-3.5 font-bold text-right text-emerald-600">
                    {formatINR(paid)}
                  </td>
                  <td className="py-3 px-3.5 font-bold text-right text-amber-600">
                    {formatINR(due)}
                  </td>
                  <td className="py-3 px-3.5">
                    <StatusBadge status={txn.otpStatus} size="sm" />
                  </td>
                  <td className="py-3 px-3.5 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] ${getPaymentStatusBadgeClasses(payStatus)}`}>
                      {payStatus}
                    </span>
                  </td>
                  <td className="py-3 px-3.5 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setSelectedTxn({ ...txn, type, id, total, paid, due, payStatus, partyName })}
                        className="p-1 rounded-lg hover:bg-slate-100 text-[#0F766E] cursor-pointer"
                        title="View Details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      {txn.otpStatus === 'Pending' && (
                        <button
                          type="button"
                          onClick={() => navigate('/middleman/confirmations')}
                          className="p-1 rounded-lg hover:bg-teal-50 text-[#0F766E] cursor-pointer"
                          title="Verify in OTP Confirmations"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Transaction Details Modal */}
      {selectedTxn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-[#E2E8F0] p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <div>
                <h3 className="text-base font-bold text-[#1F2937]">
                  {selectedTxn.type} &bull; <span className="text-[#0F766E]">{selectedTxn.id}</span>
                </h3>
                <p className="text-xs text-[#64748B]">Date: {formatDate(selectedTxn.purchaseDate || selectedTxn.salesDate || selectedTxn.transactionDate)}</p>
              </div>
              <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold ${getPaymentStatusBadgeClasses(selectedTxn.payStatus)}`}>
                {selectedTxn.payStatus}
              </span>
            </div>

            {/* 3-Card Financial Overview */}
            <div className="grid grid-cols-3 gap-2.5">
              <div className="p-3 bg-teal-50/50 rounded-xl border border-teal-100">
                <span className="text-[11px] text-[#64748B] block">Total Amount</span>
                <span className="text-base font-black text-[#0F766E]">{formatINR(selectedTxn.total)}</span>
              </div>
              <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100">
                <span className="text-[11px] text-emerald-700 block">Paid / Received</span>
                <span className="text-base font-black text-emerald-700">{formatINR(selectedTxn.paid)}</span>
              </div>
              <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-100">
                <span className="text-[11px] text-amber-700 block">Due Balance</span>
                <span className="text-base font-black text-amber-700">{formatINR(selectedTxn.due)}</span>
              </div>
            </div>

            {/* Payment Installments History */}
            {Array.isArray(selectedTxn.paymentHistory) && selectedTxn.paymentHistory.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <span className="font-bold text-xs text-[#1F2937] block">
                  Payment Installments ({selectedTxn.paymentHistory.length}):
                </span>
                <div className="max-h-28 overflow-y-auto rounded-xl border border-[#E2E8F0] bg-slate-50/50">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-[#64748B] border-b border-[#E2E8F0] text-[11px]">
                      <tr>
                        <th className="px-2.5 py-1">Receipt ID</th>
                        <th className="px-2.5 py-1">Date</th>
                        <th className="px-2.5 py-1">Mode</th>
                        <th className="px-2.5 py-1 text-right">Amount</th>
                        <th className="px-2.5 py-1 text-right">Balance After</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E2E8F0]">
                      {selectedTxn.paymentHistory.map((h, idx) => (
                        <tr key={h.id || idx}>
                          <td className="px-2.5 py-1 font-mono text-[#0F766E] font-bold">{h.paymentCode || `PAY-${idx + 1}`}</td>
                          <td className="px-2.5 py-1 whitespace-nowrap">{String(h.paymentDate || h.createdAt || '').slice(0, 10)}</td>
                          <td className="px-2.5 py-1">{h.paymentMode || 'NEFT'}</td>
                          <td className="px-2.5 py-1 text-right font-bold text-emerald-600">{formatINR(h.paymentAmount || h.amount)}</td>
                          <td className="px-2.5 py-1 text-right font-medium text-slate-700">{formatINR(h.balanceAfter)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 bg-slate-50 rounded-xl">
                <span className="text-[#64748B] block">Party Name</span>
                <span className="font-bold text-[#1F2937]">{selectedTxn.partyName}</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl">
                <span className="text-[#64748B] block">Crop &amp; Variety</span>
                <span className="font-bold text-[#1F2937]">{selectedTxn.cropName || selectedTxn.crop} ({selectedTxn.variety || 'Standard'})</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl">
                <span className="text-[#64748B] block">Quantity</span>
                <span className="font-bold text-[#1F2937]">{formatQuantity(selectedTxn.quantity, selectedTxn.unit)}</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl">
                <span className="text-[#64748B] block">OTP Status</span>
                <StatusBadge status={selectedTxn.otpStatus} size="sm" />
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl col-span-2">
                <span className="text-[#64748B] block">Expected Payment Date</span>
                <span className="font-bold text-[#1F2937]">{formatDate(selectedTxn.expectedPaymentDate)}</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedTxn(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-[#1F2937] cursor-pointer"
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

export default RecentTransactionsTable;


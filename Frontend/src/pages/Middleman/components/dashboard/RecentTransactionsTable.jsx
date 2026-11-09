import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, ShieldCheck } from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge';
import { formatINR, formatDate, formatQuantity } from '../../../../utils/middleman/formatters';

export const RecentTransactionsTable = ({
  transactions = [],
  className = '',
}) => {
  const navigate = useNavigate();
  const [selectedTxn, setSelectedTxn] = useState(null);

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="w-full overflow-x-auto rounded-xl border border-[#E2E8F0] bg-white">
        <table className="w-full text-left border-collapse min-w-[780px]">
          <thead>
            <tr className="bg-slate-50/80 border-b border-[#E2E8F0]">
              <th className="py-3 px-3.5 text-[11px] font-semibold text-[#64748B] uppercase">Txn ID</th>
              <th className="py-3 px-3.5 text-[11px] font-semibold text-[#64748B] uppercase">Date</th>
              <th className="py-3 px-3.5 text-[11px] font-semibold text-[#64748B] uppercase">Type</th>
              <th className="py-3 px-3.5 text-[11px] font-semibold text-[#64748B] uppercase">Party</th>
              <th className="py-3 px-3.5 text-[11px] font-semibold text-[#64748B] uppercase">Crop</th>
              <th className="py-3 px-3.5 text-[11px] font-semibold text-[#64748B] uppercase">Quantity</th>
              <th className="py-3 px-3.5 text-[11px] font-semibold text-[#64748B] uppercase text-right">Total Amount</th>
              <th className="py-3 px-3.5 text-[11px] font-semibold text-[#64748B] uppercase">OTP Status</th>
              <th className="py-3 px-3.5 text-[11px] font-semibold text-[#64748B] uppercase">Payment Due</th>
              <th className="py-3 px-3.5 text-[11px] font-semibold text-[#64748B] uppercase">Status</th>
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
              const id = txn.purchaseId || txn.saleId;
              const amount = txn.totalAmount || txn.finalAmount;

              return (
                <tr key={id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-3.5 font-mono font-bold text-[#0F766E]">{id}</td>
                  <td className="py-3 px-3.5 text-[#64748B] whitespace-nowrap">
                    {formatDate(txn.purchaseDate || txn.salesDate)}
                  </td>
                  <td className="py-3 px-3.5 font-medium">{type}</td>
                  <td className="py-3 px-3.5 font-semibold text-[#1F2937] max-w-[140px] truncate">
                    {partyName}
                  </td>
                  <td className="py-3 px-3.5">{txn.cropName}</td>
                  <td className="py-3 px-3.5 font-medium">
                    {formatQuantity(txn.quantity, txn.unit)}
                  </td>
                  <td className="py-3 px-3.5 font-bold text-right text-[#1F2937]">
                    {formatINR(amount)}
                  </td>
                  <td className="py-3 px-3.5">
                    <StatusBadge status={txn.otpStatus} size="sm" />
                  </td>
                  <td className="py-3 px-3.5 text-[#64748B] whitespace-nowrap">
                    {formatDate(txn.expectedPaymentDate)}
                  </td>
                  <td className="py-3 px-3.5">
                    <StatusBadge status={txn.status} size="sm" />
                  </td>
                  <td className="py-3 px-3.5 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setSelectedTxn({ ...txn, type, id, amount, partyName })}
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
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-[#E2E8F0] p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <div>
                <h3 className="text-base font-bold text-[#1F2937]">
                  {selectedTxn.type} &bull; <span className="text-[#0F766E]">{selectedTxn.id}</span>
                </h3>
                <p className="text-xs text-[#64748B]">Date: {formatDate(selectedTxn.purchaseDate || selectedTxn.salesDate)}</p>
              </div>
              <StatusBadge status={selectedTxn.otpStatus} />
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 bg-slate-50 rounded-xl">
                <span className="text-[#64748B] block">Party Name</span>
                <span className="font-bold text-[#1F2937]">{selectedTxn.partyName}</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl">
                <span className="text-[#64748B] block">Crop &amp; Variety</span>
                <span className="font-bold text-[#1F2937]">{selectedTxn.cropName} ({selectedTxn.variety || 'Standard'})</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl">
                <span className="text-[#64748B] block">Quantity</span>
                <span className="font-bold text-[#1F2937]">{formatQuantity(selectedTxn.quantity, selectedTxn.unit)}</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl">
                <span className="text-[#64748B] block">Total Amount</span>
                <span className="font-bold text-[#0F766E] text-sm">{formatINR(selectedTxn.amount)}</span>
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


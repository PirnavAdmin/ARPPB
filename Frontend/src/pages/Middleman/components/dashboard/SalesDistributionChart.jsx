import React from 'react';
import { Building2, Store } from 'lucide-react';
import { useMiddleman } from '../../../../context/middleman';
import { formatINR } from '../../../../utils/middleman/formatters';

export const SalesDistributionChart = ({ className = '' }) => {
  const { vendorSales, customerSales } = useMiddleman();

  const confirmedVendorSales = vendorSales.filter((s) => s.otpStatus === 'Confirmed');
  const confirmedCustomerSales = customerSales.filter((s) => s.otpStatus === 'Confirmed');

  const vendorTotal = confirmedVendorSales.reduce((acc, s) => acc + (Number(s.totalAmount) || 0), 0);
  const customerTotal = confirmedCustomerSales.reduce((acc, s) => acc + (Number(s.finalAmount) || 0), 0);
  const total = vendorTotal + customerTotal;

  const vendorPct = total > 0 ? Math.round((vendorTotal / total) * 100) : 0;
  const customerPct = total > 0 ? 100 - vendorPct : 0;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Proportion Bar */}
      <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
        <div
          className="h-full bg-[#0F766E] transition-all duration-500"
          style={{ width: `${vendorPct}%` }}
          title={`Vendor Sales: ${vendorPct}%`}
        />
        <div
          className="h-full bg-[#14B8A6] transition-all duration-500"
          style={{ width: `${customerPct}%` }}
          title={`Customer Sales: ${customerPct}%`}
        />
      </div>

      {/* Breakdown Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        {/* Vendor Sales */}
        <div className="p-3.5 rounded-xl border border-[#E2E8F0] bg-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-[#0F766E] flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-[#1F2937] block">Sales to Vendors</span>
              <span className="text-[11px] text-[#64748B]">
                {confirmedVendorSales.length} Transactions &bull; {vendorPct}%
              </span>
            </div>
          </div>
          <span className="text-sm font-extrabold text-[#0F766E]">{formatINR(vendorTotal)}</span>
        </div>

        {/* Customer Sales */}
        <div className="p-3.5 rounded-xl border border-[#E2E8F0] bg-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-50/60 text-[#14B8A6] flex items-center justify-center">
              <Store className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-[#1F2937] block">Direct Customer Sales</span>
              <span className="text-[11px] text-[#64748B]">
                {confirmedCustomerSales.length} Transactions &bull; {customerPct}%
              </span>
            </div>
          </div>
          <span className="text-sm font-extrabold text-[#14B8A6]">{formatINR(customerTotal)}</span>
        </div>
      </div>
    </div>
  );
};

export default SalesDistributionChart;

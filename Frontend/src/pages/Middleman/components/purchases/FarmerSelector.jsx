import React from 'react';
import { User, Phone, MapPin } from 'lucide-react';
import { FormField } from '../common/FormField';

export const FarmerSelector = ({
  farmers = [],
  selectedFarmerId = '',
  onSelectFarmer,
  error = null,
}) => {
  const selectedFarmer = farmers.find((f) => f.farmerId === selectedFarmerId);

  return (
    <div className="space-y-3">
      <FormField label="Select Registered Farmer" name="farmerId" required error={error}>
        <div className="relative">
          <select
            value={selectedFarmerId}
            onChange={(e) => onSelectFarmer(e.target.value)}
            className="w-full pl-3 pr-8 py-2.5 text-xs sm:text-sm rounded-xl border border-[#E2E8F0] focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15 outline-none bg-white font-medium cursor-pointer"
          >
            <option value="">-- Choose from registered farmers --</option>
            {farmers.map((f) => (
              <option key={f.farmerId} value={f.farmerId}>
                {f.name} ({f.village}, {f.district}) &bull; {f.mobile}
              </option>
            ))}
          </select>
        </div>
      </FormField>

      {/* Auto-populated Farmer Details Card */}
      {selectedFarmer && (
        <div className="p-3.5 bg-teal-50/40 rounded-xl border border-teal-100 flex flex-wrap items-center justify-between gap-3 text-xs animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#0F766E] text-white flex items-center justify-center font-bold text-xs">
              <User className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-[#1F2937] block">{selectedFarmer.name}</span>
              <span className="text-[#64748B] flex items-center gap-1">
                <Phone className="w-3 h-3 text-[#0F766E]" />
                <span>+91 {selectedFarmer.mobile}</span>
              </span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[#64748B] flex items-center justify-end gap-1">
              <MapPin className="w-3 h-3 text-[#0F766E]" />
              <span>{selectedFarmer.village}, {selectedFarmer.district}</span>
            </span>
            <span className="text-[10px] text-[#0F766E] font-medium block mt-0.5">
              Crops: {selectedFarmer.crops?.join(', ') || 'Various'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default FarmerSelector;

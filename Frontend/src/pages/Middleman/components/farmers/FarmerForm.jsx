import React, { useState } from 'react';
import { User, Phone, Mail, MapPin, Check } from 'lucide-react';
import { FormField } from '../common/FormField';
import { CROP_LIST } from '../../../../utils/middleman/transactionHelpers';
import { validateFarmerForm } from '../../../../utils/middleman/validation';

export const FarmerForm = ({
  initialData = null,
  onSave,
  onCancel,
  isEdit = false,
}) => {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    mobile: initialData?.mobile || '',
    email: initialData?.email || '',
    village: initialData?.village || '',
    mandal: initialData?.mandal || '',
    district: initialData?.district || '',
    state: initialData?.state || 'Andhra Pradesh',
    pinCode: initialData?.pinCode || '',
    completeAddress: initialData?.completeAddress || '',
    crops: initialData?.crops || [],
    notes: initialData?.notes || '',
    status: initialData?.status || 'Active',
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const handleCropToggle = (crop) => {
    setFormData((prev) => {
      const exists = prev.crops.includes(crop);
      const newCrops = exists ? prev.crops.filter((c) => c !== crop) : [...prev.crops, crop];
      return { ...prev, crops: newCrops };
    });
    if (errors.crops) setErrors((prev) => ({ ...prev, crops: null }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const { isValid, errors: validationErrors } = validateFarmerForm(formData);
    if (!isValid) {
      setErrors(validationErrors);
      return;
    }
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Farmer Name */}
        <FormField label="Farmer Name" name="name" required error={errors.name}>
          <div className="relative">
            <User className="w-4 h-4 text-[#64748B] absolute left-3 top-3 pointer-events-none" />
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. M. Chenna Reddy"
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-[#E2E8F0] focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15 outline-none"
            />
          </div>
        </FormField>

        {/* Mobile Number */}
        <FormField label="Mobile Number" name="mobile" required error={errors.mobile}>
          <div className="relative">
            <Phone className="w-4 h-4 text-[#64748B] absolute left-3 top-3 pointer-events-none" />
            <input
              type="tel"
              name="mobile"
              maxLength={10}
              value={formData.mobile}
              onChange={handleChange}
              placeholder="10-digit mobile number"
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-[#E2E8F0] focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15 outline-none"
            />
          </div>
        </FormField>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Email (Optional) */}
        <FormField label="Email Address" name="email" optional error={errors.email}>
          <div className="relative">
            <Mail className="w-4 h-4 text-[#64748B] absolute left-3 top-3 pointer-events-none" />
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="farmer@example.com"
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-[#E2E8F0] focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15 outline-none"
            />
          </div>
        </FormField>

        {/* Village */}
        <FormField label="Village" name="village" required error={errors.village}>
          <input
            type="text"
            name="village"
            value={formData.village}
            onChange={handleChange}
            placeholder="Village / Town name"
            className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-[#E2E8F0] focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15 outline-none"
          />
        </FormField>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Mandal */}
        <FormField label="Mandal" name="mandal">
          <input
            type="text"
            name="mandal"
            value={formData.mandal}
            onChange={handleChange}
            placeholder="Mandal / Tehsil"
            className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-[#E2E8F0] focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15 outline-none"
          />
        </FormField>

        {/* District */}
        <FormField label="District" name="district" required error={errors.district}>
          <input
            type="text"
            name="district"
            value={formData.district}
            onChange={handleChange}
            placeholder="e.g. Guntur"
            className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-[#E2E8F0] focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15 outline-none"
          />
        </FormField>

        {/* State */}
        <FormField label="State" name="state" required error={errors.state}>
          <select
            name="state"
            value={formData.state}
            onChange={handleChange}
            className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-[#E2E8F0] focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15 outline-none bg-white cursor-pointer"
          >
            <option value="Andhra Pradesh">Andhra Pradesh</option>
            <option value="Telangana">Telangana</option>
            <option value="Karnataka">Karnataka</option>
            <option value="Tamil Nadu">Tamil Nadu</option>
          </select>
        </FormField>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* PIN Code */}
        <FormField label="PIN Code" name="pinCode">
          <input
            type="text"
            name="pinCode"
            maxLength={6}
            value={formData.pinCode}
            onChange={handleChange}
            placeholder="522xxx"
            className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-[#E2E8F0] focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15 outline-none"
          />
        </FormField>

        {/* Complete Address */}
        <div className="sm:col-span-2">
          <FormField label="Complete Address" name="completeAddress">
            <div className="relative">
              <MapPin className="w-4 h-4 text-[#64748B] absolute left-3 top-3 pointer-events-none" />
              <input
                type="text"
                name="completeAddress"
                value={formData.completeAddress}
                onChange={handleChange}
                placeholder="Door No, Street, Landmarks"
                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-[#E2E8F0] focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15 outline-none"
              />
            </div>
          </FormField>
        </div>
      </div>

      {/* Available Crops Multi-Select */}
      <FormField label="Available Crops Cultivated" name="crops" required error={errors.crops}>
        <div className="flex flex-wrap gap-2 pt-1">
          {CROP_LIST.map((crop) => {
            const isSelected = formData.crops.includes(crop);
            return (
              <button
                type="button"
                key={crop}
                onClick={() => handleCropToggle(crop)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-[#0F766E] text-white shadow-xs'
                    : 'bg-slate-50 border border-[#E2E8F0] text-[#1F2937] hover:bg-slate-100'
                }`}
              >
                {isSelected && <Check className="w-3.5 h-3.5" />}
                <span>{crop}</span>
              </button>
            );
          })}
        </div>
      </FormField>

      {/* Notes */}
      <FormField label="Farmer Notes & Observations" name="notes">
        <textarea
          name="notes"
          rows={2}
          value={formData.notes}
          onChange={handleChange}
          placeholder="e.g. Cultivates premium Teja chilli, reliable irrigation..."
          className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-[#E2E8F0] focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15 outline-none"
        />
      </FormField>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#E2E8F0]">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-xl text-xs font-semibold border border-[#E2E8F0] hover:bg-slate-50 text-[#1F2937] cursor-pointer transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-5 py-2 rounded-xl text-xs font-semibold bg-[#0F766E] hover:bg-[#115E59] text-white shadow-xs cursor-pointer transition-colors"
        >
          {isEdit ? 'Update Farmer' : 'Save Farmer'}
        </button>
      </div>
    </form>
  );
};

export default FarmerForm;

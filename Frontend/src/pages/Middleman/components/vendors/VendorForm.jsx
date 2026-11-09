import React, { useState } from 'react';
import { Building2, User, Phone, Mail, FileText, MapPin } from 'lucide-react';
import { FormField } from '../common/FormField';
import { VENDOR_BUSINESS_TYPES } from '../../../../data/mock/middleman/vendorData';
import { validateVendorForm } from '../../../../utils/middleman/validation';

export const VendorForm = ({
  initialData = null,
  onSave,
  onCancel,
  isEdit = false,
}) => {
  const [formData, setFormData] = useState({
    businessName: initialData?.businessName || '',
    ownerName: initialData?.ownerName || '',
    mobile: initialData?.mobile || '',
    email: initialData?.email || '',
    businessType: initialData?.businessType || 'Wholesaler',
    gstNumber: initialData?.gstNumber || '',
    address: initialData?.address || '',
    district: initialData?.district || '',
    state: initialData?.state || 'Andhra Pradesh',
    pinCode: initialData?.pinCode || '',
    notes: initialData?.notes || '',
    status: initialData?.status || 'Active',
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const { isValid, errors: validationErrors } = validateVendorForm(formData);
    if (!isValid) {
      setErrors(validationErrors);
      return;
    }
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Business Name */}
        <FormField label="Business Name" name="businessName" required error={errors.businessName}>
          <div className="relative">
            <Building2 className="w-4 h-4 text-[#64748B] absolute left-3 top-3 pointer-events-none" />
            <input
              type="text"
              name="businessName"
              value={formData.businessName}
              onChange={handleChange}
              placeholder="e.g. Kaveri Modern Rice Millers Ltd"
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-[#E2E8F0] focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15 outline-none"
            />
          </div>
        </FormField>

        {/* Owner Name */}
        <FormField label="Owner / Contact Person" name="ownerName" required error={errors.ownerName}>
          <div className="relative">
            <User className="w-4 h-4 text-[#64748B] absolute left-3 top-3 pointer-events-none" />
            <input
              type="text"
              name="ownerName"
              value={formData.ownerName}
              onChange={handleChange}
              placeholder="e.g. V. Raghava Rao"
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-[#E2E8F0] focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15 outline-none"
            />
          </div>
        </FormField>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
              placeholder="10-digit number"
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-[#E2E8F0] focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15 outline-none"
            />
          </div>
        </FormField>

        {/* Business Type */}
        <FormField label="Business Type" name="businessType" required error={errors.businessType}>
          <select
            name="businessType"
            value={formData.businessType}
            onChange={handleChange}
            className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-[#E2E8F0] focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15 outline-none bg-white cursor-pointer"
          >
            {VENDOR_BUSINESS_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </FormField>

        {/* GST Number */}
        <FormField label="GSTIN" name="gstNumber" optional error={errors.gstNumber}>
          <div className="relative">
            <FileText className="w-4 h-4 text-[#64748B] absolute left-3 top-3 pointer-events-none" />
            <input
              type="text"
              name="gstNumber"
              maxLength={15}
              value={formData.gstNumber}
              onChange={(e) => setFormData((p) => ({ ...p, gstNumber: e.target.value.toUpperCase() }))}
              placeholder="37AAAAA0000A1Z5"
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-[#E2E8F0] focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15 outline-none uppercase font-mono"
            />
          </div>
        </FormField>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Email */}
        <FormField label="Email Address" name="email" optional error={errors.email}>
          <div className="relative">
            <Mail className="w-4 h-4 text-[#64748B] absolute left-3 top-3 pointer-events-none" />
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="vendor@business.com"
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-[#E2E8F0] focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15 outline-none"
            />
          </div>
        </FormField>

        {/* Address */}
        <FormField label="Business Address" name="address">
          <div className="relative">
            <MapPin className="w-4 h-4 text-[#64748B] absolute left-3 top-3 pointer-events-none" />
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Industrial area, Road, Building"
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-[#E2E8F0] focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15 outline-none"
            />
          </div>
        </FormField>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
            <option value="Maharashtra">Maharashtra</option>
          </select>
        </FormField>

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
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#E2E8F0]">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-xl text-xs font-semibold border border-[#E2E8F0] hover:bg-slate-50 text-[#1F2937] cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-5 py-2 rounded-xl text-xs font-semibold bg-[#0F766E] hover:bg-[#115E59] text-white shadow-xs cursor-pointer"
        >
          {isEdit ? 'Update Vendor' : 'Save Vendor'}
        </button>
      </div>
    </form>
  );
};

export default VendorForm;


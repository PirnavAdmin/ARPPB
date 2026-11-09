import React, { useState } from 'react';
import { Edit2 } from 'lucide-react';
import { FormField } from '../common/FormField';
import { BusinessLogoUpload } from './BusinessLogoUpload';
import { BankDetails } from './BankDetails';

export const ProfileForm = ({
  initialProfile,
  onSave,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ ...initialProfile });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleBankChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      bankDetails: {
        ...(prev.bankDetails || {}),
        [name]: value,
      },
    }));
  };

  const handleLogoChange = (logoUrl) => {
    setFormData((prev) => ({ ...prev, logo: logoUrl }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData({ ...initialProfile });
    setIsEditing(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 1. Business Information Section */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-[#E2E8F0] shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0]">
          <h3 className="text-xs sm:text-sm font-bold text-[#1F2937] uppercase tracking-wider text-[#0F766E]">
            1. Business Identification
          </h3>

          {!isEditing && (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#0F766E] text-white hover:bg-[#115E59] shadow-2xs cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit Profile</span>
            </button>
          )}
        </div>

        {/* Logo Upload & Preview */}
        <BusinessLogoUpload
          logoUrl={formData.logo}
          onLogoChange={handleLogoChange}
          businessName={formData.businessName}
          disabled={!isEditing}
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <FormField label="Middleman Portal ID" name="middlemanId">
            <input
              type="text"
              name="middlemanId"
              value={formData.middlemanId}
              disabled
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-[#E2E8F0] bg-slate-100 text-slate-500 font-mono font-bold cursor-not-allowed"
            />
          </FormField>

          <FormField label="Registered Business Name" name="businessName" required>
            <input
              type="text"
              name="businessName"
              value={formData.businessName}
              onChange={handleChange}
              disabled={!isEditing}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-[#E2E8F0] focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15 outline-none font-bold disabled:bg-slate-50 disabled:text-slate-600"
            />
          </FormField>

          <FormField label="Registration License No" name="registrationNumber">
            <input
              type="text"
              name="registrationNumber"
              value={formData.registrationNumber}
              onChange={handleChange}
              disabled={!isEditing}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-[#E2E8F0] focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15 outline-none font-mono disabled:bg-slate-50 disabled:text-slate-600"
            />
          </FormField>
        </div>

        <div className="max-w-sm">
          <FormField label="GSTIN" name="gstNumber">
            <input
              type="text"
              name="gstNumber"
              value={formData.gstNumber}
              onChange={handleChange}
              disabled={!isEditing}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-[#E2E8F0] focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15 outline-none uppercase font-mono disabled:bg-slate-50 disabled:text-slate-600"
            />
          </FormField>
        </div>
      </div>

      {/* 2. Owner & Contact Details */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-[#E2E8F0] shadow-xs space-y-4">
        <h3 className="text-xs sm:text-sm font-bold text-[#1F2937] uppercase tracking-wider text-[#0F766E] border-b border-[#E2E8F0] pb-2">
          2. Owner &amp; Contact Information
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <FormField label="Proprietor / Owner Name" name="ownerName" required>
            <input
              type="text"
              name="ownerName"
              value={formData.ownerName}
              onChange={handleChange}
              disabled={!isEditing}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-[#E2E8F0] focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15 outline-none disabled:bg-slate-50 disabled:text-slate-600"
            />
          </FormField>

          <FormField label="Mobile Number" name="mobile" required>
            <input
              type="tel"
              name="mobile"
              maxLength={10}
              value={formData.mobile}
              onChange={handleChange}
              disabled={!isEditing}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-[#E2E8F0] focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15 outline-none font-mono disabled:bg-slate-50 disabled:text-slate-600"
            />
          </FormField>

          <FormField label="Email Address" name="email">
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              disabled={!isEditing}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-[#E2E8F0] focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15 outline-none disabled:bg-slate-50 disabled:text-slate-600"
            />
          </FormField>
        </div>
      </div>

      {/* 3. Business Location Address */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-[#E2E8F0] shadow-xs space-y-4">
        <h3 className="text-xs sm:text-sm font-bold text-[#1F2937] uppercase tracking-wider text-[#0F766E] border-b border-[#E2E8F0] pb-2">
          3. Principal Place of Business
        </h3>

        <FormField label="Premises / Yard Address" name="businessAddress">
          <input
            type="text"
            name="businessAddress"
            value={formData.businessAddress}
            onChange={handleChange}
            disabled={!isEditing}
            className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-[#E2E8F0] focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15 outline-none disabled:bg-slate-50 disabled:text-slate-600"
          />
        </FormField>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
          <FormField label="Village / Area" name="village">
            <input
              type="text"
              name="village"
              value={formData.village || ''}
              onChange={handleChange}
              disabled={!isEditing}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-[#E2E8F0] focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15 outline-none disabled:bg-slate-50 disabled:text-slate-600"
            />
          </FormField>

          <FormField label="District" name="district">
            <input
              type="text"
              name="district"
              value={formData.district}
              onChange={handleChange}
              disabled={!isEditing}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-[#E2E8F0] focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15 outline-none disabled:bg-slate-50 disabled:text-slate-600"
            />
          </FormField>

          <FormField label="State" name="state">
            <input
              type="text"
              name="state"
              value={formData.state}
              onChange={handleChange}
              disabled={!isEditing}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-[#E2E8F0] focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15 outline-none disabled:bg-slate-50 disabled:text-slate-600"
            />
          </FormField>

          <FormField label="PIN Code" name="pinCode">
            <input
              type="text"
              name="pinCode"
              maxLength={6}
              value={formData.pinCode}
              onChange={handleChange}
              disabled={!isEditing}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-[#E2E8F0] focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15 outline-none disabled:bg-slate-50 disabled:text-slate-600"
            />
          </FormField>
        </div>
      </div>

      {/* 4. Optional Bank Settlement Details */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-[#E2E8F0] shadow-xs">
        <BankDetails
          data={formData.bankDetails || {}}
          onChange={handleBankChange}
          disabled={!isEditing}
        />
      </div>

      {/* Footer Form Controls (shown only when editing) */}
      {isEditing && (
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={handleCancel}
            className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold border border-[#E2E8F0] hover:bg-slate-50 text-[#1F2937] cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-[#0F766E] hover:bg-[#115E59] text-white shadow-md shadow-[#0F766E]/20 cursor-pointer"
          >
            Save Profile Changes
          </button>
        </div>
      )}
    </form>
  );
};

export default ProfileForm;

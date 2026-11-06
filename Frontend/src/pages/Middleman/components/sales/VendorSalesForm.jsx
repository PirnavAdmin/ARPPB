import React, { useState, useMemo } from 'react';
import { Building2, Phone, Send, Save } from 'lucide-react';
import { SalesProductSelector } from './SalesProductSelector';
import { SalesSummary } from './SalesSummary';
import { FormField } from '../common/FormField';
import { calculateVendorSaleTotals } from '../../../../utils/middleman/calculations';
import { validateSalesForm } from '../../../../utils/middleman/validation';

const getTodayIso = () => new Date().toISOString().slice(0, 10);
const getDefaultDueIso = () => new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString().slice(0, 10);

export const VendorSalesForm = ({
  vendors = [],
  inventory = [],
  onSubmit,
  onSaveDraft,
}) => {
  const [formData, setFormData] = useState(() => {
    const today = getTodayIso();
    const defaultDueDate = getDefaultDueIso();
    return {
      vendorId: '',
      cropName: '',
      variety: 'Standard',
      quality: 'Grade A',
      quantity: '',
      unit: 'Quintal',
      rate: '',
      transportation: '',
      otherCharges: '',
      salesDate: today,
      deliveryLocation: '',
      expectedDeliveryDate: today,
      expectedPaymentDate: defaultDueDate,
      notes: '',
    };
  });

  const [errors, setErrors] = useState({});

  const selectedVendor = useMemo(
    () => vendors.find((v) => v.vendorId === formData.vendorId),
    [vendors, formData.vendorId]
  );

  // Derive available stock for selected crop from inventory batches
  const availableStock = useMemo(() => {
    if (!formData.cropName) return 0;
    return inventory
      .filter((b) => b.cropName === formData.cropName)
      .reduce((acc, b) => acc + (Number(b.availableQuantity) || 0), 0);
  }, [inventory, formData.cropName]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const handleVendorSelect = (vendorId) => {
    const v = vendors.find((item) => item.vendorId === vendorId);
    setFormData((prev) => ({
      ...prev,
      vendorId,
      deliveryLocation: v ? `${v.address}, ${v.district}` : '',
    }));
    if (errors.vendorId) setErrors((prev) => ({ ...prev, vendorId: null }));
  };

  // Live calculation
  const totals = useMemo(() => {
    return calculateVendorSaleTotals({
      quantity: formData.quantity,
      rate: formData.rate,
      transportation: formData.transportation,
      otherCharges: formData.otherCharges,
    });
  }, [formData.quantity, formData.rate, formData.transportation, formData.otherCharges]);

  const handleSubmit = (e, isDraft = false) => {
    e?.preventDefault();

    if (!isDraft) {
      const { isValid, errors: validationErrors } = validateSalesForm(formData, availableStock, false);
      if (!isValid) {
        setErrors(validationErrors);
        return;
      }
    }

    const payload = {
      ...formData,
      vendorName: selectedVendor ? selectedVendor.businessName : 'Unknown Vendor',
      businessName: selectedVendor ? selectedVendor.businessName : '',
      ownerName: selectedVendor ? selectedVendor.ownerName : '',
      mobile: selectedVendor ? selectedVendor.mobile : '',
      quantity: Number(formData.quantity) || 0,
      rate: Number(formData.rate) || 0,
      subtotal: totals.subtotal,
      transportation: totals.transportation,
      otherCharges: totals.otherCharges,
      additionalCharges: totals.additionalCharges,
      totalAmount: totals.totalAmount,
    };

    if (isDraft) {
      onSaveDraft(payload);
    } else {
      onSubmit(payload);
    }
  };

  return (
    <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6">
      {/* 1. Vendor Selection */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-[#E2E8F0] shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-[#1F2937] uppercase tracking-wider text-[#0F766E] border-b border-[#E2E8F0] pb-2">
          1. Vendor Commercial Details
        </h3>

        <FormField label="Select Vendor" name="vendorId" required error={errors.vendorId}>
          <select
            value={formData.vendorId}
            onChange={(e) => handleVendorSelect(e.target.value)}
            className="w-full px-3 py-2.5 text-xs sm:text-sm rounded-xl border border-[#E2E8F0] focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15 outline-none bg-white font-medium cursor-pointer"
          >
            <option value="">-- Choose Registered Vendor --</option>
            {vendors.map((v) => (
              <option key={v.vendorId} value={v.vendorId}>
                {v.businessName} ({v.businessType}, {v.district}) &bull; {v.ownerName}
              </option>
            ))}
          </select>
        </FormField>

        {selectedVendor && (
          <div className="p-3.5 bg-teal-50/40 rounded-xl border border-teal-100 flex flex-wrap items-center justify-between gap-3 text-xs animate-fadeIn">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#0F766E] text-white flex items-center justify-center font-bold text-xs">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-[#1F2937] block">{selectedVendor.businessName}</span>
                <span className="text-[#64748B] flex items-center gap-1">
                  <Phone className="w-3 h-3 text-[#0F766E]" />
                  <span>+91 {selectedVendor.mobile} &bull; {selectedVendor.ownerName}</span>
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-mono text-[#64748B] block">
                GSTIN: {selectedVendor.gstNumber || 'Unregistered'}
              </span>
              <span className="text-[11px] font-medium text-[#0F766E]">
                {selectedVendor.address}, {selectedVendor.district}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 2. Product Details */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-[#E2E8F0] shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-[#1F2937] uppercase tracking-wider text-[#0F766E] border-b border-[#E2E8F0] pb-2">
          2. Produce Allocation from Inventory
        </h3>
        <SalesProductSelector
          formData={formData}
          onChange={handleChange}
          availableStock={availableStock}
          subtotal={totals.subtotal}
          errors={errors}
        />
      </div>

      {/* 3. Additional Charges */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-[#E2E8F0] shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-[#1F2937] uppercase tracking-wider text-[#0F766E] border-b border-[#E2E8F0] pb-2">
          3. Surcharges &amp; Logistics
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Transportation / Freight Charges (₹)" name="transportation">
            <input
              type="number"
              name="transportation"
              min="0"
              value={formData.transportation}
              onChange={handleChange}
              placeholder="0"
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-[#E2E8F0] focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15 outline-none font-medium"
            />
          </FormField>

          <FormField label="Other Handling / Insurance Charges (₹)" name="otherCharges">
            <input
              type="number"
              name="otherCharges"
              min="0"
              value={formData.otherCharges}
              onChange={handleChange}
              placeholder="0"
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-[#E2E8F0] focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15 outline-none font-medium"
            />
          </FormField>
        </div>
      </div>

      {/* 4. Transaction Dates & Delivery */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-[#E2E8F0] shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-[#1F2937] uppercase tracking-wider text-[#0F766E] border-b border-[#E2E8F0] pb-2">
          4. Delivery &amp; Payment Due Dates
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <FormField label="Sales Date" name="salesDate">
            <input
              type="date"
              name="salesDate"
              value={formData.salesDate}
              onChange={handleChange}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-[#E2E8F0] focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15 outline-none cursor-pointer"
            />
          </FormField>

          <FormField label="Expected Delivery Date" name="expectedDeliveryDate">
            <input
              type="date"
              name="expectedDeliveryDate"
              value={formData.expectedDeliveryDate}
              onChange={handleChange}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-[#E2E8F0] focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15 outline-none cursor-pointer"
            />
          </FormField>

          <FormField label="Expected Payment Date" name="expectedPaymentDate" required error={errors.expectedPaymentDate}>
            <input
              type="date"
              name="expectedPaymentDate"
              value={formData.expectedPaymentDate}
              onChange={handleChange}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-[#E2E8F0] focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15 outline-none cursor-pointer font-medium"
            />
          </FormField>

          <FormField label="Delivery Location" name="deliveryLocation">
            <input
              type="text"
              name="deliveryLocation"
              value={formData.deliveryLocation}
              onChange={handleChange}
              placeholder="Mill site / Warehouse"
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-[#E2E8F0] focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15 outline-none"
            />
          </FormField>
        </div>

        <FormField label="Notes">
          <textarea
            name="notes"
            rows={2}
            value={formData.notes}
            onChange={handleChange}
            placeholder="Vehicle number, driver contact, delivery instructions..."
            className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-[#E2E8F0] focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15 outline-none"
          />
        </FormField>
      </div>

      {/* 5. Live Summary */}
      <SalesSummary
        subtotal={totals.subtotal}
        transportation={totals.transportation}
        otherCharges={totals.otherCharges}
        totalAmount={totals.totalAmount}
        isCustomer={false}
      />

      {/* 6. Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={(e) => handleSubmit(e, true)}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold border border-[#E2E8F0] bg-white hover:bg-slate-50 text-[#1F2937] shadow-xs cursor-pointer"
        >
          <Save className="w-4 h-4 text-[#64748B]" />
          <span>Save Draft</span>
        </button>

        <button
          type="submit"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-[#0F766E] hover:bg-[#115E59] text-white shadow-md shadow-[#0F766E]/20 cursor-pointer"
        >
          <Send className="w-4 h-4 text-[#CCFBF1]" />
          <span>Submit Sale &amp; Request Vendor OTP</span>
        </button>
      </div>
    </form>
  );
};

export default VendorSalesForm;

import React, { useState, useMemo } from 'react';
import { Calendar, MapPin, Send, Save } from 'lucide-react';
import { FarmerSelector } from './FarmerSelector';
import { PurchaseProductDetails } from './PurchaseProductDetails';
import { PurchaseCharges } from './PurchaseCharges';
import { PurchaseSummary } from './PurchaseSummary';
import { FormField } from '../common/FormField';
import { calculatePurchaseTotals } from '../../../../utils/middleman/calculations';
import { validatePurchaseForm } from '../../../../utils/middleman/validation';

const getTodayIso = () => new Date().toISOString().slice(0, 10);
const getDefaultDueIso = () => new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString().slice(0, 10);

export const PurchaseForm = ({
  farmers = [],
  onSubmit,
  onSaveDraft,
}) => {
  const [formData, setFormData] = useState(() => {
    const today = getTodayIso();
    const defaultDueDate = getDefaultDueIso();
    return {
      farmerId: '',
      cropName: '',
      variety: '',
      quality: 'Grade A',
      quantity: '',
      unit: 'Quintal',
      rate: '',
      transportation: '',
      loading: '',
      otherCharges: '',
      purchaseDate: today,
      expectedPaymentDate: defaultDueDate,
      pickupLocation: '',
      deliveryDate: today,
      notes: '',
    };
  });

  const [errors, setErrors] = useState({});

  const selectedFarmer = useMemo(
    () => farmers.find((f) => f.farmerId === formData.farmerId),
    [farmers, formData.farmerId]
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const handleFarmerSelect = (farmerId) => {
    const farmer = farmers.find((f) => f.farmerId === farmerId);
    setFormData((prev) => ({
      ...prev,
      farmerId,
      pickupLocation: farmer ? `${farmer.village}, ${farmer.district}` : '',
    }));
    if (errors.farmerId) setErrors((prev) => ({ ...prev, farmerId: null }));
  };

  // Live Calculations
  const totals = useMemo(() => {
    return calculatePurchaseTotals({
      quantity: formData.quantity,
      rate: formData.rate,
      transportation: formData.transportation,
      loading: formData.loading,
      otherCharges: formData.otherCharges,
    });
  }, [formData.quantity, formData.rate, formData.transportation, formData.loading, formData.otherCharges]);

  const handleSubmit = (e, isDraft = false) => {
    e?.preventDefault();

    if (!isDraft) {
      const { isValid, errors: validationErrors } = validatePurchaseForm(formData);
      if (!isValid) {
        setErrors(validationErrors);
        return;
      }
    }

    const payload = {
      ...formData,
      farmerName: selectedFarmer ? selectedFarmer.name : 'Unknown Farmer',
      farmerMobile: selectedFarmer ? selectedFarmer.mobile : '',
      farmerLocation: selectedFarmer ? `${selectedFarmer.village}, ${selectedFarmer.district}` : '',
      quantity: Number(formData.quantity) || 0,
      rate: Number(formData.rate) || 0,
      subtotal: totals.subtotal,
      transportation: totals.transportation,
      loading: totals.loading,
      otherCharges: totals.otherCharges,
      additionalCharges: totals.additionalCharges,
      totalAmount: totals.totalAmount,
      averageCostPerUnit: totals.averageCostPerUnit,
    };

    if (isDraft) {
      onSaveDraft(payload);
    } else {
      onSubmit(payload);
    }
  };

  return (
    <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6">
      {/* 1. Farmer Details Section */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-[#E2E8F0] shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-[#1F2937] uppercase tracking-wider text-[#0F766E] border-b border-[#E2E8F0] pb-2">
          1. Farmer Identification
        </h3>
        <FarmerSelector
          farmers={farmers}
          selectedFarmerId={formData.farmerId}
          onSelectFarmer={handleFarmerSelect}
          error={errors.farmerId}
        />
      </div>

      {/* 2. Product Details Section */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-[#E2E8F0] shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-[#1F2937] uppercase tracking-wider text-[#0F766E] border-b border-[#E2E8F0] pb-2">
          2. Raw Produce &amp; Pricing
        </h3>
        <PurchaseProductDetails
          formData={formData}
          onChange={handleChange}
          subtotal={totals.subtotal}
          errors={errors}
        />
      </div>

      {/* 3. Additional Charges Section */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-[#E2E8F0] shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-[#1F2937] uppercase tracking-wider text-[#0F766E] border-b border-[#E2E8F0] pb-2">
          3. Landed Logistics &amp; Surcharges
        </h3>
        <PurchaseCharges formData={formData} onChange={handleChange} />
      </div>

      {/* 4. Transaction Dates & Logistics Details */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-[#E2E8F0] shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-[#1F2937] uppercase tracking-wider text-[#0F766E] border-b border-[#E2E8F0] pb-2">
          4. Transaction Timeline &amp; Delivery Logistics
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <FormField label="Purchase Date" name="purchaseDate" required error={errors.purchaseDate}>
            <div className="relative">
              <Calendar className="w-4 h-4 text-[#64748B] absolute left-3 top-3 pointer-events-none" />
              <input
                type="date"
                name="purchaseDate"
                value={formData.purchaseDate}
                onChange={handleChange}
                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-[#E2E8F0] focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15 outline-none cursor-pointer"
              />
            </div>
          </FormField>

          <FormField label="Expected Payment Date" name="expectedPaymentDate" required error={errors.expectedPaymentDate}>
            <div className="relative">
              <Calendar className="w-4 h-4 text-[#64748B] absolute left-3 top-3 pointer-events-none" />
              <input
                type="date"
                name="expectedPaymentDate"
                value={formData.expectedPaymentDate}
                onChange={handleChange}
                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-[#E2E8F0] focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15 outline-none cursor-pointer font-medium"
              />
            </div>
          </FormField>

          <FormField label="Pickup Location" name="pickupLocation">
            <div className="relative">
              <MapPin className="w-4 h-4 text-[#64748B] absolute left-3 top-3 pointer-events-none" />
              <input
                type="text"
                name="pickupLocation"
                value={formData.pickupLocation}
                onChange={handleChange}
                placeholder="Farm gate / Yard"
                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-[#E2E8F0] focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15 outline-none"
              />
            </div>
          </FormField>

          <FormField label="Delivery Date" name="deliveryDate">
            <input
              type="date"
              name="deliveryDate"
              value={formData.deliveryDate}
              onChange={handleChange}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-[#E2E8F0] focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15 outline-none cursor-pointer"
            />
          </FormField>
        </div>

        <FormField label="Purchase Transaction Notes" name="notes">
          <textarea
            name="notes"
            rows={2}
            value={formData.notes}
            onChange={handleChange}
            placeholder="Moisture level, bag count, weighing slip reference..."
            className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-[#E2E8F0] focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15 outline-none"
          />
        </FormField>
      </div>

      {/* 5. Live Calculation Summary */}
      <PurchaseSummary
        subtotal={totals.subtotal}
        transportation={totals.transportation}
        loading={totals.loading}
        otherCharges={totals.otherCharges}
        totalAmount={totals.totalAmount}
        averageCostPerUnit={totals.averageCostPerUnit}
        unit={formData.unit}
      />

      {/* 6. Form Submission Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={(e) => handleSubmit(e, true)}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold border border-[#E2E8F0] bg-white hover:bg-slate-50 text-[#1F2937] shadow-xs cursor-pointer transition-all"
        >
          <Save className="w-4 h-4 text-[#64748B]" />
          <span>Save as Draft</span>
        </button>

        <button
          type="submit"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-[#0F766E] hover:bg-[#115E59] text-white shadow-md shadow-[#0F766E]/20 cursor-pointer transition-all"
        >
          <Send className="w-4 h-4 text-[#CCFBF1]" />
          <span>Submit Purchase &amp; Request OTP</span>
        </button>
      </div>
    </form>
  );
};

export default PurchaseForm;

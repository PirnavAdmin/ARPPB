import React, { useState, useMemo } from 'react';
import { User, Phone, MapPin, Send, Save } from 'lucide-react';
import { SalesProductSelector } from './SalesProductSelector';
import { SalesSummary } from './SalesSummary';
import { FormField } from '../common/FormField';
import { calculateCustomerSaleTotals } from '../../../../utils/middleman/calculations';
import { validateSalesForm } from '../../../../utils/middleman/validation';

const getTodayIso = () => new Date().toISOString().slice(0, 10);
const getDefaultDueIso = () => new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().slice(0, 10);

export const CustomerSalesForm = ({
  customers = [],
  inventory = [],
  onSubmit,
  onSaveDraft,
}) => {
  const [formData, setFormData] = useState(() => {
    const today = getTodayIso();
    const defaultDueDate = getDefaultDueIso();
    return {
      customerId: '',
      cropName: '',
      variety: 'Standard',
      quality: 'Grade A',
      quantity: '',
      unit: 'Quintal',
      rate: '',
      deliveryCharges: '',
      salesDate: today,
      deliveryAddress: '',
      expectedDeliveryDate: today,
      expectedPaymentDate: defaultDueDate,
      notes: '',
    };
  });

  const [errors, setErrors] = useState({});

  const selectedCustomer = useMemo(
    () => customers.find((c) => c.customerId === formData.customerId),
    [customers, formData.customerId]
  );

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

  const handleCustomerSelect = (customerId) => {
    const c = customers.find((item) => item.customerId === customerId);
    setFormData((prev) => ({
      ...prev,
      customerId,
      deliveryAddress: c ? `${c.address}, ${c.district}` : '',
    }));
    if (errors.customerId) setErrors((prev) => ({ ...prev, customerId: null }));
  };

  const totals = useMemo(() => {
    return calculateCustomerSaleTotals({
      quantity: formData.quantity,
      price: formData.rate,
      deliveryCharges: formData.deliveryCharges,
    });
  }, [formData.quantity, formData.rate, formData.deliveryCharges]);

  const handleSubmit = (e, isDraft = false) => {
    e?.preventDefault();

    if (!isDraft) {
      const { isValid, errors: validationErrors } = validateSalesForm(formData, availableStock, true);
      if (!isValid) {
        setErrors(validationErrors);
        return;
      }
    }

    const payload = {
      ...formData,
      customerName: selectedCustomer ? selectedCustomer.name : 'Direct Customer',
      mobile: selectedCustomer ? selectedCustomer.mobile : '',
      quantity: Number(formData.quantity) || 0,
      price: Number(formData.rate) || 0,
      subtotal: totals.subtotal,
      deliveryCharges: totals.deliveryCharges,
      finalAmount: totals.finalAmount,
    };

    if (isDraft) {
      onSaveDraft(payload);
    } else {
      onSubmit(payload);
    }
  };

  return (
    <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6">
      {/* 1. Customer Selection */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-[#E2E8F0] shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-[#1F2937] uppercase tracking-wider text-[#0F766E] border-b border-[#E2E8F0] pb-2">
          1. Direct Customer Identification
        </h3>

        <FormField label="Select Customer" name="customerId" required error={errors.customerId}>
          <select
            value={formData.customerId}
            onChange={(e) => handleCustomerSelect(e.target.value)}
            className="w-full px-3 py-2.5 text-xs sm:text-sm rounded-xl border border-[#E2E8F0] focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15 outline-none bg-white font-medium cursor-pointer"
          >
            <option value="">-- Choose Registered Customer --</option>
            {customers.map((c) => (
              <option key={c.customerId} value={c.customerId}>
                {c.name} ({c.district}) &bull; {c.mobile}
              </option>
            ))}
          </select>
        </FormField>

        {selectedCustomer && (
          <div className="p-3.5 bg-teal-50/40 rounded-xl border border-teal-100 flex flex-wrap items-center justify-between gap-3 text-xs animate-fadeIn">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#0F766E] text-white flex items-center justify-center font-bold text-xs">
                <User className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-[#1F2937] block">{selectedCustomer.name}</span>
                <span className="text-[#64748B] flex items-center gap-1">
                  <Phone className="w-3 h-3 text-[#0F766E]" />
                  <span>+91 {selectedCustomer.mobile}</span>
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[#64748B] flex items-center justify-end gap-1">
                <MapPin className="w-3 h-3 text-[#0F766E]" />
                <span>{selectedCustomer.district}, {selectedCustomer.state}</span>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 2. Product Allocation */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-[#E2E8F0] shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-[#1F2937] uppercase tracking-wider text-[#0F766E] border-b border-[#E2E8F0] pb-2">
          2. Crop Allocation from Inventory
        </h3>
        <SalesProductSelector
          formData={formData}
          onChange={handleChange}
          availableStock={availableStock}
          subtotal={totals.subtotal}
          errors={errors}
        />
      </div>

      {/* 3. Delivery Charges & Final Amount */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-[#E2E8F0] shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-[#1F2937] uppercase tracking-wider text-[#0F766E] border-b border-[#E2E8F0] pb-2">
          3. Delivery Surcharges
        </h3>
        <FormField label="Delivery / Shipping Charges (₹)" name="deliveryCharges">
          <input
            type="number"
            name="deliveryCharges"
            min="0"
            value={formData.deliveryCharges}
            onChange={handleChange}
            placeholder="0"
            className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-[#E2E8F0] focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15 outline-none font-medium max-w-sm"
          />
        </FormField>
      </div>

      {/* 4. Delivery & Payment Details */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-[#E2E8F0] shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-[#1F2937] uppercase tracking-wider text-[#0F766E] border-b border-[#E2E8F0] pb-2">
          4. Delivery &amp; Transaction Details
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          <FormField label="Delivery Address" name="deliveryAddress">
            <input
              type="text"
              name="deliveryAddress"
              value={formData.deliveryAddress}
              onChange={handleChange}
              placeholder="Shop / Residential address"
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-[#E2E8F0] focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15 outline-none"
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
        </div>

        <FormField label="Notes">
          <textarea
            name="notes"
            rows={2}
            value={formData.notes}
            onChange={handleChange}
            placeholder="Special packing notes, payment terms..."
            className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-[#E2E8F0] focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/15 outline-none"
          />
        </FormField>
      </div>

      {/* 5. Live Summary */}
      <SalesSummary
        subtotal={totals.subtotal}
        deliveryCharges={totals.deliveryCharges}
        totalAmount={totals.finalAmount}
        isCustomer={true}
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
          <span>Submit Sale &amp; Request Customer OTP</span>
        </button>
      </div>
    </form>
  );
};

export default CustomerSalesForm;

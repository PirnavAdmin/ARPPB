/**
 * Frontend Validation Rules for Middleman Portal Forms
 */

export const INDIAN_PHONE_REGEX = /^[6-9]\d{9}$/;
export const GST_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validateFarmerForm = (data) => {
  const errors = {};

  if (!data.name || !data.name.trim()) {
    errors.name = 'Farmer name is required';
  }

  const cleanPhone = String(data.mobile || '').replace(/\D/g, '');
  if (!cleanPhone) {
    errors.mobile = 'Mobile number is required';
  } else if (!INDIAN_PHONE_REGEX.test(cleanPhone)) {
    errors.mobile = 'Enter a valid 10-digit Indian mobile number';
  }

  if (data.email && data.email.trim() && !EMAIL_REGEX.test(data.email.trim())) {
    errors.email = 'Enter a valid email address';
  }

  if (!data.village || !data.village.trim()) {
    errors.village = 'Village name is required';
  }

  if (!data.district || !data.district.trim()) {
    errors.district = 'District is required';
  }

  if (!data.state || !data.state.trim()) {
    errors.state = 'State is required';
  }

  if (!data.crops || data.crops.length === 0) {
    errors.crops = 'Please select at least one available crop';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

export const validateVendorForm = (data) => {
  const errors = {};

  if (!data.businessName || !data.businessName.trim()) {
    errors.businessName = 'Business name is required';
  }

  if (!data.ownerName || !data.ownerName.trim()) {
    errors.ownerName = 'Owner name is required';
  }

  const cleanPhone = String(data.mobile || '').replace(/\D/g, '');
  if (!cleanPhone) {
    errors.mobile = 'Mobile number is required';
  } else if (!INDIAN_PHONE_REGEX.test(cleanPhone)) {
    errors.mobile = 'Enter a valid 10-digit Indian mobile number';
  }

  if (!data.businessType) {
    errors.businessType = 'Select business type';
  }

  if (!data.district || !data.district.trim()) {
    errors.district = 'District is required';
  }

  if (data.email && data.email.trim() && !EMAIL_REGEX.test(data.email.trim())) {
    errors.email = 'Enter a valid email address';
  }

  if (data.gstNumber && data.gstNumber.trim()) {
    const cleanGst = data.gstNumber.trim().toUpperCase();
    if (!GST_REGEX.test(cleanGst)) {
      errors.gstNumber = 'Enter a valid 15-digit GSTIN (e.g. 36AAAAA0000A1Z5)';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

export const validateCustomerForm = (data) => {
  const errors = {};

  if (!data.name || !data.name.trim()) {
    errors.name = 'Customer name is required';
  }

  const cleanPhone = String(data.mobile || '').replace(/\D/g, '');
  if (!cleanPhone) {
    errors.mobile = 'Mobile number is required';
  } else if (!INDIAN_PHONE_REGEX.test(cleanPhone)) {
    errors.mobile = 'Enter a valid 10-digit Indian mobile number';
  }

  if (!data.district || !data.district.trim()) {
    errors.district = 'District is required';
  }

  if (data.email && data.email.trim() && !EMAIL_REGEX.test(data.email.trim())) {
    errors.email = 'Enter a valid email address';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

export const validatePurchaseForm = (data) => {
  const errors = {};

  if (!data.farmerId) {
    errors.farmerId = 'Please select a registered farmer';
  }

  if (!data.cropName) {
    errors.cropName = 'Please select a crop';
  }

  const qty = Number(data.quantity);
  if (!qty || qty <= 0) {
    errors.quantity = 'Purchased quantity must be greater than 0';
  }

  const price = Number(data.rate);
  if (!price || price <= 0) {
    errors.rate = 'Price per unit must be greater than 0';
  }

  if (!data.purchaseDate) {
    errors.purchaseDate = 'Purchase date is required';
  }

  if (!data.expectedPaymentDate) {
    errors.expectedPaymentDate = 'Expected payment date is required';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

export const validateSalesForm = (data, availableStock = 0, isCustomer = false) => {
  const errors = {};

  if (isCustomer) {
    if (!data.customerId) errors.customerId = 'Please select a customer';
  } else {
    if (!data.vendorId) errors.vendorId = 'Please select a vendor';
  }

  if (!data.cropName) {
    errors.cropName = 'Please select a crop';
  }

  const qty = Number(data.quantity);
  if (!qty || qty <= 0) {
    errors.quantity = 'Selling quantity must be greater than 0';
  } else if (qty > availableStock) {
    errors.quantity = `Quantity exceeds available stock (${availableStock})`;
  }

  const price = Number(data.rate);
  if (!price || price <= 0) {
    errors.rate = 'Selling price must be greater than 0';
  }

  if (!data.expectedPaymentDate) {
    errors.expectedPaymentDate = 'Expected payment date is required';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};


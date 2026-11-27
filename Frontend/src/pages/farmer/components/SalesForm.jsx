import { useState, useEffect, useRef, useMemo } from 'react';
import {
  Check,
  Phone,
  User,
  UserCheck,
  Users,
  Building2,
  ShieldCheck,
  Sparkles,
  AlertCircle,
  History,
  X,
  Search,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import { useFarmer } from '../context/FarmerContext';
import {
  formatCurrency,
  calculateExpectedPaymentDate,
  formatDate,
  buyerCategoryStyles,
} from '../utils/farmerHelpers';
import { DEFAULT_SALES_OPTIONS } from '../../../services/farmerSalesService';
import {
  fetchFarmerContactsApi,
  fetchFarmerContactByIdApi,
  saveContactToStorage,
  sanitizeAndCleanSavedContacts,
  DEFAULT_FARMER_CONTACTS,
} from '../../../services/farmerContactService';

function SalesForm({ initialCategory, onSaleCreated }) {
  const { crops, profile, sales, createSale, salesOptions, setActiveOtpRequest, pageParam, setPageParam } = useFarmer();

  const options = salesOptions || DEFAULT_SALES_OPTIONS;
  const buyerCategories = options.buyerCategories?.length ? options.buyerCategories : DEFAULT_SALES_OPTIONS.buyerCategories;
  const qualityGrades = options.qualityGrades?.length ? options.qualityGrades : DEFAULT_SALES_OPTIONS.qualityGrades;

  const resolvedInitialCategory = initialCategory || pageParam || buyerCategories[0]?.code || 'Middleman';

  const [formData, setFormData] = useState({
    buyerCategory: resolvedInitialCategory,
    buyerName: '',
    buyerMobile: '',
    cropId: crops[0]?.id || '',
    cropName: crops[0]?.name || '',
    sellingQuantity: '',
    rate: crops[0]?.expectedSellingPrice || '',
    qualityGrade: crops[0]?.qualityGrade || qualityGrades[0]?.code || 'Grade A',
    pickupLocation: `${profile.farmName || 'Farmer Warehouse'}, ${profile.village || 'Farm'}${profile.district ? `, ${profile.district}` : ''}`,
    expectedPickupDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    notes: '',
  });

  const [errors, setErrors] = useState({});
  const [createdResult, setCreatedResult] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // Synchronize category when initialCategory or pageParam changes from navigation/sidebar
  useEffect(() => {
    const targetCat = initialCategory || pageParam;
    if (targetCat && ['Middleman', 'Vendor', 'Customer'].includes(targetCat)) {
      if (formData.buyerCategory.toLowerCase() !== targetCat.toLowerCase()) {
        setFormData((prev) => ({
          ...prev,
          buyerCategory: targetCat,
          buyerName: '',
          buyerMobile: '',
        }));
        setErrors((prev) => ({
          ...prev,
          buyerName: '',
          buyerMobile: '',
        }));
        setAutoFillNotice(null);
      }
    }
  }, [initialCategory, pageParam]);

  // Predictive Contact Auto-Complete States (with 300ms debounce & Farmer Contacts API)
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [matchingContacts, setMatchingContacts] = useState([]);
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);
  const [isLoadingContactDetails, setIsLoadingContactDetails] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [activeDropdownIndex, setActiveDropdownIndex] = useState(0);
  const [autoFillNotice, setAutoFillNotice] = useState(null);
  const dropdownRef = useRef(null);
  const nameInputRef = useRef(null);

  // Purge any corrupted records from local storage on mount
  useEffect(() => {
    sanitizeAndCleanSavedContacts();
  }, []);

  // 300ms Debounce on Buyer Name Input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(formData.buyerName.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [formData.buyerName]);

  // Fetch Farmer Contacts via API when debounced search or buyer category changes
  useEffect(() => {
    let isCurrent = true;
    const loadContacts = async () => {
      setIsLoadingContacts(true);
      try {
        const contacts = await fetchFarmerContactsApi({
          category: formData.buyerCategory,
          search: debouncedSearch,
          userId: profile?.id || profile?.farmerId || 1,
          sales,
        });
        if (isCurrent) {
          setMatchingContacts(contacts);
        }
      } catch (err) {
        console.warn('Failed to load contacts for autocomplete:', err);
      } finally {
        if (isCurrent) {
          setIsLoadingContacts(false);
        }
      }
    };

    loadContacts();

    return () => {
      isCurrent = false;
    };
  }, [debouncedSearch, formData.buyerCategory, profile?.id, profile?.farmerId, sales]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Find currently selected crop object
  const selectedCrop = (crops || []).find(
    (c) => c.name.toLowerCase() === (formData.cropName || '').toLowerCase()
  ) || crops[0];

  // When selected crop changes, update rate and grade defaults
  useEffect(() => {
    if (selectedCrop) {
      setFormData((prev) => ({
        ...prev,
        cropId: selectedCrop.id,
        rate: prev.rate || selectedCrop.expectedSellingPrice || '',
        qualityGrade: prev.qualityGrade || selectedCrop.qualityGrade || 'Grade A',
      }));
    }
  }, [formData.cropName, selectedCrop]);

  // Validation functions
  const validateName = (name) => {
    const trimmed = (name || '').trim();
    if (!trimmed) {
      return 'Buyer or trading firm name is required.';
    }
    if (trimmed.length < 2) {
      return 'Name must be at least 2 characters long.';
    }
    // Only letters, numbers, spaces, dots, ampersand, apostrophe, hyphens, and parentheses allowed
    if (!/^[a-zA-Z0-9\s.&'()-]+$/.test(name)) {
      return "Name should only contain letters, numbers, spaces, dots, '&' and '-' (e.g., Bhanu Prasad, Srinivasa Traders).";
    }
    return '';
  };

  const validateMobile = (mobile) => {
    const clean = (mobile || '').replace(/\D/g, '');
    if (!clean) {
      return 'Valid 10-digit mobile number is required for OTP delivery.';
    }
    if (!/^[6-9]/.test(clean)) {
      return 'Indian mobile numbers must start with 6, 7, 8, or 9.';
    }
    if (clean.length < 10) {
      return `Mobile number must be exactly 10 digits (${clean.length}/10 entered).`;
    }
    if (clean.length > 10) {
      return 'Mobile number cannot exceed 10 digits.';
    }
    return '';
  };

  const handleNameChange = (e) => {
    const val = e.target.value;
    setFormData((prev) => ({ ...prev, buyerName: val }));
    setIsDropdownOpen(true);
    setActiveDropdownIndex(0);

    const err = validateName(val);
    setErrors((prev) => ({ ...prev, buyerName: err }));
    if (submitError) setSubmitError(null);
  };

  const handleMobileChange = (e) => {
    // Only allow numeric characters
    const clean = e.target.value.replace(/\D/g, '').slice(0, 10);
    setFormData((prev) => ({ ...prev, buyerMobile: clean }));

    let err = '';
    if (clean.length > 0 && !/^[6-9]/.test(clean)) {
      err = 'Indian mobile numbers must start with 6, 7, 8, or 9.';
    } else if (clean.length === 10) {
      err = '';
    }
    setErrors((prev) => ({ ...prev, buyerMobile: err }));
    if (submitError) setSubmitError(null);
  };

  const handleCategoryChange = (newCategory) => {
    if (newCategory === formData.buyerCategory) return;
    if (setPageParam) {
      setPageParam(newCategory);
    }
    setFormData((prev) => ({
      ...prev,
      buyerCategory: newCategory,
      buyerName: '',
      buyerMobile: '',
    }));
    setErrors((prev) => ({
      ...prev,
      buyerName: '',
      buyerMobile: '',
    }));
    setAutoFillNotice(null);
    setIsDropdownOpen(true);
    if (nameInputRef.current) {
      nameInputRef.current.focus();
    }
  };

  const handleSelectContact = async (contact) => {
    setIsLoadingContactDetails(true);
    let fullDetails = { ...contact };

    // Contact Details API Integration: GET /api/v1/farmer/contacts/{id}?category=...
    try {
      if (contact.id) {
        const fetched = await fetchFarmerContactByIdApi(
          contact.id,
          profile?.id || profile?.farmerId || 1,
          contact.category || formData.buyerCategory,
          sales
        );
        if (fetched && typeof fetched === 'object') {
          // Merge safely: ONLY overwrite with non-empty, non-ID values
          fullDetails = {
            ...fullDetails,
            ...(fetched.name && !fetched.name.startsWith('CNT-') && !/^\d+$/.test(fetched.name) ? { name: fetched.name } : {}),
            ...(fetched.businessName && !fetched.businessName.startsWith('CNT-') ? { businessName: fetched.businessName } : {}),
            ...(fetched.contactPerson && !fetched.contactPerson.startsWith('CNT-') ? { contactPerson: fetched.contactPerson } : {}),
            ...(fetched.mobile && fetched.mobile.length === 10 ? { mobile: fetched.mobile } : {}),
            ...(fetched.category ? { category: fetched.category } : {}),
            ...(fetched.pickupLocation ? { pickupLocation: fetched.pickupLocation } : {}),
            ...(fetched.cropName ? { cropName: fetched.cropName } : {}),
            ...(fetched.sellingQuantity ? { sellingQuantity: fetched.sellingQuantity } : {}),
            ...(fetched.rate ? { rate: fetched.rate } : {}),
            ...(fetched.qualityGrade ? { qualityGrade: fetched.qualityGrade } : {}),
          };
        }
      }
    } catch (err) {
      console.warn('Could not fetch single contact by ID, using contact item:', err);
    } finally {
      setIsLoadingContactDetails(false);
    }

    // Determine clean display name: NEVER an ID like CNT-V001 or pure numbers
    let chosenName = fullDetails.name || fullDetails.businessName || fullDetails.contactPerson || '';
    if (!chosenName || chosenName.startsWith('CNT-') || /^\d+$/.test(chosenName)) {
      chosenName = fullDetails.contactPerson || fullDetails.businessName || 'Agricultural Buyer';
    }

    let chosenMobile = fullDetails.mobile || '';
    if (!chosenMobile || chosenMobile.length !== 10) {
      const match = (DEFAULT_FARMER_CONTACTS || []).find(
        (c) => c.name?.toLowerCase() === chosenName.toLowerCase() || c.businessName?.toLowerCase() === chosenName.toLowerCase()
      );
      if (match?.mobile) {
        chosenMobile = match.mobile;
      }
    }

    const chosenCategory = fullDetails.category || formData.buyerCategory;

    // Find matching crop in farmer crops if contact has a preferred/last crop
    const matchingCrop = (crops || []).find(
      (c) => c.name.toLowerCase() === (fullDetails.cropName || '').toLowerCase()
    ) || selectedCrop;

    const chosenQty = fullDetails.sellingQuantity || formData.sellingQuantity || (matchingCrop?.availableQuantity ? Math.min(25, matchingCrop.availableQuantity) : '25');
    const chosenRate = fullDetails.rate || matchingCrop?.expectedSellingPrice || formData.rate || '910';
    const chosenGrade = fullDetails.qualityGrade || matchingCrop?.qualityGrade || formData.qualityGrade || 'Grade A';
    const chosenLocation = fullDetails.pickupLocation || formData.pickupLocation || `${profile.farmName || 'Farmer Warehouse'}, ${profile.village || 'Farm'}${profile.district ? `, ${profile.district}` : ''}`;

    setFormData((prev) => ({
      ...prev,
      buyerName: chosenName,
      buyerMobile: chosenMobile || prev.buyerMobile,
      buyerCategory: chosenCategory,
      cropId: matchingCrop ? matchingCrop.id : prev.cropId,
      cropName: matchingCrop ? matchingCrop.name : prev.cropName,
      sellingQuantity: String(chosenQty),
      rate: String(chosenRate),
      qualityGrade: chosenGrade,
      pickupLocation: chosenLocation,
    }));

    setErrors((prev) => ({
      ...prev,
      buyerName: '',
      buyerMobile: '',
    }));

    setAutoFillNotice({
      name: chosenName,
      person: fullDetails.contactPerson,
      mobile: chosenMobile,
      category: chosenCategory,
      crop: matchingCrop?.name || fullDetails.cropName,
      qty: chosenQty,
      rate: chosenRate,
      location: chosenLocation,
    });

    saveContactToStorage({
      ...fullDetails,
      name: chosenName,
      mobile: chosenMobile,
      category: chosenCategory,
      cropName: matchingCrop?.name || fullDetails.cropName,
      sellingQuantity: chosenQty,
      rate: chosenRate,
      pickupLocation: chosenLocation,
    });

    setIsDropdownOpen(false);
  };

  const handleSelectBuyer = handleSelectContact;

  const handleKeyDown = (e) => {
    if (!isDropdownOpen || matchingContacts.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveDropdownIndex((prev) => (prev + 1) % matchingContacts.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveDropdownIndex((prev) => (prev - 1 + matchingContacts.length) % matchingContacts.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (matchingContacts[activeDropdownIndex]) {
        handleSelectContact(matchingContacts[activeDropdownIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsDropdownOpen(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
    if (submitError) {
      setSubmitError(null);
    }
  };

  const qty = Number(formData.sellingQuantity) || 0;
  const rate = Number(formData.rate) || 0;
  const totalAmount = qty * rate;
  const expectedPayDate = calculateExpectedPaymentDate(new Date(), 3);

  const validate = () => {
    const errs = {};
    const nameErr = validateName(formData.buyerName);
    if (nameErr) errs.buyerName = nameErr;

    const mobileErr = validateMobile(formData.buyerMobile);
    if (mobileErr) errs.buyerMobile = mobileErr;

    if (!selectedCrop) {
      errs.cropName = 'Please select an available crop.';
    }
    if (qty <= 0) {
      errs.sellingQuantity = 'Quantity must be greater than zero.';
    } else if (selectedCrop && qty > selectedCrop.availableQuantity) {
      errs.sellingQuantity = `Cannot sell more than available stock (${selectedCrop.availableQuantity} ${selectedCrop.unit}).`;
    }
    if (rate <= 0) {
      errs.rate = 'Price per unit must be greater than zero.';
    }
    if (!formData.expectedPickupDate) {
      errs.expectedPickupDate = 'Expected pickup date is required.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate() || isSubmitting) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const result = await createSale(formData);
      if (result) {
        setCreatedResult(result);

        // Save newly entered / updated buyer details to persistent memory
        saveContactToStorage({
          id: `BUYER-${Date.now()}`,
          name: formData.buyerName.trim(),
          businessName: formData.buyerName.trim(),
          contactPerson: formData.buyerName.trim(),
          mobile: formData.buyerMobile.trim(),
          category: formData.buyerCategory,
          cropName: formData.cropName,
          sellingQuantity: formData.sellingQuantity,
          rate: formData.rate,
          qualityGrade: formData.qualityGrade,
          pickupLocation: formData.pickupLocation,
          lastOrder: new Date().toISOString().split('T')[0],
        });

        if (onSaleCreated) onSaleCreated(result);
      }
    } catch (err) {
      console.warn('Error creating sale:', err);
      setSubmitError(err?.message || 'Failed to create sale order. Please check inputs and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setCreatedResult(null);
    setSubmitError(null);
    setAutoFillNotice(null);
    setFormData({
      buyerCategory: buyerCategories[0]?.code || 'Middleman',
      buyerName: '',
      buyerMobile: '',
      cropId: crops[0]?.id || '',
      cropName: crops[0]?.name || '',
      sellingQuantity: '',
      rate: crops[0]?.expectedSellingPrice || '',
      qualityGrade: crops[0]?.qualityGrade || qualityGrades[0]?.code || 'Grade A',
      pickupLocation: `${profile.farmName || 'Farmer Warehouse'}, ${profile.village || 'Farm'}`,
      expectedPickupDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      notes: '',
    });
    setErrors({});
  };

  return (
    <div>
      {/* If newly created, show prominent success banner with action */}
      {createdResult && (
        <div
          style={{
            backgroundColor: '#E8F5EC',
            border: '2px solid #237A45',
            borderRadius: 16,
            padding: '24px',
            marginBottom: 24,
            animation: 'slideUp 0.3s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <span style={{ fontSize: '1.8rem' }}>🎉</span>
            <div>
              <h3 style={{ margin: 0, color: 'var(--farmer-dark)' }}>
                Sale Order Created Successfully!
              </h3>
              <p style={{ margin: '4px 0 0', color: 'var(--farmer-secondary)', fontSize: '0.92rem' }}>
                Transaction ID: <strong>{createdResult.transaction.id}</strong> • OTP Sent to{' '}
                <strong>{createdResult.transaction.buyerMobile}</strong>
                {createdResult.otpRequest?.otpCode && (
                  <span style={{ marginLeft: 8, color: 'var(--farmer-primary)', fontWeight: 700 }}>
                    [Demo Code: {createdResult.otpRequest.otpCode}]
                  </span>
                )}
              </p>
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 12,
              padding: '16px',
              backgroundColor: '#FFFFFF',
              borderRadius: 12,
              marginBottom: 16,
              fontSize: '0.88rem',
            }}
          >
            <div>
              <span style={{ color: 'var(--farmer-secondary)', display: 'block', fontSize: '0.78rem' }}>BUYER</span>
              <strong>{createdResult.transaction.buyerName}</strong>
              <small style={{ display: 'block', color: 'var(--farmer-secondary)' }}>
                {createdResult.transaction.buyerCategory}
              </small>
            </div>
            <div>
              <span style={{ color: 'var(--farmer-secondary)', display: 'block', fontSize: '0.78rem' }}>CROP & QUANTITY</span>
              <strong>{createdResult.transaction.cropName}</strong>
              <div>{createdResult.transaction.quantity} {createdResult.transaction.unit}</div>
            </div>
            <div>
              <span style={{ color: 'var(--farmer-secondary)', display: 'block', fontSize: '0.78rem' }}>AMOUNT</span>
              <strong style={{ color: 'var(--farmer-primary)', fontSize: '1.1rem' }}>
                {formatCurrency(createdResult.transaction.totalAmount)}
              </strong>
            </div>
            <div>
              <span style={{ color: 'var(--farmer-secondary)', display: 'block', fontSize: '0.78rem' }}>EXPECTED PAYMENT</span>
              <strong>{formatDate(createdResult.transaction.expectedPaymentDate)}</strong>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button
              type="button"
              className="farmer-btn farmer-btn-primary"
              onClick={() => setActiveOtpRequest(createdResult.otpRequest)}
            >
              🔑 Enter OTP Confirmation Now
            </button>
            <button
              type="button"
              className="farmer-btn farmer-btn-outline"
              onClick={handleResetForm}
            >
              ➕ Create Another Sale
            </button>
          </div>
        </div>
      )}

      {/* Submission Error Banner */}
      {submitError && (
        <div
          style={{
            padding: '12px 18px',
            marginBottom: 20,
            borderRadius: 10,
            background: '#FEF2F2',
            border: '1px solid #FCA5A5',
            color: '#991B1B',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.88rem',
          }}
        >
          <span>⚠️ {submitError}</span>
          <button
            type="button"
            onClick={() => setSubmitError(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#991B1B' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Auto-filled details banner */}
      {autoFillNotice && (
        <div
          style={{
            padding: '10px 16px',
            marginBottom: 18,
            borderRadius: 12,
            background: '#ECFDF5',
            border: '1px solid #A7F3D0',
            color: '#065F46',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.84rem',
            animation: 'fadeIn 0.2s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              Auto-filled saved details for <strong>{autoFillNotice.name}</strong>
              {autoFillNotice.person && autoFillNotice.person !== autoFillNotice.name && (
                <span style={{ color: '#047857' }}> (Contact: {autoFillNotice.person})</span>
              )} • Mobile:{' '}
              <strong className="font-mono">{autoFillNotice.mobile}</strong> • Category:{' '}
              <span className="font-semibold">{autoFillNotice.category}</span>
              {autoFillNotice.crop && ` • Preferred Crop: ${autoFillNotice.crop}`}
              {autoFillNotice.qty && ` (${autoFillNotice.qty} qtl)`}
              {autoFillNotice.rate && ` @ ₹${autoFillNotice.rate}`}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setAutoFillNotice(null)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#065F46',
              padding: 2,
            }}
            title="Dismiss notice"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Grid: Form on Left, Live Transaction Summary on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Sales Form Card */}
        <div className="lg:col-span-7 xl:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-7">
          <div className="border-b border-slate-100 pb-4 mb-5 flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="text-xl font-bold text-slate-900 tracking-tight">Create Farmer Sale Order</h3>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#CCFBF1] text-[#0F766E] border border-[#14B8A6]/40 shadow-2xs">
                  {formData.buyerCategory === 'Vendor' ? (
                    <Building2 className="w-3.5 h-3.5" />
                  ) : formData.buyerCategory === 'Customer' ? (
                    <Users className="w-3.5 h-3.5" />
                  ) : (
                    <UserCheck className="w-3.5 h-3.5" />
                  )}
                  <span>Category: {formData.buyerCategory}</span>
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Initiating sale order to <strong className="text-[#0F766E]">{formData.buyerCategory}</strong> parties with OTP stock deduction
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} autoComplete="off">
            {/* Buyer Category Selector Tabs (Middleman, Vendor, Customer) */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <span>Buyer Category *</span>
                </label>
                <span className="text-xs font-semibold text-slate-500">
                  Selling to: <strong className="text-[#0F766E] font-bold">{formData.buyerCategory}</strong>
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 p-1.5 bg-slate-100/90 rounded-2xl border border-slate-200 shadow-inner">
                {buyerCategories.map((cat) => {
                  const isSelected = formData.buyerCategory.toLowerCase() === cat.code.toLowerCase();
                  const Icon = cat.code === 'Vendor' ? Building2 : cat.code === 'Customer' ? Users : UserCheck;

                  return (
                    <button
                      key={cat.code}
                      type="button"
                      onClick={() => handleCategoryChange(cat.code)}
                      className={`py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-white text-[#0F766E] shadow-sm border border-slate-200 ring-2 ring-[#0F766E]/20'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isSelected ? 'text-[#0F766E]' : 'text-slate-400'}`} />
                      <span>{cat.name || cat.code}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Buyer Name with Predictive Dropdown & Mobile Number with Live Validation */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {/* Buyer Name Input with Autocomplete Dropdown */}
              <div className="flex flex-col" ref={dropdownRef}>
                <div className="flex items-center justify-between mb-1.5 min-h-[18px]">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Buyer / Trading Firm Name *
                  </label>
                  {formData.buyerName.trim() && !errors.buyerName && (
                    <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                      <Check className="w-3 h-3 stroke-[3]" /> Valid
                    </span>
                  )}
                </div>

                <div className="relative">
                  <input
                    ref={nameInputRef}
                    type="text"
                    name="buyerName"
                    placeholder={
                      formData.buyerCategory === 'Vendor'
                        ? 'e.g. harsha, Kaveri Rice Mill, Annapurna Spices, Bhanu Traders'
                        : formData.buyerCategory === 'Customer'
                        ? 'e.g. vardani, Raju Kirana, Balaji Grain, Sai Ram Feeds, Rajesh Kumar'
                        : 'e.g. vardani, devi, Honey Traders, Bhanu Prasad, Sri Lakshmi Agencies'
                    }
                    value={formData.buyerName}
                    onChange={handleNameChange}
                    onFocus={() => setIsDropdownOpen(true)}
                    onKeyDown={handleKeyDown}
                    disabled={isSubmitting}
                    className={`w-full h-11 px-3.5 pr-8 bg-white border rounded-xl text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 ${
                      errors.buyerName
                        ? 'border-rose-400 focus:border-rose-500'
                        : formData.buyerName.trim() && !errors.buyerName
                        ? 'border-emerald-500 focus:border-emerald-600'
                        : 'border-slate-300 focus:border-[#0F766E]'
                    }`}
                  />
                  {formData.buyerName && (
                    <button
                      type="button"
                      onClick={() => {
                        setFormData((prev) => ({ ...prev, buyerName: '' }));
                        setErrors((prev) => ({ ...prev, buyerName: '' }));
                        setIsDropdownOpen(false);
                      }}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                      aria-label="Clear buyer name"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* Floating Predictive Dropdown with 300ms Debounce & Contacts API */}
                  {isDropdownOpen && (
                    <div className="absolute top-[calc(100%+4px)] left-0 right-0 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 max-h-72 overflow-y-auto">
                      <div className="px-3.5 py-2 bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-[#0F766E]" />
                          <span>
                            {formData.buyerCategory} Contacts ({matchingContacts.length})
                          </span>
                        </span>
                        <span className="text-[10px] text-[#0F766E] normal-case">
                          {isLoadingContacts ? 'Searching...' : 'Click to auto-fill'}
                        </span>
                      </div>

                      {/* Loading State Spinner */}
                      {isLoadingContacts && (
                        <div className="p-4 text-center flex items-center justify-center gap-2 text-xs font-semibold text-slate-500">
                          <div className="w-4 h-4 border-2 border-[#0F766E] border-t-transparent rounded-full animate-spin" />
                          <span>Searching {formData.buyerCategory} contacts...</span>
                        </div>
                      )}

                      {/* Contact Suggestions List */}
                      {!isLoadingContacts && matchingContacts.length > 0 && (
                        <div className="p-1.5 space-y-0.5">
                          {matchingContacts.map((contact, idx) => {
                            const style = buyerCategoryStyles[contact.category] || {
                              bg: '#F1F5F9',
                              color: '#475569',
                            };
                            const isSelected = idx === activeDropdownIndex;
                            const query = (formData.buyerName || '').trim();
                            const displayName = contact.name || contact.businessName || 'Agricultural Buyer';
                            const contactPerson = contact.contactPerson && contact.contactPerson !== displayName ? contact.contactPerson : (contact.businessName && contact.businessName !== displayName ? contact.businessName : null);
                            const initials = (displayName || 'AB').slice(0, 2).toUpperCase();

                            const renderHighlight = (text, q) => {
                              if (!text) return null;
                              const queryStr = (q || '').trim().toLowerCase();
                              if (!queryStr) return text;
                              const lower = text.toLowerCase();
                              const matchIdx = lower.indexOf(queryStr);
                              if (matchIdx < 0) return text;
                              return (
                                <>
                                  {text.slice(0, matchIdx)}
                                  <span className="text-[#0F766E] bg-[#CCFBF1] font-bold px-0.5 rounded">
                                    {text.slice(matchIdx, matchIdx + queryStr.length)}
                                  </span>
                                  {text.slice(matchIdx + queryStr.length)}
                                </>
                              );
                            };

                            return (
                              <div
                                key={contact.id || contact.name + idx}
                                onClick={() => handleSelectContact(contact)}
                                onMouseEnter={() => setActiveDropdownIndex(idx)}
                                className={`p-2.5 rounded-xl cursor-pointer flex items-center justify-between gap-3 transition-colors ${
                                  isSelected ? 'bg-[#CCFBF1]' : 'hover:bg-slate-50'
                                }`}
                              >
                                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                  <div
                                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${
                                      isSelected ? 'bg-[#0F766E] text-white' : 'bg-teal-50 text-teal-700 border border-teal-200'
                                    }`}
                                  >
                                    {initials}
                                  </div>

                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="text-sm font-bold text-slate-900 truncate">
                                        {renderHighlight(displayName, query)}
                                      </span>
                                      {contactPerson && (
                                        <span className="text-[11px] font-semibold text-[#0F766E] bg-teal-50 border border-teal-200 px-1.5 py-0.2 rounded-md inline-flex items-center gap-1">
                                          👤 {renderHighlight(contactPerson, query)}
                                        </span>
                                      )}
                                    </div>

                                    <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5 flex-wrap">
                                      <span className="font-mono font-semibold text-slate-700 flex items-center gap-1">
                                        <Phone className="w-2.5 h-2.5 text-[#0F766E]" /> {contact.mobile}
                                      </span>
                                      {contact.pickupLocation && (
                                        <span className="truncate max-w-[130px]">
                                          • {contact.pickupLocation.split(',')[0]}
                                        </span>
                                      )}
                                      {contact.cropName && (
                                        <span className="text-emerald-700 font-semibold truncate">
                                          • {contact.cropName} ({contact.sellingQuantity || 25} qtl @ ₹{contact.rate})
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0">
                                  <span
                                    className="px-2 py-0.5 rounded-md text-[11px] font-bold"
                                    style={{ backgroundColor: style.bg, color: style.color }}
                                  >
                                    {contact.category}
                                  </span>
                                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Empty State */}
                      {!isLoadingContacts && matchingContacts.length === 0 && (
                        <div className="p-4 text-center">
                          <p className="m-0 text-xs font-semibold text-slate-600">
                            No {formData.buyerCategory} contacts found matching &quot;{formData.buyerName}&quot;
                          </p>
                          <p className="m-0 mt-1 text-[11px] text-slate-400">
                            Manual entry enabled — continue typing buyer name &amp; mobile number.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="min-h-[18px] mt-1.5 flex items-center text-xs">
                  {errors.buyerName ? (
                    <span className="text-rose-600 font-semibold flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      {errors.buyerName}
                    </span>
                  ) : (
                    <span className="text-slate-500">
                      Type letters to search {formData.buyerCategory} contacts
                    </span>
                  )}
                </div>
              </div>

              {/* Buyer Mobile Number with Real-Time Format & Digit Validation */}
              <div className="flex flex-col">
                <div className="flex items-center justify-between mb-1.5 min-h-[18px]">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Buyer Mobile Number (For OTP) *
                  </label>
                  <span
                    className={`text-[11px] font-bold font-mono px-2 py-0.5 rounded-md ${
                      formData.buyerMobile.length === 10 && /^[6-9]/.test(formData.buyerMobile)
                        ? 'bg-emerald-100 text-emerald-700'
                        : formData.buyerMobile.length > 0
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {formData.buyerMobile.length === 10 && /^[6-9]/.test(formData.buyerMobile)
                      ? '10 Digits ✓'
                      : `${formData.buyerMobile.length}/10 Digits`}
                  </span>
                </div>

                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold font-mono text-slate-500 pointer-events-none">
                    +91
                  </span>
                  <input
                    type="tel"
                    inputMode="numeric"
                    name="buyerMobile"
                    maxLength={10}
                    placeholder="9848012345"
                    value={formData.buyerMobile}
                    onChange={handleMobileChange}
                    disabled={isSubmitting}
                    className={`w-full h-11 pl-12 pr-10 bg-white border rounded-xl text-sm font-mono font-medium transition-all focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 ${
                      errors.buyerMobile
                        ? 'border-rose-400 focus:border-rose-500'
                        : formData.buyerMobile.length === 10 && /^[6-9]/.test(formData.buyerMobile)
                        ? 'border-emerald-500 focus:border-emerald-600'
                        : 'border-slate-300 focus:border-[#0F766E]'
                    }`}
                  />
                  {formData.buyerMobile.length === 10 && /^[6-9]/.test(formData.buyerMobile) && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-600 pointer-events-none">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                  )}
                </div>

                <div className="min-h-[18px] mt-1.5 flex items-center text-xs">
                  {errors.buyerMobile ? (
                    <span className="text-rose-600 font-semibold flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      {errors.buyerMobile}
                    </span>
                  ) : (
                    <span className="text-slate-500">
                      OTP verification code sent to this mobile for stock delivery
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Crop Selection & Available Stock Notice */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="flex flex-col">
                <div className="flex items-center justify-between mb-1.5 min-h-[18px]">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Select Crop *
                  </label>
                </div>
                <select
                  name="cropName"
                  value={formData.cropName}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className="w-full h-11 px-3.5 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/20"
                >
                  {(crops || []).map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name} ({c.variety}) - Available: {c.availableQuantity} {c.unit}
                    </option>
                  ))}
                </select>
                <div className="min-h-[18px] mt-1.5 flex items-center text-xs">
                  {selectedCrop && (
                    <span className={`font-semibold ${selectedCrop.availableQuantity < 50 ? 'text-amber-600' : 'text-teal-700'}`}>
                      Current Available Stock: {selectedCrop.availableQuantity} {selectedCrop.unit}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-col">
                <div className="flex items-center justify-between mb-1.5 min-h-[18px]">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Quality Grade
                  </label>
                </div>
                <select
                  name="qualityGrade"
                  value={formData.qualityGrade}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className="w-full h-11 px-3.5 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/20"
                >
                  {qualityGrades.map((g) => (
                    <option key={g.code} value={g.code}>
                      {g.label || g.code}
                    </option>
                  ))}
                </select>
                <div className="min-h-[18px] mt-1.5 flex items-center text-xs text-slate-500">
                  Standardized AGMARK / Mandi quality specifications
                </div>
              </div>
            </div>

            {/* Selling Quantity & Price */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="flex flex-col">
                <div className="flex items-center justify-between mb-1.5 min-h-[18px]">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Selling Quantity ({selectedCrop?.unit || 'qtl'}) *
                  </label>
                </div>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  name="sellingQuantity"
                  placeholder={`Max: ${selectedCrop?.availableQuantity || 0}`}
                  value={formData.sellingQuantity}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className={`w-full h-11 px-3.5 bg-white border rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 ${
                    errors.sellingQuantity ? 'border-rose-400 focus:border-rose-500' : 'border-slate-300 focus:border-[#0F766E]'
                  }`}
                />
                <div className="min-h-[18px] mt-1.5 flex items-center text-xs">
                  {errors.sellingQuantity ? (
                    <span className="text-rose-600 font-semibold">{errors.sellingQuantity}</span>
                  ) : (
                    <span className="text-slate-500">
                      Maximum deductible from stock: {selectedCrop?.availableQuantity || 0} {selectedCrop?.unit || 'qtl'}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-col">
                <div className="flex items-center justify-between mb-1.5 min-h-[18px]">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Price per {selectedCrop?.unit || 'unit'} (₹) *
                  </label>
                </div>
                <input
                  type="number"
                  step="1"
                  min="0.01"
                  name="rate"
                  placeholder="Price in INR"
                  value={formData.rate}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className={`w-full h-11 px-3.5 bg-white border rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 ${
                    errors.rate ? 'border-rose-400 focus:border-rose-500' : 'border-slate-300 focus:border-[#0F766E]'
                  }`}
                />
                <div className="min-h-[18px] mt-1.5 flex items-center text-xs">
                  {errors.rate ? (
                    <span className="text-rose-600 font-semibold">{errors.rate}</span>
                  ) : (
                    <span className="text-slate-500">
                      Modal APMC yard benchmark rate
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Pickup Location & Expected Date */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="flex flex-col">
                <div className="flex items-center justify-between mb-1.5 min-h-[18px]">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Pickup / Loading Location *
                  </label>
                </div>
                <input
                  type="text"
                  name="pickupLocation"
                  placeholder="Farm warehouse or aggregation point"
                  value={formData.pickupLocation}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className="w-full h-11 px-3.5 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/20"
                />
                <div className="min-h-[18px] mt-1.5 flex items-center text-xs text-slate-500">
                  Farm gate or primary collection center
                </div>
              </div>

              <div className="flex flex-col">
                <div className="flex items-center justify-between mb-1.5 min-h-[18px]">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Expected Pickup Date *
                  </label>
                </div>
                <input
                  type="date"
                  name="expectedPickupDate"
                  value={formData.expectedPickupDate}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className={`w-full h-11 px-3.5 bg-white border rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 ${
                    errors.expectedPickupDate ? 'border-rose-400 focus:border-rose-500' : 'border-slate-300 focus:border-[#0F766E]'
                  }`}
                />
                <div className="min-h-[18px] mt-1.5 flex items-center text-xs">
                  {errors.expectedPickupDate ? (
                    <span className="text-rose-600 font-semibold">{errors.expectedPickupDate}</span>
                  ) : (
                    <span className="text-slate-500">
                      Scheduled vehicle arrival window
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Additional Terms / Dispatch Notes */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-1.5 min-h-[18px]">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Additional Terms / Dispatch Notes (Optional)
                </label>
              </div>
              <textarea
                rows={2}
                name="notes"
                placeholder="Moisture standards, weighing slip requirements, transportation arrangements..."
                value={formData.notes}
                onChange={handleChange}
                disabled={isSubmitting}
                className="w-full p-3 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-[#0F766E]/20 resize-y"
              />
              <div className="min-h-[18px] mt-1 flex items-center text-xs text-slate-500">
                Included in the digital bill of loading and SMS verification dispatch note
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleResetForm}
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 font-semibold text-sm hover:bg-slate-50 hover:border-slate-400 transition-colors cursor-pointer shadow-2xs"
              >
                Clear Form
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl bg-[#0F766E] hover:bg-[#0D625C] text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer disabled:opacity-70"
              >
                {isSubmitting ? 'Submitting Sale...' : 'Submit Sale & Send OTP Request'}
              </button>
            </div>
          </form>
        </div>

        {/* Live Transaction Preview & Calculation Card */}
        <div className="lg:col-span-5 xl:col-span-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sticky top-24">
            <div className="flex items-center justify-between pb-3.5 mb-3 border-b border-slate-100">
              <h4 className="text-base font-bold text-slate-900 tracking-tight">
                Transaction Summary
              </h4>
              <span className="bg-teal-50 text-teal-700 border border-teal-200/80 px-2.5 py-0.5 rounded-full text-[11px] font-bold">
                LIVE PREVIEW
              </span>
            </div>

            {/* Calculations Breakdown */}
            <div className="space-y-3 text-xs sm:text-sm">
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Crop Selected:</span>
                <span className="font-bold text-slate-900 text-right">
                  {selectedCrop ? `${selectedCrop.name} (${selectedCrop.variety})` : '-'}
                </span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Selling Quantity:</span>
                <span className="font-bold text-slate-900">
                  {qty > 0 ? `${qty} ${selectedCrop?.unit || 'qtl'}` : '-'}
                </span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Unit Rate:</span>
                <span className="font-bold text-slate-900">
                  {rate > 0 ? `${formatCurrency(rate)} / ${selectedCrop?.unit || 'qtl'}` : '-'}
                </span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Buyer:</span>
                <span className={`font-bold ${formData.buyerName ? 'text-slate-900' : 'text-slate-400'}`}>
                  {formData.buyerName || 'Not specified'}
                </span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Buyer Mobile:</span>
                <span className="font-mono font-bold text-slate-800">
                  {formData.buyerMobile ? `+91 ${formData.buyerMobile}` : '-'}
                </span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Buyer Category:</span>
                <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200">
                  {formData.buyerCategory}
                </span>
              </div>

              {/* Total Calculation Highlight Box */}
              <div className="rounded-2xl p-4 bg-gradient-to-br from-emerald-50 to-teal-50/70 border border-emerald-200 shadow-2xs my-4">
                <span className="text-[11px] font-bold text-emerald-800 tracking-wider uppercase block">
                  Total Transaction Amount
                </span>
                <div className="text-3xl font-extrabold text-[#0F766E] tracking-tight my-1">
                  {formatCurrency(totalAmount)}
                </div>
                <span className="text-xs text-emerald-700/90 block">
                  Calculated as: {qty || 0} {selectedCrop?.unit || 'qtl'} × {formatCurrency(rate)}
                </span>
              </div>

              <div className="rounded-xl p-3.5 bg-slate-50 border border-slate-200 text-xs text-slate-600 leading-relaxed">
                <div className="flex items-center gap-1.5 font-bold text-slate-800 mb-1">
                  <ShieldCheck className="w-4 h-4 text-[#0F766E] shrink-0" />
                  <span>Security &amp; Stock Guarantee</span>
                </div>
                <p className="m-0">
                  Stock is deducted only after recipient inputs their 6-digit OTP code. Payment is credited to your registered bank account within 3 business days ({formatDate(expectedPayDate)}).
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SalesForm;
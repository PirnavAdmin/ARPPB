import { useState, useEffect, useRef, useMemo } from 'react';
import {
  Check,
  Phone,
  User,
  Building2,
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

// Directory of frequent buyers / traders for instant autocomplete & recall
const DEFAULT_SAVED_BUYERS = [
  {
    id: 'B001',
    name: 'Bhanu Prasad',
    mobile: '9848012345',
    category: 'Middleman',
    cropName: 'Paddy',
    sellingQuantity: '50',
    rate: '910.01',
    qualityGrade: 'Grade A',
    pickupLocation: 'Kurnool APMC Market Yard, Shop #12',
    lastOrder: '15 Nov 2026',
    totalPurchases: '₹4,55,000',
  },
  {
    id: 'B002',
    name: 'Bhanu Traders',
    mobile: '9876543210',
    category: 'Vendor',
    cropName: 'Turmeric',
    sellingQuantity: '25',
    rate: '8400',
    qualityGrade: 'Grade A',
    pickupLocation: 'Duggirala Turmeric Terminal, Guntur',
    lastOrder: '10 Nov 2026',
    totalPurchases: '₹2,10,000',
  },
  {
    id: 'B003',
    name: 'Bhanumathi Agro Agencies',
    mobile: '9949123456',
    category: 'Middleman',
    cropName: 'Groundnut',
    sellingQuantity: '40',
    rate: '6100',
    qualityGrade: 'Grade B',
    pickupLocation: 'Adoni Mandi Shed #4',
    lastOrder: '28 Oct 2026',
    totalPurchases: '₹2,44,000',
  },
  {
    id: 'B004',
    name: 'Srinivasa Traders',
    mobile: '9849011223',
    category: 'Middleman',
    cropName: 'Paddy',
    sellingQuantity: '60',
    rate: '910.01',
    qualityGrade: 'Grade A',
    pickupLocation: 'Kurnool APMC Yard, Gate 2',
    lastOrder: '18 Nov 2026',
    totalPurchases: '₹5,46,000',
  },
  {
    id: 'B005',
    name: 'ITC Agri Business Hub',
    mobile: '9440188990',
    category: 'Vendor',
    cropName: 'Turmeric',
    sellingQuantity: '30',
    rate: '8400',
    qualityGrade: 'Grade A',
    pickupLocation: 'ITC Procurement Centre, Guntur',
    lastOrder: '04 Nov 2026',
    totalPurchases: '₹2,52,000',
  },
  {
    id: 'B006',
    name: 'Rajesh Kumar',
    mobile: '9123456789',
    category: 'Customer',
    cropName: 'Groundnut',
    sellingQuantity: '10',
    rate: '6100',
    qualityGrade: 'Grade A',
    pickupLocation: 'Farmer Warehouse, Tanuku',
    lastOrder: '02 Nov 2026',
    totalPurchases: '₹61,000',
  },
  {
    id: 'B007',
    name: 'Sri Balaji Traders',
    mobile: '9848223344',
    category: 'Middleman',
    cropName: 'Maize',
    sellingQuantity: '55',
    rate: '2250',
    qualityGrade: 'Grade A',
    pickupLocation: 'Nandyal Mandi, Platform #3',
    lastOrder: '24 Oct 2026',
    totalPurchases: '₹1,23,750',
  },
  {
    id: 'B008',
    name: 'Lakshmi Agro Exports',
    mobile: '9866123456',
    category: 'Vendor',
    cropName: 'Paddy',
    sellingQuantity: '80',
    rate: '920',
    qualityGrade: 'Grade A',
    pickupLocation: 'Kakinada Port Terminal',
    lastOrder: '20 Oct 2026',
    totalPurchases: '₹7,36,000',
  },
];

const getSavedBuyersDirectory = (pastSales) => {
  let stored = [];
  try {
    const raw = localStorage.getItem('farmer_saved_buyers');
    if (raw) stored = JSON.parse(raw);
  } catch (e) {
    console.warn('Could not read saved buyers from storage:', e);
  }

  const map = new Map();

  // 1. Initial defaults
  DEFAULT_SAVED_BUYERS.forEach((b) => {
    map.set(b.name.toLowerCase().trim(), b);
  });

  // 2. Past sales from FarmerContext
  (pastSales || []).forEach((s) => {
    if (s.buyerName) {
      const key = s.buyerName.toLowerCase().trim();
      if (!map.has(key)) {
        map.set(key, {
          id: `SALE-${s.id}`,
          name: s.buyerName,
          mobile: s.buyerMobile || '',
          category: s.buyerCategory || 'Middleman',
          cropName: s.cropName || '',
          sellingQuantity: String(s.quantity || ''),
          rate: String(s.rate || ''),
          qualityGrade: s.qualityGrade || 'Grade A',
          pickupLocation: s.pickupLocation || '',
          lastOrder: s.date || 'Previous Sale',
          totalPurchases: s.totalAmount ? formatCurrency(s.totalAmount) : '',
        });
      }
    }
  });

  // 3. User saved modifications in localStorage
  if (Array.isArray(stored)) {
    stored.forEach((b) => {
      if (b && b.name) {
        const key = b.name.toLowerCase().trim();
        map.set(key, { ...(map.get(key) || {}), ...b });
      }
    });
  }

  return Array.from(map.values());
};

function SalesForm({ onSaleCreated }) {
  const { crops, profile, createSale, sales, salesOptions, setActiveOtpRequest } = useFarmer();

  const options = salesOptions || DEFAULT_SALES_OPTIONS;
  const buyerCategories = options.buyerCategories?.length ? options.buyerCategories : DEFAULT_SALES_OPTIONS.buyerCategories;
  const qualityGrades = options.qualityGrades?.length ? options.qualityGrades : DEFAULT_SALES_OPTIONS.qualityGrades;

  const [formData, setFormData] = useState({
    buyerCategory: buyerCategories[0]?.code || 'Middleman',
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

  // Predictive Auto-Complete States
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [activeDropdownIndex, setActiveDropdownIndex] = useState(0);
  const [autoFillNotice, setAutoFillNotice] = useState(null);
  const dropdownRef = useRef(null);
  const nameInputRef = useRef(null);

  // Directory of all saved buyers merged from defaults, previous sales, and localStorage
  const savedBuyers = useMemo(() => getSavedBuyersDirectory(sales), [sales]);

  // Filtered buyers matching the typed query
  const matchingBuyers = useMemo(() => {
    const q = formData.buyerName.trim().toLowerCase();
    if (!q) {
      return savedBuyers.slice(0, 6);
    }

    return savedBuyers
      .filter((b) => {
        const n = b.name.toLowerCase();
        const m = b.mobile || '';
        return n.includes(q) || m.includes(q);
      })
      .sort((a, b) => {
        const aName = a.name.toLowerCase();
        const bName = b.name.toLowerCase();
        const aStarts = aName.startsWith(q);
        const bStarts = bName.startsWith(q);
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;
        return aName.localeCompare(bName);
      });
  }, [savedBuyers, formData.buyerName]);

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
    // Only letters, spaces, dots, ampersand, apostrophe, hyphens allowed
    if (!/^[a-zA-Z\s.&'-]+$/.test(name)) {
      return "Name should only contain letters, spaces, dots and '&' (e.g., Bhanu Prasad, Srinivasa Traders).";
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

  const handleSelectBuyer = (buyer) => {
    // Find matching crop in farmer crops if buyer has a past/preferred crop
    const matchingCrop = (crops || []).find(
      (c) => c.name.toLowerCase() === (buyer.cropName || '').toLowerCase()
    ) || selectedCrop;

    const newQty = buyer.sellingQuantity && matchingCrop
      ? Math.min(Number(buyer.sellingQuantity) || 10, Number(matchingCrop.availableQuantity) || 10)
      : formData.sellingQuantity;

    setFormData((prev) => ({
      ...prev,
      buyerName: buyer.name,
      buyerMobile: buyer.mobile,
      buyerCategory: buyer.category || prev.buyerCategory,
      cropId: matchingCrop ? matchingCrop.id : prev.cropId,
      cropName: matchingCrop ? matchingCrop.name : prev.cropName,
      sellingQuantity: newQty ? String(newQty) : prev.sellingQuantity,
      rate: buyer.rate || matchingCrop?.expectedSellingPrice || prev.rate,
      qualityGrade: buyer.qualityGrade || matchingCrop?.qualityGrade || prev.qualityGrade,
      pickupLocation: buyer.pickupLocation || prev.pickupLocation,
    }));

    setErrors((prev) => ({
      ...prev,
      buyerName: '',
      buyerMobile: '',
    }));

    setAutoFillNotice({
      name: buyer.name,
      mobile: buyer.mobile,
      category: buyer.category,
      crop: buyer.cropName || (matchingCrop ? matchingCrop.name : ''),
      qty: newQty,
      rate: buyer.rate,
    });

    setIsDropdownOpen(false);
  };

  const handleKeyDown = (e) => {
    if (!isDropdownOpen || matchingBuyers.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveDropdownIndex((prev) => (prev + 1) % matchingBuyers.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveDropdownIndex((prev) => (prev - 1 + matchingBuyers.length) % matchingBuyers.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (matchingBuyers[activeDropdownIndex]) {
        handleSelectBuyer(matchingBuyers[activeDropdownIndex]);
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

  const saveBuyerToStorage = (buyerData) => {
    try {
      const raw = localStorage.getItem('farmer_saved_buyers');
      const existing = raw ? JSON.parse(raw) : [];
      const updated = [
        buyerData,
        ...existing.filter((b) => b.name.toLowerCase() !== buyerData.name.toLowerCase()),
      ];
      localStorage.setItem('farmer_saved_buyers', JSON.stringify(updated.slice(0, 50)));
    } catch (e) {
      console.warn('Could not persist buyer to storage:', e);
    }
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
        saveBuyerToStorage({
          id: `BUYER-${Date.now()}`,
          name: formData.buyerName.trim(),
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
              Auto-filled saved details for <strong>{autoFillNotice.name}</strong> (Mobile:{' '}
              <strong className="font-mono">{autoFillNotice.mobile}</strong> • Category:{' '}
              <span className="font-semibold">{autoFillNotice.category}</span>
              {autoFillNotice.crop && ` • Preferred Crop: ${autoFillNotice.crop}`}
              {autoFillNotice.qty && ` ${autoFillNotice.qty} qtl`})
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
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 0.9fr', gap: 24 }}>
        {/* Sales Form Card */}
        <div className="farmer-card" style={{ padding: '24px' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '1.25rem' }}>Create Farmer Sale Order</h3>

          <form onSubmit={handleSubmit} autoComplete="off">
            {/* Buyer Category Segmented Buttons */}
            <div className="farmer-form-group">
              <label>Buyer Category *</label>
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(${buyerCategories.length}, 1fr)`, gap: 10 }}>
                {buyerCategories.map((cat) => (
                  <button
                    key={cat.code}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, buyerCategory: cat.code }))}
                    disabled={isSubmitting}
                    style={{
                      padding: '10px 12px',
                      borderRadius: 10,
                      border: formData.buyerCategory === cat.code ? '2px solid var(--farmer-primary)' : '1px solid var(--farmer-border)',
                      backgroundColor: formData.buyerCategory === cat.code ? 'var(--farmer-light)' : '#FCFDFC',
                      color: formData.buyerCategory === cat.code ? 'var(--farmer-dark)' : 'var(--farmer-text)',
                      fontWeight: formData.buyerCategory === cat.code ? 700 : 500,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    {cat.code}
                  </button>
                ))}
              </div>
            </div>

            {/* Buyer Name with Predictive Dropdown & Mobile Number with Live Validation */}
            <div className="farmer-form-row">
              {/* Buyer Name Input with Autocomplete Dropdown */}
              <div
                className="farmer-form-group"
                ref={dropdownRef}
                style={{ position: 'relative' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label>Buyer / Trading Firm Name *</label>
                  {formData.buyerName.trim() && !errors.buyerName && (
                    <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                      <Check className="w-3 h-3 stroke-[3]" /> Valid
                    </span>
                  )}
                </div>

                <div style={{ position: 'relative' }}>
                  <input
                    ref={nameInputRef}
                    type="text"
                    name="buyerName"
                    placeholder="e.g. Bhanu Prasad, Srinivasa Traders, ITC Agri Buy"
                    value={formData.buyerName}
                    onChange={handleNameChange}
                    onFocus={() => setIsDropdownOpen(true)}
                    onKeyDown={handleKeyDown}
                    disabled={isSubmitting}
                    style={{
                      paddingRight: formData.buyerName ? '32px' : '14px',
                      borderColor: errors.buyerName
                        ? 'var(--farmer-danger)'
                        : formData.buyerName.trim() && !errors.buyerName
                        ? '#10B981'
                        : undefined,
                    }}
                  />
                  {formData.buyerName && (
                    <button
                      type="button"
                      onClick={() => {
                        setFormData((prev) => ({ ...prev, buyerName: '' }));
                        setErrors((prev) => ({ ...prev, buyerName: '' }));
                        setIsDropdownOpen(false);
                      }}
                      style={{
                        position: 'absolute',
                        right: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: '#94A3B8',
                        cursor: 'pointer',
                        padding: 0,
                      }}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {errors.buyerName && (
                  <small style={{ color: 'var(--farmer-danger)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    {errors.buyerName}
                  </small>
                )}

                {/* Floating Predictive Dropdown */}
                {isDropdownOpen && matchingBuyers.length > 0 && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 4px)',
                      left: 0,
                      right: 0,
                      backgroundColor: '#FFFFFF',
                      borderRadius: 14,
                      boxShadow: '0 12px 30px -4px rgba(15, 23, 42, 0.18), 0 4px 12px rgba(15, 23, 42, 0.08)',
                      border: '1px solid #E2E8F0',
                      zIndex: 60,
                      maxHeight: '280px',
                      overflowY: 'auto',
                    }}
                  >
                    <div
                      style={{
                        padding: '8px 14px',
                        backgroundColor: '#F8FAFC',
                        borderBottom: '1px solid #E2E8F0',
                        fontSize: '11px',
                        fontWeight: 700,
                        color: '#64748B',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <span>
                        {formData.buyerName.trim()
                          ? `Matching Saved Buyers (${matchingBuyers.length})`
                          : 'Frequent Buyers / Saved Contacts'}
                      </span>
                      <span style={{ fontSize: '10px', color: '#0F766E' }}>
                        Click to auto-fill
                      </span>
                    </div>

                    <div style={{ padding: '4px' }}>
                      {matchingBuyers.map((buyer, idx) => {
                        const style = buyerCategoryStyles[buyer.category] || {
                          bg: '#F1F5F9',
                          color: '#475569',
                        };
                        const isSelected = idx === activeDropdownIndex;

                        // Match highlighting
                        const query = formData.buyerName.trim().toLowerCase();
                        const nameLower = buyer.name.toLowerCase();
                        const matchIndex = nameLower.indexOf(query);

                        return (
                          <div
                            key={buyer.id || buyer.name + idx}
                            onClick={() => handleSelectBuyer(buyer)}
                            onMouseEnter={() => setActiveDropdownIndex(idx)}
                            style={{
                              padding: '10px 12px',
                              borderRadius: 10,
                              cursor: 'pointer',
                              backgroundColor: isSelected ? '#CCFBF1' : 'transparent',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: 10,
                              transition: 'background-color 0.15s ease',
                              borderBottom: idx === matchingBuyers.length - 1 ? 'none' : '1px solid #F1F5F9',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                              <div
                                style={{
                                  width: 34,
                                  height: 34,
                                  borderRadius: 10,
                                  backgroundColor: isSelected ? '#0F766E' : '#E0F2FE',
                                  color: isSelected ? '#FFFFFF' : '#0369A1',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontWeight: 800,
                                  fontSize: '0.78rem',
                                  flexShrink: 0,
                                  transition: 'all 0.15s',
                                }}
                              >
                                {buyer.name.slice(0, 2).toUpperCase()}
                              </div>

                              <div style={{ minWidth: 0 }}>
                                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0F172A' }}>
                                  {query && matchIndex >= 0 ? (
                                    <>
                                      {buyer.name.slice(0, matchIndex)}
                                      <span style={{ color: '#0F766E', textDecoration: 'underline' }}>
                                        {buyer.name.slice(matchIndex, matchIndex + query.length)}
                                      </span>
                                      {buyer.name.slice(matchIndex + query.length)}
                                    </>
                                  ) : (
                                    buyer.name
                                  )}
                                </div>
                                <div
                                  style={{
                                    fontSize: '0.75rem',
                                    color: '#64748B',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    marginTop: 2,
                                  }}
                                >
                                  <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontFamily: 'monospace' }}>
                                    <Phone className="w-2.5 h-2.5 text-[#0F766E]" /> {buyer.mobile}
                                  </span>
                                  {buyer.cropName && (
                                    <span>
                                      • Last: {buyer.cropName} ({buyer.sellingQuantity || 50} qtl)
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                              <span
                                style={{
                                  padding: '2px 8px',
                                  borderRadius: 6,
                                  fontSize: '0.7rem',
                                  fontWeight: 700,
                                  backgroundColor: style.bg,
                                  color: style.color,
                                }}
                              >
                                {buyer.category}
                              </span>
                              <ArrowRight className="w-3.5 h-3.5 text-[#64748B]" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Buyer Mobile Number with Real-Time Format & Digit Validation */}
              <div className="farmer-form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label>Buyer Mobile Number (for OTP Delivery) *</label>
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

                <div style={{ position: 'relative' }}>
                  <div
                    style={{
                      position: 'absolute',
                      left: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      fontSize: '0.86rem',
                      fontWeight: 700,
                      color: '#64748B',
                      fontFamily: 'monospace',
                    }}
                  >
                    +91
                  </div>
                  <input
                    type="tel"
                    inputMode="numeric"
                    name="buyerMobile"
                    maxLength={10}
                    placeholder="9848012345"
                    value={formData.buyerMobile}
                    onChange={handleMobileChange}
                    disabled={isSubmitting}
                    style={{
                      paddingLeft: '46px',
                      fontFamily: 'monospace',
                      fontWeight: 600,
                      borderColor: errors.buyerMobile
                        ? 'var(--farmer-danger)'
                        : formData.buyerMobile.length === 10 && /^[6-9]/.test(formData.buyerMobile)
                        ? '#10B981'
                        : undefined,
                    }}
                  />
                  {formData.buyerMobile.length === 10 && /^[6-9]/.test(formData.buyerMobile) && (
                    <div
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: '#10B981',
                      }}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                  )}
                </div>

                {errors.buyerMobile ? (
                  <small style={{ color: 'var(--farmer-danger)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    {errors.buyerMobile}
                  </small>
                ) : (
                  <small style={{ color: 'var(--farmer-secondary)' }}>
                    OTP verification code will be sent to this number upon order creation.
                  </small>
                )}
              </div>
            </div>

            {/* Crop Selection & Available Stock Notice */}
            <div className="farmer-form-row">
              <div className="farmer-form-group">
                <label>Select Crop *</label>
                <select
                  name="cropName"
                  value={formData.cropName}
                  onChange={handleChange}
                  disabled={isSubmitting}
                >
                  {(crops || []).map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name} ({c.variety}) - Available: {c.availableQuantity} {c.unit}
                    </option>
                  ))}
                </select>
                {selectedCrop && (
                  <small style={{ color: selectedCrop.availableQuantity < 50 ? 'var(--farmer-warning)' : 'var(--farmer-primary)', fontWeight: 600 }}>
                    Current Available Stock: {selectedCrop.availableQuantity} {selectedCrop.unit}
                  </small>
                )}
              </div>

              <div className="farmer-form-group">
                <label>Quality Grade</label>
                <select
                  name="qualityGrade"
                  value={formData.qualityGrade}
                  onChange={handleChange}
                  disabled={isSubmitting}
                >
                  {qualityGrades.map((g) => (
                    <option key={g.code} value={g.code}>
                      {g.label || g.code}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="farmer-form-row">
              <div className="farmer-form-group">
                <label>Selling Quantity ({selectedCrop?.unit || 'qtl'}) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  name="sellingQuantity"
                  placeholder={`Max: ${selectedCrop?.availableQuantity || 0}`}
                  value={formData.sellingQuantity}
                  onChange={handleChange}
                  disabled={isSubmitting}
                />
                {errors.sellingQuantity && (
                  <small style={{ color: 'var(--farmer-danger)' }}>{errors.sellingQuantity}</small>
                )}
              </div>

              <div className="farmer-form-group">
                <label>Price per {selectedCrop?.unit || 'unit'} (₹) *</label>
                <input
                  type="number"
                  step="1"
                  min="0.01"
                  name="rate"
                  placeholder="Price in INR"
                  value={formData.rate}
                  onChange={handleChange}
                  disabled={isSubmitting}
                />
                {errors.rate && (
                  <small style={{ color: 'var(--farmer-danger)' }}>{errors.rate}</small>
                )}
              </div>
            </div>

            <div className="farmer-form-row">
              <div className="farmer-form-group">
                <label>Pickup / Loading Location *</label>
                <input
                  type="text"
                  name="pickupLocation"
                  value={formData.pickupLocation}
                  onChange={handleChange}
                  disabled={isSubmitting}
                />
              </div>

              <div className="farmer-form-group">
                <label>Expected Pickup Date *</label>
                <input
                  type="date"
                  name="expectedPickupDate"
                  value={formData.expectedPickupDate}
                  onChange={handleChange}
                  disabled={isSubmitting}
                />
                {errors.expectedPickupDate && (
                  <small style={{ color: 'var(--farmer-danger)' }}>{errors.expectedPickupDate}</small>
                )}
              </div>
            </div>

            <div className="farmer-form-group">
              <label>Additional Terms / Dispatch Notes</label>
              <textarea
                rows={2}
                name="notes"
                placeholder="Moisture standards, weighing slip requirements, transportation arrangements..."
                value={formData.notes}
                onChange={handleChange}
                disabled={isSubmitting}
              />
            </div>

            <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button
                type="button"
                className="farmer-btn farmer-btn-outline"
                onClick={handleResetForm}
                disabled={isSubmitting}
              >
                Clear Form
              </button>
              <button
                type="submit"
                className="farmer-btn farmer-btn-primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting Sale...' : '📤 Submit Sale & Send OTP Request'}
              </button>
            </div>
          </form>
        </div>

        {/* Live Transaction Preview & Calculation Card */}
        <div>
          <div
            className="farmer-card"
            style={{
              padding: '24px',
              position: 'sticky',
              top: '90px',
              backgroundColor: '#FFFFFF',
              border: '2px solid #E8F5EC',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h4 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--farmer-dark)' }}>
                Transaction Summary
              </h4>
              <span
                style={{
                  background: 'var(--farmer-light)',
                  color: 'var(--farmer-primary)',
                  padding: '3px 8px',
                  borderRadius: 6,
                  fontSize: '0.72rem',
                  fontWeight: 700,
                }}
              >
                LIVE PREVIEW
              </span>
            </div>

            {/* Calculations Breakdown */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: '0.9rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--farmer-secondary)' }}>Crop Selected:</span>
                <strong>{selectedCrop ? `${selectedCrop.name} (${selectedCrop.variety})` : '-'}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--farmer-secondary)' }}>Selling Quantity:</span>
                <span>
                  {qty > 0 ? `${qty} ${selectedCrop?.unit || 'qtl'}` : '-'}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--farmer-secondary)' }}>Unit Rate:</span>
                <span>{rate > 0 ? `${formatCurrency(rate)} / ${selectedCrop?.unit || 'qtl'}` : '-'}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--farmer-secondary)' }}>Buyer:</span>
                <span style={{ fontWeight: 600, color: formData.buyerName ? 'var(--farmer-dark)' : 'var(--farmer-secondary)' }}>
                  {formData.buyerName || 'Not specified'}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--farmer-secondary)' }}>Buyer Mobile:</span>
                <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>
                  {formData.buyerMobile ? `+91 ${formData.buyerMobile}` : '-'}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--farmer-secondary)' }}>Buyer Category:</span>
                <span style={{ fontWeight: 600 }}>{formData.buyerCategory}</span>
              </div>

              {/* Total Calculation Highlight Box */}
              <div
                style={{
                  padding: '16px',
                  background: 'linear-gradient(135deg, #E8F5EC 0%, #D8F2E1 100%)',
                  borderRadius: 12,
                  marginTop: 6,
                  border: '1px solid #BFE8CF',
                }}
              >
                <div style={{ fontSize: '0.8rem', color: 'var(--farmer-dark)', fontWeight: 600 }}>
                  TOTAL TRANSACTION AMOUNT
                </div>
                <div style={{ fontSize: '1.9rem', fontWeight: 800, color: 'var(--farmer-dark)', letterSpacing: '-0.02em', margin: '4px 0' }}>
                  {formatCurrency(totalAmount)}
                </div>
                <small style={{ color: 'var(--farmer-secondary)', display: 'block' }}>
                  Calculated as: {qty} {selectedCrop?.unit || 'qtl'} × {formatCurrency(rate)}
                </small>
              </div>

              <div
                style={{
                  padding: '12px',
                  backgroundColor: '#F8FAF8',
                  borderRadius: 10,
                  fontSize: '0.82rem',
                  color: 'var(--farmer-secondary)',
                  border: '1px solid var(--farmer-border)',
                }}
              >
                <strong style={{ color: 'var(--farmer-text)', display: 'block', marginBottom: 4 }}>
                  🛡️ Security & Stock Guarantee
                </strong>
                Stock is deducted only after recipient inputs their 6-digit OTP code. Payment is credited to your registered bank account within 3 business days ({formatDate(expectedPayDate)}).
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SalesForm;
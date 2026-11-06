import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Plus,
  Trash2,
  ShieldCheck,
  RotateCcw,
  Save,
  Send,
  UserCheck,
  History,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useVendor } from '../../../hooks/useVendor';
import VendorFormField, { INPUT_CLASSES } from '../VendorFormField';
import VendorModal from '../VendorModal';
import PurchaseSummary from './PurchaseSummary';
import {
  CROP_OPTIONS,
  CROP_VARIETIES,
  UNITS,
  QUALITY_GRADES,
} from '../../../utils/constants';
import { calculatePurchaseTotals } from '../../../utils/calculations';
import { formatCurrency, formatNumber, maskMobileNumber } from '../../../utils/formatCurrency';
import { getTodayISO, addDaysISO } from '../../../utils/formatDate';

const EMPTY_ITEM = {
  id: 'item-1',
  cropName: 'Paddy',
  cropVariety: 'BPT 5204 (Sona Masoori)',
  availableQuantity: 100,
  purchasedQuantity: 50,
  unit: 'Quintal',
  pricePerUnit: 2350,
  qualityGrade: 'Grade A (Export / Premium)',
};

export function PurchaseForm({ supplierCategory = 'Farmer' }) {
  const isFarmer = supplierCategory === 'Farmer';
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedId = searchParams.get(isFarmer ? 'farmerId' : 'middlemanId') || '';

  const {
    farmers,
    middlemen,
    purchases,
    createPurchase,
    verifyTransactionOtp,
    resendTransactionOtp,
  } = useVendor();

  const suppliersList = useMemo(
    () =>
      (isFarmer ? farmers : middlemen).filter((s) => s.status === 'Active'),
    [isFarmer, farmers, middlemen]
  );

  const [supplierSearch, setSupplierSearch] = useState('');
  const [selectedSupplierId, setSelectedSupplierId] = useState(
    preselectedId || suppliersList[0]?.id || ''
  );

  useEffect(() => {
    if (preselectedId) {
      setSelectedSupplierId(preselectedId);
    }
  }, [preselectedId]);

  const selectedSupplier = useMemo(
    () => suppliersList.find((s) => s.id === selectedSupplierId) || null,
    [suppliersList, selectedSupplierId]
  );

  const filteredSupplierOptions = useMemo(() => {
    const q = supplierSearch.trim().toLowerCase();
    if (!q) return suppliersList;
    return suppliersList.filter((s) => {
      const name = isFarmer ? s.farmerName : s.businessName;
      return (
        s.id.toLowerCase().includes(q) ||
        name.toLowerCase().includes(q) ||
        s.mobileNumber.includes(q) ||
        s.district.toLowerCase().includes(q)
      );
    });
  }, [suppliersList, supplierSearch, isFarmer]);

  // Line Items State
  const [items, setItems] = useState([{ ...EMPTY_ITEM }]);

  // Additional Charges State
  const [charges, setCharges] = useState({
    transportationCharges: 2500,
    loadingCharges: 800,
    unloadingCharges: 800,
    hamali: isFarmer ? 500 : 0,
    commission: isFarmer ? 0 : 3500,
    otherCharges: 0,
  });

  // Transaction Details State
  const [purchaseDate, setPurchaseDate] = useState(getTodayISO());
  const [expectedPaymentDate, setExpectedPaymentDate] = useState(addDaysISO(getTodayISO(), 14));
  const [deliveryLocation, setDeliveryLocation] = useState('Kurnool Main Godown - Bay A1');
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState(addDaysISO(getTodayISO(), 1));
  const [notes, setNotes] = useState('');

  // Post-Submission OTP Modal State
  const [submittedResult, setSubmittedResult] = useState(null);
  const [enteredOtp, setEnteredOtp] = useState('');

  const calc = useMemo(() => calculatePurchaseTotals(items, charges), [items, charges]);

  // Supplier contextual history
  const supplierPastPurchases = useMemo(() => {
    if (!selectedSupplier) return [];
    return purchases.filter(
      (p) =>
        p.supplierCategory === supplierCategory &&
        p.supplierId === selectedSupplier.id &&
        p.status === 'Confirmed'
    );
  }, [purchases, supplierCategory, selectedSupplier]);

  const handleItemChange = (index, field, value) => {
    setItems((prev) =>
      prev.map((item, idx) => {
        if (idx !== index) return item;
        const updated = { ...item, [field]: value };
        if (field === 'cropName') {
          const varieties = CROP_VARIETIES[value] || ['Standard Variety'];
          updated.cropVariety = varieties[0];
        }
        return updated;
      })
    );
  };

  const addLineItem = () => {
    setItems((prev) => [
      ...prev,
      {
        ...EMPTY_ITEM,
        id: `item-${Date.now()}`,
        cropName: selectedSupplier?.availableCrops?.[0] || 'Groundnut',
        cropVariety: CROP_VARIETIES[selectedSupplier?.availableCrops?.[0] || 'Groundnut']?.[0] || 'K-6 (Kadiri-6)',
      },
    ]);
  };

  const removeLineItem = (index) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleChargeChange = (field, value) => {
    setCharges((prev) => ({ ...prev, [field]: value }));
  };

  const handleReset = () => {
    setItems([{ ...EMPTY_ITEM }]);
    setCharges({
      transportationCharges: 0,
      loadingCharges: 0,
      unloadingCharges: 0,
      hamali: 0,
      commission: 0,
      otherCharges: 0,
    });
    setPurchaseDate(getTodayISO());
    setExpectedPaymentDate(addDaysISO(getTodayISO(), 14));
    setExpectedDeliveryDate(addDaysISO(getTodayISO(), 1));
    setNotes('');
    toast.info('Purchase form reset.');
  };

  const validateAndBuildPayload = () => {
    if (!selectedSupplier) {
      toast.error(`Please select a ${supplierCategory} before submitting.`);
      return null;
    }

    for (const item of calc.lineItems) {
      if (!item.cropName) {
        toast.error('Crop Name is required for all line items.');
        return null;
      }
      if (item.purchasedQuantity <= 0) {
        toast.error(`Purchased Quantity for ${item.cropName} must be greater than zero.`);
        return null;
      }
      if (
        item.availableQuantity > 0 &&
        item.purchasedQuantity > Number(item.availableQuantity)
      ) {
        toast.error(
          `Purchased quantity (${item.purchasedQuantity}) cannot exceed supplier's available quantity (${item.availableQuantity}) for ${item.cropName}.`
        );
        return null;
      }
      if (item.pricePerUnit <= 0) {
        toast.error(`Price per Unit for ${item.cropName} must be greater than zero.`);
        return null;
      }
    }

    return {
      supplierCategory,
      supplierId: selectedSupplier.id,
      supplierName: isFarmer ? selectedSupplier.farmerName : selectedSupplier.businessName,
      ownerName: isFarmer ? '' : selectedSupplier.ownerName,
      mobileNumber: selectedSupplier.mobileNumber,
      email: selectedSupplier.email || '',
      gstNumber: selectedSupplier.gstNumber || '',
      village: selectedSupplier.village || '',
      mandal: selectedSupplier.mandal || '',
      district: selectedSupplier.district || '',
      state: selectedSupplier.state || 'Andhra Pradesh',
      address: selectedSupplier.address || '',
      items: calc.lineItems,
      charges,
      purchaseDate,
      expectedPaymentDate,
      deliveryLocation,
      expectedDeliveryDate,
      notes,
    };
  };

  const handleSaveDraft = () => {
    const payload = validateAndBuildPayload();
    if (!payload) return;
    createPurchase(payload, true);
    navigate('/vendor/purchases/history');
  };

  const handleSubmitPurchase = (e) => {
    e.preventDefault();
    const payload = validateAndBuildPayload();
    if (!payload) return;
    const res = createPurchase(payload, false);
    if (res && res.purchase) {
      setSubmittedResult(res);
      setEnteredOtp(res.demoOtpCode || '');
    }
  };

  const handleConfirmOtpNow = (e) => {
    e.preventDefault();
    if (!submittedResult) return;
    const res = verifyTransactionOtp(submittedResult.otpId, enteredOtp);
    if (res.success) {
      const targetId = submittedResult.purchase.id;
      setSubmittedResult(null);
      navigate(`/vendor/purchases/history?purchaseId=${targetId}`);
    }
  };

  return (
    <form onSubmit={handleSubmitPurchase} className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <div className="xl:col-span-2 space-y-6">
        {/* SECTION A – SUPPLIER DETAILS */}
        <section className="bg-brand-surface rounded-2xl border border-brand-border p-5 shadow-2xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-brand-border pb-3">
            <div className="flex items-center gap-2.5">
              <span className="px-2.5 py-0.5 rounded-md bg-brand-light text-brand-primary text-xs font-bold">
                Section A
              </span>
              <h2 className="text-base font-bold text-brand-primary">
                Supplier Details ({supplierCategory})
              </h2>
            </div>
            <button
              type="button"
              onClick={() => navigate(isFarmer ? '/vendor/farmers' : '/vendor/middlemen')}
              className="text-xs font-semibold text-brand-primary hover:underline cursor-pointer"
            >
              + Register New {supplierCategory}
            </button>
          </div>

          {/* Searchable Supplier Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <VendorFormField
              label={`Search & Filter ${supplierCategory}`}
              id="supplier-search"
            >
              <input
                id="supplier-search"
                type="text"
                value={supplierSearch}
                onChange={(e) => setSupplierSearch(e.target.value)}
                placeholder={`Filter by ${supplierCategory} name, ID, or mobile...`}
                className={INPUT_CLASSES}
              />
            </VendorFormField>

            <VendorFormField
              label={`Select ${supplierCategory}`}
              id="supplier-select"
              required
            >
              <select
                id="supplier-select"
                value={selectedSupplierId}
                onChange={(e) => setSelectedSupplierId(e.target.value)}
                className={INPUT_CLASSES}
              >
                {filteredSupplierOptions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {isFarmer
                      ? `${s.farmerName} (${s.id}) – ${s.village}, ${s.district}`
                      : `${s.businessName} (${s.id}) – ${s.ownerName}`}
                  </option>
                ))}
              </select>
            </VendorFormField>
          </div>

          {/* Auto-populated Supplier Fields */}
          {selectedSupplier && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <VendorFormField label={`${supplierCategory} ID`} id="ro-id">
                  <input
                    id="ro-id"
                    readOnly
                    disabled
                    value={selectedSupplier.id}
                    className={`${INPUT_CLASSES} font-mono font-bold text-brand-primary`}
                  />
                </VendorFormField>

                <VendorFormField
                  label={isFarmer ? 'Farmer Name' : 'Business Name'}
                  id="ro-name"
                >
                  <input
                    id="ro-name"
                    readOnly
                    disabled
                    value={
                      isFarmer
                        ? selectedSupplier.farmerName
                        : selectedSupplier.businessName
                    }
                    className={INPUT_CLASSES}
                  />
                </VendorFormField>

                {!isFarmer && (
                  <VendorFormField label="Owner Name" id="ro-owner">
                    <input
                      id="ro-owner"
                      readOnly
                      disabled
                      value={selectedSupplier.ownerName || ''}
                      className={INPUT_CLASSES}
                    />
                  </VendorFormField>
                )}

                <VendorFormField label="Mobile Number" id="ro-mobile">
                  <input
                    id="ro-mobile"
                    readOnly
                    disabled
                    value={`+91 ${selectedSupplier.mobileNumber}`}
                    className={INPUT_CLASSES}
                  />
                </VendorFormField>

                {isFarmer ? (
                  <>
                    <VendorFormField label="Village" id="ro-village">
                      <input
                        id="ro-village"
                        readOnly
                        disabled
                        value={selectedSupplier.village || '—'}
                        className={INPUT_CLASSES}
                      />
                    </VendorFormField>
                    <VendorFormField label="Mandal" id="ro-mandal">
                      <input
                        id="ro-mandal"
                        readOnly
                        disabled
                        value={selectedSupplier.mandal || '—'}
                        className={INPUT_CLASSES}
                      />
                    </VendorFormField>
                  </>
                ) : (
                  <>
                    <VendorFormField label="Email" id="ro-email">
                      <input
                        id="ro-email"
                        readOnly
                        disabled
                        value={selectedSupplier.email || '—'}
                        className={INPUT_CLASSES}
                      />
                    </VendorFormField>
                    <VendorFormField label="GST Number" id="ro-gst">
                      <input
                        id="ro-gst"
                        readOnly
                        disabled
                        value={selectedSupplier.gstNumber || 'Unregistered'}
                        className={INPUT_CLASSES}
                      />
                    </VendorFormField>
                  </>
                )}

                <VendorFormField label="District" id="ro-district">
                  <input
                    id="ro-district"
                    readOnly
                    disabled
                    value={selectedSupplier.district}
                    className={INPUT_CLASSES}
                  />
                </VendorFormField>

                <VendorFormField label="State" id="ro-state">
                  <input
                    id="ro-state"
                    readOnly
                    disabled
                    value={selectedSupplier.state}
                    className={INPUT_CLASSES}
                  />
                </VendorFormField>

                <VendorFormField
                  label={isFarmer ? 'Farmer Location' : 'Address'}
                  id="ro-location"
                  className="col-span-2"
                >
                  <input
                    id="ro-location"
                    readOnly
                    disabled
                    value={
                      selectedSupplier.address ||
                      `${selectedSupplier.village}, ${selectedSupplier.district}, ${selectedSupplier.state}`
                    }
                    className={INPUT_CLASSES}
                  />
                </VendorFormField>
              </div>

              {/* Contextual Supplier Purchase History & Outstanding Balance */}
              <div className="p-3.5 rounded-xl bg-brand-light/40 border border-brand-secondary/30 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-brand-primary font-semibold">
                  <UserCheck className="w-4 h-4" />
                  <span>
                    Contextual Account Standing for{' '}
                    {isFarmer
                      ? selectedSupplier.farmerName
                      : selectedSupplier.businessName}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                  <span>
                    Past Confirmed Purchases:{' '}
                    <strong className="text-brand-primary">
                      {supplierPastPurchases.length} ({formatNumber(selectedSupplier.totalQuantity)} Qtl)
                    </strong>
                  </span>
                  <span>
                    Cumulative Value:{' '}
                    <strong className="text-brand-text">
                      {formatCurrency(
                        isFarmer
                          ? selectedSupplier.totalPurchaseValue
                          : selectedSupplier.purchaseValue
                      )}
                    </strong>
                  </span>
                  <span>
                    Outstanding Payable:{' '}
                    <strong className="text-brand-warning">
                      {formatCurrency(
                        isFarmer
                          ? selectedSupplier.pendingPayables
                          : selectedSupplier.outstandingPayables
                      )}
                    </strong>
                  </span>
                </div>
              </div>
            </>
          )}
        </section>

        {/* SECTION B – RAW MATERIAL DETAILS (MULTI-LINE ITEMS) */}
        <section className="bg-brand-surface rounded-2xl border border-brand-border p-5 shadow-2xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-brand-border pb-3">
            <div className="flex items-center gap-2.5">
              <span className="px-2.5 py-0.5 rounded-md bg-brand-light text-brand-primary text-xs font-bold">
                Section B
              </span>
              <h2 className="text-base font-bold text-brand-primary">
                Raw Material Details
              </h2>
            </div>

            <button
              type="button"
              onClick={addLineItem}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-light text-brand-primary hover:bg-brand-secondary hover:text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Crop Line Item
            </button>
          </div>

          <div className="space-y-4">
            {calc.lineItems.map((item, idx) => {
              const varieties = CROP_VARIETIES[item.cropName] || ['Standard Variety'];
              return (
                <div
                  key={item.id || idx}
                  className="p-4 rounded-xl bg-brand-background/70 border border-brand-border space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-brand-primary uppercase">
                      Crop Lot #{idx + 1}
                    </span>
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeLineItem(idx)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-brand-error hover:underline cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Remove Lot
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <VendorFormField label="Crop Name" id={`crop-${idx}`} required>
                      <select
                        id={`crop-${idx}`}
                        value={item.cropName}
                        onChange={(e) => handleItemChange(idx, 'cropName', e.target.value)}
                        className={INPUT_CLASSES}
                      >
                        {CROP_OPTIONS.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </VendorFormField>

                    <VendorFormField label="Crop Variety" id={`variety-${idx}`}>
                      <select
                        id={`variety-${idx}`}
                        value={item.cropVariety}
                        onChange={(e) => handleItemChange(idx, 'cropVariety', e.target.value)}
                        className={INPUT_CLASSES}
                      >
                        {varieties.map((v) => (
                          <option key={v} value={v}>
                            {v}
                          </option>
                        ))}
                      </select>
                    </VendorFormField>

                    <VendorFormField label="Available Quantity" id={`avail-${idx}`}>
                      <input
                        id={`avail-${idx}`}
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.availableQuantity}
                        onChange={(e) =>
                          handleItemChange(idx, 'availableQuantity', e.target.value)
                        }
                        className={INPUT_CLASSES}
                      />
                    </VendorFormField>

                    <VendorFormField
                      label="Purchased Quantity"
                      id={`qty-${idx}`}
                      required
                    >
                      <input
                        id={`qty-${idx}`}
                        type="number"
                        min="0.01"
                        step="0.01"
                        required
                        value={item.purchasedQuantity}
                        onChange={(e) =>
                          handleItemChange(idx, 'purchasedQuantity', e.target.value)
                        }
                        className={INPUT_CLASSES}
                      />
                    </VendorFormField>

                    <VendorFormField label="Unit" id={`unit-${idx}`}>
                      <select
                        id={`unit-${idx}`}
                        value={item.unit}
                        onChange={(e) => handleItemChange(idx, 'unit', e.target.value)}
                        className={INPUT_CLASSES}
                      >
                        {['Kg', 'Quintal', 'Ton', 'Bag'].map((u) => (
                          <option key={u} value={u}>
                            {u}
                          </option>
                        ))}
                      </select>
                    </VendorFormField>

                    <VendorFormField
                      label="Price per Unit (₹)"
                      id={`rate-${idx}`}
                      required
                    >
                      <input
                        id={`rate-${idx}`}
                        type="number"
                        min="1"
                        step="0.01"
                        required
                        value={item.pricePerUnit}
                        onChange={(e) =>
                          handleItemChange(idx, 'pricePerUnit', e.target.value)
                        }
                        className={INPUT_CLASSES}
                      />
                    </VendorFormField>

                    <VendorFormField label="Quality Grade" id={`grade-${idx}`}>
                      <select
                        id={`grade-${idx}`}
                        value={item.qualityGrade}
                        onChange={(e) => handleItemChange(idx, 'qualityGrade', e.target.value)}
                        className={INPUT_CLASSES}
                      >
                        {QUALITY_GRADES.map((g) => (
                          <option key={g} value={g}>
                            {g}
                          </option>
                        ))}
                      </select>
                    </VendorFormField>

                    <VendorFormField label="Subtotal (Qty × Price)" id={`sub-${idx}`}>
                      <input
                        id={`sub-${idx}`}
                        readOnly
                        disabled
                        value={formatCurrency(item.subtotal)}
                        className={`${INPUT_CLASSES} font-bold text-brand-primary bg-brand-light/40`}
                      />
                    </VendorFormField>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* SECTION C – ADDITIONAL CHARGES */}
        <section className="bg-brand-surface rounded-2xl border border-brand-border p-5 shadow-2xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-brand-border pb-3">
            <div className="flex items-center gap-2.5">
              <span className="px-2.5 py-0.5 rounded-md bg-brand-light text-brand-primary text-xs font-bold">
                Section C
              </span>
              <h2 className="text-base font-bold text-brand-primary">Additional Charges</h2>
            </div>
            <span className="text-xs font-bold text-brand-primary">
              Live Charge Total: {formatCurrency(calc.totalCharges)}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <VendorFormField label="Transportation Charges (₹)" id="chg-trans">
              <input
                id="chg-trans"
                type="number"
                min="0"
                step="10"
                value={charges.transportationCharges}
                onChange={(e) => handleChargeChange('transportationCharges', e.target.value)}
                className={INPUT_CLASSES}
              />
            </VendorFormField>

            <VendorFormField label="Loading Charges (₹)" id="chg-load">
              <input
                id="chg-load"
                type="number"
                min="0"
                step="10"
                value={charges.loadingCharges}
                onChange={(e) => handleChargeChange('loadingCharges', e.target.value)}
                className={INPUT_CLASSES}
              />
            </VendorFormField>

            <VendorFormField label="Unloading Charges (₹)" id="chg-unload">
              <input
                id="chg-unload"
                type="number"
                min="0"
                step="10"
                value={charges.unloadingCharges}
                onChange={(e) => handleChargeChange('unloadingCharges', e.target.value)}
                className={INPUT_CLASSES}
              />
            </VendorFormField>

            {isFarmer && (
              <VendorFormField label="Hamali Charges (₹)" id="chg-hamali">
                <input
                  id="chg-hamali"
                  type="number"
                  min="0"
                  step="10"
                  value={charges.hamali}
                  onChange={(e) => handleChargeChange('hamali', e.target.value)}
                  className={INPUT_CLASSES}
                />
              </VendorFormField>
            )}

            <VendorFormField label="Commission (₹)" id="chg-comm">
              <input
                id="chg-comm"
                type="number"
                min="0"
                step="10"
                value={charges.commission}
                onChange={(e) => handleChargeChange('commission', e.target.value)}
                className={INPUT_CLASSES}
              />
            </VendorFormField>

            <VendorFormField label="Other Charges (₹)" id="chg-other">
              <input
                id="chg-other"
                type="number"
                min="0"
                step="10"
                value={charges.otherCharges}
                onChange={(e) => handleChargeChange('otherCharges', e.target.value)}
                className={INPUT_CLASSES}
              />
            </VendorFormField>
          </div>
        </section>

        {/* SECTION D – TRANSACTION DETAILS */}
        <section className="bg-brand-surface rounded-2xl border border-brand-border p-5 shadow-2xs space-y-4">
          <div className="flex items-center gap-2.5 border-b border-brand-border pb-3">
            <span className="px-2.5 py-0.5 rounded-md bg-brand-light text-brand-primary text-xs font-bold">
              Section D
            </span>
            <h2 className="text-base font-bold text-brand-primary">Transaction Details</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <VendorFormField label="Total Purchase Amount" id="txn-total">
              <input
                id="txn-total"
                readOnly
                disabled
                value={formatCurrency(calc.totalPurchaseAmount)}
                className={`${INPUT_CLASSES} font-bold text-brand-primary bg-brand-light/40`}
              />
            </VendorFormField>

            <VendorFormField label="Purchase Date" id="txn-date" required>
              <input
                id="txn-date"
                type="date"
                required
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                className={INPUT_CLASSES}
              />
            </VendorFormField>

            <VendorFormField label="Expected Payment Date" id="txn-paydate" required>
              <input
                id="txn-paydate"
                type="date"
                required
                value={expectedPaymentDate}
                onChange={(e) => setExpectedPaymentDate(e.target.value)}
                className={INPUT_CLASSES}
              />
            </VendorFormField>

            <VendorFormField label="Delivery Location" id="txn-loc" className="sm:col-span-2">
              <input
                id="txn-loc"
                type="text"
                value={deliveryLocation}
                onChange={(e) => setDeliveryLocation(e.target.value)}
                placeholder="Godown / Silo Bay"
                className={INPUT_CLASSES}
              />
            </VendorFormField>

            <VendorFormField label="Expected Delivery Date" id="txn-deldate">
              <input
                id="txn-deldate"
                type="date"
                value={expectedDeliveryDate}
                onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                className={INPUT_CLASSES}
              />
            </VendorFormField>
          </div>

          <VendorFormField label="Procurement Notes / Weighbridge Remarks" id="txn-notes">
            <textarea
              id="txn-notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Enter moisture reading, gunny bag count, vehicle number, or quality remarks..."
              className={INPUT_CLASSES}
            />
          </VendorFormField>

          {/* Form Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-brand-border">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-brand-background border border-brand-border text-brand-text hover:bg-brand-light hover:text-brand-primary transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset Form
              </button>
              <button
                type="button"
                onClick={() => navigate('/vendor/purchases/history')}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-brand-background border border-brand-border text-brand-muted hover:text-brand-text transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={handleSaveDraft}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold bg-brand-light text-brand-primary hover:bg-brand-secondary hover:text-white transition-colors cursor-pointer"
              >
                <Save className="w-4 h-4" />
                Save Draft
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-semibold bg-brand-primary text-white hover:bg-brand-secondary transition-colors cursor-pointer shadow-sm"
              >
                <Send className="w-4 h-4" />
                Submit Purchase &amp; Send OTP
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* RIGHT COLUMN: SECTION E – PURCHASE SUMMARY */}
      <div>
        <PurchaseSummary
          supplierCategory={supplierCategory}
          selectedSupplier={selectedSupplier}
          calc={calc}
          purchaseDate={purchaseDate}
          expectedPaymentDate={expectedPaymentDate}
          deliveryLocation={deliveryLocation}
        />
      </div>

      {/* POST-SUBMISSION OTP CONFIRMATION MODAL */}
      <VendorModal
        isOpen={Boolean(submittedResult)}
        onClose={() => {
          const targetId = submittedResult?.purchase?.id;
          setSubmittedResult(null);
          if (targetId) navigate(`/vendor/purchases/history?purchaseId=${targetId}`);
        }}
        title={`OTP Confirmation – ${submittedResult?.purchase?.id || ''}`}
        subtitle={`${supplierCategory} Purchase recorded. Verify OTP to confirm stock & ledger entry.`}
        size="md"
      >
        {submittedResult && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-brand-light/50 border border-brand-secondary/40 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-brand-primary uppercase">
                  OTP Delivery Status: SENT (Demo Sandbox)
                </span>
                <span className="px-2 py-0.5 rounded bg-brand-primary text-white font-mono font-bold">
                  {submittedResult.otpId}
                </span>
              </div>
              <p className="text-brand-text">
                A 6-digit verification code has been generated for{' '}
                <strong>{submittedResult.purchase.supplierName}</strong> (
                {maskMobileNumber(submittedResult.purchase.mobileNumber)}).
              </p>
              <div className="pt-2 border-t border-brand-secondary/30 flex items-center justify-between">
                <span className="font-semibold text-brand-primary">
                  Simulated Demo OTP Code:
                </span>
                <code className="px-3 py-1 rounded-lg bg-white border border-brand-primary text-brand-primary font-mono text-base font-bold tracking-widest">
                  {submittedResult.demoOtpCode}
                </code>
              </div>
            </div>

            <form onSubmit={handleConfirmOtpNow} className="space-y-4">
              <div>
                <label
                  htmlFor="post-pur-otp"
                  className="block text-xs font-semibold text-brand-text mb-1.5"
                >
                  Enter {supplierCategory} 6-Digit OTP to Confirm Purchase
                </label>
                <input
                  id="post-pur-otp"
                  type="text"
                  maxLength={6}
                  required
                  value={enteredOtp}
                  onChange={(e) => setEnteredOtp(e.target.value)}
                  className="w-full px-4 py-2.5 text-center font-mono text-lg font-bold tracking-widest bg-brand-surface border border-brand-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    const newCode = resendTransactionOtp(submittedResult.otpId);
                    if (newCode) {
                      setSubmittedResult((prev) => ({ ...prev, demoOtpCode: newCode }));
                      setEnteredOtp(newCode);
                    }
                  }}
                  className="px-3 py-2 rounded-lg text-xs font-semibold bg-brand-light text-brand-primary hover:bg-brand-secondary hover:text-white transition-colors cursor-pointer"
                >
                  Resend Demo OTP
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const targetId = submittedResult.purchase.id;
                      setSubmittedResult(null);
                      navigate(`/vendor/purchases/history?purchaseId=${targetId}`);
                    }}
                    className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-brand-background border border-brand-border text-brand-text hover:bg-brand-light transition-colors cursor-pointer"
                  >
                    Verify Later (Keep Pending)
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-brand-primary text-white hover:bg-brand-secondary transition-colors cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Confirm Purchase &amp; Update Stock
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}
      </VendorModal>
    </form>
  );
}

export default PurchaseForm;


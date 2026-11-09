import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import {
  ShoppingCart,
  UserCheck,
  Plus,
  Trash2,
  Calculator,
  ShieldCheck,
  FileText,
  RotateCcw,
  Send,
  AlertTriangle,
  Layers,
  CheckCircle2,
  MapPin,
} from 'lucide-react';
import { useVendor } from '../../../hooks/useVendor';
import { formatCurrency, formatQuantity } from '../../../utils/formatCurrency';
import { formatDate } from '../../../utils/formatDate';
import { calculateSalesTotals, safeNumber } from '../../../utils/calculations';
import { PAYMENT_TERMS } from '../../../utils/constants';
import VendorModal from '../VendorModal';
import VendorStatusBadge from '../VendorStatusBadge';

export default function SalesForm({ preselectedProductId = '', preselectedCustomerId = '' }) {
  const navigate = useNavigate();
  const {
    customers,
    products,
    productBatches,
    createSaleOrder,
    verifyTransactionOtp,
    resendTransactionOtp,
  } = useVendor();

  const activeCustomers = useMemo(
    () => customers.filter((c) => c.status === 'Active'),
    [customers]
  );

  // Only Active & non-expired products with > 0 available stock can be sold
  const sellableProducts = useMemo(
    () =>
      products.filter(
        (p) =>
          p.status === 'Active' &&
          (!p.expiryDate || !dayjs(p.expiryDate).isBefore(dayjs('2026-11-05'), 'day'))
      ),
    [products]
  );

  const initialProduct = useMemo(() => {
    const found =
      sellableProducts.find((p) => p.id === preselectedProductId) || sellableProducts[0];
    if (!found) {
      return {
        id: 'LINE-1',
        productId: '',
        productName: '',
        batchId: '',
        batchNumber: '',
        availableStock: 0,
        sellingQuantity: 10,
        unit: 'Quintal',
        pricePerUnit: 0,
        productionCost: 0,
      };
    }
    const matchingBatches = productBatches.filter(
      (b) => b.productId === found.id && b.availableQuantity > 0
    );
    const defaultBatch = matchingBatches[0] || null;
    return {
      id: 'LINE-1',
      productId: found.id,
      productName: found.productName,
      batchId: defaultBatch?.id || '',
      batchNumber: defaultBatch?.batchNumber || 'Standard Catalog Stock',
      availableStock: defaultBatch ? defaultBatch.availableQuantity : found.availableQuantity,
      sellingQuantity: Math.min(10, found.availableQuantity || 10),
      unit: found.unit || 'Quintal',
      pricePerUnit: found.sellingPrice || 0,
      productionCost: found.productionCost || 0,
    };
  }, [sellableProducts, productBatches, preselectedProductId]);

  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState(
    preselectedCustomerId || activeCustomers[0]?.id || ''
  );

  const selectedCustomer = useMemo(
    () => customers.find((c) => c.id === selectedCustomerId) || null,
    [customers, selectedCustomerId]
  );

  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [lineItems, setLineItems] = useState([initialProduct]);

  const [additionalDetails, setAdditionalDetails] = useState({
    salesDate: '2026-11-05',
    discount: 0,
    tax: 0,
    deliveryCharges: 1800,
    otherCharges: 0,
    expectedDeliveryDate: '2026-11-09',
    expectedPaymentDate: '2026-11-20',
    paymentTerms: 'Net 15 Days',
    notes: 'Quality certified finished batch. Dispatch via covered transport vehicle.',
  });

  // Post-submission OTP modal state
  const [createdOrderResult, setCreatedOrderResult] = useState(null);
  const [enteredOtp, setEnteredOtp] = useState('');
  const [otpVerifiedState, setOtpVerifiedState] = useState(false);

  const filteredCustomerOptions = useMemo(() => {
    const q = customerSearch.trim().toLowerCase();
    if (!q) return activeCustomers;
    return activeCustomers.filter(
      (c) =>
        c.customerName.toLowerCase().includes(q) ||
        (c.businessName || '').toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q) ||
        c.district.toLowerCase().includes(q)
    );
  }, [activeCustomers, customerSearch]);

  const effectiveAddress =
    deliveryAddress.trim() || selectedCustomer?.address || '';

  // Live calculations
  const salesTotals = useMemo(
    () =>
      calculateSalesTotals(lineItems, {
        discount: additionalDetails.discount,
        tax: additionalDetails.tax,
        deliveryCharges: additionalDetails.deliveryCharges,
        otherCharges: additionalDetails.otherCharges,
      }),
    [lineItems, additionalDetails]
  );

  const handleProductChange = (index, newProductId) => {
    const prod = sellableProducts.find((p) => p.id === newProductId);
    if (!prod) return;
    const batches = productBatches.filter(
      (b) => b.productId === prod.id && b.availableQuantity > 0
    );
    const firstBatch = batches[0] || null;
    const maxAvail = firstBatch ? firstBatch.availableQuantity : prod.availableQuantity;

    setLineItems((prev) =>
      prev.map((item, idx) =>
        idx === index
          ? {
              ...item,
              productId: prod.id,
              productName: prod.productName,
              batchId: firstBatch?.id || '',
              batchNumber: firstBatch?.batchNumber || 'Standard Catalog Stock',
              availableStock: maxAvail,
              sellingQuantity: Math.min(item.sellingQuantity || 10, maxAvail || 1),
              unit: prod.unit,
              pricePerUnit: prod.sellingPrice,
              productionCost: prod.productionCost,
            }
          : item
      )
    );
  };

  const handleBatchChange = (index, newBatchId) => {
    setLineItems((prev) =>
      prev.map((item, idx) => {
        if (idx !== index) return item;
        const batch = productBatches.find((b) => b.id === newBatchId);
        const prod = sellableProducts.find((p) => p.id === item.productId);
        if (!batch) {
          return {
            ...item,
            batchId: '',
            batchNumber: 'Standard Catalog Stock',
            availableStock: prod?.availableQuantity || 0,
          };
        }
        return {
          ...item,
          batchId: batch.id,
          batchNumber: batch.batchNumber,
          availableStock: batch.availableQuantity,
          sellingQuantity: Math.min(item.sellingQuantity, batch.availableQuantity),
          pricePerUnit: batch.sellingPrice || item.pricePerUnit,
          productionCost: batch.productionCost || item.productionCost,
        };
      })
    );
  };

  const handleItemFieldChange = (index, field, value) => {
    setLineItems((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, [field]: value } : item))
    );
  };

  const addLineItem = () => {
    const unusedProd =
      sellableProducts.find((p) => !lineItems.some((li) => li.productId === p.id)) ||
      sellableProducts[0];
    if (!unusedProd) return;
    const batches = productBatches.filter(
      (b) => b.productId === unusedProd.id && b.availableQuantity > 0
    );
    const firstBatch = batches[0] || null;
    setLineItems((prev) => [
      ...prev,
      {
        id: `LINE-${Date.now()}`,
        productId: unusedProd.id,
        productName: unusedProd.productName,
        batchId: firstBatch?.id || '',
        batchNumber: firstBatch?.batchNumber || 'Standard Catalog Stock',
        availableStock: firstBatch
          ? firstBatch.availableQuantity
          : unusedProd.availableQuantity,
        sellingQuantity: Math.min(5, unusedProd.availableQuantity || 5),
        unit: unusedProd.unit,
        pricePerUnit: unusedProd.sellingPrice,
        productionCost: unusedProd.productionCost,
      },
    ]);
  };

  const removeLineItem = (index) => {
    if (lineItems.length <= 1) return;
    setLineItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleReset = () => {
    setLineItems([initialProduct]);
    setDeliveryAddress('');
    setAdditionalDetails({
      salesDate: '2026-11-05',
      discount: 0,
      tax: 0,
      deliveryCharges: 1800,
      otherCharges: 0,
      expectedDeliveryDate: '2026-11-09',
      expectedPaymentDate: '2026-11-20',
      paymentTerms: 'Net 15 Days',
      notes: '',
    });
  };

  // Validate stock constraints
  const stockErrors = useMemo(() => {
    const errs = [];
    lineItems.forEach((item, idx) => {
      const prod = products.find((p) => p.id === item.productId);
      if (!prod) {
        errs.push(`Line ${idx + 1}: Please select a finished product.`);
        return;
      }
      if (prod.status !== 'Active') {
        errs.push(`${prod.productName} is inactive and cannot be sold.`);
      }
      const qty = safeNumber(item.sellingQuantity, 0);
      if (qty <= 0) {
        errs.push(`${prod.productName}: Selling quantity must be greater than zero.`);
      }
      if (qty > safeNumber(item.availableStock, prod.availableQuantity)) {
        errs.push(
          `${prod.productName}: Selling quantity (${qty} ${item.unit}) exceeds available stock (${item.availableStock} ${item.unit}).`
        );
      }
    });
    return errs;
  }, [lineItems, products]);

  const handleSubmitOrder = (isDraft = false) => {
    if (!selectedCustomer) return;
    if (!isDraft && stockErrors.length > 0) return;

    const payload = {
      customerId: selectedCustomer.id,
      customerName: selectedCustomer.customerName,
      businessName: selectedCustomer.businessName,
      mobileNumber: selectedCustomer.mobileNumber,
      email: selectedCustomer.email,
      deliveryAddress: effectiveAddress,
      district: selectedCustomer.district,
      state: selectedCustomer.state,
      items: lineItems,
      ...additionalDetails,
    };

    const res = createSaleOrder(payload, isDraft);
    if (res?.success) {
      if (isDraft) {
        navigate('/vendor/sales/history');
      } else {
        setCreatedOrderResult(res);
        setEnteredOtp(res.demoOtpCode || '');
        setOtpVerifiedState(false);
      }
    }
  };

  const handleImmediateOtpVerify = () => {
    if (!createdOrderResult) return;
    const verifyRes = verifyTransactionOtp({
      otpId: createdOrderResult.otpId,
      transactionId: createdOrderResult.sale.id,
      enteredCode: enteredOtp,
    });
    if (verifyRes?.success) {
      setOtpVerifiedState(true);
    }
  };

  const handleResendOtp = () => {
    if (!createdOrderResult) return;
    const newCode = resendTransactionOtp(
      createdOrderResult.otpId || createdOrderResult.sale.id
    );
    if (newCode) {
      setCreatedOrderResult((prev) => ({ ...prev, demoOtpCode: newCode }));
      setEnteredOtp(newCode);
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      {/* LEFT 2 COLUMNS: FORM SECTIONS A, B, C */}
      <div className="xl:col-span-2 space-y-6">
        {/* SECTION A: CUSTOMER DETAILS */}
        <div className="bg-brand-surface border border-brand-border rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-brand-border pb-3 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-brand-light text-brand-primary">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-brand-text">
                  Section A – Customer Details
                </h2>
                <p className="text-xs text-brand-muted">
                  Select an active buyer to auto-populate billing and delivery details
                </p>
              </div>
            </div>
            {selectedCustomer && (
              <VendorStatusBadge status={selectedCustomer.customerType || 'Wholesaler'} />
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-semibold text-brand-text mb-1">
                Filter Customer Directory
              </label>
              <input
                type="text"
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                placeholder="Search by customer name, business, ID or district..."
                className="w-full px-3 py-2 text-sm rounded-lg border border-brand-border bg-brand-background text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-brand-text mb-1">
                Select Customer <span className="text-brand-error">*</span>
              </label>
              <select
                value={selectedCustomerId}
                onChange={(e) => {
                  setSelectedCustomerId(e.target.value);
                  setDeliveryAddress('');
                }}
                className="w-full px-3 py-2 text-sm rounded-lg border border-brand-border bg-brand-surface text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary"
              >
                {filteredCustomerOptions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.customerName} — {c.businessName || c.customerType} ({c.id})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {selectedCustomer && (
            <div className="bg-brand-background/70 border border-brand-border rounded-xl p-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs mb-3">
                <div>
                  <span className="text-brand-muted block">Customer ID</span>
                  <span className="font-bold text-brand-primary">{selectedCustomer.id}</span>
                </div>
                <div>
                  <span className="text-brand-muted block">Customer Name</span>
                  <span className="font-semibold text-brand-text">
                    {selectedCustomer.customerName}
                  </span>
                </div>
                <div>
                  <span className="text-brand-muted block">Mobile Number</span>
                  <span className="font-semibold text-brand-text">
                    {selectedCustomer.mobileNumber}
                  </span>
                </div>
                <div>
                  <span className="text-brand-muted block">Email Address</span>
                  <span className="font-semibold text-brand-text truncate block">
                    {selectedCustomer.email || '—'}
                  </span>
                </div>
                <div>
                  <span className="text-brand-muted block">District & State</span>
                  <span className="font-semibold text-brand-text">
                    {selectedCustomer.district}, {selectedCustomer.state}
                  </span>
                </div>
                <div>
                  <span className="text-brand-muted block">GST Number</span>
                  <span className="font-mono font-semibold text-brand-text">
                    {selectedCustomer.gstNumber || 'Unregistered'}
                  </span>
                </div>
                <div>
                  <span className="text-brand-muted block">Credit Limit</span>
                  <span className="font-semibold text-brand-primary">
                    {formatCurrency(selectedCustomer.creditLimit)}
                  </span>
                </div>
                <div>
                  <span className="text-brand-muted block">Outstanding Receivable</span>
                  <span
                    className={`font-bold ${
                      selectedCustomer.outstandingReceivables > 0
                        ? 'text-brand-warning'
                        : 'text-brand-success'
                    }`}
                  >
                    {formatCurrency(selectedCustomer.outstandingReceivables)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-text mb-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-brand-primary" />
                  Delivery Address (Auto-populated, editable for dispatch)
                </label>
                <input
                  type="text"
                  value={effectiveAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-brand-border bg-brand-surface text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary"
                />
              </div>
            </div>
          )}
        </div>

        {/* SECTION B: PRODUCT DETAILS */}
        <div className="bg-brand-surface border border-brand-border rounded-xl p-5 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-brand-border pb-3 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-brand-light text-brand-primary">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-brand-text">
                  Section B – Finished Product & Batch Details
                </h2>
                <p className="text-xs text-brand-muted">
                  Select finished goods and traceable manufacturing batches (`PBAT-XXXX`)
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={addLineItem}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-brand-light text-brand-primary hover:bg-brand-secondary hover:text-white transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add Product Line
            </button>
          </div>

          {stockErrors.length > 0 && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-brand-error space-y-1">
              {stockErrors.map((err, i) => (
                <div key={i} className="flex items-center gap-1.5 font-medium">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{err}</span>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-4">
            {lineItems.map((item, idx) => {
              const availableBatchesForProd = productBatches.filter(
                (b) => b.productId === item.productId && b.availableQuantity > 0
              );
              const lineSubtotal =
                safeNumber(item.sellingQuantity, 0) * safeNumber(item.pricePerUnit, 0);

              return (
                <div
                  key={item.id}
                  className="p-4 rounded-xl border border-brand-border bg-brand-background/50 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-brand-primary">
                      Product Item #{idx + 1}
                    </span>
                    {lineItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeLineItem(idx)}
                        className="inline-flex items-center gap-1 text-xs font-medium text-brand-error hover:underline cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-brand-text mb-1">
                        Select Finished Product <span className="text-brand-error">*</span>
                      </label>
                      <select
                        value={item.productId}
                        onChange={(e) => handleProductChange(idx, e.target.value)}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-brand-border bg-brand-surface text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary"
                      >
                        {sellableProducts.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.productName} ({p.availableQuantity} {p.unit} avail)
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-brand-text mb-1">
                        Select Available Product Batch
                      </label>
                      <select
                        value={item.batchId}
                        onChange={(e) => handleBatchChange(idx, e.target.value)}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-brand-border bg-brand-surface text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary"
                      >
                        <option value="">All Available Catalog Stock</option>
                        {availableBatchesForProd.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.batchNumber} ({b.id}) — {b.availableQuantity} {b.unit}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-brand-text mb-1">
                        Available Stock
                      </label>
                      <div className="px-3 py-2 text-sm font-bold rounded-lg border border-brand-border bg-brand-light/50 text-brand-primary">
                        {formatQuantity(item.availableStock, item.unit)}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-brand-text mb-1">
                        Selling Quantity <span className="text-brand-error">*</span>
                      </label>
                      <input
                        type="number"
                        min="0.1"
                        step="0.5"
                        value={item.sellingQuantity}
                        onChange={(e) =>
                          handleItemFieldChange(idx, 'sellingQuantity', e.target.value)
                        }
                        className="w-full px-3 py-2 text-sm rounded-lg border border-brand-border bg-brand-surface text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-brand-text mb-1">
                        Unit
                      </label>
                      <input
                        type="text"
                        readOnly
                        value={item.unit}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-brand-border bg-brand-background text-brand-muted"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-brand-text mb-1">
                        Price per Unit (₹) <span className="text-brand-error">*</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        step="10"
                        value={item.pricePerUnit}
                        onChange={(e) =>
                          handleItemFieldChange(idx, 'pricePerUnit', e.target.value)
                        }
                        className="w-full px-3 py-2 text-sm rounded-lg border border-brand-border bg-brand-surface text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-brand-text mb-1">
                        Line Subtotal
                      </label>
                      <div className="px-3 py-2 text-sm font-bold rounded-lg border border-brand-border bg-brand-surface text-brand-text">
                        {formatCurrency(lineSubtotal)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* SECTION C: ADDITIONAL DETAILS */}
        <div className="bg-brand-surface border border-brand-border rounded-xl p-5 shadow-xs">
          <div className="flex items-center gap-2.5 border-b border-brand-border pb-3 mb-4">
            <div className="p-2 rounded-lg bg-brand-light text-brand-primary">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-brand-text">
                Section C – Additional Charges, Dates & Payment Terms
              </h2>
              <p className="text-xs text-brand-muted">
                Configure commercial discounts, GST/taxes, freight charges, and settlement schedule
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-xs font-semibold text-brand-text mb-1">
                Discount (₹)
              </label>
              <input
                type="number"
                min="0"
                value={additionalDetails.discount}
                onChange={(e) =>
                  setAdditionalDetails((p) => ({ ...p, discount: e.target.value }))
                }
                className="w-full px-3 py-2 text-sm rounded-lg border border-brand-border bg-brand-surface text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-brand-text mb-1">
                Applicable Tax / GST (₹)
              </label>
              <input
                type="number"
                min="0"
                value={additionalDetails.tax}
                onChange={(e) =>
                  setAdditionalDetails((p) => ({ ...p, tax: e.target.value }))
                }
                className="w-full px-3 py-2 text-sm rounded-lg border border-brand-border bg-brand-surface text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-brand-text mb-1">
                Delivery Charges (₹)
              </label>
              <input
                type="number"
                min="0"
                value={additionalDetails.deliveryCharges}
                onChange={(e) =>
                  setAdditionalDetails((p) => ({ ...p, deliveryCharges: e.target.value }))
                }
                className="w-full px-3 py-2 text-sm rounded-lg border border-brand-border bg-brand-surface text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-brand-text mb-1">
                Other Charges (₹)
              </label>
              <input
                type="number"
                min="0"
                value={additionalDetails.otherCharges}
                onChange={(e) =>
                  setAdditionalDetails((p) => ({ ...p, otherCharges: e.target.value }))
                }
                className="w-full px-3 py-2 text-sm rounded-lg border border-brand-border bg-brand-surface text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-xs font-semibold text-brand-text mb-1">
                Expected Delivery Date
              </label>
              <input
                type="date"
                value={additionalDetails.expectedDeliveryDate}
                onChange={(e) =>
                  setAdditionalDetails((p) => ({
                    ...p,
                    expectedDeliveryDate: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 text-sm rounded-lg border border-brand-border bg-brand-surface text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-brand-text mb-1">
                Expected Payment Date
              </label>
              <input
                type="date"
                value={additionalDetails.expectedPaymentDate}
                onChange={(e) =>
                  setAdditionalDetails((p) => ({
                    ...p,
                    expectedPaymentDate: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 text-sm rounded-lg border border-brand-border bg-brand-surface text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-brand-text mb-1">
                Payment Terms
              </label>
              <select
                value={additionalDetails.paymentTerms}
                onChange={(e) =>
                  setAdditionalDetails((p) => ({ ...p, paymentTerms: e.target.value }))
                }
                className="w-full px-3 py-2 text-sm rounded-lg border border-brand-border bg-brand-surface text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary"
              >
                {PAYMENT_TERMS.map((term) => (
                  <option key={term} value={term}>
                    {term}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-brand-text mb-1">
              Dispatch & Billing Notes
            </label>
            <textarea
              rows={2}
              value={additionalDetails.notes}
              onChange={(e) =>
                setAdditionalDetails((p) => ({ ...p, notes: e.target.value }))
              }
              placeholder="Enter lorry/transport instructions, packaging notes, or billing remarks..."
              className="w-full px-3 py-2 text-sm rounded-lg border border-brand-border bg-brand-surface text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary"
            />
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: SECTION D (SALES SUMMARY) & SECTION E (ACTIONS) */}
      <div className="space-y-6">
        <div className="bg-brand-surface border border-brand-border rounded-xl p-5 shadow-xs sticky top-20">
          <div className="flex items-center gap-2.5 border-b border-brand-border pb-3 mb-4">
            <div className="p-2 rounded-lg bg-brand-primary text-white">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-brand-text">
                Section D – Sales Summary
              </h3>
              <p className="text-xs text-brand-muted">
                Live order valuation & OTP confirmation preview
              </p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-lg bg-brand-light/40 border border-brand-primary/20 space-y-1.5">
              <div className="flex justify-between">
                <span className="text-brand-muted">Customer Name:</span>
                <span className="font-bold text-brand-text">
                  {selectedCustomer?.customerName || '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-brand-muted">Business:</span>
                <span className="font-medium text-brand-text">
                  {selectedCustomer?.businessName || '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-brand-muted">Selected Products:</span>
                <span className="font-semibold text-brand-primary">
                  {salesTotals.lineItems.length} Item(s)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-brand-muted">Batch References:</span>
                <span className="font-mono font-medium text-brand-text text-right">
                  {salesTotals.lineItems
                    .map((i) => i.batchNumber || 'Standard')
                    .join(', ')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-brand-muted">Total Quantity:</span>
                <span className="font-bold text-brand-text">
                  {salesTotals.totalQuantity} {salesTotals.lineItems[0]?.unit || 'Units'}
                </span>
              </div>
            </div>

            <div className="border-t border-brand-border pt-3 space-y-2">
              <div className="flex justify-between">
                <span className="text-brand-muted">Items Subtotal</span>
                <span className="font-semibold text-brand-text">
                  {formatCurrency(salesTotals.subtotal)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-brand-muted">Less: Commercial Discount</span>
                <span className="font-semibold text-brand-error">
                  - {formatCurrency(salesTotals.discount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-brand-muted">Add: Applicable Tax / GST</span>
                <span className="font-semibold text-brand-text">
                  + {formatCurrency(salesTotals.tax)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-brand-muted">Add: Delivery Charges</span>
                <span className="font-semibold text-brand-text">
                  + {formatCurrency(salesTotals.deliveryCharges)}
                </span>
              </div>
              {salesTotals.otherCharges > 0 && (
                <div className="flex justify-between">
                  <span className="text-brand-muted">Add: Other Charges</span>
                  <span className="font-semibold text-brand-text">
                    + {formatCurrency(salesTotals.otherCharges)}
                  </span>
                </div>
              )}
            </div>

            <div className="p-3.5 rounded-xl bg-brand-primary text-white flex items-center justify-between">
              <div>
                <span className="text-[11px] uppercase tracking-wider text-brand-light block">
                  Final Payable Amount
                </span>
                <span className="text-xs text-brand-light/90">
                  Due by {formatDate(additionalDetails.expectedPaymentDate)}
                </span>
              </div>
              <span className="text-xl font-extrabold">
                {formatCurrency(salesTotals.finalAmount)}
              </span>
            </div>

            <div className="p-3 rounded-lg bg-brand-background border border-brand-border text-[11px] text-brand-muted flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-brand-primary shrink-0 mt-0.5" />
              <span>
                Submitting this sales order generates a unique <strong>SALE-XXXX</strong> &{' '}
                <strong>ORD-XXXX</strong> ID, reserves finished stock, and dispatches a{' '}
                <strong>6-digit confirmation OTP</strong> to the customer.
              </span>
            </div>
          </div>

          {/* SECTION E: ACTIONS */}
          <div className="mt-5 pt-4 border-t border-brand-border space-y-2.5">
            <button
              type="button"
              disabled={stockErrors.length > 0}
              onClick={() => handleSubmitOrder(false)}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold rounded-lg bg-brand-primary text-white hover:bg-brand-secondary transition-colors disabled:opacity-50 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              Submit Sales Order & Send OTP
            </button>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleSubmitOrder(true)}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-brand-primary text-brand-primary hover:bg-brand-light/50 transition-colors cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                Save Draft
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-brand-border text-brand-text hover:bg-brand-background transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset
              </button>
              <button
                type="button"
                onClick={() => navigate('/vendor/sales/history')}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-brand-border text-brand-muted hover:text-brand-error transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION F: OTP CONFIRMATION WORKFLOW MODAL */}
      <VendorModal
        isOpen={Boolean(createdOrderResult)}
        onClose={() => setCreatedOrderResult(null)}
        title="Customer Order Created & OTP Confirmation"
        subtitle={
          createdOrderResult
            ? `Sales ID: ${createdOrderResult.sale.id} | Order ID: ${createdOrderResult.order.id}`
            : ''
        }
        size="md"
      >
        {createdOrderResult && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-brand-light/50 border border-brand-primary/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-brand-primary uppercase">
                  Stock Reservation Active
                </span>
                <VendorStatusBadge
                  status={otpVerifiedState ? 'Confirmed' : 'Pending'}
                />
              </div>
              <p className="text-xs text-brand-text">
                Finished stock of{' '}
                <strong>
                  {createdOrderResult.sale.quantity} {createdOrderResult.sale.unit}
                </strong>{' '}
                for <strong>{createdOrderResult.sale.product}</strong> has been reserved for{' '}
                <strong>{createdOrderResult.sale.customerName}</strong>.
              </p>
              <div className="flex items-center justify-between pt-2 border-t border-brand-primary/20 text-xs">
                <span className="text-brand-muted">Simulated Customer Demo OTP:</span>
                <span className="px-2.5 py-1 rounded-md bg-brand-primary text-white font-mono text-sm font-bold tracking-widest">
                  {createdOrderResult.demoOtpCode}
                </span>
              </div>
            </div>

            {!otpVerifiedState ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-brand-text mb-1">
                    Enter 6-Digit Customer OTP to Confirm Order Immediately
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      maxLength={6}
                      value={enteredOtp}
                      onChange={(e) => setEnteredOtp(e.target.value)}
                      placeholder="Enter 6-digit OTP"
                      className="flex-1 px-3 py-2 text-sm font-mono font-bold tracking-widest rounded-lg border border-brand-border bg-brand-surface text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary"
                    />
                    <button
                      type="button"
                      onClick={handleImmediateOtpVerify}
                      className="px-4 py-2 text-xs font-bold rounded-lg bg-brand-primary text-white hover:bg-brand-secondary transition-colors cursor-pointer"
                    >
                      Verify OTP Now
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-2">
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    className="text-brand-primary font-semibold hover:underline cursor-pointer"
                  >
                    Resend Customer OTP
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/vendor/confirmations')}
                    className="text-brand-muted hover:text-brand-text font-medium cursor-pointer"
                  >
                    Verify Later in OTP Confirmations →
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-2">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5 text-brand-success" />
                  <span>Customer Order Confirmed & Receivable Posted!</span>
                </div>
                <p className="text-xs">
                  Order <strong>{createdOrderResult.order.id}</strong> is now Confirmed and ready
                  for Processing & Packing. Ledger receivable of{' '}
                  <strong>{formatCurrency(createdOrderResult.sale.totalAmount)}</strong> has been
                  recorded.
                </p>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t border-brand-border">
              <button
                type="button"
                onClick={() => {
                  setCreatedOrderResult(null);
                  navigate('/vendor/orders');
                }}
                className="px-4 py-2 text-xs font-bold rounded-lg bg-brand-primary text-white hover:bg-brand-secondary transition-colors cursor-pointer"
              >
                Go to Customer Orders
              </button>
              <button
                type="button"
                onClick={() => {
                  setCreatedOrderResult(null);
                  navigate('/vendor/sales/history');
                }}
                className="px-4 py-2 text-xs font-semibold rounded-lg border border-brand-border text-brand-text hover:bg-brand-background transition-colors cursor-pointer"
              >
                View Sales History
              </button>
            </div>
          </div>
        )}
      </VendorModal>
    </div>
  );
}


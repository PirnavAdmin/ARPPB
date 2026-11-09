import { useState, useMemo, useEffect } from 'react';
import {
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  XCircle,
  Settings2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useVendor } from '../../../hooks/useVendor';
import VendorFormField, { INPUT_CLASSES } from '../VendorFormField';
import VendorFileUpload from '../VendorFileUpload';
import ProcessingSummary from './ProcessingSummary';
import {
  CROP_OPTIONS,
  FINISHED_PRODUCT_CATEGORIES,
  UNITS,
} from '../../../utils/constants';
import {
  calculateProcessingMetrics,
  areUnitsCompatible,
} from '../../../utils/calculations';
import { formatCurrency, formatNumber } from '../../../utils/formatCurrency';
import { getTodayISO } from '../../../utils/formatDate';
import { generateNextId, generateBatchNumber } from '../../../utils/generateTransactionId';

export function ProcessingForm({
  initialDraft = null,
  preselectedStockId = '',
  onSuccess,
  onCancel,
}) {
  const {
    inventory,
    processingRecords,
    conversionMappings,
    addConversionMapping,
    saveProcessingBatch,
    cancelDraftProcessing,
  } = useVendor();

  const availableBatches = useMemo(
    () => inventory.filter((b) => b.availableQuantity > 0 || b.id === initialDraft?.stockId),
    [inventory, initialDraft]
  );

  const initialStockBatch = useMemo(() => {
    if (initialDraft?.stockId) {
      return inventory.find((b) => b.id === initialDraft.stockId) || availableBatches[0];
    }
    if (preselectedStockId) {
      return inventory.find((b) => b.id === preselectedStockId) || availableBatches[0];
    }
    return availableBatches[0] || null;
  }, [initialDraft, preselectedStockId, inventory, availableBatches]);

  const [selectedCrop, setSelectedCrop] = useState(
    initialStockBatch?.cropName || 'Paddy'
  );
  const [selectedStockId, setSelectedStockId] = useState(
    initialStockBatch?.id || ''
  );

  // Sync when preselectedStockId changes
  useEffect(() => {
    if (preselectedStockId) {
      const found = inventory.find((b) => b.id === preselectedStockId);
      if (found) {
        setSelectedCrop(found.cropName);
        setSelectedStockId(found.id);
      }
    }
  }, [preselectedStockId, inventory]);

  const cropBatches = useMemo(
    () =>
      availableBatches.filter(
        (b) => b.cropName.toLowerCase() === selectedCrop.toLowerCase()
      ),
    [availableBatches, selectedCrop]
  );

  const selectedBatch = useMemo(
    () =>
      inventory.find((b) => b.id === selectedStockId) || cropBatches[0] || null,
    [inventory, selectedStockId, cropBatches]
  );

  const nextProcId = useMemo(
    () =>
      initialDraft?.id || generateNextId('PROC-', processingRecords, 'id', 4),
    [initialDraft, processingRecords]
  );

  const [processingDate, setProcessingDate] = useState(
    initialDraft?.processingDate || getTodayISO()
  );
  const [inputQuantity, setInputQuantity] = useState(
    initialDraft?.inputQuantity ?? Math.min(25, selectedBatch?.availableQuantity || 25)
  );
  const [inputUnit, setInputUnit] = useState(
    initialDraft?.inputUnit || selectedBatch?.unit || 'Quintal'
  );

  // Outputs state (supports multiple finished output items!)
  const [outputs, setOutputs] = useState(() => {
    if (initialDraft?.outputs?.length) return initialDraft.outputs;
    const mapping = conversionMappings.find(
      (m) => m.rawMaterial.toLowerCase() === (initialStockBatch?.cropName || 'Paddy').toLowerCase()
    );
    const firstDefault = mapping?.defaultOutputs?.[0] || {
      productName: 'Rice',
      category: 'Food Grains & Cereals',
      defaultUnit: 'Quintal',
    };
    return [
      {
        id: 'out-1',
        productName: firstDefault.productName,
        productCategory: firstDefault.category,
        outputQuantity: 18,
        outputUnit: firstDefault.defaultUnit,
      },
    ];
  });

  const [manualWastage, setManualWastage] = useState(
    initialDraft?.wastageQuantity ?? 2
  );

  // Processing Expenses state
  const [expenses, setExpenses] = useState({
    processingCharges: initialDraft?.expenses?.processingCharges ?? 4500,
    labourCharges: initialDraft?.expenses?.labourCharges ?? 2200,
    electricityCharges: initialDraft?.expenses?.electricityCharges ?? 1800,
    packagingCharges: initialDraft?.expenses?.packagingCharges ?? 1600,
    transportationCharges: initialDraft?.expenses?.transportationCharges ?? 800,
    otherExpenses: initialDraft?.expenses?.otherExpenses ?? 300,
  });

  // Additional Information state
  const [processingLocation, setProcessingLocation] = useState(
    initialDraft?.processingLocation || 'Kurnool Modern Processing Hub - Unit 1'
  );
  const [batchNumber, setBatchNumber] = useState(
    initialDraft?.batchNumber ||
      generateBatchNumber(
        'PRC',
        selectedBatch?.cropName || 'PAD',
        processingRecords.length + 1
      )
  );
  const [operatorName, setOperatorName] = useState(
    initialDraft?.operatorName || 'M. Veerabhadraiah'
  );
  const [notes, setNotes] = useState(initialDraft?.notes || '');
  const [attachment, setAttachment] = useState(initialDraft?.attachment || '');

  // Custom mapping adder modal toggle
  const [showMappingConfig, setShowMappingConfig] = useState(false);
  const [newMapProduct, setNewMapProduct] = useState('');
  const [newMapCategory, setNewMapCategory] = useState(FINISHED_PRODUCT_CATEGORIES[0]);
  const [newMapUnit, setNewMapUnit] = useState('Quintal');

  const handleCropChange = (crop) => {
    setSelectedCrop(crop);
    const matching = availableBatches.filter(
      (b) => b.cropName.toLowerCase() === crop.toLowerCase()
    );
    const firstBatch = matching[0] || null;
    setSelectedStockId(firstBatch?.id || '');
    if (firstBatch) {
      setInputUnit(firstBatch.unit);
      setInputQuantity(Math.min(20, firstBatch.availableQuantity));
      setBatchNumber(
        generateBatchNumber('PRC', crop, processingRecords.length + 1)
      );
    }

    const mapping = conversionMappings.find(
      (m) => m.rawMaterial.toLowerCase() === crop.toLowerCase()
    );
    if (mapping && mapping.defaultOutputs.length > 0) {
      const def = mapping.defaultOutputs[0];
      setOutputs([
        {
          id: `out-${Date.now()}`,
          productName: def.productName,
          productCategory: def.category,
          outputQuantity: 15,
          outputUnit: def.defaultUnit,
        },
      ]);
    }
  };

  const metrics = useMemo(
    () =>
      calculateProcessingMetrics({
        inputQuantity,
        inputUnit,
        batchUnitCost: selectedBatch?.averageCost || 0,
        outputs,
        expenses,
        manualWastageQuantity: manualWastage,
      }),
    [inputQuantity, inputUnit, selectedBatch, outputs, expenses, manualWastage]
  );

  const handleOutputChange = (idx, field, val) => {
    setOutputs((prev) =>
      prev.map((o, i) => (i === idx ? { ...o, [field]: val } : o))
    );
  };

  const addOutputItem = () => {
    setOutputs((prev) => [
      ...prev,
      {
        id: `out-${Date.now()}`,
        productName: `${selectedCrop} By-Product`,
        productCategory: 'By-Products & Feed',
        outputQuantity: 2,
        outputUnit: inputUnit,
      },
    ]);
  };

  const removeOutputItem = (idx) => {
    if (outputs.length <= 1) return;
    setOutputs((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleExpenseChange = (field, val) => {
    setExpenses((prev) => ({ ...prev, [field]: val }));
  };

  const buildPayload = () => ({
    id: initialDraft?.id || null,
    processingDate,
    stockId: selectedBatch?.id,
    inputQuantity: metrics.totalInputQuantity,
    inputUnit,
    outputs,
    wastageQuantity: metrics.wastageQuantity,
    expenses,
    processingLocation,
    batchNumber,
    operatorName,
    notes,
    attachment,
  });

  const handleSaveDraft = () => {
    const res = saveProcessingBatch(buildPayload(), false);
    if (res.success && onSuccess) onSuccess(res.record);
  };

  const handleCompleteProcessing = (e) => {
    e.preventDefault();
    const res = saveProcessingBatch(buildPayload(), true);
    if (res.success && onSuccess) onSuccess(res.record);
  };

  const currentCropSuggestedProducts = useMemo(() => {
    const map = conversionMappings.find(
      (m) => m.rawMaterial.toLowerCase() === selectedCrop.toLowerCase()
    );
    return map?.defaultOutputs || [];
  }, [conversionMappings, selectedCrop]);

  return (
    <form
      onSubmit={handleCompleteProcessing}
      className="grid grid-cols-1 xl:grid-cols-3 gap-6"
    >
      <div className="xl:col-span-2 space-y-6">
        {/* SECTION B – PROCESSING DETAILS */}
        <section className="bg-brand-surface rounded-2xl border border-brand-border p-5 shadow-2xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-brand-border pb-3">
            <div className="flex items-center gap-2.5">
              <span className="px-2.5 py-0.5 rounded-md bg-brand-light text-brand-primary text-xs font-bold">
                Section B
              </span>
              <h2 className="text-base font-bold text-brand-primary">
                Processing Details &amp; Raw Material Batch Selection
              </h2>
            </div>
            <span className="font-mono text-xs font-bold text-brand-primary">
              ID: {nextProcId}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <VendorFormField label="Processing ID (Auto)" id="proc-id">
              <input
                id="proc-id"
                readOnly
                disabled
                value={nextProcId}
                className={`${INPUT_CLASSES} font-mono font-bold text-brand-primary`}
              />
            </VendorFormField>

            <VendorFormField label="Processing Date" id="proc-date" required>
              <input
                id="proc-date"
                type="date"
                required
                value={processingDate}
                onChange={(e) => setProcessingDate(e.target.value)}
                className={INPUT_CLASSES}
              />
            </VendorFormField>

            <VendorFormField label="Select Raw Material" id="proc-crop" required>
              <select
                id="proc-crop"
                value={selectedCrop}
                onChange={(e) => handleCropChange(e.target.value)}
                className={INPUT_CLASSES}
              >
                {CROP_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </VendorFormField>

            <VendorFormField
              label="Select Raw Material Batch"
              id="proc-batch"
              required
              className="sm:col-span-2"
            >
              <select
                id="proc-batch"
                value={selectedBatch?.id || ''}
                onChange={(e) => setSelectedStockId(e.target.value)}
                className={INPUT_CLASSES}
              >
                {cropBatches.length === 0 ? (
                  <option value="">No available stock batches for {selectedCrop}</option>
                ) : (
                  cropBatches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.batchNumber} ({b.id}) – {b.cropVariety} • Avail: {b.availableQuantity}{' '}
                      {b.unit} @ ₹{b.averageCost}/{b.unit}
                    </option>
                  ))
                )}
              </select>
            </VendorFormField>

            <VendorFormField label="Available Raw Material Stock" id="proc-avail">
              <input
                id="proc-avail"
                readOnly
                disabled
                value={
                  selectedBatch
                    ? `${selectedBatch.availableQuantity} ${selectedBatch.unit}`
                    : '0'
                }
                className={`${INPUT_CLASSES} font-bold text-brand-primary bg-brand-light/40`}
              />
            </VendorFormField>

            <VendorFormField label="Supplier Reference" id="proc-sup">
              <input
                id="proc-sup"
                readOnly
                disabled
                value={
                  selectedBatch
                    ? `${selectedBatch.supplierName} (${selectedBatch.supplierId})`
                    : '—'
                }
                className={INPUT_CLASSES}
              />
            </VendorFormField>

            <VendorFormField label="Original Purchase ID" id="proc-pur">
              <input
                id="proc-pur"
                readOnly
                disabled
                value={selectedBatch?.purchaseId || '—'}
                className={`${INPUT_CLASSES} font-mono font-bold text-brand-primary`}
              />
            </VendorFormField>

            <VendorFormField
              label="Input Quantity"
              id="proc-input-qty"
              required
              error={
                selectedBatch && Number(inputQuantity) > selectedBatch.availableQuantity
                  ? `Cannot exceed available stock (${selectedBatch.availableQuantity} ${selectedBatch.unit})`
                  : ''
              }
            >
              <input
                id="proc-input-qty"
                type="number"
                step="0.01"
                min="0.01"
                max={selectedBatch?.availableQuantity || 99999}
                required
                value={inputQuantity}
                onChange={(e) => setInputQuantity(e.target.value)}
                className={INPUT_CLASSES}
              />
            </VendorFormField>

            <VendorFormField label="Input Unit" id="proc-input-unit">
              <select
                id="proc-input-unit"
                value={inputUnit}
                onChange={(e) => setInputUnit(e.target.value)}
                className={INPUT_CLASSES}
              >
                {UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </VendorFormField>
          </div>
        </section>

        {/* SECTION C – OUTPUT DETAILS */}
        <section className="bg-brand-surface rounded-2xl border border-brand-border p-5 shadow-2xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-brand-border pb-3">
            <div className="flex items-center gap-2.5">
              <span className="px-2.5 py-0.5 rounded-md bg-brand-light text-brand-primary text-xs font-bold">
                Section C
              </span>
              <h2 className="text-base font-bold text-brand-primary">
                Output Details (Actual Finished Product Yield)
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowMappingConfig((prev) => !prev)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-brand-background border border-brand-border text-brand-primary hover:bg-brand-light cursor-pointer"
              >
                <Settings2 className="w-3.5 h-3.5" />
                Configure Conversion Mapping
              </button>
              <button
                type="button"
                onClick={addOutputItem}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-brand-light text-brand-primary hover:bg-brand-secondary hover:text-white cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Output Line
              </button>
            </div>
          </div>

          {/* Optional Conversion Mapping Configurator */}
          {showMappingConfig && (
            <div className="p-3.5 rounded-xl bg-brand-light/30 border border-brand-secondary/30 space-y-2.5 text-xs">
              <p className="font-bold text-brand-primary">
                Add Custom Finished Product Mapping for {selectedCrop}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                <input
                  type="text"
                  value={newMapProduct}
                  onChange={(e) => setNewMapProduct(e.target.value)}
                  placeholder="Product Name (e.g., Broken Rice)"
                  className={INPUT_CLASSES}
                />
                <select
                  value={newMapCategory}
                  onChange={(e) => setNewMapCategory(e.target.value)}
                  className={INPUT_CLASSES}
                >
                  {FINISHED_PRODUCT_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <select
                  value={newMapUnit}
                  onChange={(e) => setNewMapUnit(e.target.value)}
                  className={INPUT_CLASSES}
                >
                  {UNITS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => {
                    if (!newMapProduct.trim()) {
                      toast.warning('Enter a finished product name.');
                      return;
                    }
                    addConversionMapping(selectedCrop, {
                      productName: newMapProduct.trim(),
                      category: newMapCategory,
                      defaultUnit: newMapUnit,
                    });
                    setNewMapProduct('');
                    setShowMappingConfig(false);
                  }}
                  className="px-3 py-2 rounded-lg font-semibold bg-brand-primary text-white hover:bg-brand-secondary cursor-pointer"
                >
                  Save Mapping
                </button>
              </div>
            </div>
          )}

          {/* Quick Presets from Configured Mappings */}
          {currentCropSuggestedProducts.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-brand-muted font-medium">
                Configured {selectedCrop} Outputs:
              </span>
              {currentCropSuggestedProducts.map((sug) => (
                <button
                  key={sug.productName}
                  type="button"
                  onClick={() => {
                    handleOutputChange(0, 'productName', sug.productName);
                    handleOutputChange(0, 'productCategory', sug.category);
                    handleOutputChange(0, 'outputUnit', sug.defaultUnit);
                  }}
                  className="px-2.5 py-1 rounded-md bg-brand-light/60 text-brand-primary font-semibold hover:bg-brand-primary hover:text-white transition-colors cursor-pointer"
                >
                  {selectedCrop} → {sug.productName} ({sug.defaultUnit})
                </button>
              ))}
            </div>
          )}

          <div className="space-y-3">
            {outputs.map((out, idx) => (
              <div
                key={out.id || idx}
                className="p-4 rounded-xl bg-brand-background border border-brand-border space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-brand-primary uppercase">
                    Finished Output #{idx + 1}
                  </span>
                  {outputs.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeOutputItem(idx)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-brand-error hover:underline cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Remove
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <VendorFormField label="Finished Product Name" id={`out-name-${idx}`} required>
                    <input
                      id={`out-name-${idx}`}
                      type="text"
                      required
                      value={out.productName}
                      onChange={(e) =>
                        handleOutputChange(idx, 'productName', e.target.value)
                      }
                      placeholder="e.g., Rice / Groundnut Oil"
                      className={INPUT_CLASSES}
                    />
                  </VendorFormField>

                  <VendorFormField label="Product Category" id={`out-cat-${idx}`}>
                    <select
                      id={`out-cat-${idx}`}
                      value={out.productCategory}
                      onChange={(e) =>
                        handleOutputChange(idx, 'productCategory', e.target.value)
                      }
                      className={INPUT_CLASSES}
                    >
                      {FINISHED_PRODUCT_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </VendorFormField>

                  <VendorFormField
                    label="Actual Output Quantity"
                    id={`out-qty-${idx}`}
                    required
                  >
                    <input
                      id={`out-qty-${idx}`}
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={out.outputQuantity}
                      onChange={(e) =>
                        handleOutputChange(idx, 'outputQuantity', e.target.value)
                      }
                      className={INPUT_CLASSES}
                    />
                  </VendorFormField>

                  <VendorFormField label="Output Unit" id={`out-unit-${idx}`}>
                    <select
                      id={`out-unit-${idx}`}
                      value={out.outputUnit}
                      onChange={(e) =>
                        handleOutputChange(idx, 'outputUnit', e.target.value)
                      }
                      className={INPUT_CLASSES}
                    >
                      {UNITS.map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </select>
                  </VendorFormField>
                </div>
              </div>
            ))}
          </div>

          {/* Wastage Quantity & Wastage Percentage */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <VendorFormField
              label={`Wastage Quantity (${inputUnit})`}
              id="proc-wastage-qty"
              hint={
                metrics.allUnitsCompatible
                  ? 'Auto-calculated: Total Input Quantity − Actual Output Quantity'
                  : 'Entered manually because input and output units differ'
              }
            >
              <input
                id="proc-wastage-qty"
                type="number"
                step="0.01"
                min="0"
                readOnly={metrics.allUnitsCompatible}
                value={
                  metrics.allUnitsCompatible
                    ? metrics.wastageQuantity
                    : manualWastage
                }
                onChange={(e) => setManualWastage(e.target.value)}
                className={`${INPUT_CLASSES} ${
                  metrics.allUnitsCompatible ? 'bg-brand-light/30 font-bold text-brand-primary' : ''
                }`}
              />
            </VendorFormField>

            <VendorFormField
              label="Wastage Percentage (%)"
              id="proc-wastage-pct"
              hint="(Wastage Quantity ÷ Total Input Quantity) × 100"
            >
              <input
                id="proc-wastage-pct"
                readOnly
                disabled
                value={`${formatNumber(metrics.wastagePercentage)}%`}
                className={`${INPUT_CLASSES} font-bold text-brand-warning bg-brand-background`}
              />
            </VendorFormField>
          </div>
        </section>

        {/* SECTION D – PROCESSING EXPENSES */}
        <section className="bg-brand-surface rounded-2xl border border-brand-border p-5 shadow-2xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-brand-border pb-3">
            <div className="flex items-center gap-2.5">
              <span className="px-2.5 py-0.5 rounded-md bg-brand-light text-brand-primary text-xs font-bold">
                Section D
              </span>
              <h2 className="text-base font-bold text-brand-primary">
                Processing Expenses
              </h2>
            </div>
            <span className="text-xs font-bold text-brand-primary">
              Total Processing Expenses: {formatCurrency(metrics.totalProcessingExpenses)}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <VendorFormField label="Processing Charges (₹)" id="exp-proc">
              <input
                id="exp-proc"
                type="number"
                min="0"
                step="50"
                value={expenses.processingCharges}
                onChange={(e) => handleExpenseChange('processingCharges', e.target.value)}
                className={INPUT_CLASSES}
              />
            </VendorFormField>

            <VendorFormField label="Labour Charges (₹)" id="exp-lab">
              <input
                id="exp-lab"
                type="number"
                min="0"
                step="50"
                value={expenses.labourCharges}
                onChange={(e) => handleExpenseChange('labourCharges', e.target.value)}
                className={INPUT_CLASSES}
              />
            </VendorFormField>

            <VendorFormField label="Electricity Charges (₹)" id="exp-elec">
              <input
                id="exp-elec"
                type="number"
                min="0"
                step="50"
                value={expenses.electricityCharges}
                onChange={(e) => handleExpenseChange('electricityCharges', e.target.value)}
                className={INPUT_CLASSES}
              />
            </VendorFormField>

            <VendorFormField label="Packaging Charges (₹)" id="exp-pack">
              <input
                id="exp-pack"
                type="number"
                min="0"
                step="50"
                value={expenses.packagingCharges}
                onChange={(e) => handleExpenseChange('packagingCharges', e.target.value)}
                className={INPUT_CLASSES}
              />
            </VendorFormField>

            <VendorFormField label="Transportation Charges (₹)" id="exp-trans">
              <input
                id="exp-trans"
                type="number"
                min="0"
                step="50"
                value={expenses.transportationCharges}
                onChange={(e) =>
                  handleExpenseChange('transportationCharges', e.target.value)
                }
                className={INPUT_CLASSES}
              />
            </VendorFormField>

            <VendorFormField label="Other Expenses (₹)" id="exp-other">
              <input
                id="exp-other"
                type="number"
                min="0"
                step="50"
                value={expenses.otherExpenses}
                onChange={(e) => handleExpenseChange('otherExpenses', e.target.value)}
                className={INPUT_CLASSES}
              />
            </VendorFormField>
          </div>
        </section>

        {/* SECTION E – ADDITIONAL INFORMATION */}
        <section className="bg-brand-surface rounded-2xl border border-brand-border p-5 shadow-2xs space-y-4">
          <div className="flex items-center gap-2.5 border-b border-brand-border pb-3">
            <span className="px-2.5 py-0.5 rounded-md bg-brand-light text-brand-primary text-xs font-bold">
              Section E
            </span>
            <h2 className="text-base font-bold text-brand-primary">
              Additional Information
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <VendorFormField label="Processing Location" id="proc-loc">
              <input
                id="proc-loc"
                type="text"
                value={processingLocation}
                onChange={(e) => setProcessingLocation(e.target.value)}
                className={INPUT_CLASSES}
              />
            </VendorFormField>

            <VendorFormField label="Output Batch Number" id="proc-batchnum">
              <input
                id="proc-batchnum"
                type="text"
                value={batchNumber}
                onChange={(e) => setBatchNumber(e.target.value)}
                className={`${INPUT_CLASSES} font-mono font-bold`}
              />
            </VendorFormField>

            <VendorFormField label="Operator Name" id="proc-operator">
              <input
                id="proc-operator"
                type="text"
                value={operatorName}
                onChange={(e) => setOperatorName(e.target.value)}
                className={INPUT_CLASSES}
              />
            </VendorFormField>
          </div>

          <VendorFormField label="Processing Notes &amp; Lab Quality Remarks" id="proc-notes">
            <textarea
              id="proc-notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Enter milling recovery observations, moisture level, or operator notes..."
              className={INPUT_CLASSES}
            />
          </VendorFormField>

          <VendorFileUpload
            label="Lab Report / Batch Attachment (Optional)"
            value={attachment}
            onChange={setAttachment}
            helperText="Upload quality check sheet or weighment slip image"
          />

          {/* SECTION G – PROCESSING ACTIONS */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-brand-border">
            <div className="flex items-center gap-2">
              {initialDraft?.status === 'Draft' && (
                <button
                  type="button"
                  onClick={() => {
                    cancelDraftProcessing(initialDraft.id);
                    if (onCancel) onCancel();
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-brand-error-light text-brand-error hover:bg-brand-error hover:text-white transition-colors cursor-pointer"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  Cancel Draft
                </button>
              )}
              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-brand-background border border-brand-border text-brand-muted hover:text-brand-text cursor-pointer"
                >
                  Close
                </button>
              )}
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
                <CheckCircle2 className="w-4 h-4" />
                Complete Processing
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* RIGHT COLUMN: AUTOMATIC CALCULATIONS SUMMARY */}
      <div>
        <ProcessingSummary
          selectedBatch={selectedBatch}
          metrics={metrics}
          outputs={outputs}
        />
      </div>
    </form>
  );
}

export default ProcessingForm;


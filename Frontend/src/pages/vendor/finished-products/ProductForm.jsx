import { useState } from 'react';
import {
  FINISHED_PRODUCT_CATEGORIES,
  CROP_OPTIONS,
  PACKAGING_TYPES,
  UNITS,
} from '../../../utils/constants';
import VendorFormField, { INPUT_CLASSES } from '../VendorFormField';
import VendorFileUpload from '../VendorFileUpload';
import { calculateProfitMargin } from '../../../utils/calculations';
import { formatCurrency, formatNumber } from '../../../utils/formatCurrency';
import { getTodayISO, addDaysISO } from '../../../utils/formatDate';

export function ProductForm({
  initialData = null,
  nextProductId = 'PROD-0008',
  onSubmit,
  onCancel,
}) {
  const [productName, setProductName] = useState(initialData?.productName || '');
  const [category, setCategory] = useState(
    initialData?.category || FINISHED_PRODUCT_CATEGORIES[0]
  );
  const [sourceRawMaterial, setSourceRawMaterial] = useState(
    initialData?.sourceRawMaterial || 'Paddy'
  );
  const [description, setDescription] = useState(initialData?.description || '');
  const [brandName, setBrandName] = useState(
    initialData?.brandName || 'Rayalaseema Gold'
  );
  const [imageUrl, setImageUrl] = useState(initialData?.imageUrl || '');
  const [packagingType, setPackagingType] = useState(
    initialData?.packagingType || PACKAGING_TYPES[0]
  );
  const [packageSize, setPackageSize] = useState(
    initialData?.packageSize || '25 Kg / 50 Kg Bag'
  );
  const [unit, setUnit] = useState(initialData?.unit || 'Quintal');
  const [minimumStockLevel, setMinimumStockLevel] = useState(
    initialData?.minimumStockLevel ?? 15
  );
  const [productionCost, setProductionCost] = useState(
    initialData?.productionCost ?? 3200
  );
  const [sellingPrice, setSellingPrice] = useState(
    initialData?.sellingPrice ?? 4200
  );
  const [manufacturingDate, setManufacturingDate] = useState(
    initialData?.manufacturingDate || getTodayISO()
  );
  const [expiryDate, setExpiryDate] = useState(
    initialData?.expiryDate || addDaysISO(getTodayISO(), 270)
  );
  const [status, setStatus] = useState(initialData?.status || 'Active');
  const [error, setError] = useState('');

  const liveMargin = calculateProfitMargin(sellingPrice, productionCost);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!productName.trim()) {
      setError('Product Name is required.');
      return;
    }
    if (Number(sellingPrice) <= 0) {
      setError('Selling Price must be greater than zero.');
      return;
    }

    onSubmit({
      productName: productName.trim(),
      category,
      sourceRawMaterial,
      description: description.trim(),
      brandName: brandName.trim(),
      imageUrl,
      packagingType,
      packageSize,
      unit,
      minimumStockLevel: Number(minimumStockLevel) || 0,
      productionCost: Number(productionCost) || 0,
      sellingPrice: Number(sellingPrice) || 0,
      manufacturingDate,
      expiryDate,
      status,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="p-3 rounded-lg bg-brand-error-light text-brand-error text-xs font-semibold">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <VendorFormField label="Product ID (Auto-generated)" id="prod-id">
          <input
            id="prod-id"
            readOnly
            disabled
            value={initialData?.id || nextProductId}
            className={`${INPUT_CLASSES} font-mono font-bold text-brand-primary`}
          />
        </VendorFormField>

        <VendorFormField label="Product Name" id="prod-name" required>
          <input
            id="prod-name"
            type="text"
            required
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            placeholder="e.g., Rice / Groundnut Oil"
            className={INPUT_CLASSES}
          />
        </VendorFormField>

        <VendorFormField label="Category" id="prod-cat">
          <select
            id="prod-cat"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={INPUT_CLASSES}
          >
            {FINISHED_PRODUCT_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </VendorFormField>

        <VendorFormField label="Source Raw Material" id="prod-src">
          <select
            id="prod-src"
            value={sourceRawMaterial}
            onChange={(e) => setSourceRawMaterial(e.target.value)}
            className={INPUT_CLASSES}
          >
            {CROP_OPTIONS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </VendorFormField>

        <VendorFormField label="Brand Name" id="prod-brand">
          <input
            id="prod-brand"
            type="text"
            value={brandName}
            onChange={(e) => setBrandName(e.target.value)}
            placeholder="e.g., Rayalaseema Gold"
            className={INPUT_CLASSES}
          />
        </VendorFormField>

        <VendorFormField label="Packaging Type" id="prod-pack">
          <select
            id="prod-pack"
            value={packagingType}
            onChange={(e) => setPackagingType(e.target.value)}
            className={INPUT_CLASSES}
          >
            {PACKAGING_TYPES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </VendorFormField>

        <VendorFormField label="Package Size" id="prod-size">
          <input
            id="prod-size"
            type="text"
            value={packageSize}
            onChange={(e) => setPackageSize(e.target.value)}
            placeholder="e.g., 25 Kg / 50 Kg Bag"
            className={INPUT_CLASSES}
          />
        </VendorFormField>

        <VendorFormField label="Unit" id="prod-unit">
          <select
            id="prod-unit"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            className={INPUT_CLASSES}
          >
            {UNITS.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </VendorFormField>

        <VendorFormField label="Minimum Stock Level" id="prod-min">
          <input
            id="prod-min"
            type="number"
            min="0"
            value={minimumStockLevel}
            onChange={(e) => setMinimumStockLevel(e.target.value)}
            className={INPUT_CLASSES}
          />
        </VendorFormField>

        <VendorFormField
          label="Production Cost / Unit (₹)"
          id="prod-cost"
          hint="Derived from processing batch cost"
        >
          <input
            id="prod-cost"
            type="number"
            step="0.01"
            min="0"
            value={productionCost}
            onChange={(e) => setProductionCost(e.target.value)}
            className={INPUT_CLASSES}
          />
        </VendorFormField>

        <VendorFormField
          label="Selling Price / Unit (₹)"
          id="prod-sell"
          required
          hint="Does not overwrite production cost"
        >
          <input
            id="prod-sell"
            type="number"
            step="0.01"
            min="1"
            required
            value={sellingPrice}
            onChange={(e) => setSellingPrice(e.target.value)}
            className={INPUT_CLASSES}
          />
        </VendorFormField>

        <VendorFormField label="Product Status" id="prod-status">
          <select
            id="prod-status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className={INPUT_CLASSES}
          >
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </VendorFormField>

        <VendorFormField label="Manufacturing Date" id="prod-mfg">
          <input
            id="prod-mfg"
            type="date"
            value={manufacturingDate}
            onChange={(e) => setManufacturingDate(e.target.value)}
            className={INPUT_CLASSES}
          />
        </VendorFormField>

        <VendorFormField label="Expiry Date" id="prod-exp">
          <input
            id="prod-exp"
            type="date"
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
            className={INPUT_CLASSES}
          />
        </VendorFormField>

        <div className="p-3 rounded-xl bg-brand-light/40 border border-brand-secondary/30 flex flex-col justify-center">
          <span className="text-[11px] font-semibold uppercase text-brand-primary">
            Calculated Profit Margin %
          </span>
          <p className="text-base font-bold text-brand-primary mt-0.5">
            {formatNumber(liveMargin)}% ({formatCurrency(sellingPrice - productionCost)}/{unit})
          </p>
        </div>
      </div>

      <VendorFormField label="Description" id="prod-desc">
        <textarea
          id="prod-desc"
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe product quality, grade, and target buyers..."
          className={INPUT_CLASSES}
        />
      </VendorFormField>

      <VendorFileUpload
        label="Product Image Upload"
        value={imageUrl}
        onChange={setImageUrl}
      />

      <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-brand-border">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-lg text-xs font-semibold bg-brand-light text-brand-primary hover:bg-brand-secondary hover:text-white transition-colors cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-5 py-2 rounded-lg text-xs font-semibold bg-brand-primary text-white hover:bg-brand-secondary transition-colors cursor-pointer"
        >
          {initialData ? 'Save Product Changes' : 'Create Product'}
        </button>
      </div>
    </form>
  );
}

export default ProductForm;


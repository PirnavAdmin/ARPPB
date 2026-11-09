import { useState } from 'react';
import VendorFormField, { INPUT_CLASSES } from '../VendorFormField';
import { formatCurrency, formatNumber } from '../../../utils/formatCurrency';

export function UpdateProductStock({
  product,
  batches = [],
  onAdjust,
  onCancel,
}) {
  const productBatches = batches.filter((b) => b.productId === product?.id);
  const [selectedBatchId, setSelectedBatchId] = useState(
    productBatches[0]?.id || ''
  );
  const [adjustmentType, setAdjustmentType] = useState('Add'); // 'Add' | 'Deduct'
  const [quantity, setQuantity] = useState(5);
  const [reason, setReason] = useState('Physical stock verification & audit reconciliation');
  const [newSellingPrice, setNewSellingPrice] = useState(
    product?.sellingPrice || ''
  );
  const [error, setError] = useState('');

  if (!product) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('A stock adjustment reason is mandatory.');
      return;
    }
    if (Number(quantity) <= 0) {
      setError('Adjustment quantity must be greater than zero.');
      return;
    }
    if (
      adjustmentType === 'Deduct' &&
      Number(quantity) > Number(product.availableQuantity || 0)
    ) {
      setError(
        `Cannot deduct ${quantity} ${product.unit}. Only ${product.availableQuantity} ${product.unit} available.`
      );
      return;
    }

    const res = onAdjust({
      productId: product.id,
      batchId: selectedBatchId || null,
      adjustmentType,
      quantity: Number(quantity),
      reason: reason.trim(),
      newSellingPrice,
    });

    if (res && !res.success) {
      setError(res.message || 'Unable to adjust stock.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-xs">
      {error && (
        <div className="p-3 rounded-lg bg-brand-error-light text-brand-error font-semibold">
          {error}
        </div>
      )}

      <div className="p-3.5 rounded-xl bg-brand-light/40 border border-brand-secondary/30 flex items-center justify-between">
        <div>
          <p className="font-bold text-brand-primary text-sm">
            {product.productName} ({product.id})
          </p>
          <p className="text-brand-muted">
            Production Cost: {formatCurrency(product.productionCost)}/{product.unit} (Protected)
          </p>
        </div>
        <div className="text-right">
          <span className="text-brand-muted block">Current Available</span>
          <strong className="text-base text-brand-primary">
            {formatNumber(product.availableQuantity)} {product.unit}
          </strong>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <VendorFormField label="Select Manufacturing Batch" id="adj-batch">
          <select
            id="adj-batch"
            value={selectedBatchId}
            onChange={(e) => setSelectedBatchId(e.target.value)}
            className={INPUT_CLASSES}
          >
            {productBatches.length === 0 ? (
              <option value="">General Product Pool</option>
            ) : (
              productBatches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.batchNumber} ({b.id}) – Avail: {b.availableQuantity} {b.unit}
                </option>
              ))
            )}
          </select>
        </VendorFormField>

        <VendorFormField label="Adjustment Type" id="adj-type" required>
          <select
            id="adj-type"
            value={adjustmentType}
            onChange={(e) => setAdjustmentType(e.target.value)}
            className={INPUT_CLASSES}
          >
            <option value="Add">Add Stock (+)</option>
            <option value="Deduct">Deduct / Damage Write-off (−)</option>
          </select>
        </VendorFormField>

        <VendorFormField
          label={`Adjustment Quantity (${product.unit})`}
          id="adj-qty"
          required
        >
          <input
            id="adj-qty"
            type="number"
            step="0.01"
            min="0.01"
            required
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className={INPUT_CLASSES}
          />
        </VendorFormField>

        <VendorFormField
          label={`Update Selling Price (₹/${product.unit})`}
          id="adj-price"
          hint="Does not alter production cost"
        >
          <input
            id="adj-price"
            type="number"
            step="0.01"
            min="1"
            value={newSellingPrice}
            onChange={(e) => setNewSellingPrice(e.target.value)}
            className={INPUT_CLASSES}
          />
        </VendorFormField>
      </div>

      <VendorFormField label="Stock Adjustment Reason" id="adj-reason" required>
        <input
          id="adj-reason"
          type="text"
          required
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g., Physical stock count / Repackaging adjustment"
          className={INPUT_CLASSES}
        />
      </VendorFormField>

      <div className="flex justify-end gap-2 pt-3 border-t border-brand-border">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-lg font-semibold bg-brand-light text-brand-primary hover:bg-brand-secondary hover:text-white cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 rounded-lg font-semibold bg-brand-primary text-white hover:bg-brand-secondary cursor-pointer"
        >
          Confirm Stock Adjustment
        </button>
      </div>
    </form>
  );
}

export default UpdateProductStock;


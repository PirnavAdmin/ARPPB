import { Calculator, Factory, AlertCircle, CheckCircle2 } from 'lucide-react';
import { formatCurrency, formatNumber } from '../../../utils/formatCurrency';

export function ProcessingSummary({ selectedBatch, metrics, outputs = [] }) {
  return (
    <div className="bg-brand-surface rounded-2xl border border-brand-border p-5 shadow-2xs space-y-4 sticky top-22">
      <div className="flex items-center justify-between border-b border-brand-border pb-3">
        <div className="flex items-center gap-2">
          <Calculator className="w-4 h-4 text-brand-primary" />
          <h3 className="text-base font-bold text-brand-primary">
            Batch Costing &amp; Yield Summary
          </h3>
        </div>
        <span className="px-2 py-0.5 rounded bg-brand-light text-brand-primary text-[10px] font-bold uppercase">
          Live Calculation
        </span>
      </div>

      {/* Selected Batch Info */}
      <div className="p-3.5 rounded-xl bg-brand-light/40 border border-brand-secondary/30 text-xs space-y-1.5">
        <div className="flex justify-between">
          <span className="text-brand-muted">Source Batch:</span>
          <strong className="font-mono text-brand-primary">
            {selectedBatch ? `${selectedBatch.batchNumber} (${selectedBatch.id})` : 'None'}
          </strong>
        </div>
        <div className="flex justify-between">
          <span className="text-brand-muted">Crop &amp; Variety:</span>
          <strong className="text-brand-text">
            {selectedBatch
              ? `${selectedBatch.cropName} (${selectedBatch.cropVariety})`
              : '—'}
          </strong>
        </div>
        <div className="flex justify-between">
          <span className="text-brand-muted">Available Stock:</span>
          <strong className="text-brand-primary">
            {selectedBatch
              ? `${formatNumber(selectedBatch.availableQuantity)} ${selectedBatch.unit}`
              : '0'}
          </strong>
        </div>
        <div className="flex justify-between">
          <span className="text-brand-muted">Batch Unit Cost:</span>
          <strong className="text-brand-text">
            {selectedBatch
              ? `${formatCurrency(selectedBatch.averageCost)} / ${selectedBatch.unit}`
              : '₹0.00'}
          </strong>
        </div>
      </div>

      {/* Input / Output / Wastage */}
      <div className="space-y-2 text-xs">
        <div className="flex justify-between">
          <span className="text-brand-muted">Total Input Quantity:</span>
          <strong className="text-brand-text">
            {formatNumber(metrics.totalInputQuantity)} {metrics.inputUnit}
          </strong>
        </div>
        <div className="flex justify-between">
          <span className="text-brand-muted">Actual Output Quantity:</span>
          <strong className="text-brand-primary">
            {formatNumber(metrics.actualOutputQuantity)}{' '}
            {outputs[0]?.outputUnit || metrics.inputUnit}
          </strong>
        </div>
        <div className="flex justify-between">
          <span className="text-brand-muted">Wastage Quantity:</span>
          <strong className="text-brand-warning">
            {formatNumber(metrics.wastageQuantity)} {metrics.inputUnit}
          </strong>
        </div>
        <div className="flex justify-between">
          <span className="text-brand-muted">Wastage Percentage:</span>
          <strong className="text-brand-warning">
            {formatNumber(metrics.wastagePercentage)}%
          </strong>
        </div>
      </div>

      {/* Cost Accounting Breakdown */}
      <div className="p-3.5 rounded-xl bg-brand-background border border-brand-border space-y-2 text-xs">
        <div className="flex justify-between">
          <span className="text-brand-muted">Allocated Raw Material Cost:</span>
          <strong className="text-brand-text">
            {formatCurrency(metrics.allocatedRawMaterialCost)}
          </strong>
        </div>
        <div className="flex justify-between">
          <span className="text-brand-muted">+ Total Processing Expenses:</span>
          <strong className="text-brand-text">
            {formatCurrency(metrics.totalProcessingExpenses)}
          </strong>
        </div>
        <div className="pt-2 border-t border-brand-border flex justify-between text-sm font-bold text-brand-primary">
          <span>Total Batch Cost:</span>
          <span>{formatCurrency(metrics.totalBatchCost)}</span>
        </div>
        <div className="pt-2 border-t border-brand-border flex justify-between items-center">
          <span className="font-semibold text-brand-text">
            Cost per Unit of Finished Product:
          </span>
          <span className="text-base font-bold text-brand-primary">
            {formatCurrency(metrics.costPerUnit)} /{' '}
            {outputs[0]?.outputUnit || metrics.inputUnit}
          </span>
        </div>
      </div>

      {/* Traceability Notice */}
      <div className="p-3 rounded-xl bg-brand-light/30 border border-brand-secondary/30 flex items-start gap-2 text-[11px] text-brand-primary">
        <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
        <span>
          <strong>Traceability Guarantee:</strong> Saving as Draft will NOT alter stock. Completing
          processing deducts input quantity from{' '}
          <strong>{selectedBatch?.id || 'the selected batch'}</strong> once, creates traceable
          finished product batch(es), and records processing expenses.
        </span>
      </div>

      {!metrics.allUnitsCompatible && (
        <div className="p-2.5 rounded-lg bg-brand-warning-light/60 border border-brand-warning/30 flex items-start gap-2 text-[11px] text-brand-warning">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            Input ({metrics.inputUnit}) and Output ({outputs[0]?.outputUnit}) have different physical
            dimensions (mass vs. volume). Enter actual wastage quantity in {metrics.inputUnit}.
          </span>
        </div>
      )}
    </div>
  );
}

export default ProcessingSummary;

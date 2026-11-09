import { Printer, CheckCircle2, Warehouse, PackageCheck, Landmark } from 'lucide-react';
import VendorStatusBadge from '../VendorStatusBadge';
import { formatCurrency, formatNumber } from '../../../utils/formatCurrency';
import { formatDate } from '../../../utils/formatDate';
import { printDocumentSummary } from '../../../utils/exportUtils';

export function ProcessingDetails({ record, onEditDraft, onClose }) {
  if (!record) return null;

  const handlePrint = () => {
    printDocumentSummary(
      `Product Processing Batch Sheet – ${record.id}`,
      `Batch Number: ${record.batchNumber} • Date: ${formatDate(record.processingDate)}`,
      [
        {
          heading: 'Source Raw Material Traceability',
          rows: [
            ['Raw Material & Variety', `${record.rawMaterial} (${record.rawMaterialVariety || 'Standard'})`],
            ['Raw Material Batch', `${record.rawMaterialBatchNumber} (${record.stockId})`],
            ['Original Purchase ID', record.originalPurchaseId],
            ['Supplier Reference', record.supplierReference],
            ['Input Quantity', `${record.inputQuantity} ${record.inputUnit}`],
          ],
        },
        {
          heading: 'Finished Output & Wastage',
          rows: [
            ['Finished Outputs', (record.outputs || []).map((o) => `${o.productName}: ${o.outputQuantity} ${o.outputUnit}`).join('; ')],
            ['Actual Output Quantity', `${record.actualOutputQuantity} ${record.outputUnit}`],
            ['Wastage Quantity & %', `${record.wastageQuantity} ${record.inputUnit} (${record.wastagePercentage}%)`],
          ],
        },
        {
          heading: 'Cost Accounting Summary',
          rows: [
            ['Allocated Raw Material Cost', formatCurrency(record.allocatedRawMaterialCost)],
            ['Total Processing Expenses', formatCurrency(record.totalProcessingExpenses)],
            ['Total Batch Cost', formatCurrency(record.totalBatchCost)],
            ['Finished Product Cost / Unit', `${formatCurrency(record.costPerUnit)} / ${record.outputUnit}`],
          ],
        },
      ]
    );
  };

  return (
    <div className="space-y-6 text-xs">
      {/* Header Banner */}
      <div className="p-4 rounded-xl bg-brand-light/40 border border-brand-secondary/30 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md bg-brand-primary text-white font-mono font-bold">
              {record.id}
            </span>
            <span className="font-mono font-bold text-brand-primary bg-white px-2.5 py-0.5 rounded border border-brand-secondary/30">
              {record.batchNumber}
            </span>
            <VendorStatusBadge status={record.status} size="xs" />
          </div>
          <p className="text-brand-muted mt-1">
            Location: <strong>{record.processingLocation}</strong> • Operator:{' '}
            <strong>{record.operatorName}</strong> • Date: {formatDate(record.processingDate)}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {record.status === 'Draft' && onEditDraft && (
            <button
              type="button"
              onClick={() => onEditDraft(record)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-semibold bg-brand-primary text-white hover:bg-brand-secondary cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Edit &amp; Complete Draft
            </button>
          )}
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold bg-brand-surface border border-brand-border text-brand-text hover:bg-brand-light hover:text-brand-primary cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            Print Batch Sheet
          </button>
        </div>
      </div>

      {/* Traceability Chain */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-xl bg-brand-background border border-brand-border space-y-1">
          <span className="inline-flex items-center gap-1 font-bold text-brand-primary uppercase">
            <Warehouse className="w-3.5 h-3.5" />
            1. Source Raw Material Batch
          </span>
          <p className="font-bold text-brand-text text-sm">
            {record.rawMaterial} ({record.rawMaterialVariety})
          </p>
          <p className="text-brand-muted">
            Batch: <strong>{record.rawMaterialBatchNumber}</strong> ({record.stockId})
          </p>
          <p className="text-brand-muted">
            Purchase Ref: <strong>{record.originalPurchaseId}</strong> • {record.supplierReference}
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-brand-light/40 border border-brand-secondary/30 space-y-1">
          <span className="inline-flex items-center gap-1 font-bold text-brand-primary uppercase">
            <PackageCheck className="w-3.5 h-3.5" />
            2. Finished Product Output(s)
          </span>
          {(record.outputs || []).map((o, idx) => (
            <div key={o.id || idx} className="flex items-center justify-between">
              <strong className="text-brand-text">
                {o.productName}: {formatNumber(o.outputQuantity)} {o.outputUnit}
              </strong>
              <span className="font-mono text-[11px] text-brand-primary">
                {o.finishedBatchId || 'Draft'}
              </span>
            </div>
          ))}
          <p className="text-brand-warning font-semibold pt-1">
            Wastage: {formatNumber(record.wastageQuantity)} {record.inputUnit} (
            {formatNumber(record.wastagePercentage)}%)
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-brand-background border border-brand-border space-y-1">
          <span className="inline-flex items-center gap-1 font-bold text-brand-primary uppercase">
            <Landmark className="w-3.5 h-3.5" />
            3. Cost Summary
          </span>
          <p className="font-bold text-brand-primary text-sm">
            Unit Cost: {formatCurrency(record.costPerUnit)} / {record.outputUnit}
          </p>
          <p className="text-brand-muted">
            Total Batch Cost: <strong>{formatCurrency(record.totalBatchCost)}</strong>
          </p>
        </div>
      </div>

      {/* Detailed Expenses Breakdown */}
      <div className="p-4 rounded-xl bg-brand-surface border border-brand-border">
        <h4 className="font-bold text-brand-primary uppercase tracking-wider mb-3">
          Processing Expenses &amp; Cost Breakdown
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <span className="text-brand-muted block">Allocated Raw Material Cost</span>
            <strong className="text-brand-text">
              {formatCurrency(record.allocatedRawMaterialCost)}
            </strong>
          </div>
          <div>
            <span className="text-brand-muted block">Processing Charges</span>
            <span>{formatCurrency(record.expenses?.processingCharges)}</span>
          </div>
          <div>
            <span className="text-brand-muted block">Labour Charges</span>
            <span>{formatCurrency(record.expenses?.labourCharges)}</span>
          </div>
          <div>
            <span className="text-brand-muted block">Electricity Charges</span>
            <span>{formatCurrency(record.expenses?.electricityCharges)}</span>
          </div>
          <div>
            <span className="text-brand-muted block">Packaging Charges</span>
            <span>{formatCurrency(record.expenses?.packagingCharges)}</span>
          </div>
          <div>
            <span className="text-brand-muted block">Transportation Charges</span>
            <span>{formatCurrency(record.expenses?.transportationCharges)}</span>
          </div>
          <div>
            <span className="text-brand-muted block">Other Expenses</span>
            <span>{formatCurrency(record.expenses?.otherExpenses)}</span>
          </div>
          <div>
            <span className="text-brand-primary font-semibold block">
              Total Processing Expenses
            </span>
            <strong className="text-brand-primary">
              {formatCurrency(record.totalProcessingExpenses)}
            </strong>
          </div>
        </div>
      </div>

      {record.notes && (
        <div className="p-3.5 rounded-xl bg-brand-background border border-brand-border">
          <span className="font-bold text-brand-primary block mb-1">Batch Notes:</span>
          <p className="text-brand-text">{record.notes}</p>
        </div>
      )}

      {onClose && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg font-semibold bg-brand-light text-brand-primary hover:bg-brand-secondary hover:text-white cursor-pointer"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}

export default ProcessingDetails;

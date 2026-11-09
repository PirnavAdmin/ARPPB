import { ShieldCheck, FileText, Truck, Calendar } from 'lucide-react';
import { formatCurrency, formatNumber } from '../../../utils/formatCurrency';
import { formatDate } from '../../../utils/formatDate';
import VendorStatusBadge from '../VendorStatusBadge';

export function PurchaseSummary({
  supplierCategory = 'Farmer',
  selectedSupplier = null,
  calc,
  purchaseDate,
  expectedPaymentDate,
  deliveryLocation,
}) {
  const cropsText =
    calc.lineItems.map((i) => `${i.cropName || 'Crop'} (${i.purchasedQuantity || 0} ${i.unit || 'Qtl'})`).join(', ') ||
    'No items entered';

  return (
    <div className="bg-brand-surface rounded-2xl border border-brand-border p-5 shadow-2xs space-y-4 sticky top-22">
      <div className="flex items-center justify-between border-b border-brand-border pb-3">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-brand-light text-brand-primary">
            Section E
          </span>
          <h3 className="text-base font-bold text-brand-primary mt-1">Purchase Summary</h3>
        </div>
        <VendorStatusBadge status="Pending" size="xs" />
      </div>

      {/* Supplier & Crop Summary */}
      <div className="space-y-2.5 text-xs">
        <div className="flex justify-between gap-2">
          <span className="text-brand-muted">Supplier ({supplierCategory}):</span>
          <strong className="text-brand-text text-right">
            {selectedSupplier
              ? `${
                  selectedSupplier.farmerName || selectedSupplier.businessName
                } (${selectedSupplier.id})`
              : 'Not selected'}
          </strong>
        </div>

        <div className="flex justify-between gap-2">
          <span className="text-brand-muted">Crop(s):</span>
          <strong className="text-brand-primary text-right">{cropsText}</strong>
        </div>

        <div className="flex justify-between gap-2">
          <span className="text-brand-muted">Total Quantity:</span>
          <strong className="text-brand-text">
            {formatNumber(calc.totalQuantity)}{' '}
            {calc.lineItems[0]?.unit || 'Quintal'}
          </strong>
        </div>
      </div>

      {/* Financial Breakdown */}
      <div className="p-3.5 rounded-xl bg-brand-background border border-brand-border space-y-2 text-xs">
        <div className="flex justify-between">
          <span className="text-brand-muted">Total Item Amount (Subtotals):</span>
          <strong className="text-brand-text">{formatCurrency(calc.itemsSubtotal)}</strong>
        </div>
        <div className="flex justify-between">
          <span className="text-brand-muted">+ Transportation Charges:</span>
          <span>{formatCurrency(calc.chargeBreakdown.transportationCharges)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-brand-muted">+ Loading &amp; Unloading:</span>
          <span>
            {formatCurrency(
              calc.chargeBreakdown.loadingCharges + calc.chargeBreakdown.unloadingCharges
            )}
          </span>
        </div>
        {supplierCategory === 'Farmer' && (
          <div className="flex justify-between">
            <span className="text-brand-muted">+ Hamali Charges:</span>
            <span>{formatCurrency(calc.chargeBreakdown.hamali)}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-brand-muted">+ Commission &amp; Other Charges:</span>
          <span>
            {formatCurrency(
              calc.chargeBreakdown.commission + calc.chargeBreakdown.otherCharges
            )}
          </span>
        </div>

        <div className="pt-2 border-t border-brand-border flex justify-between text-brand-primary font-semibold">
          <span>Total Additional Charges:</span>
          <span>{formatCurrency(calc.totalCharges)}</span>
        </div>

        <div className="pt-2.5 border-t border-brand-border flex items-center justify-between">
          <span className="text-sm font-bold text-brand-text">Final Purchase Amount:</span>
          <span className="text-lg font-bold text-brand-primary">
            {formatCurrency(calc.totalPurchaseAmount)}
          </span>
        </div>
      </div>

      {/* Payment & Delivery Metadata */}
      <div className="space-y-2 text-xs pt-1">
        <div className="flex items-center justify-between text-brand-muted">
          <span className="inline-flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-brand-primary" />
            Payment Status:
          </span>
          <strong className="text-brand-warning">Pending OTP Confirmation</strong>
        </div>
        <div className="flex items-center justify-between text-brand-muted">
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-brand-primary" />
            Purchase Date:
          </span>
          <strong className="text-brand-text">{formatDate(purchaseDate)}</strong>
        </div>
        <div className="flex items-center justify-between text-brand-muted">
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-brand-primary" />
            Expected Payment Date:
          </span>
          <strong className="text-brand-primary">{formatDate(expectedPaymentDate)}</strong>
        </div>
        <div className="flex items-center justify-between text-brand-muted">
          <span className="inline-flex items-center gap-1.5">
            <Truck className="w-3.5 h-3.5 text-brand-primary" />
            Godown Location:
          </span>
          <strong className="text-brand-text truncate max-w-[160px]">{deliveryLocation}</strong>
        </div>
      </div>

      <div className="p-3 rounded-xl bg-brand-light/40 border border-brand-secondary/30 flex items-start gap-2.5 text-[11px] text-brand-primary">
        <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
        <span>
          <strong>OTP Safeguard:</strong> Submitting this purchase generates a unique Transaction ID
          and sends a simulated 6-digit OTP to the {supplierCategory.toLowerCase()}. Inventory and
          payment obligations are updated only after OTP confirmation.
        </span>
      </div>
    </div>
  );
}

export default PurchaseSummary;

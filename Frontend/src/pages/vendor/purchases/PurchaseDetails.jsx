import { useState } from 'react';
import {
  Printer,
  Download,
  ShieldCheck,
  Warehouse,
  Landmark,
  CheckCircle2,
  Send,
  IndianRupee,
} from 'lucide-react';
import { useVendor } from '../../../hooks/useVendor';
import VendorStatusBadge from '../VendorStatusBadge';
import { formatCurrency, formatNumber, maskMobileNumber } from '../../../utils/formatCurrency';
import { formatDate } from '../../../utils/formatDate';
import { printDocumentSummary, exportToCSV } from '../../../utils/exportUtils';

export function PurchaseDetails({ purchase, onClose }) {
  const {
    confirmations,
    verifyTransactionOtp,
    resendTransactionOtp,
    submitDraftPurchase,
    recordFinancialSettlement,
  } = useVendor();

  const [otpInput, setOtpInput] = useState('');
  const [payAmount, setPayAmount] = useState('');

  if (!purchase) return null;

  const otpRecord = confirmations.find(
    (c) => c.id === purchase.otpId || c.transactionId === purchase.id
  );

  const balanceDue = Math.max(
    0,
    Number(purchase.totalAmount || 0) - Number(purchase.paidAmount || 0)
  );

  const handlePrint = () => {
    printDocumentSummary(
      `Purchase Voucher – ${purchase.id}`,
      `${purchase.supplierCategory} Purchase • Date: ${formatDate(purchase.purchaseDate)}`,
      [
        {
          heading: 'Supplier Information',
          rows: [
            ['Supplier Name', `${purchase.supplierName} (${purchase.supplierId})`],
            ['Category', purchase.supplierCategory],
            ['Mobile Number', `+91 ${purchase.mobileNumber}`],
            ['Location', `${purchase.village || ''} ${purchase.district}, ${purchase.state}`],
          ],
        },
        {
          heading: 'Raw Material & Pricing Breakdown',
          rows: [
            ['Crop & Variety', `${purchase.crop} (${purchase.variety || 'Standard'})`],
            ['Quantity & Rate', `${purchase.quantity} ${purchase.unit} @ ${formatCurrency(purchase.rate)}/${purchase.unit}`],
            ['Items Subtotal', formatCurrency(purchase.itemsSubtotal)],
            ['Additional Charges', formatCurrency(purchase.totalCharges)],
            ['Total Purchase Amount', formatCurrency(purchase.totalAmount)],
          ],
        },
        {
          heading: 'OTP, Inventory & Ledger Traceability',
          rows: [
            ['OTP Status', `${purchase.otpStatus} (${purchase.otpId || 'N/A'})`],
            ['Purchase Status', purchase.status],
            ['Raw Material Batch', purchase.stockBatchId || 'Not yet added'],
            ['Ledger Voucher Ref', purchase.ledgerEntryId || 'Not yet posted'],
            ['Expected Payment Date', formatDate(purchase.expectedPaymentDate)],
          ],
        },
      ]
    );
  };

  const handleDownloadSummary = () => {
    exportToCSV(
      [purchase],
      [
        { key: 'id', header: 'Purchase ID' },
        { key: 'supplierName', header: 'Supplier Name' },
        { key: 'supplierCategory', header: 'Category' },
        { key: 'crop', header: 'Crop' },
        { key: 'quantity', header: 'Quantity' },
        { key: 'unit', header: 'Unit' },
        { key: 'rate', header: 'Rate' },
        { key: 'itemsSubtotal', header: 'Subtotal' },
        { key: 'totalCharges', header: 'Charges' },
        { key: 'totalAmount', header: 'Total Amount' },
        { key: 'purchaseDate', header: 'Purchase Date' },
        { key: 'expectedPaymentDate', header: 'Expected Payment Date' },
        { key: 'otpStatus', header: 'OTP Status' },
        { key: 'status', header: 'Status' },
        { key: 'stockBatchId', header: 'Inventory Batch ID' },
        { key: 'ledgerEntryId', header: 'Ledger Ref' },
      ],
      `${purchase.id}_summary.csv`
    );
  };

  return (
    <div className="space-y-6 text-xs">
      {/* Header Banner */}
      <div className="p-4 rounded-xl bg-brand-light/40 border border-brand-secondary/30 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md bg-brand-primary text-white font-mono font-bold">
              {purchase.id}
            </span>
            <VendorStatusBadge status={purchase.status} size="xs" />
            <VendorStatusBadge status={purchase.otpStatus} size="xs" />
            <VendorStatusBadge status={purchase.paymentStatus} size="xs" />
          </div>
          <p className="text-brand-muted mt-1">
            {purchase.supplierCategory} Purchase • Recorded on {formatDate(purchase.purchaseDate)}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDownloadSummary}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold bg-brand-light text-brand-primary hover:bg-brand-secondary hover:text-white transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Download Summary
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold bg-brand-surface border border-brand-border text-brand-text hover:bg-brand-light hover:text-brand-primary transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            Print Purchase Details
          </button>
        </div>
      </div>

      {/* Draft or Pending OTP Action Box */}
      {purchase.status === 'Draft' && (
        <div className="p-4 rounded-xl bg-brand-warning-light/60 border border-brand-warning/30 flex items-center justify-between gap-4">
          <div>
            <h4 className="font-bold text-brand-text text-sm">Draft Purchase Record</h4>
            <p className="text-brand-muted">
              This purchase is currently saved as a draft. Submit it to generate an OTP and initiate
              confirmation.
            </p>
          </div>
          <button
            type="button"
            onClick={() => submitDraftPurchase(purchase.id)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg font-semibold bg-brand-primary text-white hover:bg-brand-secondary cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            Submit &amp; Generate OTP
          </button>
        </div>
      )}

      {purchase.status !== 'Confirmed' && purchase.status !== 'Draft' && otpRecord && (
        <div className="p-4 rounded-xl bg-brand-light/50 border border-brand-secondary/40 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-brand-primary" />
              <span className="font-bold text-brand-primary text-sm">
                Pending {purchase.supplierCategory} OTP Confirmation ({otpRecord.id})
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-brand-muted">Demo OTP Code:</span>
              <code className="px-2.5 py-0.5 rounded bg-brand-primary text-white font-mono font-bold tracking-widest">
                {otpRecord.demoOtpCode}
              </code>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              maxLength={6}
              value={otpInput || otpRecord.demoOtpCode}
              onChange={(e) => setOtpInput(e.target.value)}
              placeholder="Enter 6-digit OTP"
              className="px-3 py-1.5 bg-white border border-brand-border rounded-lg font-mono font-bold tracking-widest text-sm w-44"
            />
            <button
              type="button"
              onClick={() =>
                verifyTransactionOtp(otpRecord.id, otpInput || otpRecord.demoOtpCode)
              }
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg font-semibold bg-brand-primary text-white hover:bg-brand-secondary cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Verify OTP &amp; Confirm Purchase
            </button>
            <button
              type="button"
              onClick={() => resendTransactionOtp(otpRecord.id)}
              className="px-3 py-1.5 rounded-lg font-semibold bg-white border border-brand-border text-brand-primary hover:bg-brand-light cursor-pointer"
            >
              Resend OTP
            </button>
          </div>
        </div>
      )}

      {/* Supplier & Traceability Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-brand-surface border border-brand-border space-y-2">
          <h4 className="font-bold text-brand-primary uppercase tracking-wider">
            Supplier Information
          </h4>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-brand-muted block">Supplier Name</span>
              <strong className="text-brand-text">{purchase.supplierName}</strong>
            </div>
            <div>
              <span className="text-brand-muted block">Supplier ID &amp; Category</span>
              <strong className="text-brand-primary">
                {purchase.supplierId} ({purchase.supplierCategory})
              </strong>
            </div>
            <div>
              <span className="text-brand-muted block">Mobile Number</span>
              <span>{maskMobileNumber(purchase.mobileNumber)}</span>
            </div>
            <div>
              <span className="text-brand-muted block">Location</span>
              <span>
                {purchase.village ? `${purchase.village}, ` : ''}
                {purchase.district}, {purchase.state}
              </span>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-brand-surface border border-brand-border space-y-2">
          <h4 className="font-bold text-brand-primary uppercase tracking-wider">
            Traceability &amp; Accounting Status
          </h4>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-brand-muted block">Inventory Update Status</span>
              <span className="inline-flex items-center gap-1 font-bold text-brand-primary">
                <Warehouse className="w-3.5 h-3.5" />
                {purchase.inventoryUpdated
                  ? `Added (${purchase.stockBatchId})`
                  : 'Awaiting Confirmation'}
              </span>
            </div>
            <div>
              <span className="text-brand-muted block">Ledger Reference</span>
              <span className="inline-flex items-center gap-1 font-bold text-brand-text">
                <Landmark className="w-3.5 h-3.5 text-brand-primary" />
                {purchase.ledgerEntryId || 'Not yet posted'}
              </span>
            </div>
            <div>
              <span className="text-brand-muted block">Expected Payment Date</span>
              <strong className="text-brand-primary">
                {formatDate(purchase.expectedPaymentDate)}
              </strong>
            </div>
            <div>
              <span className="text-brand-muted block">Delivery Location</span>
              <span>{purchase.deliveryLocation || 'Kurnool Main Godown'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Line Items Table */}
      <div className="rounded-xl border border-brand-border overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-brand-light/40 border-b border-brand-border text-brand-primary font-bold uppercase">
              <th className="p-3">Crop Name</th>
              <th className="p-3">Variety</th>
              <th className="p-3">Quality Grade</th>
              <th className="p-3 text-right">Quantity</th>
              <th className="p-3 text-right">Rate / Unit</th>
              <th className="p-3 text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-border bg-brand-surface">
            {(purchase.items || []).map((it, idx) => (
              <tr key={it.id || idx}>
                <td className="p-3 font-bold text-brand-text">{it.cropName || purchase.crop}</td>
                <td className="p-3">{it.cropVariety || purchase.variety}</td>
                <td className="p-3">{it.qualityGrade || purchase.qualityGrade}</td>
                <td className="p-3 text-right font-semibold">
                  {formatNumber(it.purchasedQuantity)} {it.unit || purchase.unit}
                </td>
                <td className="p-3 text-right">{formatCurrency(it.pricePerUnit)}</td>
                <td className="p-3 text-right font-bold text-brand-primary">
                  {formatCurrency(it.subtotal)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Additional Charges & Payment Settlement */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-brand-background border border-brand-border space-y-1.5">
          <h4 className="font-bold text-brand-primary uppercase tracking-wider mb-2">
            Charges &amp; Final Amount Breakdown
          </h4>
          <div className="flex justify-between">
            <span className="text-brand-muted">Items Subtotal:</span>
            <strong>{formatCurrency(purchase.itemsSubtotal)}</strong>
          </div>
          <div className="flex justify-between">
            <span className="text-brand-muted">Transportation Charges:</span>
            <span>{formatCurrency(purchase.charges?.transportationCharges)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-brand-muted">Loading &amp; Unloading:</span>
            <span>
              {formatCurrency(
                Number(purchase.charges?.loadingCharges || 0) +
                  Number(purchase.charges?.unloadingCharges || 0)
              )}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-brand-muted">Hamali &amp; Commission:</span>
            <span>
              {formatCurrency(
                Number(purchase.charges?.hamali || 0) +
                  Number(purchase.charges?.commission || 0) +
                  Number(purchase.charges?.otherCharges || 0)
              )}
            </span>
          </div>
          <div className="pt-2 border-t border-brand-border flex justify-between text-sm font-bold text-brand-primary">
            <span>Total Purchase Amount:</span>
            <span>{formatCurrency(purchase.totalAmount)}</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-brand-surface border border-brand-border flex flex-col justify-between">
          <div>
            <h4 className="font-bold text-brand-primary uppercase tracking-wider mb-2">
              Payment Timeline &amp; Settlement
            </h4>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="p-2.5 rounded-lg bg-brand-background border border-brand-border">
                <span className="text-brand-muted block">Amount Paid</span>
                <strong className="text-brand-success text-sm">
                  {formatCurrency(purchase.paidAmount)}
                </strong>
              </div>
              <div className="p-2.5 rounded-lg bg-brand-light/40 border border-brand-secondary/30">
                <span className="text-brand-primary block">Balance Payable</span>
                <strong className="text-brand-warning text-sm">
                  {formatCurrency(balanceDue)}
                </strong>
              </div>
            </div>
          </div>

          {purchase.status === 'Confirmed' && balanceDue > 0 && (
            <div className="pt-2 border-t border-brand-border flex items-center gap-2">
              <input
                type="number"
                min="1"
                max={balanceDue}
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                placeholder={`Pay up to ₹${balanceDue}`}
                className="flex-1 px-3 py-1.5 bg-brand-background border border-brand-border rounded-lg text-xs"
              />
              <button
                type="button"
                onClick={() => {
                  const amt = Number(payAmount) || balanceDue;
                  recordFinancialSettlement({
                    settlementType: 'Supplier Payment',
                    partyId: purchase.supplierId,
                    partyName: purchase.supplierName,
                    partyCategory: purchase.supplierCategory,
                    referenceTransactionId: purchase.id,
                    amount: amt,
                  });
                  setPayAmount('');
                }}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg font-semibold bg-brand-primary text-white hover:bg-brand-secondary cursor-pointer"
              >
                <IndianRupee className="w-3.5 h-3.5" />
                Record Payment
              </button>
            </div>
          )}
        </div>
      </div>

      {onClose && (
        <div className="flex justify-end pt-2">
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

export default PurchaseDetails;


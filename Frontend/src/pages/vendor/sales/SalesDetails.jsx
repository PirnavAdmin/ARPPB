import { useState } from 'react';
import {
  Printer,
  Download,
  CreditCard,
  ShieldCheck,
  MapPin,
  Package,
  Calendar,
  ExternalLink,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useVendor } from '../../../hooks/useVendor';
import { formatCurrency } from '../../../utils/formatCurrency';
import { formatDate } from '../../../utils/formatDate';
import { printDocumentSummary, exportToCSV } from '../../../utils/exportUtils';
import VendorModal from '../VendorModal';
import VendorStatusBadge from '../VendorStatusBadge';

export default function SalesDetails({ sale, isOpen, onClose }) {
  const navigate = useNavigate();
  const { recordFinancialSettlement, confirmations } = useVendor();

  const [receiptAmount, setReceiptAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('NEFT / RTGS');
  const [receiptNotes, setReceiptNotes] = useState('');

  if (!sale) return null;

  const balanceDue = Math.max(
    0,
    (sale.totalAmount || 0) - (sale.receivedAmount || 0)
  );
  const linkedOtp = confirmations.find(
    (c) => c.id === sale.otpId || c.transactionId === sale.id
  );

  const handleRecordReceipt = (e) => {
    e.preventDefault();
    const amt = Number(receiptAmount || balanceDue);
    if (amt <= 0) return;
    recordFinancialSettlement({
      settlementType: 'Customer Payment',
      partyId: sale.customerId,
      partyName: sale.customerName,
      partyCategory: 'Customer',
      referenceTransactionId: sale.id,
      amount: Math.min(amt, balanceDue),
      paymentMode,
      notes: receiptNotes || `Receipt against invoice ${sale.id}`,
    });
    setReceiptAmount('');
    setReceiptNotes('');
  };

  const handlePrintInvoice = () => {
    printDocumentSummary({
      title: `Tax Invoice & Sales Summary – ${sale.id}`,
      subtitle: `Order Reference: ${sale.orderId || '—'} | Sales Date: ${formatDate(sale.salesDate)}`,
      metadata: [
        { label: 'Sales Invoice ID', value: sale.id },
        { label: 'Order ID', value: sale.orderId || '—' },
        { label: 'Customer Name', value: sale.customerName },
        { label: 'Business Name', value: sale.businessName || '—' },
        { label: 'Mobile Number', value: sale.mobileNumber || '—' },
        { label: 'Delivery Address', value: sale.deliveryAddress || '—' },
        { label: 'OTP Confirmation', value: sale.confirmationStatus },
        { label: 'Payment Status', value: sale.paymentStatus },
        { label: 'Expected Payment Date', value: formatDate(sale.expectedPaymentDate) },
        { label: 'Final Invoice Amount', value: formatCurrency(sale.totalAmount) },
      ],
      items: (sale.items && sale.items.length > 0
        ? sale.items
        : [
            {
              productName: sale.product,
              batchNumber: sale.batchNumber || 'Standard',
              sellingQuantity: sale.quantity,
              unit: sale.unit,
              pricePerUnit: sale.unitPrice,
              subtotal: sale.subtotal || sale.totalAmount,
            },
          ]
      ).map((item) => ({
        Product: item.productName,
        Batch: item.batchNumber || item.batchId || 'Standard',
        Quantity: `${item.sellingQuantity ?? item.quantity} ${item.unit}`,
        'Unit Price': formatCurrency(item.pricePerUnit),
        Subtotal: formatCurrency(
          item.subtotal || (item.sellingQuantity ?? item.quantity) * item.pricePerUnit
        ),
      })),
    });
  };

  const handleDownloadInvoiceCsv = () => {
    exportToCSV(
      [
        {
          salesId: sale.id,
          orderId: sale.orderId,
          customerName: sale.customerName,
          product: sale.product,
          quantity: sale.quantity,
          unit: sale.unit,
          unitPrice: sale.unitPrice,
          subtotal: sale.subtotal,
          discount: sale.discount,
          tax: sale.tax,
          deliveryCharges: sale.deliveryCharges,
          totalAmount: sale.totalAmount,
          receivedAmount: sale.receivedAmount,
          balanceDue,
          salesDate: sale.salesDate,
          confirmationStatus: sale.confirmationStatus,
          paymentStatus: sale.paymentStatus,
          salesStatus: sale.salesStatus,
        },
      ],
      [
        { key: 'salesId', label: 'Sales ID' },
        { key: 'orderId', label: 'Order ID' },
        { key: 'customerName', label: 'Customer Name' },
        { key: 'product', label: 'Product' },
        { key: 'quantity', label: 'Quantity' },
        { key: 'unit', label: 'Unit' },
        { key: 'unitPrice', label: 'Unit Price' },
        { key: 'totalAmount', label: 'Total Amount' },
        { key: 'receivedAmount', label: 'Amount Received' },
        { key: 'balanceDue', label: 'Balance Due' },
        { key: 'salesDate', label: 'Sales Date' },
        { key: 'confirmationStatus', label: 'OTP Confirmation' },
        { key: 'paymentStatus', label: 'Payment Status' },
        { key: 'salesStatus', label: 'Sales Status' },
      ],
      `Sales_Invoice_${sale.id}`
    );
  };

  const lineItems =
    Array.isArray(sale.items) && sale.items.length > 0
      ? sale.items
      : [
          {
            productId: sale.productId,
            productName: sale.product,
            batchId: sale.batchId,
            batchNumber: sale.batchNumber || 'Standard Batch',
            sellingQuantity: sale.quantity,
            unit: sale.unit,
            pricePerUnit: sale.unitPrice,
            subtotal: sale.subtotal || sale.totalAmount,
          },
        ];

  return (
    <VendorModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Sales Invoice & Order Details – ${sale.id}`}
      subtitle={`Linked Order: ${sale.orderId || '—'} | Customer: ${sale.customerName} (${sale.customerId})`}
      size="xl"
      footer={
        <div className="flex flex-wrap items-center justify-between w-full gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrintInvoice}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-brand-primary text-white hover:bg-brand-secondary transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              Print Invoice
            </button>
            <button
              type="button"
              onClick={handleDownloadInvoiceCsv}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-brand-border bg-brand-surface text-brand-text hover:bg-brand-light/40 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-brand-primary" />
              Download Summary
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-lg border border-brand-border text-brand-text hover:bg-brand-background cursor-pointer"
          >
            Close
          </button>
        </div>
      }
    >
      <div className="space-y-5">
        {/* Status Header Bar */}
        <div className="p-4 rounded-xl bg-brand-light/40 border border-brand-primary/20 flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-extrabold text-brand-primary">{sale.id}</span>
              <span className="text-xs text-brand-muted">•</span>
              <span className="text-xs font-semibold text-brand-text">
                Order Ref: {sale.orderId}
              </span>
            </div>
            <p className="text-xs text-brand-muted">
              Sales Date: <strong>{formatDate(sale.salesDate)}</strong> | Expected Payment:{' '}
              <strong>{formatDate(sale.expectedPaymentDate)}</strong>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="text-xs">
              <span className="text-brand-muted mr-1">OTP:</span>
              <VendorStatusBadge status={sale.confirmationStatus} />
            </div>
            <div className="text-xs">
              <span className="text-brand-muted mr-1">Payment:</span>
              <VendorStatusBadge status={sale.paymentStatus} />
            </div>
            <div className="text-xs">
              <span className="text-brand-muted mr-1">Order Status:</span>
              <VendorStatusBadge status={sale.salesStatus} />
            </div>
          </div>
        </div>

        {/* Customer & Delivery Metadata */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-brand-border bg-brand-background/50 space-y-2 text-xs">
            <h4 className="font-bold text-brand-text flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-brand-primary" />
              Customer & Delivery Information
            </h4>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div>
                <span className="text-brand-muted block">Customer Name</span>
                <span className="font-semibold text-brand-text">{sale.customerName}</span>
              </div>
              <div>
                <span className="text-brand-muted block">Business Entity</span>
                <span className="font-semibold text-brand-text">
                  {sale.businessName || 'Direct Buyer'}
                </span>
              </div>
              <div>
                <span className="text-brand-muted block">Mobile Number</span>
                <span className="font-semibold text-brand-text">
                  {sale.mobileNumber || '—'}
                </span>
              </div>
              <div>
                <span className="text-brand-muted block">Payment Terms</span>
                <span className="font-semibold text-brand-text">
                  {sale.paymentTerms || 'Net 15 Days'}
                </span>
              </div>
            </div>
            <div className="pt-1 border-t border-brand-border">
              <span className="text-brand-muted block">Dispatch Address</span>
              <span className="font-medium text-brand-text">
                {sale.deliveryAddress || `${sale.district || 'Kurnool'}, ${sale.state || 'Andhra Pradesh'}`}
              </span>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-brand-border bg-brand-background/50 space-y-2 text-xs">
            <h4 className="font-bold text-brand-text flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-brand-primary" />
              OTP Verification & Stock Allocation
            </h4>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div>
                <span className="text-brand-muted block">OTP Record ID</span>
                <span className="font-mono font-bold text-brand-primary">
                  {sale.otpId || linkedOtp?.id || '—'}
                </span>
              </div>
              <div>
                <span className="text-brand-muted block">Demo OTP Code</span>
                <span className="font-mono font-bold text-brand-text">
                  {linkedOtp?.demoOtpCode || 'Verified'}
                </span>
              </div>
              <div>
                <span className="text-brand-muted block">Stock Allocation</span>
                <span className="font-semibold text-brand-text">
                  {sale.stockAllocationStage || 'Deducted'}
                </span>
              </div>
              <div>
                <span className="text-brand-muted block">Expected Delivery</span>
                <span className="font-semibold text-brand-text">
                  {formatDate(sale.expectedDeliveryDate)}
                </span>
              </div>
            </div>
            {sale.confirmationStatus !== 'Verified' && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    navigate('/vendor/confirmations');
                  }}
                  className="inline-flex items-center gap-1 text-xs font-bold text-brand-primary hover:underline cursor-pointer"
                >
                  Verify Customer OTP in Confirmations Screen
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Line Items Table */}
        <div className="border border-brand-border rounded-xl overflow-hidden">
          <div className="bg-brand-light/40 px-4 py-2.5 border-b border-brand-border flex items-center gap-2">
            <Package className="w-4 h-4 text-brand-primary" />
            <span className="text-xs font-bold text-brand-text">
              Sold Finished Products & Batch Traceability
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-brand-background border-b border-brand-border text-brand-muted">
                  <th className="py-2.5 px-3 font-semibold">Finished Product</th>
                  <th className="py-2.5 px-3 font-semibold">Batch Reference</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Quantity</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Unit Price</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Line Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border">
                {lineItems.map((item, idx) => {
                  const qty = item.sellingQuantity ?? item.quantity;
                  const sub = item.subtotal || qty * item.pricePerUnit;
                  return (
                    <tr key={idx}>
                      <td className="py-2.5 px-3 font-semibold text-brand-text">
                        {item.productName}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-brand-primary">
                        {item.batchNumber || item.batchId || 'Standard'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-medium">
                        {qty} {item.unit}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        {formatCurrency(item.pricePerUnit)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-brand-text">
                        {formatCurrency(sub)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Financial Breakdown & Payment Collection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-brand-border bg-brand-surface space-y-2 text-xs">
            <h4 className="font-bold text-brand-text mb-2">Invoice Financial Breakdown</h4>
            <div className="flex justify-between">
              <span className="text-brand-muted">Items Subtotal</span>
              <span className="font-semibold">
                {formatCurrency(sale.subtotal || sale.totalAmount)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-brand-muted">Commercial Discount</span>
              <span className="text-brand-error font-semibold">
                - {formatCurrency(sale.discount || 0)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-brand-muted">Applicable Tax / GST</span>
              <span className="font-semibold">+ {formatCurrency(sale.tax || 0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-brand-muted">Delivery & Freight Charges</span>
              <span className="font-semibold">
                + {formatCurrency(sale.deliveryCharges || 0)}
              </span>
            </div>
            <div className="pt-2 border-t border-brand-border flex justify-between text-sm font-extrabold text-brand-primary">
              <span>Total Invoice Value</span>
              <span>{formatCurrency(sale.totalAmount)}</span>
            </div>
            <div className="flex justify-between text-brand-success font-semibold">
              <span>Amount Received to Date</span>
              <span>{formatCurrency(sale.receivedAmount || 0)}</span>
            </div>
            <div className="flex justify-between text-brand-warning font-bold">
              <span>Balance Receivable Due</span>
              <span>{formatCurrency(balanceDue)}</span>
            </div>
          </div>

          {/* Record Customer Receipt Box */}
          {sale.confirmationStatus === 'Verified' &&
          sale.salesStatus !== 'Cancelled' &&
          balanceDue > 0 ? (
            <form
              onSubmit={handleRecordReceipt}
              className="p-4 rounded-xl border border-brand-primary/30 bg-brand-light/25 space-y-3 text-xs"
            >
              <h4 className="font-bold text-brand-primary flex items-center gap-1.5">
                <CreditCard className="w-4 h-4" />
                Record Customer Payment Receipt
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-brand-text mb-1">
                    Amount Received (₹)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={balanceDue}
                    value={receiptAmount}
                    onChange={(e) => setReceiptAmount(e.target.value)}
                    placeholder={`Max ₹${balanceDue}`}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-brand-border bg-brand-surface text-brand-text"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-brand-text mb-1">
                    Payment Mode
                  </label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-brand-border bg-brand-surface text-brand-text"
                  >
                    <option value="NEFT / RTGS">NEFT / RTGS</option>
                    <option value="UPI / IMPS">UPI / IMPS</option>
                    <option value="Cheque / DD">Cheque / DD</option>
                    <option value="Cash">Cash</option>
                  </select>
                </div>
              </div>
              <div>
                <input
                  type="text"
                  value={receiptNotes}
                  onChange={(e) => setReceiptNotes(e.target.value)}
                  placeholder="UTR / Reference number or remarks..."
                  className="w-full px-2.5 py-1.5 rounded-lg border border-brand-border bg-brand-surface text-brand-text"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2 rounded-lg bg-brand-primary text-white font-bold hover:bg-brand-secondary transition-colors cursor-pointer"
              >
                Post Customer Receipt to Ledger
              </button>
            </form>
          ) : (
            <div className="p-4 rounded-xl border border-brand-border bg-brand-background/50 flex flex-col justify-center items-center text-center text-xs text-brand-muted">
              <Calendar className="w-6 h-6 text-brand-primary mb-1.5" />
              {balanceDue <= 0 ? (
                <p className="font-semibold text-brand-success">
                  Full invoice payment of {formatCurrency(sale.totalAmount)} has been settled.
                </p>
              ) : (
                <p>
                  Verify the customer OTP first to confirm this sale and unlock payment collection.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </VendorModal>
  );
}


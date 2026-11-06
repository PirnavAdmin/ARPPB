import { useNavigate } from 'react-router-dom';
import { Phone, Mail, MapPin, ShoppingBag, Landmark } from 'lucide-react';
import VendorStatusBadge from '../VendorStatusBadge';
import VendorDataTable from '../VendorDataTable';
import { formatCurrency } from '../../../utils/formatCurrency';
import { formatDate } from '../../../utils/formatDate';

export function CustomerDetails({ customer, orders = [], sales = [], onEdit, onClose }) {
  const navigate = useNavigate();
  if (!customer) return null;

  const custSales = sales.filter((s) => s.customerId === customer.id);
  const custOrders = orders.filter((o) => o.customerId === customer.id);

  const columns = [
    {
      key: 'id',
      header: 'Sales ID',
      render: (row) => <span className="font-bold text-brand-primary">{row.id}</span>,
    },
    {
      key: 'orderId',
      header: 'Order ID',
      render: (row) => <span className="font-mono text-xs">{row.orderId}</span>,
    },
    {
      key: 'salesDate',
      header: 'Date',
      render: (row) => formatDate(row.salesDate),
    },
    {
      key: 'product',
      header: 'Product',
    },
    {
      key: 'quantity',
      header: 'Quantity',
      render: (row) => `${row.quantity} ${row.unit}`,
    },
    {
      key: 'totalAmount',
      header: 'Total Value',
      align: 'right',
      render: (row) => (
        <span className="font-bold text-brand-primary">{formatCurrency(row.totalAmount)}</span>
      ),
    },
    {
      key: 'paymentStatus',
      header: 'Payment',
      render: (row) => <VendorStatusBadge status={row.paymentStatus} size="xs" />,
    },
    {
      key: 'salesStatus',
      header: 'Order Status',
      render: (row) => <VendorStatusBadge status={row.salesStatus} size="xs" />,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="p-4 rounded-xl bg-brand-light/40 border border-brand-secondary/30 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="px-2.5 py-0.5 rounded-md bg-brand-primary text-white font-mono text-xs font-bold">
              {customer.id}
            </span>
            <h3 className="text-lg font-bold text-brand-text">{customer.customerName}</h3>
            <VendorStatusBadge status={customer.status} size="xs" />
          </div>
          <p className="text-xs text-brand-muted mt-1">
            {customer.businessName || 'Individual Direct Buyer'} • GSTIN:{' '}
            <strong>{customer.gstNumber || 'N/A'}</strong> • Credit Limit:{' '}
            <strong>{formatCurrency(customer.creditLimit)}</strong>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              onClose();
              navigate(`/vendor/sales/new?customerId=${customer.id}`);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-brand-primary text-white hover:bg-brand-secondary transition-colors cursor-pointer"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            Sell Products
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              navigate('/vendor/ledger');
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-brand-surface border border-brand-border text-brand-primary hover:bg-brand-light transition-colors cursor-pointer"
          >
            <Landmark className="w-3.5 h-3.5" />
            View Ledger
          </button>
          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(customer)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-brand-surface border border-brand-border text-brand-text hover:bg-brand-light transition-colors cursor-pointer"
            >
              Edit
            </button>
          )}
        </div>
      </div>

      {/* 6 Required Customer Detail KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3 rounded-xl bg-brand-background border border-brand-border">
          <span className="text-[10px] font-bold uppercase text-brand-muted">Total Orders</span>
          <p className="text-base font-bold text-brand-primary mt-0.5">{customer.totalOrders}</p>
        </div>
        <div className="p-3 rounded-xl bg-brand-background border border-brand-border">
          <span className="text-[10px] font-bold uppercase text-brand-muted">Completed Orders</span>
          <p className="text-base font-bold text-brand-success mt-0.5">
            {customer.completedOrders}
          </p>
        </div>
        <div className="p-3 rounded-xl bg-brand-background border border-brand-border">
          <span className="text-[10px] font-bold uppercase text-brand-muted">Pending Orders</span>
          <p className="text-base font-bold text-brand-warning mt-0.5">
            {customer.pendingOrders}
          </p>
        </div>
        <div className="p-3 rounded-xl bg-brand-background border border-brand-border">
          <span className="text-[10px] font-bold uppercase text-brand-muted">Total Sales Value</span>
          <p className="text-base font-bold text-brand-text mt-0.5">
            {formatCurrency(customer.totalPurchaseValue)}
          </p>
        </div>
        <div className="p-3 rounded-xl bg-brand-background border border-brand-border">
          <span className="text-[10px] font-bold uppercase text-brand-muted">Amount Received</span>
          <p className="text-base font-bold text-brand-success mt-0.5">
            {formatCurrency(customer.totalAmountReceived)}
          </p>
        </div>
        <div className="p-3 rounded-xl bg-brand-light/40 border border-brand-secondary/40">
          <span className="text-[10px] font-bold uppercase text-brand-primary">
            Outstanding Receivables
          </span>
          <p className="text-base font-bold text-brand-warning mt-0.5">
            {formatCurrency(customer.outstandingReceivables)}
          </p>
        </div>
      </div>

      {/* Contact & Delivery Location */}
      <div className="p-4 rounded-xl bg-brand-surface border border-brand-border grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <div className="flex items-center gap-2">
          <Phone className="w-4 h-4 text-brand-primary" />
          <span>+91 {customer.mobileNumber}</span>
        </div>
        <div className="flex items-center gap-2">
          <Mail className="w-4 h-4 text-brand-primary" />
          <span>{customer.email || '—'}</span>
        </div>
        <div className="flex items-start gap-2">
          <MapPin className="w-4 h-4 text-brand-primary shrink-0 mt-0.5" />
          <span>
            {customer.address}, {customer.district}, {customer.state} - {customer.pinCode || '—'}
          </span>
        </div>
      </div>

      {/* Recent Transactions Table */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-brand-primary mb-2">
          Recent Sales &amp; Order Transactions ({custOrders.length} Orders)
        </h4>
        <VendorDataTable
          columns={columns}
          data={custSales}
          initialPageSize={5}
          emptyTitle="No sales transactions recorded for this customer"
        />
      </div>
    </div>
  );
}

export default CustomerDetails;


import VendorDataTable from '../VendorDataTable';
import VendorStatusBadge from '../VendorStatusBadge';
import { formatCurrency, formatNumber } from '../../../utils/formatCurrency';
import { formatDate } from '../../../utils/formatDate';

export function ProductSalesHistory({ product, sales = [] }) {
  const productSales = sales.filter(
    (s) =>
      s.productId === product?.id ||
      (s.items || []).some((it) => it.productId === product?.id) ||
      s.product.toLowerCase().includes((product?.productName || '').toLowerCase())
  );

  const columns = [
    {
      key: 'id',
      header: 'Sales ID',
      render: (row) => <span className="font-mono font-bold text-brand-primary">{row.id}</span>,
    },
    {
      key: 'orderId',
      header: 'Order ID',
      render: (row) => <span className="font-mono text-xs">{row.orderId}</span>,
    },
    {
      key: 'salesDate',
      header: 'Sales Date',
      render: (row) => formatDate(row.salesDate),
    },
    {
      key: 'customerName',
      header: 'Customer Name',
    },
    {
      key: 'batchNumber',
      header: 'Batch Reference',
      render: (row) => <span className="font-mono text-xs">{row.batchNumber}</span>,
    },
    {
      key: 'quantity',
      header: 'Quantity Sold',
      align: 'right',
      render: (row) => `${formatNumber(row.quantity)} ${row.unit}`,
    },
    {
      key: 'unitPrice',
      header: 'Selling Price',
      align: 'right',
      render: (row) => formatCurrency(row.unitPrice),
    },
    {
      key: 'totalAmount',
      header: 'Total Invoice Value',
      align: 'right',
      render: (row) => (
        <span className="font-bold text-brand-primary">{formatCurrency(row.totalAmount)}</span>
      ),
    },
    {
      key: 'salesStatus',
      header: 'Status',
      render: (row) => <VendorStatusBadge status={row.salesStatus} size="xs" />,
    },
  ];

  return (
    <VendorDataTable
      columns={columns}
      data={productSales}
      initialPageSize={5}
      emptyTitle="No sales recorded for this finished product yet"
    />
  );
}

export default ProductSalesHistory;


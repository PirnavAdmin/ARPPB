import { useSearchParams, useNavigate } from 'react-router-dom';
import { ShoppingBag, History, ClipboardList, PackageCheck } from 'lucide-react';
import { useVendor } from '../../../hooks/useVendor';
import { formatCurrency } from '../../../utils/formatCurrency';
import VendorPageHeader from '../VendorPageHeader';
import SalesForm from './SalesForm';

export default function SellProducts() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { products, customers, orders } = useVendor();

  const preselectedProductId = searchParams.get('productId') || '';
  const preselectedCustomerId = searchParams.get('customerId') || '';

  const activeProductsCount = products.filter((p) => p.status === 'Active').length;
  const totalAvailableStockValue = products
    .filter((p) => p.status === 'Active')
    .reduce((sum, p) => sum + (p.availableQuantity || 0) * (p.sellingPrice || 0), 0);

  return (
    <div className="space-y-6">
      <VendorPageHeader
        title="Sell Finished Products"
        subtitle="Create B2B/B2C customer sales orders from traceable finished product batches with OTP confirmation"
        badge={`${activeProductsCount} Active Products Ready`}
        actions={
          <>
            <button
              type="button"
              onClick={() => navigate('/vendor/orders')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg border border-brand-border bg-brand-surface text-brand-text hover:bg-brand-light/40 transition-colors cursor-pointer"
            >
              <ClipboardList className="w-4 h-4 text-brand-primary" />
              Customer Orders ({orders.length})
            </button>
            <button
              type="button"
              onClick={() => navigate('/vendor/sales/history')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-brand-primary text-white hover:bg-brand-secondary transition-colors cursor-pointer"
            >
              <History className="w-4 h-4" />
              Sales History
            </button>
          </>
        }
      />

      {/* Quick Merchandising Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-brand-surface border border-brand-border flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-brand-light text-brand-primary">
            <PackageCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-brand-muted block">Sellable Finished Catalog</span>
            <span className="text-base font-extrabold text-brand-text">
              {activeProductsCount} Graded SKU Lines
            </span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-brand-surface border border-brand-border flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-brand-light text-brand-primary">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-brand-muted block">Available Stock Market Value</span>
            <span className="text-base font-extrabold text-brand-primary">
              {formatCurrency(totalAvailableStockValue)}
            </span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-brand-surface border border-brand-border flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-brand-light text-brand-primary">
            <ClipboardList className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-brand-muted block">Registered Active Buyers</span>
            <span className="text-base font-extrabold text-brand-text">
              {customers.filter((c) => c.status === 'Active').length} Verified Customers
            </span>
          </div>
        </div>
      </div>

      <SalesForm
        preselectedProductId={preselectedProductId}
        preselectedCustomerId={preselectedCustomerId}
      />
    </div>
  );
}


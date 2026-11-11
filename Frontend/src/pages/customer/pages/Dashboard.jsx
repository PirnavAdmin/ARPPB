import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  MapPin,
  Package,
  Clock,
  CheckCircle2,
  Wallet,
  ShieldCheck,
  ArrowRight,
  TrendingUp,
  Sparkles,
  Tag,
  Eye,
  X,
} from 'lucide-react';
import { useCustomer } from '../context/useCustomer';
import CustomerStatCard from '../components/CustomerStatCard';
import CustomerProductCard from '../components/CustomerProductCard';
import CustomerProductDetailsModal from '../components/CustomerProductDetailsModal';
import CustomerOrderTable from '../components/CustomerOrderTable';
import CustomerOrderDetailsModal from '../components/CustomerOrderDetailsModal';
import CustomerStatusBadge from '../components/CustomerStatusBadge';
import CustomerEmptyState from '../components/CustomerEmptyState';
import { formatCurrency } from '../../../utils/formatCurrency';
import { formatDate } from '../../../utils/formatDate';

export function Dashboard() {
  const navigate = useNavigate();
  const {
    customerName,
    products,
    categories,
    orders,
    metrics,
    addToCart,
  } = useCustomer();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('All');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const locationOptions = useMemo(() => {
    const locs = Array.from(new Set(products.map((p) => p.location))).sort();
    return ['All', ...locs];
  }, [products]);

  const matchingProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return products.filter((p) => {
      if (selectedLocation !== 'All' && p.location !== selectedLocation) {
        return false;
      }
      if (q) {
        return (
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.qualityGrade.toLowerCase().includes(q) ||
          p.location.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [products, searchQuery, selectedLocation]);

  const popularProducts = useMemo(
    () => matchingProducts.filter((p) => p.isPopular).slice(0, 4),
    [matchingProducts]
  );

  const recentlyAddedProducts = useMemo(
    () =>
      [...matchingProducts]
        .sort((a, b) => b.addedDate.localeCompare(a.addedDate))
        .slice(0, 4),
    [matchingProducts]
  );

  const bestPriceProducts = useMemo(
    () => matchingProducts.filter((p) => p.isBestPrice).slice(0, 4),
    [matchingProducts]
  );

  const categoryCounts = useMemo(() => {
    const counts = {};
    products.forEach((p) => {
      counts[p.category] = (counts[p.category] || 0) + 1;
    });
    return counts;
  }, [products]);

  const recentOrdersColumns = [
    {
      key: 'id',
      label: 'Order ID',
      render: (row) => (
        <span className="font-bold text-[#0F766E]">{row.id}</span>
      ),
    },
    {
      key: 'orderDate',
      label: 'Order Date',
      render: (row) => <span className="text-xs">{formatDate(row.orderDate)}</span>,
    },
    {
      key: 'product',
      label: 'Product',
      render: (row) => (
        <div>
          <span className="font-semibold text-[#0F172A] block">{row.product}</span>
          <span className="text-[11px] text-[#64748B]">{row.category}</span>
        </div>
      ),
    },
    {
      key: 'quantity',
      label: 'Quantity',
      render: (row) => (
        <span className="font-semibold">
          {row.quantity} {row.unit}
        </span>
      ),
    },
    {
      key: 'totalAmount',
      label: 'Total Amount',
      align: 'right',
      render: (row) => (
        <span className="font-bold text-[#0F766E]">
          {formatCurrency(row.totalAmount)}
        </span>
      ),
    },
    {
      key: 'orderStatus',
      label: 'Order Status',
      render: (row) => <CustomerStatusBadge status={row.orderStatus} size="xs" />,
    },
    {
      key: 'actions',
      label: 'Action',
      align: 'right',
      render: (row) => (
        <button
          type="button"
          onClick={() => setSelectedOrder(row)}
          className="h-8 inline-flex items-center gap-1.5 px-2.5 text-xs font-semibold rounded-lg bg-[#CCFBF1] text-[#0F766E] border border-[#14B8A6]/30 hover:bg-[#0F766E] hover:text-white transition-colors cursor-pointer"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>View</span>
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Personalized Welcome Banner + Product Search & Location Filter */}
      <section className="rounded-2xl bg-gradient-to-br from-[#0F766E] via-[#0D6B63] to-[#115E59] text-white p-6 sm:p-7 shadow-md border border-[#14B8A6]/30">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-3xl">
            <h1 className="text-xl sm:text-2xl lg:text-[28px] font-extrabold tracking-tight leading-snug text-white">
              Welcome, {customerName}!
            </h1>
            <p className="text-xs sm:text-sm text-[#CCFBF1]/90">
              Browse fresh raw agricultural products, check real-time stock availability, and track your orders.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => navigate('/customer/products')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#CCFBF1] text-[#0F766E] hover:bg-white text-xs font-bold shadow-sm transition-colors cursor-pointer"
            >
              <span>Browse Products</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Product Search & Location Filter Bar */}
        <div className="mt-5 p-3 rounded-xl bg-white/95 border border-white shadow-sm flex flex-col md:flex-row items-stretch md:items-center gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#64748B] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search raw agricultural products, categories, locations..."
              aria-label="Search raw agricultural products"
              className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-[#0F172A] placeholder:text-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/30 focus:border-[#0F766E]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Clear product search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#0F172A] cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="relative md:w-56">
            <MapPin className="w-4 h-4 text-[#0F766E] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              aria-label="Filter by location"
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-[#0F172A] font-medium focus:outline-none focus:ring-2 focus:ring-[#0F766E]/30 focus:border-[#0F766E] cursor-pointer"
            >
              {locationOptions.map((loc) => (
                <option key={loc} value={loc}>
                  {loc === 'All' ? 'All Locations' : loc}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() =>
              navigate('/customer/products', {
                state: {
                  initialSearch: searchQuery,
                  initialLocation: selectedLocation,
                },
              })
            }
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-[#0F766E] text-white hover:bg-[#115E59] transition-colors cursor-pointer shrink-0"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Find Products</span>
          </button>
        </div>
      </section>

      {/* 5 Summary KPI Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <CustomerStatCard
          title="Total Orders"
          value={metrics.totalOrders}
          description="All orders placed"
          icon={Package}
          onClick={() => navigate('/customer/orders')}
        />
        <CustomerStatCard
          title="Active Orders"
          value={metrics.activeOrders}
          description="New through Delivered"
          icon={Clock}
          onClick={() => navigate('/customer/orders')}
        />
        <CustomerStatCard
          title="Completed Orders"
          value={metrics.completedOrders}
          description="Delivered & finalized"
          icon={CheckCircle2}
          onClick={() => navigate('/customer/purchase-history')}
        />
        <CustomerStatCard
          title="Total Purchase Value"
          value={formatCurrency(metrics.totalPurchaseValue, false)}
          description="Confirmed & completed value"
          icon={Wallet}
          onClick={() => navigate('/customer/purchase-history')}
        />
        <CustomerStatCard
          title="Pending Confirmations"
          value={metrics.pendingConfirmations}
          description="Awaiting customer OTP"
          icon={ShieldCheck}
          onClick={() => navigate('/customer/confirmations')}
        />
      </section>

      {/* Popular Products (Raw Agricultural Products Only) */}
      <section className="bg-white rounded-2xl border border-[#E2E8F0] p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#E2E8F0]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#CCFBF1] text-[#0F766E] flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#0F172A]">Popular Products</h2>
              <p className="text-xs text-[#64748B]">
                High-demand raw agricultural harvests and oilseeds in stock
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate('/customer/products', { state: { initialSort: 'popular' } })}
            className="inline-flex items-center gap-1 text-xs font-bold text-[#0F766E] hover:underline cursor-pointer"
          >
            <span>View All Products</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {popularProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {popularProducts.map((product) => (
              <CustomerProductCard
                key={product.id}
                product={product}
                onViewDetails={setSelectedProduct}
                onAddToCart={addToCart}
              />
            ))}
          </div>
        ) : (
          <CustomerEmptyState
            title="No Popular Products Match Search"
            description="Try clearing your Dashboard search or changing location filter."
            actionLabel="Clear Filters"
            onAction={() => {
              setSearchQuery('');
              setSelectedLocation('All');
            }}
          />
        )}
      </section>

      {/* Browse by Category (6 Raw Agricultural Categories Only) */}
      <section className="bg-white rounded-2xl border border-[#E2E8F0] p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#E2E8F0]">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[#0F172A]">Browse by Category</h2>
            <p className="text-xs text-[#64748B]">
              Select a raw agricultural category to view available produce lots
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/customer/categories')}
            className="inline-flex items-center gap-1 text-xs font-bold text-[#0F766E] hover:underline cursor-pointer"
          >
            <span>Explore All 6 Categories</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() =>
                navigate('/customer/categories', { state: { selectedCategory: cat.name } })
              }
              className="group p-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC]/60 hover:bg-[#CCFBF1]/40 hover:border-[#14B8A6] transition-all text-left flex flex-col gap-2 cursor-pointer"
            >
              <div className="w-full h-20 rounded-lg overflow-hidden border border-[#E2E8F0] bg-white">
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div>
                <h3 className="text-xs font-bold text-[#0F172A] group-hover:text-[#0F766E] line-clamp-2">
                  {cat.name}
                </h3>
                <span className="text-[11px] text-[#64748B] block mt-0.5">
                  {categoryCounts[cat.name] || 0} products
                </span>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Recently Added Products */}
      <section className="bg-white rounded-2xl border border-[#E2E8F0] p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#E2E8F0]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#CCFBF1] text-[#0F766E] flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#0F172A]">Recently Added Products</h2>
              <p className="text-xs text-[#64748B]">
                Fresh raw harvest arrivals listed this week
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate('/customer/products', { state: { initialSort: 'recent' } })}
            className="inline-flex items-center gap-1 text-xs font-bold text-[#0F766E] hover:underline cursor-pointer"
          >
            <span>See New Arrivals</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentlyAddedProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {recentlyAddedProducts.map((product) => (
              <CustomerProductCard
                key={product.id}
                product={product}
                onViewDetails={setSelectedProduct}
                onAddToCart={addToCart}
              />
            ))}
          </div>
        ) : (
          <CustomerEmptyState
            title="No Recent Arrivals Match Search"
            description="Adjust your Dashboard search or location filter to see recent harvests."
          />
        )}
      </section>

      {/* Best Price Products */}
      <section className="bg-white rounded-2xl border border-[#E2E8F0] p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#E2E8F0]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#CCFBF1] text-[#0F766E] flex items-center justify-center">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#0F172A]">Best Price Products</h2>
              <p className="text-xs text-[#64748B]">
                Competitive raw crop rates available for immediate purchase
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate('/customer/products', { state: { initialSort: 'price_asc' } })}
            className="inline-flex items-center gap-1 text-xs font-bold text-[#0F766E] hover:underline cursor-pointer"
          >
            <span>Compare Lowest Prices</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {bestPriceProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {bestPriceProducts.map((product) => (
              <CustomerProductCard
                key={product.id}
                product={product}
                onViewDetails={setSelectedProduct}
                onAddToCart={addToCart}
              />
            ))}
          </div>
        ) : (
          <CustomerEmptyState
            title="No Best Price Lots Match Search"
            description="Adjust your Dashboard search or location filter to compare prices."
          />
        )}
      </section>

      {/* Recent Orders */}
      <section className="bg-white rounded-2xl border border-[#E2E8F0] p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[#0F172A]">Recent Orders</h2>
            <p className="text-xs text-[#64748B]">
              Latest purchase orders and current fulfilment status
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/customer/orders')}
            className="inline-flex items-center gap-1 text-xs font-bold text-[#0F766E] hover:underline cursor-pointer"
          >
            <span>Manage All Orders</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <CustomerOrderTable
          columns={recentOrdersColumns}
          data={orders.slice(0, 5)}
          rowKey="id"
          enablePagination={false}
        />
      </section>

      <CustomerProductDetailsModal
        product={selectedProduct}
        isOpen={Boolean(selectedProduct)}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={addToCart}
      />

      <CustomerOrderDetailsModal
        order={selectedOrder}
        isOpen={Boolean(selectedOrder)}
        onClose={() => setSelectedOrder(null)}
      />
    </div>
  );
}

export default Dashboard;

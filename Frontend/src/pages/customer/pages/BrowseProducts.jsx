import { useState, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ShoppingBag, ShoppingCart, ArrowUpDown } from 'lucide-react';
import { useCustomer } from '../context/useCustomer';
import { useDebounce } from '../../../hooks/useDebounce';
import { usePagination } from '../../../hooks/usePagination';
import CustomerPageHeader from '../components/CustomerPageHeader';
import CustomerSearch from '../components/CustomerSearch';
import CustomerFilters from '../components/CustomerFilters';
import CustomerProductCard from '../components/CustomerProductCard';
import CustomerProductDetailsModal from '../components/CustomerProductDetailsModal';
import CustomerPagination from '../components/CustomerPagination';
import CustomerEmptyState from '../components/CustomerEmptyState';
import { formatCurrency } from '../../../utils/formatCurrency';

export function BrowseProducts() {
  const location = useLocation();
  const navigate = useNavigate();
  const { products, categories, addToCart, cartItemCount, cartSubtotal } = useCustomer();

  const navState = location.state || {};

  const [searchQuery, setSearchQuery] = useState(navState.initialSearch || '');
  const debouncedSearch = useDebounce(searchQuery, 200);

  const [productCategory, setProductCategory] = useState(navState.initialCategory || 'All');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [productLocation, setProductLocation] = useState(navState.initialLocation || 'All');
  const [qualityGrade, setQualityGrade] = useState('All');
  const [availability, setAvailability] = useState('All');
  const [sortBy, setSortBy] = useState(navState.initialSort || 'popular');

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [trackedLocationKey, setTrackedLocationKey] = useState(location.key);

  if (location.key !== trackedLocationKey) {
    setTrackedLocationKey(location.key);
    const incoming = location.state;
    if (incoming) {
      if (incoming.initialSearch !== undefined) setSearchQuery(incoming.initialSearch);
      if (incoming.initialCategory !== undefined) setProductCategory(incoming.initialCategory);
      if (incoming.initialLocation !== undefined) setProductLocation(incoming.initialLocation);
      if (incoming.initialSort !== undefined) setSortBy(incoming.initialSort);
    }
  }

  const distinctLocations = useMemo(
    () => Array.from(new Set(products.map((p) => p.location))).sort(),
    [products]
  );

  const distinctGrades = useMemo(
    () => Array.from(new Set(products.map((p) => p.qualityGrade))).sort(),
    [products]
  );

  const filteredAndSortedProducts = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    const minVal = minPrice !== '' ? Number(minPrice) : null;
    const maxVal = maxPrice !== '' ? Number(maxPrice) : null;

    const list = products.filter((p) => {
      if (productCategory !== 'All' && p.category !== productCategory) return false;
      if (productLocation !== 'All' && p.location !== productLocation) return false;
      if (qualityGrade !== 'All' && p.qualityGrade !== qualityGrade) return false;

      if (minVal !== null && Number.isFinite(minVal) && p.price < minVal) return false;
      if (maxVal !== null && Number.isFinite(maxVal) && p.price > maxVal) return false;

      if (availability === 'In Stock' && p.availableQuantity <= 0) return false;
      if (
        availability === 'Low Stock' &&
        (p.availableQuantity <= 0 || p.availableQuantity > 20)
      ) {
        return false;
      }
      if (availability === 'Out of Stock' && p.availableQuantity > 0) return false;

      if (q) {
        const hit = [
          p.name,
          p.category,
          p.location,
          p.qualityGrade,
          p.batchCode,
        ].some((field) => String(field || '').toLowerCase().includes(q));
        if (!hit) return false;
      }

      return true;
    });

    return [...list].sort((a, b) => {
      if (sortBy === 'price_asc') return a.price - b.price;
      if (sortBy === 'price_desc') return b.price - a.price;
      if (sortBy === 'recent') return b.addedDate.localeCompare(a.addedDate);
      if (a.isPopular !== b.isPopular) return a.isPopular ? -1 : 1;
      return b.availableQuantity - a.availableQuantity;
    });
  }, [
    products,
    debouncedSearch,
    productCategory,
    minPrice,
    maxPrice,
    productLocation,
    qualityGrade,
    availability,
    sortBy,
  ]);

  const pagination = usePagination(filteredAndSortedProducts, 9);

  const handleResetAll = () => {
    setSearchQuery('');
    setProductCategory('All');
    setMinPrice('');
    setMaxPrice('');
    setProductLocation('All');
    setQualityGrade('All');
    setAvailability('All');
    setSortBy('popular');
    pagination.goToPage(1);
  };

  const filterConfig = [
    {
      key: 'productCategory',
      label: 'Product Category',
      value: productCategory,
      onChange: (val) => {
        setProductCategory(val);
        pagination.goToPage(1);
      },
      options: [
        { label: 'All Product Categories', value: 'All' },
        ...categories.map((c) => ({ label: c.name, value: c.name })),
      ],
    },
    {
      key: 'productLocation',
      label: 'Location',
      value: productLocation,
      onChange: (val) => {
        setProductLocation(val);
        pagination.goToPage(1);
      },
      options: [
        { label: 'All Locations', value: 'All' },
        ...distinctLocations.map((loc) => ({ label: loc, value: loc })),
      ],
    },
    {
      key: 'qualityGrade',
      label: 'Quality Grade',
      value: qualityGrade,
      onChange: (val) => {
        setQualityGrade(val);
        pagination.goToPage(1);
      },
      options: [
        { label: 'All Grades', value: 'All' },
        ...distinctGrades.map((g) => ({ label: g, value: g })),
      ],
    },
    {
      key: 'availability',
      label: 'Availability',
      value: availability,
      onChange: (val) => {
        setAvailability(val);
        pagination.goToPage(1);
      },
      options: [
        { label: 'All Stock Status', value: 'All' },
        { label: 'In Stock', value: 'In Stock' },
        { label: 'Low Stock (<=20)', value: 'Low Stock' },
        { label: 'Out of Stock', value: 'Out of Stock' },
      ],
    },
  ];

  const hasExtraFilter = Boolean(minPrice !== '' || maxPrice !== '' || searchQuery.trim());

  return (
    <div className="space-y-6">
      <CustomerPageHeader
        title="Browse Raw Agricultural Products"
        subtitle="Explore quality-graded raw grains, pulses, oil seeds, commercial crops, and whole spices available for purchase."
        icon={ShoppingBag}
        badge={`${filteredAndSortedProducts.length} Listings`}
        actions={
          <button
            type="button"
            onClick={() => navigate('/customer/cart')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-[#0F766E] text-white hover:bg-[#115E59] transition-colors cursor-pointer shadow-xs"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>
              My Cart ({cartItemCount}) • {formatCurrency(cartSubtotal, false)}
            </span>
          </button>
        }
      />

      {/* Search, Filters & Sorting Toolbar */}
      <section className="bg-white border border-[#E2E8F0] rounded-2xl p-4 sm:p-5 space-y-4 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="w-full lg:w-96">
            <CustomerSearch
              value={searchQuery}
              onChange={(val) => {
                setSearchQuery(val);
                pagination.goToPage(1);
              }}
              placeholder="Search product name, category, grade, or location..."
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#64748B]">
              <ArrowUpDown className="w-3.5 h-3.5 text-[#0F766E]" />
              <span>Sort By:</span>
            </div>
            <select
              aria-label="Sort products"
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                pagination.goToPage(1);
              }}
              className="px-3 py-2 text-xs font-semibold bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/30 focus:border-[#0F766E] cursor-pointer"
            >
              <option value="popular">Popular Products</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="recent">Recently Added</option>
            </select>
          </div>
        </div>

        <CustomerFilters
          filters={filterConfig}
          hasExtraActive={hasExtraFilter}
          onReset={handleResetAll}
        >
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              min="0"
              value={minPrice}
              onChange={(e) => {
                setMinPrice(e.target.value);
                pagination.goToPage(1);
              }}
              placeholder="Min ₹"
              aria-label="Minimum Price"
              className="w-24 px-2.5 py-2 text-xs bg-white border border-[#E2E8F0] rounded-lg text-[#0F172A] placeholder:text-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/30 focus:border-[#0F766E]"
            />
            <span className="text-xs text-[#64748B]">–</span>
            <input
              type="number"
              min="0"
              value={maxPrice}
              onChange={(e) => {
                setMaxPrice(e.target.value);
                pagination.goToPage(1);
              }}
              placeholder="Max ₹"
              aria-label="Maximum Price"
              className="w-24 px-2.5 py-2 text-xs bg-white border border-[#E2E8F0] rounded-lg text-[#0F172A] placeholder:text-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/30 focus:border-[#0F766E]"
            />
          </div>
        </CustomerFilters>
      </section>

      {/* Product Cards Grid */}
      {pagination.paginatedData.length > 0 ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {pagination.paginatedData.map((product) => (
              <CustomerProductCard
                key={product.id}
                product={product}
                onViewDetails={setSelectedProduct}
                onAddToCart={addToCart}
              />
            ))}
          </div>

          <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden shadow-2xs">
            <CustomerPagination
              {...pagination}
              pageSizeOptions={[6, 9, 12, 18]}
            />
          </div>
        </div>
      ) : (
        <CustomerEmptyState
          icon={ShoppingBag}
          title="No Agricultural Products Found"
          description="No products matched your current category, price range, location, grade, or availability filters."
          actionLabel="Reset All Filters"
          onAction={handleResetAll}
        />
      )}

      <CustomerProductDetailsModal
        product={selectedProduct}
        isOpen={Boolean(selectedProduct)}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={addToCart}
      />
    </div>
  );
}

export default BrowseProducts;

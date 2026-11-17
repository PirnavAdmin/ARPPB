import { useState, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Layers, ArrowRight, CheckCircle2, RotateCcw } from 'lucide-react';
import { useCustomer } from '../context/useCustomer';
import CustomerPageHeader from '../components/CustomerPageHeader';
import CustomerProductCard from '../components/CustomerProductCard';
import CustomerProductDetailsModal from '../components/CustomerProductDetailsModal';
import CustomerEmptyState from '../components/CustomerEmptyState';

const CATEGORY_IMAGE_BY_ID = {
  'food-grains': '/assets/category-images/food-grains.jpg',
  pulses: '/assets/category-images/pulses.jpg',
  'oil-seeds': '/assets/category-images/oil-seeds.jpg',
  'commercial-crops': '/assets/category-images/commercial-crops.jpg',
  'spices-raw': '/assets/category-images/spices.jpg',
  'other-raw-materials': '/assets/category-images/other-raw-materials.jpg',
};

const FOOD_GRAIN_PRODUCT_IMAGE_BY_ID = {
  'CPROD-101': '/assets/product-images/paddy.jpg',
  'CPROD-102': '/assets/product-images/wheat.jpg',
  'CPROD-103': '/assets/product-images/yellow-maize-kernels.jpg',
};

const REMAINING_CATEGORY_PRODUCT_IMAGE_BY_ID = {
  'CPROD-104': '/assets/product-images/whole-red-gram.jpg',
  'CPROD-105': '/assets/product-images/bengal-gram.jpg',
  'CPROD-106': '/assets/product-images/green-moong.jpg',
  'CPROD-107': '/assets/product-images/groundnut.jpg',
  'CPROD-108': '/assets/product-images/soybean.jpg',
  'CPROD-109': '/assets/product-images/mustard-seeds.jpg',
  'CPROD-110': '/assets/product-images/sunflower-seeds.jpg',
  'CPROD-111': '/assets/product-images/cotton.jpg',
  'CPROD-112': '/assets/product-images/sugarcane.jpg',
  'CPROD-113': '/assets/product-images/turmeric.jpg',
  'CPROD-114': '/assets/product-images/red-chillies.jpg',
  'CPROD-115': '/assets/product-images/coriander-seeds.jpg',
  'CPROD-116': '/assets/product-images/coconut-copra.jpg',
  'CPROD-117': '/assets/product-images/paddy-straw-husk.jpg',
};

export function Categories() {
  const location = useLocation();
  const navigate = useNavigate();
  const { categories, products, addToCart } = useCustomer();

  const initialCat = location.state?.selectedCategory || categories[0]?.name || 'Grains';
  const [selectedCategory, setSelectedCategory] = useState(initialCat);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [trackedLocationKey, setTrackedLocationKey] = useState(location.key);

  if (location.key !== trackedLocationKey) {
    setTrackedLocationKey(location.key);
    if (location.state?.selectedCategory) {
      setSelectedCategory(location.state.selectedCategory);
    }
  }

  const categoryCounts = useMemo(() => {
    const map = {};
    products.forEach((p) => {
      map[p.category] = (map[p.category] || 0) + 1;
    });
    return map;
  }, [products]);

  const categoryProducts = useMemo(() => {
    if (!selectedCategory || selectedCategory === 'All') return products;
    return products.filter((p) => p.category === selectedCategory);
  }, [products, selectedCategory]);

  const activeCategoryMeta = categories.find((c) => c.name === selectedCategory);

  return (
    <div className="space-y-6">
      <CustomerPageHeader
        title="Raw Agricultural Categories"
        subtitle="Explore raw agricultural commodity categories across food grains, pulses, oil seeds, commercial crops, raw spices, and bulk materials."
        icon={Layers}
        badge={`${categories.length} Categories`}
        actions={
          selectedCategory !== 'All' && (
            <button
              type="button"
              onClick={() => setSelectedCategory('All')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#CCFBF1] text-[#0F766E] hover:bg-[#14B8A6] hover:text-white transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Show All Products</span>
            </button>
          )
        }
      />

      {/* Category Image Cards Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.name;
          const count = categoryCounts[cat.name] || 0;

          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.name)}
              aria-pressed={isSelected}
              className={`group text-left rounded-2xl border overflow-hidden transition-all duration-200 flex flex-col cursor-pointer ${
                isSelected
                  ? 'bg-[#CCFBF1]/35 border-[#0F766E] ring-2 ring-[#0F766E]/20 shadow-md'
                  : 'bg-white border-[#E2E8F0] hover:border-[#14B8A6] hover:shadow-md'
              }`}
            >
              <div className="relative h-36 w-full overflow-hidden border-b border-[#E2E8F0] bg-[#F8FAFC]">
                <img
                  src={CATEGORY_IMAGE_BY_ID[cat.id]}
                  alt={cat.name}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <span className="absolute top-2.5 right-2.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/95 text-[#0F766E] border border-[#14B8A6]/30 shadow-xs">
                  {count} {count === 1 ? 'Product' : 'Products'}
                </span>
                {isSelected && (
                  <span className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#0F766E] text-white shadow-xs">
                    <CheckCircle2 className="w-3 h-3" />
                    Selected
                  </span>
                )}
              </div>

              <div className="p-4 flex-1 flex flex-col justify-between gap-2">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-[#0F172A] group-hover:text-[#0F766E] transition-colors">
                    {cat.name}
                  </h3>
                  <p className="text-xs text-[#64748B] mt-1 line-clamp-2">
                    {cat.description}
                  </p>
                </div>
                <span className="text-xs font-bold text-[#0F766E] inline-flex items-center gap-1 pt-1">
                  <span>View {cat.name}</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </div>
            </button>
          );
        })}
      </section>

      {/* Products in Selected Category */}
      <section className="bg-white rounded-2xl border border-[#E2E8F0] p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#E2E8F0]">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[#0F172A]">
              {selectedCategory === 'All'
                ? 'All Raw Agricultural Products'
                : `${selectedCategory} Products`}
            </h2>
            <p className="text-xs text-[#64748B]">
              {activeCategoryMeta
                ? activeCategoryMeta.description
                : 'Showing raw products across all 6 agricultural categories.'}{' '}
              ({categoryProducts.length} listings)
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              navigate('/customer/products', {
                state: {
                  initialCategory: selectedCategory === 'All' ? 'All' : selectedCategory,
                },
              })
            }
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#CCFBF1] text-[#0F766E] hover:bg-[#0F766E] hover:text-white transition-colors cursor-pointer"
          >
            <span>Open in Browse Products</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {categoryProducts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {categoryProducts.map((product) => (
              <CustomerProductCard
                key={product.id}
                product={{
                  ...product,
                  image:
                    FOOD_GRAIN_PRODUCT_IMAGE_BY_ID[product.id] ||
                    REMAINING_CATEGORY_PRODUCT_IMAGE_BY_ID[product.id] ||
                    product.image,
                }}
                onViewDetails={setSelectedProduct}
                onAddToCart={addToCart}
              />
            ))}
          </div>
        ) : (
          <CustomerEmptyState
            title={`No listings under ${selectedCategory}`}
            description="Select another category card above or view all products."
            actionLabel="View All Products"
            onAction={() => setSelectedCategory('All')}
          />
        )}
      </section>

      <CustomerProductDetailsModal
        product={selectedProduct}
        isOpen={Boolean(selectedProduct)}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={addToCart}
      />
    </div>
  );
}

export default Categories;

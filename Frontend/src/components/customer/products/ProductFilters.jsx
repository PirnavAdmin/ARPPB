
import { SlidersHorizontal } from "lucide-react";

function ProductFilters({
    categories,
    activeCategory,
    onCategoryChange,
    productCount,
}) {
    return (
        <section className="product-filters">

            <div className="filter-heading">
                <div>
                    <SlidersHorizontal size={19} />
                    <h3>Categories</h3>
                </div>

                <span>{productCount} Products</span>
            </div>

            <div className="category-list">
                {categories.map((category) => (
                    <button
                        key={category}
                        type="button"
                        className={`category-btn ${activeCategory === category ? "active" : ""
                            }`}
                        onClick={() => onCategoryChange(category)}
                        aria-pressed={activeCategory === category}
                    >
                        {category}
                    </button>
                ))}
            </div>

        </section>
    );
}

export default ProductFilters;

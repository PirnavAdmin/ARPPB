
import { Search, X } from "lucide-react";

function ProductSearch({ searchTerm, onSearchChange }) {
    const handleClear = () => {
        onSearchChange("");
    };

    return (
        <div className="product-search">

            <Search size={20} className="search-icon" />

            <input
                type="text"
                placeholder="Search agricultural products..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                aria-label="Search products"
            />

            {searchTerm && (
                <button
                    type="button"
                    className="clear-search"
                    onClick={handleClear}
                    aria-label="Clear search"
                >
                    <X size={18} />
                </button>
            )}

        </div>
    );
}

export default ProductSearch;

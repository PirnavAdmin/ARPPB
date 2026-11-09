
import { useMemo, useState } from "react";
import { ShoppingBag, Package, ShoppingCart } from "lucide-react";

import ProductCard from "../../components/customer/products/ProductCard";
import ProductFilters from "../../components/customer/products/ProductFilters";
import ProductSearch from "../../components/customer/products/ProductSearch";

import {
    productsData,
    productCategories,
} from "../../data/productsData";

import "../../styles/products.css";

function CustomerProducts() {
    const [searchTerm, setSearchTerm] = useState("");
    const [activeCategory, setActiveCategory] = useState("All");
    const [cart, setCart] = useState([]);

    // Search and category filtering
    const filteredProducts = useMemo(() => {
        return productsData.filter((product) => {
            const matchesSearch =
                product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                product.category.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesCategory =
                activeCategory === "All" ||
                product.category === activeCategory;

            return matchesSearch && matchesCategory;
        });
    }, [searchTerm, activeCategory]);

    // Add products to cart
    const handleAddToCart = (product, quantity) => {
        setCart((previousCart) => {
            const existingProduct = previousCart.find(
                (item) => item.id === product.id
            );

            if (existingProduct) {
                return previousCart.map((item) =>
                    item.id === product.id
                        ? {
                            ...item,
                            quantity: Math.min(
                                item.quantity + quantity,
                                product.stock
                            ),
                        }
                        : item
                );
            }

            return [...previousCart, { ...product, quantity }];
        });
    };

    const totalCartItems = cart.reduce(
        (total, item) => total + item.quantity,
        0
    );

    return (
        <main className="products-page">

            {/* Page Header */}
            <section className="products-header">
                <div>
                    <span className="page-eyebrow">
                        <ShoppingBag size={16} />
                        AGRI MARKETPLACE
                    </span>

                    <h1>Products</h1>

                    <p>
                        Explore quality agricultural raw products
                        available for purchase.
                    </p>
                </div>

                <div className="cart-summary">
                    <ShoppingCart size={22} />

                    <div>
                        <span>My Cart</span>
                        <strong>{totalCartItems} Items</strong>
                    </div>
                </div>
            </section>

            {/* Product Statistics */}
            <section className="products-overview">

                <div className="overview-card">
                    <div className="overview-icon">
                        <Package size={22} />
                    </div>

                    <div>
                        <span>Total Products</span>
                        <h3>{productsData.length}</h3>
                    </div>
                </div>

                <div className="overview-card">
                    <div className="overview-icon">
                        <ShoppingBag size={22} />
                    </div>

                    <div>
                        <span>Available Products</span>
                        <h3>
                            {productsData.filter((item) => item.stock > 0).length}
                        </h3>
                    </div>
                </div>

                <div className="overview-card">
                    <div className="overview-icon">
                        <ShoppingCart size={22} />
                    </div>

                    <div>
                        <span>Cart Items</span>
                        <h3>{totalCartItems}</h3>
                    </div>
                </div>

            </section>

            {/* Search */}
            <section className="products-toolbar">

                <div>
                    <h2>Explore Products</h2>
                    <p>Find the right agricultural products for your needs.</p>
                </div>

                <ProductSearch
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                />

            </section>

            {/* Category Filters */}
            <ProductFilters
                categories={productCategories}
                activeCategory={activeCategory}
                onCategoryChange={setActiveCategory}
                productCount={filteredProducts.length}
            />

            {/* Product Listing */}
            <section className="products-grid">

                {filteredProducts.length > 0 ? (
                    filteredProducts.map((product) => (
                        <ProductCard
                            key={product.id}
                            product={product}
                            onAddToCart={handleAddToCart}
                        />
                    ))
                ) : (
                    <div className="products-empty">
                        <Package size={42} />

                        <h3>No Products Found</h3>

                        <p>
                            Try another product name or category.
                        </p>

                        <button
                            type="button"
                            onClick={() => {
                                setSearchTerm("");
                                setActiveCategory("All");
                            }}
                        >
                            Clear Filters
                        </button>
                    </div>
                )}

            </section>

        </main>
    );
}

export default CustomerProducts;

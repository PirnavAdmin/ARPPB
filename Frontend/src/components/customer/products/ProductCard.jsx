
import { useState } from "react";
import {
    ShoppingCart,
    Plus,
    Minus,
    Package,
    CheckCircle
} from "lucide-react";

function ProductCard({ product, onAddToCart }) {
    const [quantity, setQuantity] = useState(1);

    const isAvailable = product.stock > 0;

    const handleQuantityChange = (type) => {
        setQuantity((prev) => {
            if (type === "increase") {
                return Math.min(prev + 1, product.stock);
            }

            return Math.max(1, prev - 1);
        });
    };

    const handleAddToCart = () => {
        if (!isAvailable) return;

        onAddToCart(product, quantity);
        setQuantity(1);
    };

    return (
        <article className="product-card">

            {/* Product Image Area */}
            <div className="product-image">

                <span className="product-emoji">
                    {product.icon || "🌾"}
                </span>

                {product.badge && (
                    <span className="product-badge">
                        {product.badge}
                    </span>
                )}

            </div>

            {/* Product Information */}
            <div className="product-info">

                <span className="product-category">
                    {product.category}
                </span>

                <h3>{product.name}</h3>

                <p className="product-description">
                    {product.description}
                </p>

                {/* Price */}
                <div className="product-price">
                    <strong>
                        ₹{product.price.toLocaleString("en-IN")}
                    </strong>

                    <span>/ {product.unit}</span>
                </div>

                {/* Stock */}
                <div className="product-stock">
                    <Package size={16} />

                    <span>
                        {isAvailable
                            ? `${product.stock} ${product.unit}s available`
                            : "Out of stock"}
                    </span>

                    {isAvailable && (
                        <CheckCircle size={15} />
                    )}
                </div>

                {/* Quantity Selector */}
                <div className="product-card-actions">

                    <div className="quantity-control">

                        <button
                            type="button"
                            onClick={() => handleQuantityChange("decrease")}
                            disabled={quantity <= 1}
                            aria-label="Decrease quantity"
                        >
                            <Minus size={15} />
                        </button>

                        <span>{quantity}</span>

                        <button
                            type="button"
                            onClick={() => handleQuantityChange("increase")}
                            disabled={!isAvailable || quantity >= product.stock}
                            aria-label="Increase quantity"
                        >
                            <Plus size={15} />
                        </button>

                    </div>

                    <button
                        type="button"
                        className="add-cart-btn"
                        onClick={handleAddToCart}
                        disabled={!isAvailable}
                    >
                        <ShoppingCart size={17} />

                        {isAvailable ? "Add to Cart" : "Unavailable"}
                    </button>

                </div>

            </div>

        </article>
    );
}

export default ProductCard;

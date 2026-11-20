using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace AgriPurchaseBilling.Application.DTOs
{
    /// <summary>
    /// Request payload to add a product to the authenticated customer's cart.
    /// </summary>
    public class AddToCartRequestDto
    {
        [Required(ErrorMessage = "ProductId is required.")]
        [Range(1, long.MaxValue, ErrorMessage = "ProductId must be a valid positive identifier.")]
        public long ProductId { get; set; }

        [Required(ErrorMessage = "Quantity is required.")]
        [Range(0.01, 1000000.00, ErrorMessage = "Quantity must be greater than zero and at most 1,000,000.")]
        public decimal Quantity { get; set; } = 1.00m;
    }

    /// <summary>
    /// Request payload to update an existing cart item's quantity.
    /// </summary>
    public class UpdateCartItemRequestDto
    {
        [Required(ErrorMessage = "Quantity is required.")]
        [Range(0.01, 1000000.00, ErrorMessage = "Quantity must be greater than zero and at most 1,000,000.")]
        public decimal Quantity { get; set; }
    }

    /// <summary>
    /// Represents an individual item within the customer's cart, enriched with live catalog data.
    /// </summary>
    public class CustomerCartItemDto
    {
        public long CartItemId { get; set; }
        public long ProductId { get; set; }
        public string ProductCode { get; set; } = string.Empty;
        public string ProductName { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public string Unit { get; set; } = string.Empty;

        /// <summary>
        /// Unit selling price strictly resolved from vendor_finished_products.SellingPrice on the server.
        /// </summary>
        public decimal UnitPrice { get; set; }

        public decimal Quantity { get; set; }

        /// <summary>
        /// Server-calculated subtotal for this item line (Quantity * UnitPrice).
        /// </summary>
        public decimal LineTotal { get; set; }

        /// <summary>
        /// Current available inventory stock from the catalog.
        /// </summary>
        public decimal AvailableStock { get; set; }

        /// <summary>
        /// Stock status indicator: "in_stock" (&gt; 20), "low_stock" (0 &lt; qty &lt;= 20), or "out_of_stock" (&lt;= 0).
        /// </summary>
        public string StockStatus { get; set; } = string.Empty;

        /// <summary>
        /// Indicates if the product is currently active, unexpired, and in stock.
        /// </summary>
        public bool IsAvailable { get; set; }

        public string? ImageUrl { get; set; }
        public long VendorId { get; set; }
    }

    /// <summary>
    /// Complete shopping cart state for the authenticated customer.
    /// </summary>
    public class CustomerCartDto
    {
        /// <summary>
        /// Total number of distinct items in the cart.
        /// </summary>
        public int TotalItems { get; set; }

        /// <summary>
        /// Total cumulative quantity across all items.
        /// </summary>
        public decimal TotalQuantity { get; set; }

        /// <summary>
        /// Sum of all line totals before any taxes/discounts.
        /// </summary>
        public decimal ItemsSubtotal { get; set; }

        /// <summary>
        /// Final calculated cart total.
        /// </summary>
        public decimal CartTotal { get; set; }

        /// <summary>
        /// Flag set to true if any cart item is currently inactive, expired, out of stock, or exceeding stock.
        /// </summary>
        public bool HasUnavailableItems { get; set; }

        /// <summary>
        /// List of items currently in the cart.
        /// </summary>
        public List<CustomerCartItemDto> Items { get; set; } = new();
    }

    /// <summary>
    /// Request payload for Customer Checkout.
    /// Supports selecting a saved delivery address ID or specifying custom address/instructions.
    /// </summary>
    public class CustomerCheckoutRequestDto
    {
        /// <summary>
        /// Optional ID of a saved customer delivery address from customer_delivery_addresses.
        /// If provided, ownership is strictly verified against the authenticated customer.
        /// </summary>
        public long? DeliveryAddressId { get; set; }

        /// <summary>
        /// Custom delivery address text provided directly during review, if not using a saved address ID.
        /// </summary>
        [MaxLength(500, ErrorMessage = "Delivery address cannot exceed 500 characters.")]
        public string? DeliveryAddress { get; set; }

        /// <summary>
        /// Optional delivery notes or special dispatch instructions.
        /// </summary>
        [MaxLength(1000, ErrorMessage = "Notes cannot exceed 1000 characters.")]
        public string? Notes { get; set; }

        /// <summary>
        /// Optional payment terms (default: "Net 15 Days").
        /// </summary>
        [MaxLength(50, ErrorMessage = "Payment terms cannot exceed 50 characters.")]
        public string? PaymentTerms { get; set; }

        /// <summary>
        /// Optional client idempotency key to prevent accidental duplicate order submissions.
        /// </summary>
        [MaxLength(100, ErrorMessage = "Idempotency key cannot exceed 100 characters.")]
        public string? IdempotencyKey { get; set; }
    }

    /// <summary>
    /// Response payload returned after successful checkout.
    /// Contains summaries of all created orders (one per vendor), total amount, and confirmation details.
    /// </summary>
    public class CustomerCheckoutResultDto
    {
        public List<CustomerOrderSummaryDto> Orders { get; set; } = new();
        public List<CustomerCheckoutOtpDto> Otps { get; set; } = new();
        public int TotalOrdersCreated { get; set; }
        public decimal TotalAmount { get; set; }
        public string Message { get; set; } = string.Empty;
    }

    /// <summary>
    /// Mock OTP confirmation details returned strictly at checkout time for frontend demo display.
    /// Never exposes the internal otp_hash.
    /// </summary>
    public class CustomerCheckoutOtpDto
    {
        public long ConfirmationId { get; set; }
        public string ConfirmationCode { get; set; } = string.Empty;
        public string OrderId { get; set; } = string.Empty;
        public string TransactionId { get; set; } = string.Empty;
        public string SellerName { get; set; } = string.Empty;

        [JsonPropertyName("product")]
        public string ProductName { get; set; } = string.Empty;

        [JsonIgnore]
        public string Product { get => ProductName; set => ProductName = value; }

        public decimal Quantity { get; set; }
        public string Unit { get; set; } = string.Empty;
        public decimal TotalAmount { get; set; }
        public string OtpStatus { get; set; } = "Pending";
        public string? DemoOtpCode { get; set; }
        public DateTime ExpiresAt { get; set; }
    }

    /// <summary>
    /// Summary of an individual order created during checkout.
    /// </summary>
    public class CustomerOrderSummaryDto
    {
        public long Id { get; set; }
        public string OrderId { get; set; } = string.Empty;
        public string TransactionId { get; set; } = string.Empty;
        public long VendorId { get; set; }
        public string SellerName { get; set; } = string.Empty;
        public DateTime OrderDate { get; set; }
        public string OrderStatus { get; set; } = "New";
        public string PaymentStatus { get; set; } = "Unpaid";
        public string OtpStatus { get; set; } = "Pending";
        public string? OtpId { get; set; }
        public string? DemoOtpCode { get; set; }
        public string DeliveryAddress { get; set; } = string.Empty;
        public DateTime? ExpectedDeliveryDate { get; set; }
        public DateTime? ExpectedPaymentDate { get; set; }
        public decimal ItemsSubtotal { get; set; }
        public decimal TotalAmount { get; set; }
        public int ItemCount { get; set; }
        public List<CustomerOrderItemDto> Items { get; set; } = new();
    }
}


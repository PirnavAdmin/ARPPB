namespace AgriPurchaseBilling.Domain.Entities
{
    /// <summary>
    /// Represents an individual item in a customer's active shopping cart,
    /// strictly scoped to the authenticated Customer (`Users.Id`).
    /// Maps to the dedicated `customer_cart_items` table.
    /// </summary>
    public class CustomerCartItem
    {
        public long Id { get; set; }

        /// <summary>
        /// Foreign key referencing the authenticated customer's user account (Users.Id).
        /// </summary>
        public long CustomerUserId { get; set; }

        /// <summary>
        /// Foreign key referencing the vendor finished product catalog (vendor_finished_products.Id).
        /// </summary>
        public long ProductId { get; set; }

        /// <summary>
        /// Requested quantity in product units (e.g., 2.50 kg, 10.00 quintals).
        /// Must be greater than zero and cannot exceed available stock.
        /// </summary>
        public decimal Quantity { get; set; } = 1.00m;

        public DateTime CreatedAt { get; set; }

        public DateTime UpdatedAt { get; set; }

        // Navigation properties
        public User? CustomerUser { get; set; }

        public VendorFinishedProduct? Product { get; set; }
    }
}


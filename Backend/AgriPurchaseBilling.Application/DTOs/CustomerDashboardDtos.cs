namespace AgriPurchaseBilling.Application.DTOs
{
    /// <summary>
    /// Aggregated KPI summary metrics for the Customer Portal Dashboard.
    /// Values are calculated from live database records across orders (vp_sales),
    /// cart items (customer_cart_items), and notifications (customer_notifications).
    /// </summary>
    public class CustomerDashboardSummaryDto
    {
        /// <summary>
        /// Total number of confirmed and placed orders belonging to the customer.
        /// Follows Customer Purchase History eligibility rules (excludes Draft and internal sales).
        /// </summary>
        public int TotalOrders { get; set; }

        /// <summary>
        /// Count of active in-progress orders (e.g., New, Confirmed, Processing, Packed, Dispatched, Shipped, In Transit, Out for Delivery).
        /// </summary>
        public int ActiveOrders { get; set; }

        /// <summary>
        /// Count of finalized / completed orders (Delivered, Completed).
        /// </summary>
        public int CompletedOrders { get; set; }

        /// <summary>
        /// Sum of total amounts across eligible confirmed / completed sales.
        /// Aggregated directly at the sale header level (vp_sales) to prevent duplicate counting.
        /// </summary>
        public decimal TotalPurchaseValue { get; set; }

        /// <summary>
        /// Number of pending customer OTP confirmations awaiting verification.
        /// Remains null (unresolved) because database schema and backend inspection confirm
        /// no reliable customer OTP confirmation table or entity exists in the system.
        /// </summary>
        public int? PendingConfirmations { get; set; }

        /// <summary>
        /// Count of distinct product items currently in the authenticated customer's shopping cart.
        /// </summary>
        public int CartItemCount { get; set; }

        /// <summary>
        /// Count of unread notifications for the authenticated customer.
        /// </summary>
        public int UnreadNotifications { get; set; }
    }
}


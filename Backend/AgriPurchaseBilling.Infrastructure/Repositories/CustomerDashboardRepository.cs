using AgriPurchaseBilling.Application.DTOs;
using AgriPurchaseBilling.Application.Interfaces;
using AgriPurchaseBilling.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace AgriPurchaseBilling.Infrastructure.Repositories
{
    /// <summary>
    /// Strictly read-only repository executing aggregation queries for the Customer Dashboard.
    /// Follows the existing status mappings from CustomerPurchaseHistoryRepository.
    /// Aggregates sales at header level to prevent duplicate spend calculations.
    /// </summary>
    public class CustomerDashboardRepository : ICustomerDashboardRepository
    {
        private static readonly string[] EligibleOrderStatuses =
        {
            "new",
            "confirmed",
            "processing",
            "packed",
            "dispatched",
            "shipped",
            "in transit",
            "out for delivery",
            "delivered",
            "completed"
        };

        private static readonly string[] ActiveOrderStatuses =
        {
            "new",
            "confirmed",
            "processing",
            "packed",
            "dispatched",
            "shipped",
            "in transit",
            "out for delivery"
        };

        private static readonly string[] CompletedOrderStatuses =
        {
            "delivered",
            "completed"
        };

        private readonly AppDbContext _context;

        public CustomerDashboardRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<CustomerDashboardSummaryDto> GetDashboardSummaryAsync(
            long customerUserId,
            CancellationToken cancellationToken = default)
        {
            // 1. Order and Spend metrics from vp_sales
            // Strictly scoped to customerUserId and eligible (non-draft, non-cancelled) sales.
            // Aggregated directly at vp_sales header level to prevent duplicate line-item counting.
            var salesSummary = await _context.VpSales
                .AsNoTracking()
                .Where(s => s.CustomerUserId == customerUserId &&
                            EligibleOrderStatuses.Contains(s.OrderStatus.ToLower()))
                .GroupBy(_ => 1)
                .Select(g => new
                {
                    TotalOrders = g.Count(),
                    ActiveOrders = g.Count(s => ActiveOrderStatuses.Contains(s.OrderStatus.ToLower())),
                    CompletedOrders = g.Count(s => CompletedOrderStatuses.Contains(s.OrderStatus.ToLower())),
                    TotalPurchaseValue = g.Sum(s => s.TotalAmount)
                })
                .FirstOrDefaultAsync(cancellationToken);

            // 2. Cart item count from customer_cart_items (distinct product items in customer's cart)
            int cartItemCount = await _context.CustomerCartItems
                .AsNoTracking()
                .Where(c => c.CustomerUserId == customerUserId)
                .CountAsync(cancellationToken);

            // 3. Unread notification count from customer_notifications
            int unreadNotifications = await _context.CustomerNotifications
                .AsNoTracking()
                .Where(n => n.CustomerUserId == customerUserId && !n.IsRead)
                .CountAsync(cancellationToken);

            // 4. Pending OTP Confirmations
            // Strictly scoped to customer-owned records matching GET /api/v1/customer/confirmations (status: Pending or Sent)
            string customerCode = $"CUST-2026-{customerUserId:D4}";
            int pendingConfirmations = await _context.VpOtpConfirmations
                .AsNoTracking()
                .Where(c => ((c.Sale != null && c.Sale.CustomerUserId == customerUserId) ||
                             (c.PartyCategory == "Customer" && c.PartyCode == customerCode)) &&
                            (c.OtpStatus == "Pending" || c.OtpStatus == "Sent"))
                .CountAsync(cancellationToken);

            return new CustomerDashboardSummaryDto
            {
                TotalOrders = salesSummary?.TotalOrders ?? 0,
                ActiveOrders = salesSummary?.ActiveOrders ?? 0,
                CompletedOrders = salesSummary?.CompletedOrders ?? 0,
                TotalPurchaseValue = salesSummary?.TotalPurchaseValue ?? 0.00m,
                PendingConfirmations = pendingConfirmations,
                CartItemCount = cartItemCount,
                UnreadNotifications = unreadNotifications
            };
        }
    }
}


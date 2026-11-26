using AgriPurchaseBilling.Application.DTOs;

namespace AgriPurchaseBilling.Application.Interfaces
{
    /// <summary>
    /// Read-only repository interface for Customer My Orders.
    /// Strictly scoped to the authenticated customer's user identity.
    /// </summary>
    public interface ICustomerOrderRepository
    {
        Task<CustomerOrderPagedDto> GetOrdersAsync(
            long customerUserId,
            CustomerOrderQueryDto query,
            DateTime? effectiveFromDate,
            DateTime? effectiveToDate,
            string? normalizedStatus,
            string? normalizedCategory,
            string normalizedSortBy,
            bool isAsc,
            CancellationToken cancellationToken = default);

        Task<CustomerOrderDetailDto?> GetOrderByIdAsync(
            long customerUserId,
            string orderIdentifier,
            CancellationToken cancellationToken = default);
    }
}


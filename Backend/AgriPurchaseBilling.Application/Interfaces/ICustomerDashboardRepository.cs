using AgriPurchaseBilling.Application.DTOs;

namespace AgriPurchaseBilling.Application.Interfaces
{
    /// <summary>
    /// Read-only repository interface for aggregating Customer Dashboard metrics.
    /// Strictly scoped to the authenticated customer's user identity.
    /// </summary>
    public interface ICustomerDashboardRepository
    {
        Task<CustomerDashboardSummaryDto> GetDashboardSummaryAsync(long customerUserId, CancellationToken cancellationToken = default);
    }
}


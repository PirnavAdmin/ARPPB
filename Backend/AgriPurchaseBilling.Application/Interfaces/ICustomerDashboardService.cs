using AgriPurchaseBilling.Application.DTOs;

namespace AgriPurchaseBilling.Application.Interfaces
{
    /// <summary>
    /// Service interface providing high-level Customer Dashboard business operations and API responses.
    /// </summary>
    public interface ICustomerDashboardService
    {
        Task<ApiResponse<CustomerDashboardSummaryDto>> GetDashboardSummaryAsync(long customerUserId, CancellationToken cancellationToken = default);
    }
}


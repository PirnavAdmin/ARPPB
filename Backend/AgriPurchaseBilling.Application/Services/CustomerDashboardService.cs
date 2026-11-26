using AgriPurchaseBilling.Application.DTOs;
using AgriPurchaseBilling.Application.Interfaces;

namespace AgriPurchaseBilling.Application.Services
{
    /// <summary>
    /// Service managing Customer Dashboard summary operations.
    /// Ensures customer user identity validation and wraps results in the standard ApiResponse envelope.
    /// </summary>
    public class CustomerDashboardService : ICustomerDashboardService
    {
        private readonly ICustomerDashboardRepository _dashboardRepository;

        public CustomerDashboardService(ICustomerDashboardRepository dashboardRepository)
        {
            _dashboardRepository = dashboardRepository;
        }

        public async Task<ApiResponse<CustomerDashboardSummaryDto>> GetDashboardSummaryAsync(
            long customerUserId,
            CancellationToken cancellationToken = default)
        {
            if (customerUserId <= 0)
            {
                return ApiResponse<CustomerDashboardSummaryDto>.Fail("Invalid customer identifier.");
            }

            var summary = await _dashboardRepository.GetDashboardSummaryAsync(customerUserId, cancellationToken);
            return ApiResponse<CustomerDashboardSummaryDto>.Ok(summary, "Customer dashboard summary retrieved successfully.");
        }
    }
}


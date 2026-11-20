using AgriPurchaseBilling.Application.DTOs;

namespace AgriPurchaseBilling.Application.Interfaces
{
    public interface ICustomerPurchaseHistoryService
    {
        Task<ApiResponse<CustomerPurchaseHistoryPagedDto>> GetPurchaseHistoryAsync(
            long customerUserId,
            CustomerPurchaseHistoryQueryDto query,
            CancellationToken cancellationToken = default);

        Task<ApiResponse<CustomerPurchaseSummaryDto>> GetPurchaseSummaryAsync(
            long customerUserId,
            CancellationToken cancellationToken = default);

        Task<ApiResponse<CustomerPurchaseDetailDto>> GetPurchaseByIdAsync(
            long customerUserId,
            long purchaseItemId,
            CancellationToken cancellationToken = default);
    }
}


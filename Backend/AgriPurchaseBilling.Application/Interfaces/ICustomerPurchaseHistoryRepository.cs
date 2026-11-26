using AgriPurchaseBilling.Application.DTOs;

namespace AgriPurchaseBilling.Application.Interfaces
{
    public interface ICustomerPurchaseHistoryRepository
    {
        Task<CustomerPurchaseHistoryPagedDto> GetPurchaseHistoryAsync(
            long customerUserId,
            CustomerPurchaseHistoryQueryDto query,
            DateTime? effectiveFromDate,
            DateTime? effectiveToDate,
            CancellationToken cancellationToken = default);

        Task<CustomerPurchaseSummaryDto> GetPurchaseSummaryAsync(
            long customerUserId,
            CancellationToken cancellationToken = default);

        Task<CustomerPurchaseDetailDto?> GetPurchaseByIdAsync(
            long customerUserId,
            long purchaseItemId,
            CancellationToken cancellationToken = default);
    }
}


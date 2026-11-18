using System.Collections.Generic;
using System.Threading.Tasks;
using AgriPurchaseBilling.Application.DTOs;

namespace AgriPurchaseBilling.Application.Interfaces
{
    public interface IMiddlemanDashboardService
    {
        Task<MiddlemanDashboardResponseDto> GetDashboardAsync(long userId);
        Task<MiddlemanDashboardMetricsDto> GetDashboardMetricsAsync(long userId);
        Task<DashboardKpisDto> GetKpisAsync(long userId);
        Task<List<MonthlyPurchaseVsSalesDto>> GetPurchaseVsSalesComparisonAsync(long userId);
        Task<List<CropwiseInventoryItemDto>> GetCropwiseInventoryAsync(long userId);
        Task<List<DashboardPendingConfirmationDto>> GetPendingConfirmationsAsync(long userId);
        Task<List<DashboardRecentTransactionDto>> GetRecentTransactionsAsync(long userId);
    }
}

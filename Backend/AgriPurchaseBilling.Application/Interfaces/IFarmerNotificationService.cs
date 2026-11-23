using System.Threading;
using System.Threading.Tasks;
using AgriPurchaseBilling.Application.DTOs;

namespace AgriPurchaseBilling.Application.Interfaces
{
    public interface IFarmerNotificationService
    {
        Task<ApiResponse<FarmerNotificationPagedResponseDto>> GetNotificationsAsync(long userId, FarmerNotificationQueryDto query, CancellationToken ct = default);
        Task<ApiResponse<FarmerNotificationStatsDto>> GetStatsAsync(long userId, CancellationToken ct = default);
        Task<ApiResponse<bool>> MarkReadAsync(long userId, string idOrCode, CancellationToken ct = default);
        Task<ApiResponse<int>> MarkAllReadAsync(long userId, CancellationToken ct = default);
        Task<ApiResponse<bool>> DismissAsync(long userId, string idOrCode, CancellationToken ct = default);
        Task<ApiResponse<FarmerNotificationDto>> CreateNotificationAsync(long userId, CreateFarmerNotificationRequestDto request, CancellationToken ct = default);
    }
}

using System.Threading;
using System.Threading.Tasks;
using AgriPurchaseBilling.Application.DTOs;

namespace AgriPurchaseBilling.Application.Interfaces
{
    public interface IFarmerNotificationRepository
    {
        Task<FarmerNotificationPagedResponseDto> GetNotificationsAsync(long farmerId, FarmerNotificationQueryDto query, CancellationToken ct = default);
        Task<FarmerNotificationStatsDto> GetStatsAsync(long farmerId, CancellationToken ct = default);
        Task<bool> MarkReadAsync(long farmerId, string idOrCode, CancellationToken ct = default);
        Task<int> MarkAllReadAsync(long farmerId, CancellationToken ct = default);
        Task<bool> DismissAsync(long farmerId, string idOrCode, CancellationToken ct = default);
        Task<(long Id, string NotificationCode)> CreateAsync(long farmerId, CreateFarmerNotificationRequestDto request, CancellationToken ct = default);
        Task<long> GetFarmerIdByUserIdAsync(long userId, CancellationToken ct = default);
    }
}

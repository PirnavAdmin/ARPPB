using AgriPurchaseBilling.Application.DTOs;

namespace AgriPurchaseBilling.Application.Interfaces
{
    public interface IMiddlemanNotificationService
    {
        Task<MiddlemanNotificationPageDto> GetPageAsync(long userId, MiddlemanNotificationQuery query, CancellationToken ct);
        Task<MiddlemanNotificationStatsDto> GetStatsAsync(long userId, CancellationToken ct);
        Task<IReadOnlyList<MiddlemanNotificationDto>> GetLatestAsync(long userId, int take, CancellationToken ct);
        Task<bool> MarkReadAsync(long userId, long id, CancellationToken ct);
        Task<int> MarkAllReadAsync(long userId, CancellationToken ct);
        Task<bool> DeleteAsync(long userId, long id, CancellationToken ct);
        Task<long> CreateAsync(long userId, MiddlemanNotificationDto notification, CancellationToken ct);
    }
}

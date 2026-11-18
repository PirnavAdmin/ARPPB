using AgriPurchaseBilling.Application.DTOs;
using AgriPurchaseBilling.Application.Interfaces;


namespace AgriPurchaseBilling.Application.Services
{
    public class MiddlemanNotificationService(IMiddlemanNotificationRepository repository) : IMiddlemanNotificationService
    {
        public Task<MiddlemanNotificationPageDto> GetPageAsync(long userId, MiddlemanNotificationQuery query, CancellationToken ct)
        {
            query.Page = Math.Max(1, query.Page);
            query.PageSize = Math.Clamp(query.PageSize, 1, 100);
            return repository.GetPageAsync(userId, query, ct);
        }

        public Task<MiddlemanNotificationStatsDto> GetStatsAsync(long userId, CancellationToken ct) =>
            repository.GetStatsAsync(userId, ct);

        public Task<IReadOnlyList<MiddlemanNotificationDto>> GetLatestAsync(long userId, int take, CancellationToken ct) =>
            repository.GetLatestAsync(userId, Math.Clamp(take, 1, 20), ct);

        public Task<bool> MarkReadAsync(long userId, long id, CancellationToken ct) =>
            repository.MarkReadAsync(userId, id, ct);

        public Task<int> MarkAllReadAsync(long userId, CancellationToken ct) =>
            repository.MarkAllReadAsync(userId, ct);

        public Task<bool> DeleteAsync(long userId, long id, CancellationToken ct) =>
            repository.DeleteAsync(userId, id, ct);

        public Task<long> CreateAsync(long userId, MiddlemanNotificationDto notification, CancellationToken ct) =>
            repository.CreateAsync(userId, notification, ct);
    }
}

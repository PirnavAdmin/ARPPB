using AgriPurchaseBilling.Application.DTOs;

namespace AgriPurchaseBilling.Application.Interfaces
{
    public interface ICustomerNotificationRepository
    {
        Task<CustomerNotificationPagedDto> GetNotificationsAsync(
            long customerUserId,
            CustomerNotificationQueryDto query,
            CancellationToken cancellationToken = default);

        Task<CustomerNotificationSummaryDto> GetSummaryAsync(
            long customerUserId,
            CancellationToken cancellationToken = default);

        Task<CustomerNotificationDto?> MarkAsReadAsync(
            long customerUserId,
            long notificationId,
            DateTime readAtUtc,
            CancellationToken cancellationToken = default);

        Task<int> MarkAllAsReadAsync(
            long customerUserId,
            DateTime readAtUtc,
            CancellationToken cancellationToken = default);

        Task<bool> DeleteAsync(
            long customerUserId,
            long notificationId,
            CancellationToken cancellationToken = default);
    }
}


using AgriPurchaseBilling.Application.DTOs;

namespace AgriPurchaseBilling.Application.Interfaces
{
    public interface ICustomerNotificationService
    {
        Task<ApiResponse<CustomerNotificationPagedDto>> GetNotificationsAsync(
            long customerUserId,
            CustomerNotificationQueryDto query,
            CancellationToken cancellationToken = default);

        Task<ApiResponse<CustomerNotificationSummaryDto>> GetSummaryAsync(
            long customerUserId,
            CancellationToken cancellationToken = default);

        Task<ApiResponse<CustomerNotificationDto>> MarkAsReadAsync(
            long customerUserId,
            long notificationId,
            CancellationToken cancellationToken = default);

        Task<ApiResponse<CustomerNotificationMarkAllReadDto>> MarkAllAsReadAsync(
            long customerUserId,
            CancellationToken cancellationToken = default);

        Task<ApiResponse<object?>> DeleteAsync(
            long customerUserId,
            long notificationId,
            CancellationToken cancellationToken = default);
    }
}


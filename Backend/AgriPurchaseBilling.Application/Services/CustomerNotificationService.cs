using AgriPurchaseBilling.Application.DTOs;
using AgriPurchaseBilling.Application.Interfaces;

namespace AgriPurchaseBilling.Application.Services
{
    public class CustomerNotificationService : ICustomerNotificationService
    {
        private const int MaxPageSize = 100;

        private static readonly Dictionary<string, string> PriorityAllowlist = new(StringComparer.OrdinalIgnoreCase)
        {
            ["all"] = "all",
            ["all priorities"] = "all",
            ["all_priorities"] = "all",
            ["low"] = "Low",
            ["medium"] = "Medium",
            ["high"] = "High"
        };

        private static readonly Dictionary<string, string> SortByAllowlist = new(StringComparer.OrdinalIgnoreCase)
        {
            ["createdat"] = "createdAt"
        };

        private static readonly HashSet<string> AllowedSortOrders = new(StringComparer.OrdinalIgnoreCase)
        {
            "asc",
            "desc"
        };

        private readonly ICustomerNotificationRepository _repository;

        public CustomerNotificationService(ICustomerNotificationRepository repository)
        {
            _repository = repository;
        }

        public async Task<ApiResponse<CustomerNotificationPagedDto>> GetNotificationsAsync(
            long customerUserId,
            CustomerNotificationQueryDto query,
            CancellationToken cancellationToken = default)
        {
            if (customerUserId <= 0)
            {
                return ApiResponse<CustomerNotificationPagedDto>.Fail("Invalid authenticated customer identity.");
            }

            query ??= new CustomerNotificationQueryDto();

            if (query.Page < 1)
            {
                return ApiResponse<CustomerNotificationPagedDto>.Fail("Page must be greater than or equal to 1.");
            }

            if (query.PageSize < 1 || query.PageSize > MaxPageSize)
            {
                return ApiResponse<CustomerNotificationPagedDto>.Fail($"PageSize must be between 1 and {MaxPageSize}.");
            }

            string? normalizedPriority = null;
            if (!string.IsNullOrWhiteSpace(query.Priority))
            {
                string rawPriority = query.Priority.Trim();
                if (!PriorityAllowlist.TryGetValue(rawPriority, out string? mappedPriority))
                {
                    return ApiResponse<CustomerNotificationPagedDto>.Fail(
                        "Invalid priority value. Supported values are: Low, Medium, High.");
                }

                normalizedPriority = mappedPriority == "all" ? null : mappedPriority;
            }

            string rawSortBy = string.IsNullOrWhiteSpace(query.SortBy) ? "createdAt" : query.SortBy.Trim();
            if (!SortByAllowlist.TryGetValue(rawSortBy, out string? normalizedSortBy))
            {
                return ApiResponse<CustomerNotificationPagedDto>.Fail(
                    "Invalid sortBy value. Supported values are: createdAt.");
            }

            string normalizedSortOrder = string.IsNullOrWhiteSpace(query.SortOrder)
                ? "desc"
                : query.SortOrder.Trim().ToLowerInvariant();
            if (!AllowedSortOrders.Contains(normalizedSortOrder))
            {
                return ApiResponse<CustomerNotificationPagedDto>.Fail(
                    "Invalid sortOrder value. Supported values are: asc, desc.");
            }

            var sanitizedQuery = new CustomerNotificationQueryDto
            {
                Page = query.Page,
                PageSize = query.PageSize,
                Search = string.IsNullOrWhiteSpace(query.Search) ? null : query.Search.Trim(),
                Type = NormalizeTypeOrAll(query.Type),
                Priority = normalizedPriority,
                IsRead = query.IsRead,
                SortBy = normalizedSortBy,
                SortOrder = normalizedSortOrder
            };

            var result = await _repository.GetNotificationsAsync(customerUserId, sanitizedQuery, cancellationToken);
            return ApiResponse<CustomerNotificationPagedDto>.Ok(
                result,
                $"Retrieved {result.Items.Count} customer notification(s) successfully.");
        }

        public async Task<ApiResponse<CustomerNotificationSummaryDto>> GetSummaryAsync(
            long customerUserId,
            CancellationToken cancellationToken = default)
        {
            if (customerUserId <= 0)
            {
                return ApiResponse<CustomerNotificationSummaryDto>.Fail("Invalid authenticated customer identity.");
            }

            var summary = await _repository.GetSummaryAsync(customerUserId, cancellationToken);
            return ApiResponse<CustomerNotificationSummaryDto>.Ok(
                summary,
                "Customer notification summary retrieved successfully.");
        }

        public async Task<ApiResponse<CustomerNotificationDto>> MarkAsReadAsync(
            long customerUserId,
            long notificationId,
            CancellationToken cancellationToken = default)
        {
            if (customerUserId <= 0)
            {
                return ApiResponse<CustomerNotificationDto>.Fail("Invalid authenticated customer identity.");
            }

            if (notificationId <= 0)
            {
                return ApiResponse<CustomerNotificationDto>.Fail("Invalid notification ID.");
            }

            var updated = await _repository.MarkAsReadAsync(
                customerUserId,
                notificationId,
                DateTime.UtcNow,
                cancellationToken);

            if (updated == null)
            {
                return ApiResponse<CustomerNotificationDto>.Fail("Notification not found.");
            }

            return ApiResponse<CustomerNotificationDto>.Ok(
                updated,
                "Notification marked as read successfully.");
        }

        public async Task<ApiResponse<CustomerNotificationMarkAllReadDto>> MarkAllAsReadAsync(
            long customerUserId,
            CancellationToken cancellationToken = default)
        {
            if (customerUserId <= 0)
            {
                return ApiResponse<CustomerNotificationMarkAllReadDto>.Fail("Invalid authenticated customer identity.");
            }

            DateTime readAtUtc = DateTime.UtcNow;
            int updatedCount = await _repository.MarkAllAsReadAsync(customerUserId, readAtUtc, cancellationToken);

            return ApiResponse<CustomerNotificationMarkAllReadDto>.Ok(
                new CustomerNotificationMarkAllReadDto
                {
                    UpdatedCount = updatedCount,
                    ReadAt = readAtUtc
                },
                $"Marked {updatedCount} unread notification(s) as read.");
        }

        public async Task<ApiResponse<object?>> DeleteAsync(
            long customerUserId,
            long notificationId,
            CancellationToken cancellationToken = default)
        {
            if (customerUserId <= 0)
            {
                return ApiResponse<object?>.Fail("Invalid authenticated customer identity.");
            }

            if (notificationId <= 0)
            {
                return ApiResponse<object?>.Fail("Invalid notification ID.");
            }

            bool deleted = await _repository.DeleteAsync(customerUserId, notificationId, cancellationToken);
            if (!deleted)
            {
                return ApiResponse<object?>.Fail("Notification not found.");
            }

            return ApiResponse<object?>.Ok(null, "Notification deleted successfully.");
        }

        private static string? NormalizeTypeOrAll(string? value)
        {
            if (string.IsNullOrWhiteSpace(value)) return null;
            string trimmed = value.Trim();
            if (string.Equals(trimmed, "all", StringComparison.OrdinalIgnoreCase) ||
                string.Equals(trimmed, "all types", StringComparison.OrdinalIgnoreCase) ||
                string.Equals(trimmed, "all_types", StringComparison.OrdinalIgnoreCase))
            {
                return null;
            }

            return trimmed;
        }
    }
}


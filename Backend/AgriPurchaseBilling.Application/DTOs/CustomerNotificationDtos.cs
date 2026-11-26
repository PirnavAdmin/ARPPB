using System.Text.Json.Serialization;

namespace AgriPurchaseBilling.Application.DTOs
{
    public class CustomerNotificationQueryDto
    {
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 10;

        /// <summary>
        /// Case-insensitive search across title, message, orderCode, and transactionCode.
        /// </summary>
        public string? Search { get; set; }

        /// <summary>
        /// Notification category/type filter. Omitted or "All" returns all types.
        /// </summary>
        public string? Type { get; set; }

        /// <summary>
        /// Supported values: Low, Medium, High (or omitted / "All").
        /// </summary>
        public string? Priority { get; set; }

        /// <summary>
        /// Filter by read status: true (read only), false (unread only), or omitted (all alerts).
        /// </summary>
        public bool? IsRead { get; set; }

        /// <summary>
        /// Supported values: createdAt.
        /// </summary>
        public string? SortBy { get; set; } = "createdAt";

        /// <summary>
        /// Supported values: asc, desc.
        /// </summary>
        public string? SortOrder { get; set; } = "desc";
    }

    public class CustomerNotificationDto
    {
        public long Id { get; set; }
        public string Title { get; set; } = string.Empty;

        [JsonPropertyName("description")]
        public string Message { get; set; } = string.Empty;

        [JsonIgnore]
        public string Description { get => Message; set => Message = value; }

        public string Type { get; set; } = string.Empty;
        public string Priority { get; set; } = string.Empty;
        public string? OrderCode { get; set; }
        public string? TransactionCode { get; set; }

        [JsonPropertyName("relatedId")]
        public string? RelatedId => !string.IsNullOrEmpty(OrderCode) ? OrderCode : TransactionCode;

        public bool IsRead { get; set; }
        public DateTime? ReadAt { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class CustomerNotificationPagedDto
    {
        public List<CustomerNotificationDto> Items { get; set; } = new();
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int TotalCount { get; set; }
        public int TotalPages { get; set; }
        public bool HasNextPage { get; set; }
        public bool HasPreviousPage { get; set; }
    }

    public class CustomerNotificationSummaryDto
    {
        public int TotalNotifications { get; set; }
        public int UnreadCount { get; set; }
        public int ReadCount { get; set; }
        public int HighPriorityUnreadCount { get; set; }
    }

    public class CustomerNotificationMarkAllReadDto
    {
        public int UpdatedCount { get; set; }
        public DateTime ReadAt { get; set; }
    }
}


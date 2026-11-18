namespace AgriPurchaseBilling.Application.DTOs
{
    public class MiddlemanNotificationDto
    {
        public long Id { get; set; }
        public string Title { get; set; } = "";
        public string Description { get; set; } = "";
        public string Category { get; set; } = "";
        public string Priority { get; set; } = "";
        public string? ActorName { get; set; }
        public string? ReferenceNumber { get; set; }
        public string? ModuleUrl { get; set; }
        public bool IsRead { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class MiddlemanNotificationStatsDto
    {
        public int Total { get; set; }
        public int Unread { get; set; }
        public int HighPriorityUnread { get; set; }
        public int Read { get; set; }
    }

    public class MiddlemanNotificationPageDto
    {
        public IReadOnlyList<MiddlemanNotificationDto> Items { get; set; } = [];
        public int TotalRecords { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
    }

    public class MiddlemanNotificationQuery
    {
        public string? Search { get; set; }
        public string? Category { get; set; }
        public string? Priority { get; set; }
        // All, Read, Unread
        public string Status { get; set; } = "All";
        // All, Today, Last7Days, Last30Days
        public string TimeRange { get; set; } = "All";
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 10;
    }
}

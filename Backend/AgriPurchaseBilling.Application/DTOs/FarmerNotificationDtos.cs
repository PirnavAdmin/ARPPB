using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace AgriPurchaseBilling.Application.DTOs
{
    /// <summary>
    /// Represents a single farmer notification matching the UI cards in Notifications.jsx
    /// </summary>
    public class FarmerNotificationDto
    {
        public long Id { get; set; }
        public string NotificationCode { get; set; } = string.Empty;
        public long FarmerId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Detail { get; set; } = string.Empty;
        public string Category { get; set; } = "general";
        public string Type { get; set; } = "info";
        public string? TargetPage { get; set; }
        public string? TargetId { get; set; }
        public bool Read { get; set; }
        public bool IsRead
        {
            get => Read;
            set => Read = value;
        }
        public DateTime? ReadAt { get; set; }
        public DateTime CreatedAt { get; set; }
        public string Timestamp => CreatedAt.ToString("yyyy-MM-ddTHH:mm:ss");
        public string Time => FormatRelativeTime(CreatedAt);

        public static string FormatRelativeTime(DateTime dateTime)
        {
            var span = DateTime.UtcNow - dateTime.ToUniversalTime();
            if (span.TotalMinutes < 1) return "Just now";
            if (span.TotalMinutes < 60) return $"{(int)span.TotalMinutes} mins ago";
            if (span.TotalHours < 2) return "1 hour ago";
            if (span.TotalHours < 24) return $"{(int)span.TotalHours} hours ago";
            if (span.TotalDays < 2) return "Yesterday";
            if (span.TotalDays < 7) return $"{(int)span.TotalDays} days ago";
            return dateTime.ToString("dd MMM yyyy");
        }
    }

    /// <summary>
    /// Powers the 4 KPI summary cards at the top of the Farmer Notifications page:
    /// 1. Total Notifications (All recorded operational alerts)
    /// 2. Unread Alerts (Requiring your review)
    /// 3. OTP & Security Alerts (Buyer verification notices)
    /// 4. Action Required (Pending dispatches & payments)
    /// </summary>
    public class FarmerNotificationStatsDto
    {
        public int TotalCount { get; set; }
        public int UnreadCount { get; set; }
        public int OtpAlertsCount { get; set; }
        public int ActionRequiredCount { get; set; }
    }

    /// <summary>
    /// Query parameters for fetching and filtering farmer notifications
    /// </summary>
    public class FarmerNotificationQueryDto
    {
        public string? Category { get; set; }
        public string? Status { get; set; }
        public string? Search { get; set; }
        public bool? UnreadOnly { get; set; }
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 20;
        public long? UserId { get; set; }
    }

    /// <summary>
    /// Paginated response for farmer notifications
    /// </summary>
    public class FarmerNotificationPagedResponseDto
    {
        public List<FarmerNotificationDto> Items { get; set; } = new();
        public int TotalRecords { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int TotalPages => PageSize > 0 ? (int)Math.Ceiling((double)TotalRecords / PageSize) : 0;
        public FarmerNotificationStatsDto? Stats { get; set; }
    }

    /// <summary>
    /// Request DTO for creating a new notification
    /// </summary>
    public class CreateFarmerNotificationRequestDto
    {
        [Required(ErrorMessage = "Title is required.")]
        [StringLength(200, ErrorMessage = "Title cannot exceed 200 characters.")]
        public required string Title { get; set; }

        [Required(ErrorMessage = "Detail is required.")]
        public required string Detail { get; set; }

        public string Category { get; set; } = "general";
        public string Type { get; set; } = "info";
        public string? TargetPage { get; set; }
        public string? TargetId { get; set; }
    }
}

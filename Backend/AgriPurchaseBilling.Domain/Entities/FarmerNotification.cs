using System;

namespace AgriPurchaseBilling.Domain.Entities
{
    public class FarmerNotification
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
        public bool IsRead { get; set; }
        public DateTime? ReadAt { get; set; }
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}

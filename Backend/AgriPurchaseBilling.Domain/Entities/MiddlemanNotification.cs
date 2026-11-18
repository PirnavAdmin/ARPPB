namespace AgriPurchaseBilling.Domain.Entities
{
    public class MiddlemanNotification
    {
        public long Id { get; set; }
        public long UserId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public string Priority { get; set; } = "Low";
        public string? ActorName { get; set; }
        public string? ReferenceNumber { get; set; }
        public string? ModuleUrl { get; set; }
        public bool IsRead { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}

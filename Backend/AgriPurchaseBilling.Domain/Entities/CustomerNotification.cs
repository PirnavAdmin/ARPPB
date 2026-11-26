namespace AgriPurchaseBilling.Domain.Entities
{
    /// <summary>
    /// Represents a notification belonging strictly to an authenticated Customer (`Users.Id`)
    /// stored in the dedicated `customer_notifications` table.
    /// </summary>
    public class CustomerNotification
    {
        public long Id { get; set; }
        public long CustomerUserId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public string Priority { get; set; } = "Medium";
        public string? OrderCode { get; set; }
        public string? TransactionCode { get; set; }
        public bool IsRead { get; set; }
        public DateTime? ReadAt { get; set; }
        public DateTime CreatedAt { get; set; }

        public User? CustomerUser { get; set; }
    }
}


namespace AgriPurchaseBilling.Domain.Entities
{
    public class UserMobileHistory
    {
        public long Id { get; set; }
        public long UserId { get; set; }

        public required string OldMobile { get; set; }
        public required string NewMobile { get; set; }
        public string OldMobileStatus { get; set; } = "Inactive";
        public string NewMobileStatus { get; set; } = "Active";

        public DateTime ChangedAt { get; set; } = DateTime.UtcNow;

        // Navigation property
        public User User { get; set; } = null!;
    }
}

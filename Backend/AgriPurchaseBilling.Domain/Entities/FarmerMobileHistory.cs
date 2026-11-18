namespace AgriPurchaseBilling.Domain.Entities
{
    public class FarmerMobileHistory
    {
        public long Id { get; set; }
        public long FarmerId { get; set; }
        public long UserId { get; set; }

        public required string OldMobile { get; set; }
        public required string NewMobile { get; set; }
        public string OldMobileStatus { get; set; } = "Inactive";
        public string NewMobileStatus { get; set; } = "Active";

        public DateTime ChangedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public Farmer Farmer { get; set; } = null!;
        public User User { get; set; } = null!;
    }
}

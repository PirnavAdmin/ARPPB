namespace AgriPurchaseBilling.Domain.Entities;

public class Farmer
{
    public long Id { get; set; }
    public long UserId { get; set; }
    public required string FarmerCode { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation property
    public User User { get; set; } = null!;
}

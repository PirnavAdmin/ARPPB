
namespace AgriPurchaseBilling.Domain.Entities;

public class UserOtp
{
    public int Id { get; set; }

    // Email is optional
    public string? Email { get; set; }

    // Mobile is optional
    public string? Mobile { get; set; }

    // Hashed OTP
    public required string OtpHash { get; set; }

    public required string Purpose { get; set; }

    public DateTime ExpiresAt { get; set; }

    public int Attempts { get; set; }

    public DateTime? VerifiedAt { get; set; }

    public DateTime CreatedAt { get; set; }
}

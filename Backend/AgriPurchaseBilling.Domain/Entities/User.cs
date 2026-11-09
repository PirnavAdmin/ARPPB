
using AgriPurchaseBilling.Domain.Enums;

namespace AgriPurchaseBilling.Domain.Entities;

public class User
{
    public long Id { get; set; }

    public required string FullName { get; set; }

    // Email is optional
    public string? Email { get; set; }

    // Mobile number is mandatory
    public required string Mobile { get; set; }

    public required string PasswordHash { get; set; }

    public UserRole Role { get; set; }

    public bool IsActive { get; set; } = true;

    // Login protection
    public int FailedLoginAttempts { get; set; } = 0;
    public DateTime? LockoutEnd { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public Farmer? Farmer { get; set; }
    public Customer? Customer { get; set; }
    public Supplier? Supplier { get; set; }
    public Vendor? Vendor { get; set; }
}

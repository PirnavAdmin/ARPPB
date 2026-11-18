namespace AgriPurchaseBilling.Domain.Entities
{
    public class MiddlemanProfile
    {
        public long Id { get; set; }
        public long UserId { get; set; }
        public string MiddlemanPortalId { get; set; } = string.Empty;
        public string? BusinessLogoUrl { get; set; }
        public string RegisteredBusinessName { get; set; } = string.Empty;
        public string? RegistrationLicenseNo { get; set; }
        public string? Gstin { get; set; }
        public string OwnerName { get; set; } = string.Empty;
        public string Mobile { get; set; } = string.Empty;
        public string? Email { get; set; }
        public string? PremisesAddress { get; set; }
        public string? VillageArea { get; set; }
        public string? District { get; set; }
        public string? State { get; set; }
        public string? PinCode { get; set; }
        public string? AccountHolderName { get; set; }
        public string? BankName { get; set; }
        public string? AccountNumber { get; set; }
        public string? IfscCode { get; set; }
        public string? BranchName { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        // Navigation property
        public User User { get; set; } = null!;
    }
    
}

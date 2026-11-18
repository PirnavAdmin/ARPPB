namespace AgriPurchaseBilling.Domain.Entities
{
    public class VendorProfile
    {
        public long Id { get; set; }
        public long? VendorId { get; set; }
        public required string VendorCode { get; set; }
        public required string BusinessName { get; set; }
        public required string OwnerName { get; set; }
        public required string Mobile { get; set; }
        public string Email { get; set; } = string.Empty;
        public string? Gstin { get; set; }
        public string BusinessRegNumber { get; set; } = string.Empty;
        public string BusinessType { get; set; } = string.Empty;
        public string BusinessAddress { get; set; } = string.Empty;
        public string District { get; set; } = string.Empty;
        public string State { get; set; } = string.Empty;
        public string PinCode { get; set; } = string.Empty;
        public bool IsActive { get; set; } = true;
        public bool IsVerified { get; set; }
        public bool OtpSecurityEnabled { get; set; } = true;
        public bool GstBillingEnabled { get; set; } = true;
        public DateTime? ComplianceUpdatedAt { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        public Vendor? Vendor { get; set; }
    }
}

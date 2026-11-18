namespace AgriPurchaseBilling.Domain.Entities
{
    public class CustomerProfileEntity
    {
        public long Id { get; set; }
        public long UserId { get; set; }
        public string? AlternateMobile { get; set; }
        public string Address { get; set; } = string.Empty;
        public string District { get; set; } = string.Empty;
        public string State { get; set; } = string.Empty;
        public string PinCode { get; set; } = string.Empty;
        public string? ProfilePhoto { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    public class CustomerDeliveryAddressEntity
    {
        public long Id { get; set; }
        public long UserId { get; set; }
        public string AddressName { get; set; } = string.Empty;
        public string ContactPerson { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public string FullAddress { get; set; } = string.Empty;
        public string District { get; set; } = string.Empty;
        public string State { get; set; } = string.Empty;
        public string PinCode { get; set; } = string.Empty;
        public bool IsDefault { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    public class CustomerOtpVerificationEntity
    {
        public int Id { get; set; }
        public string? Email { get; set; }
        public string? Mobile { get; set; }
        public string OtpHash { get; set; } = string.Empty;
        public string Purpose { get; set; } = string.Empty;
        public DateTime ExpiresAt { get; set; }
        public int Attempts { get; set; }
        public DateTime? VerifiedAt { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}

using System.ComponentModel.DataAnnotations;

namespace AgriPurchaseBilling.Application.DTOs
{
    public class MiddlemanProfileDto
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
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    public class UpdateMiddlemanProfileRequest
    {
        [Required, StringLength(150)]
        public string RegisteredBusinessName { get; set; } = string.Empty;

        [StringLength(100)] public string? RegistrationLicenseNo { get; set; }
        [StringLength(15)] public string? Gstin { get; set; }
        [Required, StringLength(100)] public string OwnerName { get; set; } = string.Empty;
        [Required, RegularExpression(@"^[0-9]{10}$", ErrorMessage = "Mobile must contain exactly 10 digits.")]
        public string Mobile { get; set; } = string.Empty;
        [EmailAddress, StringLength(100)] public string? Email { get; set; }
        [StringLength(500)] public string? PremisesAddress { get; set; }
        [StringLength(100)] public string? VillageArea { get; set; }
        [StringLength(100)] public string? District { get; set; }
        [StringLength(100)] public string? State { get; set; }
        [RegularExpression(@"^[0-9]{6}$", ErrorMessage = "PIN code must contain exactly 6 digits.")]
        public string? PinCode { get; set; }
        [StringLength(150)] public string? AccountHolderName { get; set; }
        [StringLength(100)] public string? BankName { get; set; }
        [StringLength(34)] public string? AccountNumber { get; set; }
        [RegularExpression(@"^[A-Za-z]{4}0[A-Za-z0-9]{6}$", ErrorMessage = "Invalid IFSC code.")]
        public string? IfscCode { get; set; }
        [StringLength(100)] public string? BranchName { get; set; }
    }
}

/// <summary>Request an OTP for changing the authenticated Middleman's mobile number.</summary>
public class SendMiddlemanMobileChangeOtpRequest
{
    [Required]
    [RegularExpression(@"^[0-9]{10}$", ErrorMessage = "Mobile must contain exactly 10 digits.")]
    public string NewMobile { get; set; } = string.Empty;
}

/// <summary>Verify the OTP sent to the new mobile number.</summary>
public class VerifyMiddlemanMobileChangeOtpRequest
{
    [Required]
    [RegularExpression(@"^[0-9]{10}$", ErrorMessage = "Mobile must contain exactly 10 digits.")]
    public string NewMobile { get; set; } = string.Empty;

    [Required]
    [RegularExpression(@"^[0-9]{6}$", ErrorMessage = "OTP must contain exactly 6 digits.")]
    public string Otp { get; set; } = string.Empty;
}
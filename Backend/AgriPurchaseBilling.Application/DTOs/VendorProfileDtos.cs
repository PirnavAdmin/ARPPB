using System.ComponentModel.DataAnnotations;

namespace AgriPurchaseBilling.Application.DTOs
{
    public class VendorProfileDto
    {
        public long Id { get; set; }
        public string VendorCode { get; set; } = string.Empty;
        public string BusinessName { get; set; } = string.Empty;
        public string Initials { get; set; } = string.Empty;
        public string Status { get; set; } = "Active";
        public bool IsVerified { get; set; }
        public string VerificationLabel { get; set; } = string.Empty;
        public string BusinessDescription { get; set; } = string.Empty;
        public string Location { get; set; } = string.Empty;
        public string Gstin { get; set; } = string.Empty;
        public string ApmcLicenseNumber { get; set; } = string.Empty;
        public VendorComplianceDto Compliance { get; set; } = new();
        public VendorBusinessProfileDto Business { get; set; } = new();
        public VendorBankDetailsDto? BankDetails { get; set; }
    }

    public class VendorComplianceDto
    {
        public bool OtpSecurityEnabled { get; set; }
        public bool GstBillingEnabled { get; set; }
        public string Summary { get; set; } = string.Empty;
        public DateTime? LastUpdated { get; set; }
    }

    public class VendorBusinessProfileDto
    {
        public string VendorId { get; set; } = string.Empty;
        public string BusinessName { get; set; } = string.Empty;
        public string OwnerName { get; set; } = string.Empty;
        public string Mobile { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Gstin { get; set; } = string.Empty;
        public string BusinessRegistrationNumber { get; set; } = string.Empty;
        public string BusinessType { get; set; } = string.Empty;
        public string BusinessAddress { get; set; } = string.Empty;
        public string District { get; set; } = string.Empty;
        public string State { get; set; } = string.Empty;
        public string PinCode { get; set; } = string.Empty;
    }

    public class VendorBankDetailsDto
    {
        public string AccountHolderName { get; set; } = string.Empty;
        public string BankName { get; set; } = string.Empty;
        public string BranchName { get; set; } = string.Empty;
        public string AccountNumber { get; set; } = string.Empty;
        public bool IsMasked { get; set; } = true;
        public string IfscCode { get; set; } = string.Empty;
    }

    // Owner name, email and mobile are not editable here: owner name/email are synced from the
    // user account and mobile changes go through the OTP-verified mobile-change flow.
    public class UpdateVendorProfileRequest
    {
        [Required, StringLength(200)]
        public string BusinessName { get; set; } = string.Empty;

        [RegularExpression(@"^[A-Za-z0-9]{15}$", ErrorMessage = "GSTIN must be 15 alphanumeric characters.")]
        public string Gstin { get; set; } = string.Empty;

        [StringLength(50)]
        public string BusinessRegistrationNumber { get; set; } = string.Empty;

        [StringLength(50)]
        public string? ApmcLicenseNumber { get; set; }

        [StringLength(100)]
        public string BusinessType { get; set; } = string.Empty;

        [StringLength(500)]
        public string BusinessAddress { get; set; } = string.Empty;

        [StringLength(100)]
        public string District { get; set; } = string.Empty;

        [StringLength(100)]
        public string State { get; set; } = string.Empty;

        [RegularExpression(@"^[0-9]{6}$", ErrorMessage = "PIN code must be 6 digits.")]
        public string PinCode { get; set; } = string.Empty;
    }

    public class UpdateVendorBankDetailsRequest
    {
        [Required, StringLength(200)]
        public string AccountHolderName { get; set; } = string.Empty;

        [Required, StringLength(150)]
        public string BankName { get; set; } = string.Empty;

        [Required, StringLength(150)]
        public string BranchName { get; set; } = string.Empty;

        [Required, RegularExpression(@"^[0-9]{9,18}$", ErrorMessage = "Account number must contain 9 to 18 digits.")]
        public string AccountNumber { get; set; } = string.Empty;

        [Required, RegularExpression(@"^[A-Za-z]{4}0[A-Za-z0-9]{6}$", ErrorMessage = "IFSC code format is invalid.")]
        public string IfscCode { get; set; } = string.Empty;

        public bool ConfirmUpdate { get; set; }
    }
}

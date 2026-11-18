using System.ComponentModel.DataAnnotations;

namespace AgriPurchaseBilling.Application.DTOs
{
    public class VendorProfileDto
    {
        public string VendorCode { get; set; } = string.Empty;
        public string BusinessName { get; set; } = string.Empty;
        public string Initials { get; set; } = string.Empty;
        public string Status { get; set; } = "Active";
        public bool IsVerified { get; set; }
        public string VerificationLabel { get; set; } = string.Empty;
        public string BusinessDescription { get; set; } = string.Empty;
        public string Location { get; set; } = string.Empty;
        public string Gstin { get; set; } = string.Empty;
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

    public class UpdateVendorProfileRequest
    {
        [Required(ErrorMessage = "Business name is required.")]
        [StringLength(200, ErrorMessage = "Business name cannot exceed 200 characters.")]
        public string BusinessName { get; set; } = string.Empty;

        [EmailAddress(ErrorMessage = "Invalid email address format.")]
        [StringLength(150, ErrorMessage = "Email cannot exceed 150 characters.")]
        public string? Email { get; set; }

        [RegularExpression(@"^[0-9]{2}[A-Za-z]{5}[0-9]{4}[A-Za-z]{1}[1-9A-Za-z]{1}[Zz][0-9A-Za-z]{1}$", ErrorMessage = "GSTIN format is invalid. Must be a valid 15-character GSTIN.")]
        public string? Gstin { get; set; }

        [Required(ErrorMessage = "Business address is required.")]
        [StringLength(500, ErrorMessage = "Business address cannot exceed 500 characters.")]
        public string BusinessAddress { get; set; } = string.Empty;

        [Required(ErrorMessage = "District is required.")]
        [StringLength(100, ErrorMessage = "District cannot exceed 100 characters.")]
        public string District { get; set; } = string.Empty;

        [Required(ErrorMessage = "State is required.")]
        [StringLength(100, ErrorMessage = "State cannot exceed 100 characters.")]
        public string State { get; set; } = string.Empty;

        [Required(ErrorMessage = "PIN code is required.")]
        [RegularExpression(@"^[1-9][0-9]{5}$", ErrorMessage = "PIN code must be a valid 6-digit postal code.")]
        public string PinCode { get; set; } = string.Empty;

        private string? _businessRegistrationNumber;

        [StringLength(50, ErrorMessage = "Business registration number cannot exceed 50 characters.")]
        public string? BusinessRegistrationNumber
        {
            get => _businessRegistrationNumber;
            set => _businessRegistrationNumber = value;
        }

        // Aliases to seamlessly support frontend naming variations:
        public string? BusinessRegNumber
        {
            get => _businessRegistrationNumber;
            set { if (string.IsNullOrWhiteSpace(_businessRegistrationNumber)) _businessRegistrationNumber = value; }
        }

        public string? BusinessRegistrationNo
        {
            get => _businessRegistrationNumber;
            set { if (string.IsNullOrWhiteSpace(_businessRegistrationNumber)) _businessRegistrationNumber = value; }
        }

        public string? RegistrationNumber
        {
            get => _businessRegistrationNumber;
            set { if (string.IsNullOrWhiteSpace(_businessRegistrationNumber)) _businessRegistrationNumber = value; }
        }

        [StringLength(100, ErrorMessage = "Business type cannot exceed 100 characters.")]
        public string? BusinessType { get; set; }
    }
}

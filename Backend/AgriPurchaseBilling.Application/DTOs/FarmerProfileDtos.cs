using System.ComponentModel.DataAnnotations;

namespace AgriPurchaseBilling.Application.DTOs
{
    public class FarmLocationDto
    {
        public string? FarmName { get; set; }
        public string? TotalLandArea { get; set; }
        public string? SoilType { get; set; }
        public string? PrimaryCrops { get; set; }
        public string? Village { get; set; }
        public string? Mandal { get; set; }
        public string? District { get; set; }
        public string? State { get; set; }
        public string? PinCode { get; set; }
        public string? Address { get; set; }
    }

    public class BankDetailsDto
    {
        public string? BankName { get; set; }
        public string? AccountHolderName { get; set; }
        public string? AccountNumber { get; set; }
        public string? IfscCode { get; set; }
        public string? BranchName { get; set; }
        public string? AccountType { get; set; }
        public string? UpiId { get; set; }
        public bool IsComplete { get; set; }
    }

    public class FarmerProfileResponseDto
    {
        public long UserId { get; set; }
        public long FarmerId { get; set; }
        public required string FarmerCode { get; set; }
        public required string FullName { get; set; }
        public required string Mobile { get; set; }
        public string? AlternateMobile { get; set; }
        public string? Email { get; set; }
        public bool IsActive { get; set; } = true;
        public FarmLocationDto FarmLocation { get; set; } = new();
        public BankDetailsDto BankDetails { get; set; } = new();
    }

    public class UpdateFarmerProfileRequestDto
    {
        [Required(ErrorMessage = "Farmer Full Name is required.")]
        [StringLength(100, ErrorMessage = "Full Name cannot exceed 100 characters.")]
        public required string FullName { get; set; }

        public string? Mobile { get; set; }

        [RegularExpression(@"^[6-9]\d{9}$", ErrorMessage = "Alternate mobile must be a valid 10-digit Indian mobile number.")]
        public string? AlternateMobile { get; set; }

        // Farm Location & Landholding
        [StringLength(150, ErrorMessage = "Farm Name cannot exceed 150 characters.")]
        public string? FarmName { get; set; }

        public string? TotalLandArea { get; set; }

        [StringLength(100, ErrorMessage = "Soil Type cannot exceed 100 characters.")]
        public string? SoilType { get; set; }

        [StringLength(255, ErrorMessage = "Primary Crops cannot exceed 255 characters.")]
        public string? PrimaryCrops { get; set; }

        [StringLength(100, ErrorMessage = "Village cannot exceed 100 characters.")]
        public string? Village { get; set; }

        [StringLength(100, ErrorMessage = "Mandal cannot exceed 100 characters.")]
        public string? Mandal { get; set; }

        [StringLength(100, ErrorMessage = "District cannot exceed 100 characters.")]
        public string? District { get; set; }

        [StringLength(100, ErrorMessage = "State cannot exceed 100 characters.")]
        public string? State { get; set; }

        [RegularExpression(@"^[1-9][0-9]{5}$", ErrorMessage = "PIN Code must be a valid 6-digit postal code.")]
        public string? PinCode { get; set; }

        [StringLength(500, ErrorMessage = "Address cannot exceed 500 characters.")]
        public string? Address { get; set; }
    }

    public class UpdateBankDetailsRequestDto
    {
        [Required(ErrorMessage = "Bank Name is required.")]
        [StringLength(100, ErrorMessage = "Bank Name cannot exceed 100 characters.")]
        public string? BankName { get; set; }

        [Required(ErrorMessage = "Account Holder Name is required.")]
        [StringLength(200, ErrorMessage = "Account Holder Name cannot exceed 200 characters.")]
        public string? AccountHolderName { get; set; }

        [Required(ErrorMessage = "Account Number is required.")]
        [RegularExpression(@"^\d{9,18}$", ErrorMessage = "Account number must be between 9 and 18 digits.")]
        public string? AccountNumber { get; set; }

        [Required(ErrorMessage = "IFSC Code is required.")]
        [RegularExpression(@"^[A-Z]{4}0[A-Z0-9]{6}$", ErrorMessage = "Invalid IFSC code format (e.g. SBIN0001234).")]
        public string? IfscCode { get; set; }

        [StringLength(100, ErrorMessage = "Branch Name cannot exceed 100 characters.")]
        public string? BranchName { get; set; }

        [StringLength(50, ErrorMessage = "Account Type cannot exceed 50 characters.")]
        public string? AccountType { get; set; }

        [StringLength(100, ErrorMessage = "UPI ID cannot exceed 100 characters.")]
        [RegularExpression(@"^[\w\.\-]+@[\w\-]+$", ErrorMessage = "Invalid UPI ID format (e.g. username@upi).")]
        public string? UpiId { get; set; }
    }

    public class ChangeFarmerPasswordRequestDto
    {
        [Required(ErrorMessage = "Current Password is required.")]
        public required string CurrentPassword { get; set; }

        [Required(ErrorMessage = "New Password is required.")]
        [StringLength(100, MinimumLength = 6, ErrorMessage = "New password must be at least 6 characters.")]
        public required string NewPassword { get; set; }

        [Required(ErrorMessage = "Confirm New Password is required.")]
        public required string ConfirmNewPassword { get; set; }
    }

    public class SendMobileChangeOtpRequestDto
    {
        [Required(ErrorMessage = "New mobile number is required.")]
        [RegularExpression(@"^[6-9]\d{9}$", ErrorMessage = "Please enter a valid 10-digit mobile number.")]
        public required string NewMobile { get; set; }
    }

    public class VerifyMobileChangeOtpRequestDto
    {
        [Required(ErrorMessage = "New mobile number is required.")]
        [RegularExpression(@"^[6-9]\d{9}$", ErrorMessage = "Please enter a valid 10-digit mobile number.")]
        public required string NewMobile { get; set; }

        [Required(ErrorMessage = "OTP is required.")]
        [RegularExpression(@"^\d{6}$", ErrorMessage = "OTP must be a 6-digit number.")]
        public required string Otp { get; set; }
    }
}

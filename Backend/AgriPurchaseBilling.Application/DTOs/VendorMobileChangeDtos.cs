using System.ComponentModel.DataAnnotations;

namespace AgriPurchaseBilling.Application.DTOs
{
    public class RequestVendorMobileChangeDto
    {
        [Required, RegularExpression(@"^[6-9][0-9]{9}$", ErrorMessage = "Mobile must be a valid 10-digit number.")]
        public string NewMobile { get; set; } = string.Empty;
    }

    public class VerifyVendorMobileChangeDto
    {
        [Required, RegularExpression(@"^[6-9][0-9]{9}$", ErrorMessage = "Mobile must be a valid 10-digit number.")]
        public string NewMobile { get; set; } = string.Empty;

        [Required, StringLength(20)]
        public string Otp { get; set; } = string.Empty;
    }

    public class VendorMobileChangeOtpDto
    {
        public string VendorCode { get; set; } = string.Empty;
        public string MaskedNewMobile { get; set; } = string.Empty;
        public DateTime ExpiresAt { get; set; }
        public int ExpiresInSeconds { get; set; }
        public string? DevOtp { get; set; }
    }

    public class VendorMobileChangeResultDto
    {
        public string VendorCode { get; set; } = string.Empty;
        public string OldMobile { get; set; } = string.Empty;
        public string NewMobile { get; set; } = string.Empty;
        public DateTime VerifiedAt { get; set; }
    }
}

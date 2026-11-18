using System.ComponentModel.DataAnnotations;

namespace AgriPurchaseBilling.Application.DTOs
{
    /// <summary>
    /// Customer Profile DTO matching Section 2 and API 1 requirements.
    /// </summary>
    public class CustomerProfileDto
    {
        public long CustomerId { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string MobileNumber { get; set; } = string.Empty;
        public string? Email { get; set; }
        public string? ProfilePhoto { get; set; }
        public string? AlternateMobileNumber { get; set; }
        public string Address { get; set; } = string.Empty;
        public string District { get; set; } = string.Empty;
        public string State { get; set; } = string.Empty;
        public string PinCode { get; set; } = string.Empty;
        public List<CustomerDeliveryAddressDto> Addresses { get; set; } = new();
    }

    /// <summary>
    /// Update Customer Profile request payload matching API 2.
    /// </summary>
    public class UpdateCustomerProfileDto
    {
        [Required(ErrorMessage = "Full Name is required.")]
        public string FullName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Mobile Number is required.")]
        [RegularExpression(@"^[0-9]{10}$", ErrorMessage = "Enter a valid 10-digit Indian mobile number.")]
        public string MobileNumber { get; set; } = string.Empty;

        [EmailAddress(ErrorMessage = "Enter a valid email address.")]
        public string? Email { get; set; }

        public string? ProfilePhoto { get; set; }

        [RegularExpression(@"^[0-9]{10}$", ErrorMessage = "Enter a valid 10-digit Indian alternate mobile number.")]
        public string? AlternateMobileNumber { get; set; }

        [Required(ErrorMessage = "Address is required.")]
        public string Address { get; set; } = string.Empty;

        [Required(ErrorMessage = "District is required.")]
        public string District { get; set; } = string.Empty;

        [Required(ErrorMessage = "State is required.")]
        public string State { get; set; } = string.Empty;

        [Required(ErrorMessage = "PIN Code is required.")]
        [RegularExpression(@"^[0-9]{6}$", ErrorMessage = "PIN Code must be exactly 6 digits.")]
        public string PinCode { get; set; } = string.Empty;
    }

    /// <summary>
    /// Customer Delivery Address DTO matching Section 3 and API 3.
    /// </summary>
    public class CustomerDeliveryAddressDto
    {
        public long Id { get; set; }
        public string Label { get; set; } = string.Empty;
        public string RecipientName { get; set; } = string.Empty;
        public string ContactNumber { get; set; } = string.Empty;
        public string AddressLine { get; set; } = string.Empty;
        public string District { get; set; } = string.Empty;
        public string State { get; set; } = string.Empty;
        public string PinCode { get; set; } = string.Empty;
        public bool IsDefault { get; set; }
    }

    /// <summary>
    /// Add Delivery Address payload matching API 4.
    /// </summary>
    public class CreateCustomerDeliveryAddressDto
    {
        [Required(ErrorMessage = "Address label is required (e.g. Primary Warehouse, Godown Branch).")]
        public string Label { get; set; } = string.Empty;

        [Required(ErrorMessage = "Contact person / recipient name is required.")]
        public string RecipientName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Contact phone number is required.")]
        [RegularExpression(@"^[0-9]{10}$", ErrorMessage = "Enter a valid 10-digit Indian phone number.")]
        public string ContactNumber { get; set; } = string.Empty;

        [Required(ErrorMessage = "Full address line is required.")]
        public string AddressLine { get; set; } = string.Empty;

        [Required(ErrorMessage = "District is required.")]
        public string District { get; set; } = string.Empty;

        [Required(ErrorMessage = "State is required.")]
        public string State { get; set; } = string.Empty;

        [Required(ErrorMessage = "PIN Code is required.")]
        [RegularExpression(@"^[0-9]{6}$", ErrorMessage = "PIN Code must be exactly 6 digits.")]
        public string PinCode { get; set; } = string.Empty;

        public bool IsDefault { get; set; }
    }

    /// <summary>
    /// Update Delivery Address payload matching API 5.
    /// </summary>
    public class UpdateCustomerDeliveryAddressDto
    {
        [Required(ErrorMessage = "Address label is required (e.g. Primary Warehouse, Godown Branch).")]
        public string Label { get; set; } = string.Empty;

        [Required(ErrorMessage = "Contact person / recipient name is required.")]
        public string RecipientName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Contact phone number is required.")]
        [RegularExpression(@"^[0-9]{10}$", ErrorMessage = "Enter a valid 10-digit Indian phone number.")]
        public string ContactNumber { get; set; } = string.Empty;

        [Required(ErrorMessage = "Full address line is required.")]
        public string AddressLine { get; set; } = string.Empty;

        [Required(ErrorMessage = "District is required.")]
        public string District { get; set; } = string.Empty;

        [Required(ErrorMessage = "State is required.")]
        public string State { get; set; } = string.Empty;

        [Required(ErrorMessage = "PIN Code is required.")]
        [RegularExpression(@"^[0-9]{6}$", ErrorMessage = "PIN Code must be exactly 6 digits.")]
        public string PinCode { get; set; } = string.Empty;

        public bool IsDefault { get; set; }
    }

    /// <summary>
    /// Request DTO to initiate mobile number change OTP.
    /// </summary>
    public class SendMobileChangeOtpDto
    {
        [Required(ErrorMessage = "New mobile number is required.")]
        [RegularExpression(@"^[0-9]{10}$", ErrorMessage = "New mobile number must be a valid 10-digit Indian number.")]
        public string NewMobileNumber { get; set; } = string.Empty;
    }

    /// <summary>
    /// Request DTO to verify mobile number change OTP.
    /// </summary>
    public class VerifyMobileChangeOtpDto
    {
        [Required(ErrorMessage = "New mobile number is required.")]
        [RegularExpression(@"^[0-9]{10}$", ErrorMessage = "New mobile number must be a valid 10-digit Indian number.")]
        public string NewMobileNumber { get; set; } = string.Empty;

        [Required(ErrorMessage = "OTP is required.")]
        [RegularExpression(@"^[0-9]{6}$", ErrorMessage = "OTP must be exactly 6 digits.")]
        public string Otp { get; set; } = string.Empty;
    }

    /// <summary>
    /// Response DTO after initiating mobile change OTP.
    /// Exposes DevOtp only in Development mode.
    /// </summary>
    public class MobileChangeOtpResponseDto
    {
        public string Message { get; set; } = string.Empty;
        public string? DevOtp { get; set; }
        public int ExpiresInMinutes { get; set; } = 5;
    }
}

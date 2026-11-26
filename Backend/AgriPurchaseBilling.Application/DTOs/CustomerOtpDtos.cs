using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace AgriPurchaseBilling.Application.DTOs
{
    /// <summary>
    /// Query parameters for listing customer OTP confirmations.
    /// Supports search, status filtering, date range presets, sorting, and pagination.
    /// </summary>
    public class CustomerConfirmationQueryDto
    {
        public string? Search { get; set; }
        public string? Status { get; set; } = "all";
        public string? DatePreset { get; set; } = "all";
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public string? SortBy { get; set; } = "requestDate";
        public string? SortOrder { get; set; } = "desc";
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 8;
    }

    /// <summary>
    /// Paged result container for customer OTP confirmations.
    /// </summary>
    public class CustomerConfirmationPagedDto
    {
        public List<CustomerConfirmationListDto> Items { get; set; } = new();
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int TotalCount { get; set; }
        public int TotalPages { get; set; }
    }

    /// <summary>
    /// Summary row for an OTP confirmation item in customer list view.
    /// </summary>
    public class CustomerConfirmationListDto
    {
        public long Id { get; set; }
        public string ConfirmationCode { get; set; } = string.Empty;
        public string OrderId { get; set; } = string.Empty;
        public string TransactionId { get; set; } = string.Empty;

        [JsonPropertyName("product")]
        public string ProductName { get; set; } = string.Empty;

        [JsonIgnore]
        public string Product { get => ProductName; set => ProductName = value; }

        public decimal Quantity { get; set; }
        public string Unit { get; set; } = string.Empty;
        public decimal UnitPrice { get; set; }
        public decimal TotalAmount { get; set; }
        public DateTime RequestDate { get; set; }
        public DateTime? ExpiresAt { get; set; }
        public string OtpStatus { get; set; } = string.Empty;

        [JsonPropertyName("attemptsUsed")]
        public int Attempts { get; set; }

        [JsonIgnore]
        public int AttemptsUsed { get => Attempts; set => Attempts = value; }

        public string SellerName { get; set; } = string.Empty;

        // Exposed strictly in Development mode for UI testing. Never populated in Production.
        public string? DemoOtpCode { get; set; }

        [JsonIgnore]
        public string? DevOtp { get => DemoOtpCode; set => DemoOtpCode = value; }
    }

    /// <summary>
    /// Detailed confirmation view with order details and verification history.
    /// Note: OTP secret/hash is NEVER exposed in this or any API response.
    /// </summary>
    public class CustomerConfirmationDetailDto
    {
        public long Id { get; set; }
        public string ConfirmationCode { get; set; } = string.Empty;
        public string OrderId { get; set; } = string.Empty;
        public string TransactionId { get; set; } = string.Empty;

        [JsonPropertyName("product")]
        public string ProductName { get; set; } = string.Empty;

        [JsonIgnore]
        public string Product { get => ProductName; set => ProductName = value; }

        public decimal Quantity { get; set; }
        public string Unit { get; set; } = string.Empty;
        public decimal UnitPrice { get; set; }
        public decimal TotalAmount { get; set; }
        public DateTime RequestDate { get; set; }
        public DateTime? ExpiresAt { get; set; }
        public DateTime? ConfirmedAt { get; set; }
        public string OtpStatus { get; set; } = string.Empty;

        [JsonPropertyName("attemptsUsed")]
        public int Attempts { get; set; }

        [JsonIgnore]
        public int AttemptsUsed { get => Attempts; set => Attempts = value; }

        public int MaxAttempts { get; set; } = 3;
        public string SellerName { get; set; } = string.Empty;
        public string? RejectionReason { get; set; }

        // Exposed strictly in Development mode for UI testing. Never populated in Production.
        public string? DemoOtpCode { get; set; }

        [JsonIgnore]
        public string? DevOtp { get => DemoOtpCode; set => DemoOtpCode = value; }

        public List<CustomerConfirmationAuditDto> AuditHistory { get; set; } = new();
    }

    /// <summary>
    /// Audit history entry derived from actual database timestamps.
    /// </summary>
    public class CustomerConfirmationAuditDto
    {
        public string Status { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; }
        public string Note { get; set; } = string.Empty;
    }

    /// <summary>
    /// Request payload to verify a 6-digit OTP code.
    /// </summary>
    public class CustomerVerifyOtpRequestDto
    {
        [Required(ErrorMessage = "OTP code is required.")]
        [RegularExpression(@"^\d{6}$", ErrorMessage = "OTP must be exactly 6 numeric digits.")]
        public string OtpCode { get; set; } = string.Empty;
    }

    /// <summary>
    /// Request payload to reject an OTP confirmation request.
    /// </summary>
    public class CustomerRejectOtpRequestDto
    {
        [MaxLength(500, ErrorMessage = "Rejection reason cannot exceed 500 characters.")]
        public string? RejectionReason { get; set; }
    }
}


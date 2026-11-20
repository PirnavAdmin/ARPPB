using System;
using System.Collections.Generic;

namespace AgriPurchaseBilling.Application.DTOs
{
    public class MiddlemanConfirmationDto
    {
        public long Id { get; set; }
        public long MiddlemanId { get; set; }
        public string ConfirmationCode { get; set; } = string.Empty;
        public string ConfirmationId => ConfirmationCode;
        public string TransactionId { get; set; } = string.Empty;
        public string TransactionType { get; set; } = string.Empty;
        public string PartyType { get; set; } = string.Empty;
        public string PartyCategory => PartyType;
        public string PartyId { get; set; } = string.Empty;
        public string PartyName { get; set; } = string.Empty;
        public string? PartyMobile { get; set; }
        public string MobileNumber => PartyMobile ?? string.Empty;
        public string Crop { get; set; } = string.Empty;
        public string Variety { get; set; } = "Standard";
        public string Product => !string.IsNullOrEmpty(Variety) && Variety != "Standard" ? $"{Crop} ({Variety})" : Crop;
        public decimal Quantity { get; set; }
        public string Unit { get; set; } = "Quintal";
        public decimal PricePerUnit { get; set; }
        public decimal TransactionAmount { get; set; }
        public decimal Amount => TransactionAmount;
        public string OtpStatus { get; set; } = "Pending";
        public string? OtpCode { get; set; }
        public string DemoOtpCode => OtpCode ?? "488031";
        public string RequestDate { get; set; } = string.Empty;
        public string InitiatedDate => RequestDate;
        public string? ExpiryDate { get; set; }
        public string? ExpiryTime => ExpiryDate;
        public string? ConfirmationDate { get; set; }
        public string? Notes { get; set; }
    }

    public class MiddlemanOtpSummaryDto
    {
        public int TotalRequests { get; set; }
        public int PendingCount { get; set; }
        public int VerifiedCount { get; set; }
        public int FailedOrExpiredCount { get; set; }
        public int FarmerCount { get; set; }
        public int VendorCount { get; set; }
        public int CustomerCount { get; set; }
        public int AllCount { get; set; }
    }

    public class MiddlemanOtpQueryDto
    {
        public string? Category { get; set; }
        public string? OtpStatus { get; set; }
        public string? Search { get; set; }
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 10;
    }

    public class MiddlemanOtpPageDto
    {
        public List<MiddlemanConfirmationDto> Items { get; set; } = new();
        public int TotalCount { get; set; }
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 10;
        public int TotalPages => PageSize > 0 ? (int)Math.Ceiling((double)TotalCount / PageSize) : 0;
    }

    public class MiddlemanVerifyOtpRequest
    {
        public string? EnteredCode { get; set; }
        public string? Otp { get; set; }
    }

    public class MiddlemanRejectOtpRequest
    {
        public string? Reason { get; set; }
    }
}

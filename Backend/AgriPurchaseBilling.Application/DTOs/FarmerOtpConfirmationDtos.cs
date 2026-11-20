using System;
using System.Collections.Generic;

namespace AgriPurchaseBilling.Application.DTOs
{
    /// <summary>
    /// Powers the 4 KPI summary cards and tab badges at the top of the OTP Confirmations & Transaction Security page:
    /// 1. Pending Authorizations (Awaiting 6-digit OTP, Action req.)
    /// 2. Confirmed Transactions (Verified & stock released)
    /// 3. Rejected / Expired (Declined or timed out)
    /// 4. Total Protected Value (Total ₹ secured by OTP handshake)
    /// </summary>
    public class FarmerOtpSummaryDto
    {
        public int PendingAuthorizations { get; set; }
        public int ConfirmedTransactions { get; set; }
        public int RejectedCount { get; set; }
        public int ExpiredCount { get; set; }
        public int RejectedOrExpired => RejectedCount + ExpiredCount;
        public int AllConfirmationsCount => PendingAuthorizations + ConfirmedTransactions + RejectedCount + ExpiredCount;
        public decimal TotalProtectedValue { get; set; }
        public string FormattedTotalProtectedValue => $"₹{TotalProtectedValue:N2}";
    }

    /// <summary>
    /// Powers each row in the OTP Confirmations & Transaction Security data table.
    /// Aliases match the columns on the screen: OTP ID, Linked Txn, Buyer Information, Channel, Crop & Quantity, Agreed Rate, Total Value, Request Date, Verification Status, Action.
    /// </summary>
    public class FarmerOtpConfirmationItemDto
    {
        // Primary Identifiers
        public string Id { get; set; } = string.Empty; // Maps to OtpId string e.g. "OTP-2026-301" for table column & JS string methods
        public long SaleId { get; set; } // Numeric database identifier for API calls (/verify, /resend, /reject)
        public required string OtpId { get; set; }
        public required string TransactionId { get; set; }
        public string LinkedTxn => TransactionId;

        // Buyer Information
        public required string BuyerName { get; set; }
        public required string BuyerMobile { get; set; }
        public required string BuyerCategory { get; set; }
        public string Channel => BuyerCategory;

        // Crop & Value
        public required string Crop { get; set; }
        public string CropName => Crop;
        public string? CropVariety { get; set; }
        public decimal Quantity { get; set; }
        public required string Unit { get; set; }
        public decimal Rate { get; set; }
        public decimal AgreedRate => Rate;
        public decimal TotalAmount { get; set; }
        public decimal TotalValue => TotalAmount;

        // Verification & Audit Status
        public string RequestDate { get; set; } = string.Empty;
        public required string OtpStatus { get; set; } // "Pending", "Confirmed", "Rejected", "Expired"
        public string VerificationStatus => OtpStatus;
        public string? OtpCode { get; set; }
        public int ExpiresInMinutes { get; set; }
        public DateTime? ExpiresAt { get; set; }
        public int AttemptsLeft { get; set; } = 3;
        public string Direction { get; set; } = "received_request";
        public string? PickupLocation { get; set; }
        public string? QualityGrade { get; set; }
        public string? Notes { get; set; }
        public DateTime? ConfirmedAt { get; set; }
    }

    public class FarmerOtpFilterQueryDto
    {
        public string? Tab { get; set; } // "Pending", "Confirmed", "Rejected", "Expired", "All"
        public string? BuyerCategory { get; set; } // "Middleman", "Vendor", "Customer", "All", "Vendors Only", etc.
        public string? Search { get; set; }
        public long? UserId { get; set; }
    }
}

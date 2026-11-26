using System;
using System.Collections.Generic;

namespace AgriPurchaseBilling.Application.DTOs
{
    /// <summary>
    /// Powers the 4 KPI summary cards at the top of the My Sales page:
    /// 1. Total Orders
    /// 2. Quantity Dispatched
    /// 3. Confirmed Revenue
    /// 4. Pending OTP Confirmation
    /// </summary>
    public class FarmerMySalesSummaryDto
    {
        public int TotalOrders { get; set; }
        public decimal QuantityDispatched { get; set; }
        public string DispatchedUnit { get; set; } = "qtl";
        public decimal ConfirmedRevenue { get; set; }
        public int PendingOtpOrders { get; set; }
    }

    /// <summary>
    /// Powers each row in the My Sales Orders & Transactions data table
    /// </summary>
    public class MySalesListItemDto
    {
        public long Id { get; set; }
        public required string TransactionId { get; set; }
        public DateTime Date { get; set; }

        // Buyer Information
        public required string BuyerName { get; set; }
        public required string BuyerMobile { get; set; }
        public required string BuyerCategory { get; set; }

        // Crop & Pricing
        public long CropId { get; set; }
        public required string CropName { get; set; }
        public string? CropVariety { get; set; }
        public decimal Quantity { get; set; }
        public decimal SellingQuantity => Quantity;
        public required string Unit { get; set; }
        public decimal Rate { get; set; }
        public decimal PricePerUnit => Rate;
        public decimal TotalAmount { get; set; }
        public string SaleCode => TransactionId;

        // Statuses
        public required string ConfirmationStatus { get; set; }
        public required string OtpStatus { get; set; }
        public DateTime? ExpectedPaymentDate { get; set; }
        public string? PickupLocation { get; set; }
        public string? QualityGrade { get; set; }
        public string? Notes { get; set; }
        public DateTime? ConfirmedAt { get; set; }
    }

    public class MySalesFilterQueryDto
    {
        public string? BuyerCategory { get; set; }
        public string? CropName { get; set; }
        public string? Status { get; set; }
        public string? OtpStatus { get; set; }
        public string? Search { get; set; }
        public long? UserId { get; set; }
    }
}

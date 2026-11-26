using System;

namespace AgriPurchaseBilling.Domain.Entities
{
    /// <summary>
    /// Entity mapped to table 'farmer_my_sales'.
    /// Stores the confirmed sales ledger and transaction history for the My Sales portal & KPI cards.
    /// </summary>
    public class FarmerMySale
    {
        public long Id { get; set; }
        public long? SellProductId { get; set; }
        public required string SaleCode { get; set; }
        public long FarmerId { get; set; }
        public long CropId { get; set; }

        // Crop Snapshot Information
        public required string CropName { get; set; }
        public required string CropVariety { get; set; }
        public string? QualityGrade { get; set; }

        // Buyer Information
        public required string BuyerCategory { get; set; } // "Middleman", "Vendor", "Customer"
        public required string BuyerName { get; set; }
        public required string BuyerMobile { get; set; }

        // Settlement & Quantity Details
        public decimal QuantityDispatched { get; set; }
        public string Unit { get; set; } = "Quintals";
        public decimal SellingRate { get; set; }
        public decimal TotalRevenue { get; set; }

        // Statuses
        public string Status { get; set; } = "Confirmed";
        public string PaymentStatus { get; set; } = "Pending";
        public string DeliveryStatus { get; set; } = "Scheduled";

        // Fulfillment Information
        public required string PickupLocation { get; set; }
        public DateTime? ExpectedPaymentDate { get; set; }
        public DateTime ConfirmedAt { get; set; } = DateTime.UtcNow;
        public string? Notes { get; set; }

        // Audit Fields
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation Properties
        public Farmer? Farmer { get; set; }
        public FarmerCrop? FarmerCrop { get; set; }
    }
}

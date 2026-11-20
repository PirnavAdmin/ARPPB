using System;

namespace AgriPurchaseBilling.Domain.Entities
{
    public class FarmerSale
    {
        public long Id { get; set; }
        public required string SaleCode { get; set; }
        public long FarmerId { get; set; }
        public long CropId { get; set; }

        // Buyer Information
        public required string BuyerCategory { get; set; } // "Middleman", "Vendor", "Customer"
        public required string BuyerName { get; set; }
        public required string BuyerMobile { get; set; }

        // Crop Snapshot Information
        public required string CropName { get; set; }
        public required string CropVariety { get; set; }
        public string? QualityGrade { get; set; }

        // Transaction Details
        public decimal SellingQuantity { get; set; }
        public string Unit { get; set; } = "Quintals";
        public decimal PricePerUnit { get; set; }
        public decimal TotalAmount { get; set; }

        // Logistics & Fulfillment
        public required string PickupLocation { get; set; }
        public DateTime ExpectedPickupDate { get; set; }
        public string? Notes { get; set; }

        // Status & OTP Verification
        public string Status { get; set; } = "Pending OTP Confirmation";
        public string? OtpCode { get; set; }
        public string OtpStatus { get; set; } = "Pending";
        public DateTime? OtpExpiresAt { get; set; }
        public DateTime? ConfirmedAt { get; set; }

        // Audit Fields
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation Properties
        public Farmer? Farmer { get; set; }
        public FarmerCrop? FarmerCrop { get; set; }
    }
}

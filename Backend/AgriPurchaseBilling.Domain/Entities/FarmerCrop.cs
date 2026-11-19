using System;

namespace AgriPurchaseBilling.Domain.Entities
{
    public class FarmerCrop
    {
        public long Id { get; set; }
        public required string CropCode { get; set; }
        public long FarmerId { get; set; }

        // Core Form Fields
        public required string CropName { get; set; }
        public required string CropCategory { get; set; }
        public required string CropVariety { get; set; }
        public required string Season { get; set; }
        public decimal CultivationAreaAcres { get; set; }
        public DateTime HarvestDate { get; set; }

        // Stock & Quantity
        public decimal HarvestedQuantity { get; set; }
        public decimal AvailableQuantity { get; set; }
        public decimal SoldQuantity { get; set; } = 0.00m;
        public string Unit { get; set; } = "Quintals";

        // Pricing & Quality
        public decimal ExpectedSellingPrice { get; set; }
        public string? QualityGrade { get; set; }
        public required string StorageLocation { get; set; }
        public string? CropDescription { get; set; }

        // Status & Lifecycle
        public string Status { get; set; } = "Ready to Sell";
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation property
        public Farmer? Farmer { get; set; }
    }
}

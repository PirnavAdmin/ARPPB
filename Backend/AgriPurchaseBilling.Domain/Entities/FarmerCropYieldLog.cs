using System;

namespace AgriPurchaseBilling.Domain.Entities
{
    public class FarmerCropYieldLog
    {
        public long Id { get; set; }
        public long FarmerCropId { get; set; }
        public decimal AdditionalQuantity { get; set; }
        public decimal PreviousAvailableQuantity { get; set; }
        public decimal NewAvailableQuantity { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation property
        public FarmerCrop? FarmerCrop { get; set; }
    }
}

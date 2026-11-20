namespace AgriPurchaseBilling.Domain.Entities
{
    /// <summary>
    /// Read-only mapping to the existing shared MariaDB table `vendor_finished_products`.
    /// Used by the Customer Marketplace module to expose eligible vendor-listed products.
    /// </summary>
    public class VendorFinishedProduct
    {
        public long Id { get; set; }
        public long VendorId { get; set; }
        public string ProductCode { get; set; } = string.Empty;
        public string ProductName { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public string SourceRawMaterial { get; set; } = string.Empty;
        public string BrandName { get; set; } = string.Empty;
        public string Packaging { get; set; } = string.Empty;
        public decimal AvailableQuantity { get; set; }
        public decimal SoldQuantity { get; set; }
        public string Unit { get; set; } = string.Empty;
        public DateTime MfgDate { get; set; }
        public DateTime ExpiryDate { get; set; }
        public decimal ProductionCost { get; set; }
        public decimal SellingPrice { get; set; }
        public decimal ProfitMarginPercentage { get; set; }
        public decimal MinThresholdQuantity { get; set; }
        public string Status { get; set; } = string.Empty;
        public string? ImageUrl { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}


using System;

namespace AgriPurchaseBilling.Domain.Entities
{
    public class DailyMandiMarketPrice
    {
        public long Id { get; set; }
        public string PriceCode { get; set; } = string.Empty;
        public string Crop { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public string Market { get; set; } = string.Empty;
        public string State { get; set; } = string.Empty;
        public string Location { get; set; } = string.Empty;
        public decimal TodayPrice { get; set; }
        public decimal PrevPrice { get; set; }
        public string DailyChange { get; set; } = string.Empty;
        public string Trend { get; set; } = "up";
        public decimal MinPrice { get; set; }
        public decimal MaxPrice { get; set; }
        public decimal AvgPrice { get; set; }
        public string Unit { get; set; } = "qtl";
        public string? PriceHistory { get; set; }
        public string? UpdatedLabel { get; set; }
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}

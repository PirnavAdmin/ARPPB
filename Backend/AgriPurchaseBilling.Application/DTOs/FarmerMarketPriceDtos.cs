using System;
using System.Collections.Generic;

namespace AgriPurchaseBilling.Application.DTOs
{
    /// <summary>
    /// Powers the State Filter dropdown at the top of Daily Mandi Market Prices page
    /// (e.g. "All States (AP & TG)", "Andhra Pradesh Mandis", "Telangana APMCs")
    /// </summary>
    public class MarketPriceStateOptionDto
    {
        public string StateValue { get; set; } = "All";
        public string StateLabel { get; set; } = "All States (AP & TG)";
        public int MandiCount { get; set; }
    }

    /// <summary>
    /// Powers each commodity row in the Daily Mandi Market Prices data table
    /// </summary>
    public class FarmerMarketPriceItemDto
    {
        public string Id { get; set; } = string.Empty;
        public long NumericId { get; set; }
        public string Crop { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public string Market { get; set; } = string.Empty;
        public string State { get; set; } = string.Empty;
        public string Location { get; set; } = string.Empty;
        public decimal TodayPrice { get; set; }
        public decimal PrevPrice { get; set; }
        public string Change { get; set; } = string.Empty;
        public string Trend { get; set; } = "up";
        public decimal MinPrice { get; set; }
        public decimal MaxPrice { get; set; }
        public decimal AvgPrice { get; set; }
        public string Unit { get; set; } = "qtl";
        public string LastUpdated { get; set; } = string.Empty;
        public List<decimal> History { get; set; } = new();
    }

    /// <summary>
    /// Powers the interactive "View Chart" modal showing 6-day price movement trend
    /// </summary>
    public class FarmerMarketPriceChartDto
    {
        public string Id { get; set; } = string.Empty;
        public string Crop { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public string Market { get; set; } = string.Empty;
        public string State { get; set; } = string.Empty;
        public string Location { get; set; } = string.Empty;
        public decimal TodayPrice { get; set; }
        public decimal PrevPrice { get; set; }
        public string Change { get; set; } = string.Empty;
        public string Trend { get; set; } = "up";
        public decimal MinPrice { get; set; }
        public decimal MaxPrice { get; set; }
        public decimal AvgPrice { get; set; }
        public string Unit { get; set; } = "qtl";
        public string LastUpdated { get; set; } = string.Empty;
        public List<decimal> History { get; set; } = new();
        public List<MarketPriceChartDataPointDto> DataPoints { get; set; } = new();
    }

    public class MarketPriceChartDataPointDto
    {
        public int DayIndex { get; set; }
        public string DayLabel { get; set; } = string.Empty;
        public decimal Rate { get; set; }
        public string RateFormatted { get; set; } = string.Empty;
        public int PercentageHeight { get; set; }
        public bool IsLatest { get; set; }
    }

    /// <summary>
    /// Filter parameters for market prices list
    /// </summary>
    public class FarmerMarketPriceFilterDto
    {
        public string? State { get; set; }
        public string? Search { get; set; }
        public string? Category { get; set; }
    }
}

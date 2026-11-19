using System;
using System.Collections.Generic;

namespace AgriPurchaseBilling.Application.DTOs.VendorOperations
{
    public sealed class VendorDashboardDto
    {
        public DateTime GeneratedAtUtc { get; set; }
        public DateTime? FromDate { get; set; }
        public DateTime? ToDate { get; set; }
        public VendorDashboardKpisDto Kpis { get; set; } = new();
        public VendorPurchaseOverviewDto PurchaseOverview { get; set; } = new();
        public List<VendorPurchaseTrendDto> PurchaseTrend { get; set; } = new();
        public List<VendorCropInventoryDto> RawMaterialInventoryByCrop { get; set; } = new();
        public List<VendorDashboardFinishedProductDto> FinishedProducts { get; set; } = new();
        public VendorSalesAnalyticsDto SalesAnalytics { get; set; } = new();
        public VendorEstimatedProfitLossDto EstimatedProfitLoss { get; set; } = new();
        public List<VendorDashboardOtpConfirmationDto> PendingOtpConfirmations { get; set; } = new();
    }

    public sealed class VendorDashboardKpisDto
    {
        public int TotalFarmers { get; set; }
        public int ActiveFarmers { get; set; }
        public int TotalMiddlemen { get; set; }
        public int ActiveMiddlemen { get; set; }
        public int TotalPurchases { get; set; }
        public decimal TotalPurchaseAmount { get; set; }
        public int TotalCustomers { get; set; }
        public decimal TotalSales { get; set; }
        public int TotalOrders { get; set; }
    }

    public sealed class VendorPurchaseOverviewDto
    {
        public decimal FarmerPurchaseAmount { get; set; }
        public decimal FarmerPurchaseQuantity { get; set; }
        public int FarmerPurchaseCount { get; set; }
        public decimal MiddlemanPurchaseAmount { get; set; }
        public decimal MiddlemanPurchaseQuantity { get; set; }
        public int MiddlemanPurchaseCount { get; set; }
        public string QuantityUnit { get; set; } = "Quintal";
    }

    public sealed class VendorPurchaseTrendDto
    {
        public DateTime PeriodStart { get; set; }
        public decimal FarmerPurchaseAmount { get; set; }
        public decimal MiddlemanPurchaseAmount { get; set; }
        public decimal FarmerPurchaseQuantity { get; set; }
        public decimal MiddlemanPurchaseQuantity { get; set; }
    }

    public sealed class VendorCropInventoryDto
    {
        public string CropName { get; set; } = string.Empty;
        public decimal AvailableQuantity { get; set; }
        public string Unit { get; set; } = "Quintal";
    }

    public sealed class VendorDashboardFinishedProductDto
    {
        public string ProductId { get; set; } = string.Empty;
        public string ProductName { get; set; } = string.Empty;
        public string BrandName { get; set; } = string.Empty;
        public decimal AvailableQuantity { get; set; }
        public decimal SoldQuantity { get; set; }
        public string Unit { get; set; } = "Quintal";
        public decimal SellingPrice { get; set; }
        public decimal MinThresholdQuantity { get; set; }
        public bool IsLowStock { get; set; }
    }

    public sealed class VendorSalesAnalyticsDto
    {
        public decimal TotalRevenue { get; set; }
        public int NumberOfOrders { get; set; }
        public decimal SalesVolume { get; set; }
        public decimal AverageOrderValue { get; set; }
        public string QuantityUnit { get; set; } = "Quintal";
        public List<VendorRevenueTrendDto> RevenueTrend { get; set; } = new();
        public List<VendorProductRevenueDto> ProductRevenue { get; set; } = new();
    }

    public sealed class VendorRevenueTrendDto
    {
        public DateTime PeriodStart { get; set; }
        public decimal Revenue { get; set; }
    }

    public sealed class VendorProductRevenueDto
    {
        public string ProductName { get; set; } = string.Empty;
        public decimal Revenue { get; set; }
    }

    public sealed class VendorEstimatedProfitLossDto
    {
        public bool IsEstimate { get; set; } = true;
        public decimal RawMaterialCost { get; set; }
        public decimal ProcessingExpenses { get; set; }
        public decimal SalesRevenue { get; set; }
        public decimal EstimatedProfit { get; set; }
        public string CalculationNote { get; set; } = string.Empty;
    }

    public sealed class VendorDashboardOtpConfirmationDto
    {
        public long Id { get; set; }
        public string PartnerType { get; set; } = string.Empty;
        public string PartnerName { get; set; } = string.Empty;
        public string PartnerCode { get; set; } = string.Empty;
        public string Purpose { get; set; } = string.Empty;
        public string ActionDetails { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public string? SandboxOtp { get; set; }
    }

    public sealed class VerifyVendorDashboardOtpRequest
    {
        public required string Otp { get; set; }
    }

    public sealed class VendorDashboardOtpVerificationDto
    {
        public bool Verified { get; set; }
        public string PartnerType { get; set; } = string.Empty;
        public long ConfirmationId { get; set; }
        public DateTime? VerifiedAt { get; set; }
    }

    public sealed class VendorDashboardTransactionQueryDto
    {
        public string? Search { get; set; }
        public string? Type { get; set; }
        public string? Status { get; set; }
        public DateTime? FromDate { get; set; }
        public DateTime? ToDate { get; set; }
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 10;
    }

    public sealed class VendorDashboardTransactionPageDto
    {
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int TotalRecords { get; set; }
        public int TotalPages { get; set; }
        public List<VendorDashboardTransactionDto> Items { get; set; } = new();
    }

    public sealed class VendorDashboardTransactionDto
    {
        public string TransactionId { get; set; } = string.Empty;
        public DateTime Date { get; set; }
        public string PartyName { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public string Product { get; set; } = string.Empty;
        public decimal Quantity { get; set; }
        public string Unit { get; set; } = "Quintal";
        public decimal Amount { get; set; }
        public decimal? DueAmount { get; set; }
        public string Status { get; set; } = string.Empty;
        public string OtpStatus { get; set; } = "NotTracked";
        public DateTime? ExpectedPaymentDate { get; set; }
    }

    public sealed class VendorDashboardSearchResultDto
    {
        public string EntityType { get; set; } = string.Empty;
        public string EntityId { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Subtitle { get; set; } = string.Empty;
        public string NavigationPath { get; set; } = string.Empty;
    }
}

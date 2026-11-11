using System.Collections.Generic;

namespace AgriPurchaseBilling.Application.DTOs;

public class BankDetailsDto
{
    public string BankName { get; set; } = string.Empty;
    public string AccountNumber { get; set; } = string.Empty;
    public string FullAccountNumber { get; set; } = string.Empty;
    public string IfscCode { get; set; } = string.Empty;
    public string Branch { get; set; } = string.Empty;
    public string AccountType { get; set; } = string.Empty;
}

public class FarmerProfileDto
{
    public string FarmerId { get; set; } = string.Empty;
    public string FarmerName { get; set; } = string.Empty;
    public string MobileNumber { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string FarmName { get; set; } = string.Empty;
    public string Village { get; set; } = string.Empty;
    public string Mandal { get; set; } = string.Empty;
    public string District { get; set; } = string.Empty;
    public string State { get; set; } = string.Empty;
    public string PinCode { get; set; } = string.Empty;
    public string CompleteAddress { get; set; } = string.Empty;
    public string TotalLandArea { get; set; } = string.Empty;
    public string PrimaryCrops { get; set; } = string.Empty;
    public string SoilHealthCard { get; set; } = string.Empty;
    public string IrrigationType { get; set; } = string.Empty;
    public string Membership { get; set; } = string.Empty;
    public string Rating { get; set; } = string.Empty;
    public BankDetailsDto BankDetails { get; set; } = new();
}

public class CropDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string Variety { get; set; } = string.Empty;
    public string Season { get; set; } = string.Empty;
    public decimal CultivationArea { get; set; }
    public string HarvestDate { get; set; } = string.Empty;
    public decimal AvailableQuantity { get; set; }
    public decimal HarvestedQuantity { get; set; }
    public decimal SoldQuantity { get; set; }
    public decimal ReservedQuantity { get; set; }
    public string Unit { get; set; } = "qtl";
    public decimal ExpectedSellingPrice { get; set; }
    public string QualityGrade { get; set; } = "Grade A";
    public string Village { get; set; } = string.Empty;
    public string District { get; set; } = string.Empty;
    public string State { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Status { get; set; } = "Ready to Sell";
    public string Color { get; set; } = "#237A45";
}

public class HarvestStockRequestDto
{
    public decimal Quantity { get; set; }
    public string Unit { get; set; } = "qtl";
}

public class MarketPriceDto
{
    public string Id { get; set; } = string.Empty;
    public string Commodity { get; set; } = string.Empty;
    public string Variety { get; set; } = string.Empty;
    public string Market { get; set; } = string.Empty;
    public string District { get; set; } = string.Empty;
    public string State { get; set; } = string.Empty;
    public decimal ModalPrice { get; set; }
    public decimal MinPrice { get; set; }
    public decimal MaxPrice { get; set; }
    public string Unit { get; set; } = "₹/qtl";
    public string PriceDate { get; set; } = string.Empty;
    public decimal ChangePercent { get; set; }
    public string Trend { get; set; } = "up"; // "up" or "down"
}

public class SaleTransactionDto
{
    public string Id { get; set; } = string.Empty;
    public string Date { get; set; } = string.Empty;
    public string CropId { get; set; } = string.Empty;
    public string CropName { get; set; } = string.Empty;
    public string BuyerName { get; set; } = string.Empty;
    public string BuyerCategory { get; set; } = string.Empty;
    public string BuyerMobile { get; set; } = string.Empty;
    public decimal Quantity { get; set; }
    public string Unit { get; set; } = "qtl";
    public decimal Rate { get; set; }
    public decimal TotalAmount { get; set; }
    public string TransactionStatus { get; set; } = "Pending Confirmation";
    public string OtpStatus { get; set; } = "Pending";
    public string ExpectedPaymentDate { get; set; } = string.Empty;
    public string PaymentStatus { get; set; } = "Payment Expected";
    public string PickupLocation { get; set; } = string.Empty;
    public string Notes { get; set; } = string.Empty;
    public string QualityGrade { get; set; } = "Grade A";
}

public class PurchaseRecordDto
{
    public string Id { get; set; } = string.Empty;
    public string Date { get; set; } = string.Empty;
    public string ItemName { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string SupplierName { get; set; } = string.Empty;
    public string SupplierCategory { get; set; } = string.Empty;
    public decimal Quantity { get; set; }
    public string Unit { get; set; } = string.Empty;
    public decimal Rate { get; set; }
    public decimal TotalAmount { get; set; }
    public string PaymentStatus { get; set; } = "Paid";
    public string InvoiceNumber { get; set; } = string.Empty;
    public string Notes { get; set; } = string.Empty;
}

public class OtpRequestDto
{
    public string Id { get; set; } = string.Empty;
    public string TransactionId { get; set; } = string.Empty;
    public string BuyerName { get; set; } = string.Empty;
    public string BuyerCategory { get; set; } = string.Empty;
    public string BuyerMobile { get; set; } = string.Empty;
    public string Crop { get; set; } = string.Empty;
    public string CropId { get; set; } = string.Empty;
    public decimal Quantity { get; set; }
    public string Unit { get; set; } = "qtl";
    public decimal Rate { get; set; }
    public decimal TotalAmount { get; set; }
    public string RequestDate { get; set; } = string.Empty;
    public string OtpStatus { get; set; } = "Pending";
    public string OtpCode { get; set; } = string.Empty;
    public long ExpiresAt { get; set; }
    public int ExpiresInMinutes { get; set; } = 10;
    public int AttemptsLeft { get; set; } = 3;
    public string Direction { get; set; } = "farmer_initiated";
}

public class StockRecordDto
{
    public string Id { get; set; } = string.Empty;
    public string CropId { get; set; } = string.Empty;
    public string CropName { get; set; } = string.Empty;
    public string Variety { get; set; } = string.Empty;
    public decimal OpeningStock { get; set; }
    public decimal HarvestedQuantity { get; set; }
    public decimal SoldQuantity { get; set; }
    public decimal ReservedQuantity { get; set; }
    public decimal AvailableQuantity { get; set; }
    public string Unit { get; set; } = "qtl";
    public string LastUpdated { get; set; } = string.Empty;
    public string Status { get; set; } = "Normal";
    public string StorageLocation { get; set; } = string.Empty;
}

public class NotificationDto
{
    public string Id { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Detail { get; set; } = string.Empty;
    public string Time { get; set; } = "Just now";
    public string Timestamp { get; set; } = string.Empty;
    public string Type { get; set; } = "info";
    public string Category { get; set; } = "general";
    public bool Read { get; set; }
    public string TargetPage { get; set; } = string.Empty;
    public string? TargetId { get; set; }
}

public class FarmerDashboardDto
{
    public FarmerProfileDto Profile { get; set; } = new();
    public int TotalCrops { get; set; }
    public decimal TotalHarvested { get; set; }
    public decimal TotalAvailableStock { get; set; }
    public int ActiveSalesCount { get; set; }
    public decimal TotalRevenue { get; set; }
    public int PendingOtpCount { get; set; }
    public int UnreadNotificationsCount { get; set; }
    public List<SaleTransactionDto> RecentSales { get; set; } = new();
    public List<CropDto> RecentCrops { get; set; } = new();
    public List<MarketPriceDto> MarketAlerts { get; set; } = new();
}

public class VerifyOtpRequestDto
{
    public string OtpCode { get; set; } = string.Empty;
}

public class RejectOtpRequestDto
{
    public string Reason { get; set; } = "Transaction rejected by user";
}

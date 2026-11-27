using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace AgriPurchaseBilling.Application.DTOs
{
    public class MiddlemanDashboardResponseDto
    {
        [JsonPropertyName("totalMiddlemen")]
        public long TotalMiddlemen { get; set; } = 7;

        [JsonPropertyName("activeMiddlemen")]
        public long ActiveMiddlemen { get; set; } = 7;

        [JsonPropertyName("inactiveMiddlemen")]
        public long InactiveMiddlemen { get; set; } = 0;

        [JsonPropertyName("profile")]
        public DashboardMiddlemanProfileDto Profile { get; set; } = new();

        [JsonPropertyName("activeProfile")]
        public DashboardMiddlemanProfileDto ActiveProfile { get; set; } = new();

        [JsonPropertyName("dashboardMetrics")]
        public MiddlemanDashboardMetricsDto DashboardMetrics { get; set; } = new();

        [JsonPropertyName("metrics")]
        public MiddlemanDashboardMetricsDto Metrics { get; set; } = new();

        [JsonPropertyName("kpiMetrics")]
        public DashboardKpisDto KpiMetrics { get; set; } = new();

        [JsonPropertyName("purchaseVsSalesComparison")]
        public List<MonthlyPurchaseVsSalesDto> PurchaseVsSalesComparison { get; set; } = new();

        [JsonPropertyName("cropwiseInventory")]
        public List<CropwiseInventoryItemDto> CropwiseInventory { get; set; } = new();

        [JsonPropertyName("pendingConfirmations")]
        public List<DashboardPendingConfirmationDto> PendingConfirmations { get; set; } = new();

        [JsonPropertyName("recentTransactions")]
        public List<DashboardRecentTransactionDto> RecentTransactions { get; set; } = new();

        [JsonPropertyName("purchases")]
        public List<DashboardRecentTransactionDto> Purchases { get; set; } = new();

        [JsonPropertyName("vendorSales")]
        public List<DashboardRecentTransactionDto> VendorSales { get; set; } = new();

        [JsonPropertyName("customerSales")]
        public List<DashboardRecentTransactionDto> CustomerSales { get; set; } = new();
    }

    public class DashboardMiddlemanProfileDto
    {
        [JsonPropertyName("id")]
        public long Id { get; set; } = 57;

        [JsonPropertyName("userId")]
        public long UserId { get; set; } = 57;

        [JsonPropertyName("middlemanId")]
        public string MiddlemanId { get; set; } = "MID-0057";

        [JsonPropertyName("middlemenCode")]
        public string MiddlemenCode { get; set; } = "MID-0057";

        [JsonPropertyName("businessName")]
        public string BusinessName { get; set; } = "K Forms";

        [JsonPropertyName("registeredBusinessName")]
        public string RegisteredBusinessName { get; set; } = "K Forms";

        [JsonPropertyName("ownerName")]
        public string OwnerName { get; set; } = "K Srinivas Reddy";

        [JsonPropertyName("fullName")]
        public string FullName { get; set; } = "K Srinivas Reddy";

        [JsonPropertyName("email")]
        public string Email { get; set; } = "ksreddy.traders@gmail.com";

        [JsonPropertyName("mobile")]
        public string Mobile { get; set; } = "9848012345";

        [JsonPropertyName("role")]
        public string Role { get; set; } = "Middleman";

        [JsonPropertyName("isActive")]
        public bool IsActive { get; set; } = true;

        [JsonPropertyName("gstin")]
        public string Gstin { get; set; } = "36AAAAA0000A1Z5";

        [JsonPropertyName("district")]
        public string District { get; set; } = "Kurnool";

        [JsonPropertyName("state")]
        public string State { get; set; } = "Andhra Pradesh";
    }

    public class MiddlemanDashboardMetricsDto
    {
        // 5 Primary Metrics (Carousel Slide 1/2)
        [JsonPropertyName("totalFarmers")]
        public int TotalFarmers { get; set; } = 6;

        [JsonPropertyName("totalVendors")]
        public int TotalVendors { get; set; } = 5;

        [JsonPropertyName("totalCustomers")]
        public int TotalCustomers { get; set; } = 4;

        [JsonPropertyName("totalPurchasesCount")]
        public int TotalPurchasesCount { get; set; } = 6;

        [JsonPropertyName("totalSalesCount")]
        public int TotalSalesCount { get; set; } = 7;

        // 5 Additional Metrics (Carousel Slide 2/2)
        [JsonPropertyName("availableInventory")]
        public decimal AvailableInventory { get; set; } = 250m;

        [JsonPropertyName("availableInventoryUnits")]
        public decimal AvailableInventoryUnits { get; set; } = 250m;

        [JsonPropertyName("totalAvailableInventory")]
        public decimal TotalAvailableInventory { get; set; } = 250m;

        [JsonPropertyName("totalPurchaseValue")]
        public decimal TotalPurchaseValue { get; set; } = 4635000m;

        [JsonPropertyName("totalSalesValue")]
        public decimal TotalSalesValue { get; set; } = 3452750m;

        [JsonPropertyName("expectedReceivables")]
        public decimal ExpectedReceivables { get; set; } = 1195000m;

        [JsonPropertyName("expectedPayables")]
        public decimal ExpectedPayables { get; set; } = 475000m;

        // Financial & Settlement Summary
        [JsonPropertyName("amountReceived")]
        public decimal AmountReceived { get; set; } = 2257750m;

        [JsonPropertyName("amountPaid")]
        public decimal AmountPaid { get; set; } = 4160000m;

        [JsonPropertyName("totalCogs")]
        public decimal TotalCogs { get; set; } = 2270500m;

        [JsonPropertyName("grossProfit")]
        public decimal GrossProfit { get; set; } = 1182250m;

        [JsonPropertyName("marginPercentage")]
        public decimal MarginPercentage { get; set; } = 22.0m;

        [JsonPropertyName("profitMargin")]
        public decimal ProfitMargin { get; set; } = 22.0m;

        [JsonPropertyName("netOutstanding")]
        public decimal NetOutstanding { get; set; } = 720000m;

        [JsonPropertyName("pendingConfirmationsCount")]
        public int PendingConfirmationsCount { get; set; } = 3;

        [JsonPropertyName("unreadNotificationsCount")]
        public int UnreadNotificationsCount { get; set; } = 4;

        // Aliases for compatibility
        [JsonPropertyName("activeFarmersCount")]
        public int ActiveFarmersCount { get; set; } = 6;

        [JsonPropertyName("activeVendorsCount")]
        public int ActiveVendorsCount { get; set; } = 5;

        [JsonPropertyName("activeCustomersCount")]
        public int ActiveCustomersCount { get; set; } = 4;

        [JsonPropertyName("totalStockQuantity")]
        public decimal TotalStockQuantity { get; set; } = 250m;

        [JsonPropertyName("cropInventory")]
        public List<CropInventoryMetricDto> CropInventory { get; set; } = new();

        [JsonPropertyName("recentTransactions")]
        public List<DashboardRecentTransactionDto> RecentTransactions { get; set; } = new();

        [JsonPropertyName("purchases")]
        public List<DashboardRecentTransactionDto> Purchases { get; set; } = new();

        [JsonPropertyName("vendorSales")]
        public List<DashboardRecentTransactionDto> VendorSales { get; set; } = new();

        [JsonPropertyName("customerSales")]
        public List<DashboardRecentTransactionDto> CustomerSales { get; set; } = new();

        [JsonPropertyName("pendingConfirmations")]
        public List<DashboardPendingConfirmationDto> PendingConfirmations { get; set; } = new();
    }

    public class DashboardKpiCardDto
    {
        [JsonPropertyName("id")]
        public string Id { get; set; } = string.Empty;

        [JsonPropertyName("title")]
        public string Title { get; set; } = string.Empty;

        [JsonPropertyName("value")]
        public string Value { get; set; } = string.Empty;

        [JsonPropertyName("rawValue")]
        public decimal RawValue { get; set; }

        [JsonPropertyName("description")]
        public string Description { get; set; } = string.Empty;

        [JsonPropertyName("trendValue")]
        public string TrendValue { get; set; } = string.Empty;

        [JsonPropertyName("isPositiveTrend")]
        public bool IsPositiveTrend { get; set; } = true;

        [JsonPropertyName("tag")]
        public string Tag { get; set; } = string.Empty;

        [JsonPropertyName("badge")]
        public string Badge { get; set; } = string.Empty;

        [JsonPropertyName("route")]
        public string Route { get; set; } = string.Empty;
    }

    public class DashboardKpisDto
    {
        [JsonPropertyName("primaryCards")]
        public List<DashboardKpiCardDto> PrimaryCards { get; set; } = new();

        [JsonPropertyName("additionalCards")]
        public List<DashboardKpiCardDto> AdditionalCards { get; set; } = new();
    }

    public class MonthlyPurchaseVsSalesDto
    {
        [JsonPropertyName("month")]
        public string Month { get; set; } = string.Empty;

        [JsonPropertyName("monthKey")]
        public string MonthKey { get; set; } = string.Empty;

        [JsonPropertyName("monthLabel")]
        public string MonthLabel { get; set; } = string.Empty;

        [JsonPropertyName("purchases")]
        public decimal Purchases { get; set; }

        [JsonPropertyName("farmerPurchases")]
        public decimal FarmerPurchases { get; set; }

        [JsonPropertyName("vendorSales")]
        public decimal VendorSales { get; set; }

        [JsonPropertyName("customerSales")]
        public decimal CustomerSales { get; set; }

        [JsonPropertyName("totalSales")]
        public decimal TotalSales { get; set; }

        [JsonPropertyName("transactionCount")]
        public int TransactionCount { get; set; }
    }

    public class CropwiseInventoryItemDto
    {
        [JsonPropertyName("id")]
        public long Id { get; set; }

        [JsonPropertyName("stockId")]
        public string StockId { get; set; } = string.Empty;

        [JsonPropertyName("cropName")]
        public string CropName { get; set; } = string.Empty;

        [JsonPropertyName("crop")]
        public string Crop => CropName;

        [JsonPropertyName("variety")]
        public string Variety { get; set; } = "Standard";

        [JsonPropertyName("unit")]
        public string Unit { get; set; } = "Quintal";

        [JsonPropertyName("availableStock")]
        public decimal AvailableStock { get; set; }

        [JsonPropertyName("availableQuantity")]
        public decimal AvailableQuantity { get; set; }

        [JsonPropertyName("available")]
        public decimal Available => AvailableStock;

        [JsonPropertyName("purchasedQuantity")]
        public decimal PurchasedQuantity { get; set; }

        [JsonPropertyName("soldQuantity")]
        public decimal SoldQuantity { get; set; }

        [JsonPropertyName("stockQuantity")]
        public decimal StockQuantity { get; set; }

        [JsonPropertyName("averageCost")]
        public decimal AverageCost { get; set; }

        [JsonPropertyName("pricePerKg")]
        public decimal PricePerKg { get; set; }

        [JsonPropertyName("quality")]
        public string Quality { get; set; } = "Grade A";

        [JsonPropertyName("status")]
        public string Status { get; set; } = "In Stock";

        [JsonPropertyName("color")]
        public string Color { get; set; } = "#0F766E";

        [JsonPropertyName("totalValue")]
        public decimal TotalValue { get; set; }
    }

    public class CropInventoryMetricDto
    {
        [JsonPropertyName("cropName")]
        public string CropName { get; set; } = string.Empty;

        [JsonPropertyName("availableQuantity")]
        public decimal AvailableQuantity { get; set; }

        [JsonPropertyName("unit")]
        public string Unit { get; set; } = "Quintal";

        [JsonPropertyName("totalValue")]
        public decimal TotalValue { get; set; }
    }

    public class DashboardPendingConfirmationDto
    {
        [JsonPropertyName("id")]
        public long Id { get; set; }

        [JsonPropertyName("confirmationId")]
        public string ConfirmationId { get; set; } = string.Empty;

        [JsonPropertyName("confirmationCode")]
        public string ConfirmationCode { get; set; } = string.Empty;

        [JsonPropertyName("transactionId")]
        public string TransactionId { get; set; } = string.Empty;

        [JsonPropertyName("transactionReference")]
        public string TransactionReference { get; set; } = string.Empty;

        [JsonPropertyName("transactionType")]
        public string TransactionType { get; set; } = string.Empty;

        [JsonPropertyName("partyType")]
        public string PartyType { get; set; } = string.Empty;

        [JsonPropertyName("partyId")]
        public string PartyId { get; set; } = string.Empty;

        [JsonPropertyName("partyName")]
        public string PartyName { get; set; } = string.Empty;

        [JsonPropertyName("partyMobile")]
        public string PartyMobile { get; set; } = string.Empty;

        [JsonPropertyName("crop")]
        public string Crop { get; set; } = string.Empty;

        [JsonPropertyName("cropName")]
        public string CropName { get; set; } = string.Empty;

        [JsonPropertyName("productName")]
        public string ProductName { get; set; } = string.Empty;

        [JsonPropertyName("variety")]
        public string Variety { get; set; } = "Standard";

        [JsonPropertyName("quantity")]
        public decimal Quantity { get; set; }

        [JsonPropertyName("unit")]
        public string Unit { get; set; } = "Quintal";

        [JsonPropertyName("pricePerUnit")]
        public decimal PricePerUnit { get; set; }

        [JsonPropertyName("rate")]
        public decimal Rate { get; set; }

        [JsonPropertyName("transactionAmount")]
        public decimal TransactionAmount { get; set; }

        [JsonPropertyName("amount")]
        public decimal Amount { get; set; }

        [JsonPropertyName("otpStatus")]
        public string OtpStatus { get; set; } = "Pending";

        [JsonPropertyName("orderStatus")]
        public string OrderStatus { get; set; } = "Pending OTP";

        [JsonPropertyName("status")]
        public string Status { get; set; } = "Pending OTP";

        [JsonPropertyName("requestDate")]
        public string RequestDate { get; set; } = string.Empty;

        [JsonPropertyName("transactionDate")]
        public DateTime TransactionDate { get; set; }

        [JsonPropertyName("expectedPaymentDate")]
        public string ExpectedPaymentDate { get; set; } = string.Empty;

        [JsonPropertyName("notes")]
        public string Notes { get; set; } = string.Empty;
    }

    public class DashboardRecentTransactionDto
    {
        [JsonPropertyName("id")]
        public long Id { get; set; }

        [JsonPropertyName("txnId")]
        public string TxnId { get; set; } = string.Empty;

        [JsonPropertyName("saleId")]
        public string? SaleId { get; set; }

        [JsonPropertyName("purchaseId")]
        public string? PurchaseId { get; set; }

        [JsonPropertyName("transactionId")]
        public string TransactionId { get; set; } = string.Empty;

        [JsonPropertyName("transactionReference")]
        public string TransactionReference { get; set; } = string.Empty;

        [JsonPropertyName("date")]
        public string Date { get; set; } = string.Empty;

        [JsonPropertyName("salesDate")]
        public DateTime? SalesDate { get; set; }

        [JsonPropertyName("purchaseDate")]
        public DateTime? PurchaseDate { get; set; }

        [JsonPropertyName("transactionDate")]
        public DateTime TransactionDate { get; set; }

        [JsonPropertyName("type")]
        public string Type { get; set; } = string.Empty;

        [JsonPropertyName("transactionType")]
        public string TransactionType { get; set; } = string.Empty;

        [JsonPropertyName("partyName")]
        public string PartyName { get; set; } = string.Empty;

        [JsonPropertyName("farmerName")]
        public string? FarmerName { get; set; }

        [JsonPropertyName("vendorName")]
        public string? VendorName { get; set; }

        [JsonPropertyName("customerName")]
        public string? CustomerName { get; set; }

        [JsonPropertyName("businessName")]
        public string? BusinessName { get; set; }

        [JsonPropertyName("crop")]
        public string Crop { get; set; } = string.Empty;

        [JsonPropertyName("cropName")]
        public string CropName { get; set; } = string.Empty;

        [JsonPropertyName("productName")]
        public string ProductName { get; set; } = string.Empty;

        [JsonPropertyName("variety")]
        public string Variety { get; set; } = "Standard";

        [JsonPropertyName("quantity")]
        public decimal Quantity { get; set; }

        [JsonPropertyName("unit")]
        public string Unit { get; set; } = "Quintal";

        [JsonPropertyName("rate")]
        public decimal Rate { get; set; }

        [JsonPropertyName("totalAmount")]
        public decimal TotalAmount { get; set; }

        [JsonPropertyName("finalAmount")]
        public decimal FinalAmount { get; set; }

        [JsonPropertyName("amount")]
        public decimal Amount { get; set; }

        [JsonPropertyName("otpStatus")]
        public string OtpStatus { get; set; } = "Verified";

        [JsonPropertyName("paymentDue")]
        public string PaymentDue { get; set; } = string.Empty;

        [JsonPropertyName("expectedPaymentDate")]
        public DateTime? ExpectedPaymentDate { get; set; }

        [JsonPropertyName("status")]
        public string Status { get; set; } = "Completed";

        [JsonPropertyName("orderStatus")]
        public string OrderStatus { get; set; } = "Completed";

        [JsonPropertyName("action")]
        public string Action { get; set; } = "View";

        [JsonPropertyName("paidAmount")]
        public decimal PaidAmount { get; set; }

        [JsonPropertyName("outstandingAmount")]
        public decimal OutstandingAmount { get; set; }

        [JsonPropertyName("paymentStatus")]
        public string PaymentStatus { get; set; } = "Unpaid";

        [JsonPropertyName("paymentHistory")]
        public List<MiddlemanPaymentDto> PaymentHistory { get; set; } = new();
    }

    public class RecentTransactionDto
    {
        [JsonPropertyName("transactionId")]
        public string TransactionId { get; set; } = string.Empty;

        [JsonPropertyName("date")]
        public string Date { get; set; } = string.Empty;

        [JsonPropertyName("type")]
        public string Type { get; set; } = string.Empty;

        [JsonPropertyName("partyName")]
        public string PartyName { get; set; } = string.Empty;

        [JsonPropertyName("cropName")]
        public string CropName { get; set; } = string.Empty;

        [JsonPropertyName("quantity")]
        public decimal Quantity { get; set; }

        [JsonPropertyName("unit")]
        public string Unit { get; set; } = "Quintal";

        [JsonPropertyName("amount")]
        public decimal Amount { get; set; }

        [JsonPropertyName("status")]
        public string Status { get; set; } = string.Empty;
    }
}

using System;
using System.Collections.Generic;

namespace AgriPurchaseBilling.Application.DTOs.VendorOperations
{
    // ==========================================
    // 1. FARMERS DIRECTORY & PROFILE DTOS
    // ==========================================

    public class VendorFarmersOverviewDto
    {
        public int TotalFarmers { get; set; }
        public int ActiveFarmers { get; set; }
        public int InactiveFarmers { get; set; }
        public int TotalPurchases { get; set; }
        public decimal TotalQuantityProcured { get; set; }
        public string QuantityUnit { get; set; } = "Qtl";
        public decimal TotalPurchaseAmount { get; set; }
        public decimal TotalPayablesDue { get; set; }
    }

    public class VendorFarmerSummaryDto
    {
        public long Id { get; set; }
        public string FarmerCode { get; set; } = string.Empty;
        public string FarmerName { get; set; } = string.Empty;
        public string? FatherOrSpouseName { get; set; }
        public string RegisteredCrops { get; set; } = string.Empty;
        public string MobileNumber { get; set; } = string.Empty;
        public string Village { get; set; } = string.Empty;
        public string District { get; set; } = string.Empty;
        public string State { get; set; } = string.Empty;
        public int TotalPurchases { get; set; }
        public decimal TotalPurchaseQuantity { get; set; }
        public string QuantityUnit { get; set; } = "Qtl";
        public decimal TotalPurchaseAmount { get; set; }
        public decimal DueAmount { get; set; }
        public string Status { get; set; } = "Active";
    }

    public class VendorFarmerDetailDto
    {
        public long Id { get; set; }
        public string FarmerCode { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string? FatherOrSpouseName { get; set; }
        public string MobileNumber { get; set; } = string.Empty;
        public string? Email { get; set; }
        public string Village { get; set; } = string.Empty;
        public string District { get; set; } = string.Empty;
        public string State { get; set; } = string.Empty;
        public string? PinCode { get; set; }
        public decimal LandAcres { get; set; }
        public string RegisteredCrops { get; set; } = string.Empty;
        public string? BankAccountNumber { get; set; }
        public string? IfscCode { get; set; }
        public string? BankName { get; set; }
        public string? AadhaarNumber { get; set; }
        public string Status { get; set; } = "Active";
        public DateTime RegisteredAt { get; set; }

        // KPI metrics for profile header
        public int AssociatedPurchasesCount { get; set; }
        public decimal AssociatedPurchasesQuantity { get; set; }
        public int ConfirmedPurchasesCount { get; set; }
        public int PendingPurchasesCount { get; set; }
        public decimal TotalPurchaseAmount { get; set; }
        public decimal CompletedPayments { get; set; }
        public decimal PendingPayments { get; set; }

        public List<VendorFarmerTransactionDto> Transactions { get; set; } = new();
        public List<VendorFarmerPaymentDto> Payments { get; set; } = new();
        public List<VendorFarmerOtpLogDto> OtpLogs { get; set; } = new();
    }

    public class CreateVendorFarmerRequest
    {
        public required string FullName { get; set; }
        public string? FatherOrSpouseName { get; set; }
        public required string MobileNumber { get; set; }
        public string? Email { get; set; }
        public required string Village { get; set; }
        public required string District { get; set; }
        public required string State { get; set; }
        public string? PinCode { get; set; }
        public decimal LandAcres { get; set; }
        public required string RegisteredCrops { get; set; }
        public string? BankAccountNumber { get; set; }
        public string? IfscCode { get; set; }
        public string? BankName { get; set; }
        public string? AadhaarNumber { get; set; }
    }

    public class UpdateVendorFarmerRequest
    {
        public required string FullName { get; set; }
        public string? FatherOrSpouseName { get; set; }
        public required string MobileNumber { get; set; }
        public string? Email { get; set; }
        public required string Village { get; set; }
        public required string District { get; set; }
        public required string State { get; set; }
        public string? PinCode { get; set; }
        public decimal LandAcres { get; set; }
        public required string RegisteredCrops { get; set; }
        public string? BankAccountNumber { get; set; }
        public string? IfscCode { get; set; }
        public string? BankName { get; set; }
        public string? AadhaarNumber { get; set; }
        public string? Status { get; set; }
    }

    public class VendorFarmerTransactionDto
    {
        public long Id { get; set; }
        public string PurchaseCode { get; set; } = string.Empty;
        public string BillNumber { get; set; } = string.Empty;
        public string CropName { get; set; } = string.Empty;
        public string CropVariety { get; set; } = string.Empty;
        public decimal Quantity { get; set; }
        public string Unit { get; set; } = "Quintal";
        public decimal RatePerUnit { get; set; }
        public decimal TotalAmount { get; set; }
        public decimal DueAmount { get; set; }
        public string PaymentStatus { get; set; } = "Pending";
        public DateTime PurchaseDate { get; set; }
    }

    public class VendorFarmerPaymentDto
    {
        public long Id { get; set; }
        public string PaymentCode { get; set; } = string.Empty;
        public string VoucherNumber { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public string PaymentMethod { get; set; } = "Bank Transfer";
        public DateTime PaymentDate { get; set; }
        public string? ReferenceNumber { get; set; }
        public string Status { get; set; } = "Completed";
        public string? Notes { get; set; }
    }

    public class VendorFarmerOtpLogDto
    {
        public long Id { get; set; }
        public string OtpCode { get; set; } = string.Empty;
        public string Purpose { get; set; } = string.Empty;
        public string ActionDetails { get; set; } = string.Empty;
        public string Status { get; set; } = "Verified";
        public DateTime? VerifiedAt { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    // ==========================================
    // 2. MIDDLEMEN DIRECTORY & PROFILE DTOS
    // ==========================================

    public class VendorMiddlemenOverviewDto
    {
        public int TotalMiddlemen { get; set; }
        public int ActiveMiddlemen { get; set; }
        public int InactiveMiddlemen { get; set; }
        public int TotalTransactions { get; set; }
        public decimal TotalQuantityProcured { get; set; }
        public string QuantityUnit { get; set; } = "Qtl";
        public decimal TotalTransactionAmount { get; set; }
        public decimal TotalPayablesDue { get; set; }
    }

    public class VendorMiddlemanSummaryDto
    {
        public long Id { get; set; }
        public string MiddlemanCode { get; set; } = string.Empty;
        public string MiddlemanName { get; set; } = string.Empty;
        public string? Email { get; set; }
        public string MobileNumber { get; set; } = string.Empty;
        public string BusinessName { get; set; } = string.Empty;
        public string Gstin { get; set; } = string.Empty;
        public string MarketYardLocation { get; set; } = string.Empty;
        public string District { get; set; } = string.Empty;
        public string State { get; set; } = string.Empty;
        public int TotalTransactions { get; set; }
        public decimal TotalTransactionQuantity { get; set; }
        public string QuantityUnit { get; set; } = "Qtl";
        public decimal TotalTransactionAmount { get; set; }
        public decimal DueAmount { get; set; }
        public string Status { get; set; } = "Active";
    }

    public class VendorMiddlemanDetailDto
    {
        public long Id { get; set; }
        public string MiddlemanCode { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string? Email { get; set; }
        public string MobileNumber { get; set; } = string.Empty;
        public string BusinessName { get; set; } = string.Empty;
        public string Gstin { get; set; } = string.Empty;
        public string Pan { get; set; } = string.Empty;
        public string MarketYardLocation { get; set; } = string.Empty;
        public string District { get; set; } = string.Empty;
        public string State { get; set; } = string.Empty;
        public string? PinCode { get; set; }
        public decimal OpeningBalance { get; set; }
        public string Status { get; set; } = "Active";
        public DateTime RegisteredAt { get; set; }

        // KPI metrics
        public int TotalTransactionsCount { get; set; }
        public decimal TotalTransactionsQuantity { get; set; }
        public decimal TotalTransactionAmount { get; set; }
        public decimal PaymentsSettled { get; set; }
        public decimal OutstandingPayables { get; set; }

        public List<VendorMiddlemanTransactionDto> Transactions { get; set; } = new();
        public List<VendorMiddlemanPaymentDto> Payments { get; set; } = new();
        public List<VendorMiddlemanOtpLogDto> OtpLogs { get; set; } = new();
    }

    public class CreateVendorMiddlemanRequest
    {
        public required string FullName { get; set; }
        public string? Email { get; set; }
        public required string MobileNumber { get; set; }
        public required string BusinessName { get; set; }
        public string? Gstin { get; set; }
        public string? Pan { get; set; }
        public required string MarketYardLocation { get; set; }
        public required string District { get; set; }
        public required string State { get; set; }
        public string? PinCode { get; set; }
        public decimal OpeningBalance { get; set; }
    }

    public class UpdateVendorMiddlemanRequest
    {
        public required string FullName { get; set; }
        public string? Email { get; set; }
        public required string MobileNumber { get; set; }
        public required string BusinessName { get; set; }
        public string? Gstin { get; set; }
        public string? Pan { get; set; }
        public required string MarketYardLocation { get; set; }
        public required string District { get; set; }
        public required string State { get; set; }
        public string? PinCode { get; set; }
        public decimal OpeningBalance { get; set; }
        public string? Status { get; set; }
    }

    public class VendorMiddlemanTransactionDto
    {
        public long Id { get; set; }
        public string PurchaseCode { get; set; } = string.Empty;
        public string BillNumber { get; set; } = string.Empty;
        public string CropName { get; set; } = string.Empty;
        public string CropVariety { get; set; } = string.Empty;
        public decimal Quantity { get; set; }
        public string Unit { get; set; } = "Quintal";
        public decimal RatePerUnit { get; set; }
        public decimal TotalAmount { get; set; }
        public decimal DueAmount { get; set; }
        public string PaymentStatus { get; set; } = "Pending";
        public DateTime PurchaseDate { get; set; }
    }

    public class VendorMiddlemanPaymentDto
    {
        public long Id { get; set; }
        public string PaymentCode { get; set; } = string.Empty;
        public string VoucherNumber { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public string PaymentMethod { get; set; } = "RTGS/NEFT";
        public DateTime PaymentDate { get; set; }
        public string? ReferenceNumber { get; set; }
        public string Status { get; set; } = "Completed";
        public string? Notes { get; set; }
    }

    public class VendorMiddlemanOtpLogDto
    {
        public long Id { get; set; }
        public string OtpCode { get; set; } = string.Empty;
        public string Purpose { get; set; } = string.Empty;
        public string ActionDetails { get; set; } = string.Empty;
        public string Status { get; set; } = "Verified";
        public DateTime? VerifiedAt { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    // ==========================================
    // 3. CUSTOMERS DIRECTORY DTOS
    // ==========================================

    public class VendorCustomersOverviewDto
    {
        public int TotalCustomers { get; set; }
        public int ActiveCustomers { get; set; }
        public int InactiveCustomers { get; set; }
        public int TotalOrders { get; set; }
        public decimal TotalSalesAmount { get; set; }
        public decimal TotalReceivablesDue { get; set; }
    }

    public class VendorCustomerSummaryDto
    {
        public long Id { get; set; }
        public string CustomerCode { get; set; } = string.Empty;
        public string CustomerName { get; set; } = string.Empty;
        public string BusinessName { get; set; } = string.Empty;
        public string CustomerType { get; set; } = "Wholesaler";
        public string MobileNumber { get; set; } = string.Empty;
        public string? Email { get; set; }
        public string Address { get; set; } = string.Empty;
        public string District { get; set; } = string.Empty;
        public string State { get; set; } = string.Empty;
        public int TotalOrders { get; set; }
        public decimal TotalPurchaseQuantity { get; set; }
        public string QuantityUnit { get; set; } = "Quintal";
        public decimal TotalSalesAmount { get; set; }
        public decimal ReceivableAmount { get; set; }
        public string Status { get; set; } = "Active";
    }

    public class VendorCustomerDetailDto : VendorCustomerSummaryDto
    {
        public string? PinCode { get; set; }
        public string? Gstin { get; set; }
        public decimal CreditLimit { get; set; }
        public List<VendorCustomerOrderDto> Orders { get; set; } = new();
    }

    public class VendorCustomerOrderDto
    {
        public long Id { get; set; }
        public string OrderCode { get; set; } = string.Empty;
        public string ProductName { get; set; } = string.Empty;
        public decimal Quantity { get; set; }
        public string Unit { get; set; } = "Quintal";
        public decimal TotalAmount { get; set; }
        public decimal DueAmount { get; set; }
        public string OrderStatus { get; set; } = "Completed";
        public DateTime OrderDate { get; set; }
    }

    public class CreateVendorCustomerRequest
    {
        public required string CustomerName { get; set; }
        public required string BusinessName { get; set; }
        public string CustomerType { get; set; } = "Wholesaler";
        public required string MobileNumber { get; set; }
        public string? Email { get; set; }
        public required string Address { get; set; }
        public required string District { get; set; }
        public required string State { get; set; }
        public string? PinCode { get; set; }
        public string? Gstin { get; set; }
        public decimal CreditLimit { get; set; }
    }

    public class UpdateVendorCustomerRequest
    {
        public required string CustomerName { get; set; }
        public required string BusinessName { get; set; }
        public string CustomerType { get; set; } = "Wholesaler";
        public required string MobileNumber { get; set; }
        public string? Email { get; set; }
        public required string Address { get; set; }
        public required string District { get; set; }
        public required string State { get; set; }
        public string? PinCode { get; set; }
        public string? Gstin { get; set; }
        public decimal CreditLimit { get; set; }
        public string? Status { get; set; }
    }
}

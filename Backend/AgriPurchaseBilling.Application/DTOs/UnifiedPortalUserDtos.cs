using System;
using System.Collections.Generic;

namespace AgriPurchaseBilling.Application.DTOs
{
    public class UnifiedPortalSummaryDto
    {
        public int TotalFarmers { get; set; }
        public int TotalVendors { get; set; }
        public int TotalCustomers { get; set; }
        public int TotalMiddlemen { get; set; }
        public int TotalUsers { get; set; }
    }

    public class UnifiedFarmerItemDto
    {
        public long Id { get; set; }
        public long UserId { get; set; }
        public string FarmerCode { get; set; } = string.Empty;
        public string FarmerId => FarmerCode;
        public string Name { get; set; } = string.Empty;
        public string Mobile { get; set; } = string.Empty;
        public string? Email { get; set; }
        public string Role { get; set; } = "Farmer";
        public string UserType { get; set; } = "Farmer";
        public DateTime RegistrationDate { get; set; }
        public string Status { get; set; } = "Active";
        public string Village { get; set; } = string.Empty;
        public string? Mandal { get; set; }
        public string District { get; set; } = string.Empty;
        public string State { get; set; } = "Andhra Pradesh";
        public string? PinCode { get; set; }
        public string? Address { get; set; }
        public string? TotalLandArea { get; set; }
        public string? SoilType { get; set; }
        public List<string> Crops { get; set; } = new();
        public int TotalPurchases { get; set; }
        public decimal TotalQuantityPurchased { get; set; }
        public decimal TotalPurchaseValue { get; set; }
        public decimal OutstandingPayables { get; set; }
        public int PendingConfirmations { get; set; }
        public string SourcePortal { get; set; } = "Farmer Portal";
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    public class UnifiedVendorItemDto
    {
        public long Id { get; set; }
        public long UserId { get; set; }
        public string VendorCode { get; set; } = string.Empty;
        public string VendorId => VendorCode;
        public string BusinessName { get; set; } = string.Empty;
        public string OwnerName { get; set; } = string.Empty;
        public string Mobile { get; set; } = string.Empty;
        public string? Email { get; set; }
        public string Role { get; set; } = "Vendor";
        public string UserType { get; set; } = "Vendor";
        public DateTime RegistrationDate { get; set; }
        public string Status { get; set; } = "Active";
        public string BusinessType { get; set; } = "Wholesaler";
        public string? GstNumber { get; set; }
        public string? BusinessRegNumber { get; set; }
        public string? Address { get; set; }
        public string District { get; set; } = string.Empty;
        public string State { get; set; } = "Andhra Pradesh";
        public string? PinCode { get; set; }
        public int TotalPurchases { get; set; }
        public decimal TotalPurchaseValue { get; set; }
        public decimal OutstandingReceivables { get; set; }
        public string SourcePortal { get; set; } = "Vendor Portal";
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    public class UnifiedCustomerItemDto
    {
        public long Id { get; set; }
        public long UserId { get; set; }
        public string CustomerCode { get; set; } = string.Empty;
        public string CustomerId => CustomerCode;
        public string Name { get; set; } = string.Empty;
        public string Mobile { get; set; } = string.Empty;
        public string? Email { get; set; }
        public string Role { get; set; } = "Customer";
        public string UserType { get; set; } = "Customer";
        public DateTime RegistrationDate { get; set; }
        public string Status { get; set; } = "Active";
        public string? Address { get; set; }
        public string District { get; set; } = string.Empty;
        public string State { get; set; } = "Andhra Pradesh";
        public string? PinCode { get; set; }
        public string? AlternateMobile { get; set; }
        public int TotalPurchases { get; set; }
        public decimal TotalPurchaseValue { get; set; }
        public decimal OutstandingReceivables { get; set; }
        public string SourcePortal { get; set; } = "Customer Portal";
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    public class UnifiedMiddlemanItemDto
    {
        public long Id { get; set; }
        public long UserId { get; set; }
        public string MiddlemanCode { get; set; } = string.Empty;
        public string MiddlemanPortalId => MiddlemanCode;
        public string BusinessName { get; set; } = string.Empty;
        public string OwnerName { get; set; } = string.Empty;
        public string Mobile { get; set; } = string.Empty;
        public string? Email { get; set; }
        public string Role { get; set; } = "Middleman";
        public string UserType { get; set; } = "Middleman";
        public DateTime RegistrationDate { get; set; }
        public string Status { get; set; } = "Active";
        public string? LicenseNumber { get; set; }
        public string? GstNumber { get; set; }
        public string? Address { get; set; }
        public string? VillageArea { get; set; }
        public string District { get; set; } = string.Empty;
        public string State { get; set; } = "Andhra Pradesh";
        public string? PinCode { get; set; }
        public string? BankName { get; set; }
        public string? AccountNumber { get; set; }
        public string? IfscCode { get; set; }
        public string SourcePortal { get; set; } = "Middleman Portal";
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    public class UnifiedPortalQueryDto
    {
        public string? Search { get; set; }
        public string? District { get; set; } = "ALL";
        public string? State { get; set; } = "ALL";
        public string? Status { get; set; } = "ALL";
        public string? Source { get; set; } = "ALL";
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 10;
    }

    public class UnifiedPagedResultDto<T>
    {
        public List<T> Items { get; set; } = new();
        public int TotalItems { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int TotalPages => PageSize > 0 ? (int)Math.Ceiling((double)TotalItems / PageSize) : 0;
    }

    /// <summary>
    /// Unified representation of a purchase order placed with the Middleman by a Customer or Commercial Vendor.
    /// Strictly contains transactions where the Middleman is the seller.
    /// </summary>
    public class UnifiedMiddlemanBuyerOrderDto
    {
        public long Id { get; set; }
        public string SaleCode { get; set; } = string.Empty;
        public string OrderId { get; set; } = string.Empty;
        public string? TransactionId { get; set; }
        public string BuyerType { get; set; } = "Customer"; // "Customer" or "Vendor"
        public string BuyerId { get; set; } = string.Empty;
        public string BuyerName { get; set; } = string.Empty;
        public string? BuyerMobile { get; set; }
        public string? BusinessName { get; set; }
        public string CropName { get; set; } = string.Empty;
        public string Product { get; set; } = string.Empty;
        public string? Category { get; set; }
        public string Variety { get; set; } = "Standard";
        public string QualityGrade { get; set; } = "Grade A";
        public decimal Quantity { get; set; }
        public string Unit { get; set; } = "Quintal";
        public decimal Rate { get; set; }
        public decimal PricePerUnit { get; set; }
        public decimal Subtotal { get; set; }
        public decimal TotalAmount { get; set; }
        public DateTime SalesDate { get; set; }
        public DateTime OrderDate { get; set; }
        public string Status { get; set; } = "Pending Confirmation";
        public string OrderStatus { get; set; } = "Pending Confirmation";
        public string OtpStatus { get; set; } = "Pending OTP";
        public string? DeliveryLocation { get; set; }
        public string? DeliveryAddress { get; set; }
        public DateTime? ExpectedDeliveryDate { get; set; }
        public DateTime? ExpectedPaymentDate { get; set; }
        public long MiddlemanId { get; set; }
    }

    /// <summary>
    /// Unified representation of a produce purchase made by the Middleman from a Farmer,
    /// or an active farmer produce listing open for Middleman procurement.
    /// Strictly contains transactions where the Middleman is the buyer.
    /// </summary>
    public class UnifiedFarmerPurchaseItemDto
    {
        public long Id { get; set; }
        public string PurchaseCode { get; set; } = string.Empty;
        public string SaleCode => PurchaseCode;
        public string OrderId => PurchaseCode;
        public string? TransactionId => PurchaseCode;
        public long FarmerUserId { get; set; }
        public string FarmerId { get; set; } = string.Empty;
        public string FarmerName { get; set; } = string.Empty;
        public string? FarmerMobile { get; set; }
        public string CropName { get; set; } = string.Empty;
        public string Product => CropName;
        public string Variety { get; set; } = "Standard";
        public string CropVariety => Variety;
        public string QualityGrade { get; set; } = "Grade A";
        public decimal Quantity { get; set; }
        public decimal SellingQuantity => Quantity;
        public string Unit { get; set; } = "Quintal";
        public decimal Rate { get; set; }
        public decimal PricePerUnit => Rate;
        public decimal Subtotal { get; set; }
        public decimal TransportationCharges { get; set; }
        public decimal TotalAmount { get; set; }
        public DateTime PurchaseDate { get; set; }
        public DateTime CreatedAt => PurchaseDate;
        public DateTime? ExpectedPaymentDate { get; set; }
        public DateTime? DeliveryDate { get; set; }
        public DateTime? ExpectedPickupDate => DeliveryDate;
        public string? PickupLocation { get; set; }
        public string Status { get; set; } = "Completed";
        public string? PaymentStatus { get; set; } = "Unpaid";
        public string? OtpStatus { get; set; } = "Confirmed";
        public string? Notes { get; set; }
        public string BuyerCategory { get; set; } = "Middleman";
        public string BuyerName { get; set; } = string.Empty;
        public string BuyerMobile { get; set; } = string.Empty;
        public long MiddlemanId { get; set; }
        public string Source { get; set; } = "Middleman Direct Purchase";
    }
}

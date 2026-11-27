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
}

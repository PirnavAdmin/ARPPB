using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace AgriPurchaseBilling.Application.DTOs.VendorPortal
{
    public sealed class VendorPurchasesSummaryDto
    {
        public long TotalPurchases { get; set; }
        public long FarmerPurchaseCount { get; set; }
        public decimal FarmerPurchaseQuantity { get; set; }
        public decimal FarmerPurchaseAmount { get; set; }
        public decimal FarmerDueAmount { get; set; }

        public long MiddlemanPurchaseCount { get; set; }
        public decimal MiddlemanPurchaseQuantity { get; set; }
        public decimal MiddlemanPurchaseAmount { get; set; }
        public decimal MiddlemanDueAmount { get; set; }

        public decimal TotalQuantityProcured => FarmerPurchaseQuantity + MiddlemanPurchaseQuantity;
        public decimal TotalPurchaseAmount => FarmerPurchaseAmount + MiddlemanPurchaseAmount;
        public decimal TotalDueAmount => FarmerDueAmount + MiddlemanDueAmount;
    }

    public sealed class VendorPurchaseItemDto
    {
        public long Id { get; set; }
        public string PurchaseCode { get; set; } = string.Empty;
        public string SupplierCategory { get; set; } = "Farmer"; // "Farmer" or "Middleman"
        public long SupplierId { get; set; }
        public string SupplierCode { get; set; } = string.Empty;
        public string SupplierName { get; set; } = string.Empty;
        public string SupplierBusinessName { get; set; } = string.Empty;
        public string MobileNumber { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Gstin { get; set; } = string.Empty;
        public string VillageOrMarket { get; set; } = string.Empty;
        public string District { get; set; } = string.Empty;
        public string State { get; set; } = string.Empty;
        public string BillNumber { get; set; } = string.Empty;
        public string CropName { get; set; } = string.Empty;
        public string CropVariety { get; set; } = string.Empty;
        public decimal Quantity { get; set; }
        public string Unit { get; set; } = "Quintal";
        public decimal RatePerUnit { get; set; }
        public decimal TotalAmount { get; set; }
        public decimal DueAmount { get; set; }
        public decimal PaidAmount { get; set; }
        public string PaymentStatus { get; set; } = "Pending";
        public DateTime PurchaseDate { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public sealed class PurchasesQuery
    {
        public string? SupplierCategory { get; set; } = "All"; // All, Farmer, Middleman
        public string? PaymentStatus { get; set; } = "All"; // All, Pending, Paid, Partial
        public string? Crop { get; set; }
        public string? Search { get; set; }
        public DateTime? FromDate { get; set; }
        public DateTime? ToDate { get; set; }
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 20;
    }

    public sealed class CreateVendorPurchaseRequest
    {
        [Required]
        public string SupplierCategory { get; set; } = "Farmer"; // Farmer or Middleman

        [Required]
        public long SupplierId { get; set; }

        public string? PurchaseCode { get; set; }
        public string? BillNumber { get; set; }

        [Required]
        public string CropName { get; set; } = string.Empty;

        public string CropVariety { get; set; } = "Standard";

        [Range(0.01, double.MaxValue, ErrorMessage = "Quantity must be greater than zero.")]
        public decimal Quantity { get; set; }

        public string Unit { get; set; } = "Quintal";

        [Range(0.01, double.MaxValue, ErrorMessage = "Rate per unit must be greater than zero.")]
        public decimal RatePerUnit { get; set; }

        public decimal TotalAmount { get; set; }
        public decimal DueAmount { get; set; }
        public string PaymentStatus { get; set; } = "Pending";
        public DateTime? PurchaseDate { get; set; }
    }

    public sealed class UpdateVendorPurchaseStatusRequest
    {
        public string? PaymentStatus { get; set; }
        public decimal? DueAmount { get; set; }
    }
}

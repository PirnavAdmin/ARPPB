using System;
using System.Collections.Generic;

namespace AgriPurchaseBilling.Domain.Entities.VendorOperations
{
    public class VendorRawMaterialStock
    {
        public long Id { get; set; }
        public long VendorId { get; set; } = 1;
        public string StockCode { get; set; } = string.Empty;
        public string CropName { get; set; } = string.Empty;
        public string CropVariety { get; set; } = string.Empty;
        public string SupplierName { get; set; } = string.Empty;
        public string SupplierCategory { get; set; } = "Farmer";
        public string PurchaseId { get; set; } = string.Empty;
        public string BatchNumber { get; set; } = string.Empty;
        public DateTime PurchaseDate { get; set; }
        public decimal PurchasedQuantity { get; set; }
        public decimal ProcessedQuantity { get; set; }
        public decimal AvailableQuantity { get; set; }
        public string Unit { get; set; } = "Quintal";
        public decimal AverageCost { get; set; }
        public string QualityGrade { get; set; } = "Grade A (Standard FAQ)";
        public string Status { get; set; } = "In Stock";
        public decimal MinThresholdQuantity { get; set; } = 15;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public ICollection<VendorStockMovement> Movements { get; set; } = new List<VendorStockMovement>();
    }

    public class VendorStockMovement
    {
        public long Id { get; set; }
        public long StockId { get; set; }
        public string MovementCode { get; set; } = string.Empty;
        public DateTime MovementDate { get; set; }
        public string BatchNumber { get; set; } = string.Empty;
        public string CropName { get; set; } = string.Empty;
        public string MovementType { get; set; } = string.Empty;
        public string ReferenceId { get; set; } = string.Empty;
        public decimal QuantityChange { get; set; }
        public string Unit { get; set; } = "Quintal";
        public decimal BalanceAfter { get; set; }
        public string Remarks { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public VendorRawMaterialStock? Stock { get; set; }
    }

    public class VendorProcessingBatch
    {
        public long Id { get; set; }
        public long VendorId { get; set; } = 1;
        public string ProcessingCode { get; set; } = string.Empty;
        public string BatchNumber { get; set; } = string.Empty;
        public string RawMaterialName { get; set; } = string.Empty;
        public string SourceStockId { get; set; } = string.Empty;
        public decimal InputQuantity { get; set; }
        public string Unit { get; set; } = "Quintal";
        public decimal WastageQuantity { get; set; }
        public decimal WastagePercentage { get; set; }
        public decimal ProcessingExpenses { get; set; }
        public decimal TotalBatchCost { get; set; }
        public decimal UnitCost { get; set; }
        public string UnitCostLabel { get; set; } = "₹/Quintal";
        public string Status { get; set; } = "Completed";
        public DateTime ProcessingDate { get; set; }
        public string? Notes { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public ICollection<VendorProcessingOutput> Outputs { get; set; } = new List<VendorProcessingOutput>();
    }

    public class VendorProcessingOutput
    {
        public long Id { get; set; }
        public long ProcessingBatchId { get; set; }
        public string OutputProductName { get; set; } = string.Empty;
        public decimal OutputQuantity { get; set; }
        public string Unit { get; set; } = "Quintal";
        public string OutputType { get; set; } = "Main Product";
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public VendorProcessingBatch? ProcessingBatch { get; set; }
    }

    public class VendorFinishedProduct
    {
        public long Id { get; set; }
        public long VendorId { get; set; } = 1;
        public string ProductCode { get; set; } = string.Empty;
        public string ProductName { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public string SourceRawMaterial { get; set; } = string.Empty;
        public string BrandName { get; set; } = string.Empty;
        public string Packaging { get; set; } = string.Empty;
        public decimal AvailableQuantity { get; set; }
        public decimal SoldQuantity { get; set; }
        public string Unit { get; set; } = "Quintal";
        public DateTime MfgDate { get; set; }
        public DateTime ExpiryDate { get; set; }
        public decimal ProductionCost { get; set; }
        public decimal SellingPrice { get; set; }
        public decimal ProfitMarginPercentage { get; set; }
        public decimal MinThresholdQuantity { get; set; } = 10;
        public string Status { get; set; } = "Active";
        public string? ImageUrl { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public ICollection<VendorFinishedProductMovement> Movements { get; set; } = new List<VendorFinishedProductMovement>();
    }

    public class VendorFinishedProductMovement
    {
        public long Id { get; set; }
        public long FinishedProductId { get; set; }
        public string MovementCode { get; set; } = string.Empty;
        public string MovementType { get; set; } = string.Empty;
        public string ReferenceId { get; set; } = string.Empty;
        public decimal QuantityChange { get; set; }
        public string Unit { get; set; } = "Quintal";
        public decimal BalanceAfter { get; set; }
        public DateTime MovementDate { get; set; }
        public string Remarks { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public VendorFinishedProduct? FinishedProduct { get; set; }
    }
}

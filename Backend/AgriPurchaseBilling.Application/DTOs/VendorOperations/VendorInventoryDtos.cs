using System;
using System.Collections.Generic;

namespace AgriPurchaseBilling.Application.DTOs.VendorOperations
{
    // ==========================================
    // 1. RAW MATERIAL INVENTORY DTOS
    // ==========================================

    public class VendorRawMaterialOverviewDto
    {
        public decimal TotalStockQuantity { get; set; }
        public string StockUnit { get; set; } = "Qtl";
        public int TotalTraceableBatches { get; set; }
        public decimal AvailableQuantity { get; set; }
        public decimal ValuationAmount { get; set; }
        public decimal ProcessedQuantity { get; set; }
        public int LowStockItemsCount { get; set; }
        public List<LowStockAlertDto> LowStockAlerts { get; set; } = new();
    }

    public class LowStockAlertDto
    {
        public string StockId { get; set; } = string.Empty;
        public string CropName { get; set; } = string.Empty;
        public string BatchNumber { get; set; } = string.Empty;
        public decimal QuantityLeft { get; set; }
        public string Unit { get; set; } = "Quintal";
    }

    public class VendorRawMaterialStockDto
    {
        public long Id { get; set; }
        public string StockId { get; set; } = string.Empty;
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
    }

    public class CreateRawMaterialStockRequest
    {
        public string CropName { get; set; } = string.Empty;
        public string? CropVariety { get; set; }
        public string SupplierName { get; set; } = string.Empty;
        public string? SupplierCategory { get; set; } = "Farmer";
        public string? PurchaseId { get; set; }
        public string? BatchNumber { get; set; }
        public DateTime? PurchaseDate { get; set; }
        public decimal PurchasedQuantity { get; set; }
        public string? Unit { get; set; } = "Quintal";
        public decimal AverageCost { get; set; }
        public string? QualityGrade { get; set; } = "Grade A (Standard FAQ)";
        public decimal? MinThresholdQuantity { get; set; } = 15;
    }

    public class VendorStockMovementDto
    {
        public long Id { get; set; }
        public string MovementId { get; set; } = string.Empty;
        public DateTime MovementDate { get; set; }
        public string BatchNumber { get; set; } = string.Empty;
        public string CropName { get; set; } = string.Empty;
        public string MovementType { get; set; } = string.Empty;
        public string ReferenceId { get; set; } = string.Empty;
        public decimal QuantityChange { get; set; }
        public string Unit { get; set; } = "Quintal";
        public decimal BalanceAfter { get; set; }
        public string Remarks { get; set; } = string.Empty;
    }

    // ==========================================
    // 2. PRODUCT PROCESSING DTOS
    // ==========================================

    public class VendorProcessingOverviewDto
    {
        public int TotalBatches { get; set; }
        public int DraftProcessingCount { get; set; }
        public int CompletedBatchesCount { get; set; }
        public decimal TotalInputQuantity { get; set; }
        public string InputUnit { get; set; } = "Qtl";
        public decimal TotalOutputQuantity { get; set; }
        public decimal TotalWastageQuantity { get; set; }
        public string WastageUnit { get; set; } = "Qtl";
        public decimal TotalProcessingExpenses { get; set; }
    }

    public class VendorProcessingBatchDto
    {
        public long Id { get; set; }
        public string ProcessingId { get; set; } = string.Empty;
        public DateTime ProcessingDate { get; set; }
        public string RawMaterialAndBatch { get; set; } = string.Empty;
        public string RawMaterialName { get; set; } = string.Empty;
        public string SourceStockId { get; set; } = string.Empty;
        public decimal InputQuantity { get; set; }
        public string InputUnit { get; set; } = "Quintal";
        public string FinishedOutputsSummary { get; set; } = string.Empty;
        public decimal WastageQuantity { get; set; }
        public decimal WastagePercentage { get; set; }
        public decimal ProcessingExpenses { get; set; }
        public decimal TotalBatchCost { get; set; }
        public decimal UnitCost { get; set; }
        public string UnitCostLabel { get; set; } = "₹/Quintal";
        public string Status { get; set; } = "Completed";
        public string? Notes { get; set; }
        public List<VendorProcessingOutputDto> Outputs { get; set; } = new();
    }

    public class VendorProcessingOutputDto
    {
        public long Id { get; set; }
        public string OutputProductName { get; set; } = string.Empty;
        public decimal OutputQuantity { get; set; }
        public string Unit { get; set; } = "Quintal";
        public string OutputType { get; set; } = "Main Product";
    }

    public class CreateProcessingBatchRequest
    {
        public required string RawMaterialName { get; set; }
        public required string SourceStockId { get; set; }
        public decimal InputQuantity { get; set; }
        public string Unit { get; set; } = "Quintal";
        public decimal ProcessingExpenses { get; set; }
        public string? Notes { get; set; }
        public List<ProcessingOutputItemRequest> Outputs { get; set; } = new();
    }

    public class ProcessingOutputItemRequest
    {
        public required string OutputProductName { get; set; }
        public decimal OutputQuantity { get; set; }
        public string Unit { get; set; } = "Quintal";
        public string OutputType { get; set; } = "Main Product";
    }

    // ==========================================
    // 3. FINISHED PRODUCTS INVENTORY DTOS
    // ==========================================

    public class VendorFinishedProductsOverviewDto
    {
        public int TotalProductTypes { get; set; }
        public int ActiveBatchesCount { get; set; }
        public decimal TotalFinishedStock { get; set; }
        public decimal TotalSoldQuantity { get; set; }
        public int LowStockProductsCount { get; set; }
    }

    public class VendorFinishedProductDto
    {
        public long Id { get; set; }
        public string ProductId { get; set; } = string.Empty;
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
        public string Status { get; set; } = "Active";
        public bool IsLowStock { get; set; }
        public string? ImageUrl { get; set; }
    }

    public class CreateFinishedProductRequest
    {
        public required string ProductName { get; set; }
        public required string Category { get; set; }
        public required string SourceRawMaterial { get; set; }
        public required string BrandName { get; set; }
        public required string Packaging { get; set; }
        public decimal InitialQuantity { get; set; }
        public string Unit { get; set; } = "Quintal";
        public DateTime MfgDate { get; set; }
        public DateTime ExpiryDate { get; set; }
        public decimal ProductionCost { get; set; }
        public decimal SellingPrice { get; set; }
        public decimal MinThresholdQuantity { get; set; } = 10;
        public string? ImageUrl { get; set; }
    }

    public class UpdateFinishedProductRequest
    {
        public required string ProductName { get; set; }
        public required string Category { get; set; }
        public required string SourceRawMaterial { get; set; }
        public required string BrandName { get; set; }
        public required string Packaging { get; set; }
        public DateTime MfgDate { get; set; }
        public DateTime ExpiryDate { get; set; }
        public decimal ProductionCost { get; set; }
        public decimal SellingPrice { get; set; }
        public decimal MinThresholdQuantity { get; set; } = 10;
        public string? Status { get; set; }
        public string? ImageUrl { get; set; }
    }

    public class AdjustFinishedProductStockRequest
    {
        public decimal QuantityAdjustment { get; set; } // positive or negative
        public required string Reason { get; set; }
        public string? ReferenceId { get; set; }
    }

    public class VendorFinishedProductMovementDto
    {
        public long Id { get; set; }
        public string MovementCode { get; set; } = string.Empty;
        public string MovementType { get; set; } = string.Empty;
        public string ReferenceId { get; set; } = string.Empty;
        public decimal QuantityChange { get; set; }
        public string Unit { get; set; } = "Quintal";
        public decimal BalanceAfter { get; set; }
        public DateTime MovementDate { get; set; }
        public string Remarks { get; set; } = string.Empty;
    }
}

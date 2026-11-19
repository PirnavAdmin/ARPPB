using System;
using System.Collections.Generic;

namespace AgriPurchaseBilling.Application.DTOs
{
    public class MiddlemanInventorySummaryDto
    {
        public long MiddlemanId { get; set; }
        public decimal TotalPurchasedStock { get; set; }
        public decimal TotalSoldStock { get; set; }
        public decimal AvailableStock { get; set; }
        public int LowStockBatches { get; set; }
        public int TotalBatches { get; set; }
        public List<MiddlemanInventoryBatchDto> Batches { get; set; } = new();
    }

    public class MiddlemanInventoryBatchDto
    {
        public long Id { get; set; }
        public long MiddlemanId { get; set; }

        // Mapped both as StockId (Frontend convention) and StockCode
        public string StockId { get; set; } = string.Empty;
        public string StockCode => StockId;

        public string CropName { get; set; } = string.Empty;
        public string Variety { get; set; } = string.Empty;
        public string? CropVariety => Variety;

        public string FarmerId { get; set; } = string.Empty;
        public string? SupplierId => FarmerId;

        public string FarmerName { get; set; } = string.Empty;
        public string? SupplierName => FarmerName;

        public string SupplierCategory { get; set; } = "Farmer";

        public string PurchaseId { get; set; } = string.Empty;
        public string BatchNumber { get; set; } = string.Empty;

        public DateTime PurchaseDate { get; set; }

        public decimal PurchasedQuantity { get; set; }
        public decimal ProcessedQuantity { get; set; }
        public decimal SoldQuantity { get; set; }
        public decimal AvailableQuantity { get; set; }
        public decimal MinimumThreshold { get; set; } = 10;

        public string Unit { get; set; } = "Quintal";

        public decimal PurchaseRate { get; set; }
        public decimal AllocatedCharges { get; set; }
        public decimal AverageCost { get; set; }
        public decimal TotalPurchaseCost { get; set; }

        public string Quality { get; set; } = "Grade A";
        public string? QualityGrade => Quality;

        public string GodownLocation { get; set; } = string.Empty;
        public string? StorageLocation => GodownLocation;

        public string Status { get; set; } = "In Stock";

        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    public class MiddlemanInventoryQueryDto
    {
        public string? Search { get; set; }
        public string? Crop { get; set; } = "ALL";
        public string? Quality { get; set; } = "ALL";
        public string? Status { get; set; } = "ALL";
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 8;
    }

    public class MiddlemanInventoryPageDto
    {
        public List<MiddlemanInventoryBatchDto> Items { get; set; } = new();
        public int TotalItems { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int TotalPages => PageSize > 0 ? (int)Math.Ceiling((double)TotalItems / PageSize) : 0;
    }

    public class CreateInventoryBatchRequest
    {
        public string CropName { get; set; } = string.Empty;
        public string? Variety { get; set; }
        public string? FarmerId { get; set; }
        public string? FarmerName { get; set; }
        public string? PurchaseId { get; set; }
        public DateTime? PurchaseDate { get; set; }
        public decimal PurchasedQuantity { get; set; }
        public decimal PurchaseRate { get; set; }
        public decimal AllocatedCharges { get; set; } = 0;
        public string Unit { get; set; } = "Quintal";
        public string? Quality { get; set; } = "Grade A";
        public string? GodownLocation { get; set; }
        public decimal MinimumThreshold { get; set; } = 10;
    }

    public class UpdateInventoryBatchRequest
    {
        public decimal? AvailableQuantity { get; set; }
        public decimal? SoldQuantity { get; set; }
        public string? GodownLocation { get; set; }
        public decimal? MinimumThreshold { get; set; }
        public string? Status { get; set; }
    }
}

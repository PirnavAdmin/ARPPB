using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AgriPurchaseBilling.Domain.Entities
{
    [Table("middleman_inventory")]
    public class MiddlemanInventory
    {
        [Key]
        [Column("id")]
        public long Id { get; set; }

        [Column("middleman_id")]
        public long MiddlemanId { get; set; }

        [Column("stock_code")]
        [MaxLength(50)]
        public string StockCode { get; set; } = string.Empty;

        [Column("crop_name")]
        [MaxLength(100)]
        public string CropName { get; set; } = string.Empty;

        [Column("crop_variety")]
        [MaxLength(100)]
        public string? CropVariety { get; set; }

        [Column("supplier_id")]
        [MaxLength(50)]
        public string? SupplierId { get; set; }

        [Column("supplier_name")]
        [MaxLength(150)]
        public string? SupplierName { get; set; }

        [Column("supplier_category")]
        [MaxLength(50)]
        public string SupplierCategory { get; set; } = "Farmer";

        [Column("purchase_id")]
        [MaxLength(50)]
        public string? PurchaseId { get; set; }

        [Column("batch_number")]
        [MaxLength(100)]
        public string BatchNumber { get; set; } = string.Empty;

        [Column("purchase_date")]
        public DateTime PurchaseDate { get; set; } = DateTime.UtcNow;

        [Column("purchased_quantity")]
        public decimal PurchasedQuantity { get; set; }

        [Column("processed_quantity")]
        public decimal ProcessedQuantity { get; set; }

        [Column("sold_quantity")]
        public decimal SoldQuantity { get; set; }

        [Column("available_quantity")]
        public decimal AvailableQuantity { get; set; }

        [Column("minimum_threshold")]
        public decimal MinimumThreshold { get; set; } = 10;

        [Column("unit")]
        [MaxLength(30)]
        public string Unit { get; set; } = "Quintal";

        [Column("purchase_rate")]
        public decimal PurchaseRate { get; set; }

        [Column("allocated_charges")]
        public decimal AllocatedCharges { get; set; }

        [Column("average_cost")]
        public decimal AverageCost { get; set; }

        [Column("total_purchase_cost")]
        public decimal TotalPurchaseCost { get; set; }

        [Column("quality_grade")]
        [MaxLength(100)]
        public string? QualityGrade { get; set; } = "Grade A";

        [Column("storage_location")]
        [MaxLength(255)]
        public string? StorageLocation { get; set; }

        [Column("status")]
        [MaxLength(50)]
        public string Status { get; set; } = "In Stock";

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column("updated_at")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}

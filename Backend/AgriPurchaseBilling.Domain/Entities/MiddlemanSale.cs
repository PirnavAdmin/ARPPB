using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AgriPurchaseBilling.Domain.Entities
{
    [Table("middleman_sales")]
    public class MiddlemanSale
    {
        [Key]
        [Column("id")]
        public long Id { get; set; }

        [Column("middleman_id")]
        public long MiddlemanId { get; set; }

        [Column("sale_code")]
        [MaxLength(50)]
        public string SaleCode { get; set; } = string.Empty;

        [Column("buyer_type")]
        [MaxLength(50)]
        public string BuyerType { get; set; } = "Customer"; // "Customer" or "Vendor"

        [Column("buyer_id")]
        [MaxLength(50)]
        public string BuyerId { get; set; } = string.Empty;

        [Column("buyer_name")]
        [MaxLength(150)]
        public string BuyerName { get; set; } = string.Empty;

        [Column("buyer_mobile")]
        [MaxLength(20)]
        public string? BuyerMobile { get; set; }

        [Column("crop_name")]
        [MaxLength(100)]
        public string CropName { get; set; } = string.Empty;

        [Column("variety")]
        [MaxLength(100)]
        public string Variety { get; set; } = "Standard";

        [Column("quality_grade")]
        [MaxLength(50)]
        public string QualityGrade { get; set; } = "Grade A";

        [Column("stock_batch_id")]
        [MaxLength(100)]
        public string? StockBatchId { get; set; }

        [Column("quantity")]
        public decimal Quantity { get; set; }

        [Column("unit")]
        [MaxLength(30)]
        public string Unit { get; set; } = "Quintal";

        [Column("price_per_unit")]
        public decimal PricePerUnit { get; set; }

        [Column("subtotal")]
        public decimal Subtotal { get; set; }

        [Column("discount")]
        public decimal Discount { get; set; }

        [Column("tax")]
        public decimal Tax { get; set; }

        [Column("delivery_charges")]
        public decimal DeliveryCharges { get; set; }

        [Column("delivery_address")]
        [MaxLength(255)]
        public string? DeliveryAddress { get; set; }

        [Column("total_amount")]
        public decimal TotalAmount { get; set; }

        [Column("cogs")]
        public decimal Cogs { get; set; }

        [Column("gross_profit")]
        public decimal GrossProfit { get; set; }

        [Column("sale_date")]
        public DateTime SaleDate { get; set; } = DateTime.UtcNow;

        [Column("expected_payment_date")]
        public DateTime? ExpectedPaymentDate { get; set; }

        [Column("expected_delivery_date")]
        public DateTime? ExpectedDeliveryDate { get; set; }

        [Column("status")]
        [MaxLength(50)]
        public string Status { get; set; } = "Pending Confirmation";

        [Column("otp_status")]
        [MaxLength(50)]
        public string OtpStatus { get; set; } = "Pending";

        [Column("confirmation_date")]
        public DateTime? ConfirmationDate { get; set; }

        [Column("notes")]
        public string? Notes { get; set; }

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column("updated_at")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}

using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AgriPurchaseBilling.Domain.Entities
{
    [Table("middleman_vendor_sales")]
    public class MiddlemanVendorSale
    {
        [Key]
        [Column("id")]
        public long Id { get; set; }

        [Column("middleman_id")]
        public long MiddlemanId { get; set; }

        [Column("sale_id")]
        [MaxLength(50)]
        public string SaleId { get; set; } = string.Empty;

        [Column("vendor_id")]
        [MaxLength(50)]
        public string VendorId { get; set; } = string.Empty;

        [Column("vendor_name")]
        [MaxLength(255)]
        public string VendorName { get; set; } = string.Empty;

        [Column("owner_name")]
        [MaxLength(150)]
        public string? OwnerName { get; set; }

        [Column("mobile")]
        [MaxLength(20)]
        public string? Mobile { get; set; }

        [Column("business_name")]
        [MaxLength(255)]
        public string? BusinessName { get; set; }

        [Column("crop_name")]
        [MaxLength(100)]
        public string CropName { get; set; } = string.Empty;

        [Column("variety")]
        [MaxLength(100)]
        public string Variety { get; set; } = "Standard";

        [Column("quality_grade")]
        [MaxLength(50)]
        public string QualityGrade { get; set; } = "Grade A";

        [Column("quantity")]
        public decimal Quantity { get; set; }

        [Column("unit")]
        [MaxLength(50)]
        public string Unit { get; set; } = "Quintal";

        [Column("rate")]
        public decimal Rate { get; set; }

        [Column("subtotal")]
        public decimal Subtotal { get; set; }

        [Column("transportation_charges")]
        public decimal TransportationCharges { get; set; }

        [Column("other_charges")]
        public decimal OtherCharges { get; set; }

        [Column("total_amount")]
        public decimal TotalAmount { get; set; }

        [Column("sales_date")]
        public DateTime SalesDate { get; set; }

        [Column("expected_delivery_date")]
        public DateTime? ExpectedDeliveryDate { get; set; }

        [Column("expected_payment_date")]
        public DateTime? ExpectedPaymentDate { get; set; }

        [Column("delivery_location")]
        [MaxLength(255)]
        public string? DeliveryLocation { get; set; }

        [Column("otp_status")]
        [MaxLength(50)]
        public string OtpStatus { get; set; } = "Pending OTP";

        [Column("confirmation_date")]
        public DateTime? ConfirmationDate { get; set; }

        [Column("status")]
        [MaxLength(50)]
        public string Status { get; set; } = "Pending Confirmation";

        [Column("allocated_stock_id")]
        [MaxLength(50)]
        public string? AllocatedStockId { get; set; }

        [Column("cogs")]
        public decimal Cogs { get; set; }

        [Column("notes")]
        public string? Notes { get; set; }

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column("updated_at")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}

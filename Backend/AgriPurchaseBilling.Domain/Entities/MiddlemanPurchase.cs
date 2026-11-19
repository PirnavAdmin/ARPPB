using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AgriPurchaseBilling.Domain.Entities
{
    [Table("middleman_purchases")]
    public class MiddlemanPurchase
    {
        [Key]
        [Column("id")]
        public long Id { get; set; }

        [Column("middleman_id")]
        public long MiddlemanId { get; set; }

        [Column("purchase_code")]
        [MaxLength(50)]
        public string PurchaseCode { get; set; } = string.Empty;

        [Column("farmer_id")]
        [MaxLength(50)]
        public string FarmerId { get; set; } = string.Empty;

        [Column("farmer_name")]
        [MaxLength(150)]
        public string FarmerName { get; set; } = string.Empty;

        [Column("farmer_mobile")]
        [MaxLength(20)]
        public string? FarmerMobile { get; set; }

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
        [MaxLength(30)]
        public string Unit { get; set; } = "Quintal";

        [Column("rate")]
        public decimal Rate { get; set; }

        [Column("subtotal")]
        public decimal Subtotal { get; set; }

        [Column("transportation_charges")]
        public decimal TransportationCharges { get; set; }

        [Column("loading_charges")]
        public decimal LoadingCharges { get; set; }

        [Column("other_charges")]
        public decimal OtherCharges { get; set; }

        [Column("additional_charges")]
        public decimal AdditionalCharges { get; set; }

        [Column("total_amount")]
        public decimal TotalAmount { get; set; }

        [Column("purchase_date")]
        public DateTime PurchaseDate { get; set; } = DateTime.UtcNow;

        [Column("expected_payment_date")]
        public DateTime? ExpectedPaymentDate { get; set; }

        [Column("pickup_location")]
        [MaxLength(255)]
        public string? PickupLocation { get; set; }

        [Column("delivery_date")]
        public DateTime? DeliveryDate { get; set; }

        [Column("status")]
        [MaxLength(50)]
        public string Status { get; set; } = "Pending Confirmation";

        [Column("otp_status")]
        [MaxLength(50)]
        public string OtpStatus { get; set; } = "Pending OTP";

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

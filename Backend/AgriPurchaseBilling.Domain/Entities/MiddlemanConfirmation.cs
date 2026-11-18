using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AgriPurchaseBilling.Domain.Entities
{
    [Table("middleman_confirmations")]
    public class MiddlemanConfirmation
    {
        [Key]
        [Column("id")]
        public long Id { get; set; }

        [Column("middleman_id")]
        public long MiddlemanId { get; set; }

        [Column("confirmation_code")]
        [MaxLength(50)]
        public string ConfirmationCode { get; set; } = string.Empty;

        [Column("transaction_id")]
        [MaxLength(50)]
        public string TransactionId { get; set; } = string.Empty;

        [Column("transaction_type")]
        [MaxLength(50)]
        public string TransactionType { get; set; } = string.Empty; // "Farmer Purchase", "Vendor Sale", "Customer Sale"

        [Column("party_type")]
        [MaxLength(50)]
        public string PartyType { get; set; } = string.Empty; // "Farmer", "Vendor", "Customer"

        [Column("party_id")]
        [MaxLength(50)]
        public string PartyId { get; set; } = string.Empty;

        [Column("party_name")]
        [MaxLength(150)]
        public string PartyName { get; set; } = string.Empty;

        [Column("party_mobile")]
        [MaxLength(20)]
        public string? PartyMobile { get; set; }

        [Column("crop")]
        [MaxLength(100)]
        public string Crop { get; set; } = string.Empty;

        [Column("variety")]
        [MaxLength(100)]
        public string Variety { get; set; } = "Standard";

        [Column("quantity")]
        public decimal Quantity { get; set; }

        [Column("unit")]
        [MaxLength(30)]
        public string Unit { get; set; } = "Quintal";

        [Column("price_per_unit")]
        public decimal PricePerUnit { get; set; }

        [Column("transaction_amount")]
        public decimal TransactionAmount { get; set; }

        [Column("otp_status")]
        [MaxLength(50)]
        public string OtpStatus { get; set; } = "Pending";

        [Column("otp_code")]
        [MaxLength(10)]
        public string? OtpCode { get; set; }

        [Column("request_date")]
        public DateTime RequestDate { get; set; } = DateTime.UtcNow;

        [Column("expiry_date")]
        public DateTime? ExpiryDate { get; set; }

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

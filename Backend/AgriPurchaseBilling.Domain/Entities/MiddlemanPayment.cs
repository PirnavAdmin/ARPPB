using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AgriPurchaseBilling.Domain.Entities
{
    [Table("middleman_payments")]
    public class MiddlemanPayment
    {
        [Key]
        [Column("id")]
        public long Id { get; set; }

        [Column("middleman_id")]
        public long MiddlemanId { get; set; }

        [Column("payment_code")]
        [MaxLength(50)]
        public string PaymentCode { get; set; } = string.Empty;

        [Column("ledger_id")]
        public long? LedgerId { get; set; }

        [Column("transaction_id")]
        [MaxLength(50)]
        public string TransactionId { get; set; } = string.Empty;

        [Column("party_category")]
        [MaxLength(50)]
        public string PartyCategory { get; set; } = string.Empty;

        [Column("party_id")]
        [MaxLength(50)]
        public string? PartyId { get; set; }

        [Column("party_name")]
        [MaxLength(150)]
        public string PartyName { get; set; } = string.Empty;

        [Column("payment_direction")]
        [MaxLength(20)]
        public string PaymentDirection { get; set; } = "Paid"; // 'Paid' or 'Received'

        [Column("original_amount")]
        public decimal OriginalAmount { get; set; }

        [Column("payment_amount")]
        public decimal PaymentAmount { get; set; }

        [Column("total_paid_after")]
        public decimal TotalPaidAfter { get; set; }

        [Column("balance_after")]
        public decimal BalanceAfter { get; set; }

        [Column("payment_mode")]
        [MaxLength(50)]
        public string PaymentMode { get; set; } = "NEFT / RTGS";

        [Column("reference_no")]
        [MaxLength(100)]
        public string? ReferenceNo { get; set; }

        [Column("status")]
        [MaxLength(30)]
        public string Status { get; set; } = "Successful";

        [Column("notes")]
        [MaxLength(500)]
        public string? Notes { get; set; }

        [Column("payment_date")]
        public DateTime PaymentDate { get; set; } = DateTime.UtcNow;

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column("updated_at")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}

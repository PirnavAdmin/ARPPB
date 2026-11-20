using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AgriPurchaseBilling.Domain.Entities
{
    [Table("middleman_ledger")]
    public class MiddlemanLedger
    {
        [Key]
        [Column("id")]
        public long Id { get; set; }

        [Column("middleman_id")]
        public long MiddlemanId { get; set; }

        [Column("ledger_code")]
        [MaxLength(50)]
        public string LedgerCode { get; set; } = string.Empty;

        [Column("date")]
        public DateTime Date { get; set; } = DateTime.UtcNow;

        [Column("transaction_id")]
        [MaxLength(50)]
        public string? TransactionId { get; set; }

        [Column("category")]
        [MaxLength(100)]
        public string Category { get; set; } = string.Empty;

        [Column("description")]
        [MaxLength(500)]
        public string? Description { get; set; }

        [Column("party_id")]
        [MaxLength(50)]
        public string? PartyId { get; set; }

        [Column("party_name")]
        [MaxLength(150)]
        public string? PartyName { get; set; }

        [Column("party_category")]
        [MaxLength(50)]
        public string PartyCategory { get; set; } = string.Empty;

        [Column("debit")]
        public decimal Debit { get; set; }

        [Column("credit")]
        public decimal Credit { get; set; }

        [Column("processing_expenses")]
        public decimal ProcessingExpenses { get; set; }

        [Column("expected_payment_date")]
        public DateTime? ExpectedPaymentDate { get; set; }

        [Column("status")]
        [MaxLength(50)]
        public string Status { get; set; } = "Pending";

        [Column("settled_amount")]
        public decimal SettledAmount { get; set; }

        [Column("outstanding_amount")]
        public decimal OutstandingAmount { get; set; }

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column("updated_at")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}

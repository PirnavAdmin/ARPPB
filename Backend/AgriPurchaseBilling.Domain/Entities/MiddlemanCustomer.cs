using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AgriPurchaseBilling.Domain.Entities
{
    [Table("middleman_customers")]
    public class MiddlemanCustomer
    {
        [Key]
        [Column("id")]
        public long Id { get; set; }

        [Column("middleman_id")]
        public long MiddlemanId { get; set; }

        [Column("customer_id")]
        [MaxLength(50)]
        public string CustomerId { get; set; } = string.Empty;

        [Column("name")]
        [MaxLength(150)]
        public string Name { get; set; } = string.Empty;

        [Column("mobile")]
        [MaxLength(20)]
        public string Mobile { get; set; } = string.Empty;

        [Column("email")]
        [MaxLength(150)]
        public string? Email { get; set; }

        [Column("address")]
        [MaxLength(255)]
        public string? Address { get; set; }

        [Column("district")]
        [MaxLength(100)]
        public string District { get; set; } = string.Empty;

        [Column("state")]
        [MaxLength(100)]
        public string State { get; set; } = "Andhra Pradesh";

        [Column("pin_code")]
        [MaxLength(20)]
        public string? PinCode { get; set; }

        [Column("total_purchases")]
        public int TotalPurchases { get; set; }

        [Column("total_purchase_value")]
        public decimal TotalPurchaseValue { get; set; }

        [Column("outstanding_receivables")]
        public decimal OutstandingReceivables { get; set; }

        [Column("status")]
        [MaxLength(50)]
        public string Status { get; set; } = "Active";

        [Column("notes")]
        public string? Notes { get; set; }

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column("updated_at")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}

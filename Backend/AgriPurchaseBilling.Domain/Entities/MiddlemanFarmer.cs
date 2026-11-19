using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AgriPurchaseBilling.Domain.Entities
{
    [Table("middleman_farmers")]
    public class MiddlemanFarmer
    {
        [Key]
        [Column("id")]
        public long Id { get; set; }

        [Column("middleman_id")]
        public long MiddlemanId { get; set; }

        [Column("farmer_code")]
        [MaxLength(50)]
        public string FarmerCode { get; set; } = string.Empty;

        [Column("name")]
        [MaxLength(150)]
        public string Name { get; set; } = string.Empty;

        [Column("mobile")]
        [MaxLength(20)]
        public string Mobile { get; set; } = string.Empty;

        [Column("email")]
        [MaxLength(150)]
        public string? Email { get; set; }

        [Column("village")]
        [MaxLength(100)]
        public string Village { get; set; } = string.Empty;

        [Column("mandal")]
        [MaxLength(100)]
        public string? Mandal { get; set; }

        [Column("district")]
        [MaxLength(100)]
        public string District { get; set; } = string.Empty;

        [Column("state")]
        [MaxLength(100)]
        public string State { get; set; } = "Andhra Pradesh";

        [Column("pincode")]
        [MaxLength(20)]
        public string? PinCode { get; set; }

        [Column("complete_address")]
        [MaxLength(500)]
        public string? CompleteAddress { get; set; }

        [Column("crops")]
        public string Crops { get; set; } = string.Empty;

        [Column("notes")]
        public string? Notes { get; set; }

        [Column("total_purchases")]
        public int TotalPurchases { get; set; }

        [Column("total_quantity_purchased")]
        public decimal TotalQuantityPurchased { get; set; }

        [Column("total_purchase_value")]
        public decimal TotalPurchaseValue { get; set; }

        [Column("outstanding_payables")]
        public decimal OutstandingPayables { get; set; }

        [Column("pending_confirmations")]
        public int PendingConfirmations { get; set; }

        [Column("status")]
        [MaxLength(50)]
        public string Status { get; set; } = "Active";

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column("updated_at")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}

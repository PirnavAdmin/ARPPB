namespace AgriPurchaseBilling.Domain.Entities
{
    /// <summary>
    /// Entity mapping to the existing shared MariaDB table `vp_otp_confirmations`.
    /// Relates to customer orders via `SaleId -> vp_sales.id`, allowing secure
    /// authorization against `vp_sales.customer_user_id`.
    /// </summary>
    public class VpOtpConfirmation
    {
        public long Id { get; set; }
        public long VendorId { get; set; }
        public string? ConfirmationCode { get; set; }
        public string TransactionCode { get; set; } = string.Empty;
        public string PartyCategory { get; set; } = string.Empty;
        public string PartyName { get; set; } = string.Empty;
        public string? PartyCode { get; set; }
        public string? Mobile { get; set; }
        public string TransactionType { get; set; } = string.Empty;
        public string? Product { get; set; }
        public decimal Quantity { get; set; }
        public string? Unit { get; set; }
        public decimal Amount { get; set; }
        public string? OtpHash { get; set; }
        public string OtpStatus { get; set; } = "Pending";
        public int Attempts { get; set; }
        public DateTime SentAt { get; set; }
        public DateTime? ExpiresAt { get; set; }
        public DateTime? ConfirmedAt { get; set; }
        public long? SaleId { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }

        public VpSale? Sale { get; set; }
    }
}


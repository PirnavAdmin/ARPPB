namespace AgriPurchaseBilling.Domain.Entities
{
    /// <summary>
    /// Read-only entity mapping to the existing shared MariaDB table `vp_sales`
    /// for the Customer Purchase History module. Sensitive/PII columns not needed
    /// by customers (mobile, email, GSTIN) are intentionally omitted.
    /// </summary>
    public class VpSale
    {
        public long Id { get; set; }
        public long VendorId { get; set; }
        public string SaleCode { get; set; } = string.Empty;
        public string OrderCode { get; set; } = string.Empty;
        public long CustomerUserId { get; set; }
        public string? CustomerCode { get; set; }
        public string CustomerName { get; set; } = string.Empty;
        public string? BusinessName { get; set; }
        public string? CustomerMobile { get; set; }
        public string? CustomerEmail { get; set; }
        public string? CustomerDistrict { get; set; }
        public string? CustomerState { get; set; }
        public string? DeliveryAddress { get; set; }
        public decimal ItemsSubtotal { get; set; }
        public decimal DiscountAmount { get; set; }
        public decimal TaxAmount { get; set; }
        public decimal DeliveryCharges { get; set; }
        public decimal OtherCharges { get; set; }
        public decimal TotalAmount { get; set; }
        public decimal AmountReceived { get; set; }
        public DateTime SaleDate { get; set; }
        public DateTime? ExpectedDeliveryDate { get; set; }
        public DateTime? ExpectedPaymentDate { get; set; }
        public string? PaymentTerms { get; set; }
        public string? Notes { get; set; }
        public string OtpStatus { get; set; } = string.Empty;
        public string PaymentStatus { get; set; } = string.Empty;
        public string OrderStatus { get; set; } = string.Empty;
        public string? CancelReason { get; set; }
        public DateTime? DeliveredAt { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }

        public ICollection<VpSaleItem> Items { get; set; } = new List<VpSaleItem>();
    }

    /// <summary>
    /// Read-only entity mapping to the existing shared MariaDB table `vp_sale_items`
    /// for the Customer Purchase History module. Internal vendor `cost_per_unit`
    /// is intentionally omitted so it can never be selected or exposed to customers.
    /// </summary>
    public class VpSaleItem
    {
        public long Id { get; set; }
        public long SaleId { get; set; }
        public long FinishedBatchId { get; set; }
        public string ProductName { get; set; } = string.Empty;
        public string BatchCode { get; set; } = string.Empty;
        public string? ProcessingBatchRef { get; set; }
        public decimal Quantity { get; set; }
        public string Unit { get; set; } = string.Empty;
        public decimal PricePerUnit { get; set; }
        public decimal CostPerUnit { get; set; }
        public decimal LineTotal { get; set; }

        public VpSale? Sale { get; set; }
    }
}


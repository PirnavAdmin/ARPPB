using System.Text.Json.Serialization;

namespace AgriPurchaseBilling.Application.DTOs
{
    public class CustomerPurchaseHistoryQueryDto
    {
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 10;

        /// <summary>
        /// Case-insensitive search across Transaction ID (sale_code), Order ID (order_code),
        /// Product name, and Source Region (vendor district/state).
        /// </summary>
        public string? Search { get; set; }

        /// <summary>
        /// Currently unsupported because vp_sales and vp_sale_items do not have a category column.
        /// Omitted or "All" is allowed; concrete values return 400 Bad Request.
        /// </summary>
        public string? Category { get; set; }

        /// <summary>
        /// Supported values: all (or "All Status"), confirmed (Confirmed + In Fulfilment),
        /// in_fulfilment (In Fulfilment only), completed (Delivered / Completed).
        /// </summary>
        public string? Status { get; set; }

        /// <summary>
        /// Supported values: all_time, last_7_days, last_30_days, this_month, last_month, custom.
        /// Evaluated in Asia/Kolkata business timezone.
        /// </summary>
        public string? DatePreset { get; set; } = "all_time";

        public DateTime? FromDate { get; set; }
        public DateTime? ToDate { get; set; }

        /// <summary>
        /// Supported values: transactionId, purchaseDate, productName, quantity, unitPrice, totalAmount.
        /// </summary>
        public string? SortBy { get; set; } = "purchaseDate";

        /// <summary>
        /// Supported values: asc, desc.
        /// </summary>
        public string? SortOrder { get; set; } = "desc";
    }

    public class CustomerPurchaseHistoryItemDto
    {
        public long Id { get; set; }
        public long SaleId { get; set; }
        public string TransactionId { get; set; } = string.Empty;
        public string OrderId { get; set; } = string.Empty;

        [JsonPropertyName("batchReference")]
        public string? LotId { get; set; }

        [JsonIgnore]
        public string? BatchReference { get => LotId; set => LotId = value; }

        public string Status { get; set; } = string.Empty;
        public DateTime PurchaseDate { get; set; }
        public DateTime? ExpectedPaymentDate { get; set; }
        public string ProductName { get; set; } = string.Empty;
        public string? Category { get; set; }

        [JsonPropertyName("location")]
        public string? SourceRegion { get; set; }

        [JsonIgnore]
        public string? Location { get => SourceRegion; set => SourceRegion = value; }

        public decimal Quantity { get; set; }
        public string Unit { get; set; } = string.Empty;
        public decimal UnitPrice { get; set; }
        public decimal TotalAmount { get; set; }
    }

    public class CustomerPurchaseDetailDto
    {
        public long Id { get; set; }
        public string TransactionId { get; set; } = string.Empty;
        public string OrderId { get; set; } = string.Empty;

        [JsonPropertyName("batchReference")]
        public string? LotId { get; set; }

        [JsonIgnore]
        public string? BatchReference { get => LotId; set => LotId = value; }

        public string Status { get; set; } = string.Empty;
        public DateTime PurchaseDate { get; set; }
        public DateTime? ExpectedPaymentDate { get; set; }
        public string ProductName { get; set; } = string.Empty;
        public string? Category { get; set; }

        [JsonPropertyName("location")]
        public string? SourceRegion { get; set; }

        [JsonIgnore]
        public string? Location { get => SourceRegion; set => SourceRegion = value; }

        public decimal Quantity { get; set; }
        public string Unit { get; set; } = string.Empty;
        public decimal UnitPrice { get; set; }
        public decimal TotalAmount { get; set; }
    }

    public class CustomerPurchaseSummaryDto
    {
        public int ConfirmedPurchases { get; set; }
        public int CompletedOrders { get; set; }
        public int InFulfilment { get; set; }
        public decimal TotalPurchaseSpend { get; set; }
    }

    public class CustomerPurchaseHistoryPagedDto
    {
        public List<CustomerPurchaseHistoryItemDto> Items { get; set; } = new();
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int TotalCount { get; set; }
        public int TotalPages { get; set; }
        public bool HasNextPage { get; set; }
        public bool HasPreviousPage { get; set; }
    }
}


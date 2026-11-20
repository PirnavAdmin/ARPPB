namespace AgriPurchaseBilling.Application.DTOs
{
    /// <summary>
    /// Query parameters for listing customer orders with search, filters, sorting, and pagination.
    /// </summary>
    public class CustomerOrderQueryDto
    {
        public string? Search { get; set; }
        public string? Status { get; set; } = "all";
        public string? Category { get; set; } = "all";
        public string? DatePreset { get; set; } = "all";
        public DateTime? FromDate { get; set; }
        public DateTime? ToDate { get; set; }
        public string? SortBy { get; set; } = "orderDate";
        public string? SortOrder { get; set; } = "desc";
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 8;
    }

    /// <summary>
    /// Line item summary belonging to an order.
    /// </summary>
    public class CustomerOrderItemDto
    {
        public long Id { get; set; }
        public long FinishedBatchId { get; set; }
        public string ProductName { get; set; } = string.Empty;
        public string? Category { get; set; }
        public string? BatchCode { get; set; }
        public decimal Quantity { get; set; }
        public string Unit { get; set; } = string.Empty;
        public decimal PricePerUnit { get; set; }
        public decimal UnitPrice { get => PricePerUnit; set => PricePerUnit = value; }
        public decimal LineTotal { get; set; }
    }

    /// <summary>
    /// Single event / milestone in an order's fulfilment timeline derived from actual database timestamps.
    /// </summary>
    public class CustomerOrderTimelineDto
    {
        public string Status { get; set; } = string.Empty;
        public string Timestamp { get; set; } = string.Empty;
        public string Note { get; set; } = string.Empty;
    }

    /// <summary>
    /// Order summary DTO returned in the paginated order list.
    /// </summary>
    public class CustomerOrderListDto
    {
        public long Id { get; set; }
        public string OrderId { get; set; } = string.Empty;
        public string? TransactionId { get; set; }
        public DateTime OrderDate { get; set; }
        public string Product { get; set; } = string.Empty;
        public string? Category { get; set; }
        public decimal Quantity { get; set; }
        public string Unit { get; set; } = string.Empty;
        public decimal TotalAmount { get; set; }
        public string OrderStatus { get; set; } = string.Empty;
        public DateTime? ExpectedDeliveryDate { get; set; }
        public DateTime? ExpectedPaymentDate { get; set; }
        public string? BatchReference { get; set; }
    }

    /// <summary>
    /// Complete order detail DTO returned by GET /api/v1/customer/orders/{id}.
    /// </summary>
    public class CustomerOrderDetailDto
    {
        public long Id { get; set; }
        public string OrderId { get; set; } = string.Empty;
        public string? TransactionId { get; set; }
        public DateTime OrderDate { get; set; }
        public string OrderStatus { get; set; } = string.Empty;
        public DateTime? ExpectedDeliveryDate { get; set; }
        public DateTime? ExpectedPaymentDate { get; set; }
        public decimal TotalAmount { get; set; }
        public string? DeliveryAddress { get; set; }
        public string? CancellationReason { get; set; }
        public string? SellerName { get; set; }
        public string Product { get; set; } = string.Empty;
        public string? Category { get; set; }
        public string? BatchReference { get; set; }
        public decimal Quantity { get; set; }
        public string Unit { get; set; } = string.Empty;
        public decimal UnitPrice { get; set; }
        public List<CustomerOrderTimelineDto> Timeline { get; set; } = new();
    }

    /// <summary>
    /// Paginated response envelope for Customer My Orders.
    /// </summary>
    public class CustomerOrderPagedDto
    {
        public List<CustomerOrderListDto> Items { get; set; } = new();
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int TotalCount { get; set; }
        public int TotalPages { get; set; }
        public bool HasNextPage { get; set; }
        public bool HasPreviousPage { get; set; }
    }
}

using System.ComponentModel.DataAnnotations;

namespace AgriPurchaseBilling.Application.DTOs.VendorPortal
{
    // ---------------------------------------------------------------
    // Shared
    // ---------------------------------------------------------------
    public sealed class PagedResult<T>
    {
        public long Total { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
        public List<T> Items { get; set; } = new();
    }

    // ---------------------------------------------------------------
    // Sell Products / Sales History
    // ---------------------------------------------------------------
    public sealed class CatalogSummaryDto
    {
        public long SellableSkuLines { get; set; }
        public long ActiveProductsReady { get; set; }
        public decimal AvailableStockMarketValue { get; set; }
        public long VerifiedCustomers { get; set; }

        /// <summary>Header button "Customer Orders (n)": all submitted (non-draft) orders.</summary>
        public long TotalOrders { get; set; }
        /// <summary>Header button "Sales History": all submitted (non-draft) sales.</summary>
        public long TotalSales { get; set; }
        /// <summary>Orders that are not yet Completed / Cancelled.</summary>
        public long OpenOrders { get; set; }
        /// <summary>New orders still waiting for the customer to confirm the OTP.</summary>
        public long PendingOtpOrders { get; set; }
    }

    public sealed class SalesCustomerDto
    {
        public long CustomerId { get; set; }
        public long CustomerUserId { get; set; }
        public string CustomerCode { get; set; } = string.Empty;
        public string CustomerName { get; set; } = string.Empty;
        public string BusinessName { get; set; } = string.Empty;
        public string CustomerType { get; set; } = string.Empty;
        public string Mobile { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Gstin { get; set; } = string.Empty;
        public string District { get; set; } = string.Empty;
        public string State { get; set; } = string.Empty;
        public string DeliveryAddress { get; set; } = string.Empty;
        public decimal CreditLimit { get; set; }
        public decimal OutstandingReceivable { get; set; }
    }

    public sealed class FinishedBatchDto
    {
        public long Id { get; set; }
        public string BatchCode { get; set; } = string.Empty;
        public string ProductName { get; set; } = string.Empty;
        public string? ProcessingBatchRef { get; set; }
        public string Unit { get; set; } = string.Empty;
        public decimal QuantityAvailable { get; set; }
        public decimal CostPerUnit { get; set; }
        public decimal SuggestedPrice { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    public sealed class SaleItemDto
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

        // ---- Sales details popup field names (filled by VendorOrderMapper.EnrichSale; not DB columns) ----
        /// <summary>The traceable batch code, e.g. FG-GRO-2026-002.</summary>
        public string BatchNumber { get; set; } = string.Empty;
        public decimal SellingQuantity { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal Subtotal { get; set; }
    }

    public sealed class SaleDto
    {
        public long Id { get; set; }
        public string SaleCode { get; set; } = string.Empty;
        public string OrderCode { get; set; } = string.Empty;
        public long CustomerUserId { get; set; }
        public string? CustomerCode { get; set; }
        public string CustomerName { get; set; } = string.Empty;
        public string? BusinessName { get; set; }
        public string? CustomerMobile { get; set; }
        public string? CustomerEmail { get; set; }
        public string? CustomerGstin { get; set; }
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

        /// <summary>Latest customer OTP confirmation of this sale (null for drafts). Use it with the verify / resend endpoints.</summary>
        public long? OtpConfirmationId { get; set; }
        public string? OtpConfirmationCode { get; set; }
        public DateTime? OtpExpiresAt { get; set; }
        public int? OtpAttempts { get; set; }

        // ---- Sales History / Sell Products screen fields (filled by VendorOrderMapper.EnrichSale; not DB columns) ----
        /// <summary>First product, e.g. "Rice" or "Rice +1 more".</summary>
        public string Product { get; set; } = string.Empty;
        public string BatchNumber { get; set; } = string.Empty;
        public long? BatchId { get; set; }
        public decimal Quantity { get; set; }
        public string Unit { get; set; } = string.Empty;
        /// <summary>Average price per unit across the lines.</summary>
        public decimal UnitPrice { get; set; }
        public decimal Subtotal { get; set; }
        public decimal Discount { get; set; }
        public decimal Tax { get; set; }
        public decimal ReceivedAmount { get; set; }
        /// <summary>"Balance Receivable Due": total minus received (0 for a cancelled sale).</summary>
        public decimal BalanceDue { get; set; }
        public DateTime SalesDate { get; set; }
        public string? MobileNumber { get; set; }
        public string? Email { get; set; }
        public string? District { get; set; }
        public string? State { get; set; }
        public string? OtpId { get; set; }
        /// <summary>Verified, Pending, Not Sent, Expired or Failed.</summary>
        public string ConfirmationStatus { get; set; } = string.Empty;
        /// <summary>The order stage: Draft, New, Confirmed, ... Completed or Cancelled.</summary>
        public string SalesStatus { get; set; } = string.Empty;
        /// <summary>Reserved, Deducted or Restored.</summary>
        public string StockAllocationStage { get; set; } = string.Empty;

        public List<SaleItemDto> Items { get; set; } = new();
    }

    /// <summary>One row of the Sales History register (see sp_vp_sales_export).</summary>
    public sealed class SaleExportRowDto
    {
        public string SaleCode { get; set; } = string.Empty;
        public string OrderCode { get; set; } = string.Empty;
        public string CustomerName { get; set; } = string.Empty;
        public string Product { get; set; } = string.Empty;
        public decimal Quantity { get; set; }
        public string Unit { get; set; } = string.Empty;
        public decimal UnitPrice { get; set; }
        public decimal TotalAmount { get; set; }
        public DateTime SaleDate { get; set; }
        public string ConfirmationStatus { get; set; } = string.Empty;
        public DateTime? ExpectedPaymentDate { get; set; }
        public string PaymentStatus { get; set; } = string.Empty;
        public string SalesStatus { get; set; } = string.Empty;
    }

    public sealed class SaleItemRequest
    {
        [Required] public long FinishedBatchId { get; set; }
        [Range(0.001, 999999999)] public decimal Quantity { get; set; }
        [Range(0, 999999999)] public decimal PricePerUnit { get; set; }
    }

    /// <summary>Used for both "Save Draft" and "Submit Sales Order &amp; Send OTP".</summary>
    public sealed class SaveSaleRequest
    {
        [Required] public long CustomerUserId { get; set; }
        [MaxLength(500)] public string? DeliveryAddress { get; set; }
        [Range(0, 999999999)] public decimal DiscountAmount { get; set; }
        [Range(0, 999999999)] public decimal TaxAmount { get; set; }
        [Range(0, 999999999)] public decimal DeliveryCharges { get; set; }
        [Range(0, 999999999)] public decimal OtherCharges { get; set; }
        public DateTime? ExpectedDeliveryDate { get; set; }
        public DateTime? ExpectedPaymentDate { get; set; }
        [MaxLength(50)] public string? PaymentTerms { get; set; }
        [MaxLength(1000)] public string? Notes { get; set; }
        [Required] public List<SaleItemRequest> Items { get; set; } = new();

        /// <summary>true = submit the order and send the customer OTP, false = save as draft.</summary>
        public bool Submit { get; set; }
    }

    public sealed class SaleSaveResultDto
    {
        public long SaleId { get; set; }
        public long? ConfirmationId { get; set; }
        public SaleDto? Sale { get; set; }
    }

    /// <summary>Result of "Verify OTP Now" / "Resend Customer OTP" on the post-submit popup.</summary>
    public sealed class SaleOtpResultDto
    {
        public SaleDto? Sale { get; set; }
        public OtpConfirmationDto? Confirmation { get; set; }
    }

    public sealed class SalesHistorySummaryDto
    {
        public long TotalSales { get; set; }
        public long TotalOrders { get; set; }
        public long CompletedSales { get; set; }
        public long PendingOrders { get; set; }
        public decimal TotalRevenue { get; set; }
        public decimal OutstandingReceivables { get; set; }
    }

    public sealed class SalesQuery
    {
        public string? Search { get; set; }
        public string? Status { get; set; }
        public string? OtpStatus { get; set; }
        public string? PaymentStatus { get; set; }
        public long? CustomerUserId { get; set; }
        /// <summary>Alternative to CustomerUserId: the customer's code, e.g. CUST-2026-0063 (no match = empty result).</summary>
        public string? CustomerCode { get; set; }
        public string? Product { get; set; }
        /// <summary>
        /// The screen's Date Range dropdown: Today, Yesterday, Last 7 Days, This Month, Last Month (All Time / omitted = no limit).
        /// Days are Indian Standard Time days; when given it replaces From / To.
        /// </summary>
        public string? DatePreset { get; set; }
        public DateTime? From { get; set; }
        public DateTime? To { get; set; }
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 10;
    }

    /// <summary>"Post Customer Receipt to Ledger" on the Sales Invoice &amp; Order Details popup.</summary>
    public sealed class SaleReceiptRequest
    {
        [Range(0.01, 999999999)] public decimal Amount { get; set; }
        /// <summary>NEFT / RTGS, UPI / IMPS, Cheque / DD or Cash.</summary>
        [MaxLength(30)] public string? PaymentMode { get; set; }
        /// <summary>UTR / reference number or remarks.</summary>
        [MaxLength(80)] public string? ReferenceNo { get; set; }
    }

    public sealed class SaleReceiptResultDto
    {
        public LedgerPaymentResultDto Receipt { get; set; } = new();
        /// <summary>The sale after the receipt: updated received amount, balance and payment status.</summary>
        public SaleDto? Sale { get; set; }
    }

    /// <summary>A finished product that appears on this vendor's sales (Products dropdown).</summary>
    public sealed class SalesProductOptionDto
    {
        public string ProductName { get; set; } = string.Empty;
        public long Sales { get; set; }
    }

    /// <summary>Every dropdown of the Sales History screen.</summary>
    public sealed class SalesFilterOptionsDto
    {
        public List<SelectOptionDto> DateRanges { get; set; } = new();
        public List<OrderCustomerOptionDto> Customers { get; set; } = new();
        public List<SalesProductOptionDto> Products { get; set; } = new();
        public List<SelectOptionDto> ConfirmationStatuses { get; set; } = new();
        public List<SelectOptionDto> PaymentStatuses { get; set; } = new();
        /// <summary>Sales status (the order stage) options with counts.</summary>
        public List<OrderTabDto> SalesStatuses { get; set; } = new();
        /// <summary>Payment modes of the receipt form.</summary>
        public List<SelectOptionDto> PaymentModes { get; set; } = new();
    }

    public sealed class SelectOptionDto
    {
        public string Label { get; set; } = string.Empty;
        /// <summary>Value to send as the filter parameter (empty = "All").</summary>
        public string Value { get; set; } = string.Empty;
    }

    public sealed class OrderTabDto
    {
        public string Id { get; set; } = string.Empty;
        public string Label { get; set; } = string.Empty;
        /// <summary>Value for the status parameter (empty = All).</summary>
        public string Status { get; set; } = string.Empty;
        public long Count { get; set; }
    }

    /// <summary>A customer that has orders with this vendor (Customer dropdown).</summary>
    public sealed class OrderCustomerOptionDto
    {
        public long CustomerUserId { get; set; }
        public string? CustomerCode { get; set; }
        public string CustomerName { get; set; } = string.Empty;
        public string? BusinessName { get; set; }
        public long Orders { get; set; }
    }

    /// <summary>Status tabs (with counts) and every filter dropdown of the Customer Orders screen.</summary>
    public sealed class OrderFilterOptionsDto
    {
        public List<OrderTabDto> Tabs { get; set; } = new();
        public List<SelectOptionDto> DateRanges { get; set; } = new();
        public List<OrderCustomerOptionDto> Customers { get; set; } = new();
        public List<SelectOptionDto> OtpStatuses { get; set; } = new();
        public List<SelectOptionDto> PaymentStatuses { get; set; } = new();
    }

    // ---------------------------------------------------------------
    // Customer Orders
    // ---------------------------------------------------------------
    public sealed class OrdersSummaryDto
    {
        public long Total { get; set; }
        public long New { get; set; }
        public long Confirmed { get; set; }
        public long Processing { get; set; }
        public long Packed { get; set; }
        public long Shipped { get; set; }
        public long Delivered { get; set; }
        public long Completed { get; set; }
        public long Cancelled { get; set; }
        /// <summary>Confirmed + Processing + Packed + Shipped + Delivered.</summary>
        public long InFulfilmentAndTransit { get; set; }
    }

    /// <summary>One step of an order's status history.</summary>
    public sealed class OrderTimelineEntryDto
    {
        public long OrderId { get; set; }
        public string Status { get; set; } = string.Empty;
        public string Note { get; set; } = string.Empty;
        public DateTime EventAt { get; set; }
        /// <summary>Display form, e.g. "2026-11-18 07:27".</summary>
        public string Timestamp { get; set; } = string.Empty;
    }

    /// <summary>
    /// A row of the Customer Orders table (and the order details view). Product / quantity / price are flattened
    /// from the order lines, and OTP / payment use the screen's wording (Pending, Verified, Cancelled / Pending, Partial, Paid).
    /// </summary>
    public sealed class OrderDto
    {
        public long Id { get; set; }
        public string OrderCode { get; set; } = string.Empty;
        public string SalesCode { get; set; } = string.Empty;
        public long CustomerUserId { get; set; }
        public string? CustomerCode { get; set; }
        public string CustomerName { get; set; } = string.Empty;
        public string? BusinessName { get; set; }
        public string? MobileNumber { get; set; }
        public string? Email { get; set; }
        public string? District { get; set; }
        public string? State { get; set; }
        public string? DeliveryAddress { get; set; }

        /// <summary>First product, e.g. "Rice" or "Rice +1 more".</summary>
        public string Product { get; set; } = string.Empty;
        public List<string> BatchReferences { get; set; } = new();
        public decimal Quantity { get; set; }
        public string Unit { get; set; } = string.Empty;
        /// <summary>Average price per unit across the lines.</summary>
        public decimal Price { get; set; }

        public decimal Subtotal { get; set; }
        public decimal Discount { get; set; }
        public decimal Tax { get; set; }
        public decimal DeliveryCharges { get; set; }
        public decimal OtherCharges { get; set; }
        public decimal TotalAmount { get; set; }
        public decimal AmountReceived { get; set; }

        public DateTime OrderDate { get; set; }
        public DateTime? ExpectedDeliveryDate { get; set; }
        public DateTime? ExpectedPaymentDate { get; set; }
        public string? PaymentTerms { get; set; }
        public string? Notes { get; set; }

        /// <summary>OTP confirmation code of this order (e.g. OTP-0001).</summary>
        public string? OtpId { get; set; }
        public long? OtpConfirmationId { get; set; }
        public DateTime? OtpExpiresAt { get; set; }
        /// <summary>Pending, Verified, Expired, Failed or Cancelled.</summary>
        public string OtpStatus { get; set; } = string.Empty;
        /// <summary>Pending, Partial or Paid.</summary>
        public string PaymentStatus { get; set; } = string.Empty;
        /// <summary>New, Confirmed, Processing, Packed, Shipped, Delivered, Completed or Cancelled.</summary>
        public string OrderStatus { get; set; } = string.Empty;
        /// <summary>Reserved (until shipped), Deducted (shipped onwards) or Restored (cancelled).</summary>
        public string StockAllocationStage { get; set; } = string.Empty;
        public string? CancelReason { get; set; }
        public DateTime? DeliveredAt { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }

        public List<OrderTimelineEntryDto> Timeline { get; set; } = new();
        public List<SaleItemDto> Items { get; set; } = new();
    }

    /// <summary>One row of the Export Orders CSV / Print register (see sp_vp_orders_export).</summary>
    public sealed class OrderExportRowDto
    {
        public string OrderCode { get; set; } = string.Empty;
        public string SaleCode { get; set; } = string.Empty;
        public string CustomerName { get; set; } = string.Empty;
        public string? BusinessName { get; set; }
        public string Product { get; set; } = string.Empty;
        public decimal Quantity { get; set; }
        public string Unit { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public decimal TotalAmount { get; set; }
        public DateTime OrderDate { get; set; }
        public DateTime? ExpectedDeliveryDate { get; set; }
        public string OtpStatus { get; set; } = string.Empty;
        public string PaymentStatus { get; set; } = string.Empty;
        public string OrderStatus { get; set; } = string.Empty;
    }

    public sealed class PrintMetadataDto
    {
        public string Label { get; set; } = string.Empty;
        public string Value { get; set; } = string.Empty;
    }

    /// <summary>Data for the "Print" popup: header, totals and the formatted register rows.</summary>
    public sealed class OrdersPrintDto
    {
        public string Title { get; set; } = string.Empty;
        public string Subtitle { get; set; } = string.Empty;
        public DateTime GeneratedAt { get; set; }
        public List<PrintMetadataDto> Metadata { get; set; } = new();
        /// <summary>Column headers, in print order.</summary>
        public List<string> Columns { get; set; } = new();
        /// <summary>One dictionary per order, keyed by <see cref="Columns"/>.</summary>
        public List<Dictionary<string, string>> Items { get; set; } = new();
    }

    public sealed class UpdateOrderStatusRequest
    {
        /// <summary>Next status: Confirmed, Processing, Packed, Shipped, Delivered or Completed.</summary>
        [Required, MaxLength(20)] public string Status { get; set; } = string.Empty;
    }

    public sealed class CancelOrderRequest
    {
        [MaxLength(500)] public string? Reason { get; set; }
    }

    // ---------------------------------------------------------------
    // OTP Confirmations
    // ---------------------------------------------------------------
    public sealed class OtpSummaryDto
    {
        public long TotalOtpRequests { get; set; }
        public long PendingOrSent { get; set; }
        public long VerifiedTransactions { get; set; }
        public long FailedExpiredRejected { get; set; }
        /// <summary>Unverified OTPs of cancelled orders (shown as "Cancelled").</summary>
        public long CancelledConfirmations { get; set; }
        public long FarmerConfirmations { get; set; }
        public long MiddlemanConfirmations { get; set; }
        public long CustomerConfirmations { get; set; }
    }

    public sealed class OtpConfirmationDto
    {
        public long Id { get; set; }
        public string? ConfirmationCode { get; set; }
        public string TransactionCode { get; set; } = string.Empty;
        public string PartyCategory { get; set; } = string.Empty;
        public string PartyName { get; set; } = string.Empty;
        public string? PartyCode { get; set; }
        /// <summary>Masked, e.g. 98••••1223.</summary>
        public string? Mobile { get; set; }
        public string TransactionType { get; set; } = string.Empty;
        public string? Product { get; set; }
        public decimal Quantity { get; set; }
        public string? Unit { get; set; }
        public decimal Amount { get; set; }
        /// <summary>Sent, Verified, Failed or Expired (a Sent OTP past its expiry is reported as Expired).</summary>
        public string OtpStatus { get; set; } = string.Empty;
        public int Attempts { get; set; }
        public DateTime SentAt { get; set; }
        public DateTime ExpiresAt { get; set; }
        public DateTime? ConfirmedAt { get; set; }
        public long? SaleId { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }

        /// <summary>Order status / code of the related sale (customer confirmations only).</summary>
        public string? SaleOrderStatus { get; set; }
        public string? SaleOrderCode { get; set; }

        // ---- OTP Confirmations screen fields (filled by VendorOtpMapper.Enrich; not DB columns) ----
        public string TransactionId { get; set; } = string.Empty;
        public string? PartyId { get; set; }
        /// <summary>Masked, e.g. 98••••1223.</summary>
        public string? MobileNumber { get; set; }
        /// <summary>"yyyy-MM-dd HH:mm" (UTC).</summary>
        public string InitiatedDate { get; set; } = string.Empty;
        public string? ConfirmationDate { get; set; }
        public string ExpiryTime { get; set; } = string.Empty;
        /// <summary>Wrong attempts allowed before the OTP must be resent.</summary>
        public int MaxAttempts { get; set; } = 5;
        public string? Notes { get; set; }
        public List<OtpAttemptLogDto> AttemptHistory { get; set; } = new();
    }

    /// <summary>One line of the "OTP Verification Attempt Log".</summary>
    public sealed class OtpAttemptLogDto
    {
        public string Timestamp { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string Note { get; set; } = string.Empty;
    }

    public sealed class OtpQuery
    {
        /// <summary>Farmer, Middleman or Customer (omit for All Confirmations).</summary>
        public string? Category { get; set; }
        /// <summary>Sent, Verified, Failed or Expired.</summary>
        public string? Status { get; set; }
        public string? Search { get; set; }
        public DateTime? From { get; set; }
        public DateTime? To { get; set; }
        /// <summary>All Time, Today, Yesterday, Last 7 Days or This Month (by the OTP initiated time, IST); replaces From / To.</summary>
        public string? DatePreset { get; set; }
        public bool Ascending { get; set; }
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 10;
    }

    public sealed class OtpFilterOptionDto
    {
        public string Label { get; set; } = string.Empty;
        /// <summary>Value to send as the filter parameter (empty = All).</summary>
        public string Value { get; set; } = string.Empty;
        /// <summary>Confirmations in this option (0 for date ranges).</summary>
        public long Count { get; set; }
    }

    /// <summary>Tabs and every dropdown of the OTP Confirmations screen.</summary>
    public sealed class OtpFilterOptionsDto
    {
        public List<OtpFilterOptionDto> Tabs { get; set; } = new();
        public List<OtpFilterOptionDto> Categories { get; set; } = new();
        public List<OtpFilterOptionDto> Statuses { get; set; } = new();
        public List<OtpFilterOptionDto> DateRanges { get; set; } = new();
    }

    public sealed class CreateOtpConfirmationRequest
    {
        [Required, MaxLength(40)] public string TransactionCode { get; set; } = string.Empty;
        /// <summary>Farmer, Middleman or Customer.</summary>
        [Required, MaxLength(20)] public string PartyCategory { get; set; } = string.Empty;
        [Required, MaxLength(150)] public string PartyName { get; set; } = string.Empty;
        [MaxLength(40)] public string? PartyCode { get; set; }
        [MaxLength(15)] public string? Mobile { get; set; }
        [Required, MaxLength(40)] public string TransactionType { get; set; } = string.Empty;
        [MaxLength(250)] public string? Product { get; set; }
        [Range(0, 999999999)] public decimal Quantity { get; set; }
        [MaxLength(20)] public string? Unit { get; set; }
        [Range(0, 999999999)] public decimal Amount { get; set; }
    }

    public sealed class VerifyOtpRequest
    {
        [Required, RegularExpression(@"^\d{6}$", ErrorMessage = "OTP must be 6 digits.")]
        public string Otp { get; set; } = string.Empty;
    }

    // ---------------------------------------------------------------
    // My Ledger
    // ---------------------------------------------------------------
    public sealed class LedgerSummaryDto
    {
        public decimal TotalPurchases { get; set; }
        public decimal TotalSales { get; set; }
        public decimal ProcessingExpenses { get; set; }
        public decimal TotalPayables { get; set; }
        public decimal TotalReceivables { get; set; }
        public decimal AmountReceived { get; set; }
        public decimal OutstandingAmount { get; set; }
        public decimal EstimatedProfit { get; set; }
        public long VoucherCount { get; set; }

        // Names the My Ledger screen's KPI cards use.
        public decimal TotalPurchasesAmount => TotalPurchases;
        public decimal TotalSalesRevenue => TotalSales;
        public decimal TotalProcessingExpenses => ProcessingExpenses;
        public decimal ExpectedPayables => TotalPayables;
        public decimal CustomerReceiptsTotal => AmountReceived;
        public decimal ExpectedReceivables => OutstandingAmount;
    }

    public sealed class LedgerDayTotalDto
    {
        public DateTime DayDate { get; set; }
        public long Vouchers { get; set; }
        public decimal Debit { get; set; }
        public decimal Credit { get; set; }
    }

    public sealed class LedgerEntryDto
    {
        public long Id { get; set; }
        public string? VoucherCode { get; set; }
        public string TransactionCode { get; set; } = string.Empty;
        public DateTime EntryDate { get; set; }
        public string? Description { get; set; }
        public string PartyName { get; set; } = string.Empty;
        public string? PartyCode { get; set; }
        public string PartyCategory { get; set; } = string.Empty;
        public string LedgerCategory { get; set; } = string.Empty;
        public decimal Debit { get; set; }
        public decimal Credit { get; set; }
        public DateTime? ExpectedPaymentDate { get; set; }
        public string Status { get; set; } = string.Empty;
        public decimal SettledAmount { get; set; }
        public string? PaymentMode { get; set; }
        public string? ReferenceNo { get; set; }
        public long? SaleId { get; set; }
        public long? RelatedEntryId { get; set; }
        public decimal RunningBalance { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }

        // ---- My Ledger screen fields (filled by VendorLedgerMapper.Enrich; not DB columns) ----
        /// <summary>Voucher code, e.g. VCH-0003. Accepted by the voucher, settle and print routes.</summary>
        public string LedgerCode { get; set; } = string.Empty;
        public string TransactionId { get; set; } = string.Empty;
        /// <summary>Screen wording: Customer Sale, Customer Payment, Farmer Purchase, Middleman Purchase, Supplier Payment, Processing Expense.</summary>
        public string Category { get; set; } = string.Empty;
        public string? PartyId { get; set; }
        public DateTime Date { get; set; }
        public decimal ProcessingExpenses { get; set; }
        /// <summary>Still to be settled on this voucher (payables: credit - settled, sales: debit - settled).</summary>
        public decimal OutstandingAmount { get; set; }
        /// <summary>e.g. "Budigina Receivable Due", "Ramesh Payable Due", "Cum. Expense".</summary>
        public string BalanceLabel { get; set; } = string.Empty;
    }

    public sealed class LedgerQuery
    {
        /// <summary>
        /// suppliers (payables) | customers (receivables) | processing (expenses); omit or "all" for All Journal Entries.
        /// </summary>
        public string? Tab { get; set; }
        public string? LedgerCategory { get; set; }
        public string? PartyCategory { get; set; }
        public string? Party { get; set; }
        public string? Status { get; set; }
        /// <summary>debit or credit (omit for both).</summary>
        public string? EntryType { get; set; }
        public string? Search { get; set; }
        /// <summary>
        /// The screen's Date Range dropdown: Today, Yesterday, Last 7 Days, This Month, Last Month (All Time / omitted = no limit).
        /// Days are Indian Standard Time days. When given it replaces From / To.
        /// </summary>
        public string? DatePreset { get; set; }
        public DateTime? From { get; set; }
        public DateTime? To { get; set; }
        public bool Ascending { get; set; }
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 10;
    }

    // ---- My Ledger filter dropdowns ----
    public sealed class LedgerFilterOptionDto
    {
        public string Label { get; set; } = string.Empty;
        /// <summary>The value to send as the filter parameter ("All" options use an empty value).</summary>
        public string Value { get; set; } = string.Empty;
    }

    public sealed class LedgerPartyOptionDto
    {
        public string PartyName { get; set; } = string.Empty;
        public string? PartyCode { get; set; }
        public string PartyCategory { get; set; } = string.Empty;
        public long Vouchers { get; set; }
    }

    public sealed class LedgerTabDto
    {
        public string Id { get; set; } = string.Empty;
        public string Label { get; set; } = string.Empty;
        /// <summary>Value for the tab parameter (empty = All Journal Entries).</summary>
        public string Tab { get; set; } = string.Empty;
        public long Count { get; set; }
    }

    public sealed class LedgerTabCountsDto
    {
        public long AllEntries { get; set; }
        public long Payables { get; set; }
        public long Receivables { get; set; }
        public long Expenses { get; set; }
    }

    /// <summary>Everything the My Ledger sub-ledger buttons and filter dropdowns offer.</summary>
    public sealed class LedgerFilterOptionsDto
    {
        public List<LedgerTabDto> Tabs { get; set; } = new();
        public List<LedgerFilterOptionDto> DateRanges { get; set; } = new();
        public List<LedgerFilterOptionDto> LedgerCategories { get; set; } = new();
        public List<LedgerFilterOptionDto> PartyCategories { get; set; } = new();
        public List<LedgerPartyOptionDto> Parties { get; set; } = new();
        public List<LedgerFilterOptionDto> EntryTypes { get; set; } = new();
        public List<LedgerFilterOptionDto> Statuses { get; set; } = new();
    }

    public sealed class LedgerPaymentResultDto
    {
        public decimal AppliedAmount { get; set; }
        public decimal UnappliedAmount { get; set; }
        public List<LedgerEntryDto> Entries { get; set; } = new();
    }

    /// <summary>"Pay Supplier". Provide LedgerEntryId (one payable) or PartyName (oldest-first across the party).</summary>
    public sealed class PaySupplierRequest
    {
        public long? LedgerEntryId { get; set; }
        /// <summary>Alternative to LedgerEntryId: voucher code (VCH-0007) or purchase code (PUR-F-0001) of an open payable.</summary>
        [MaxLength(60)] public string? LedgerEntryCode { get; set; }
        [MaxLength(150)] public string? PartyName { get; set; }
        [Range(0.01, 999999999)] public decimal Amount { get; set; }
        [MaxLength(30)] public string? PaymentMode { get; set; }
        [MaxLength(80)] public string? ReferenceNo { get; set; }
    }

    /// <summary>"Record Customer Receipt". Provide SaleId (one sale) or CustomerUserId (oldest-first).</summary>
    public sealed class RecordReceiptRequest
    {
        public long? SaleId { get; set; }
        public long? CustomerUserId { get; set; }
        /// <summary>Alternative to SaleId: SALE-0001 or ORD-0001.</summary>
        [MaxLength(60)] public string? SaleCode { get; set; }
        /// <summary>Alternative to CustomerUserId: customer code, e.g. CUST-2026-0063.</summary>
        [MaxLength(60)] public string? CustomerCode { get; set; }
        [Range(0.01, 999999999)] public decimal Amount { get; set; }
        [MaxLength(30)] public string? PaymentMode { get; set; }
        [MaxLength(80)] public string? ReferenceNo { get; set; }
    }

    /// <summary>"Settle" a single voucher. Amount omitted = settle the full pending amount.</summary>
    public sealed class SettleLedgerEntryRequest
    {
        [Range(0.01, 999999999)] public decimal? Amount { get; set; }
        [MaxLength(30)] public string? PaymentMode { get; set; }
        [MaxLength(80)] public string? ReferenceNo { get; set; }
    }

    // ---------------------------------------------------------------
    // Notifications
    // ---------------------------------------------------------------
    public sealed class NotificationDto
    {
        public long Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string Category { get; set; } = string.Empty;
        public string Priority { get; set; } = string.Empty;
        public string? ReferenceCode { get; set; }
        public string? ModuleLink { get; set; }
        public bool IsRead { get; set; }
        public DateTime? ReadAt { get; set; }
        public DateTime CreatedAt { get; set; }

        // ---- Notifications screen fields (filled by VendorNotificationMapper.Enrich; not DB columns) ----
        /// <summary>NTF-0007. Accepted by the mark-read and delete routes.</summary>
        public string NotificationCode { get; set; } = string.Empty;
        /// <summary>The related order / sale / purchase code ("Ref: ORD-0007").</summary>
        public string? TransactionId { get; set; }
        /// <summary>Where "Open Module" goes, e.g. /vendor/orders.</summary>
        public string? TargetPath { get; set; }
        /// <summary>"yyyy-MM-dd HH:mm" (UTC).</summary>
        public string Date { get; set; } = string.Empty;
    }

    public sealed class NotificationFilterOptionDto
    {
        public string Label { get; set; } = string.Empty;
        /// <summary>Value to send as the filter parameter (empty = "All").</summary>
        public string Value { get; set; } = string.Empty;
        /// <summary>How many of this vendor's notifications are in the category (0 for other options).</summary>
        public long Count { get; set; }
    }

    /// <summary>Every dropdown of the Notifications screen.</summary>
    public sealed class NotificationFilterOptionsDto
    {
        public List<NotificationFilterOptionDto> Categories { get; set; } = new();
        public List<NotificationFilterOptionDto> Priorities { get; set; } = new();
        public List<NotificationFilterOptionDto> ReadStates { get; set; } = new();
        public List<NotificationFilterOptionDto> DateRanges { get; set; } = new();
    }

    /// <summary>Badges shown in the header of every vendor page.</summary>
    public sealed class HeaderCountsDto
    {
        /// <summary>Bell badge.</summary>
        public long UnreadNotifications { get; set; }
        public long HighPriorityUnread { get; set; }
        /// <summary>"OTP Queue" badge: OTPs still waiting to be entered.</summary>
        public long PendingOtps { get; set; }
        /// <summary>Where the "OTP Queue" button goes.</summary>
        public string OtpQueuePath => "/vendor/confirmations";
        public string NotificationsPath => "/vendor/notifications";
    }

    public sealed class NotificationSummaryDto
    {
        public long Total { get; set; }
        public long Unread { get; set; }
        public long HighPriorityUnread { get; set; }
        public long ReadCount { get; set; }
        public long CategoryCount { get; set; }
    }

    public sealed class NotificationQuery
    {
        public string? Search { get; set; }
        public string? Category { get; set; }
        public string? Priority { get; set; }
        /// <summary>true = read only, false = unread only, omitted = all.</summary>
        public bool? IsRead { get; set; }
        /// <summary>The screen's Read / Unread dropdown: All | Unread | Read (used when IsRead is not given).</summary>
        public string? ReadStatus { get; set; }
        /// <summary>The screen's Date Range dropdown: Today, Yesterday, Last 7 Days, This Month, Last Month (replaces From / To).</summary>
        public string? DatePreset { get; set; }
        public DateTime? From { get; set; }
        public DateTime? To { get; set; }
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 10;
    }

    public sealed class MarkAllReadResultDto
    {
        public int Updated { get; set; }
    }
}

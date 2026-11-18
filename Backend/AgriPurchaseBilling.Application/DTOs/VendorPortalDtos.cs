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
        public List<SaleItemDto> Items { get; set; } = new();
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
        public string? Product { get; set; }
        public DateTime? From { get; set; }
        public DateTime? To { get; set; }
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 10;
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
        public bool Ascending { get; set; }
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 10;
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
    }

    public sealed class LedgerQuery
    {
        /// <summary>suppliers, customers or processing (omit for All Journal Entries).</summary>
        public string? Tab { get; set; }
        public string? LedgerCategory { get; set; }
        public string? PartyCategory { get; set; }
        public string? Party { get; set; }
        public string? Status { get; set; }
        /// <summary>debit or credit (omit for both).</summary>
        public string? EntryType { get; set; }
        public string? Search { get; set; }
        public DateTime? From { get; set; }
        public DateTime? To { get; set; }
        public bool Ascending { get; set; }
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 10;
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

using AgriPurchaseBilling.Application.DTOs.VendorPortal;

namespace AgriPurchaseBilling.Application.Interfaces.VendorPortal
{
    /// <summary>Raised for business-rule / not-found errors (the stored procedures signal "code|message").</summary>
    public sealed class VendorPortalException : Exception
    {
        public int StatusCode { get; }

        public VendorPortalException(int statusCode, string message) : base(message)
        {
            StatusCode = statusCode;
        }
    }

    public interface IVendorResolver
    {
        /// <summary>Maps the logged-in user id to Vendors.Id (sp_vp_vendor_resolve).</summary>
        Task<long> GetVendorIdAsync(long userId, CancellationToken ct);
    }

    /// <summary>Generates the 6-digit OTP and the "salt:sha256(salt+otp)" hash the stored procedures verify.</summary>
    public interface IVendorOtpGenerator
    {
        (string Otp, string Hash) Generate();
        int ExpiryMinutes { get; }
    }

    public interface IVendorSalesRepository
    {
        Task<CatalogSummaryDto> GetCatalogSummaryAsync(long vendorId, CancellationToken ct);
        Task<List<SalesCustomerDto>> GetCustomersAsync(long vendorId, long? customerUserId, string? search, CancellationToken ct);
        Task<List<FinishedBatchDto>> GetBatchesAsync(long vendorId, long? id, string? product, bool includeEmpty, CancellationToken ct);

        Task<PagedResult<SaleDto>> GetSalesAsync(long vendorId, string scope, SalesQuery query, CancellationToken ct);
        Task<SaleDto?> GetSaleAsync(long vendorId, long id, string scope, CancellationToken ct);
        Task<SalesHistorySummaryDto> GetSalesHistorySummaryAsync(long vendorId, CancellationToken ct);

        /// <summary>Every dropdown of the Sales History screen (customers / products come from the vendor's real sales).</summary>
        Task<SalesFilterOptionsDto> GetFilterOptionsAsync(long vendorId, CancellationToken ct);

        /// <summary>All sales matching the Sales History filters (no paging) for Export / Print Sales.</summary>
        Task<List<SaleExportRowDto>> GetExportRowsAsync(long vendorId, SalesQuery query, CancellationToken ct);

        Task<SaleSaveResultDto> SaveSaleAsync(long vendorId, long? saleId, SaveSaleRequest request, string otpHash, int otpMinutes, CancellationToken ct);
        Task<SaleSaveResultDto> SubmitSaleAsync(long vendorId, long saleId, string otpHash, int otpMinutes, CancellationToken ct);
        Task DeleteDraftAsync(long vendorId, long saleId, CancellationToken ct);
    }

    public interface IVendorOrdersRepository
    {
        Task<OrdersSummaryDto> GetSummaryAsync(long vendorId, CancellationToken ct);
        Task<SaleDto> UpdateStatusAsync(long vendorId, long id, string status, CancellationToken ct);
        Task<SaleDto> CancelAsync(long vendorId, long id, string? reason, CancellationToken ct);

        /// <summary>Status tabs with counts and every dropdown (customers are the ones that actually have orders).</summary>
        Task<OrderFilterOptionsDto> GetFilterOptionsAsync(long vendorId, CancellationToken ct);

        /// <summary>All orders matching the screen filters (no paging) for Export Orders / Print.</summary>
        Task<List<OrderExportRowDto>> GetExportRowsAsync(long vendorId, SalesQuery query, CancellationToken ct);

        /// <summary>Status history of the given orders (sp_vp_order_timeline).</summary>
        Task<List<OrderTimelineEntryDto>> GetTimelineAsync(long vendorId, IEnumerable<long> orderIds, CancellationToken ct);
    }

    public interface IVendorConfirmationsRepository
    {
        Task<OtpSummaryDto> GetSummaryAsync(long vendorId, CancellationToken ct);
        Task<PagedResult<OtpConfirmationDto>> GetAsync(long vendorId, OtpQuery query, CancellationToken ct);
        Task<OtpConfirmationDto?> GetByIdAsync(long vendorId, long id, CancellationToken ct);

        /// <summary>Every confirmation matching the screen filters (no paging) for "Export OTP Audit Log".</summary>
        Task<List<OtpConfirmationDto>> ExportAsync(long vendorId, OtpQuery query, CancellationToken ct);

        /// <summary>Tabs and dropdowns (with this vendor's counts) of the OTP Confirmations screen.</summary>
        Task<OtpFilterOptionsDto> GetFilterOptionsAsync(long vendorId, CancellationToken ct);

        Task<OtpConfirmationDto> CreateAsync(long vendorId, CreateOtpConfirmationRequest request, string otpHash, int otpMinutes, CancellationToken ct);
        Task<OtpConfirmationDto> VerifyAsync(long vendorId, long id, string otp, CancellationToken ct);
        Task<OtpConfirmationDto> ResendAsync(long vendorId, long id, string otpHash, int otpMinutes, CancellationToken ct);
    }

    public interface IVendorLedgerRepository
    {
        Task<LedgerSummaryDto> GetSummaryAsync(long vendorId, CancellationToken ct);
        /// <summary>Date-wise totals for the recent posting days; tab = suppliers | customers | processing (null = all).</summary>
        Task<List<LedgerDayTotalDto>> GetDayTotalsAsync(long vendorId, int days, string? tab, CancellationToken ct);
        Task<PagedResult<LedgerEntryDto>> GetAsync(long vendorId, LedgerQuery query, CancellationToken ct);

        /// <summary>Sub-ledger buttons with counts and every filter dropdown (parties come from the vendor's ledger).</summary>
        Task<LedgerFilterOptionsDto> GetFilterOptionsAsync(long vendorId, CancellationToken ct);

        /// <summary>Every voucher matching the screen filters (no paging) for the statement export / print.</summary>
        Task<List<LedgerEntryDto>> ExportAsync(long vendorId, LedgerQuery query, CancellationToken ct);
        Task<LedgerEntryDto?> GetByIdAsync(long vendorId, long id, CancellationToken ct);
        Task<LedgerPaymentResultDto> PaySupplierAsync(long vendorId, PaySupplierRequest request, CancellationToken ct);
        Task<LedgerPaymentResultDto> RecordReceiptAsync(long vendorId, RecordReceiptRequest request, CancellationToken ct);
        Task<LedgerPaymentResultDto> SettleAsync(long vendorId, long id, SettleLedgerEntryRequest request, CancellationToken ct);
    }

    public interface IVendorNotificationsRepository
    {
        Task<NotificationSummaryDto> GetSummaryAsync(long vendorId, CancellationToken ct);
        Task<PagedResult<NotificationDto>> GetAsync(long vendorId, NotificationQuery query, CancellationToken ct);

        /// <summary>Every dropdown of the Notifications screen (categories carry this vendor's counts).</summary>
        Task<NotificationFilterOptionsDto> GetFilterOptionsAsync(long vendorId, CancellationToken ct);

        /// <summary>Bell and "OTP Queue" badges for the header of every vendor page.</summary>
        Task<HeaderCountsDto> GetHeaderCountsAsync(long vendorId, CancellationToken ct);
        Task<NotificationDto?> MarkReadAsync(long vendorId, long id, CancellationToken ct);
        Task<int> MarkAllReadAsync(long vendorId, CancellationToken ct);
        Task<bool> DeleteAsync(long vendorId, long id, CancellationToken ct);
    }

    public interface IVendorPurchasesRepository
    {
        Task<VendorPurchasesSummaryDto> GetSummaryAsync(long vendorId, CancellationToken ct);
        Task<PagedResult<VendorPurchaseItemDto>> GetPurchasesAsync(long vendorId, PurchasesQuery query, CancellationToken ct);
        Task<VendorPurchaseItemDto?> GetPurchaseByIdAsync(long vendorId, string id, string supplierCategory, CancellationToken ct);
        Task<VendorPurchaseItemDto> CreatePurchaseAsync(long vendorId, CreateVendorPurchaseRequest request, CancellationToken ct);
        Task<VendorPurchaseItemDto> UpdatePurchaseStatusAsync(long vendorId, string id, string supplierCategory, UpdateVendorPurchaseStatusRequest request, CancellationToken ct);
        Task<byte[]> ExportPurchasesCsvAsync(long vendorId, PurchasesQuery query, CancellationToken ct);
    }
}

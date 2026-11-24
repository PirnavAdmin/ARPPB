using System.Data.Common;
using System.Text.Json;
using AgriPurchaseBilling.Application.DTOs.VendorPortal;
using AgriPurchaseBilling.Application.Interfaces.VendorPortal;
using AgriPurchaseBilling.Infrastructure.Data;

namespace AgriPurchaseBilling.Infrastructure.Repositories
{
    internal static class Args
    {
        public static string? Clean(string? value) =>
            string.IsNullOrWhiteSpace(value) ? null : value.Trim();

        public static int Page(int page) => Math.Max(page, 1);
        public static int Size(int size) => Math.Clamp(size, 1, 200);
        public static DateTime? Day(DateTime? value) => value?.Date;
        public static DateTime? NextDay(DateTime? value) => value?.Date.AddDays(1);
    }

    /// <summary>Resolves the screen's Date Range preset and customer code of a sales / orders filter.</summary>
    internal static class SaleFilters
    {
        public static async Task<(DateTime? From, DateTime? To, long? Customer)> ResolveAsync(
            VendorPortalDb db, long vendorId, SalesQuery q, CancellationToken ct)
        {
            DateTime? from = Args.Day(q.From);
            DateTime? to = Args.Day(q.To);
            if (VendorOrderMapper.ResolveDayRange(q.DatePreset, DateTime.UtcNow) is { } range)
            {
                from = range.From;
                to = range.To;
            }

            var customer = q.CustomerUserId;
            var code = Args.Clean(q.CustomerCode);
            if (customer is null && code is not null)
            {
                // An unknown customer code matches nothing (-1) instead of silently showing every order.
                customer = await db.ProcAsync<long?>(
                    "sp_vp_ledger_resolve_receipt",
                    new (string, object?)[] { ("p_vendor", vendorId), ("p_customer_ref", code), ("p_sale_ref", null) },
                    async r => await r.ReadAsync() && !r.IsDBNull(1) ? Convert.ToInt64(r.GetValue(1)) : null,
                    ct) ?? -1;
            }

            return (from, to, customer);
        }
    }

    // =============================================================
    // Vendor resolution (sp_vp_vendor_resolve)
    // =============================================================
    public sealed class VendorResolver : IVendorResolver
    {
        private readonly VendorPortalDb _db;
        public VendorResolver(VendorPortalDb db) => _db = db;

        public async Task<long> GetVendorIdAsync(long userId, CancellationToken ct)
        {
            var vendorId = await _db.ProcAsync(
                "sp_vp_vendor_resolve",
                new (string, object?)[] { ("p_user", userId) },
                RowMapper.ReadScalarLongAsync,
                ct);

            if (vendorId <= 0)
                throw new VendorPortalException(403, "No vendor account is linked to this user.");
            return vendorId;
        }
    }

    // =============================================================
    // Sell Products + Sales History
    // =============================================================
    public sealed class VendorSalesRepository : IVendorSalesRepository
    {
        private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web);
        private readonly VendorPortalDb _db;
        public VendorSalesRepository(VendorPortalDb db) => _db = db;

        public async Task<CatalogSummaryDto> GetCatalogSummaryAsync(long vendorId, CancellationToken ct) =>
            await _db.ProcAsync(
                "sp_vp_catalog_summary",
                new (string, object?)[] { ("p_vendor", vendorId) },
                async r => await RowMapper.ReadFirstAsync<CatalogSummaryDto>(r) ?? new CatalogSummaryDto(),
                ct);

        public Task<List<SalesCustomerDto>> GetCustomersAsync(long vendorId, long? customerUserId, string? search, CancellationToken ct) =>
            _db.ProcAsync(
                "sp_vp_customers",
                new (string, object?)[]
                {
                    ("p_vendor", vendorId),
                    ("p_customer_user", customerUserId),
                    ("p_search", Args.Clean(search))
                },
                RowMapper.ReadListAsync<SalesCustomerDto>,
                ct);

        public Task<List<FinishedBatchDto>> GetBatchesAsync(long vendorId, long? id, string? product, bool includeEmpty, CancellationToken ct) =>
            _db.ProcAsync(
                "sp_vp_batches",
                new (string, object?)[]
                {
                    ("p_vendor", vendorId),
                    ("p_id", id),
                    ("p_product", Args.Clean(product)),
                    ("p_include_empty", includeEmpty ? 1 : 0)
                },
                RowMapper.ReadListAsync<FinishedBatchDto>,
                ct);

        // scope: "draft" => drafts only, anything else => submitted sales / orders.
        public async Task<PagedResult<SaleDto>> GetSalesAsync(long vendorId, string scope, SalesQuery q, CancellationToken ct)
        {
            var page = Args.Page(q.Page);
            var size = Args.Size(q.PageSize);
            var (from, to, customer) = await SaleFilters.ResolveAsync(_db, vendorId, q, ct);

            return await _db.ProcAsync(
                "sp_vp_sales_list",
                new (string, object?)[]
                {
                    ("p_vendor", vendorId),
                    ("p_scope", scope),
                    ("p_search", Args.Clean(q.Search)),
                    ("p_status", Args.Clean(q.Status)),
                    ("p_otp", Args.Clean(q.OtpStatus)),
                    ("p_payment", Args.Clean(q.PaymentStatus)),
                    ("p_customer", customer),
                    ("p_product", Args.Clean(q.Product)),
                    ("p_from", from),
                    ("p_to", to),
                    ("p_page", page),
                    ("p_size", size)
                },
                async r =>
                {
                    var total = await RowMapper.ReadScalarLongAsync(r);
                    await r.NextResultAsync();
                    var sales = await RowMapper.ReadListAsync<SaleDto>(r);
                    await r.NextResultAsync();
                    var items = await RowMapper.ReadListAsync<SaleItemDto>(r);
                    Attach(sales, items);
                    return new PagedResult<SaleDto> { Total = total, Page = page, PageSize = size, Items = sales };
                },
                ct);
        }

        public Task<SaleDto?> GetSaleAsync(long vendorId, long id, string scope, CancellationToken ct) =>
            VendorSaleReader.GetAsync(_db, vendorId, id, scope, ct);

        // Sales History KPI cards (sp_vp_sales_summary).
        public Task<SalesHistorySummaryDto> GetSalesHistorySummaryAsync(long vendorId, CancellationToken ct) =>
            _db.ProcAsync(
                "sp_vp_sales_summary",
                new (string, object?)[] { ("p_vendor", vendorId) },
                async r => await RowMapper.ReadFirstAsync<SalesHistorySummaryDto>(r) ?? new SalesHistorySummaryDto(),
                ct);

        public Task<SalesFilterOptionsDto> GetFilterOptionsAsync(long vendorId, CancellationToken ct) =>
            _db.ProcAsync(
                "sp_vp_sales_filter_options",
                new (string, object?)[] { ("p_vendor", vendorId) },
                async r =>
                {
                    var customers = await RowMapper.ReadListAsync<OrderCustomerOptionDto>(r);
                    await r.NextResultAsync();
                    var products = await RowMapper.ReadListAsync<SalesProductOptionDto>(r);
                    await r.NextResultAsync();
                    var counts = new Dictionary<string, long>(StringComparer.OrdinalIgnoreCase);
                    while (await r.ReadAsync())
                    {
                        counts[Convert.ToString(r.GetValue(0)) ?? string.Empty] = Convert.ToInt64(r.GetValue(1));
                    }
                    return VendorOrderMapper.BuildSalesFilterOptions(customers, products, counts);
                },
                ct);

        public async Task<List<SaleExportRowDto>> GetExportRowsAsync(long vendorId, SalesQuery q, CancellationToken ct)
        {
            var (from, to, customer) = await SaleFilters.ResolveAsync(_db, vendorId, q, ct);
            return await _db.ProcAsync(
                "sp_vp_sales_export",
                new (string, object?)[]
                {
                    ("p_vendor", vendorId),
                    ("p_search", Args.Clean(q.Search)),
                    ("p_status", Args.Clean(q.Status)),
                    ("p_otp", Args.Clean(q.OtpStatus)),
                    ("p_payment", Args.Clean(q.PaymentStatus)),
                    ("p_customer", customer),
                    ("p_product", Args.Clean(q.Product)),
                    ("p_from", from),
                    ("p_to", to)
                },
                RowMapper.ReadListAsync<SaleExportRowDto>,
                ct);
        }

        public async Task<SaleSaveResultDto> SaveSaleAsync(
            long vendorId, long? saleId, SaveSaleRequest request, string otpHash, int otpMinutes, CancellationToken ct)
        {
            var itemsJson = JsonSerializer.Serialize(
                request.Items.Select(i => new { finishedBatchId = i.FinishedBatchId, quantity = i.Quantity, pricePerUnit = i.PricePerUnit }),
                Json);

            var result = await _db.ProcAsync(
                "sp_vp_sale_save",
                new (string, object?)[]
                {
                    ("p_vendor", vendorId),
                    ("p_sale", saleId),
                    ("p_customer_user", request.CustomerUserId),
                    ("p_address", Args.Clean(request.DeliveryAddress)),
                    ("p_discount", request.DiscountAmount),
                    ("p_tax", request.TaxAmount),
                    ("p_delivery", request.DeliveryCharges),
                    ("p_other", request.OtherCharges),
                    ("p_exp_delivery", Args.Day(request.ExpectedDeliveryDate)),
                    ("p_exp_payment", Args.Day(request.ExpectedPaymentDate)),
                    ("p_terms", Args.Clean(request.PaymentTerms)),
                    ("p_notes", Args.Clean(request.Notes)),
                    ("p_items", itemsJson),
                    ("p_submit", request.Submit ? 1 : 0),
                    ("p_otp_hash", otpHash),
                    ("p_minutes", otpMinutes)
                },
                ReadSaveResult,
                ct);

            result.Sale = await GetSaleAsync(vendorId, result.SaleId, "sales", ct);
            return result;
        }

        public async Task<SaleSaveResultDto> SubmitSaleAsync(
            long vendorId, long saleId, string otpHash, int otpMinutes, CancellationToken ct)
        {
            var result = await _db.ProcAsync(
                "sp_vp_sale_submit",
                new (string, object?)[]
                {
                    ("p_vendor", vendorId),
                    ("p_sale", saleId),
                    ("p_otp_hash", otpHash),
                    ("p_minutes", otpMinutes)
                },
                ReadSaveResult,
                ct);

            result.Sale = await GetSaleAsync(vendorId, result.SaleId, "sales", ct);
            return result;
        }

        public Task DeleteDraftAsync(long vendorId, long saleId, CancellationToken ct) =>
            _db.ProcAsync(
                "sp_vp_sale_delete_draft",
                new (string, object?)[] { ("p_vendor", vendorId), ("p_id", saleId) },
                r => Task.FromResult(true),
                ct);

        private static async Task<SaleSaveResultDto> ReadSaveResult(DbDataReader r)
        {
            var result = new SaleSaveResultDto();
            if (await r.ReadAsync())
            {
                result.SaleId = Convert.ToInt64(r.GetValue(0));
                result.ConfirmationId = r.IsDBNull(1) ? null : Convert.ToInt64(r.GetValue(1));
            }
            return result;
        }

        internal static void Attach(List<SaleDto> sales, List<SaleItemDto> items)
        {
            var bySale = items.GroupBy(i => i.SaleId).ToDictionary(g => g.Key, g => g.ToList());
            foreach (var sale in sales)
            {
                sale.Items = bySale.TryGetValue(sale.Id, out var list) ? list : new List<SaleItemDto>();
                VendorOrderMapper.EnrichSale(sale);
            }
        }
    }

    internal static class VendorSaleReader
    {
        // sp_vp_sale_get: result set 1 = the sale (0 or 1 row), result set 2 = its items.
        public static Task<SaleDto?> GetAsync(VendorPortalDb db, long vendorId, long id, string scope, CancellationToken ct) =>
            db.ProcAsync(
                "sp_vp_sale_get",
                new (string, object?)[] { ("p_vendor", vendorId), ("p_id", id), ("p_scope", scope) },
                ReadAsync,
                ct);

        public static async Task<SaleDto?> ReadAsync(DbDataReader r)
        {
            var sales = await RowMapper.ReadListAsync<SaleDto>(r);
            await r.NextResultAsync();
            var items = await RowMapper.ReadListAsync<SaleItemDto>(r);
            VendorSalesRepository.Attach(sales, items);
            return sales.FirstOrDefault();
        }
    }

    // =============================================================
    // Customer Orders
    // =============================================================
    public sealed class VendorOrdersRepository : IVendorOrdersRepository
    {
        private readonly VendorPortalDb _db;
        public VendorOrdersRepository(VendorPortalDb db) => _db = db;

        public Task<OrdersSummaryDto> GetSummaryAsync(long vendorId, CancellationToken ct) =>
            _db.ProcAsync(
                "sp_vp_orders_summary",
                new (string, object?)[] { ("p_vendor", vendorId) },
                async r =>
                {
                    var counts = new Dictionary<string, long>(StringComparer.OrdinalIgnoreCase);
                    while (await r.ReadAsync())
                    {
                        counts[Convert.ToString(r.GetValue(0)) ?? string.Empty] = Convert.ToInt64(r.GetValue(1));
                    }

                    long Get(string key) => counts.TryGetValue(key, out var v) ? v : 0;
                    var summary = new OrdersSummaryDto
                    {
                        New = Get("New"),
                        Confirmed = Get("Confirmed"),
                        Processing = Get("Processing"),
                        Packed = Get("Packed"),
                        Shipped = Get("Shipped"),
                        Delivered = Get("Delivered"),
                        Completed = Get("Completed"),
                        Cancelled = Get("Cancelled"),
                        Total = counts.Values.Sum()
                    };
                    summary.InFulfilmentAndTransit =
                        summary.Confirmed + summary.Processing + summary.Packed + summary.Shipped + summary.Delivered;
                    return summary;
                },
                ct);

        public async Task<SaleDto> UpdateStatusAsync(long vendorId, long id, string status, CancellationToken ct) =>
            await _db.ProcAsync(
                "sp_vp_order_update_status",
                new (string, object?)[] { ("p_vendor", vendorId), ("p_id", id), ("p_status", status.Trim()) },
                VendorSaleReader.ReadAsync,
                ct)
            ?? throw new VendorPortalException(404, "Order not found.");

        public async Task<SaleDto> CancelAsync(long vendorId, long id, string? reason, CancellationToken ct) =>
            await _db.ProcAsync(
                "sp_vp_order_cancel",
                new (string, object?)[] { ("p_vendor", vendorId), ("p_id", id), ("p_reason", Args.Clean(reason)) },
                VendorSaleReader.ReadAsync,
                ct)
            ?? throw new VendorPortalException(404, "Order not found.");

        public async Task<List<OrderExportRowDto>> GetExportRowsAsync(long vendorId, SalesQuery q, CancellationToken ct)
        {
            var (from, to, customer) = await SaleFilters.ResolveAsync(_db, vendorId, q, ct);
            return await _db.ProcAsync(
                "sp_vp_orders_export",
                new (string, object?)[]
                {
                    ("p_vendor", vendorId),
                    ("p_search", Args.Clean(q.Search)),
                    ("p_status", Args.Clean(q.Status)),
                    ("p_otp", Args.Clean(q.OtpStatus)),
                    ("p_payment", Args.Clean(q.PaymentStatus)),
                    ("p_customer", customer),
                    ("p_product", Args.Clean(q.Product)),
                    ("p_from", from),
                    ("p_to", to)
                },
                RowMapper.ReadListAsync<OrderExportRowDto>,
                ct);
        }

        public async Task<OrderFilterOptionsDto> GetFilterOptionsAsync(long vendorId, CancellationToken ct)
        {
            var summary = await GetSummaryAsync(vendorId, ct);
            var customers = await _db.ProcAsync(
                "sp_vp_orders_filter_options",
                new (string, object?)[] { ("p_vendor", vendorId) },
                RowMapper.ReadListAsync<OrderCustomerOptionDto>,
                ct);
            return VendorOrderMapper.BuildOrderFilterOptions(summary, customers);
        }

        public async Task<List<OrderTimelineEntryDto>> GetTimelineAsync(
            long vendorId, IEnumerable<long> orderIds, CancellationToken ct)
        {
            var ids = string.Join(",", orderIds.Distinct());
            if (ids.Length == 0) return new List<OrderTimelineEntryDto>();

            var rows = await _db.ProcAsync(
                "sp_vp_order_timeline",
                new (string, object?)[] { ("p_vendor", vendorId), ("p_ids", ids) },
                RowMapper.ReadListAsync<OrderTimelineEntryDto>,
                ct);

            rows.ForEach(r => r.Timestamp = r.EventAt.ToString("yyyy-MM-dd HH:mm", System.Globalization.CultureInfo.InvariantCulture));
            return rows;
        }
    }

    // =============================================================
    // OTP Confirmations
    // =============================================================
    public sealed class VendorConfirmationsRepository : IVendorConfirmationsRepository
    {
        private readonly VendorPortalDb _db;
        public VendorConfirmationsRepository(VendorPortalDb db) => _db = db;

        public Task<OtpSummaryDto> GetSummaryAsync(long vendorId, CancellationToken ct) =>
            _db.ProcAsync(
                "sp_vp_otp_summary",
                new (string, object?)[] { ("p_vendor", vendorId) },
                async r => await RowMapper.ReadFirstAsync<OtpSummaryDto>(r) ?? new OtpSummaryDto(),
                ct);

        public Task<PagedResult<OtpConfirmationDto>> GetAsync(long vendorId, OtpQuery q, CancellationToken ct) =>
            ListAsync(vendorId, null, q, ct);

        public async Task<OtpConfirmationDto?> GetByIdAsync(long vendorId, long id, CancellationToken ct)
        {
            var page = await ListAsync(vendorId, id, new OtpQuery { Page = 1, PageSize = 1 }, ct);
            return page.Items.FirstOrDefault();
        }

        public async Task<List<OtpConfirmationDto>> ExportAsync(long vendorId, OtpQuery q, CancellationToken ct)
        {
            const int ExportLimit = 100_000;
            var page = await ListAsync(
                vendorId, null,
                new OtpQuery
                {
                    Category = q.Category, Status = q.Status, Search = q.Search, From = q.From, To = q.To, DatePreset = q.DatePreset,
                    Ascending = q.Ascending, Page = 1, PageSize = ExportLimit
                },
                ct, ExportLimit);
            return page.Items;
        }

        public Task<OtpFilterOptionsDto> GetFilterOptionsAsync(long vendorId, CancellationToken ct) =>
            _db.ProcAsync(
                "sp_vp_otp_filter_options",
                new (string, object?)[] { ("p_vendor", vendorId) },
                async r =>
                {
                    var c = await RowMapper.ReadFirstAsync<OtpCountsRow>(r) ?? new OtpCountsRow();
                    return VendorOtpMapper.BuildFilterOptions(c.Total, c.Farmer, c.Middleman, c.Customer, c.Pending, c.Verified, c.Expired, c.Failed, c.Cancelled);
                },
                ct);

        private sealed class OtpCountsRow
        {
            public long Total { get; set; }
            public long Farmer { get; set; }
            public long Middleman { get; set; }
            public long Customer { get; set; }
            public long Pending { get; set; }
            public long Verified { get; set; }
            public long Expired { get; set; }
            public long Failed { get; set; }
            public long Cancelled { get; set; }
        }

        public Task<OtpConfirmationDto> CreateAsync(
            long vendorId, CreateOtpConfirmationRequest r, string otpHash, int otpMinutes, CancellationToken ct) =>
            SingleAsync(
                "sp_vp_otp_create",
                new (string, object?)[]
                {
                    ("p_vendor", vendorId),
                    ("p_txn", r.TransactionCode),
                    ("p_category", r.PartyCategory),
                    ("p_party", r.PartyName),
                    ("p_party_code", Args.Clean(r.PartyCode)),
                    ("p_mobile", Args.Clean(r.Mobile)),
                    ("p_type", r.TransactionType),
                    ("p_product", Args.Clean(r.Product)),
                    ("p_qty", r.Quantity),
                    ("p_unit", Args.Clean(r.Unit)),
                    ("p_amount", r.Amount),
                    ("p_hash", otpHash),
                    ("p_minutes", otpMinutes)
                },
                ct);

        public Task<OtpConfirmationDto> VerifyAsync(long vendorId, long id, string otp, CancellationToken ct) =>
            SingleAsync(
                "sp_vp_otp_verify",
                new (string, object?)[] { ("p_vendor", vendorId), ("p_id", id), ("p_otp", otp) },
                ct);

        public Task<OtpConfirmationDto> ResendAsync(long vendorId, long id, string otpHash, int otpMinutes, CancellationToken ct) =>
            SingleAsync(
                "sp_vp_otp_resend",
                new (string, object?)[] { ("p_vendor", vendorId), ("p_id", id), ("p_hash", otpHash), ("p_minutes", otpMinutes) },
                ct);

        private async Task<OtpConfirmationDto> SingleAsync(string proc, (string, object?)[] args, CancellationToken ct)
        {
            var rows = await _db.ProcAsync(proc, args, RowMapper.ReadListAsync<OtpConfirmationDto>, ct);
            var row = rows.FirstOrDefault() ?? throw new VendorPortalException(404, "OTP confirmation not found.");
            return Shape(row);
        }

        private async Task<PagedResult<OtpConfirmationDto>> ListAsync(
            long vendorId, long? id, OtpQuery q, CancellationToken ct, int maxSize = 200)
        {
            var page = Args.Page(q.Page);
            var size = Math.Clamp(q.PageSize, 1, maxSize);

            DateTime? fromParam = Args.Day(q.From);
            DateTime? toExclParam = Args.NextDay(q.To);
            if (VendorLedgerMapper.ResolveDateRange(q.DatePreset, DateTime.UtcNow) is { } range)
            {
                fromParam = range.From;
                toExclParam = range.ToExclusive;
            }

            var result = await _db.ProcAsync(
                "sp_vp_otp_list",
                new (string, object?)[]
                {
                    ("p_vendor", vendorId),
                    ("p_id", id),
                    ("p_category", Args.Clean(q.Category)),
                    ("p_status", Args.Clean(q.Status)),
                    ("p_search", Args.Clean(q.Search)),
                    ("p_from", fromParam),
                    ("p_to_excl", toExclParam),
                    ("p_page", page),
                    ("p_size", size),
                    ("p_asc", q.Ascending ? 1 : 0)
                },
                async r =>
                {
                    var total = await RowMapper.ReadScalarLongAsync(r);
                    await r.NextResultAsync();
                    var rows = await RowMapper.ReadListAsync<OtpConfirmationDto>(r);
                    return new PagedResult<OtpConfirmationDto> { Total = total, Page = page, PageSize = size, Items = rows };
                },
                ct);

            result.Items.ForEach(i => Shape(i));
            return result;
        }

        // A "Sent" OTP past its expiry is shown as Expired, an unverified OTP of a cancelled order as Cancelled;
        // the mobile number is masked; then the screen's field names and attempt log are filled in.
        private static OtpConfirmationDto Shape(OtpConfirmationDto dto)
        {
            dto.OtpStatus = VendorOtpMapper.StatusLabel(dto, DateTime.UtcNow);

            if (!string.IsNullOrEmpty(dto.Mobile))
            {
                var digits = new string(dto.Mobile.Where(char.IsDigit).ToArray());
                if (digits.Length >= 6)
                    dto.Mobile = $"{digits[..2]}••••{digits[^4..]}";
            }
            return VendorOtpMapper.Enrich(dto);
        }
    }

    // =============================================================
    // My Ledger
    // =============================================================
    public sealed class VendorLedgerRepository : IVendorLedgerRepository
    {
        private readonly VendorPortalDb _db;
        public VendorLedgerRepository(VendorPortalDb db) => _db = db;

        public Task<LedgerSummaryDto> GetSummaryAsync(long vendorId, CancellationToken ct) =>
            _db.ProcAsync(
                "sp_vp_ledger_summary",
                new (string, object?)[] { ("p_vendor", vendorId) },
                async r => await RowMapper.ReadFirstAsync<LedgerSummaryDto>(r) ?? new LedgerSummaryDto(),
                ct);

        public Task<List<LedgerDayTotalDto>> GetDayTotalsAsync(long vendorId, int days, string? tab, CancellationToken ct) =>
            _db.ProcAsync(
                "sp_vp_ledger_day_totals",
                new (string, object?)[]
                {
                    ("p_vendor", vendorId),
                    ("p_days", Math.Clamp(days, 1, 365)),
                    ("p_tab", VendorLedgerMapper.NormalizeTab(tab))
                },
                RowMapper.ReadListAsync<LedgerDayTotalDto>,
                ct);

        public Task<PagedResult<LedgerEntryDto>> GetAsync(long vendorId, LedgerQuery q, CancellationToken ct) =>
            ListAsync(vendorId, null, q, ct);

        public Task<LedgerFilterOptionsDto> GetFilterOptionsAsync(long vendorId, CancellationToken ct) =>
            _db.ProcAsync(
                "sp_vp_ledger_filter_options",
                new (string, object?)[] { ("p_vendor", vendorId) },
                async r =>
                {
                    var parties = await RowMapper.ReadListAsync<LedgerPartyOptionDto>(r);
                    await r.NextResultAsync();
                    var counts = await RowMapper.ReadFirstAsync<LedgerTabCountsDto>(r) ?? new LedgerTabCountsDto();
                    return VendorLedgerMapper.BuildFilterOptions(parties, counts);
                },
                ct);

        public async Task<List<LedgerEntryDto>> ExportAsync(long vendorId, LedgerQuery q, CancellationToken ct)
        {
            const int ExportLimit = 100_000;
            var page = await ListAsync(
                vendorId, null,
                new LedgerQuery
                {
                    Tab = q.Tab, LedgerCategory = q.LedgerCategory, PartyCategory = q.PartyCategory, Party = q.Party,
                    Status = q.Status, EntryType = q.EntryType, Search = q.Search, DatePreset = q.DatePreset,
                    From = q.From, To = q.To, Ascending = q.Ascending, Page = 1, PageSize = ExportLimit
                },
                ct, ExportLimit);
            return page.Items;
        }

        public async Task<LedgerEntryDto?> GetByIdAsync(long vendorId, long id, CancellationToken ct)
        {
            var page = await ListAsync(vendorId, id, new LedgerQuery { Page = 1, PageSize = 1 }, ct);
            return page.Items.FirstOrDefault();
        }

        public async Task<LedgerPaymentResultDto> PaySupplierAsync(long vendorId, PaySupplierRequest r, CancellationToken ct)
        {
            var entryId = r.LedgerEntryId;

            // A voucher / purchase code selects one open payable.
            var code = Args.Clean(r.LedgerEntryCode);
            if (code is not null)
            {
                var ids = await _db.ProcAsync(
                    "sp_vp_ledger_resolve_payable",
                    new (string, object?)[] { ("p_vendor", vendorId), ("p_ref", code) },
                    RowMapper.ReadScalarLongAsync,
                    ct);
                if (ids <= 0)
                    throw new VendorPortalException(404, $"No open payable matches '{code}'.");
                entryId = ids;
            }

            if (entryId is null && Args.Clean(r.PartyName) is null)
                throw new VendorPortalException(400, "Provide a payable (LedgerEntryId / LedgerEntryCode) or a PartyName.");

            return await PaymentAsync(
                "sp_vp_ledger_pay_supplier",
                new (string, object?)[]
                {
                    ("p_vendor", vendorId),
                    ("p_entry", entryId),
                    ("p_party", Args.Clean(r.PartyName)),
                    ("p_amount", r.Amount),
                    ("p_mode", Args.Clean(r.PaymentMode)),
                    ("p_ref", Args.Clean(r.ReferenceNo))
                },
                ct);
        }

        public async Task<LedgerPaymentResultDto> RecordReceiptAsync(long vendorId, RecordReceiptRequest r, CancellationToken ct)
        {
            // Sale / customer may be given as ids or as codes (SALE-0001, CUST-2026-0063): resolve them to real ids.
            var saleRef = Args.Clean(r.SaleCode) ?? r.SaleId?.ToString(System.Globalization.CultureInfo.InvariantCulture);
            var customerRef = Args.Clean(r.CustomerCode) ?? r.CustomerUserId?.ToString(System.Globalization.CultureInfo.InvariantCulture);
            if (saleRef is null && customerRef is null)
                throw new VendorPortalException(400, "Provide a sale (SaleId / SaleCode) or a customer (CustomerUserId / CustomerCode).");

            var (saleId, customerUserId) = await _db.ProcAsync(
                "sp_vp_ledger_resolve_receipt",
                new (string, object?)[] { ("p_vendor", vendorId), ("p_customer_ref", customerRef), ("p_sale_ref", saleRef) },
                async rd =>
                {
                    long? sale = null, customer = null;
                    if (await rd.ReadAsync())
                    {
                        sale = rd.IsDBNull(0) ? null : Convert.ToInt64(rd.GetValue(0));
                        customer = rd.IsDBNull(1) ? null : Convert.ToInt64(rd.GetValue(1));
                    }
                    return (sale, customer);
                },
                ct);

            if (saleId is null && Args.Clean(r.SaleCode) is not null)
                throw new VendorPortalException(404, $"Sale '{r.SaleCode}' was not found.");
            if (saleId is null && customerUserId is null)
                throw new VendorPortalException(404, "Customer not found. Use the customer's code (for example CUST-2026-0063) or user id.");

            return await PaymentAsync(
                "sp_vp_ledger_record_receipt",
                new (string, object?)[]
                {
                    ("p_vendor", vendorId),
                    ("p_sale", saleId),
                    ("p_customer", customerUserId),
                    ("p_amount", r.Amount),
                    ("p_mode", Args.Clean(r.PaymentMode)),
                    ("p_ref", Args.Clean(r.ReferenceNo))
                },
                ct);
        }

        public Task<LedgerPaymentResultDto> SettleAsync(long vendorId, long id, SettleLedgerEntryRequest r, CancellationToken ct) =>
            PaymentAsync(
                "sp_vp_ledger_settle",
                new (string, object?)[]
                {
                    ("p_vendor", vendorId),
                    ("p_id", id),
                    ("p_amount", r.Amount),
                    ("p_mode", Args.Clean(r.PaymentMode)),
                    ("p_ref", Args.Clean(r.ReferenceNo))
                },
                ct);

        // Payment procedures return: set 1 = applied/unapplied amounts, set 2 = the posted vouchers.
        private Task<LedgerPaymentResultDto> PaymentAsync(string proc, (string, object?)[] args, CancellationToken ct) =>
            _db.ProcAsync(
                proc,
                args,
                async r =>
                {
                    var result = new LedgerPaymentResultDto();
                    if (await r.ReadAsync())
                    {
                        result.AppliedAmount = Convert.ToDecimal(r.GetValue(0));
                        result.UnappliedAmount = Convert.ToDecimal(r.GetValue(1));
                    }
                    await r.NextResultAsync();
                    result.Entries = await RowMapper.ReadListAsync<LedgerEntryDto>(r);
                    result.Entries.ForEach(e => VendorLedgerMapper.Enrich(e));
                    return result;
                },
                ct);

        private async Task<PagedResult<LedgerEntryDto>> ListAsync(
            long vendorId, long? id, LedgerQuery q, CancellationToken ct, int maxSize = 200)
        {
            var page = Args.Page(q.Page);
            var size = Math.Clamp(q.PageSize, 1, maxSize);
            var (ledgerCategory, partyCategory) =
                VendorLedgerMapper.NormalizeCategory(Args.Clean(q.LedgerCategory), Args.Clean(q.PartyCategory));

            // A Date Range preset (Today, Last 7 Days, ...) replaces the explicit from / to dates.
            DateTime? fromParam = Args.Day(q.From);
            DateTime? toExclParam = Args.NextDay(q.To);
            if (VendorLedgerMapper.ResolveDateRange(q.DatePreset, DateTime.UtcNow) is { } range)
            {
                fromParam = range.From;
                toExclParam = range.ToExclusive;
            }

            var result = await _db.ProcAsync(
                "sp_vp_ledger_list",
                new (string, object?)[]
                {
                    ("p_vendor", vendorId),
                    ("p_id", id),
                    ("p_tab", VendorLedgerMapper.NormalizeTab(q.Tab)),
                    ("p_ledger_cat", ledgerCategory),
                    ("p_party_cat", partyCategory),
                    ("p_party", Args.Clean(q.Party)),
                    ("p_status", Args.Clean(q.Status)),
                    ("p_entry_type", Args.Clean(q.EntryType)?.ToLowerInvariant()),
                    ("p_search", Args.Clean(q.Search)),
                    ("p_from", fromParam),
                    ("p_to_excl", toExclParam),
                    ("p_page", page),
                    ("p_size", size),
                    ("p_asc", q.Ascending ? 1 : 0)
                },
                async r =>
                {
                    var total = await RowMapper.ReadScalarLongAsync(r);
                    await r.NextResultAsync();
                    var rows = await RowMapper.ReadListAsync<LedgerEntryDto>(r);
                    return new PagedResult<LedgerEntryDto> { Total = total, Page = page, PageSize = size, Items = rows };
                },
                ct);

            result.Items.ForEach(e => VendorLedgerMapper.Enrich(e));
            return result;
        }
    }

    // =============================================================
    // Notifications (sp_vp_notifications_* / sp_vp_header_counts)
    // =============================================================
    public sealed class VendorNotificationsRepository : IVendorNotificationsRepository
    {
        private readonly VendorPortalDb _db;
        public VendorNotificationsRepository(VendorPortalDb db) => _db = db;

        public Task<NotificationSummaryDto> GetSummaryAsync(long vendorId, CancellationToken ct) =>
            _db.ProcAsync(
                "sp_vp_notifications_summary",
                new (string, object?)[] { ("p_vendor", vendorId) },
                async r => await RowMapper.ReadFirstAsync<NotificationSummaryDto>(r) ?? new NotificationSummaryDto(),
                ct);

        public async Task<PagedResult<NotificationDto>> GetAsync(long vendorId, NotificationQuery q, CancellationToken ct)
        {
            var page = Args.Page(q.Page);
            var size = Args.Size(q.PageSize);

            // A Date Range preset (Today, Last 7 Days, ...) replaces the explicit from / to dates.
            DateTime? from = Args.Day(q.From);
            DateTime? toExcl = Args.NextDay(q.To);
            if (VendorLedgerMapper.ResolveDateRange(q.DatePreset, DateTime.UtcNow) is { } range)
            {
                from = range.From;
                toExcl = range.ToExclusive;
            }

            var read = VendorNotificationMapper.ResolveRead(q);

            var result = await _db.ProcAsync(
                "sp_vp_notifications_list",
                new (string, object?)[]
                {
                    ("p_vendor", vendorId),
                    ("p_search", Args.Clean(q.Search)),
                    ("p_category", Args.Clean(q.Category)),
                    ("p_priority", Args.Clean(q.Priority)),
                    ("p_read", read.HasValue ? (read.Value ? 1 : 0) : null),
                    ("p_from", from),
                    ("p_to_excl", toExcl),
                    ("p_page", page),
                    ("p_size", size)
                },
                async r =>
                {
                    var total = await RowMapper.ReadScalarLongAsync(r);
                    await r.NextResultAsync();
                    var items = await RowMapper.ReadListAsync<NotificationDto>(r);
                    return new PagedResult<NotificationDto> { Total = total, Page = page, PageSize = size, Items = items };
                },
                ct);

            result.Items.ForEach(n => VendorNotificationMapper.Enrich(n));
            return result;
        }

        public async Task<NotificationFilterOptionsDto> GetFilterOptionsAsync(long vendorId, CancellationToken ct)
        {
            var stored = await _db.ProcAsync(
                "sp_vp_notification_filter_options",
                new (string, object?)[] { ("p_vendor", vendorId) },
                async r =>
                {
                    var rows = new List<(string Category, long Count)>();
                    while (await r.ReadAsync())
                    {
                        rows.Add((Convert.ToString(r.GetValue(0)) ?? string.Empty, Convert.ToInt64(r.GetValue(1))));
                    }
                    return rows;
                },
                ct);
            return VendorNotificationMapper.BuildFilterOptions(stored);
        }

        public Task<HeaderCountsDto> GetHeaderCountsAsync(long vendorId, CancellationToken ct) =>
            _db.ProcAsync(
                "sp_vp_header_counts",
                new (string, object?)[] { ("p_vendor", vendorId) },
                async r => await RowMapper.ReadFirstAsync<HeaderCountsDto>(r) ?? new HeaderCountsDto(),
                ct);

        public async Task<NotificationDto?> MarkReadAsync(long vendorId, long id, CancellationToken ct)
        {
            var rows = await _db.ProcAsync(
                "sp_vp_notification_mark_read",
                new (string, object?)[] { ("p_vendor", vendorId), ("p_id", id) },
                RowMapper.ReadListAsync<NotificationDto>,
                ct);
            var row = rows.FirstOrDefault();
            return row is null ? null : VendorNotificationMapper.Enrich(row);
        }

        public Task<int> MarkAllReadAsync(long vendorId, CancellationToken ct) =>
            _db.ProcAsync(
                "sp_vp_notifications_mark_all_read",
                new (string, object?)[] { ("p_vendor", vendorId) },
                async r => (int)await RowMapper.ReadScalarLongAsync(r),
                ct);

        public async Task<bool> DeleteAsync(long vendorId, long id, CancellationToken ct) =>
            await _db.ProcAsync(
                "sp_vp_notification_delete",
                new (string, object?)[] { ("p_vendor", vendorId), ("p_id", id) },
                RowMapper.ReadScalarLongAsync,
                ct) > 0;
    }
}

using AgriPurchaseBilling.Application.DTOs.VendorPortal;
using AgriPurchaseBilling.Application.Interfaces.VendorPortal;
using Microsoft.AspNetCore.Mvc;

namespace AgriPurchaseBilling.Api.Controllers.VendorPortal
{
    /// <summary>"My Financial Ledger &amp; Account Statements" screen.</summary>
    [Route("api/v1/vendor/ledger")]
    public sealed class VendorLedgerController : VendorPortalControllerBase
    {
        private const int AllEntriesPageSize = 200;

        private readonly IVendorLedgerRepository _ledger;

        public VendorLedgerController(IVendorResolver resolver, IVendorLedgerRepository ledger) : base(resolver)
        {
            _ledger = ledger;
        }

        /// <summary>The eight KPI cards (purchases, sales, expenses, payables, receivables, received, outstanding, profit).</summary>
        [HttpGet("summary")]
        public async Task<IActionResult> GetSummary(CancellationToken ct) =>
            Success(await _ledger.GetSummaryAsync(await VendorIdAsync(ct), ct));

        /// <summary>
        /// "Date-wise financial totals (recent posting days)" strip. tab = suppliers | customers | processing
        /// (the screen's payables | receivables | expenses also work); omit for all journal entries. Cancelled vouchers are left out.
        /// </summary>
        [HttpGet("day-totals")]
        public async Task<IActionResult> GetDayTotals([FromQuery] int days = 7, [FromQuery] string? tab = null, CancellationToken ct = default) =>
            Success(await _ledger.GetDayTotalsAsync(await VendorIdAsync(ct), days, tab, ct));

        /// <summary>
        /// Sub-ledger buttons (with voucher counts) and every filter dropdown: date ranges, ledger categories,
        /// party categories, the parties that appear in this vendor's ledger, debit/credit and statuses.
        /// Each option's <c>value</c> is what to send as the matching query parameter.
        /// </summary>
        [HttpGet("filters")]
        public async Task<IActionResult> GetFilters(CancellationToken ct) =>
            Success(await _ledger.GetFilterOptionsAsync(await VendorIdAsync(ct), ct));

        /// <summary>
        /// Journal table. tab = suppliers | customers | processing (or payables | receivables | expenses; omit for All Journal Entries);
        /// filters: ledgerCategory (Customer Sale, Customer Payment, Farmer Purchase, ... or Sale, Receipt, Purchase, Payment),
        /// partyCategory (Farmer, Middleman, Customer, Processing Plant), party (name or code),
        /// status (Paid, Partial, Unpaid, Pending, Partially Paid, Overdue, Cancelled), entryType (debit/credit), search,
        /// datePreset (Today, Yesterday, Last 7 Days, This Month, Last Month) or from/to, paging.
        /// Unless pageSize is given, up to 200 vouchers are returned.
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetEntries([FromQuery] LedgerQuery query, CancellationToken ct)
        {
            // Query keys are case-insensitive.
            if (!Request.Query.ContainsKey("pageSize"))
            {
                query.PageSize = AllEntriesPageSize;
            }
            return Success(await _ledger.GetAsync(await VendorIdAsync(ct), query, ct));
        }

        /// <summary>
        /// "Download / Print Statement": downloads Vendor_Ledger_All.csv (or _Payables / _Receivables / _Expenses for the tab)
        /// with the 13 statement columns for every voucher matching the table's filters (no paging).
        /// </summary>
        [HttpGet("export")]
        public async Task<IActionResult> Export([FromQuery] LedgerQuery query, CancellationToken ct)
        {
            var rows = await _ledger.ExportAsync(await VendorIdAsync(ct), query, ct);
            return File(
                VendorLedgerMapper.ToCsv(rows),
                "text/csv; charset=utf-8",
                $"Vendor_Ledger_{VendorLedgerMapper.TabFileSuffix(query.Tab)}.csv");
        }

        /// <summary>"Print": the statement header, the eight KPI totals and the register rows for the filtered journal.</summary>
        [HttpGet("print")]
        public async Task<IActionResult> Print([FromQuery] LedgerQuery query, CancellationToken ct)
        {
            var vendorId = await VendorIdAsync(ct);
            var rows = await _ledger.ExportAsync(vendorId, query, ct);
            var summary = await _ledger.GetSummaryAsync(vendorId, ct);
            return Success(VendorLedgerMapper.ToStatementPrint(rows, summary, query.Tab, DateTime.UtcNow));
        }

        /// <summary>One voucher (the "Voucher" button). The id may be numeric or a code such as VCH-0003.</summary>
        [HttpGet("{idOrCode}")]
        public async Task<IActionResult> GetEntry(string idOrCode, CancellationToken ct)
        {
            var entry = await _ledger.GetByIdAsync(await VendorIdAsync(ct), ParseId(idOrCode), ct);
            return entry is null ? NotFoundResponse("Ledger voucher not found.") : Success(entry);
        }

        /// <summary>"Print Accounting Voucher": the printable voucher (header, 10 detail lines and the posting breakdown).</summary>
        [HttpGet("{idOrCode}/print")]
        public async Task<IActionResult> PrintVoucher(string idOrCode, CancellationToken ct)
        {
            var entry = await _ledger.GetByIdAsync(await VendorIdAsync(ct), ParseId(idOrCode), ct);
            return entry is null
                ? NotFoundResponse("Ledger voucher not found.")
                : Success(VendorLedgerMapper.ToVoucherPrint(entry, DateTime.UtcNow));
        }

        /// <summary>
        /// "Pay Supplier": pays one payable (ledgerEntryId or ledgerEntryCode) or a party's oldest payables first (partyName).
        /// </summary>
        [HttpPost("pay-supplier")]
        public async Task<IActionResult> PaySupplier([FromBody] PaySupplierRequest request, CancellationToken ct) =>
            Success(await _ledger.PaySupplierAsync(await VendorIdAsync(ct), request, ct), "Supplier payment recorded.");

        /// <summary>
        /// "Record Customer Receipt": against one sale (saleId / saleCode) or a customer's oldest dues first
        /// (customerUserId / customerCode such as CUST-2026-0063).
        /// </summary>
        [HttpPost("receipts")]
        public async Task<IActionResult> RecordReceipt([FromBody] RecordReceiptRequest request, CancellationToken ct) =>
            Success(await _ledger.RecordReceiptAsync(await VendorIdAsync(ct), request, ct), "Customer receipt recorded.");

        /// <summary>"Settle" button on a row: pays/receives the voucher's pending amount (or a part of it).</summary>
        [HttpPost("{idOrCode}/settle")]
        public async Task<IActionResult> Settle(string idOrCode, [FromBody] SettleLedgerEntryRequest request, CancellationToken ct) =>
            Success(await _ledger.SettleAsync(await VendorIdAsync(ct), ParseId(idOrCode), request, ct), "Entry settled.");

        // VCH-0003, LDG-0003 and 3 all identify the same voucher (the code is built from the id).
        private static long ParseId(string value) =>
            VendorLedgerMapper.TryParseId(value, out var id)
                ? id
                : throw new VendorPortalException(404, "Ledger voucher not found.");
    }
}

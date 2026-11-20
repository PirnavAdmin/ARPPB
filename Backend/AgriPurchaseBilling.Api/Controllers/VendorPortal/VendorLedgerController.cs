using AgriPurchaseBilling.Application.DTOs.VendorPortal;
using AgriPurchaseBilling.Application.Interfaces.VendorPortal;
using Microsoft.AspNetCore.Mvc;

namespace AgriPurchaseBilling.Api.Controllers.VendorPortal
{
    /// <summary>"My Financial Ledger &amp; Account Statements" screen.</summary>
    [Route("api/v1/vendor/ledger")]
    public sealed class VendorLedgerController : VendorPortalControllerBase
    {
        private readonly IVendorLedgerRepository _ledger;

        public VendorLedgerController(IVendorResolver resolver, IVendorLedgerRepository ledger) : base(resolver)
        {
            _ledger = ledger;
        }

        /// <summary>The eight KPI cards (purchases, sales, expenses, payables, receivables, received, outstanding, profit).</summary>
        [HttpGet("summary")]
        public async Task<IActionResult> GetSummary(CancellationToken ct) =>
            Success(await _ledger.GetSummaryAsync(await VendorIdAsync(ct), ct));

        /// <summary>"Date-wise financial totals (recent posting days)" strip.</summary>
        [HttpGet("day-totals")]
        public async Task<IActionResult> GetDayTotals([FromQuery] int days = 7, CancellationToken ct = default) =>
            Success(await _ledger.GetDayTotalsAsync(await VendorIdAsync(ct), days, ct));

        /// <summary>
        /// Journal table. tab = suppliers | customers | processing (omit for All Journal Entries);
        /// filters: ledgerCategory, partyCategory, party, status, entryType (debit/credit), search, from/to, paging.
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetEntries([FromQuery] LedgerQuery query, CancellationToken ct) =>
            Success(await _ledger.GetAsync(await VendorIdAsync(ct), query, ct));

        /// <summary>One voucher (the "Voucher" button).</summary>
        [HttpGet("{id:long}")]
        public async Task<IActionResult> GetEntry(long id, CancellationToken ct)
        {
            var entry = await _ledger.GetByIdAsync(await VendorIdAsync(ct), id, ct);
            return entry is null ? NotFoundResponse("Ledger voucher not found.") : Success(entry);
        }

        /// <summary>"Pay Supplier": pays one payable (ledgerEntryId) or a party's oldest payables first (partyName).</summary>
        [HttpPost("pay-supplier")]
        public async Task<IActionResult> PaySupplier([FromBody] PaySupplierRequest request, CancellationToken ct) =>
            Success(await _ledger.PaySupplierAsync(await VendorIdAsync(ct), request, ct), "Supplier payment recorded.");

        /// <summary>"Record Customer Receipt": against one sale (saleId) or a customer's oldest dues first (customerUserId).</summary>
        [HttpPost("receipts")]
        public async Task<IActionResult> RecordReceipt([FromBody] RecordReceiptRequest request, CancellationToken ct) =>
            Success(await _ledger.RecordReceiptAsync(await VendorIdAsync(ct), request, ct), "Customer receipt recorded.");

        /// <summary>"Settle" button on a row: pays/receives the voucher's pending amount (or a part of it).</summary>
        [HttpPost("{id:long}/settle")]
        public async Task<IActionResult> Settle(long id, [FromBody] SettleLedgerEntryRequest request, CancellationToken ct) =>
            Success(await _ledger.SettleAsync(await VendorIdAsync(ct), id, request, ct), "Entry settled.");
    }
}

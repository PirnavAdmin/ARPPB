using AgriPurchaseBilling.Application.DTOs.VendorPortal;
using AgriPurchaseBilling.Application.Interfaces.VendorPortal;
using Microsoft.AspNetCore.Mvc;

namespace AgriPurchaseBilling.Api.Controllers.VendorPortal
{
    /// <summary>"Sell Finished Products" and "Sales History &amp; Invoice Register" screens.</summary>
    [Route("api/v1/vendor/sales")]
    public sealed class VendorSalesController : VendorPortalControllerBase
    {
        private const string CsvFileName = "Vendor_Sales_History_Register.csv";
        private const int AllSalesPageSize = 200;

        private readonly IVendorSalesRepository _sales;
        private readonly IVendorConfirmationsRepository _confirmations;
        private readonly IVendorLedgerRepository _ledger;
        private readonly IVendorOtpGenerator _otp;
        private readonly IWebHostEnvironment _environment;

        public VendorSalesController(
            IVendorResolver resolver,
            IVendorSalesRepository sales,
            IVendorConfirmationsRepository confirmations,
            IVendorLedgerRepository ledger,
            IVendorOtpGenerator otp,
            IWebHostEnvironment environment) : base(resolver)
        {
            _sales = sales;
            _confirmations = confirmations;
            _ledger = ledger;
            _otp = otp;
            _environment = environment;
        }

        // ---------- Sell Products: lookups ----------

        /// <summary>Header cards: sellable SKU lines, active products, stock market value, verified customers.</summary>
        [HttpGet("catalog-summary")]
        public async Task<IActionResult> GetCatalogSummary(CancellationToken ct) =>
            Success(await _sales.GetCatalogSummaryAsync(await VendorIdAsync(ct), ct));

        /// <summary>Section A: customer directory (search by name, code, mobile, business or district).</summary>
        [HttpGet("customers")]
        public async Task<IActionResult> GetCustomers([FromQuery] string? search, CancellationToken ct) =>
            Success(await _sales.GetCustomersAsync(await VendorIdAsync(ct), null, search, ct));

        /// <summary>Selected customer's details (credit limit, outstanding, delivery address).</summary>
        [HttpGet("customers/{customerUserId:long}")]
        public async Task<IActionResult> GetCustomer(long customerUserId, CancellationToken ct)
        {
            var rows = await _sales.GetCustomersAsync(await VendorIdAsync(ct), customerUserId, null, ct);
            return rows.Count == 0 ? NotFoundResponse("Customer not found.") : Success(rows[0]);
        }

        /// <summary>Section B: sellable finished-product batches. Optionally filter by product name.</summary>
        [HttpGet("batches")]
        public async Task<IActionResult> GetBatches(
            [FromQuery] string? product, [FromQuery] bool includeEmpty, CancellationToken ct) =>
            Success(await _sales.GetBatchesAsync(await VendorIdAsync(ct), null, product, includeEmpty, ct));

        [HttpGet("batches/{id:long}")]
        public async Task<IActionResult> GetBatch(long id, CancellationToken ct)
        {
            var rows = await _sales.GetBatchesAsync(await VendorIdAsync(ct), id, null, true, ct);
            return rows.Count == 0 ? NotFoundResponse("Finished batch not found.") : Success(rows[0]);
        }

        // ---------- Sales History ----------

        /// <summary>Sales History KPI cards.</summary>
        [HttpGet("summary")]
        public async Task<IActionResult> GetSummary(CancellationToken ct) =>
            Success(await _sales.GetSalesHistorySummaryAsync(await VendorIdAsync(ct), ct));

        /// <summary>
        /// Every dropdown of the Sales History screen: date ranges, the customers and finished products that really appear
        /// on this vendor's sales, OTP (confirmation) status, payment status, sales status (with counts) and the receipt
        /// payment modes. Each option's <c>value</c> is the matching query parameter.
        /// </summary>
        [HttpGet("filters")]
        public async Task<IActionResult> GetFilters(CancellationToken ct) =>
            Success(await _sales.GetFilterOptionsAsync(await VendorIdAsync(ct), ct));

        /// <summary>
        /// Sales History register (submitted sales) with search, filters (datePreset: Today, Yesterday, Last 7 Days,
        /// This Month, Last Month; customerUserId or customerCode; product; otpStatus: Verified / Pending / Not Sent;
        /// paymentStatus; status = sales status) and paging. Unless pageSize is given, up to 200 sales are
        /// returned so the screen can page and filter them itself.
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetSales([FromQuery] SalesQuery query, CancellationToken ct)
        {
            // Query keys are case-insensitive.
            if (!Request.Query.ContainsKey("pageSize"))
            {
                query.PageSize = AllSalesPageSize;
            }
            return Success(await _sales.GetSalesAsync(await VendorIdAsync(ct), "history", query, ct));
        }

        /// <summary>
        /// "Export / Print Sales": downloads Vendor_Sales_History_Register.csv with the 13 register columns for every
        /// sale matching the same filters as the table (no paging).
        /// </summary>
        [HttpGet("export")]
        public async Task<IActionResult> Export([FromQuery] SalesQuery query, CancellationToken ct)
        {
            var rows = await _sales.GetExportRowsAsync(await VendorIdAsync(ct), query, ct);
            return File(VendorOrderMapper.ToSalesCsv(rows), "text/csv; charset=utf-8", CsvFileName);
        }

        /// <summary>"Print": header, KPI totals and register rows for the printable Sales History register.</summary>
        [HttpGet("print")]
        public async Task<IActionResult> Print([FromQuery] SalesQuery query, CancellationToken ct)
        {
            var vendorId = await VendorIdAsync(ct);
            var rows = await _sales.GetExportRowsAsync(vendorId, query, ct);
            var summary = await _sales.GetSalesHistorySummaryAsync(vendorId, ct);
            return Success(VendorOrderMapper.ToSalesPrint(rows, summary, DateTime.UtcNow));
        }

        /// <summary>Saved drafts ("Save Draft").</summary>
        [HttpGet("drafts")]
        public async Task<IActionResult> GetDrafts([FromQuery] SalesQuery query, CancellationToken ct) =>
            Success(await _sales.GetSalesAsync(await VendorIdAsync(ct), "draft", query, ct));

        /// <summary>Sale details with its product lines (the "Details" button).</summary>
        [HttpGet("{id:long}")]
        public async Task<IActionResult> GetSale(long id, CancellationToken ct)
        {
            var sale = await _sales.GetSaleAsync(await VendorIdAsync(ct), id, "sales", ct);
            return sale is null ? NotFoundResponse("Sale not found.") : Success(sale);
        }

        // ---------- Sell Products: save / submit ----------

        /// <summary>
        /// "Save Draft" (submit = false) or "Submit Sales Order &amp; Send OTP" (submit = true).
        /// Submitting reserves stock and sends a 6-digit OTP to the customer (returned as devOtp in Development).
        /// </summary>
        [HttpPost]
        public async Task<IActionResult> CreateSale([FromBody] SaveSaleRequest request, CancellationToken ct)
        {
            var (otp, hash) = _otp.Generate();
            var result = await _sales.SaveSaleAsync(await VendorIdAsync(ct), null, request, hash, _otp.ExpiryMinutes, ct);
            var response = AgriPurchaseBilling.Application.DTOs.ApiResponse<SaleSaveResultDto>.Ok(
                result,
                request.Submit ? "Sales order submitted and OTP sent." : "Draft saved.");
            response.DevOtp = request.Submit && _environment.IsDevelopment() ? otp : null;
            return StatusCode(StatusCodes.Status201Created, response);
        }

        /// <summary>Edit a draft sale (and optionally submit it).</summary>
        [HttpPut("{id:long}")]
        public async Task<IActionResult> UpdateSale(long id, [FromBody] SaveSaleRequest request, CancellationToken ct)
        {
            var (otp, hash) = _otp.Generate();
            var result = await _sales.SaveSaleAsync(await VendorIdAsync(ct), id, request, hash, _otp.ExpiryMinutes, ct);
            return Success(
                result,
                request.Submit ? "Sales order submitted and OTP sent." : "Draft updated.",
                request.Submit && _environment.IsDevelopment() ? otp : null);
        }

        /// <summary>Submit an existing draft: reserves stock and sends the customer OTP.</summary>
        [HttpPost("{id:long}/submit")]
        public async Task<IActionResult> SubmitSale(long id, CancellationToken ct)
        {
            var (otp, hash) = _otp.Generate();
            var result = await _sales.SubmitSaleAsync(await VendorIdAsync(ct), id, hash, _otp.ExpiryMinutes, ct);
            return Success(
                result,
                "Sales order submitted and OTP sent.",
                _environment.IsDevelopment() ? otp : null);
        }

        // ---------- Sales Invoice & Order Details popup (the "Details" eye icon) ----------

        /// <summary>"Print Invoice": the tax invoice header, detail lines and one row per sold product.</summary>
        [HttpGet("{id:long}/print")]
        public async Task<IActionResult> PrintInvoice(long id, CancellationToken ct)
        {
            var sale = await _sales.GetSaleAsync(await VendorIdAsync(ct), id, "sales", ct);
            return sale is null ? NotFoundResponse("Sale not found.") : Success(VendorOrderMapper.ToInvoicePrint(sale, DateTime.UtcNow));
        }

        /// <summary>"Download Summary": downloads Sales_Invoice_SALE-0015.csv (one row with the invoice and balance).</summary>
        [HttpGet("{id:long}/export")]
        public async Task<IActionResult> ExportInvoice(long id, CancellationToken ct)
        {
            var sale = await _sales.GetSaleAsync(await VendorIdAsync(ct), id, "sales", ct);
            return sale is null
                ? NotFoundResponse("Sale not found.")
                : File(VendorOrderMapper.ToInvoiceCsv(sale), "text/csv; charset=utf-8", $"Sales_Invoice_{sale.SaleCode}.csv");
        }

        /// <summary>
        /// "Post Customer Receipt to Ledger": records a customer payment against this sale (payment mode NEFT / RTGS,
        /// UPI / IMPS, Cheque / DD or Cash; reference = UTR or remarks). Only OTP-verified, active sales can be paid, and
        /// not more than the balance due. Returns the receipt vouchers and the refreshed sale.
        /// </summary>
        [HttpPost("{id:long}/receipts")]
        public async Task<IActionResult> PostReceipt(long id, [FromBody] SaleReceiptRequest request, CancellationToken ct)
        {
            var mode = string.IsNullOrWhiteSpace(request.PaymentMode) ? VendorOrderMapper.ReceiptPaymentModes[0] : request.PaymentMode.Trim();
            if (!VendorOrderMapper.ReceiptPaymentModes.Contains(mode, StringComparer.OrdinalIgnoreCase))
                throw new VendorPortalException(400, "Choose a valid payment mode: " + string.Join(", ", VendorOrderMapper.ReceiptPaymentModes) + ".");

            var vendorId = await VendorIdAsync(ct);
            if (await _sales.GetSaleAsync(vendorId, id, "sales", ct) is null)
                throw new VendorPortalException(404, "Sale not found.");

            var receipt = await _ledger.RecordReceiptAsync(
                vendorId,
                new RecordReceiptRequest { SaleId = id, Amount = request.Amount, PaymentMode = mode, ReferenceNo = request.ReferenceNo },
                ct);

            var sale = await _sales.GetSaleAsync(vendorId, id, "sales", ct);
            return Success(new SaleReceiptResultDto { Receipt = receipt, Sale = sale }, "Customer receipt recorded.");
        }

        // ---------- Post-submit popup: "Verify OTP Now" / "Resend Customer OTP" ----------

        /// <summary>
        /// "Verify OTP Now" on the Customer Order Created popup. Confirms the customer's 6-digit OTP for this sale:
        /// the order moves New → Confirmed and the receivable is posted to the ledger.
        /// Returns the refreshed sale together with the confirmation.
        /// </summary>
        [HttpPost("{id:long}/verify-otp")]
        public async Task<IActionResult> VerifySaleOtp(long id, [FromBody] VerifyOtpRequest request, CancellationToken ct)
        {
            var vendorId = await VendorIdAsync(ct);
            var confirmationId = await ConfirmationIdAsync(vendorId, id, ct);

            var confirmation = await _confirmations.VerifyAsync(vendorId, confirmationId, request.Otp, ct);
            var sale = await _sales.GetSaleAsync(vendorId, id, "sales", ct);
            return Success(new SaleOtpResultDto { Sale = sale, Confirmation = confirmation }, "Customer order confirmed.");
        }

        /// <summary>"Resend Customer OTP": issues a fresh OTP (returned as devOtp in Development) and resets attempts / expiry.</summary>
        [HttpPost("{id:long}/resend-otp")]
        public async Task<IActionResult> ResendSaleOtp(long id, CancellationToken ct)
        {
            var vendorId = await VendorIdAsync(ct);
            var confirmationId = await ConfirmationIdAsync(vendorId, id, ct);

            var (otp, hash) = _otp.Generate();
            var confirmation = await _confirmations.ResendAsync(vendorId, confirmationId, hash, _otp.ExpiryMinutes, ct);
            var sale = await _sales.GetSaleAsync(vendorId, id, "sales", ct);
            return Success(
                new SaleOtpResultDto { Sale = sale, Confirmation = confirmation },
                "A new OTP has been sent.",
                _environment.IsDevelopment() ? otp : null);
        }

        /// <summary>Resolves the customer OTP confirmation of a submitted sale (drafts have none).</summary>
        private async Task<long> ConfirmationIdAsync(long vendorId, long saleId, CancellationToken ct)
        {
            var sale = await _sales.GetSaleAsync(vendorId, saleId, "sales", ct)
                ?? throw new VendorPortalException(404, "Sale not found.");

            return sale.OtpConfirmationId
                ?? throw new VendorPortalException(409, "This sale has no OTP confirmation. Submit the draft first.");
        }

        /// <summary>Delete a draft sale (the "Cancel" action on an unsent draft).</summary>
        [HttpDelete("{id:long}")]
        public async Task<IActionResult> DeleteDraft(long id, CancellationToken ct)
        {
            await _sales.DeleteDraftAsync(await VendorIdAsync(ct), id, ct);
            return Success(new { deleted = true }, "Draft deleted.");
        }
    }
}

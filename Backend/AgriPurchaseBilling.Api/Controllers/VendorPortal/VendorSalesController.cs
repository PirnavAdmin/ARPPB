using AgriPurchaseBilling.Application.DTOs.VendorPortal;
using AgriPurchaseBilling.Application.Interfaces.VendorPortal;
using Microsoft.AspNetCore.Mvc;

namespace AgriPurchaseBilling.Api.Controllers.VendorPortal
{
    /// <summary>"Sell Finished Products" and "Sales History &amp; Invoice Register" screens.</summary>
    [Route("api/v1/vendor/sales")]
    public sealed class VendorSalesController : VendorPortalControllerBase
    {
        private readonly IVendorSalesRepository _sales;
        private readonly IVendorOtpGenerator _otp;
        private readonly IWebHostEnvironment _environment;

        public VendorSalesController(
            IVendorResolver resolver,
            IVendorSalesRepository sales,
            IVendorOtpGenerator otp,
            IWebHostEnvironment environment) : base(resolver)
        {
            _sales = sales;
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

        /// <summary>Sales History register (submitted sales) with search, filters and paging.</summary>
        [HttpGet]
        public async Task<IActionResult> GetSales([FromQuery] SalesQuery query, CancellationToken ct) =>
            Success(await _sales.GetSalesAsync(await VendorIdAsync(ct), "history", query, ct));

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

        /// <summary>Delete a draft sale (the "Cancel" action on an unsent draft).</summary>
        [HttpDelete("{id:long}")]
        public async Task<IActionResult> DeleteDraft(long id, CancellationToken ct)
        {
            await _sales.DeleteDraftAsync(await VendorIdAsync(ct), id, ct);
            return Success(new { deleted = true }, "Draft deleted.");
        }
    }
}

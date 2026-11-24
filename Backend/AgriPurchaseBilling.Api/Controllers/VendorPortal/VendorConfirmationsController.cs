using AgriPurchaseBilling.Application.DTOs.VendorPortal;
using AgriPurchaseBilling.Application.Interfaces.VendorPortal;
using Microsoft.AspNetCore.Mvc;

namespace AgriPurchaseBilling.Api.Controllers.VendorPortal
{
    /// <summary>"OTP Confirmations &amp; Transaction Security" screen (Farmer / Middleman / Customer tabs).</summary>
    [Route("api/v1/vendor/confirmations")]
    public sealed class VendorConfirmationsController : VendorPortalControllerBase
    {
        private const string CsvFileName = "Vendor_OTP_Confirmations_Log.csv";
        private const int AllConfirmationsPageSize = 200;

        private readonly IVendorConfirmationsRepository _confirmations;
        private readonly IVendorOtpGenerator _otp;
        private readonly IWebHostEnvironment _environment;

        public VendorConfirmationsController(
            IVendorResolver resolver,
            IVendorConfirmationsRepository confirmations,
            IVendorOtpGenerator otp,
            IWebHostEnvironment environment) : base(resolver)
        {
            _confirmations = confirmations;
            _otp = otp;
            _environment = environment;
        }

        /// <summary>KPI cards and tab counts (Farmer / Middleman / Customer / All).</summary>
        [HttpGet("summary")]
        public async Task<IActionResult> GetSummary(CancellationToken ct) =>
            Success(await _confirmations.GetSummaryAsync(await VendorIdAsync(ct), ct));

        /// <summary>
        /// Confirmations table: category tab, OTP status (Sent / Pending, Verified, Failed, Expired, Cancelled), search,
        /// date range, sort, paging. Unless pageSize is given, up to 200 rows are returned so the screen can page and
        /// filter them itself.
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetConfirmations([FromQuery] OtpQuery query, CancellationToken ct)
        {
            // Query keys are case-insensitive.
            if (!Request.Query.ContainsKey("pageSize"))
            {
                query.PageSize = AllConfirmationsPageSize;
            }
            return Success(await _confirmations.GetAsync(await VendorIdAsync(ct), query, ct));
        }

        /// <summary>
        /// "Export OTP Audit Log": downloads Vendor_OTP_Confirmations_Log.csv with the 13 screen columns for every
        /// confirmation matching the same filters as the table (no paging). Mobile numbers stay masked.
        /// </summary>
        [HttpGet("export")]
        public async Task<IActionResult> Export([FromQuery] OtpQuery query, CancellationToken ct)
        {
            var rows = await _confirmations.ExportAsync(await VendorIdAsync(ct), query, ct);
            return File(VendorOtpMapper.ToCsv(rows), "text/csv; charset=utf-8", CsvFileName);
        }

        /// <summary>Tabs (with counts) and the Category, OTP Status and Time dropdowns.</summary>
        [HttpGet("filters")]
        public async Task<IActionResult> GetFilters(CancellationToken ct) =>
            Success(await _confirmations.GetFilterOptionsAsync(await VendorIdAsync(ct), ct));

        /// <summary>One confirmation (the "Details" button).</summary>
        [HttpGet("{id:long}")]
        public async Task<IActionResult> GetConfirmation(long id, CancellationToken ct)
        {
            var row = await _confirmations.GetByIdAsync(await VendorIdAsync(ct), id, ct);
            return row is null ? NotFoundResponse("OTP confirmation not found.") : Success(row);
        }

        /// <summary>Raises an OTP confirmation for a farmer / middleman purchase or a customer transaction.</summary>
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateOtpConfirmationRequest request, CancellationToken ct)
        {
            var (otp, hash) = _otp.Generate();
            var row = await _confirmations.CreateAsync(await VendorIdAsync(ct), request, hash, _otp.ExpiryMinutes, ct);
            return Success(row, "OTP sent for confirmation.", _environment.IsDevelopment() ? otp : null);
        }

        /// <summary>Verifies the OTP entered by the party (5 attempts, then the OTP must be resent).</summary>
        [HttpPost("{id:long}/verify")]
        public async Task<IActionResult> Verify(long id, [FromBody] VerifyOtpRequest request, CancellationToken ct) =>
            Success(await _confirmations.VerifyAsync(await VendorIdAsync(ct), id, request.Otp, ct), "Transaction verified.");

        /// <summary>Issues a fresh OTP and resets attempts / expiry.</summary>
        [HttpPost("{id:long}/resend")]
        public async Task<IActionResult> Resend(long id, CancellationToken ct)
        {
            var (otp, hash) = _otp.Generate();
            var row = await _confirmations.ResendAsync(await VendorIdAsync(ct), id, hash, _otp.ExpiryMinutes, ct);
            return Success(row, "A new OTP has been sent.", _environment.IsDevelopment() ? otp : null);
        }
    }
}

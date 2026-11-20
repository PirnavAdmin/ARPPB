using System;
using System.IO;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using AgriPurchaseBilling.Application.DTOs;
using AgriPurchaseBilling.Application.DTOs.VendorOperations;
using AgriPurchaseBilling.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;

namespace AgriPurchaseBilling.Api.Controllers
{
    [ApiController]
    [Authorize(Roles = "Vendor")]
    [Route("api/v1/vendor/dashboard")]
    [Produces("application/json")]
    public sealed class VendorDashboardController : ControllerBase
    {
        private readonly IVendorDashboardService _dashboardService;
        private readonly IWebHostEnvironment _environment;
        private readonly IConfiguration _configuration;

        public VendorDashboardController(IVendorDashboardService dashboardService, IWebHostEnvironment environment, IConfiguration configuration)
        {
            _dashboardService = dashboardService;
            _environment = environment;
            _configuration = configuration;
        }

        private long CurrentVendorId
        {
            get
            {
                var value = User.FindFirstValue(ClaimTypes.NameIdentifier);
                return long.TryParse(value, out var userId) && userId > 0 ? userId : 1;
            }
        }

        [HttpGet]
        [ProducesResponseType(typeof(ApiResponse<VendorDashboardDto>), 200)]
        [ProducesResponseType(typeof(ApiResponse<VendorDashboardDto>), 400)]
        public async Task<IActionResult> GetDashboard(
            [FromQuery] DateTime? fromDate,
            [FromQuery] DateTime? toDate,
            CancellationToken cancellationToken)
        {
            if (!IsValidRange(fromDate, toDate))
                return BadRequest(ApiResponse<VendorDashboardDto>.Fail("fromDate must be earlier than or equal to toDate."));

            var dashboard = await _dashboardService.GetDashboardAsync(
                CurrentVendorId, fromDate, toDate, CanExposeSandboxOtps, cancellationToken);
            return Ok(ApiResponse<VendorDashboardDto>.Ok(dashboard, "Vendor dashboard retrieved successfully."));
        }

        [HttpGet("transactions")]
        [ProducesResponseType(typeof(ApiResponse<VendorDashboardTransactionPageDto>), 200)]
        [ProducesResponseType(typeof(ApiResponse<VendorDashboardTransactionPageDto>), 400)]
        public async Task<IActionResult> GetTransactions(
            [FromQuery] VendorDashboardTransactionQueryDto query,
            CancellationToken cancellationToken)
        {
            if (!IsValidRange(query.FromDate, query.ToDate))
                return BadRequest(ApiResponse<VendorDashboardTransactionPageDto>.Fail("fromDate must be earlier than or equal to toDate."));

            var page = await _dashboardService.GetTransactionsAsync(CurrentVendorId, query, cancellationToken);
            return Ok(ApiResponse<VendorDashboardTransactionPageDto>.Ok(page, "Vendor transactions retrieved successfully."));
        }

        [HttpGet("search")]
        [ProducesResponseType(typeof(ApiResponse<System.Collections.Generic.List<VendorDashboardSearchResultDto>>), 200)]
        [ProducesResponseType(typeof(ApiResponse<System.Collections.Generic.List<VendorDashboardSearchResultDto>>), 400)]
        public async Task<IActionResult> Search(
            [FromQuery] string q,
            [FromQuery] int take = 20,
            CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrWhiteSpace(q))
                return BadRequest(ApiResponse<System.Collections.Generic.List<VendorDashboardSearchResultDto>>.Fail("Search query q is required."));

            var results = await _dashboardService.SearchAsync(CurrentVendorId, q, take, cancellationToken);
            return Ok(ApiResponse<System.Collections.Generic.List<VendorDashboardSearchResultDto>>.Ok(results, "Vendor dashboard search completed."));
        }

        [HttpGet("otp-confirmations")]
        [ProducesResponseType(typeof(ApiResponse<VendorDashboardOtpQueueDto>), 200)]
        public async Task<IActionResult> GetOtpConfirmations(
            [FromQuery] DateTime? fromDate,
            [FromQuery] DateTime? toDate,
            CancellationToken cancellationToken)
        {
            if (!IsValidRange(fromDate, toDate))
                return BadRequest(ApiResponse<VendorDashboardOtpQueueDto>.Fail("fromDate must be earlier than or equal to toDate."));

            var items = await _dashboardService.GetPendingOtpConfirmationsAsync(
                CurrentVendorId, fromDate, toDate, CanExposeSandboxOtps, cancellationToken);
            return Ok(ApiResponse<VendorDashboardOtpQueueDto>.Ok(new VendorDashboardOtpQueueDto
            {
                PendingCount = items.Count,
                Items = items
            }, "Pending OTP confirmations retrieved successfully."));
        }

        [HttpPost("otp-confirmations/{partnerType}/{confirmationId:long}/verify")]
        [ProducesResponseType(typeof(ApiResponse<VendorDashboardOtpVerificationDto>), 200)]
        [ProducesResponseType(typeof(ApiResponse<VendorDashboardOtpVerificationDto>), 400)]
        public async Task<IActionResult> VerifyOtp(
            string partnerType,
            long confirmationId,
            [FromBody] VerifyVendorDashboardOtpRequest request,
            CancellationToken cancellationToken)
        {
            if (string.IsNullOrWhiteSpace(request.Otp))
                return BadRequest(ApiResponse<VendorDashboardOtpVerificationDto>.Fail("OTP is required."));

            var result = await _dashboardService.VerifyOtpAsync(
                CurrentVendorId, partnerType, confirmationId, request.Otp, cancellationToken);
            return result == null
                ? BadRequest(ApiResponse<VendorDashboardOtpVerificationDto>.Fail("The OTP is invalid, expired, already verified, or unavailable."))
                : Ok(ApiResponse<VendorDashboardOtpVerificationDto>.Ok(result, "OTP confirmation verified successfully."));
        }

        [HttpGet("transactions/export")]
        [Produces("text/csv")]
        public async Task<IActionResult> ExportTransactions(
            [FromQuery] VendorDashboardTransactionQueryDto query,
            CancellationToken cancellationToken)
        {
            if (!IsValidRange(query.FromDate, query.ToDate))
                return BadRequest(ApiResponse<string>.Fail("fromDate must be earlier than or equal to toDate."));

            var rows = new System.Collections.Generic.List<VendorDashboardTransactionDto>();
            query.PageSize = 100;
            query.Page = 1;
            VendorDashboardTransactionPageDto page;
            do
            {
                page = await _dashboardService.GetTransactionsAsync(CurrentVendorId, query, cancellationToken);
                rows.AddRange(page.Items);
                query.Page++;
            } while (page.Items.Count == page.PageSize);

            var csv = new StringBuilder();
            csv.AppendLine("TransactionId,Date,Party,Type,Product,Quantity,Unit,Amount,DueAmount,Status,OtpStatus,ExpectedPaymentDate");
            foreach (var row in rows)
            {
                csv.AppendLine(string.Join(",", new[]
                {
                    Csv(row.TransactionId), Csv(row.Date.ToString("O")), Csv(row.PartyName), Csv(row.Type), Csv(row.Product),
                    Csv(row.Quantity.ToString(System.Globalization.CultureInfo.InvariantCulture)), Csv(row.Unit),
                    Csv(row.Amount.ToString(System.Globalization.CultureInfo.InvariantCulture)),
                    Csv(row.DueAmount?.ToString(System.Globalization.CultureInfo.InvariantCulture) ?? string.Empty),
                    Csv(row.Status), Csv(row.OtpStatus), Csv(row.ExpectedPaymentDate?.ToString("O") ?? string.Empty)
                }));
            }

            return File(Encoding.UTF8.GetBytes(csv.ToString()), "text/csv", $"vendor-transactions-{DateTime.UtcNow:yyyyMMdd}.csv");
        }

        private static bool IsValidRange(DateTime? fromDate, DateTime? toDate) =>
            !fromDate.HasValue || !toDate.HasValue || fromDate.Value.Date <= toDate.Value.Date;

        private bool CanExposeSandboxOtps =>
            _environment.IsDevelopment() && _configuration.GetValue<bool>("VendorDashboard:ExposeSandboxOtps");

        private static string Csv(string value) => $"\"{(value ?? string.Empty).Replace("\"", "\"\"")}\"";
    }

    public sealed class VendorDashboardOtpQueueDto
    {
        public int PendingCount { get; set; }
        public System.Collections.Generic.List<VendorDashboardOtpConfirmationDto> Items { get; set; } = new();
    }
}

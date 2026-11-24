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
        [ProducesResponseType(typeof(ApiResponse<VendorDashboardTransactionPageDto>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetTransactions(
            [FromQuery] VendorDashboardTransactionQueryDto query,
            CancellationToken cancellationToken)
        {
            var result = await _dashboardService.GetTransactionsAsync(CurrentVendorId, query, cancellationToken);
            return Ok(ApiResponse<VendorDashboardTransactionPageDto>.Ok(result, "Transactions retrieved successfully."));
        }

        [HttpGet("search")]
        [ProducesResponseType(typeof(ApiResponse<List<VendorDashboardSearchResultDto>>), StatusCodes.Status200OK)]
        public async Task<IActionResult> Search(
            [FromQuery] string? q = null,
            [FromQuery] string? search = null,
            [FromQuery] int take = 20,
            CancellationToken cancellationToken = default)
        {
            var query = !string.IsNullOrWhiteSpace(q) ? q : search ?? string.Empty;
            var results = await _dashboardService.SearchAsync(CurrentVendorId, query, take, cancellationToken);
            return Ok(ApiResponse<List<VendorDashboardSearchResultDto>>.Ok(results, "Dashboard search completed successfully."));
        }

        [HttpGet("otp-confirmations")]
        [ProducesResponseType(typeof(ApiResponse<List<VendorDashboardOtpConfirmationDto>>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetOtpConfirmations(
            [FromQuery] DateTime? fromDate,
            [FromQuery] DateTime? toDate,
            CancellationToken cancellationToken)
        {
            var list = await _dashboardService.GetPendingOtpConfirmationsAsync(
                CurrentVendorId, fromDate, toDate, CanExposeSandboxOtps, cancellationToken);
            return Ok(ApiResponse<List<VendorDashboardOtpConfirmationDto>>.Ok(list, "Pending OTP confirmations retrieved successfully."));
        }

        [HttpPost("otp-confirmations/{partnerType}/{confirmationId}/verify")]
        [ProducesResponseType(typeof(ApiResponse<VendorDashboardOtpVerificationDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<VendorDashboardOtpVerificationDto>), StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> VerifyOtp(
            string partnerType,
            long confirmationId,
            [FromBody] VerifyVendorDashboardOtpRequest request,
            CancellationToken cancellationToken)
        {
            var result = await _dashboardService.VerifyOtpAsync(
                CurrentVendorId, partnerType, confirmationId, request?.Otp ?? string.Empty, cancellationToken);

            if (result == null || !result.Verified)
            {
                return BadRequest(ApiResponse<VendorDashboardOtpVerificationDto>.Fail("OTP verification failed or confirmation not found."));
            }

            return Ok(ApiResponse<VendorDashboardOtpVerificationDto>.Ok(result, "OTP verified successfully."));
        }

        [HttpGet("transactions/export")]
        public async Task<IActionResult> ExportTransactions(
            [FromQuery] VendorDashboardTransactionQueryDto query,
            CancellationToken cancellationToken)
        {
            query.Page = 1;
            query.PageSize = 5000;
            var result = await _dashboardService.GetTransactionsAsync(CurrentVendorId, query, cancellationToken);

            var sb = new StringBuilder();
            sb.AppendLine("TransactionId,Date,PartyName,Type,Product,Quantity,Unit,Amount,DueAmount,Status,OtpStatus");
            foreach (var item in result.Items)
            {
                sb.AppendLine($"\"{item.TransactionId}\",\"{item.Date:yyyy-MM-dd}\",\"{item.PartyName}\",\"{item.Type}\",\"{item.Product}\",{item.Quantity},\"{item.Unit}\",{item.Amount},{item.DueAmount?.ToString() ?? "0.00"},\"{item.Status}\",\"{item.OtpStatus}\"");
            }

            var bytes = Encoding.UTF8.GetBytes(sb.ToString());
            return File(bytes, "text/csv", $"dashboard-transactions-{DateTime.UtcNow:yyyyMMdd}.csv");
        }

        private static bool IsValidRange(DateTime? fromDate, DateTime? toDate) =>
            !fromDate.HasValue || !toDate.HasValue || fromDate.Value.Date <= toDate.Value.Date;

        private bool CanExposeSandboxOtps =>
            _environment.IsDevelopment() && _configuration.GetValue<bool>("VendorDashboard:ExposeSandboxOtps");
    }
}

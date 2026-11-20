using System.Security.Claims;
using AgriPurchaseBilling.Application.DTOs;
using AgriPurchaseBilling.Application.DTOs.VendorOperations;
using AgriPurchaseBilling.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace AgriPurchaseBilling.Api.Controllers
{
    [ApiController]
    [Authorize(Roles = "Vendor")]
    [Route("api/v1/vendor/partners/middlemen")]
    [Produces("application/json")]
    public sealed class VendorMiddlemenController : ControllerBase
    {
        private readonly IVendorPartnersService _partnersService;

        public VendorMiddlemenController(IVendorPartnersService partnersService)
        {
            _partnersService = partnersService;
        }

        private long CurrentVendorId
        {
            get
            {
                var value = User.FindFirstValue(ClaimTypes.NameIdentifier);
                return long.TryParse(value, out var userId) && userId > 0 ? userId : 1;
            }
        }

        [HttpGet("overview")]
        [ProducesResponseType(typeof(ApiResponse<VendorMiddlemenOverviewDto>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetOverview(CancellationToken cancellationToken)
        {
            var overview = await _partnersService.GetMiddlemenOverviewAsync(CurrentVendorId, cancellationToken);
            return Ok(ApiResponse<VendorMiddlemenOverviewDto>.Ok(overview, "Middlemen overview retrieved successfully."));
        }

        [HttpGet]
        [ProducesResponseType(typeof(ApiResponse<List<VendorMiddlemanSummaryDto>>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetMiddlemen(
            [FromQuery] string? search = null,
            [FromQuery] string? district = null,
            [FromQuery] string? state = null,
            [FromQuery] string? status = null,
            CancellationToken cancellationToken = default)
        {
            var middlemen = await _partnersService.GetMiddlemenAsync(
                CurrentVendorId, search, district, state, status, cancellationToken);
            return Ok(ApiResponse<List<VendorMiddlemanSummaryDto>>.Ok(middlemen, "Middlemen list retrieved successfully."));
        }

        [HttpGet("{middlemanId}")]
        [ProducesResponseType(typeof(ApiResponse<VendorMiddlemanDetailDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<VendorMiddlemanDetailDto>), StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetMiddlemanById(string middlemanId, CancellationToken cancellationToken)
        {
            var middleman = await _partnersService.GetMiddlemanByIdAsync(CurrentVendorId, middlemanId, cancellationToken);
            return middleman == null
                ? NotFound(ApiResponse<VendorMiddlemanDetailDto>.Fail("Middleman not found."))
                : Ok(ApiResponse<VendorMiddlemanDetailDto>.Ok(middleman, "Middleman profile retrieved successfully."));
        }

        [HttpPost]
        [ProducesResponseType(typeof(ApiResponse<VendorMiddlemanDetailDto>), StatusCodes.Status201Created)]
        [ProducesResponseType(typeof(ApiResponse<VendorMiddlemanDetailDto>), StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> CreateMiddleman(
            [FromBody] CreateVendorMiddlemanRequest request,
            CancellationToken cancellationToken)
        {
            var created = await _partnersService.CreateMiddlemanAsync(CurrentVendorId, request, cancellationToken);
            return CreatedAtAction(nameof(GetMiddlemanById), new { middlemanId = created.MiddlemanCode },
                ApiResponse<VendorMiddlemanDetailDto>.Ok(created, "Middleman registered successfully."));
        }

        [HttpPut("{middlemanId}")]
        [ProducesResponseType(typeof(ApiResponse<VendorMiddlemanDetailDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<VendorMiddlemanDetailDto>), StatusCodes.Status404NotFound)]
        public async Task<IActionResult> UpdateMiddleman(
            string middlemanId,
            [FromBody] UpdateVendorMiddlemanRequest request,
            CancellationToken cancellationToken)
        {
            var updated = await _partnersService.UpdateMiddlemanAsync(CurrentVendorId, middlemanId, request, cancellationToken);
            return updated == null
                ? NotFound(ApiResponse<VendorMiddlemanDetailDto>.Fail("Middleman not found."))
                : Ok(ApiResponse<VendorMiddlemanDetailDto>.Ok(updated, "Middleman profile updated successfully."));
        }

        [HttpPatch("{middlemanId}/status")]
        [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status404NotFound)]
        public async Task<IActionResult> ToggleStatus(string middlemanId, CancellationToken cancellationToken)
        {
            var success = await _partnersService.ToggleMiddlemanStatusAsync(CurrentVendorId, middlemanId, cancellationToken);
            return success
                ? Ok(ApiResponse<bool>.Ok(true, "Middleman status toggled successfully."))
                : NotFound(ApiResponse<bool>.Fail("Middleman not found."));
        }

        [HttpGet("{middlemanId}/transactions")]
        [ProducesResponseType(typeof(ApiResponse<List<VendorMiddlemanTransactionDto>>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetMiddlemanTransactions(string middlemanId, CancellationToken cancellationToken)
        {
            var transactions = await _partnersService.GetMiddlemanTransactionsAsync(CurrentVendorId, middlemanId, cancellationToken);
            return Ok(ApiResponse<List<VendorMiddlemanTransactionDto>>.Ok(transactions, "Middleman procurement transactions retrieved successfully."));
        }

        [HttpGet("{middlemanId}/payments")]
        [ProducesResponseType(typeof(ApiResponse<List<VendorMiddlemanPaymentDto>>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetMiddlemanPayments(string middlemanId, CancellationToken cancellationToken)
        {
            var payments = await _partnersService.GetMiddlemanPaymentsAsync(CurrentVendorId, middlemanId, cancellationToken);
            return Ok(ApiResponse<List<VendorMiddlemanPaymentDto>>.Ok(payments, "Middleman settlements and ledger retrieved successfully."));
        }

        [HttpGet("{middlemanId}/otp-confirmations")]
        [ProducesResponseType(typeof(ApiResponse<List<VendorMiddlemanOtpLogDto>>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetMiddlemanOtpLogs(string middlemanId, CancellationToken cancellationToken)
        {
            var otpLogs = await _partnersService.GetMiddlemanOtpLogsAsync(CurrentVendorId, middlemanId, cancellationToken);
            return Ok(ApiResponse<List<VendorMiddlemanOtpLogDto>>.Ok(otpLogs, "Middleman OTP confirmations retrieved successfully."));
        }

        [HttpGet("export")]
        public async Task<IActionResult> ExportCsv(CancellationToken cancellationToken)
        {
            var csvBytes = await _partnersService.ExportMiddlemenCsvAsync(CurrentVendorId, cancellationToken);
            return File(csvBytes, "text/csv", $"middlemen-directory-{DateTime.UtcNow:yyyyMMdd}.csv");
        }
    }
}

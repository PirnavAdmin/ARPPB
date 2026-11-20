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
    [Route("api/v1/vendor/partners/farmers")]
    [Produces("application/json")]
    public sealed class VendorFarmersController : ControllerBase
    {
        private readonly IVendorPartnersService _partnersService;

        public VendorFarmersController(IVendorPartnersService partnersService)
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
        [ProducesResponseType(typeof(ApiResponse<VendorFarmersOverviewDto>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetOverview(CancellationToken cancellationToken)
        {
            var overview = await _partnersService.GetFarmersOverviewAsync(CurrentVendorId, cancellationToken);
            return Ok(ApiResponse<VendorFarmersOverviewDto>.Ok(overview, "Farmers overview retrieved successfully."));
        }

        [HttpGet]
        [ProducesResponseType(typeof(ApiResponse<List<VendorFarmerSummaryDto>>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetFarmers(
            [FromQuery] string? search = null,
            [FromQuery] string? district = null,
            [FromQuery] string? state = null,
            [FromQuery] string? crop = null,
            [FromQuery] string? status = null,
            CancellationToken cancellationToken = default)
        {
            var farmers = await _partnersService.GetFarmersAsync(
                CurrentVendorId, search, district, state, crop, status, cancellationToken);
            return Ok(ApiResponse<List<VendorFarmerSummaryDto>>.Ok(farmers, "Farmers list retrieved successfully."));
        }

        [HttpGet("{farmerId}")]
        [ProducesResponseType(typeof(ApiResponse<VendorFarmerDetailDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<VendorFarmerDetailDto>), StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetFarmerById(string farmerId, CancellationToken cancellationToken)
        {
            var farmer = await _partnersService.GetFarmerByIdAsync(CurrentVendorId, farmerId, cancellationToken);
            return farmer == null
                ? NotFound(ApiResponse<VendorFarmerDetailDto>.Fail("Farmer not found."))
                : Ok(ApiResponse<VendorFarmerDetailDto>.Ok(farmer, "Farmer profile retrieved successfully."));
        }

        [HttpPost]
        [ProducesResponseType(typeof(ApiResponse<VendorFarmerDetailDto>), StatusCodes.Status201Created)]
        [ProducesResponseType(typeof(ApiResponse<VendorFarmerDetailDto>), StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> CreateFarmer(
            [FromBody] CreateVendorFarmerRequest request,
            CancellationToken cancellationToken)
        {
            var created = await _partnersService.CreateFarmerAsync(CurrentVendorId, request, cancellationToken);
            return CreatedAtAction(nameof(GetFarmerById), new { farmerId = created.FarmerCode },
                ApiResponse<VendorFarmerDetailDto>.Ok(created, "Farmer registered successfully."));
        }

        [HttpPut("{farmerId}")]
        [ProducesResponseType(typeof(ApiResponse<VendorFarmerDetailDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<VendorFarmerDetailDto>), StatusCodes.Status404NotFound)]
        public async Task<IActionResult> UpdateFarmer(
            string farmerId,
            [FromBody] UpdateVendorFarmerRequest request,
            CancellationToken cancellationToken)
        {
            var updated = await _partnersService.UpdateFarmerAsync(CurrentVendorId, farmerId, request, cancellationToken);
            return updated == null
                ? NotFound(ApiResponse<VendorFarmerDetailDto>.Fail("Farmer not found."))
                : Ok(ApiResponse<VendorFarmerDetailDto>.Ok(updated, "Farmer profile updated successfully."));
        }

        [HttpPatch("{farmerId}/status")]
        [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status404NotFound)]
        public async Task<IActionResult> ToggleStatus(string farmerId, CancellationToken cancellationToken)
        {
            var success = await _partnersService.ToggleFarmerStatusAsync(CurrentVendorId, farmerId, cancellationToken);
            return success
                ? Ok(ApiResponse<bool>.Ok(true, "Farmer status toggled successfully."))
                : NotFound(ApiResponse<bool>.Fail("Farmer not found."));
        }

        [HttpGet("{farmerId}/transactions")]
        [ProducesResponseType(typeof(ApiResponse<List<VendorFarmerTransactionDto>>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetFarmerTransactions(string farmerId, CancellationToken cancellationToken)
        {
            var transactions = await _partnersService.GetFarmerTransactionsAsync(CurrentVendorId, farmerId, cancellationToken);
            return Ok(ApiResponse<List<VendorFarmerTransactionDto>>.Ok(transactions, "Farmer procurement transactions retrieved successfully."));
        }

        [HttpGet("{farmerId}/payments")]
        [ProducesResponseType(typeof(ApiResponse<List<VendorFarmerPaymentDto>>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetFarmerPayments(string farmerId, CancellationToken cancellationToken)
        {
            var payments = await _partnersService.GetFarmerPaymentsAsync(CurrentVendorId, farmerId, cancellationToken);
            return Ok(ApiResponse<List<VendorFarmerPaymentDto>>.Ok(payments, "Farmer payments and ledger retrieved successfully."));
        }

        [HttpGet("{farmerId}/otp-confirmations")]
        [ProducesResponseType(typeof(ApiResponse<List<VendorFarmerOtpLogDto>>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetFarmerOtpLogs(string farmerId, CancellationToken cancellationToken)
        {
            var otpLogs = await _partnersService.GetFarmerOtpLogsAsync(CurrentVendorId, farmerId, cancellationToken);
            return Ok(ApiResponse<List<VendorFarmerOtpLogDto>>.Ok(otpLogs, "Farmer OTP confirmations retrieved successfully."));
        }

        [HttpGet("export")]
        public async Task<IActionResult> ExportCsv(CancellationToken cancellationToken)
        {
            var csvBytes = await _partnersService.ExportFarmersCsvAsync(CurrentVendorId, cancellationToken);
            return File(csvBytes, "text/csv", $"farmers-directory-{DateTime.UtcNow:yyyyMMdd}.csv");
        }
    }
}

using System;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;
using AgriPurchaseBilling.Application.DTOs;
using AgriPurchaseBilling.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Backend.AgriPurchaseBilling.Api.Controllers
{
    /// <summary>
    /// APIs dedicated to the "Sell Farm Products" workflow (Options, Create Sale, OTP Verification, Resend OTP).
    /// </summary>
    [ApiController]
    [Route("api/v1/farmer/sell-products")]
    [Produces("application/json")]
    public class FarmerSellProductsController : ControllerBase
    {
        private readonly IFarmerSellProductService _sellService;

        public FarmerSellProductsController(IFarmerSellProductService sellService)
        {
            _sellService = sellService;
        }

        /// <summary>
        /// Retrieves available crops with stock and buyer categories for the Sell Farm Products form dropdowns.
        /// </summary>
        [HttpGet("options")]
        [HttpGet("/api/v1/farmer/sales/options")]
        [AllowAnonymous]
        [ProducesResponseType(typeof(ApiResponse<SellProductOptionsDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<SellProductOptionsDto>), StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> GetSellOptions(
            [FromQuery] long? userId = null,
            CancellationToken cancellationToken = default)
        {
            long resolvedUserId = ResolveUserId(userId);
            if (resolvedUserId <= 0)
            {
                return Unauthorized(ApiResponse<SellProductOptionsDto>.Fail("Unable to determine authenticated user. Please login or provide userId."));
            }

            var result = await _sellService.GetSellOptionsAsync(resolvedUserId, cancellationToken);
            if (!result.Success)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }

        /// <summary>
        /// Submits the Sell Farm Products form, creates the order in 'Pending OTP Confirmation' status, and generates a 6-digit OTP.
        /// </summary>
        [HttpPost]
        [HttpPost("/api/v1/farmer/sales")]
        [AllowAnonymous]
        [ProducesResponseType(typeof(ApiResponse<SellOrderResponseDto>), StatusCodes.Status201Created)]
        [ProducesResponseType(typeof(ApiResponse<SellOrderResponseDto>), StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> CreateSellOrder(
            [FromBody] CreateSellOrderRequestDto request,
            [FromQuery] long? userId = null,
            CancellationToken cancellationToken = default)
        {
            long resolvedUserId = ResolveUserId(userId);
            if (resolvedUserId <= 0)
            {
                return Unauthorized(ApiResponse<SellOrderResponseDto>.Fail("Unable to determine authenticated user. Please login or provide userId."));
            }

            var result = await _sellService.CreateSellOrderAsync(resolvedUserId, request, cancellationToken);
            if (!result.Success)
            {
                return BadRequest(result);
            }

            return StatusCode(StatusCodes.Status201Created, result);
        }

        /// <summary>
        /// Verifies the 6-digit OTP entered in the OTPModal, confirms the sale order, and atomically deducts the crop stock via Stored Procedure.
        /// Supports numeric ID, OTP code (e.g. OTP-2026-301), and Transaction code (e.g. TXN-2026-0001).
        /// </summary>
        [HttpPost("{id}/verify-otp")]
        [HttpPost("{id}/verify")]
        [HttpPost("/api/v1/farmer/sales/{id}/verify-otp")]
        [HttpPost("/api/v1/farmer/sales/{id}/verify")]
        [AllowAnonymous]
        [ProducesResponseType(typeof(ApiResponse<SellOrderResponseDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<SellOrderResponseDto>), StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> VerifySellOtp(
            [FromRoute] string id,
            [FromBody] VerifySellOtpRequestDto request,
            [FromQuery] long? userId = null,
            CancellationToken cancellationToken = default)
        {
            long resolvedUserId = ResolveUserId(userId);
            if (resolvedUserId <= 0)
            {
                return Unauthorized(ApiResponse<SellOrderResponseDto>.Fail("Unable to determine authenticated user. Please login or provide userId."));
            }

            var result = await _sellService.VerifySellOtpAsync(resolvedUserId, id, request, cancellationToken);
            if (!result.Success)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }

        /// <summary>
        /// Re-issues a fresh 6-digit OTP for a pending sale order via Stored Procedure.
        /// </summary>
        [HttpPost("{id}/resend-otp")]
        [HttpPost("{id}/resend")]
        [HttpPost("/api/v1/farmer/sales/{id}/resend-otp")]
        [HttpPost("/api/v1/farmer/sales/{id}/resend")]
        [AllowAnonymous]
        [ProducesResponseType(typeof(ApiResponse<SellOrderResponseDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<SellOrderResponseDto>), StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> ResendSellOtp(
            [FromRoute] string id,
            [FromQuery] long? userId = null,
            CancellationToken cancellationToken = default)
        {
            long resolvedUserId = ResolveUserId(userId);
            if (resolvedUserId <= 0)
            {
                return Unauthorized(ApiResponse<SellOrderResponseDto>.Fail("Unable to determine authenticated user. Please login or provide userId."));
            }

            var result = await _sellService.ResendSellOtpAsync(resolvedUserId, id, cancellationToken);
            if (!result.Success)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }

        private long ResolveUserId(long? explicitUserId)
        {
            if (explicitUserId.HasValue && explicitUserId.Value > 0)
            {
                return explicitUserId.Value;
            }

            var claim = User.FindFirst(ClaimTypes.NameIdentifier) ?? User.FindFirst("sub") ?? User.FindFirst("userId");
            if (claim != null && long.TryParse(claim.Value, out long parsedId) && parsedId > 0)
            {
                return parsedId;
            }

            return 0;
        }
    }
}

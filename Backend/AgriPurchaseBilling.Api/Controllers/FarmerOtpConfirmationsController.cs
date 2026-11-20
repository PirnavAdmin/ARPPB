using System;
using System.Collections.Generic;
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
    /// APIs dedicated to the "OTP Confirmations &amp; Transaction Security" page:
    /// - Summary KPIs &amp; tab badges: GET /api/v1/farmer/otp-confirmations/summary
    /// - Filterable Authorization Queue: GET /api/v1/farmer/otp-confirmations
    /// - Transaction Details Modal: GET /api/v1/farmer/otp-confirmations/{id}
    /// - Buyer Channels Dropdown: GET /api/v1/farmer/otp-confirmations/channels
    /// - Enter OTP Modal: POST /api/v1/farmer/otp-confirmations/{id}/verify (or /verify-otp)
    /// - Resend OTP Action: POST /api/v1/farmer/otp-confirmations/{id}/resend (or /resend-otp)
    /// - Decline / Reject Action: POST /api/v1/farmer/otp-confirmations/{id}/reject (or /decline)
    /// </summary>
    [ApiController]
    [Route("api/v1/farmer/otp-confirmations")]
    [Produces("application/json")]
    public class FarmerOtpConfirmationsController : ControllerBase
    {
        private readonly IFarmerOtpConfirmationService _otpService;

        public FarmerOtpConfirmationsController(IFarmerOtpConfirmationService otpService)
        {
            _otpService = otpService;
        }

        /// <summary>
        /// Retrieves the 4 KPI summary cards and tab counts displayed at the top of the OTP Confirmations page:
        /// 1. Pending Authorizations (Awaiting 6-digit OTP, Action req.)
        /// 2. Confirmed Transactions (Verified &amp; stock released)
        /// 3. Rejected / Expired (Declined or timed out)
        /// 4. Total Protected Value (Total ₹ secured by OTP handshake)
        /// </summary>
        [HttpGet("summary")]
        [AllowAnonymous]
        [ProducesResponseType(typeof(ApiResponse<FarmerOtpSummaryDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<FarmerOtpSummaryDto>), StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> GetSummary(
            [FromQuery] long? userId = null,
            CancellationToken cancellationToken = default)
        {
            long resolvedUserId = ResolveUserId(userId);
            if (resolvedUserId <= 0)
            {
                return Unauthorized(ApiResponse<FarmerOtpSummaryDto>.Fail("Unable to determine authenticated user. Please login or provide userId."));
            }

            var result = await _otpService.GetSummaryAsync(resolvedUserId, cancellationToken);
            if (!result.Success)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }

        /// <summary>
        /// Retrieves available buyer channels for the channel filter dropdown (All Buyer Channels, Vendors Only, Middlemen Only, Retail Customers).
        /// </summary>
        [HttpGet("channels")]
        [AllowAnonymous]
        [ProducesResponseType(typeof(ApiResponse<List<OptionItemDto>>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetChannels(CancellationToken cancellationToken = default)
        {
            var result = await _otpService.GetChannelsAsync(cancellationToken);
            return Ok(result);
        }

        /// <summary>
        /// Retrieves authorization records displayed in the OTP Confirmations data table with tab, channel, and search filter support.
        /// </summary>
        [HttpGet]
        [AllowAnonymous]
        [ProducesResponseType(typeof(ApiResponse<List<FarmerOtpConfirmationItemDto>>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<List<FarmerOtpConfirmationItemDto>>), StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> GetOtpConfirmations(
            [FromQuery] string? tab = null,
            [FromQuery] string? status = null,
            [FromQuery] string? buyerCategory = null,
            [FromQuery] string? channel = null,
            [FromQuery] string? search = null,
            [FromQuery] long? userId = null,
            CancellationToken cancellationToken = default)
        {
            long resolvedUserId = ResolveUserId(userId);
            if (resolvedUserId <= 0)
            {
                return Unauthorized(ApiResponse<List<FarmerOtpConfirmationItemDto>>.Fail("Unable to determine authenticated user. Please login or provide userId."));
            }

            var filter = new FarmerOtpFilterQueryDto
            {
                Tab = !string.IsNullOrWhiteSpace(tab) ? tab : status,
                BuyerCategory = !string.IsNullOrWhiteSpace(buyerCategory) ? buyerCategory : channel,
                Search = search,
                UserId = resolvedUserId
            };

            var result = await _otpService.GetListAsync(resolvedUserId, filter, cancellationToken);
            if (!result.Success)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }

        /// <summary>
        /// Retrieves the full transaction and audit details of a specific authorization record for the 'Details' modal popup.
        /// Accepts numeric saleId, formatted OTP ID (e.g. OTP-2026-301), or transaction code (TXN-2026-0001).
        /// </summary>
        [HttpGet("{id}")]
        [AllowAnonymous]
        [ProducesResponseType(typeof(ApiResponse<FarmerOtpConfirmationItemDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<FarmerOtpConfirmationItemDto>), StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetOtpConfirmationDetails(
            [FromRoute] string id,
            [FromQuery] long? userId = null,
            CancellationToken cancellationToken = default)
        {
            long resolvedUserId = ResolveUserId(userId);
            if (resolvedUserId <= 0)
            {
                return Unauthorized(ApiResponse<FarmerOtpConfirmationItemDto>.Fail("Unable to determine authenticated user. Please login or provide userId."));
            }

            var result = await _otpService.GetDetailsAsync(resolvedUserId, id, cancellationToken);
            if (!result.Success)
            {
                return NotFound(result);
            }

            return Ok(result);
        }

        /// <summary>
        /// Verifies the 6-digit OTP entered in the 'Enter OTP' modal, confirms the sale, and deducts the crop stock.
        /// Supports both POST .../{id}/verify and POST .../{id}/verify-otp with numeric saleId, OTP ID, or transaction code.
        /// </summary>
        [HttpPost("{id}/verify")]
        [HttpPost("{id}/verify-otp")]
        [AllowAnonymous]
        [ProducesResponseType(typeof(ApiResponse<SellOrderResponseDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<SellOrderResponseDto>), StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> VerifyOtp(
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

            var result = await _otpService.VerifyOtpAsync(resolvedUserId, id, request, cancellationToken);
            if (!result.Success)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }

        /// <summary>
        /// Resends a fresh 6-digit OTP code to the receiving party's registered mobile number (+15 min expiry).
        /// Supports both POST .../{id}/resend and POST .../{id}/resend-otp.
        /// </summary>
        [HttpPost("{id}/resend")]
        [HttpPost("{id}/resend-otp")]
        [AllowAnonymous]
        [ProducesResponseType(typeof(ApiResponse<SellOrderResponseDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<SellOrderResponseDto>), StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> ResendOtp(
            [FromRoute] string id,
            [FromQuery] long? userId = null,
            CancellationToken cancellationToken = default)
        {
            long resolvedUserId = ResolveUserId(userId);
            if (resolvedUserId <= 0)
            {
                return Unauthorized(ApiResponse<SellOrderResponseDto>.Fail("Unable to determine authenticated user. Please login or provide userId."));
            }

            var result = await _otpService.ResendOtpAsync(resolvedUserId, id, cancellationToken);
            if (!result.Success)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }

        /// <summary>
        /// Declines and rejects an authorization record.
        /// Supports both POST .../{id}/reject and POST .../{id}/decline without requiring a request body.
        /// </summary>
        [HttpPost("{id}/reject")]
        [HttpPost("{id}/decline")]
        [AllowAnonymous]
        [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> RejectTransaction(
            [FromRoute] string id,
            [FromQuery] long? userId = null,
            CancellationToken cancellationToken = default)
        {
            long resolvedUserId = ResolveUserId(userId);
            if (resolvedUserId <= 0)
            {
                return Unauthorized(ApiResponse<bool>.Fail("Unable to determine authenticated user. Please login or provide userId."));
            }

            var result = await _otpService.RejectAsync(resolvedUserId, id, cancellationToken);
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

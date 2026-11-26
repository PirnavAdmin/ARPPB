using AgriPurchaseBilling.Application.DTOs;
using AgriPurchaseBilling.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace AgriPurchaseBilling.Api.Controllers
{
    /// <summary>
    /// Customer Portal – OTP Confirmations APIs strictly authorized for Customer users.
    /// Handles viewing OTP requests, verifying 6-digit codes, requesting OTP resend,
    /// and rejecting orders with audit logging.
    /// OTP secrets and hashes are never exposed in API responses or logs.
    /// </summary>
    [ApiController]
    [Authorize(Roles = "Customer")]
    [Route("api/v1/customer/confirmations")]
    [Produces("application/json")]
    public sealed class CustomerConfirmationsController : ControllerBase
    {
        private readonly ICustomerOtpService _otpService;

        public CustomerConfirmationsController(ICustomerOtpService otpService)
        {
            _otpService = otpService;
        }

        /// <summary>
        /// Retrieves paged OTP confirmation requests for the authenticated customer.
        /// Supports search, status filtering, date presets, sorting, and pagination.
        /// </summary>
        [HttpGet]
        [ProducesResponseType(typeof(ApiResponse<CustomerConfirmationPagedDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<CustomerConfirmationPagedDto>), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        public async Task<IActionResult> GetConfirmations(
            [FromQuery] CustomerConfirmationQueryDto query,
            CancellationToken cancellationToken)
        {
            if (!TryGetAuthenticatedCustomerUserId(out long customerUserId))
            {
                return Unauthorized(ApiResponse<CustomerConfirmationPagedDto>.Fail("Invalid or missing customer authentication claim."));
            }

            var result = await _otpService.GetConfirmationsAsync(customerUserId, query, cancellationToken);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        /// <summary>
        /// Retrieves complete confirmation details, seller information, and audit timeline for a specific OTP confirmation.
        /// Strictly isolated to the authenticated customer.
        /// </summary>
        [HttpGet("{id}")]
        [ProducesResponseType(typeof(ApiResponse<CustomerConfirmationDetailDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<CustomerConfirmationDetailDto>), StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        public async Task<IActionResult> GetConfirmationById(
            [FromRoute] string id,
            CancellationToken cancellationToken)
        {
            if (!TryGetAuthenticatedCustomerUserId(out long customerUserId))
            {
                return Unauthorized(ApiResponse<CustomerConfirmationDetailDto>.Fail("Invalid or missing customer authentication claim."));
            }

            var result = await _otpService.GetConfirmationByIdAsync(customerUserId, id, cancellationToken);
            if (!result.Success)
            {
                return NotFound(result);
            }

            return Ok(result);
        }

        /// <summary>
        /// Verifies a 6-digit numeric OTP code for a purchase confirmation.
        /// Enforces max 3 attempts, expiry, and customer ownership.
        /// </summary>
        [HttpPost("{id}/verify")]
        [ProducesResponseType(typeof(ApiResponse<CustomerConfirmationDetailDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<CustomerConfirmationDetailDto>), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        public async Task<IActionResult> VerifyOtp(
            [FromRoute] string id,
            [FromBody] CustomerVerifyOtpRequestDto request,
            CancellationToken cancellationToken)
        {
            if (!TryGetAuthenticatedCustomerUserId(out long customerUserId))
            {
                return Unauthorized(ApiResponse<CustomerConfirmationDetailDto>.Fail("Invalid or missing customer authentication claim."));
            }

            if (!ModelState.IsValid)
            {
                return BadRequest(ApiResponse<CustomerConfirmationDetailDto>.Fail("Please enter a valid 6-digit numeric OTP."));
            }

            var result = await _otpService.VerifyOtpAsync(customerUserId, id, request, cancellationToken);
            if (!result.Success)
            {
                if (result.Message.Contains("not found", StringComparison.OrdinalIgnoreCase))
                {
                    return NotFound(result);
                }
                return BadRequest(result);
            }

            return Ok(result);
        }

        /// <summary>
        /// Issues a fresh 6-digit confirmation OTP. Enforces a 30-second resend cooldown.
        /// </summary>
        [HttpPost("{id}/resend")]
        [ProducesResponseType(typeof(ApiResponse<CustomerConfirmationDetailDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<CustomerConfirmationDetailDto>), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        public async Task<IActionResult> ResendOtp(
            [FromRoute] string id,
            CancellationToken cancellationToken)
        {
            if (!TryGetAuthenticatedCustomerUserId(out long customerUserId))
            {
                return Unauthorized(ApiResponse<CustomerConfirmationDetailDto>.Fail("Invalid or missing customer authentication claim."));
            }

            var result = await _otpService.ResendOtpAsync(customerUserId, id, cancellationToken);
            if (!result.Success)
            {
                if (result.Message.Contains("not found", StringComparison.OrdinalIgnoreCase))
                {
                    return NotFound(result);
                }
                return BadRequest(result);
            }

            return Ok(result);
        }

        /// <summary>
        /// Declines a purchase confirmation and records the customer's rejection reason.
        /// </summary>
        [HttpPost("{id}/reject")]
        [ProducesResponseType(typeof(ApiResponse<CustomerConfirmationDetailDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<CustomerConfirmationDetailDto>), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        public async Task<IActionResult> RejectOtp(
            [FromRoute] string id,
            [FromBody] CustomerRejectOtpRequestDto? request,
            CancellationToken cancellationToken)
        {
            if (!TryGetAuthenticatedCustomerUserId(out long customerUserId))
            {
                return Unauthorized(ApiResponse<CustomerConfirmationDetailDto>.Fail("Invalid or missing customer authentication claim."));
            }

            var result = await _otpService.RejectOtpAsync(customerUserId, id, request ?? new CustomerRejectOtpRequestDto(), cancellationToken);
            if (!result.Success)
            {
                if (result.Message.Contains("not found", StringComparison.OrdinalIgnoreCase))
                {
                    return NotFound(result);
                }
                return BadRequest(result);
            }

            return Ok(result);
        }

        private bool TryGetAuthenticatedCustomerUserId(out long customerUserId)
        {
            string? claimValue = User.FindFirstValue(ClaimTypes.NameIdentifier);
            return long.TryParse(claimValue, out customerUserId) && customerUserId > 0;
        }
    }
}


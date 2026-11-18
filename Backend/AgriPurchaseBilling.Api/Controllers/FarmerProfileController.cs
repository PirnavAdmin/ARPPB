using AgriPurchaseBilling.Application.DTOs;
using AgriPurchaseBilling.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Backend.AgriPurchaseBilling.Api.Controllers
{
    [ApiController]
    [Authorize]
    [Route("api/v1/farmer/profile")]
    [Produces("application/json")]
    public class FarmerProfileController : ControllerBase
    {
        private readonly IFarmerProfileService _farmerProfileService;

        public FarmerProfileController(IFarmerProfileService farmerProfileService)
        {
            _farmerProfileService = farmerProfileService;
        }

        /// <summary>
        /// Fetches all registered Farmer profiles (Admin only).
        /// </summary>
        [HttpGet("all")]
        [Authorize(Roles = "Admin")]
        [ProducesResponseType(typeof(ApiResponse<List<FarmerProfileResponseDto>>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetAllProfiles(CancellationToken cancellationToken)
        {
            var result = await _farmerProfileService.GetAllProfilesAsync(cancellationToken);
            return Ok(result);
        }

        /// <summary>
        /// Fetches the authenticated Farmer's profile (Personal, Farm Location &amp; Land, and Bank details).
        /// </summary>
        [HttpGet]
        [Authorize(Roles = "Farmer")]
        [ProducesResponseType(typeof(ApiResponse<FarmerProfileResponseDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<FarmerProfileResponseDto>), StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ApiResponse<FarmerProfileResponseDto>), StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetProfile(
            [FromQuery] long? userId = null,
            CancellationToken cancellationToken = default)
        {
            long resolvedUserId = ResolveUserId(userId);
            if (resolvedUserId <= 0)
            {
                return Unauthorized(ApiResponse<FarmerProfileResponseDto>.Fail(
                    "Unable to determine the authenticated farmer's user ID."));
            }

            var result = await _farmerProfileService.GetProfileAsync(resolvedUserId, cancellationToken);
            if (!result.Success)
            {
                return NotFound(result);
            }

            return Ok(result);
        }

        /// <summary>
        /// Updates the Farmer's personal name, farm name, land area, and address details.
        /// </summary>
        [HttpPut]
        [Authorize(Roles = "Farmer")]
        [ProducesResponseType(typeof(ApiResponse<FarmerProfileResponseDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<FarmerProfileResponseDto>), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ApiResponse<FarmerProfileResponseDto>), StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ApiResponse<FarmerProfileResponseDto>), StatusCodes.Status404NotFound)]
        public async Task<IActionResult> UpdateProfile(
            [FromQuery] long? userId = null,
            [FromBody] UpdateFarmerProfileRequestDto? request = null,
            CancellationToken cancellationToken = default)
        {
            if (request == null)
            {
                return BadRequest(ApiResponse<FarmerProfileResponseDto>.Fail("Request body cannot be empty."));
            }

            if (!ModelState.IsValid)
            {
                var errors = string.Join("; ", ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage));
                return BadRequest(ApiResponse<FarmerProfileResponseDto>.Fail(errors));
            }

            long resolvedUserId = ResolveUserId(userId);
            if (resolvedUserId <= 0)
            {
                return Unauthorized(ApiResponse<FarmerProfileResponseDto>.Fail(
                    "Unable to determine the authenticated farmer's user ID."));
            }

            var result = await _farmerProfileService.UpdateProfileAsync(resolvedUserId, request, cancellationToken);
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
        /// Retrieves the Farmer's bank account details.
        /// </summary>
        [HttpGet("bank-details")]
        [Authorize(Roles = "Farmer")]
        [ProducesResponseType(typeof(ApiResponse<BankDetailsDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<BankDetailsDto>), StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ApiResponse<BankDetailsDto>), StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetBankDetails(
            [FromQuery] bool reveal = false,
            [FromQuery] long? userId = null,
            CancellationToken cancellationToken = default)
        {
            long resolvedUserId = ResolveUserId(userId);
            if (resolvedUserId <= 0)
            {
                return Unauthorized(ApiResponse<BankDetailsDto>.Fail(
                    "Unable to determine the authenticated farmer's user ID."));
            }

            var result = await _farmerProfileService.GetBankDetailsAsync(resolvedUserId, reveal, cancellationToken);
            if (!result.Success)
            {
                return NotFound(result);
            }

            return Ok(result);
        }

        /// <summary>
        /// Updates or creates the Farmer's bank account details.
        /// </summary>
        [HttpPut("bank-details")]
        [Authorize(Roles = "Farmer")]
        [ProducesResponseType(typeof(ApiResponse<BankDetailsDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<BankDetailsDto>), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ApiResponse<BankDetailsDto>), StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ApiResponse<BankDetailsDto>), StatusCodes.Status404NotFound)]
        public async Task<IActionResult> UpdateBankDetails(
            [FromQuery] long? userId = null,
            [FromBody] UpdateBankDetailsRequestDto? request = null,
            CancellationToken cancellationToken = default)
        {
            if (request == null)
            {
                return BadRequest(ApiResponse<BankDetailsDto>.Fail("Request body cannot be empty."));
            }

            if (!ModelState.IsValid)
            {
                var errors = string.Join("; ", ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage));
                return BadRequest(ApiResponse<BankDetailsDto>.Fail(errors));
            }

            long resolvedUserId = ResolveUserId(userId);
            if (resolvedUserId <= 0)
            {
                return Unauthorized(ApiResponse<BankDetailsDto>.Fail(
                    "Unable to determine the authenticated farmer's user ID."));
            }

            var result = await _farmerProfileService.UpdateBankDetailsAsync(resolvedUserId, request, cancellationToken);
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
        /// Sends a 6-digit verification OTP to a NEW mobile number when a farmer requests to change their number.
        /// </summary>
        [HttpPost("change-mobile/send-otp")]
        [Authorize(Roles = "Farmer")]
        [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status409Conflict)]
        public async Task<IActionResult> SendMobileChangeOtp(
            [FromQuery] long? userId = null,
            [FromBody] SendMobileChangeOtpRequestDto? request = null,
            CancellationToken cancellationToken = default)
        {
            if (request == null)
            {
                return BadRequest(ApiResponse<string>.Fail("Request payload cannot be empty."));
            }

            long resolvedUserId = ResolveUserId(userId);
            if (resolvedUserId <= 0)
            {
                return Unauthorized(ApiResponse<string>.Fail(
                    "Unable to determine the authenticated farmer's user ID."));
            }

            var result = await _farmerProfileService.SendMobileChangeOtpAsync(resolvedUserId, request.NewMobile, cancellationToken);
            if (!result.Success)
            {
                if (result.Message.Contains("already registered", StringComparison.OrdinalIgnoreCase))
                {
                    return Conflict(result);
                }
                return BadRequest(result);
            }

            return Ok(result);
        }

        /// <summary>
        /// Verifies the OTP sent to the NEW mobile number and permanently updates the farmer's primary mobile.
        /// </summary>
        [HttpPost("change-mobile/verify-otp")]
        [Authorize(Roles = "Farmer")]
        [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status409Conflict)]
        public async Task<IActionResult> VerifyMobileChangeOtp(
            [FromQuery] long? userId = null,
            [FromBody] VerifyMobileChangeOtpRequestDto? request = null,
            CancellationToken cancellationToken = default)
        {
            if (request == null)
            {
                return BadRequest(ApiResponse<string>.Fail("Request payload cannot be empty."));
            }

            long resolvedUserId = ResolveUserId(userId);
            if (resolvedUserId <= 0)
            {
                return Unauthorized(ApiResponse<string>.Fail(
                    "Unable to determine the authenticated farmer's user ID."));
            }

            var result = await _farmerProfileService.VerifyMobileChangeOtpAsync(resolvedUserId, request.NewMobile, request.Otp, cancellationToken);
            if (!result.Success)
            {
                if (result.Message.Contains("already registered", StringComparison.OrdinalIgnoreCase))
                {
                    return Conflict(result);
                }
                return BadRequest(result);
            }

            return Ok(result);
        }


        /// <summary>
        /// Changes the Farmer's account password.
        /// </summary>
        [HttpPost("change-password")]
        [Authorize(Roles = "Farmer")]
        [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status404NotFound)]
        public async Task<IActionResult> ChangePassword(
            [FromQuery] long? userId = null,
            [FromBody] ChangeFarmerPasswordRequestDto? request = null,
            CancellationToken cancellationToken = default)
        {
            if (request == null)
            {
                return BadRequest(ApiResponse<string>.Fail("Request body cannot be empty."));
            }

            long resolvedUserId = ResolveUserId(userId);
            if (resolvedUserId <= 0)
            {
                return Unauthorized(ApiResponse<string>.Fail(
                    "Unable to determine the authenticated farmer's user ID."));
            }

            var result = await _farmerProfileService.ChangePasswordAsync(resolvedUserId, request, cancellationToken);
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

        private long ResolveUserId(long? _)
        {
            if (User?.Identity?.IsAuthenticated == true)
            {
                var idClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                           ?? User.FindFirst("id")?.Value
                           ?? User.FindFirst("userId")?.Value
                           ?? User.FindFirst("sub")?.Value;

                if (!string.IsNullOrEmpty(idClaim) && long.TryParse(idClaim, out var authUserId))
                {
                    return authUserId;
                }
            }

            return 0;
        }
    }
}

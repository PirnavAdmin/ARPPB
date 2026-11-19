using System.Security.Claims;
using AgriPurchaseBilling.Application.DTOs;
using AgriPurchaseBilling.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AgriPurchaseBilling.Api.Controllers
{
    [ApiController]
    [Authorize(Roles = "Vendor")]
    [Route("api/v1/vendor/profile")]
    [Produces("application/json")]
    public sealed class VendorProfileController : ControllerBase
    {
        private readonly IVendorProfileService _profileService;
        private readonly IVendorMobileChangeService _mobileChangeService;

        public VendorProfileController(
            IVendorProfileService profileService,
            IVendorMobileChangeService mobileChangeService)
        {
            _profileService = profileService;
            _mobileChangeService = mobileChangeService;
        }

        [HttpGet]
        [ProducesResponseType(typeof(ApiResponse<VendorProfileDto>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetMyProfile(CancellationToken cancellationToken)
        {
            if (CurrentUserId is not long userId) return Unauthorized();

            var profile = await _profileService.GetMyProfileAsync(userId, cancellationToken);
            return profile == null
                ? NotFound(ApiResponse<VendorProfileDto>.Fail("Vendor profile not found."))
                : Ok(ApiResponse<VendorProfileDto>.Ok(profile, "Vendor profile retrieved successfully."));
        }

        [HttpPut]
        [ProducesResponseType(typeof(ApiResponse<VendorProfileDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<VendorProfileDto>), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ApiResponse<VendorProfileDto>), StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ApiResponse<VendorProfileDto>), StatusCodes.Status404NotFound)]
        public async Task<IActionResult> UpdateProfile(
            [FromBody] UpdateVendorProfileRequest request,
            CancellationToken cancellationToken)
        {
            if (CurrentUserId is not long userId) return Unauthorized();

            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values
                    .SelectMany(v => v.Errors)
                    .Select(e => e.ErrorMessage)
                    .ToList();
                return BadRequest(ApiResponse<VendorProfileDto>.Fail("Validation failed.", errors));
            }

            try
            {
                var updated = await _profileService.UpdateProfileAsync(userId, request, cancellationToken);
                return updated == null
                    ? NotFound(ApiResponse<VendorProfileDto>.Fail("Vendor profile not found."))
                    : Ok(ApiResponse<VendorProfileDto>.Ok(updated, "Vendor profile updated successfully."));
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ApiResponse<VendorProfileDto>.Fail(ex.Message));
            }
            catch (InvalidOperationException ex)
            {
                return Conflict(ApiResponse<VendorProfileDto>.Fail(ex.Message));
            }
        }

        [HttpGet("bank-details")]
        [ProducesResponseType(typeof(ApiResponse<VendorBankDetailsDto>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetBankDetails(
            [FromQuery] bool reveal = false,
            CancellationToken cancellationToken = default)
        {
            if (CurrentUserId is not long userId) return Unauthorized();

            var details = await _profileService.GetBankDetailsAsync(userId, reveal, cancellationToken);
            return details == null
                ? NotFound(ApiResponse<VendorBankDetailsDto>.Fail("Vendor profile not found."))
                : Ok(ApiResponse<VendorBankDetailsDto>.Ok(details, "Bank details retrieved successfully."));
        }

        [HttpPut("bank-details")]
        [ProducesResponseType(typeof(ApiResponse<VendorBankDetailsDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<VendorBankDetailsDto>), StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> UpdateBankDetails(
            [FromBody] UpdateVendorBankDetailsRequest request,
            CancellationToken cancellationToken)
        {
            if (CurrentUserId is not long userId) return Unauthorized();

            try
            {
                var details = await _profileService.UpdateBankDetailsAsync(
                    userId, request, cancellationToken);
                return details == null
                    ? NotFound(ApiResponse<VendorBankDetailsDto>.Fail("Vendor profile not found."))
                    : Ok(ApiResponse<VendorBankDetailsDto>.Ok(details, "Bank details updated successfully."));
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ApiResponse<VendorBankDetailsDto>.Fail(ex.Message));
            }
        }

        [HttpPost("mobile-change/request-otp")]
        [ProducesResponseType(typeof(ApiResponse<VendorMobileChangeOtpDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<VendorMobileChangeOtpDto>), StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> RequestMobileChangeOtp(
            [FromBody] RequestVendorMobileChangeDto request,
            CancellationToken cancellationToken)
        {
            if (CurrentUserId is not long userId) return Unauthorized();

            try
            {
                var result = await _mobileChangeService.RequestAsync(
                    userId, request.NewMobile, cancellationToken);
                if (result == null)
                {
                    return NotFound(ApiResponse<VendorMobileChangeOtpDto>.Fail("Vendor profile not found."));
                }

                var response = ApiResponse<VendorMobileChangeOtpDto>.Ok(
                    result, $"OTP requested for {result.MaskedNewMobile}.");
                response.DevOtp = result.DevOtp;
                return Ok(response);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ApiResponse<VendorMobileChangeOtpDto>.Fail(ex.Message));
            }
            catch (InvalidOperationException ex)
            {
                return StatusCode(
                    StatusCodes.Status503ServiceUnavailable,
                    ApiResponse<VendorMobileChangeOtpDto>.Fail(ex.Message));
            }
        }

        [HttpPost("mobile-change/verify-otp")]
        [ProducesResponseType(typeof(ApiResponse<VendorMobileChangeResultDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<VendorMobileChangeResultDto>), StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> VerifyMobileChangeOtp(
            [FromBody] VerifyVendorMobileChangeDto request,
            CancellationToken cancellationToken)
        {
            if (CurrentUserId is not long userId) return Unauthorized();

            try
            {
                var result = await _mobileChangeService.VerifyAsync(
                    userId, request.NewMobile, request.Otp, cancellationToken);
                return result == null
                    ? NotFound(ApiResponse<VendorMobileChangeResultDto>.Fail("Vendor profile not found."))
                    : Ok(ApiResponse<VendorMobileChangeResultDto>.Ok(
                        result, "Mobile number verified and updated successfully."));
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ApiResponse<VendorMobileChangeResultDto>.Fail(ex.Message));
            }
            catch (InvalidOperationException ex)
            {
                return StatusCode(
                    StatusCodes.Status503ServiceUnavailable,
                    ApiResponse<VendorMobileChangeResultDto>.Fail(ex.Message));
            }
        }

        private long? CurrentUserId
        {
            get
            {
                var value = User.FindFirstValue(ClaimTypes.NameIdentifier);
                return long.TryParse(value, out var userId) ? userId : null;
            }
        }
    }
}

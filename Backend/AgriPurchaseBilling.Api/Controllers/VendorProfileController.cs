using System.Security.Claims;
using AgriPurchaseBilling.Application.DTOs;
using AgriPurchaseBilling.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AgriPurchaseBilling.Api.Controllers
{
    /// <summary>
    /// "My Vendor Profile &amp; Treasury Settings" screen: business and statutory profile, business logo,
    /// settlement bank details and the OTP-verified mobile change. A vendor can only see and change their own profile.
    /// </summary>
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

        // ------------------------------------------------------------------
        // Business & statutory profile
        // ------------------------------------------------------------------

        /// <summary>
        /// The logged-in vendor's own profile: header (name, status, location, Vendor ID, GSTIN,
        /// compliance status and "last updated"), the business form values, masked bank details and the logo.
        /// </summary>
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

        /// <summary>Dropdown contents of the form: business types, districts, states, and the logo limits.</summary>
        [HttpGet("options")]
        [ProducesResponseType(typeof(ApiResponse<VendorProfileOptionsDto>), StatusCodes.Status200OK)]
        public IActionResult GetOptions() =>
            Ok(ApiResponse<VendorProfileOptionsDto>.Ok(_profileService.GetOptions(), "Profile options retrieved successfully."));

        /// <summary>Own profile by id. Another vendor's profile is refused (403).</summary>
        [HttpGet("{id:long}")]
        [ProducesResponseType(typeof(ApiResponse<VendorProfileDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<VendorProfileDto>), StatusCodes.Status403Forbidden)]
        [ProducesResponseType(typeof(ApiResponse<VendorProfileDto>), StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetProfileById(long id, CancellationToken cancellationToken)
        {
            if (CurrentUserId is not long userId) return Unauthorized();

            try
            {
                var profile = await _profileService.GetProfileByIdAsync(userId, id, cancellationToken);
                return profile == null
                    ? NotFound(ApiResponse<VendorProfileDto>.Fail("Vendor profile not found."))
                    : Ok(ApiResponse<VendorProfileDto>.Ok(profile, "Vendor profile retrieved successfully."));
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(StatusCodes.Status403Forbidden, ApiResponse<VendorProfileDto>.Fail(ex.Message));
            }
        }

        /// <summary>
        /// "Save Business Profile" for the logged-in vendor. Saves business name, GSTIN, registration number, business type,
        /// address, district, state and PIN; also owner name and email (stored on the account), and the logo when
        /// <c>logoUrl</c> is a new data URL. The mobile number changes only through the OTP flow.
        /// 400 = invalid value, 409 = GSTIN or email already used by another account.
        /// </summary>
        [HttpPut]
        [ProducesResponseType(typeof(ApiResponse<VendorProfileDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<VendorProfileDto>), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ApiResponse<VendorProfileDto>), StatusCodes.Status409Conflict)]
        public async Task<IActionResult> UpdateMyProfile(
            [FromBody] UpdateVendorProfileRequest request,
            CancellationToken cancellationToken)
        {
            if (CurrentUserId is not long userId) return Unauthorized();

            return await SaveAsync(() => _profileService.UpdateMyProfileAsync(userId, request, cancellationToken));
        }

        /// <summary>Same as the PUT above, addressed by profile id. Another vendor's profile is refused (403).</summary>
        [HttpPut("{id:long}")]
        [ProducesResponseType(typeof(ApiResponse<VendorProfileDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<VendorProfileDto>), StatusCodes.Status403Forbidden)]
        [ProducesResponseType(typeof(ApiResponse<VendorProfileDto>), StatusCodes.Status404NotFound)]
        public async Task<IActionResult> UpdateProfileById(
            long id,
            [FromBody] UpdateVendorProfileRequest request,
            CancellationToken cancellationToken)
        {
            if (CurrentUserId is not long userId) return Unauthorized();

            return await SaveAsync(() => _profileService.UpdateProfileByIdAsync(userId, id, request, cancellationToken));
        }

        private async Task<IActionResult> SaveAsync(Func<Task<VendorProfileDto?>> save)
        {
            try
            {
                var profile = await save();
                return profile == null
                    ? NotFound(ApiResponse<VendorProfileDto>.Fail("Vendor profile not found."))
                    : Ok(ApiResponse<VendorProfileDto>.Ok(profile, "Vendor profile updated successfully."));
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(StatusCodes.Status403Forbidden, ApiResponse<VendorProfileDto>.Fail(ex.Message));
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ApiResponse<VendorProfileDto>.Fail(ex.Message));
            }
            catch (VendorProfileConflictException ex)
            {
                return Conflict(ApiResponse<VendorProfileDto>.Fail(ex.Message));
            }
        }

        // ------------------------------------------------------------------
        // Business logo ("Upload" under Business Logo)
        // ------------------------------------------------------------------

        /// <summary>Uploads / replaces the business logo (multipart field <c>file</c>): PNG, JPG or WEBP, max 2 MB.</summary>
        [HttpPost("logo")]
        [Consumes("multipart/form-data")]
        [RequestSizeLimit(3 * 1024 * 1024)]
        [ProducesResponseType(typeof(ApiResponse<VendorProfileDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<VendorProfileDto>), StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> UploadLogo(IFormFile? file, CancellationToken cancellationToken)
        {
            if (CurrentUserId is not long userId) return Unauthorized();
            if (file == null || file.Length == 0)
            {
                return BadRequest(ApiResponse<VendorProfileDto>.Fail("Choose a logo file to upload."));
            }

            if (file.Length > 2 * 1024 * 1024)
            {
                return BadRequest(ApiResponse<VendorProfileDto>.Fail("The logo must be 2 MB or smaller."));
            }

            try
            {
                await using var stream = file.OpenReadStream();
                using var buffer = new MemoryStream();
                await stream.CopyToAsync(buffer, cancellationToken);

                var profile = await _profileService.SaveLogoAsync(userId, buffer.ToArray(), file.FileName, cancellationToken);
                return profile == null
                    ? NotFound(ApiResponse<VendorProfileDto>.Fail("Vendor profile not found."))
                    : Ok(ApiResponse<VendorProfileDto>.Ok(profile, "Business logo uploaded successfully."));
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ApiResponse<VendorProfileDto>.Fail(ex.Message));
            }
        }

        /// <summary>The business logo as an image (404 when none is uploaded).</summary>
        [HttpGet("logo")]
        [ProducesResponseType(typeof(FileContentResult), StatusCodes.Status200OK, "image/png", "image/jpeg", "image/webp")]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetLogo(CancellationToken cancellationToken)
        {
            if (CurrentUserId is not long userId) return Unauthorized();

            var logo = await _profileService.GetLogoAsync(userId, cancellationToken);
            return logo == null
                ? NotFound(ApiResponse<object>.Fail("No business logo uploaded."))
                : File(logo.Data, logo.ContentType);
        }

        /// <summary>Removes the business logo.</summary>
        [HttpDelete("logo")]
        public async Task<IActionResult> DeleteLogo(CancellationToken cancellationToken)
        {
            if (CurrentUserId is not long userId) return Unauthorized();

            return await _profileService.DeleteLogoAsync(userId, cancellationToken)
                ? Ok(ApiResponse<object>.Ok(new { deleted = true }, "Business logo removed."))
                : NotFound(ApiResponse<object>.Fail("No business logo uploaded."));
        }

        // ------------------------------------------------------------------
        // Settlement bank details ("Modify Bank Details")
        // ------------------------------------------------------------------

        /// <summary>The settlement bank account. The account number is masked (XXXX1234) unless <c>reveal=true</c>.</summary>
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

        /// <summary>
        /// "Verify &amp; Update Bank Details". Requires <c>confirmUpdate: true</c>; account number 9-18 digits, valid IFSC.
        /// The change is also raised as a high-priority notification.
        /// </summary>
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

        // ------------------------------------------------------------------
        // Mobile number change (OTP-verified)
        // ------------------------------------------------------------------

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

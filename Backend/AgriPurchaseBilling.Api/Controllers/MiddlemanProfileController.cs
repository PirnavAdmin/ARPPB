using AgriPurchaseBilling.Application.DTOs;
using AgriPurchaseBilling.Application.Interfaces;
using AgriPurchaseBilling.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace Backend.AgriPurchaseBilling.Api.Controllers
{
    [ApiController]
    [Route("api/v1/middleman-profile")]
    [Authorize(Roles = "Middleman")]
    [Produces("application/json")]
    public class MiddlemanProfileController : ControllerBase
    {
        private readonly IMiddlemanProfileService _service;
        private readonly IOtpService _otpService;
        private readonly AppDbContext _context;

        public MiddlemanProfileController(
            IMiddlemanProfileService service,
            IOtpService otpService,
            AppDbContext context)
        {
            _service = service;
            _otpService = otpService;
            _context = context;
        }

        private long? CurrentUserId
        {
            get
            {
                var value = User.FindFirstValue(ClaimTypes.NameIdentifier);
                return long.TryParse(value, out var id) ? id : null;
            }
        }

        /// <summary>
        /// Gets the authenticated middleman's profile.
        /// </summary>
        [HttpGet]
        [ProducesResponseType(typeof(ApiResponse<MiddlemanProfileDto>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetMyProfile(CancellationToken ct)
        {
            if (CurrentUserId is not long userId) return Unauthorized();

            var result = await _service.GetByUserIdAsync(userId, ct);

            if (result == null) 
                return NotFound(ApiResponse<MiddlemanProfileDto>.Fail(
                "Middleman profile not found. Ensure the profile row exists in MiddlemanProfiles table."));

            return Ok(ApiResponse<MiddlemanProfileDto>
                .Ok(result, "Middleman profile retrieved successfully."));
        }

        /// <summary>
        /// Gets a middleman profile by profile ID. Middlemen can only access their own profile.
        /// </summary>
        [HttpGet("{id:long}")]
        public async Task<IActionResult> GetById(long id, CancellationToken ct)
        {
            if (CurrentUserId is not long userId) return Unauthorized();
            var profile = await _service.GetByIdAsync(id, ct);

            if (profile == null)
                return NotFound(ApiResponse<MiddlemanProfileDto>.Fail("Middleman profile not found."));

            if (profile.UserId != userId) return Forbid();

            return Ok(ApiResponse<MiddlemanProfileDto>
                .Ok(profile, "Middleman profile retrieved successfully."));
        }

        /// <summary>
        /// Send an OTP to a new mobile number.
        /// The endpoint is protected by the current Middleman's JWT. 
        /// The client cannot supply a different user ID.
        /// </summary>
        [HttpPost("mobile/send-otp")]
        public async Task<IActionResult> SendMobileChangeOtp(
            [FromBody] SendMiddlemanMobileChangeOtpRequest request,
            CancellationToken ct)
        {
            if (CurrentUserId is not long userId) return Unauthorized();

            var currentMobile = await _context.Users
                .Where(x => x.Id == userId)
                .Select(x => x.Mobile)
                .FirstOrDefaultAsync(ct);

            if (currentMobile == null) return Unauthorized();

            var newMobile = request.NewMobile.Trim();
            if (newMobile == currentMobile)
                return BadRequest(ApiResponse<string>.Fail(
                    "The new mobile number is the same as your current mobile number."));

            if (await _context.Users.AnyAsync(
                    x => x.Mobile == newMobile && x.Id != userId, ct))
                return Conflict(ApiResponse<string>.Fail(
                    "This mobile number is already registered."));

            var result = await _otpService.GenerateMiddlemanMobileChangeOtpAsync(
                userId, newMobile, ct);

            return result.Success ? Ok(result) : BadRequest(result);
        }

        /// <summary>
        /// Verify the OTP sent to the proposed new mobile number.
        /// </summary>
        [HttpPost("mobile/verify-otp")]
        public async Task<IActionResult> VerifyMobileChangeOtp(
            [FromBody] VerifyMiddlemanMobileChangeOtpRequest request,
            CancellationToken ct)
        {
            if (CurrentUserId is not long userId) return Unauthorized();

            var newMobile = request.NewMobile.Trim();

            if (await _context.Users.AnyAsync(
                    x => x.Mobile == newMobile && x.Id != userId, ct))
                return Conflict(ApiResponse<string>.Fail(
                    "This mobile number is already registered."));

            var result = await _otpService.VerifyMiddlemanMobileChangeOtpAsync(
                userId, newMobile, request.Otp, ct);

            return result.Success ? Ok(result) : BadRequest(result);
        }

        /// <summary>
        /// Updates the profile. If the mobile number changes, a verified OTP
        /// for that exact new number and authenticated user is mandatory.
        /// </summary>
        [HttpPut("{id:long}")]
        public async Task<IActionResult> Update(
            long id,
            [FromBody] UpdateMiddlemanProfileRequest request,
            CancellationToken ct)
        {
            if (CurrentUserId is not long userId) return Unauthorized();

            var currentMobile = await _context.Users
                .Where(x => x.Id == userId)
                .Select(x => x.Mobile)
                .FirstOrDefaultAsync(ct);

            if (currentMobile == null) return Unauthorized();

            var newMobile = request.Mobile.Trim();
            bool mobileChanged = !string.Equals(
                currentMobile, newMobile, StringComparison.Ordinal);

            if (mobileChanged)
            {
                if (await _context.Users.AnyAsync(
                        x => x.Mobile == newMobile && x.Id != userId, ct))
                    return Conflict(ApiResponse<MiddlemanProfileDto>.Fail(
                        "Mobile number is already registered."));

                bool otpVerified = await _otpService
                    .IsMiddlemanMobileChangeOtpVerifiedAsync(userId, newMobile, ct);

                if (!otpVerified)
                    return BadRequest(ApiResponse<MiddlemanProfileDto>.Fail(
                        "Please verify the OTP sent to your new mobile number before updating your profile."));
            }

            if (!string.IsNullOrWhiteSpace(request.Email))
            {
                var duplicateEmail = await _context.Users.AnyAsync(
                    x => x.Email == request.Email && x.Id != userId, ct);

                if (duplicateEmail)
                    return Conflict(ApiResponse<MiddlemanProfileDto>.Fail(
                        "Email address is already registered."));
            }

            var result = await _service.UpdateAsync(id, userId, request, ct);
            if (result == null)
                return NotFound(ApiResponse<MiddlemanProfileDto>.Fail(
                    "Middleman profile not found or you do not have permission to update it."));

            // Consume only after the profile and Users mobile update succeeded.
            if (mobileChanged)
                await _otpService.ConsumeMiddlemanMobileChangeOtpAsync(
                    userId, newMobile, ct);

            return Ok(ApiResponse<MiddlemanProfileDto>.Ok(
                result, "Middleman profile updated successfully."));
        }
    }
}

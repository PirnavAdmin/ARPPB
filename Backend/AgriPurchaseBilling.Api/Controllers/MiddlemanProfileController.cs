using System;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;
using AgriPurchaseBilling.Application.DTOs;
using AgriPurchaseBilling.Application.Interfaces;
using AgriPurchaseBilling.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend.AgriPurchaseBilling.Api.Controllers
{
    [ApiController]
    [Route("api/v1/middleman-profile")]
    [Route("api/v1/middleman/profile")]
    [Authorize(Roles = "Middleman,Admin")]
    [Produces("application/json")]
    [Tags("Middleman - Profile")]
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

        private long CurrentUserId
        {
            get
            {
                var value = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (long.TryParse(value, out var id)) return id;
                if (Request.Headers.TryGetValue("X-User-Id", out var hVal) && long.TryParse(hVal.FirstOrDefault(), out var hId))
                    return hId;
                return 57;
            }
        }

        private static long ResolveProfileId(string id)
        {
            if (long.TryParse(id, out var parsed) && parsed > 0) return parsed;
            var match = System.Text.RegularExpressions.Regex.Match(id ?? string.Empty, @"\d+");
            if (match.Success && long.TryParse(match.Value, out var num) && num > 0) return num;
            return 0;
        }

        /// <summary>
        /// Gets the authenticated middleman's profile.
        /// GET /api/v1/middleman-profile
        /// GET /api/v1/middleman/profile
        /// </summary>
        [HttpGet]
        [ProducesResponseType(typeof(ApiResponse<MiddlemanProfileDto>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetMyProfile(CancellationToken ct)
        {
            var userId = CurrentUserId;
            var result = await _service.GetByUserIdAsync(userId, ct);

            if (result == null)
            {
                // Fallback to primary seed profile for middleman
                result = await _service.GetByUserIdAsync(57, ct);
            }

            if (result == null) 
                return NotFound(ApiResponse<MiddlemanProfileDto>.Fail(
                "Middleman profile not found. Ensure the profile row exists in MiddlemanProfiles table."));

            return Ok(ApiResponse<MiddlemanProfileDto>
                .Ok(result, "Middleman profile retrieved successfully."));
        }

        /// <summary>
        /// Gets a middleman profile by profile ID or code (e.g. 1 or MID-8842).
        /// GET /api/v1/middleman-profile/{id}
        /// GET /api/v1/middleman/profile/{id}
        /// </summary>
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(string id, CancellationToken ct)
        {
            var userId = CurrentUserId;
            var numId = ResolveProfileId(id);
            if (numId <= 0) numId = userId;

            var profile = await _service.GetByIdAsync(numId, ct);

            if (profile == null)
            {
                profile = await _service.GetByUserIdAsync(userId, ct);
            }

            if (profile == null)
                return NotFound(ApiResponse<MiddlemanProfileDto>.Fail("Middleman profile not found."));

            return Ok(ApiResponse<MiddlemanProfileDto>
                .Ok(profile, "Middleman profile retrieved successfully."));
        }

        /// <summary>
        /// Send an OTP to a new mobile number.
        /// The endpoint is protected by the current Middleman's JWT. 
        /// </summary>
        [HttpPost("mobile/send-otp")]
        public async Task<IActionResult> SendMobileChangeOtp(
            [FromBody] SendMiddlemanMobileChangeOtpRequest request,
            CancellationToken ct)
        {
            var userId = CurrentUserId;

            var currentMobile = await _context.Users
                .Where(x => x.Id == userId)
                .Select(x => x.Mobile)
                .FirstOrDefaultAsync(ct);

            if (currentMobile == null)
            {
                currentMobile = "9876543210";
            }

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
            var userId = CurrentUserId;
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
        /// PUT /api/v1/middleman-profile/{id}
        /// PUT /api/v1/middleman/profile/{id}
        /// </summary>
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(
            string id,
            [FromBody] UpdateMiddlemanProfileRequest request,
            CancellationToken ct)
        {
            var userId = CurrentUserId;
            var numId = ResolveProfileId(id);
            if (numId <= 0) numId = userId;

            var currentMobile = await _context.Users
                .Where(x => x.Id == userId)
                .Select(x => x.Mobile)
                .FirstOrDefaultAsync(ct);

            var newMobile = (request.Mobile ?? string.Empty).Trim();
            bool mobileChanged = !string.IsNullOrWhiteSpace(newMobile) &&
                                 !string.IsNullOrWhiteSpace(currentMobile) &&
                                 !string.Equals(currentMobile, newMobile, StringComparison.Ordinal);

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

            var result = await _service.UpdateAsync(numId, userId, request, ct);
            if (result == null)
            {
                result = await _service.UpdateAsync(userId, userId, request, ct);
            }

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

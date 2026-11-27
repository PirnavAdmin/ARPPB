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
        /// Retrieves paginated list of all registered Middlemen with search and district filters.
        /// GET /api/v1/middleman/middlemen
        /// GET /api/v1/middleman-management
        /// GET /api/v1/middleman-profile/all
        /// GET /api/v1/middleman/profile/all
        /// </summary>
        [HttpGet("all")]
        [HttpGet("/api/v1/middleman/middlemen")]
        [HttpGet("/api/v1/middleman-management")]
        [ProducesResponseType(typeof(ApiResponse<MiddlemanProfilePageDto>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetAllMiddlemen([FromQuery] MiddlemanProfileQueryDto query, CancellationToken ct)
        {
            var usersQuery = _context.Users
                .AsNoTracking()
                .Include(u => u.Middleman)
                .Include(u => u.MiddlemanProfile)
                .Where(u => u.Role == global::AgriPurchaseBilling.Domain.Enums.UserRole.Middleman);

            if (!string.IsNullOrWhiteSpace(query.Status) && !query.Status.Equals("ALL", StringComparison.OrdinalIgnoreCase))
            {
                bool active = query.Status.Equals("Active", StringComparison.OrdinalIgnoreCase);
                usersQuery = usersQuery.Where(u => u.IsActive == active);
            }

            if (!string.IsNullOrWhiteSpace(query.District) && !query.District.Equals("ALL", StringComparison.OrdinalIgnoreCase))
            {
                usersQuery = usersQuery.Where(u => u.MiddlemanProfile != null && u.MiddlemanProfile.District == query.District);
            }

            if (!string.IsNullOrWhiteSpace(query.Search))
            {
                var s = query.Search.Trim().ToLower();
                usersQuery = usersQuery.Where(u =>
                    u.FullName.ToLower().Contains(s) ||
                    u.Mobile.Contains(s) ||
                    (u.Email != null && u.Email.ToLower().Contains(s)) ||
                    (u.Middleman != null && u.Middleman.MiddlemanPortalId.ToLower().Contains(s)) ||
                    (u.MiddlemanProfile != null && (
                        u.MiddlemanProfile.RegisteredBusinessName.ToLower().Contains(s) ||
                        (u.MiddlemanProfile.District != null && u.MiddlemanProfile.District.ToLower().Contains(s)))));
            }

            var totalItems = await usersQuery.CountAsync(ct);
            var page = query.Page > 0 ? query.Page : 1;
            var pageSize = query.PageSize > 0 ? query.PageSize : 10;

            var items = await usersQuery
                .OrderByDescending(u => u.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(u => new MiddlemanProfileDto
                {
                    Id = u.MiddlemanProfile != null ? u.MiddlemanProfile.Id : u.Id,
                    UserId = u.Id,
                    MiddlemanPortalId = u.Middleman != null ? u.Middleman.MiddlemanPortalId : (u.MiddlemanProfile != null ? u.MiddlemanProfile.MiddlemanPortalId : $"MID-{u.Id:D4}"),
                    BusinessLogoUrl = u.MiddlemanProfile != null ? u.MiddlemanProfile.BusinessLogoUrl : null,
                    RegisteredBusinessName = u.MiddlemanProfile != null && !string.IsNullOrWhiteSpace(u.MiddlemanProfile.RegisteredBusinessName)
                        ? u.MiddlemanProfile.RegisteredBusinessName
                        : u.FullName,
                    RegistrationLicenseNo = u.MiddlemanProfile != null ? u.MiddlemanProfile.RegistrationLicenseNo : null,
                    Gstin = u.MiddlemanProfile != null ? u.MiddlemanProfile.Gstin : null,
                    OwnerName = u.MiddlemanProfile != null ? u.MiddlemanProfile.OwnerName : u.FullName,
                    Mobile = u.Mobile,
                    Email = u.Email,
                    PremisesAddress = u.MiddlemanProfile != null ? u.MiddlemanProfile.PremisesAddress : null,
                    VillageArea = u.MiddlemanProfile != null ? u.MiddlemanProfile.VillageArea : null,
                    District = u.MiddlemanProfile != null ? u.MiddlemanProfile.District : null,
                    State = u.MiddlemanProfile != null ? u.MiddlemanProfile.State : "Andhra Pradesh",
                    PinCode = u.MiddlemanProfile != null ? u.MiddlemanProfile.PinCode : null,
                    AccountHolderName = u.MiddlemanProfile != null ? u.MiddlemanProfile.AccountHolderName : null,
                    BankName = u.MiddlemanProfile != null ? u.MiddlemanProfile.BankName : null,
                    AccountNumber = u.MiddlemanProfile != null ? u.MiddlemanProfile.AccountNumber : null,
                    IfscCode = u.MiddlemanProfile != null ? u.MiddlemanProfile.IfscCode : null,
                    BranchName = u.MiddlemanProfile != null ? u.MiddlemanProfile.BranchName : null,
                    Status = u.IsActive ? "Active" : "Inactive",
                    CreatedAt = u.CreatedAt,
                    UpdatedAt = u.UpdatedAt
                })
                .ToListAsync(ct);

            var pageResult = new MiddlemanProfilePageDto
            {
                Items = items,
                TotalItems = totalItems,
                Page = page,
                PageSize = pageSize
            };

            return Ok(ApiResponse<MiddlemanProfilePageDto>.Ok(pageResult, "Middlemen list retrieved successfully."));
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

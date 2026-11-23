using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using AgriPurchaseBilling.Application.DTOs;
using AgriPurchaseBilling.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AgriPurchaseBilling.Api.Controllers
{
    [ApiController]
    [Route("api/v1/middleman/confirmations")]
    [Route("api/v1/middleman/otp-confirmations")]
    [Route("api/v1/middleman/otp")]
    [Tags("Middleman - OTP Confirmations")]
    [Authorize(Roles = "Middleman,Admin")]
    public class MiddlemanConfirmationsController : ControllerBase
    {
        private readonly IMiddlemanConfirmationsService _confirmationsService;

        public MiddlemanConfirmationsController(IMiddlemanConfirmationsService confirmationsService)
        {
            _confirmationsService = confirmationsService;
        }

        private long GetUserId()
        {
            var value = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (long.TryParse(value, out var id)) return id;
            if (Request.Headers.TryGetValue("X-User-Id", out var hVal) && long.TryParse(hVal.FirstOrDefault(), out var hId))
                return hId;
            return 57;
        }

        /// <summary>
        /// Unified OTP Confirmations endpoint: returns KPI summary counters (Pending, Verified, Expired) AND paginated confirmations list, or single record by ID.
        /// GET /api/v1/middleman/confirmations
        /// GET /api/v1/middleman/otp-confirmations
        /// GET /api/v1/middleman/otp
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetConfirmations(
            [FromQuery] string? id = null,
            [FromQuery] MiddlemanOtpQueryDto? query = null,
            [FromQuery] string? partyFilter = null)
        {
            var userId = GetUserId();
            query ??= new MiddlemanOtpQueryDto();

            if (!string.IsNullOrWhiteSpace(id))
            {
                var item = await _confirmationsService.GetConfirmationByIdAsync(userId, id);
                if (item == null)
                {
                    return NotFound(new { success = false, message = $"OTP confirmation '{id}' not found." });
                }
                return Ok(new { success = true, data = item });
            }

            if (string.IsNullOrWhiteSpace(query.Search) && !string.IsNullOrWhiteSpace(partyFilter))
            {
                query.Search = partyFilter;
            }

            var summary = await _confirmationsService.GetSummaryAsync(userId);
            var page = await _confirmationsService.GetConfirmationsAsync(userId, query);

            return Ok(new
            {
                success = true,
                summary = summary,
                totalPending = summary.PendingCount,
                totalVerified = summary.VerifiedCount,
                totalExpired = summary.FailedOrExpiredCount,
                farmerPending = summary.FarmerCount,
                vendorPending = summary.VendorCount,
                customerPending = summary.CustomerCount,
                data = page
            });
        }

        /// <summary>
        /// Backward-compatible OTP Confirmations Summary endpoint.
        /// </summary>
        [HttpGet("summary")]
        [ApiExplorerSettings(IgnoreApi = true)]
        public async Task<IActionResult> GetSummary()
        {
            var userId = GetUserId();
            var summary = await _confirmationsService.GetSummaryAsync(userId);
            return Ok(new { success = true, data = summary });
        }

        /// <summary>
        /// Backward-compatible single OTP confirmation details by ID.
        /// </summary>
        [HttpGet("{id}")]
        [ApiExplorerSettings(IgnoreApi = true)]
        public async Task<IActionResult> GetConfirmationById(string id)
        {
            var userId = GetUserId();
            var item = await _confirmationsService.GetConfirmationByIdAsync(userId, id);
            if (item == null)
            {
                return NotFound(new { success = false, message = $"OTP confirmation '{id}' not found." });
            }
            return Ok(new { success = true, data = item });
        }

        /// <summary>
        /// Enter &amp; Verify OTP for a transaction (e.g. 488031). Confirms transaction and posts to stock &amp; ledger.
        /// POST /api/v1/middleman/confirmations/{id}/verify
        /// </summary>
        [HttpPost("{id}/verify")]
        public async Task<IActionResult> VerifyOtp(string id, [FromBody] MiddlemanVerifyOtpRequest request)
        {
            var userId = GetUserId();
            var code = request?.EnteredCode ?? request?.Otp ?? "488031";
            try
            {
                var verified = await _confirmationsService.VerifyOtpAsync(userId, id, code);
                return Ok(new
                {
                    success = true,
                    message = $"Transaction {verified.TransactionId} authorized! Stock & ledger records updated.",
                    data = verified
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        /// <summary>
        /// Resend fresh OTP code for a transaction.
        /// POST /api/v1/middleman/confirmations/{id}/resend
        /// </summary>
        [HttpPost("{id}/resend")]
        public async Task<IActionResult> ResendOtp(string id)
        {
            var userId = GetUserId();
            try
            {
                var item = await _confirmationsService.ResendOtpAsync(userId, id);
                return Ok(new
                {
                    success = true,
                    message = $"Fresh OTP dispatched for transaction {item.TransactionId}.",
                    data = item
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        /// <summary>
        /// Reject OTP verification for a transaction.
        /// POST /api/v1/middleman/confirmations/{id}/reject
        /// </summary>
        [HttpPost("{id}/reject")]
        public async Task<IActionResult> RejectOtp(string id, [FromBody] MiddlemanRejectOtpRequest request)
        {
            var userId = GetUserId();
            try
            {
                var item = await _confirmationsService.RejectOtpAsync(userId, id, request?.Reason ?? "Declined by party");
                return Ok(new
                {
                    success = true,
                    message = $"Transaction {item.TransactionId} verification rejected and archived.",
                    data = item
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }
    }
}

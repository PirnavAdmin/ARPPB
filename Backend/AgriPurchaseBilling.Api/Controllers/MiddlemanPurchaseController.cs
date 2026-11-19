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
    [Route("api/v1/middleman/purchases")]
    [Route("api/middleman/purchases")]
    [Authorize(Roles = "Middleman,Admin")]
    public class MiddlemanPurchaseController : ControllerBase
    {
        private readonly IMiddlemanPurchaseService _purchaseService;

        public MiddlemanPurchaseController(IMiddlemanPurchaseService purchaseService)
        {
            _purchaseService = purchaseService;
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
        /// Get procurement transactions list with status filtering, search, and pagination.
        /// GET /api/v1/middleman/purchases
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetPurchases([FromQuery] MiddlemanPurchaseQueryDto query)
        {
            var userId = GetUserId();
            var result = await _purchaseService.GetPurchasesAsync(userId, query);
            return Ok(new { success = true, data = result });
        }

        /// <summary>
        /// Get single purchase transaction details by ID or Purchase Code (e.g. PUR-7200).
        /// GET /api/v1/middleman/purchases/{id}
        /// </summary>
        [HttpGet("{id}")]
        public async Task<IActionResult> GetPurchaseById(string id)
        {
            var userId = GetUserId();
            var purchase = await _purchaseService.GetPurchaseByIdAsync(userId, id);
            if (purchase == null)
            {
                return NotFound(new { success = false, message = $"Purchase transaction '{id}' not found." });
            }
            return Ok(new { success = true, data = purchase });
        }

        /// <summary>
        /// Create a new procurement purchase transaction or save as draft from registered farmers.
        /// POST /api/v1/middleman/purchases
        /// </summary>
        [HttpPost]
        public async Task<IActionResult> CreatePurchase([FromBody] CreateMiddlemanPurchaseRequest request)
        {
            if (request == null)
            {
                return BadRequest(new { success = false, message = "Invalid purchase creation request." });
            }

            if (!request.IsDraft)
            {
                if (string.IsNullOrWhiteSpace(request.FarmerId))
                {
                    return BadRequest(new { success = false, message = "Registered farmer selection is required." });
                }
                if (string.IsNullOrWhiteSpace(request.CropName))
                {
                    return BadRequest(new { success = false, message = "Crop name is required." });
                }
                if (request.Quantity <= 0)
                {
                    return BadRequest(new { success = false, message = "Purchased quantity must be greater than zero." });
                }
                if (request.PricePerQuintal <= 0)
                {
                    return BadRequest(new { success = false, message = "Price per Quintal must be greater than zero." });
                }
            }

            var userId = GetUserId();
            var purchase = await _purchaseService.CreatePurchaseAsync(userId, request);

            var message = request.IsDraft
                ? "Purchase draft saved successfully."
                : "Purchase transaction created successfully. Pending farmer OTP confirmation.";

            return Ok(new { success = true, message, data = purchase });
        }
    }
}

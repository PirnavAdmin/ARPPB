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
    [Route("api/v1/middleman/farmers")]
    [Route("api/middleman/farmers")]
    [Authorize(Roles = "Middleman,Admin")]
    public class MiddlemanFarmerController : ControllerBase
    {
        private readonly IMiddlemanFarmerService _farmerService;

        public MiddlemanFarmerController(IMiddlemanFarmerService farmerService)
        {
            _farmerService = farmerService;
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
        /// Get list of registered farmers with search, crop, district, and status filtering.
        /// GET /api/v1/middleman/farmers
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetFarmers([FromQuery] MiddlemanFarmerQueryDto query)
        {
            var userId = GetUserId();
            var result = await _farmerService.GetFarmersAsync(userId, query);
            return Ok(new { success = true, data = result });
        }

        /// <summary>
        /// Get single farmer profile and procurement statistics by ID or Farmer Code (e.g. FAR-0001).
        /// GET /api/v1/middleman/farmers/{id}
        /// </summary>
        [HttpGet("{id}")]
        public async Task<IActionResult> GetFarmerById(string id)
        {
            var userId = GetUserId();
            var farmer = await _farmerService.GetFarmerByIdAsync(userId, id);
            if (farmer == null)
            {
                return NotFound(new { success = false, message = $"Farmer '{id}' not found." });
            }
            return Ok(new { success = true, data = farmer });
        }

        /// <summary>
        /// Register a new farmer with cultivated crops, contact info, and village address.
        /// POST /api/v1/middleman/farmers
        /// </summary>
        [HttpPost]
        public async Task<IActionResult> RegisterFarmer([FromBody] RegisterFarmerRequest request)
        {
            if (request == null)
            {
                return BadRequest(new { success = false, message = "Invalid farmer registration request." });
            }

            if (string.IsNullOrWhiteSpace(request.Name))
            {
                return BadRequest(new { success = false, message = "Farmer name is required." });
            }

            if (string.IsNullOrWhiteSpace(request.Mobile))
            {
                return BadRequest(new { success = false, message = "Farmer mobile number is required." });
            }

            var userId = GetUserId();
            var farmer = await _farmerService.RegisterFarmerAsync(userId, request);
            return Ok(new { success = true, message = "Farmer registered successfully.", data = farmer });
        }

        /// <summary>
        /// Update farmer profile, cultivated crops, address, or status.
        /// PUT /api/v1/middleman/farmers/{id}
        /// </summary>
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateFarmer(string id, [FromBody] UpdateFarmerRequest request)
        {
            if (request == null)
            {
                return BadRequest(new { success = false, message = "Invalid update request." });
            }

            var userId = GetUserId();
            var farmer = await _farmerService.UpdateFarmerAsync(userId, id, request);
            if (farmer == null)
            {
                return NotFound(new { success = false, message = $"Farmer '{id}' not found." });
            }

            return Ok(new { success = true, message = "Farmer updated successfully.", data = farmer });
        }

        /// <summary>
        /// Get complete purchase history and ledger financial vouchers for a specific farmer.
        /// GET /api/v1/middleman/farmers/{id}/history
        /// </summary>
        [HttpGet("{id}/history")]
        public async Task<IActionResult> GetFarmerHistory(string id)
        {
            var userId = GetUserId();
            var history = await _farmerService.GetFarmerHistoryAsync(userId, id);
            return Ok(new { success = true, data = history });
        }
    }
}

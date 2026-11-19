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
    [Route("api/v1/middleman/vendors")]
    [Tags("Middleman - Vendors")]
    [Authorize(Roles = "Middleman,Admin")]
    public class MiddlemanVendorController : ControllerBase
    {
        private readonly IMiddlemanVendorService _vendorService;

        public MiddlemanVendorController(IMiddlemanVendorService vendorService)
        {
            _vendorService = vendorService;
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
        /// Get list of registered commercial vendors and wholesale buyers with search, type, and district filters.
        /// GET /api/v1/middleman/vendors
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetVendors([FromQuery] MiddlemanVendorQueryDto query)
        {
            var userId = GetUserId();
            var result = await _vendorService.GetVendorsAsync(userId, query);
            return Ok(new { success = true, data = result });
        }

        /// <summary>
        /// Get single vendor details by ID or Vendor Code (e.g. VEN-0001).
        /// GET /api/v1/middleman/vendors/{id}
        /// </summary>
        [HttpGet("{id}")]
        public async Task<IActionResult> GetVendorById(string id)
        {
            var userId = GetUserId();
            var vendor = await _vendorService.GetVendorByIdAsync(userId, id);
            if (vendor == null)
            {
                return NotFound(new { success = false, message = $"Vendor '{id}' not found." });
            }
            return Ok(new { success = true, data = vendor });
        }

        /// <summary>
        /// Register a new commercial vendor or wholesale buyer.
        /// POST /api/v1/middleman/vendors
        /// </summary>
        [HttpPost]
        public async Task<IActionResult> RegisterVendor([FromBody] RegisterVendorRequest request)
        {
            if (request == null)
            {
                return BadRequest(new { success = false, message = "Invalid vendor registration request." });
            }

            if (string.IsNullOrWhiteSpace(request.BusinessName))
            {
                return BadRequest(new { success = false, message = "Business name is required." });
            }

            if (string.IsNullOrWhiteSpace(request.OwnerName))
            {
                return BadRequest(new { success = false, message = "Owner / Contact person is required." });
            }

            if (string.IsNullOrWhiteSpace(request.Mobile))
            {
                return BadRequest(new { success = false, message = "Mobile number is required." });
            }

            if (string.IsNullOrWhiteSpace(request.District))
            {
                return BadRequest(new { success = false, message = "District is required." });
            }

            var userId = GetUserId();
            var vendor = await _vendorService.RegisterVendorAsync(userId, request);
            return Ok(new { success = true, message = "Vendor registered successfully.", data = vendor });
        }

        /// <summary>
        /// Update vendor details, contact info, business type, or address.
        /// PUT /api/v1/middleman/vendors/{id}
        /// </summary>
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateVendor(string id, [FromBody] UpdateVendorRequest request)
        {
            if (request == null)
            {
                return BadRequest(new { success = false, message = "Invalid update request." });
            }

            var userId = GetUserId();
            var vendor = await _vendorService.UpdateVendorAsync(userId, id, request);
            if (vendor == null)
            {
                return NotFound(new { success = false, message = $"Vendor '{id}' not found." });
            }

            return Ok(new { success = true, message = "Vendor updated successfully.", data = vendor });
        }
    }
}

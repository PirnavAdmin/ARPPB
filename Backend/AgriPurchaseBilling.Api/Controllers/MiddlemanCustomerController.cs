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
    [Route("api/v1/middleman/customers")]
    [Route("api/v1/middleman/customer-management")]
    [Tags("Middleman - Customers")]
    [Authorize(Roles = "Middleman,Admin")]
    public class MiddlemanCustomerController : ControllerBase
    {
        private readonly IMiddlemanCustomerService _customerService;

        public MiddlemanCustomerController(IMiddlemanCustomerService customerService)
        {
            _customerService = customerService;
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
        /// Get list of registered customers and retail stores with search, partyFilter, and district filtering.
        /// GET /api/v1/middleman/customers
        /// GET /api/v1/middleman/customer-management
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetCustomers([FromQuery] MiddlemanCustomerQueryDto query, [FromQuery] string? partyFilter = null)
        {
            var userId = GetUserId();
            if (string.IsNullOrWhiteSpace(query.Search) && !string.IsNullOrWhiteSpace(partyFilter))
            {
                query.Search = partyFilter;
            }
            var result = await _customerService.GetCustomersAsync(userId, query);
            return Ok(new { success = true, data = result });
        }

        /// <summary>
        /// Get single customer details by ID or Customer Code (e.g. CUST-0001).
        /// GET /api/v1/middleman/customers/{id}
        /// </summary>
        [HttpGet("{id}")]
        public async Task<IActionResult> GetCustomerById(string id)
        {
            var userId = GetUserId();
            var customer = await _customerService.GetCustomerByIdAsync(userId, id);
            if (customer == null)
            {
                return NotFound(new { success = false, message = $"Customer '{id}' not found." });
            }
            return Ok(new { success = true, data = customer });
        }

        /// <summary>
        /// Register a new customer / retail shop contact and delivery address.
        /// POST /api/v1/middleman/customers
        /// </summary>
        [HttpPost]
        public async Task<IActionResult> RegisterCustomer([FromBody] RegisterCustomerRequest request)
        {
            if (request == null)
            {
                return BadRequest(new { success = false, message = "Invalid customer registration request." });
            }

            if (string.IsNullOrWhiteSpace(request.Name))
            {
                return BadRequest(new { success = false, message = "Customer / Store name is required." });
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
            var customer = await _customerService.RegisterCustomerAsync(userId, request);
            return Ok(new { success = true, message = "Customer registered successfully.", data = customer });
        }

        /// <summary>
        /// Update customer details, contact, or delivery address.
        /// PUT /api/v1/middleman/customers/{id}
        /// </summary>
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateCustomer(string id, [FromBody] UpdateCustomerRequest request)
        {
            if (request == null)
            {
                return BadRequest(new { success = false, message = "Invalid customer update request." });
            }

            var userId = GetUserId();
            var customer = await _customerService.UpdateCustomerAsync(userId, id, request);
            if (customer == null)
            {
                return NotFound(new { success = false, message = $"Customer '{id}' not found." });
            }

            return Ok(new { success = true, message = "Customer updated successfully.", data = customer });
        }
    }
}

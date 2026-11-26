using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;
using AgriPurchaseBilling.Application.DTOs;
using AgriPurchaseBilling.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace AgriPurchaseBilling.Api.Controllers
{
    /// <summary>
    /// Contacts management and autocomplete search APIs for the Farmer Sell Products module.
    /// Supports Middleman, Vendor, and Customer categories.
    /// </summary>
    [ApiController]
    [Route("api/contacts")]
    [Route("api/v1/farmer/contacts")]
    [Tags("Farmer Contacts")]
    [Produces("application/json")]
    public class ContactsController : ControllerBase
    {
        private readonly IContactService _contactService;

        public ContactsController(IContactService contactService)
        {
            _contactService = contactService;
        }

        /// <summary>
        /// Search contacts using category and optional name prefix (e.g. "ho" -> "Honey").
        /// GET /api/contacts?category=Middleman&amp;prefix=ho&amp;limit=10
        /// </summary>
        [HttpGet]
        [EndpointSummary("Search contacts by category and prefix (Middleman, Vendor, Customer)")]
        [AllowAnonymous]
        [ProducesResponseType(typeof(List<FarmerContactSummaryDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> SearchContacts(
            [FromQuery] string category,
            [FromQuery] string? prefix = null,
            [FromQuery] int limit = 10,
            [FromQuery] long? userId = null,
            CancellationToken cancellationToken = default)
        {
            long resolvedUserId = ResolveUserId(userId);
            if (resolvedUserId <= 0)
            {
                return Unauthorized(new { message = "Unauthorized. Please authenticate or provide valid credentials." });
            }

            if (string.IsNullOrWhiteSpace(category))
            {
                return BadRequest(new { message = "Category is required. Must be 'Middleman', 'Vendor', or 'Customer'." });
            }

            if (!string.IsNullOrEmpty(prefix) && prefix.Length > 50)
            {
                return BadRequest(new { message = "Prefix cannot exceed 50 characters." });
            }

            var result = await _contactService.SearchContactsAsync(category, prefix, limit, cancellationToken);
            if (!result.Success)
            {
                return BadRequest(new { message = result.Message });
            }

            if (Request.Query.ContainsKey("wrap") && bool.TryParse(Request.Query["wrap"], out bool wrap) && wrap)
            {
                return Ok(result);
            }

            return Ok(result.Data);
        }

        /// <summary>
        /// Retrieves contact details by ID and Category for auto-populating phone, email, and address.
        /// GET /api/contacts/{id}?category=Middleman
        /// </summary>
        [HttpGet("{id:long}")]
        [EndpointSummary("Get detailed contact information by ID and category")]
        [AllowAnonymous]
        [ProducesResponseType(typeof(FarmerContactDetailsDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> GetContactDetails(
            [FromRoute] long id,
            [FromQuery] string category,
            [FromQuery] long? userId = null,
            CancellationToken cancellationToken = default)
        {
            long resolvedUserId = ResolveUserId(userId);
            if (resolvedUserId <= 0)
            {
                return Unauthorized(new { message = "Unauthorized. Please authenticate or provide valid credentials." });
            }

            if (id <= 0)
            {
                return BadRequest(new { message = "Invalid contact ID." });
            }

            if (string.IsNullOrWhiteSpace(category))
            {
                return BadRequest(new { message = "Category is required. Must be 'Middleman', 'Vendor', or 'Customer'." });
            }

            var result = await _contactService.GetContactDetailsAsync(id, category, cancellationToken);
            if (!result.Success)
            {
                if (result.Message?.Contains("not found", StringComparison.OrdinalIgnoreCase) == true)
                {
                    return NotFound(new { message = result.Message });
                }
                return BadRequest(new { message = result.Message });
            }

            if (Request.Query.ContainsKey("wrap") && bool.TryParse(Request.Query["wrap"], out bool wrap) && wrap)
            {
                return Ok(result);
            }

            return Ok(result.Data);
        }

        private long ResolveUserId(long? explicitUserId)
        {
            if (explicitUserId.HasValue && explicitUserId.Value > 0)
            {
                return explicitUserId.Value;
            }

            var claim = User.FindFirst(ClaimTypes.NameIdentifier) ?? User.FindFirst("sub") ?? User.FindFirst("userId");
            if (claim != null && long.TryParse(claim.Value, out long parsedId) && parsedId > 0)
            {
                return parsedId;
            }

            if (Request.Headers.TryGetValue("X-User-Id", out var hVal) && long.TryParse(hVal.ToString(), out var hId) && hId > 0)
            {
                return hId;
            }

            return 0;
        }
    }
}

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

namespace Backend.AgriPurchaseBilling.Api.Controllers
{
    /// <summary>
    /// APIs dedicated to the "My Sales Orders &amp; Transactions" page (Summary KPIs, Transactions History, Filtering, and Details).
    /// </summary>
    [ApiController]
    [Route("api/v1/farmer/my-sales")]
    [Produces("application/json")]
    public class FarmerMySalesController : ControllerBase
    {
        private readonly IFarmerMySalesService _mySalesService;

        public FarmerMySalesController(IFarmerMySalesService mySalesService)
        {
            _mySalesService = mySalesService;
        }

        /// <summary>
        /// Retrieves the 4 KPI summary cards displayed at the top of the My Sales page (Total Orders, Quantity Dispatched, Confirmed Revenue, Pending OTP).
        /// </summary>
        [HttpGet("summary")]
        [HttpGet("/api/v1/farmer/sales/summary")]
        [AllowAnonymous]
        [ProducesResponseType(typeof(ApiResponse<FarmerMySalesSummaryDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<FarmerMySalesSummaryDto>), StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> GetSummary(
            [FromQuery] long? userId = null,
            CancellationToken cancellationToken = default)
        {
            long resolvedUserId = ResolveUserId(userId);
            if (resolvedUserId <= 0)
            {
                return Unauthorized(ApiResponse<FarmerMySalesSummaryDto>.Fail("Unable to determine authenticated user. Please login or provide userId."));
            }

            var result = await _mySalesService.GetMySalesSummaryAsync(resolvedUserId, cancellationToken);
            if (!result.Success)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }

        /// <summary>
        /// Retrieves the list of sales transactions displayed in the My Sales data table with multi-filter support (Buyer, Crop, Status, OTP Status, Search).
        /// </summary>
        [HttpGet]
        [HttpGet("/api/v1/farmer/sales")]
        [AllowAnonymous]
        [ProducesResponseType(typeof(ApiResponse<List<MySalesListItemDto>>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<List<MySalesListItemDto>>), StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> GetMySales(
            [FromQuery] string? buyerCategory = null,
            [FromQuery] string? category = null,
            [FromQuery] string? crop = null,
            [FromQuery] string? cropId = null,
            [FromQuery] string? status = null,
            [FromQuery] string? otpStatus = null,
            [FromQuery] string? search = null,
            [FromQuery] long? userId = null,
            CancellationToken cancellationToken = default)
        {
            long resolvedUserId = ResolveUserId(userId);
            if (resolvedUserId <= 0)
            {
                return Unauthorized(ApiResponse<List<MySalesListItemDto>>.Fail("Unable to determine authenticated user. Please login or provide userId."));
            }

            var filters = new MySalesFilterQueryDto
            {
                BuyerCategory = !string.IsNullOrWhiteSpace(buyerCategory) ? buyerCategory : category,
                CropName = !string.IsNullOrWhiteSpace(crop) ? crop : cropId,
                Status = status,
                OtpStatus = otpStatus,
                Search = search,
                UserId = resolvedUserId
            };

            var result = await _mySalesService.GetMySalesListAsync(resolvedUserId, filters, cancellationToken);
            if (!result.Success)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }

        /// <summary>
        /// Retrieves complete details of a specific sale transaction for the 'Details' popup modal.
        /// </summary>
        [HttpGet("{id:long}")]
        [HttpGet("/api/v1/farmer/sales/{id:long}")]
        [AllowAnonymous]
        [ProducesResponseType(typeof(ApiResponse<MySalesListItemDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<MySalesListItemDto>), StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetSaleById(
            [FromRoute] long id,
            [FromQuery] long? userId = null,
            CancellationToken cancellationToken = default)
        {
            long resolvedUserId = ResolveUserId(userId);
            if (resolvedUserId <= 0)
            {
                return Unauthorized(ApiResponse<MySalesListItemDto>.Fail("Unable to determine authenticated user. Please login or provide userId."));
            }

            var result = await _mySalesService.GetMySaleByIdAsync(resolvedUserId, id, cancellationToken);
            if (!result.Success)
            {
                return NotFound(result);
            }

            return Ok(result);
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

            return 0;
        }
    }
}

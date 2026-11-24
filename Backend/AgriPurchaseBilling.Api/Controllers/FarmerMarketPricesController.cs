using System.Collections.Generic;
using System.Linq;
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
    /// APIs dedicated to the "Daily Mandi Market Prices" page:
    /// - State Filter dropdown options ("All States (AP & TG)", "Andhra Pradesh Mandis", "Telangana APMCs")
    /// - Commodity prices data table with state, search, and category filtering
    /// - Interactive "View Chart" trend modal with recent 6-day price movement
    /// </summary>
    [ApiController]
    [Route("api/v1/farmer/market-prices")]
    [Produces("application/json")]
    public class FarmerMarketPricesController : ControllerBase
    {
        private readonly IFarmerMarketPriceService _priceService;

        public FarmerMarketPricesController(IFarmerMarketPriceService priceService)
        {
            _priceService = priceService;
        }

        /// <summary>
        /// Retrieves the list of states for the State Filter dropdown (e.g. All States (AP &amp; TG), Andhra Pradesh, Telangana).
        /// </summary>
        [HttpGet("states")]
        [AllowAnonymous]
        [ProducesResponseType(typeof(ApiResponse<List<MarketPriceStateOptionDto>>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetStates(CancellationToken ct = default)
        {
            var result = await _priceService.GetStatesAsync(ct);
            return Ok(result);
        }

        /// <summary>
        /// Retrieves all commodity prices across regional APMC yards and wholesale mandis.
        /// Supports filtering by state (e.g. 'Andhra Pradesh', 'Telangana', 'All') and text search (crop, market, location).
        /// </summary>
        [HttpGet]
        [AllowAnonymous]
        [ProducesResponseType(typeof(ApiResponse<List<FarmerMarketPriceItemDto>>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetMarketPrices(
            [FromQuery] FarmerMarketPriceFilterDto filters,
            CancellationToken ct = default)
        {
            var result = await _priceService.GetMarketPricesAsync(filters, ct);
            return Ok(result);
        }

        /// <summary>
        /// Powers the "View Chart" modal: returns today's rate, average range, daily trend, and recent 6-day price movement trend.
        /// Supports commodity code (e.g. 'MP-01', 'MP-02') or numeric ID.
        /// </summary>
        [HttpGet("{id}/chart")]
        [AllowAnonymous]
        [ProducesResponseType(typeof(ApiResponse<FarmerMarketPriceChartDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<FarmerMarketPriceChartDto>), StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetChart(
            [FromRoute] string id,
            CancellationToken ct = default)
        {
            var result = await _priceService.GetChartAsync(id, ct);
            if (!result.Success)
            {
                return NotFound(result);
            }

            return Ok(result);
        }

        /// <summary>
        /// Retrieves details of a specific mandi market price commodity by ID or code.
        /// </summary>
        [HttpGet("{id}")]
        [AllowAnonymous]
        [ProducesResponseType(typeof(ApiResponse<FarmerMarketPriceItemDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<FarmerMarketPriceItemDto>), StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetById(
            [FromRoute] string id,
            CancellationToken ct = default)
        {
            var prices = await _priceService.GetMarketPricesAsync(new FarmerMarketPriceFilterDto(), ct);
            var item = prices.Data?.FirstOrDefault(p => p.Id.Equals(id, System.StringComparison.OrdinalIgnoreCase) || p.NumericId.ToString() == id);

            if (item == null)
            {
                return NotFound(ApiResponse<FarmerMarketPriceItemDto>.Fail($"Market price item '{id}' not found."));
            }

            return Ok(ApiResponse<FarmerMarketPriceItemDto>.Ok(item, "Market price details retrieved successfully."));
        }
    }
}

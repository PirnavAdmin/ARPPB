using System;
using System.Collections.Generic;
using System.Linq;
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
    [ApiController]
    [Authorize]
    [Route("api/v1/farmer/crops")]
    [Produces("application/json")]
    public class FarmerCropsController : ControllerBase
    {
        private readonly IFarmerCropService _cropService;

        public FarmerCropsController(IFarmerCropService cropService)
        {
            _cropService = cropService;
        }

        /// <summary>
        /// Retrieves all crops registered by the authenticated farmer with optional filtering by Category, Season, and Search.
        /// </summary>
        [HttpGet]
        [Authorize(Roles = "Farmer,Admin")]
        [ProducesResponseType(typeof(ApiResponse<List<CropResponseDto>>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<List<CropResponseDto>>), StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> GetCrops(
            [FromQuery] string? category = null,
            [FromQuery] string? season = null,
            [FromQuery] string? search = null,
            [FromQuery] long? userId = null,
            CancellationToken cancellationToken = default)
        {
            long resolvedUserId = ResolveUserId(userId);
            if (resolvedUserId <= 0)
            {
                return Unauthorized(ApiResponse<List<CropResponseDto>>.Fail("Unable to determine authenticated user."));
            }

            var result = await _cropService.GetFarmerCropsAsync(resolvedUserId, category, season, search, cancellationToken);
            if (!result.Success)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }

        /// <summary>
        /// Retrieves crop form options (categories, seasons, grades, units) for populating frontend dropdowns.
        /// </summary>
        [HttpGet("options")]
        [AllowAnonymous]
        [ProducesResponseType(typeof(ApiResponse<CropOptionsDto>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetOptions(CancellationToken cancellationToken = default)
        {
            var result = await _cropService.GetOptionsAsync(cancellationToken);
            return Ok(result);
        }

        /// <summary>
        /// Retrieves details of a specific registered crop by ID.
        /// </summary>
        [HttpGet("{id:long}")]
        [Authorize(Roles = "Farmer,Admin")]
        [ProducesResponseType(typeof(ApiResponse<CropResponseDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<CropResponseDto>), StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetCropById(
            [FromRoute] long id,
            [FromQuery] long? userId = null,
            CancellationToken cancellationToken = default)
        {
            long resolvedUserId = ResolveUserId(userId);
            if (resolvedUserId <= 0)
            {
                return Unauthorized(ApiResponse<CropResponseDto>.Fail("Unable to determine authenticated user."));
            }

            var result = await _cropService.GetCropByIdAsync(resolvedUserId, id, cancellationToken);
            if (!result.Success)
            {
                return NotFound(result);
            }

            return Ok(result);
        }

        /// <summary>
        /// Registers a new crop yield entry for the authenticated farmer.
        /// </summary>
        [HttpPost]
        [Authorize(Roles = "Farmer")]
        [ProducesResponseType(typeof(ApiResponse<CropResponseDto>), StatusCodes.Status201Created)]
        [ProducesResponseType(typeof(ApiResponse<CropResponseDto>), StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> RegisterCrop(
            [FromBody] CreateCropRequestDto request,
            [FromQuery] long? userId = null,
            CancellationToken cancellationToken = default)
        {
            if (!ModelState.IsValid)
            {
                var errors = string.Join("; ", ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage));
                return BadRequest(ApiResponse<CropResponseDto>.Fail(errors));
            }

            long resolvedUserId = ResolveUserId(userId);
            if (resolvedUserId <= 0)
            {
                return Unauthorized(ApiResponse<CropResponseDto>.Fail("Unable to determine authenticated user."));
            }

            var result = await _cropService.RegisterCropAsync(resolvedUserId, request, cancellationToken);
            if (!result.Success)
            {
                return BadRequest(result);
            }

            return StatusCode(StatusCodes.Status201Created, result);
        }

        /// <summary>
        /// Updates an existing registered crop's details.
        /// </summary>
        [HttpPut("{id:long}")]
        [Authorize(Roles = "Farmer")]
        [ProducesResponseType(typeof(ApiResponse<CropResponseDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<CropResponseDto>), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ApiResponse<CropResponseDto>), StatusCodes.Status404NotFound)]
        public async Task<IActionResult> UpdateCrop(
            [FromRoute] long id,
            [FromBody] UpdateCropRequestDto request,
            [FromQuery] long? userId = null,
            CancellationToken cancellationToken = default)
        {
            if (!ModelState.IsValid)
            {
                var errors = string.Join("; ", ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage));
                return BadRequest(ApiResponse<CropResponseDto>.Fail(errors));
            }

            long resolvedUserId = ResolveUserId(userId);
            if (resolvedUserId <= 0)
            {
                return Unauthorized(ApiResponse<CropResponseDto>.Fail("Unable to determine authenticated user."));
            }

            var result = await _cropService.UpdateCropAsync(resolvedUserId, id, request, cancellationToken);
            if (!result.Success)
            {
                if (result.Message.Contains("not found", StringComparison.OrdinalIgnoreCase))
                {
                    return NotFound(result);
                }
                return BadRequest(result);
            }

            return Ok(result);
        }

        /// <summary>
        /// Adds newly harvested yield quantity to available crop stock ("+ Stock" modal).
        /// </summary>
        [HttpPatch("{id:long}/add-stock")]
        [Authorize(Roles = "Farmer")]
        [ProducesResponseType(typeof(ApiResponse<CropResponseDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<CropResponseDto>), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ApiResponse<CropResponseDto>), StatusCodes.Status404NotFound)]
        public async Task<IActionResult> AddHarvestYield(
            [FromRoute] long id,
            [FromBody] AddCropYieldRequestDto request,
            [FromQuery] long? userId = null,
            CancellationToken cancellationToken = default)
        {
            if (!ModelState.IsValid)
            {
                var errors = string.Join("; ", ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage));
                return BadRequest(ApiResponse<CropResponseDto>.Fail(errors));
            }

            long resolvedUserId = ResolveUserId(userId);
            if (resolvedUserId <= 0)
            {
                return Unauthorized(ApiResponse<CropResponseDto>.Fail("Unable to determine authenticated user."));
            }

            var result = await _cropService.AddCropYieldAsync(resolvedUserId, id, request, cancellationToken);
            if (!result.Success)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }

        /// <summary>
        /// Soft deletes a registered crop from the farmer's inventory.
        /// </summary>
        [HttpDelete("{id:long}")]
        [Authorize(Roles = "Farmer")]
        [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status404NotFound)]
        public async Task<IActionResult> DeleteCrop(
            [FromRoute] long id,
            [FromQuery] long? userId = null,
            CancellationToken cancellationToken = default)
        {
            long resolvedUserId = ResolveUserId(userId);
            if (resolvedUserId <= 0)
            {
                return Unauthorized(ApiResponse<bool>.Fail("Unable to determine authenticated user."));
            }

            var result = await _cropService.DeleteCropAsync(resolvedUserId, id, cancellationToken);
            if (!result.Success)
            {
                return NotFound(result);
            }

            return Ok(result);
        }

        private long ResolveUserId(long? queryUserId)
        {
            if (queryUserId.HasValue && queryUserId.Value > 0)
            {
                return queryUserId.Value;
            }

            if (User?.Identity?.IsAuthenticated == true)
            {
                var idClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                           ?? User.FindFirst("id")?.Value
                           ?? User.FindFirst("userId")?.Value
                           ?? User.FindFirst("sub")?.Value;

                if (!string.IsNullOrEmpty(idClaim) && long.TryParse(idClaim, out var authUserId))
                {
                    return authUserId;
                }
            }

            return 0;
        }
    }
}

using System.Security.Claims;
using AgriPurchaseBilling.Application.DTOs;
using AgriPurchaseBilling.Application.DTOs.VendorOperations;
using AgriPurchaseBilling.Application.Interfaces;
using AgriPurchaseBilling.Application.Interfaces.VendorPortal;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace AgriPurchaseBilling.Api.Controllers
{
    [ApiController]
    [Authorize(Roles = "Vendor")]
    [Route("api/v1/vendor/partners/customers")]
    [Route("api/v1/vendor/customers")]
    [Produces("application/json")]
    public sealed class VendorCustomersController : ControllerBase
    {
        private readonly IVendorPartnersService _partnersService;
        private readonly IVendorResolver _vendorResolver;

        public VendorCustomersController(IVendorPartnersService partnersService, IVendorResolver vendorResolver)
        {
            _partnersService = partnersService;
            _vendorResolver = vendorResolver;
        }

        private async Task<long> ResolveVendorIdAsync(CancellationToken cancellationToken)
        {
            var value = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (long.TryParse(value, out var userId) && userId > 0)
            {
                return await _vendorResolver.GetVendorIdAsync(userId, cancellationToken);
            }
            return 1;
        }

        [HttpGet("overview")]
        [ProducesResponseType(typeof(ApiResponse<VendorCustomersOverviewDto>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetOverview(CancellationToken cancellationToken)
        {
            var vendorId = await ResolveVendorIdAsync(cancellationToken);
            var overview = await _partnersService.GetCustomersOverviewAsync(vendorId, cancellationToken);
            return Ok(ApiResponse<VendorCustomersOverviewDto>.Ok(overview, "Customers overview retrieved successfully."));
        }

        [HttpGet]
        [ProducesResponseType(typeof(ApiResponse<List<VendorCustomerSummaryDto>>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetCustomers(
            [FromQuery] string? search = null,
            [FromQuery] string? district = null,
            [FromQuery] string? state = null,
            [FromQuery] string? status = null,
            CancellationToken cancellationToken = default)
        {
            var vendorId = await ResolveVendorIdAsync(cancellationToken);
            var customers = await _partnersService.GetCustomersAsync(
                vendorId, search, district, state, status, cancellationToken);
            return Ok(ApiResponse<List<VendorCustomerSummaryDto>>.Ok(customers, "Customers list retrieved successfully."));
        }

        [HttpGet("{customerId}")]
        [ProducesResponseType(typeof(ApiResponse<VendorCustomerDetailDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<VendorCustomerDetailDto>), StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetCustomerById(string customerId, CancellationToken cancellationToken)
        {
            var vendorId = await ResolveVendorIdAsync(cancellationToken);
            var customer = await _partnersService.GetCustomerByIdAsync(vendorId, customerId, cancellationToken);
            return customer == null
                ? NotFound(ApiResponse<VendorCustomerDetailDto>.Fail("Customer not found."))
                : Ok(ApiResponse<VendorCustomerDetailDto>.Ok(customer, "Customer details retrieved successfully."));
        }

        [HttpPost]
        [ProducesResponseType(typeof(ApiResponse<VendorCustomerDetailDto>), StatusCodes.Status201Created)]
        [ProducesResponseType(typeof(ApiResponse<VendorCustomerDetailDto>), StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> CreateCustomer(
            [FromBody] CreateVendorCustomerRequest request,
            CancellationToken cancellationToken)
        {
            var vendorId = await ResolveVendorIdAsync(cancellationToken);
            var created = await _partnersService.CreateCustomerAsync(vendorId, request, cancellationToken);
            return CreatedAtAction(nameof(GetCustomerById), new { customerId = created.CustomerCode },
                ApiResponse<VendorCustomerDetailDto>.Ok(created, "Customer registered successfully."));
        }

        [HttpPut("{customerId}")]
        [ProducesResponseType(typeof(ApiResponse<VendorCustomerDetailDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<VendorCustomerDetailDto>), StatusCodes.Status404NotFound)]
        public async Task<IActionResult> UpdateCustomer(
            string customerId,
            [FromBody] UpdateVendorCustomerRequest request,
            CancellationToken cancellationToken)
        {
            var vendorId = await ResolveVendorIdAsync(cancellationToken);
            var updated = await _partnersService.UpdateCustomerAsync(vendorId, customerId, request, cancellationToken);
            return updated == null
                ? NotFound(ApiResponse<VendorCustomerDetailDto>.Fail("Customer not found."))
                : Ok(ApiResponse<VendorCustomerDetailDto>.Ok(updated, "Customer profile updated successfully."));
        }

        [HttpPatch("{customerId}/status")]
        [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status404NotFound)]
        public async Task<IActionResult> ToggleStatus(string customerId, CancellationToken cancellationToken)
        {
            var vendorId = await ResolveVendorIdAsync(cancellationToken);
            var success = await _partnersService.ToggleCustomerStatusAsync(vendorId, customerId, cancellationToken);
            return success
                ? Ok(ApiResponse<bool>.Ok(true, "Customer status toggled successfully."))
                : NotFound(ApiResponse<bool>.Fail("Customer not found."));
        }

        [HttpGet("export")]
        public async Task<IActionResult> ExportCsv(CancellationToken cancellationToken)
        {
            var vendorId = await ResolveVendorIdAsync(cancellationToken);
            var csvBytes = await _partnersService.ExportCustomersCsvAsync(vendorId, cancellationToken);
            return File(csvBytes, "text/csv", $"customers-directory-{DateTime.UtcNow:yyyyMMdd}.csv");
        }
    }
}

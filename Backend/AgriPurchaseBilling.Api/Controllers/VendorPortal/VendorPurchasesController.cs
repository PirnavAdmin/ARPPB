using System.Threading;
using System.Threading.Tasks;
using AgriPurchaseBilling.Application.DTOs.VendorPortal;
using AgriPurchaseBilling.Application.Interfaces.VendorPortal;
using Microsoft.AspNetCore.Mvc;

namespace AgriPurchaseBilling.Api.Controllers.VendorPortal
{
    /// <summary>Vendor Purchases &amp; Raw Material Procurement Management API.</summary>
    [Route("api/v1/vendor/purchases")]
    [Route("api/v1/vendor/procurement")]
    public sealed class VendorPurchasesController : VendorPortalControllerBase
    {
        private readonly IVendorPurchasesRepository _purchases;

        public VendorPurchasesController(
            IVendorResolver resolver,
            IVendorPurchasesRepository purchases) : base(resolver)
        {
            _purchases = purchases;
        }

        /// <summary>Procurement summary KPI statistics (Farmer &amp; Middleman totals, spend, qty).</summary>
        [HttpGet("summary")]
        public async Task<IActionResult> GetSummary(CancellationToken ct) =>
            Success(await _purchases.GetSummaryAsync(await VendorIdAsync(ct), ct));

        /// <summary>Unified paginated list of purchases from Farmers and Middlemen.</summary>
        [HttpGet]
        public async Task<IActionResult> GetPurchases([FromQuery] PurchasesQuery query, CancellationToken ct) =>
            Success(await _purchases.GetPurchasesAsync(await VendorIdAsync(ct), query, ct));

        /// <summary>Get a single purchase invoice/order by ID or purchase code (e.g. PUR-F-XXXX).</summary>
        [HttpGet("{id}")]
        public async Task<IActionResult> GetPurchaseById(
            string id,
            [FromQuery] string supplierCategory = "Farmer",
            CancellationToken ct = default)
        {
            var purchase = await _purchases.GetPurchaseByIdAsync(await VendorIdAsync(ct), id, supplierCategory, ct);
            return purchase == null ? NotFoundResponse("Purchase record not found.") : Success(purchase);
        }

        /// <summary>Create a new purchase order from a Farmer or Middleman.</summary>
        [HttpPost]
        public async Task<IActionResult> CreatePurchase([FromBody] CreateVendorPurchaseRequest request, CancellationToken ct)
        {
            var created = await _purchases.CreatePurchaseAsync(await VendorIdAsync(ct), request, ct);
            return Success(created, "Purchase created successfully.");
        }

        /// <summary>Update payment status or due amount of a purchase order.</summary>
        [HttpPatch("{id}/status")]
        public async Task<IActionResult> UpdatePurchaseStatus(
            string id,
            [FromQuery] string supplierCategory,
            [FromBody] UpdateVendorPurchaseStatusRequest request,
            CancellationToken ct)
        {
            var updated = await _purchases.UpdatePurchaseStatusAsync(await VendorIdAsync(ct), id, supplierCategory, request, ct);
            return Success(updated, "Purchase status updated successfully.");
        }

        /// <summary>Export purchases to CSV.</summary>
        [HttpGet("export")]
        public async Task<IActionResult> ExportPurchases([FromQuery] PurchasesQuery query, CancellationToken ct)
        {
            var bytes = await _purchases.ExportPurchasesCsvAsync(await VendorIdAsync(ct), query, ct);
            return File(bytes, "text/csv", $"vendor_purchases_{System.DateTime.UtcNow:yyyyMMdd_HHmmss}.csv");
        }
    }
}

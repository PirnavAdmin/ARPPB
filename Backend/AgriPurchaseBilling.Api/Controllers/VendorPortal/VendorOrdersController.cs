using AgriPurchaseBilling.Application.DTOs.VendorPortal;
using AgriPurchaseBilling.Application.Interfaces.VendorPortal;
using Microsoft.AspNetCore.Mvc;

namespace AgriPurchaseBilling.Api.Controllers.VendorPortal
{
    /// <summary>"Customer Orders &amp; Fulfilment Pipeline" screen. Orders are created from the Sell Products screen.</summary>
    [Route("api/v1/vendor/orders")]
    public sealed class VendorOrdersController : VendorPortalControllerBase
    {
        private readonly IVendorOrdersRepository _orders;
        private readonly IVendorSalesRepository _sales;

        public VendorOrdersController(
            IVendorResolver resolver,
            IVendorOrdersRepository orders,
            IVendorSalesRepository sales) : base(resolver)
        {
            _orders = orders;
            _sales = sales;
        }

        /// <summary>Pipeline KPI cards and status-tab counts.</summary>
        [HttpGet("summary")]
        public async Task<IActionResult> GetSummary(CancellationToken ct) =>
            Success(await _orders.GetSummaryAsync(await VendorIdAsync(ct), ct));

        /// <summary>Orders table: search (order/sales id, customer, product), status tab, OTP/payment filters, date range.</summary>
        [HttpGet]
        public async Task<IActionResult> GetOrders([FromQuery] SalesQuery query, CancellationToken ct) =>
            Success(await _sales.GetSalesAsync(await VendorIdAsync(ct), "orders", query, ct));

        /// <summary>Order details with product lines (the "Manage" button).</summary>
        [HttpGet("{id:long}")]
        public async Task<IActionResult> GetOrder(long id, CancellationToken ct)
        {
            var order = await _sales.GetSaleAsync(await VendorIdAsync(ct), id, "orders", ct);
            return order is null ? NotFoundResponse("Order not found.") : Success(order);
        }

        /// <summary>
        /// Moves the order to its next stage (Confirmed → Processing → Packed → Shipped → Delivered → Completed).
        /// A "New" order must have its customer OTP verified first.
        /// </summary>
        [HttpPut("{id:long}/status")]
        public async Task<IActionResult> UpdateStatus(long id, [FromBody] UpdateOrderStatusRequest request, CancellationToken ct) =>
            Success(await _orders.UpdateStatusAsync(await VendorIdAsync(ct), id, request.Status, ct), "Order status updated.");

        /// <summary>Cancels an order that is still New/Confirmed/Processing/Packed and has no payments; restores stock.</summary>
        [HttpPost("{id:long}/cancel")]
        public async Task<IActionResult> Cancel(long id, [FromBody] CancelOrderRequest request, CancellationToken ct) =>
            Success(await _orders.CancelAsync(await VendorIdAsync(ct), id, request.Reason, ct), "Order cancelled.");
    }
}

using AgriPurchaseBilling.Application.DTOs.VendorPortal;
using AgriPurchaseBilling.Application.Interfaces.VendorPortal;
using Microsoft.AspNetCore.Mvc;

namespace AgriPurchaseBilling.Api.Controllers.VendorPortal
{
    /// <summary>
    /// "Customer Orders &amp; Fulfilment Pipeline" screen. Orders are created from the Sell Products screen
    /// (the "Create New Order" button simply opens that screen, so it has no API of its own).
    /// </summary>
    [Route("api/v1/vendor/orders")]
    public sealed class VendorOrdersController : VendorPortalControllerBase
    {
        private const string CsvFileName = "Vendor_Customer_Orders.csv";
        private const int AllOrdersPageSize = 200;

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

        /// <summary>
        /// The status tabs (with counts) and every dropdown of the screen: date ranges, the customers that have orders
        /// with this vendor, OTP status and payment status. Each option's <c>value</c> is the matching query parameter.
        /// </summary>
        [HttpGet("filters")]
        public async Task<IActionResult> GetFilters(CancellationToken ct) =>
            Success(await _orders.GetFilterOptionsAsync(await VendorIdAsync(ct), ct));

        /// <summary>
        /// Orders table: search (order/sales id, customer, product), status tab, OTP / payment filters
        /// (Pending, Verified, Cancelled / Pending, Partial, Paid, Unpaid), customer (customerUserId or customerCode)
        /// and date range (datePreset: Today, Yesterday, Last 7 Days, This Month, Last Month; or from/to).
        /// Unless pageSize is given, up to 200 orders are returned so the screen can page and filter them itself.
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetOrders([FromQuery] SalesQuery query, CancellationToken ct)
        {
            // Query keys are case-insensitive.
            if (!Request.Query.ContainsKey("pageSize"))
            {
                query.PageSize = AllOrdersPageSize;
            }

            var vendorId = await VendorIdAsync(ct);
            var page = await _sales.GetSalesAsync(vendorId, "orders", query, ct);
            var timeline = await _orders.GetTimelineAsync(vendorId, page.Items.Select(s => s.Id), ct);
            var byOrder = timeline.ToLookup(t => t.OrderId);

            return Success(new PagedResult<OrderDto>
            {
                Total = page.Total,
                Page = page.Page,
                PageSize = page.PageSize,
                Items = page.Items.Select(s => VendorOrderMapper.ToOrder(s, byOrder[s.Id])).ToList()
            });
        }

        /// <summary>
        /// "Export Orders": downloads Vendor_Customer_Orders.csv with the 13 screen columns for every order
        /// matching the same filters as the table (no paging).
        /// </summary>
        [HttpGet("export")]
        public async Task<IActionResult> Export([FromQuery] SalesQuery query, CancellationToken ct)
        {
            var rows = await _orders.GetExportRowsAsync(await VendorIdAsync(ct), query, ct);
            return File(VendorOrderMapper.ToCsv(rows), "text/csv; charset=utf-8", CsvFileName);
        }

        /// <summary>"Print": header, totals and register rows for the printable Customer Orders register.</summary>
        [HttpGet("print")]
        public async Task<IActionResult> Print([FromQuery] SalesQuery query, CancellationToken ct)
        {
            var vendorId = await VendorIdAsync(ct);
            var rows = await _orders.GetExportRowsAsync(vendorId, query, ct);
            var summary = await _orders.GetSummaryAsync(vendorId, ct);
            return Success(VendorOrderMapper.ToPrint(rows, summary, query.Status, DateTime.UtcNow));
        }

        /// <summary>Order details with product lines and status history (the "Manage" button).</summary>
        [HttpGet("{id:long}")]
        public async Task<IActionResult> GetOrder(long id, CancellationToken ct)
        {
            var vendorId = await VendorIdAsync(ct);
            var sale = await _sales.GetSaleAsync(vendorId, id, "orders", ct);
            return sale is null ? NotFoundResponse("Order not found.") : Success(await ToOrderAsync(vendorId, sale, ct));
        }

        /// <summary>
        /// Moves the order to its next stage (Confirmed → Processing → Packed → Shipped → Delivered → Completed).
        /// A "New" order must have its customer OTP verified first.
        /// </summary>
        [HttpPut("{id:long}/status")]
        public async Task<IActionResult> UpdateStatus(long id, [FromBody] UpdateOrderStatusRequest request, CancellationToken ct)
        {
            var vendorId = await VendorIdAsync(ct);
            var sale = await _orders.UpdateStatusAsync(vendorId, id, request.Status, ct);
            return Success(await ToOrderAsync(vendorId, sale, ct), "Order status updated.");
        }

        /// <summary>Cancels an order that is still New/Confirmed/Processing/Packed and has no payments; restores stock.</summary>
        [HttpPost("{id:long}/cancel")]
        public async Task<IActionResult> Cancel(long id, [FromBody] CancelOrderRequest request, CancellationToken ct)
        {
            var vendorId = await VendorIdAsync(ct);
            var sale = await _orders.CancelAsync(vendorId, id, request.Reason, ct);
            return Success(await ToOrderAsync(vendorId, sale, ct), "Order cancelled.");
        }

        private async Task<OrderDto> ToOrderAsync(long vendorId, SaleDto sale, CancellationToken ct) =>
            VendorOrderMapper.ToOrder(sale, await _orders.GetTimelineAsync(vendorId, new[] { sale.Id }, ct));
    }
}

using System.Security.Claims;
using AgriPurchaseBilling.Application.DTOs;
using AgriPurchaseBilling.Application.Interfaces.VendorPortal;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace AgriPurchaseBilling.Api.Controllers.VendorPortal
{
    /// <summary>Maps business errors raised by the stored procedures (404 / 409 / 400 ...) to ApiResponse bodies.</summary>
    public sealed class VendorPortalExceptionFilter : IExceptionFilter
    {
        public void OnException(ExceptionContext context)
        {
            if (context.Exception is not VendorPortalException ex) return;

            context.Result = new ObjectResult(ApiResponse<object>.Fail(ex.Message)) { StatusCode = ex.StatusCode };
            context.ExceptionHandled = true;
        }
    }

    [ApiController]
    [Authorize(Roles = "Vendor")]
    [Produces("application/json")]
    [ServiceFilter(typeof(VendorPortalExceptionFilter))]
    public abstract class VendorPortalControllerBase : ControllerBase
    {
        private readonly IVendorResolver _vendorResolver;

        protected VendorPortalControllerBase(IVendorResolver vendorResolver)
        {
            _vendorResolver = vendorResolver;
        }

        /// <summary>Vendors.Id of the logged-in vendor user.</summary>
        protected async Task<long> VendorIdAsync(CancellationToken ct)
        {
            if (!long.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var userId))
                throw new VendorPortalException(401, "Invalid user token.");

            return await _vendorResolver.GetVendorIdAsync(userId, ct);
        }

        protected IActionResult Success<T>(T data, string message = "Success", string? devOtp = null)
        {
            var response = ApiResponse<T>.Ok(data, message);
            response.DevOtp = devOtp;
            return Ok(response);
        }

        protected IActionResult NotFoundResponse(string message) =>
            NotFound(ApiResponse<object>.Fail(message));
    }
}

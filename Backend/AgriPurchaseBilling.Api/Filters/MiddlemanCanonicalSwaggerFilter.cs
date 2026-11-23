using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.OpenApi.Models;
using Swashbuckle.AspNetCore.SwaggerGen;

namespace AgriPurchaseBilling.Api.Filters
{
    /// <summary>
    /// Swashbuckle DocumentFilter to keep Swagger UI clean and unified:
    /// Displays only the canonical primary endpoints for each Middleman module,
    /// hiding route aliases from Swagger while keeping them fully functional at runtime.
    /// </summary>
    public class MiddlemanCanonicalSwaggerFilter : IDocumentFilter
    {
        private static readonly string[] HiddenPrefixes = new[]
        {
            "/api/v1/middleman/otp-confirmations",
            "/api/v1/middleman/otp",
            "/api/v1/middleman/my-ledger",
            "/api/v1/middleman/sales-history",
            "/api/v1/middleman/sales-order-history",
            "/api/v1/middleman/sales/vendors",
            "/api/v1/middleman/sales-to-vendors",
            "/api/v1/middleman/vendor-sales-history",
            "/api/v1/middleman/sales/customers",
            "/api/v1/middleman/sales-to-customers",
            "/api/v1/middleman/customer-sales-history",
            "/api/v1/middleman/purchase-history",
            "/api/v1/middleman/purchase-from-farmers",
            "/api/v1/middleman/farmer-management",
            "/api/v1/middleman/vendor-management",
            "/api/v1/middleman/customer-management",
            "/api/v1/middleman/my-inventory",
            "/api/v1/middleman-notifications",
            "/api/v1/notifications",
            "/api/v1/middleman-profile"
        };

        public void Apply(OpenApiDocument swaggerDoc, DocumentFilterContext context)
        {
            if (swaggerDoc?.Paths == null) return;

            var pathsToRemove = swaggerDoc.Paths.Keys
                .Where(path =>
                {
                    foreach (var prefix in HiddenPrefixes)
                    {
                        if (path.Equals(prefix, StringComparison.OrdinalIgnoreCase) ||
                            path.StartsWith(prefix + "/", StringComparison.OrdinalIgnoreCase))
                        {
                            return true;
                        }
                    }
                    return false;
                })
                .ToList();

            foreach (var path in pathsToRemove)
            {
                swaggerDoc.Paths.Remove(path);
            }
        }
    }
}

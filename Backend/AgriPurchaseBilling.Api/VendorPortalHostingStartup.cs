using AgriPurchaseBilling.Api;
using AgriPurchaseBilling.Api.Controllers.VendorPortal;
using AgriPurchaseBilling.Infrastructure.Configuration;
using Microsoft.AspNetCore.Hosting;

[assembly: HostingStartup(typeof(VendorPortalHostingStartup))]

namespace AgriPurchaseBilling.Api
{
    /// <summary>
    /// Registers the vendor-portal services (Sales, Orders, OTP Confirmations, Ledger, Notifications)
    /// automatically at startup, so Program.cs does not need to change.
    /// </summary>
    public sealed class VendorPortalHostingStartup : IHostingStartup
    {
        public void Configure(IWebHostBuilder builder)
        {
            builder.ConfigureServices(services =>
            {
                services.AddVendorPortalModule();
                services.AddScoped<VendorPortalExceptionFilter>();
            });
        }
    }
}

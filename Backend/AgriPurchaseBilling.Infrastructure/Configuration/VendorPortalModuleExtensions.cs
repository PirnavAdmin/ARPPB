using AgriPurchaseBilling.Application.Interfaces.VendorPortal;
using AgriPurchaseBilling.Application.Security;
using AgriPurchaseBilling.Infrastructure.Data;
using AgriPurchaseBilling.Infrastructure.Repositories;
using Microsoft.Extensions.DependencyInjection;

namespace AgriPurchaseBilling.Infrastructure.Configuration
{
    /// <summary>Registers the vendor-portal modules: Sales, Orders, OTP Confirmations, Ledger and Notifications.</summary>
    public static class VendorPortalModuleExtensions
    {
        public static IServiceCollection AddVendorPortalModule(this IServiceCollection services)
        {
            services.AddSingleton<VendorPortalDb>();
            services.AddSingleton<IVendorOtpGenerator, VendorOtpGenerator>();

            services.AddScoped<IVendorResolver, VendorResolver>();
            services.AddScoped<IVendorSalesRepository, VendorSalesRepository>();
            services.AddScoped<IVendorOrdersRepository, VendorOrdersRepository>();
            services.AddScoped<IVendorConfirmationsRepository, VendorConfirmationsRepository>();
            services.AddScoped<IVendorLedgerRepository, VendorLedgerRepository>();
            services.AddScoped<IVendorNotificationsRepository, VendorNotificationsRepository>();
            return services;
        }
    }
}

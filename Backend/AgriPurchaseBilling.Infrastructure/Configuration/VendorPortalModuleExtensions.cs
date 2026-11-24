using AgriPurchaseBilling.Application.Interfaces.VendorPortal;
using AgriPurchaseBilling.Application.Security;
using AgriPurchaseBilling.Infrastructure.Data;
using AgriPurchaseBilling.Infrastructure.Repositories;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace AgriPurchaseBilling.Infrastructure.Configuration
{
    /// <summary>Registers the vendor-portal modules: Sales, Orders, OTP Confirmations, Ledger and Notifications.</summary>
    public static class VendorPortalModuleExtensions
    {
        public static IServiceCollection AddVendorPortalModule(this IServiceCollection services)
        {
            services.TryAddSingleton<VendorPortalDb>();
            services.TryAddSingleton<IVendorOtpGenerator, VendorOtpGenerator>();

            services.TryAddScoped<IVendorResolver, VendorResolver>();
            services.TryAddScoped<IVendorSalesRepository, VendorSalesRepository>();
            services.TryAddScoped<IVendorOrdersRepository, VendorOrdersRepository>();
            services.TryAddScoped<IVendorConfirmationsRepository, VendorConfirmationsRepository>();
            services.TryAddScoped<IVendorLedgerRepository, VendorLedgerRepository>();
            services.TryAddScoped<IVendorNotificationsRepository, VendorNotificationsRepository>();
            services.TryAddScoped<AgriPurchaseBilling.Application.Interfaces.IVendorProfileExtrasRepository, VendorProfileExtrasRepository>();
            services.TryAddScoped<IVendorPurchasesRepository, VendorPurchasesRepository>();
            return services;
        }
    }
}

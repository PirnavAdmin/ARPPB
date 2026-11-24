using AgriPurchaseBilling.Application.Interfaces;
using AgriPurchaseBilling.Infrastructure.Data;
using AgriPurchaseBilling.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace AgriPurchaseBilling.Infrastructure.Configuration
{
    public static class VendorOperationsModuleExtensions
    {
        public static IServiceCollection AddVendorOperationsModule(this IServiceCollection services, string connectionString)
        {
            var serverVersion = new MariaDbServerVersion(new Version(11, 8, 9));

            services.AddDbContext<VendorOperationsDbContext>(options =>
                options.UseMySql(
                    connectionString,
                    serverVersion,
                    mySqlOptions => mySqlOptions.EnableRetryOnFailure(
                        maxRetryCount: 3,
                        maxRetryDelay: TimeSpan.FromSeconds(5),
                        errorNumbersToAdd: null)));

            services.AddScoped<IVendorPartnersService, VendorPartnersService>();
            services.AddScoped<IVendorInventoryProcessingService, VendorInventoryProcessingService>();
            services.AddScoped<IVendorDashboardService, VendorDashboardService>();

            return services;
        }
    }
}

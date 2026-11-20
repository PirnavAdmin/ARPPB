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
            services.AddDbContext<VendorOperationsDbContext>(options =>
                options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString)));

            services.AddScoped<IVendorPartnersService, VendorPartnersService>();
            services.AddScoped<IVendorInventoryProcessingService, VendorInventoryProcessingService>();
            services.AddScoped<IVendorDashboardService, VendorDashboardService>();

            return services;
        }
    }
}

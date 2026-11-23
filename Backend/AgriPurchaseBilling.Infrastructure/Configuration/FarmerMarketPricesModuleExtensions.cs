using AgriPurchaseBilling.Application.Interfaces;
using AgriPurchaseBilling.Application.Services;
using AgriPurchaseBilling.Infrastructure.Repositories;
using Microsoft.Extensions.DependencyInjection;

namespace AgriPurchaseBilling.Infrastructure.Configuration
{
    public static class FarmerMarketPricesModuleExtensions
    {
        public static IServiceCollection AddFarmerMarketPricesModule(this IServiceCollection services)
        {
            services.AddScoped<IFarmerMarketPriceRepository, FarmerMarketPriceRepository>();
            services.AddScoped<IFarmerMarketPriceService, FarmerMarketPriceService>();

            return services;
        }
    }
}

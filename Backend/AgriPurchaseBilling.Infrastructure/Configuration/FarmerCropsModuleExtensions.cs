using AgriPurchaseBilling.Application.Interfaces;
using AgriPurchaseBilling.Application.Services;
using AgriPurchaseBilling.Infrastructure.Repositories;
using Microsoft.Extensions.DependencyInjection;

namespace AgriPurchaseBilling.Infrastructure.Configuration
{
    public static class FarmerCropsModuleExtensions
    {
        public static IServiceCollection AddFarmerCropsModule(this IServiceCollection services)
        {
            services.AddScoped<IFarmerCropRepository, FarmerCropRepository>();
            services.AddScoped<IFarmerCropService, FarmerCropService>();
            return services;
        }
    }
}

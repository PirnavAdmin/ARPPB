using AgriPurchaseBilling.Application.Interfaces;
using AgriPurchaseBilling.Application.Services;
using AgriPurchaseBilling.Infrastructure.Repositories;
using Microsoft.Extensions.DependencyInjection;

namespace AgriPurchaseBilling.Infrastructure.Configuration
{
    public static class FarmerNotificationsModuleExtensions
    {
        public static IServiceCollection AddFarmerNotificationsModule(this IServiceCollection services)
        {
            services.AddScoped<IFarmerNotificationRepository, FarmerNotificationRepository>();
            services.AddScoped<IFarmerNotificationService, FarmerNotificationService>();

            return services;
        }
    }
}

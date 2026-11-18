using AgriPurchaseBilling.Application.Interfaces;
using AgriPurchaseBilling.Application.Services;
using AgriPurchaseBilling.Infrastructure.Repositories;
using Microsoft.Extensions.DependencyInjection;

namespace AgriPurchaseBilling.Infrastructure.Configuration
{
    public static class CustomerProfileModuleExtensions
    {
        public static IServiceCollection AddCustomerProfileModule(this IServiceCollection services, string? connectionString = null)
        {
            services.AddScoped<ICustomerProfileRepository, CustomerProfileRepository>();
            services.AddScoped<ICustomerProfileService, CustomerProfileService>();
            return services;
        }
    }
}

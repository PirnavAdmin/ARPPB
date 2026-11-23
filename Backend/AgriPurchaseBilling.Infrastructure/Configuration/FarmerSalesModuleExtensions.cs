using AgriPurchaseBilling.Application.Interfaces;
using AgriPurchaseBilling.Application.Services;
using AgriPurchaseBilling.Infrastructure.Repositories;
using Microsoft.Extensions.DependencyInjection;

namespace AgriPurchaseBilling.Infrastructure.Configuration
{
    public static class FarmerSalesModuleExtensions
    {
        public static IServiceCollection AddFarmerSalesModule(this IServiceCollection services)
        {
            // Sell Products Module
            services.AddScoped<IFarmerSellProductRepository, FarmerSellProductRepository>();
            services.AddScoped<IFarmerSellProductService, FarmerSellProductService>();

            // My Sales & Transactions Module
            services.AddScoped<IFarmerMySalesRepository, FarmerMySalesRepository>();
            services.AddScoped<IFarmerMySalesService, FarmerMySalesService>();

            // OTP Confirmations & Transaction Security Module
            services.AddScoped<IFarmerOtpConfirmationRepository, FarmerOtpConfirmationRepository>();
            services.AddScoped<IFarmerOtpConfirmationService, FarmerOtpConfirmationService>();

            return services;
        }
    }
}

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

        public static async System.Threading.Tasks.Task EnsureFarmerSalesTablesAsync(this Microsoft.AspNetCore.Builder.IApplicationBuilder app)
        {
            using var scope = app.ApplicationServices.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<AgriPurchaseBilling.Infrastructure.Data.AppDbContext>();
            var logger = scope.ServiceProvider.GetService<Microsoft.Extensions.Logging.ILogger<AgriPurchaseBilling.Infrastructure.Data.AppDbContext>>();

            try
            {
                const string createSellProductsSql = @"
CREATE TABLE IF NOT EXISTS `farmer_sell_products` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `sale_code` VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `farmer_id` BIGINT NOT NULL,
    `crop_id` BIGINT NOT NULL,
    `buyer_category` VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `buyer_name` VARCHAR(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `buyer_mobile` VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `crop_name` VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `crop_variety` VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `quality_grade` VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
    `selling_quantity` DECIMAL(12, 2) NOT NULL,
    `unit` VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Quintals',
    `price_per_unit` DECIMAL(12, 2) NOT NULL,
    `total_amount` DECIMAL(14, 2) NOT NULL,
    `pickup_location` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `expected_pickup_date` DATETIME NOT NULL,
    `notes` TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
    `status` VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Pending OTP Confirmation',
    `otp_code` VARCHAR(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
    `otp_status` VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Pending',
    `otp_expires_at` DATETIME NULL,
    `confirmed_at` DATETIME NULL,
    `is_active` TINYINT(1) NOT NULL DEFAULT 1,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `ux_farmer_sell_products_code` (`sale_code`),
    KEY `ix_farmer_sell_products_farmer` (`farmer_id`),
    KEY `ix_farmer_sell_products_crop` (`crop_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;";

                const string createMySalesSql = @"
CREATE TABLE IF NOT EXISTS `farmer_my_sales` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `sell_product_id` BIGINT NULL,
    `sale_code` VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `farmer_id` BIGINT NOT NULL,
    `crop_id` BIGINT NOT NULL,
    `crop_name` VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `crop_variety` VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `quality_grade` VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
    `buyer_category` VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `buyer_name` VARCHAR(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `buyer_mobile` VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `quantity_dispatched` DECIMAL(12, 2) NOT NULL,
    `unit` VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Quintals',
    `selling_rate` DECIMAL(12, 2) NOT NULL,
    `total_revenue` DECIMAL(14, 2) NOT NULL,
    `status` VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Confirmed',
    `payment_status` VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Pending',
    `delivery_status` VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Scheduled',
    `pickup_location` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `expected_payment_date` DATETIME NULL,
    `confirmed_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `notes` TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
    `is_active` TINYINT(1) NOT NULL DEFAULT 1,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `ux_farmer_my_sales_code` (`sale_code`),
    KEY `ix_farmer_my_sales_farmer` (`farmer_id`),
    KEY `ix_farmer_my_sales_crop` (`crop_id`),
    KEY `ix_farmer_my_sales_sell_id` (`sell_product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;";

                await Microsoft.EntityFrameworkCore.RelationalDatabaseFacadeExtensions.ExecuteSqlRawAsync(context.Database, createSellProductsSql);
                await Microsoft.EntityFrameworkCore.RelationalDatabaseFacadeExtensions.ExecuteSqlRawAsync(context.Database, createMySalesSql);
            }
            catch (System.Exception ex)
            {
                System.Console.WriteLine($"[FarmerSales] Table init check: {ex.Message}");
            }
        }
    }
}

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

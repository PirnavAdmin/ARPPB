using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using AgriPurchaseBilling.Application.DTOs.VendorOperations;

namespace AgriPurchaseBilling.Application.Interfaces
{
    public interface IVendorPartnersService
    {
        // Farmers
        Task<VendorFarmersOverviewDto> GetFarmersOverviewAsync(long vendorId, CancellationToken cancellationToken = default);
        Task<List<VendorFarmerSummaryDto>> GetFarmersAsync(long vendorId, string? search, string? district, string? state, string? crop, string? status, CancellationToken cancellationToken = default);
        Task<VendorFarmerDetailDto?> GetFarmerByIdAsync(long vendorId, string farmerCodeOrId, CancellationToken cancellationToken = default);
        Task<VendorFarmerDetailDto> CreateFarmerAsync(long vendorId, CreateVendorFarmerRequest request, CancellationToken cancellationToken = default);
        Task<VendorFarmerDetailDto?> UpdateFarmerAsync(long vendorId, string farmerCodeOrId, UpdateVendorFarmerRequest request, CancellationToken cancellationToken = default);
        Task<bool> ToggleFarmerStatusAsync(long vendorId, string farmerCodeOrId, CancellationToken cancellationToken = default);
        Task<List<VendorFarmerTransactionDto>> GetFarmerTransactionsAsync(long vendorId, string farmerCodeOrId, CancellationToken cancellationToken = default);
        Task<List<VendorFarmerPaymentDto>> GetFarmerPaymentsAsync(long vendorId, string farmerCodeOrId, CancellationToken cancellationToken = default);
        Task<List<VendorFarmerOtpLogDto>> GetFarmerOtpLogsAsync(long vendorId, string farmerCodeOrId, CancellationToken cancellationToken = default);
        Task<byte[]> ExportFarmersCsvAsync(long vendorId, CancellationToken cancellationToken = default);

        // Middlemen
        Task<VendorMiddlemenOverviewDto> GetMiddlemenOverviewAsync(long vendorId, CancellationToken cancellationToken = default);
        Task<List<VendorMiddlemanSummaryDto>> GetMiddlemenAsync(long vendorId, string? search, string? district, string? state, string? status, CancellationToken cancellationToken = default);
        Task<VendorMiddlemanDetailDto?> GetMiddlemanByIdAsync(long vendorId, string middlemanCodeOrId, CancellationToken cancellationToken = default);
        Task<VendorMiddlemanDetailDto> CreateMiddlemanAsync(long vendorId, CreateVendorMiddlemanRequest request, CancellationToken cancellationToken = default);
        Task<VendorMiddlemanDetailDto?> UpdateMiddlemanAsync(long vendorId, string middlemanCodeOrId, UpdateVendorMiddlemanRequest request, CancellationToken cancellationToken = default);
        Task<bool> ToggleMiddlemanStatusAsync(long vendorId, string middlemanCodeOrId, CancellationToken cancellationToken = default);
        Task<List<VendorMiddlemanTransactionDto>> GetMiddlemanTransactionsAsync(long vendorId, string middlemanCodeOrId, CancellationToken cancellationToken = default);
        Task<List<VendorMiddlemanPaymentDto>> GetMiddlemanPaymentsAsync(long vendorId, string middlemanCodeOrId, CancellationToken cancellationToken = default);
        Task<List<VendorMiddlemanOtpLogDto>> GetMiddlemanOtpLogsAsync(long vendorId, string middlemanCodeOrId, CancellationToken cancellationToken = default);
        Task<byte[]> ExportMiddlemenCsvAsync(long vendorId, CancellationToken cancellationToken = default);

        // Customers
        Task<VendorCustomersOverviewDto> GetCustomersOverviewAsync(long vendorId, CancellationToken cancellationToken = default);
        Task<List<VendorCustomerSummaryDto>> GetCustomersAsync(long vendorId, string? search, string? district, string? state, string? status, CancellationToken cancellationToken = default);
        Task<VendorCustomerDetailDto?> GetCustomerByIdAsync(long vendorId, string customerCodeOrId, CancellationToken cancellationToken = default);
        Task<VendorCustomerDetailDto> CreateCustomerAsync(long vendorId, CreateVendorCustomerRequest request, CancellationToken cancellationToken = default);
        Task<VendorCustomerDetailDto?> UpdateCustomerAsync(long vendorId, string customerCodeOrId, UpdateVendorCustomerRequest request, CancellationToken cancellationToken = default);
        Task<bool> ToggleCustomerStatusAsync(long vendorId, string customerCodeOrId, CancellationToken cancellationToken = default);
        Task<byte[]> ExportCustomersCsvAsync(long vendorId, CancellationToken cancellationToken = default);
    }
}

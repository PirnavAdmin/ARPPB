using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using AgriPurchaseBilling.Application.DTOs.VendorOperations;

namespace AgriPurchaseBilling.Application.Interfaces
{
    public interface IVendorInventoryProcessingService
    {
        // Raw Material Inventory
        Task<VendorRawMaterialOverviewDto> GetRawMaterialOverviewAsync(long vendorId, CancellationToken cancellationToken = default);
        Task<List<VendorRawMaterialStockDto>> GetRawMaterialStocksAsync(long vendorId, string? search, string? crop, string? supplierType, string? grade, string? stockStatus, CancellationToken cancellationToken = default);
        Task<VendorRawMaterialStockDto?> GetRawMaterialStockByIdAsync(long vendorId, string stockCodeOrId, CancellationToken cancellationToken = default);
        Task<VendorRawMaterialStockDto> CreateRawMaterialStockAsync(long vendorId, CreateRawMaterialStockRequest request, CancellationToken cancellationToken = default);
        Task<List<VendorStockMovementDto>> GetStockMovementsAsync(long vendorId, CancellationToken cancellationToken = default);
        Task<byte[]> ExportRawMaterialsCsvAsync(long vendorId, CancellationToken cancellationToken = default);

        // Product Processing
        Task<VendorProcessingOverviewDto> GetProcessingOverviewAsync(long vendorId, CancellationToken cancellationToken = default);
        Task<List<VendorProcessingBatchDto>> GetProcessingBatchesAsync(long vendorId, string? search, string? rawMaterial, string? status, CancellationToken cancellationToken = default);
        Task<VendorProcessingBatchDto?> GetProcessingBatchByIdAsync(long vendorId, string processingCodeOrId, CancellationToken cancellationToken = default);
        Task<VendorProcessingBatchDto> CreateProcessingBatchAsync(long vendorId, CreateProcessingBatchRequest request, CancellationToken cancellationToken = default);
        Task<byte[]> ExportProcessingBatchesCsvAsync(long vendorId, CancellationToken cancellationToken = default);

        // Finished Products Inventory
        Task<VendorFinishedProductsOverviewDto> GetFinishedProductsOverviewAsync(long vendorId, CancellationToken cancellationToken = default);
        Task<List<VendorFinishedProductDto>> GetFinishedProductsAsync(long vendorId, string? search, string? category, string? sourceRawMaterial, string? status, CancellationToken cancellationToken = default);
        Task<VendorFinishedProductDto?> GetFinishedProductByIdAsync(long vendorId, string productCodeOrId, CancellationToken cancellationToken = default);
        Task<VendorFinishedProductDto> CreateFinishedProductAsync(long vendorId, CreateFinishedProductRequest request, CancellationToken cancellationToken = default);
        Task<VendorFinishedProductDto?> UpdateFinishedProductAsync(long vendorId, string productCodeOrId, UpdateFinishedProductRequest request, CancellationToken cancellationToken = default);
        Task<bool> AdjustFinishedProductStockAsync(long vendorId, string productCodeOrId, AdjustFinishedProductStockRequest request, CancellationToken cancellationToken = default);
        Task<List<VendorFinishedProductMovementDto>> GetFinishedProductMovementsAsync(long vendorId, string productCodeOrId, CancellationToken cancellationToken = default);
        Task<bool> ToggleFinishedProductStatusAsync(long vendorId, string productCodeOrId, CancellationToken cancellationToken = default);
        Task<byte[]> ExportFinishedProductsCsvAsync(long vendorId, CancellationToken cancellationToken = default);
    }
}

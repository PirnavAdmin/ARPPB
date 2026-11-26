using AgriPurchaseBilling.Application.DTOs;

namespace AgriPurchaseBilling.Application.Interfaces
{
    public interface ICustomerMarketplaceService
    {
        Task<ApiResponse<List<CustomerMarketplaceCategoryDto>>> GetCategoriesAsync(
            CancellationToken cancellationToken = default);

        Task<ApiResponse<CustomerMarketplacePagedProductsDto>> GetProductsAsync(
            CustomerMarketplaceProductQueryDto query,
            CancellationToken cancellationToken = default);

        Task<ApiResponse<CustomerMarketplaceProductDetailDto>> GetProductByIdAsync(
            long productId,
            CancellationToken cancellationToken = default);
    }
}


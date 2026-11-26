using AgriPurchaseBilling.Application.DTOs;

namespace AgriPurchaseBilling.Application.Interfaces
{
    public interface ICustomerMarketplaceRepository
    {
        Task<List<CustomerMarketplaceCategoryDto>> GetCategoriesAsync(
            CancellationToken cancellationToken = default);

        Task<CustomerMarketplacePagedProductsDto> GetProductsAsync(
            CustomerMarketplaceProductQueryDto query,
            CancellationToken cancellationToken = default);

        Task<CustomerMarketplaceProductDetailDto?> GetProductByIdAsync(
            long productId,
            CancellationToken cancellationToken = default);
    }
}

